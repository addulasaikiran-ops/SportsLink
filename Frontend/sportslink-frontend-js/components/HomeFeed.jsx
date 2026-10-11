"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, ArrowUpRight, Bookmark, CalendarDays, Image as ImageIcon, MessageCircle, MoreHorizontal, Repeat2, Send, Sparkles, ThumbsUp, Trophy, Users, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { backendRequest } from "@/lib/api/backend";

const USE_SPRING_API = process.env.NEXT_PUBLIC_USE_SPRING_API === "true";

const POST_SELECT = "id,author_id,content,visibility,created_at,author:profiles!posts_author_id_fkey(id,username,full_name,headline,avatar_url,sport,role),media:post_media(id,media_url,media_type,created_at)";

function Avatar({ url, name }) {
  if (url) return <img className="avatar avatar-md" src={url} alt=""/>;
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SL";
  return <span className="avatar avatar-md avatar-initials" aria-hidden="true">{initials}</span>;
}

async function queryFeed(client) {
  let result;
  if (USE_SPRING_API) {
    try {
      result = { data: await backendRequest("/api/posts"), error: null };
    } catch (error) {
      return { data: null, error };
    }
  } else {
    result = await client
      .from("posts")
      .select(POST_SELECT)
      .order("created_at", { ascending: false })
      .limit(100);
  }
  if (result.error) return result;

  const mediaPaths = [...new Set((result.data || []).flatMap((post) =>
    (post.media || []).map((media) => media.media_url).filter(Boolean)
  ))];
  let signedByPath = new Map();
  if (mediaPaths.length) {
    const { data: signedFiles } = await client.storage.from("post-media").createSignedUrls(mediaPaths, 3600);
    signedByPath = new Map((signedFiles || []).map((item) => [item.path, item.signedUrl]));
  }
  const data = (result.data || []).map((post) => ({
    ...post,
    media: (post.media || []).map((item) => ({ ...item, signed_url: signedByPath.get(item.media_url) || null })),
  }));
  return { data, error: null };
}

function formatPostTime(value) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "";

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(timestamp);
}

