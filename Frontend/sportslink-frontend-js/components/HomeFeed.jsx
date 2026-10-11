"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, ArrowUpRight, Bookmark, CalendarDays, Image as ImageIcon, MessageCircle, MoreHorizontal, Repeat2, Send, Sparkles, ThumbsUp, Trash2, Trophy, Users, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { backendRequest } from "@/lib/api/backend";

const USE_SPRING_API = process.env.NEXT_PUBLIC_USE_SPRING_API === "true";

const POST_SELECT = "id,author_id,content,visibility,created_at,author:profiles!posts_author_id_fkey(id,username,full_name,headline,avatar_url,sport,role),media:post_media(id,media_url,media_type,created_at)";

function Avatar({ url, name }) {
  if (url) return <img className="avatar avatar-md" src={url} alt=""/>;
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SL";
  return <span className="avatar avatar-md avatar-initials" aria-hidden="true">{initials}</span>;
}

async function loadPostInteractions(client, postIds) {
  const ids = [...new Set(postIds)].filter(Boolean);
  if (!ids.length) return { reactionsByPost: new Map(), commentsByPost: new Map() };

  const [reactionResult, commentResult] = await Promise.all([
    client.from("post_reactions")
      .select("post_id,user_id,reaction,created_at")
      .in("post_id", ids)
      .order("created_at", { ascending: true }),
    client.from("comments")
      .select("id,post_id,author_id,content,created_at,author:profiles!comments_author_id_fkey(id,username,full_name,avatar_url)")
      .in("post_id", ids)
      .order("created_at", { ascending: true })
      .limit(1000),
  ]);

  if (reactionResult.error) throw reactionResult.error;
  if (commentResult.error) throw commentResult.error;

  const reactionsByPost = new Map(ids.map((id) => [id, []]));
  const commentsByPost = new Map(ids.map((id) => [id, []]));
  for (const row of reactionResult.data || []) {
    if (reactionsByPost.has(row.post_id)) reactionsByPost.get(row.post_id).push(row);
  }
  for (const row of commentResult.data || []) {
    if (commentsByPost.has(row.post_id)) commentsByPost.get(row.post_id).push(row);
  }
  return { reactionsByPost, commentsByPost };
}

function attachPostInteractions(posts, interactionData) {
  return posts.map((post) => ({
    ...post,
    reactions: interactionData.reactionsByPost.get(post.id) || [],
    comments: interactionData.commentsByPost.get(post.id) || [],
  }));
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

  const basePosts = result.data || [];
  const interactionData = await loadPostInteractions(client, basePosts.map((post) => post.id));
  const enrichedPosts = attachPostInteractions(basePosts, interactionData);
  const mediaPaths = [...new Set(enrichedPosts.flatMap((post) =>
    (post.media || []).map((media) => media.media_url).filter(Boolean)
  ))];
  let signedByPath = new Map();
  if (mediaPaths.length) {
    const { data: signedFiles } = await client.storage.from("post-media").createSignedUrls(mediaPaths, 3600);
    signedByPath = new Map((signedFiles || []).filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl]));
  }
  const data = enrichedPosts.map((post) => ({
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
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [openCommentPosts, setOpenCommentPosts] = useState({});
  const [commentSubmitting, setCommentSubmitting] = useState({});
  const [commentDeleteSubmitting, setCommentDeleteSubmitting] = useState({});
  const [reactionSubmitting, setReactionSubmitting] = useState({});
  const [interactionErrors, setInteractionErrors] = useState({});
  const [deleteSubmitting, setDeleteSubmitting] = useState({});
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const composerRef = useRef(null);
  const composerTextareaRef = useRef(null);
  const commentInputRefs = useRef({});
  const router = useRouter();

  useEffect(() => {
    function focusComposer() {
      composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.requestAnimationFrame(() => composerTextareaRef.current?.focus({ preventScroll: true }));
    }
    window.addEventListener("sportslink:compose", focusComposer);
    const params = new URLSearchParams(window.location.search);
    if (params.get("compose") === "1") window.requestAnimationFrame(focusComposer);
    return () => window.removeEventListener("sportslink:compose", focusComposer);
  }, []);

  useEffect(() => {
    const previews = selectedMedia.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setMediaPreviews(previews);
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [selectedMedia]);

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

  async function deletePost(post) {
    if (!supabase || !currentUser || post.author_id !== currentUser.id) {
      setInteractionErrors((current) => ({ ...current, [post.id]: "You can only delete posts created by your account." }));
      return;
    }
    if (!window.confirm("Delete this post? This also removes its comments and reactions. This cannot be undone.")) return;

    setDeleteSubmitting((current) => ({ ...current, [post.id]: true }));
    setInteractionErrors((current) => ({ ...current, [post.id]: "" }));
    setNotice("");
    try {
      const { data: mediaRows, error: mediaQueryError } = await supabase
        .from("post_media")
        .select("media_url")
        .eq("post_id", post.id);
      if (mediaQueryError) throw mediaQueryError;

      // Supabase Row Level Security independently enforces posts_delete_self.
      const { data: deletedRows, error: deleteError } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id)
        .eq("author_id", currentUser.id)
        .select("id");
      if (deleteError) throw deleteError;
      if (!deletedRows?.length) throw new Error("This post was not deleted. You can only delete your own posts.");

      setPosts((current) => current.filter((item) => item.id !== post.id));
      setNotice("Your post was deleted.");

      const mediaPaths = [...new Set((mediaRows || []).map((item) => item.media_url).filter(Boolean))];
      if (mediaPaths.length) {
        const { error: storageError } = await supabase.storage.from("post-media").remove(mediaPaths);
        if (storageError) {
          console.warn("Post deleted but attached storage media could not be cleaned up.", storageError);
          setNotice("Your post was deleted, but one or more media files could not be cleaned up.");
        }
      }
    } catch (error) {
      setInteractionErrors((current) => ({ ...current, [post.id]: getErrorMessage(error, "Unable to delete your post.") }));
    } finally {
      setDeleteSubmitting((current) => ({ ...current, [post.id]: false }));
    }
  }

  async function refreshPostInteractions(postId) {
    if (!supabase) return;
    const interactionData = await loadPostInteractions(supabase, [postId]);
    setPosts((current) => current.map((post) => post.id === postId
      ? attachPostInteractions([post], interactionData)[0]
      : post));
  }

  async function toggleLike(post) {
    if (!supabase || !currentUser) {
      setInteractionErrors((current) => ({ ...current, [post.id]: "Sign in to react to posts." }));
      return;
    }
    setInteractionErrors((current) => ({ ...current, [post.id]: "" }));
    setReactionSubmitting((current) => ({ ...current, [post.id]: true }));
    try {
      const existingLike = (post.reactions || []).find((reaction) => reaction.user_id === currentUser.id);
      if (existingLike?.reaction === "like") {
        const { error } = await supabase.from("post_reactions")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("post_reactions")
          .upsert({ post_id: post.id, user_id: currentUser.id, reaction: "like" }, { onConflict: "post_id,user_id" });
        if (error) throw error;
      }
      await refreshPostInteractions(post.id);
    } catch (error) {
      setInteractionErrors((current) => ({ ...current, [post.id]: getErrorMessage(error, "Unable to save your reaction.") }));
    } finally {
      setReactionSubmitting((current) => ({ ...current, [post.id]: false }));
    }
  }

  function toggleComments(postId) {
    const willOpen = !openCommentPosts[postId];
    setOpenCommentPosts((current) => ({ ...current, [postId]: willOpen }));
    if (willOpen) {
      window.requestAnimationFrame(() => {
        const input = commentInputRefs.current[postId];
        input?.focus({ preventScroll: true });
        input?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }

  async function submitComment(post, event) {
    event.preventDefault();
    if (!supabase || !currentUser) {
      setInteractionErrors((current) => ({ ...current, [post.id]: "Sign in to comment." }));
      return;
    }
    const content = (commentDrafts[post.id] || "").trim();
    if (!content) return;
    if (content.length > 2000) {
      setInteractionErrors((current) => ({ ...current, [post.id]: "Comments can be up to 2,000 characters." }));
      return;
    }

    setInteractionErrors((current) => ({ ...current, [post.id]: "" }));
    setCommentSubmitting((current) => ({ ...current, [post.id]: true }));
    try {
      const { data, error } = await supabase.from("comments").insert({
        post_id: post.id,
        author_id: currentUser.id,
        content,
      }).select("id,post_id,author_id,content,created_at,author:profiles!comments_author_id_fkey(id,username,full_name,avatar_url)").single();
      if (error) throw error;
      setPosts((current) => current.map((item) => item.id === post.id
        ? { ...item, comments: [...(item.comments || []), data] }
        : item));
      setCommentDrafts((current) => ({ ...current, [post.id]: "" }));
    } catch (error) {
      setInteractionErrors((current) => ({ ...current, [post.id]: getErrorMessage(error, "Unable to add your comment.") }));
    } finally {
      setCommentSubmitting((current) => ({ ...current, [post.id]: false }));
    }
  }

  async function deleteComment(post, comment) {
    if (!supabase || !currentUser || comment.author_id !== currentUser.id) {
      setInteractionErrors((current) => ({ ...current, [post.id]: "You can only delete comments created by your account." }));
      return;
    }
    if (!window.confirm("Delete this comment? This cannot be undone.")) return;

    setCommentDeleteSubmitting((current) => ({ ...current, [comment.id]: true }));
    setInteractionErrors((current) => ({ ...current, [post.id]: "" }));
    try {
      // The comments_delete_self row-level security policy independently limits deletion to the author.
      const { data: deletedRows, error: deleteError } = await supabase
        .from("comments")
        .delete()
        .eq("id", comment.id)
        .eq("author_id", currentUser.id)
        .select("id");
      if (deleteError) throw deleteError;
      if (!deletedRows?.length) throw new Error("This comment was not deleted. You can only delete your own comments.");

      setPosts((current) => current.map((item) => item.id === post.id
        ? { ...item, comments: (item.comments || []).filter((existing) => existing.id !== comment.id) }
        : item));
    } catch (error) {
      setInteractionErrors((current) => ({ ...current, [post.id]: getErrorMessage(error, "Unable to delete your comment.") }));
    } finally {
      setCommentDeleteSubmitting((current) => ({ ...current, [comment.id]: false }));
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
    <section ref={composerRef} className="composer card"><input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleMediaSelection} style={{ display: "none" }} aria-label="Choose photos"/><input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" multiple onChange={handleMediaSelection} style={{ display: "none" }} aria-label="Choose videos"/><div className="composer-top"><Avatar url={currentUser?.avatar} name={currentUser?.name || "SPORTSLINK Member"}/><textarea ref={composerTextareaRef} value={draft} onChange={event => { setDraft(event.target.value); setSubmitError(""); setNotice(""); }} placeholder="Share an update with your sports community…" aria-label="Write a community post" maxLength={5000} rows={2}/></div>{selectedMedia.length>0&&<div style={{display:"grid",gap:10,padding:"0 16px 14px"}}><strong>Preview attachments ({selectedMedia.length}/5)</strong><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>{mediaPreviews.map((preview,index)=><div key={preview.url} style={{position:"relative",minWidth:0,border:"1px solid var(--border,#e2e8f0)",borderRadius:12,overflow:"hidden",background:"var(--surface-muted,#f8fafc)"}}>{preview.file.type.startsWith("video/")?<video src={preview.url} controls preload="metadata" style={{width:"100%",height:150,objectFit:"contain",display:"block",background:"#0b1220"}}/>:<img src={preview.url} alt={preview.file.name} style={{width:"100%",height:150,objectFit:"cover",display:"block"}}/>}<div style={{padding:8,display:"flex",gap:8,alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{preview.file.name}</span><button className="button button-secondary" style={{padding:"4px 8px",fontSize:12}} type="button" onClick={()=>setSelectedMedia(current=>current.filter((_,i)=>i!==index))}>Remove</button></div></div>)}</div><small>Private uploads · up to 50 MB each. Previews are local until you publish.</small></div>}{submitError&&<p className="auth-error" role="alert">{submitError}</p>}{notice&&<p className="inline-notice" role="status" aria-live="polite">{notice}</p>}<div className="composer-bottom"><span className="character-count" aria-live="polite">{draft.length}/5000</span><div className="composer-tools"><button type="button" onClick={()=>photoInputRef.current?.click()}><ImageIcon/>Photo</button><button type="button" onClick={()=>videoInputRef.current?.click()}><Video/>Video</button><button type="button" onClick={()=>router.push("/events")}><CalendarDays/>Event</button></div><button className="button button-primary" type="button" onClick={createPost} disabled={submitting}>{submitting?"Posting…":<>＋ Create post</>}</button></div></section>
    <div className="feed-toolbar"><div><h2>Community feed</h2><p>What’s happening across your network</p></div><div className="feed-filters"><button className="filter-active" type="button">For you</button><button type="button" disabled title="Following posts are not connected yet">Following</button><button type="button" disabled title="Trending is not connected yet">Trending</button></div></div>
    {feedError&&<div className="inline-notice" role="alert"><p>{feedError}</p><button className="button button-secondary" type="button" onClick={retryFeed} disabled={loading}>{loading?"Loading…":"Retry"}</button></div>}
    {loading?<div className="empty-state card" role="status"><Activity/><h3>Loading the community feed…</h3></div>:feedError?null:posts.length===0?<div className="empty-state card"><Users/><h3>No posts yet</h3><p>Be the first to share an update with your sports community.</p></div>:<div className="posts-list">{posts.map(post=>{
      const author = post.author || {};
      const authorName = author.full_name || author.username || "SPORTSLINK Member";
      const authorRole = author.headline || [author.sport, author.role].filter(Boolean).join(" · ") || "SPORTSLINK Member";
      return <article className="post-card card" key={post.id} id={`post-${post.id}`}><div className="post-head">{author.id ? <Link href={`/members/${encodeURIComponent(author.id)}`} className="post-avatar-link" aria-label={`View ${authorName}'s profile`}><Avatar url={author.avatar_url} name={authorName}/></Link> : <Avatar url={author.avatar_url} name={authorName}/>}<div className="post-author"><div className="author-name">{author.id ? <Link href={`/members/${encodeURIComponent(author.id)}`} className="author-profile-link">{authorName}</Link> : authorName}</div><p>{authorRole}</p><span>{formatPostTime(post.created_at)} · {post.visibility === "followers" ? "Followers" : "Public"}</span></div>{post.author_id === currentUser?.id ? <button className="subtle-icon" type="button" aria-label="Delete your post" title="Delete your post" disabled={Boolean(deleteSubmitting[post.id])} onClick={() => deletePost(post)}>{deleteSubmitting[post.id] ? <Activity size={18} className="spin"/> : <Trash2 size={18}/>}</button> : <button className="subtle-icon" type="button" aria-label="More post options" onClick={()=>setNotice("Post reporting and moderation are not connected yet.")}><MoreHorizontal/></button>}</div>{post.content&&<div className="post-copy">{post.content.split("\n").map((line,index)=><p key={`${post.id}-${index}`}>{line || " "}</p>)}</div>}<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginTop:12}}>{(post.media||[]).filter(item=>item.signed_url).map(item=>item.media_type==="video"?<video key={item.id} src={item.signed_url} controls preload="metadata" style={{width:"100%",maxHeight:420,objectFit:"contain",borderRadius:12,background:"#0b1220"}}/>:<img key={item.id} src={item.signed_url} alt="Post attachment" loading="lazy" style={{width:"100%",maxHeight:420,objectFit:"contain",borderRadius:12,background:"#f2f4f8"}} />)}</div><div className="post-reaction-summary"><span>{(post.reactions||[]).length} {(post.reactions||[]).length===1?"reaction":"reactions"} · {(post.comments||[]).length} {(post.comments||[]).length===1?"comment":"comments"}</span></div><div className="post-actions"><button type="button" onClick={()=>toggleLike(post)} disabled={!!reactionSubmitting[post.id]} aria-pressed={(post.reactions||[]).some(reaction=>reaction.user_id===currentUser?.id&&reaction.reaction==="like")} style={{color:(post.reactions||[]).some(reaction=>reaction.user_id===currentUser?.id&&reaction.reaction==="like")?"#2563eb":undefined}}><ThumbsUp/>{reactionSubmitting[post.id]?"Saving…":(post.reactions||[]).some(reaction=>reaction.user_id===currentUser?.id&&reaction.reaction==="like")?"Liked":"Like"}</button><button type="button" onClick={()=>toggleComments(post.id)} aria-expanded={!!openCommentPosts[post.id]} aria-controls={`comments-${post.id}`}><MessageCircle/>{openCommentPosts[post.id]?"Hide comments":"Comment"}</button><button type="button" disabled title="Reposting is not connected yet"><Repeat2/>Repost</button><button type="button" disabled title="Sharing is not connected yet"><Send/>Send</button><button type="button" disabled aria-label="Save post" title="Bookmarks are not connected yet"><Bookmark/></button></div>{interactionErrors[post.id]&&<p className="auth-error comment-error" role="alert">{interactionErrors[post.id]}</p>}{openCommentPosts[post.id]&&<section id={`comments-${post.id}`} className="post-comments" aria-label="Comments"><div className="comment-section-heading"><strong>Comments</strong><span>{(post.comments||[]).length}</span></div><div className="comment-list">{(post.comments||[]).slice(-10).map(comment=>{const author=comment.author||{};const name=author.full_name||author.username||(comment.author_id===currentUser?.id?currentUser?.name:"SPORTSLINK member");const canDelete=comment.author_id===currentUser?.id;return <article key={comment.id} className="comment-item"><Avatar url={author.avatar_url} name={name}/><div className="comment-bubble"><div className="comment-meta"><strong>{comment.author?.id ? <Link href={`/members/${encodeURIComponent(comment.author.id)}`} className="author-profile-link">{name}</Link> : name}</strong><small>{formatPostTime(comment.created_at)}</small>{canDelete&&<button type="button" className="comment-delete" aria-label={`Delete comment by ${name}`} title="Delete your comment" disabled={!!commentDeleteSubmitting[comment.id]} onClick={()=>deleteComment(post,comment)}>{commentDeleteSubmitting[comment.id]?<Activity size={14} className="spin"/>:<Trash2 size={14}/>}</button>}</div><p className="comment-text">{comment.content}</p></div></article>})}</div>{!(post.comments||[]).length&&<p className="comment-empty">No comments yet. Start the conversation.</p>}<form onSubmit={(event)=>submitComment(post,event)} className="comment-form"><input ref={element=>{commentInputRefs.current[post.id]=element;}} value={commentDrafts[post.id]||""} onChange={event=>setCommentDrafts(current=>({...current,[post.id]:event.target.value}))} maxLength={2000} placeholder="Write a comment…" aria-label="Write a comment" /><button className="button button-primary" type="submit" disabled={!!commentSubmitting[post.id]||!(commentDrafts[post.id]||"").trim()}>{commentSubmitting[post.id]?"Sending…":"Comment"}</button></form></section>}</article>;
    })}</div>}
  </div>;
}