function getErrorMessage(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function HomeFeed() {
  const [supabase, setSupabase] = useState(null);
  const [posts, setPosts] = useState([]);
  const [draft, setDraft] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedMedia, setSelectedMedia] = useState([]);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const router = useRouter();

  function handleMediaSelection(event) {
    const incoming = Array.from(event.target.files || []);
    event.target.value = "";
    if (!incoming.length) return;
    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"]);
    const invalid = incoming.find((file) => !allowed.has(file.type) || file.size > 50 * 1024 * 1024);
    if (invalid) {
      setSubmitError(!allowed.has(invalid.type)
        ? "Use JPEG, PNG, WebP, GIF, MP4, WebM, or QuickTime media."
        : "Each photo or video must be 50 MB or smaller.");
      return;
    }
    if (selectedMedia.length + incoming.length > 5) {
      setSubmitError("Attach up to 5 photos or videos to a post.");
      return;
    }
    setSubmitError("");
    setNotice("");
    setSelectedMedia((current) => [...current, ...incoming]);
  }

  useEffect(() => {
    const client = createClient();
    setSupabase(client);
    let active = true;

    if (!client) {
      setFeedError("Supabase is not configured. Check the local environment configuration.");
      setLoading(false);
      return () => { active = false; };
    }

    async function loadFeed() {
      try {
        const { data, error } = await queryFeed(client);
        if (error) throw error;
        if (active) {
          setPosts(data || []);
          setFeedError("");
        }
      } catch (error) {
        if (active) setFeedError(getErrorMessage(error, "Unable to load the community feed."));
      } finally {
        if (active) setLoading(false);
      }
    }

    async function loadCurrentUser() {
      const { data, error } = await client.auth.getUser();
      if (error || !data.user || !active) return;

      const user = data.user;
      const { data: profile, error: profileError } = await client
        .from("profiles")
        .select("username, full_name, avatar_url, sport")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;
      setCurrentUser({
        name: profileError
          ? user.user_metadata?.full_name || user.email?.split("@")[0] || "SPORTSLINK Member"
          : profile?.full_name || profile?.username || user.user_metadata?.full_name || user.email?.split("@")[0] || "SPORTSLINK Member",
        avatar: profile?.avatar_url || null,
        id: user.id,
        sport: profile?.sport || "",
      });
    }

    loadFeed();
    loadCurrentUser();
    return () => { active = false; };
  }, []);

  async function createPost() {
    const content = draft.trim();
    setSubmitError("");
    setNotice("");

    if (!content && selectedMedia.length === 0) {
      setSubmitError("Write something or attach a photo/video before posting.");
      return;
    }
    if (content.length > 5000) {
      setSubmitError("Posts can be up to 5,000 characters.");
      return;
    }
    if (!supabase) {
      setSubmitError("Supabase is not available. Reload the page and try again.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        setSubmitError("Sign in to create a post.");
        return;
      }

      if (selectedMedia.length > 0) {
        const uploadedPaths = [];
        let createdPostId = null;
        try {
          const mediaRows = [];
          for (const file of selectedMedia) {
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "upload";
            const path = user.id + "/" + crypto.randomUUID() + "-" + safeName;
            const { error: uploadError } = await supabase.storage.from("post-media").upload(path, file, {
              contentType: file.type,
              cacheControl: "3600",
              upsert: false,
            });
            if (uploadError) throw uploadError;
            uploadedPaths.push(path);
            mediaRows.push({ media_url: path, media_type: file.type.startsWith("video/") ? "video" : "image" });
          }

          const { data: createdPost, error: postError } = await supabase
            .from("posts")
            .insert({ author_id: user.id, content, visibility: "public" })
            .select("id")
            .single();
          if (postError) throw postError;
          createdPostId = createdPost.id;

          const { error: mediaInsertError } = await supabase
            .from("post_media")
            .insert(mediaRows.map((row) => ({ ...row, post_id: createdPostId })));
          if (mediaInsertError) throw mediaInsertError;
        } catch (mediaError) {
          if (createdPostId) await supabase.from("posts").delete().eq("id", createdPostId);
          if (uploadedPaths.length) await supabase.storage.from("post-media").remove(uploadedPaths);
          throw mediaError;
        }
      } else if (USE_SPRING_API) {
        await backendRequest("/api/posts", {
          method: "POST",
          body: JSON.stringify({ content, visibility: "public" }),
        });
      } else {
        const { error: insertError } = await supabase.from("posts").insert({
          author_id: user.id,
          content,
          visibility: "public",
        });
        if (insertError) throw insertError;
      }

      setDraft("");
      setSelectedMedia([]);
      const { data, error: refreshError } = await queryFeed(supabase);
      if (refreshError) {
        setFeedError(getErrorMessage(refreshError, "Your post was created, but the feed could not refresh."));
        setNotice("Your post was created, but the feed could not refresh. Retry the feed load.");
        return;
      }

      const refreshedPosts = data || [];
      setPosts(refreshedPosts);
      setFeedError("");
      setNotice(refreshedPosts.some(post => post.author_id === user.id && post.content === content)
        ? "Your post was shared."
        : "Your post was saved, but your current RLS read policy does not show it in this feed.");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to create your post."));
    } finally {
      setSubmitting(false);
    }
  }

  async function retryFeed() {
    if (!supabase) return;
    setLoading(true);
    setFeedError("");
    try {
      const { data, error } = await queryFeed(supabase);
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      setFeedError(getErrorMessage(error, "Unable to load the community feed."));
    } finally {
      setLoading(false);
    }
  }

  return <div className="feed-page">
    <div className="welcome-row"><div><p className="eyebrow"><Sparkles size={14}/> YOUR SPORTS COMMUNITY</p><h1>Your world of sport, <span>connected.</span></h1><p className="welcome-subtitle">Ideas, opportunities, and people moving sport forward.</p></div><div className="welcome-date"><Activity size={13}/> COMMUNITY FEED<small>Good to see you, {currentUser?.name || "SPORTSLINK Member"}</small></div></div>
    <div className="quick-stats"><div className="quick-stat"><span className="stat-icon blue"><Users/></span><span><small>Posts in this feed</small><b>{posts.length}<em>Visible under your RLS access</em></b></span></div><div className="quick-stat"><span className="stat-icon orange"><Trophy/></span><span><small>Your posts</small><b>{posts.filter(post => post.author_id === currentUser?.id).length}<em>Authored by your account</em></b></span></div><div className="quick-stat"><span className="stat-icon green"><ArrowUpRight/></span><span><small>Your sport</small><b>{currentUser?.sport || "—"}<em>From your profile</em></b></span></div></div>
    <section className="composer card"><input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleMediaSelection} style={{ display: "none" }} aria-label="Choose photos"/><input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" multiple onChange={handleMediaSelection} style={{ display: "none" }} aria-label="Choose videos"/><div className="composer-top"><Avatar url={currentUser?.avatar} name={currentUser?.name || "SPORTSLINK Member"}/><textarea value={draft} onChange={event => { setDraft(event.target.value); setSubmitError(""); setNotice(""); }} placeholder="Share an update with your sports community…" aria-label="Write a community post" maxLength={5000} rows={2}/></div>{selectedMedia.length>0&&<div style={{display:"grid",gap:8,padding:"0 16px 12px"}}><strong>Attachments ({selectedMedia.length}/5)</strong>{selectedMedia.map((file,index)=><div key={`${file.name}-${file.lastModified}-${index}`} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}><span>{file.type.startsWith("video/")?"Video":"Photo"} · {file.name}</span><button className="button button-secondary" style={{padding:"5px 10px"}} type="button" onClick={()=>setSelectedMedia(current=>current.filter((_,i)=>i!==index))}>Remove</button></div>)}<small>Private uploads · up to 50 MB each</small></div>}{submitError&&<p className="auth-error" role="alert">{submitError}</p>}{notice&&<p className="inline-notice" role="status" aria-live="polite">{notice}</p>}<div className="composer-bottom"><span className="character-count" aria-live="polite">{draft.length}/5000</span><div className="composer-tools"><button type="button" onClick={()=>photoInputRef.current?.click()}><ImageIcon/>Photo</button><button type="button" onClick={()=>videoInputRef.current?.click()}><Video/>Video</button><button type="button" onClick={()=>router.push("/events")}><CalendarDays/>Event</button></div><button className="button button-primary" type="button" onClick={createPost} disabled={submitting}>{submitting?"Posting…":<>＋ Create post</>}</button></div></section>
    <div className="feed-toolbar"><div><h2>Community feed</h2><p>What’s happening across your network</p></div><div className="feed-filters"><button className="filter-active" type="button">For you</button><button type="button" disabled title="Following posts are not connected yet">Following</button><button type="button" disabled title="Trending is not connected yet">Trending</button></div></div>
    {feedError&&<div className="inline-notice" role="alert"><p>{feedError}</p><button className="button button-secondary" type="button" onClick={retryFeed} disabled={loading}>{loading?"Loading…":"Retry"}</button></div>}
    {loading?<div className="empty-state card" role="status"><Activity/><h3>Loading the community feed…</h3></div>:feedError?null:posts.length===0?<div className="empty-state card"><Users/><h3>No posts yet</h3><p>Be the first to share an update with your sports community.</p></div>:<div className="posts-list">{posts.map(post=>{
      const author = post.author || {};
      const authorName = author.full_name || author.username || "SPORTSLINK Member";
      const authorRole = author.headline || [author.sport, author.role].filter(Boolean).join(" · ") || "SPORTSLINK Member";
      return <article className="post-card card" key={post.id}><div className="post-head"><Avatar url={author.avatar_url} name={authorName}/><div className="post-author"><div className="author-name">{authorName}</div><p>{authorRole}</p><span>{formatPostTime(post.created_at)} · {post.visibility === "followers" ? "Followers" : "Public"}</span></div><button className="subtle-icon" type="button" aria-label="More post options" onClick={()=>setNotice("Post reporting and moderation are not connected yet.")}><MoreHorizontal/></button></div><div className="post-copy">{post.content.split("\n").map((line,index)=><p key={`${post.id}-${index}`}>{line || " "}</p>)}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginTop:12}}>{(post.media||[]).filter(item=>item.signed_url).map(item=>item.media_type==="video"?<video key={item.id} src={item.signed_url} controls preload="metadata" style={{width:"100%",maxHeight:420,objectFit:"contain",borderRadius:12,background:"#0b1220"}}/>:<img key={item.id} src={item.signed_url} alt="Post attachment" loading="lazy" style={{width:"100%",maxHeight:420,objectFit:"contain",borderRadius:12,background:"#f2f4f8"}} />)}</div><div className="post-reaction-summary"><span>Reactions and comments are not connected yet</span></div><div className="post-actions"><button type="button" disabled><ThumbsUp/>Like</button><button type="button" disabled><MessageCircle/>Comment</button><button type="button" disabled><Repeat2/>Repost</button><button type="button" disabled><Send/>Send</button><button type="button" disabled aria-label="Save post"><Bookmark/></button></div></article>;
    })}</div>}
  </div>;
}