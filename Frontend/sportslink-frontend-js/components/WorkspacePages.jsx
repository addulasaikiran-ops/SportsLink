"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Bell, BriefcaseBusiness, Camera, CheckCheck, Heart, ImagePlus, MapPin, MessageCircle, Pencil, Save, Search, Send, PlusCircle, ShieldCheck, Trash2, UserPlus, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { backendRequest } from "@/lib/api/backend";
import { Heading, Notice } from "./shared";

const USE_SPRING_API = process.env.NEXT_PUBLIC_USE_SPRING_API === "true";

function EmptyWorkspacePage({ title, eyebrow, subtitle, icon: Icon, message }) {
  return <div className={`page-stack ${title === "Opportunities" ? "opportunities-page" : ""}`}>
    <Heading eyebrow={eyebrow} title={title} subtitle={subtitle}/>
    <div className="empty-state card"><Icon/><h2>{message}</h2><p>This feature has no connected data source yet. No sample records are shown.</p></div>
  </div>;
}

function ConversationAvatar({ profile, name, size = "avatar-md" }) {
  if (profile?.avatar_url) return <img className={`avatar ${size}`} src={profile.avatar_url} alt="" />;
  const letters = (name || "SPORTSLINK Member").trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SL";
  return <span className={`avatar ${size} avatar-initials`} aria-hidden="true">{letters}</span>;
}

function chatTime(value) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "";
  const age = Math.max(0, Date.now() - timestamp);
  if (age < 24 * 60 * 60 * 1000) {
    return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(timestamp);
  }
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(timestamp);
}

export function MessagesPage() {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [peopleQuery, setPeopleQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [startingId, setStartingId] = useState("");
  const [showPeople, setShowPeople] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const supabase = createClient();
        if (!supabase) throw new Error("Supabase is not configured for this deployment.");
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!data.user) throw new Error("Sign in to exchange messages with SPORTSLINK members.");
        const [profileRows, conversationRows] = await Promise.all([
          backendRequest("/api/profiles"),
          backendRequest("/api/conversations"),
        ]);
        if (!active) return;
        setUser(data.user);
        setProfiles(Array.isArray(profileRows) ? profileRows : []);
        const rows = Array.isArray(conversationRows) ? conversationRows : [];
        setConversations(rows);
        const requested = typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("conversation")
          : null;
        const requestedConversation = rows.find((item) => item.id === requested);
        setActiveConversationId(requestedConversation?.id || rows[0]?.id || "");
        setShowPeople(rows.length === 0);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load your conversations.");
      } finally {
        if (active) setLoading(false);
      }
    }
    initialize();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user?.id) return undefined;
    let active = true;
    const refreshConversationList = async () => {
      try {
        const rows = await backendRequest("/api/conversations");
        if (active && Array.isArray(rows)) {
          setConversations(rows);
          setActiveConversationId((current) => current || rows[0]?.id || "");
        }
      } catch {
        // Keep the current conversation list visible during short network interruptions.
      }
    };
    const timer = setInterval(refreshConversationList, 12000);
    return () => { active = false; clearInterval(timer); };
  }, [user?.id]);

  useEffect(() => {
    if (!activeConversationId || !user?.id) {
      setMessages([]);
      setMessagesLoading(false);
      return undefined;
    }
    let disposed = false;
    let firstLoad = true;
    let knownMessageIds = new Set();
    setMessages([]);
    setMessagesLoading(true);
    const refreshMessages = async () => {
      try {
        const rows = await backendRequest(`/api/conversations/${encodeURIComponent(activeConversationId)}/messages`);
        if (disposed) return;
        const nextRows = Array.isArray(rows) ? rows : [];
        const hasNewIncoming = !firstLoad && nextRows.some((item) =>
          !knownMessageIds.has(item.id) && item.sender_id !== user.id
        );
        knownMessageIds = new Set(nextRows.map((item) => item.id));
        setMessages(nextRows);
        if (firstLoad || hasNewIncoming) {
          backendRequest(`/api/conversations/${encodeURIComponent(activeConversationId)}/read`, { method: "PATCH" }).catch(() => {});
        }
        firstLoad = false;
        setMessagesLoading(false);
        setError("");
      } catch (loadError) {
        if (disposed) return;
        setMessagesLoading(false);
        setError(loadError instanceof Error ? loadError.message : "Unable to load messages for this conversation.");
      }
    };
    refreshMessages();
    const timer = setInterval(refreshMessages, 3000);
    return () => { disposed = true; clearInterval(timer); };
  }, [activeConversationId, user?.id]);

  const activeConversation = conversations.find((item) => item.id === activeConversationId) || null;
  function otherParticipant(conversation) {
    const participants = Array.isArray(conversation?.members) ? conversation.members : [];
    const participant = participants.find((item) => item.user_id !== user?.id) || participants[0];
    const profile = participant?.profile || {};
    const name = profile.full_name || profile.username || (conversation?.is_group ? conversation.title : "") || "SPORTSLINK member";
    return { profile, name };
  }
  const activeContact = otherParticipant(activeConversation);
  const filteredProfiles = profiles.filter((profile) => {
    const normalized = [profile.full_name, profile.username, profile.headline, profile.sport, profile.role]
      .filter(Boolean).join(" ").toLowerCase();
    return normalized.includes(peopleQuery.trim().toLowerCase());
  }).slice(0, 8);

  async function reloadConversations(preferredId) {
    const rows = await backendRequest("/api/conversations");
    const safeRows = Array.isArray(rows) ? rows : [];
    setConversations(safeRows);
    if (preferredId && safeRows.some((item) => item.id === preferredId)) setActiveConversationId(preferredId);
    else setActiveConversationId((current) => safeRows.some((item) => item.id === current) ? current : safeRows[0]?.id || "");
  }

  async function startConversation(profile) {
    if (!profile?.id || startingId) return;
    setStartingId(profile.id);
    setError("");
    setNotice("");
    try {
      const existing = conversations.find((conversation) => {
        if (conversation.is_group) return false;
        const members = Array.isArray(conversation.members) ? conversation.members : [];
        return members.length === 2 && members.some((member) => member.user_id === user?.id)
          && members.some((member) => member.user_id === profile.id);
      });
      if (existing) {
        setActiveConversationId(existing.id);
      } else {
        const created = await backendRequest("/api/conversations", {
          method: "POST",
          body: JSON.stringify({ is_group: false, member_ids: [profile.id] }),
        });
        if (!created?.id) throw new Error("SPORTSLINK did not return the new conversation.");
        await reloadConversations(created.id);
      }
      setShowPeople(false);
      setPeopleQuery("");
      setNotice(`Conversation ready with ${profile.full_name || profile.username || "this member"}.`);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Unable to start this conversation.");
    } finally {
      setStartingId("");
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !activeConversationId || sending) return;
    if (content.length > 5000) {
      setError("Messages must be 5,000 characters or fewer.");
      return;
    }
    setSending(true);
    setError("");
    setNotice("");
    try {
      const created = await backendRequest(
        `/api/conversations/${encodeURIComponent(activeConversationId)}/messages`,
        { method: "POST", body: JSON.stringify({ content }) }
      );
      if (!created?.id) throw new Error("SPORTSLINK did not confirm that your message was saved.");
      setMessages((current) => current.some((item) => item.id === created.id)
        ? current
        : [...current, created].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)));
      setDraft("");
      backendRequest(`/api/conversations/${encodeURIComponent(activeConversationId)}/read`, { method: "PATCH" }).catch(() => {});
      setNotice("Message sent. The recipient will see it in this conversation and their notifications.");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send your message. Please retry.");
    } finally {
      setSending(false);
    }
  }

  const pageHeading = <div className="messages-page-heading">
    <div className="messages-page-heading-copy">
      <p className="eyebrow"><MessageCircle size={15}/> PRIVATE MESSAGING</p>
      <div className="messages-title-row"><h1>Messages</h1><span className="messages-private-pill"><ShieldCheck size={13}/> Private inbox</span></div>
      <p>Connect directly with athletes, coaches, scouts and the people moving sport forward.</p>
    </div>
    <button className="button button-primary messages-new-button" type="button" onClick={() => setShowPeople((value) => !value)}>
      <PlusCircle size={17}/>{showPeople ? "Close member finder" : "New message"}
    </button>
  </div>;

  if (loading) {
    return <div className="page-stack messages-page">{pageHeading}<div className="messages-loading card" role="status"><span className="messages-empty-art"><Activity size={26}/></span><h2>Opening your inbox</h2><p>Loading your conversations and member list…</p></div></div>;
  }

  return <div className="page-stack messages-page">
    {pageHeading}
    {error && <div className="messaging-error" role="alert"><span className="messaging-error-icon"><Activity size={18}/></span><div><b>We couldn’t load your inbox</b><p>{error}</p></div><button className="button button-secondary" type="button" onClick={() => window.location.reload()}>Try again</button></div>}
    {notice && <p className="inline-notice" role="status" aria-live="polite">{notice}</p>}
    <section className="messaging-layout card" aria-label="SPORTSLINK messaging">
      <aside className="conversation-list">
        <div className="conversation-list-head"><div><h2>Your conversations</h2><small>Pick up where you left off</small></div><span className="conversation-total">{conversations.length}</span></div>
        {showPeople && <div style={{padding:"0 12px 12px"}}>
          <label className="search-field" aria-label="Search people to message"><Search size={16}/><input value={peopleQuery} onChange={(event)=>setPeopleQuery(event.target.value)} placeholder="Find a member…" autoComplete="off"/></label>
          <p style={{fontSize:10,color:"var(--muted)",lineHeight:1.5,margin:"9px 2px"}}>Choose a real member to start a private text conversation.</p>
          <div className="conversation-items">{filteredProfiles.map((profile)=>{
            const name=profile.full_name||profile.username||"SPORTSLINK member";
            return <button type="button" key={profile.id} className="conversation-item" onClick={()=>startConversation(profile)} disabled={Boolean(startingId)}>
              <ConversationAvatar profile={profile} name={name}/>
              <span className="conversation-copy"><b>{name}</b><small>{profile.headline||profile.sport||profile.role||"SPORTSLINK member"}{startingId===profile.id?" · Opening…":""}</small></span>
            </button>;
          })}</div>
          {filteredProfiles.length===0&&<p style={{fontSize:11,color:"var(--muted)",padding:"8px"}}>No members match that search.</p>}
        </div>}
        <div className="conversation-items">{conversations.map((conversation)=>{
          const contact=otherParticipant(conversation);
          const memberText=conversation.is_group
            ? (conversation.title||"Group conversation")
            : contact.name;
          return <button type="button" key={conversation.id} className={`conversation-item ${activeConversationId===conversation.id?"conversation-active":""}`} onClick={()=>{setActiveConversationId(conversation.id);setShowPeople(false);setError("");setNotice("");}} aria-pressed={activeConversationId===conversation.id}>
            <ConversationAvatar profile={contact.profile} name={memberText}/>
            <span className="conversation-copy"><b>{memberText}</b><small>{conversation.is_group?"Group conversation":"Tap to open messages"}</small></span>
          </button>;
        })}</div>
        {conversations.length===0&&!showPeople&&<div className="empty-state" style={{padding:18}}><MessageCircle size={20}/><p>No conversations yet.</p><button className="button button-secondary" type="button" onClick={()=>setShowPeople(true)}>Find a member</button></div>}
      </aside>
      <section className="chat-panel" aria-label="Message thread">
        {activeConversation ? <>
          <header className="chat-header">
            <ConversationAvatar profile={activeContact.profile} name={activeContact.name}/>
            <div><b>{activeContact.name}</b><small>{activeConversation.is_group ? "Group conversation" : "SPORTSLINK member"}</small></div>
            <button className="button button-secondary" type="button" onClick={()=>setShowPeople((value)=>!value)}><PlusCircle size={15}/> New</button>
          </header>
          <div className="chat-messages" role="log" aria-live="polite" aria-label="Conversation messages">
            {messagesLoading&&messages.length===0
              ? <div className="empty-state" role="status"><Activity/><p>Loading messages…</p></div>
              : messages.length===0
                ? <div className="chat-empty-start"><span className="chat-empty-start-icon"><MessageCircle size={24}/></span><h3>Start with a hello</h3><p>This is the beginning of your conversation. Send a friendly first message below.</p></div>
                : messages.map((message)=> {
                  const isOwn=message.sender_id===user?.id;
                  const senderName=message.sender?.full_name||message.sender?.username||(isOwn?"You":activeContact.name);
                  return <article key={message.id} className={`message-bubble ${isOwn?"message-own":""}`}>
                    {!isOwn&&<strong style={{display:"block",fontSize:9,marginBottom:3}}>{senderName}</strong>}
                    <div style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{message.content}</div>
                    <small>{chatTime(message.created_at)}{isOwn?" · You":""}</small>
                  </article>;
                })}
          </div>
          <form className="chat-composer" onSubmit={sendMessage}>
            <input value={draft} onChange={(event)=>setDraft(event.target.value)} placeholder="Write a message…" aria-label="Write a message" maxLength={5000} autoComplete="off" disabled={sending}/>
            <button className="send-message" type="submit" aria-label="Send message" disabled={sending||!draft.trim()}><Send size={16}/></button>
          </form>
          <p className="demo-disclaimer" style={{padding:"7px 12px 0"}}>Messages are saved to your conversation. Recipients receive an in-app notification.</p>
        </> : <div className="message-empty-screen">
          <div className="message-empty-illustration"><span className="message-empty-orbit message-empty-orbit-one"/><span className="message-empty-orbit message-empty-orbit-two"/><span className="message-empty-icon"><MessageCircle size={34}/></span></div>
          <span className="message-empty-kicker">YOUR NEXT CONNECTION STARTS HERE</span>
          <h2>Your inbox, ready for a conversation</h2>
          <p>Start a private conversation with an athlete, coach, scout or another sports professional in your network.</p>
          <button className="button button-primary messages-new-button" type="button" onClick={()=>setShowPeople(true)}><PlusCircle size={16}/> Find a member</button>
        </div>}
      </section>
    </section>
  </div>;
}

function notificationTime(value) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  if (days < 7) return days + "d ago";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(timestamp);
}

function NotificationTypeIcon({ type }) {
  if (type === "message") return <MessageCircle size={18}/>;
  if (type === "comment") return <MessageCircle size={18}/>;
  if (type === "reaction") return <Heart size={18}/>;
  if (type === "follow") return <UserPlus size={18}/>;
  return <Bell size={18}/>;
}

export function NotificationsPage() {
  const [client, setClient] = useState(null);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const router = useRouter();

  async function refresh(supabase, userId) {
    const { data, error: queryError } = await supabase
      .from("notifications")
      .select("id,user_id,actor_id,type,entity_type,entity_id,message,is_read,created_at,actor:profiles!notifications_actor_id_fkey(id,username,full_name,avatar_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (queryError) throw queryError;
    setNotifications(data || []);
  }

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    setClient(supabase);

    async function initialize() {
      try {
        if (!supabase) throw new Error("Supabase is not configured.");
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!data.user) throw new Error("Sign in to see your notifications.");
        if (active) setUser(data.user);
        const { data: rows, error: queryError } = await supabase
          .from("notifications")
          .select("id,user_id,actor_id,type,entity_type,entity_id,message,is_read,created_at,actor:profiles!notifications_actor_id_fkey(id,username,full_name,avatar_url)")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false })
          .limit(100);
        if (queryError) throw queryError;
        if (active) {
          setNotifications(rows || []);
          setError("");
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
      } finally {
        if (active) setLoading(false);
      }
    }
    initialize();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!client || !user?.id) return undefined;
    let active = true;
    const timer = setInterval(async () => {
      try {
        await refresh(client, user.id);
      } catch {
        if (active) setError((current) => current || "Notifications could not be refreshed. Check your connection.");
      }
    }, 12000);
    return () => { active = false; clearInterval(timer); };
  }, [client, user?.id]);

  async function markRead(notificationId) {
    if (!client || !user) return;
    setBusyId(notificationId);
    setError("");
    try {
      const { error: updateError } = await client.from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id);
      if (updateError) throw updateError;
      setNotifications((current) => current.map((item) => item.id === notificationId ? { ...item, is_read: true } : item));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to mark notification as read.");
    } finally {
      setBusyId("");
    }
  }

  async function markAllRead() {
    if (!client || !user) return;
    setBusyId("all");
    setError("");
    setNotice("");
    try {
      const { error: updateError } = await client.from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (updateError) throw updateError;
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
      setNotice("All notifications marked as read.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to mark notifications as read.");
    } finally {
      setBusyId("");
    }
  }

  async function deleteNotification(notificationId) {
    if (!client || !user) return;
    setBusyId(notificationId);
    setError("");
    try {
      const { error: deleteError } = await client.from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", user.id);
      if (deleteError) throw deleteError;
      setNotifications((current) => current.filter((item) => item.id !== notificationId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete notification.");
    } finally {
      setBusyId("");
    }
  }

  async function openNotification(item) {
    if (!item.is_read) await markRead(item.id);
    if (item.entity_type === "post" && item.entity_id) {
      router.push("/home#post-" + item.entity_id);
    } else if (item.type === "follow" || item.entity_type === "profile") {
      router.push("/network");
    } else if (item.type === "message" && item.entity_type === "conversation" && item.entity_id) {
      router.push("/messages?conversation=" + encodeURIComponent(item.entity_id));
    } else if (item.entity_type === "event") {
      router.push("/events");
    } else {
      router.push("/home");
    }
  }

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  if (loading) return <div className="page-stack notifications-page"><Heading eyebrow="NOTIFICATIONS" title="Notifications" subtitle="Messages, reactions, comments, and new followers from your SPORTSLINK community."/><div className="empty-state card" role="status"><Activity/><h2>Loading your notifications…</h2></div></div>;

  return <div className="page-stack notifications-page">
    <Heading
      eyebrow="NOTIFICATIONS"
      title="Notifications"
      subtitle="Reactions, comments, and new followers from your SPORTSLINK community."
      action={unreadCount > 0 ? <button className="button button-secondary" type="button" onClick={markAllRead} disabled={busyId === "all"}><CheckCheck size={16}/>{busyId === "all" ? "Saving…" : "Mark all read"}</button> : null}
    />
    <div className="notifications-meta-row">
      <span className="badge">{unreadCount} unread</span>
      <span>Notifications are saved to your account.</span>
    </div>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {notice && <p className="inline-notice" role="status">{notice}</p>}
    {!notifications.length
      ? <div className="empty-state card"><Bell/><h2>You’re all caught up</h2><p>New messages, likes, comments, and followers will show up here.</p></div>
      : <div className="notification-list">{notifications.map((item) => {
        const actor = item.actor || {};
        const actorName = actor.full_name || actor.username || "A SPORTSLINK member";
        const message = item.message || (item.type === "follow" ? "started following you" : item.type === "comment" ? "commented on your post" : item.type === "reaction" ? "reacted to your post" : "sent you a notification");
        return <article key={item.id} className={`notification-item-card card ${item.is_read ? "notification-read" : "notification-unread"}`}>
          <button type="button" className="notification-open" onClick={() => openNotification(item)} aria-label={`Open notification from ${actorName}`}>
            <span className={`notification-symbol notification-symbol-${item.type || "default"}`}><NotificationTypeIcon type={item.type}/></span>
            <span className="notification-card-copy">
              <span className="notification-card-title"><strong>{actorName}</strong>{!item.is_read && <i aria-label="Unread"/>}</span>
              <span className="notification-card-message">{message}</span>
              <small>{notificationTime(item.created_at)}</small>
            </span>
          </button>
          <div className="notification-actions">
            {!item.is_read && <button type="button" className="button button-secondary" onClick={() => markRead(item.id)} disabled={busyId === item.id}>{busyId === item.id ? "Saving…" : <><CheckCheck size={14}/>Read</>}</button>}
            <button type="button" className="notification-delete" aria-label="Delete notification" title="Delete notification" onClick={() => deleteNotification(item.id)} disabled={busyId === item.id}><Trash2 size={15}/></button>
          </div>
        </article>;
      })}</div>}
  </div>;
}


export function OpportunitiesPage() {
  return <EmptyWorkspacePage title="Opportunities" eyebrow="OPPORTUNITIES" subtitle="Roles and opportunities from SPORTSLINK organizations." icon={BriefcaseBusiness} message="No live opportunities available"/>;
}

const PROFILE_COLUMNS = "id,username,full_name,headline,bio,avatar_url,cover_url,location,sport,role,skills,created_at,updated_at";

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SL";
}

function ProfileAvatar({ profile, name }) {
  return profile.avatar_url
    ? <img className="avatar avatar-profile-large" src={profile.avatar_url} alt="" />
    : <span className="avatar avatar-profile-large avatar-initials" aria-hidden="true">{initials(name)}</span>;
}

export function ProfilePage() {
  const [client, setClient] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const avatarFileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(coverFile);
    setCoverPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [coverFile]);

  useEffect(() => {
    const supabase = createClient();
    setClient(supabase);
    let active = true;

    async function loadProfile() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authData.user) throw new Error("Sign in to view your profile.");
        let data;
        if (USE_SPRING_API) {
          data = await backendRequest("/api/profiles/me");
          const { data: imageFields, error: imageFieldsError } = await supabase
            .from("profiles")
            .select("avatar_url,cover_url")
            .eq("id", authData.user.id)
            .maybeSingle();
          if (imageFieldsError) throw imageFieldsError;
          data = { ...data, ...(imageFields || {}) };
        } else {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select(PROFILE_COLUMNS)
            .eq("id", authData.user.id)
            .maybeSingle();
          if (profileError) throw profileError;
          data = profileData;
        }
        if (!active) return;
        setUser(authData.user);
        setProfile(data);
        setDraft(data ? {
          full_name: data.full_name || "",
          headline: data.headline || "",
          bio: data.bio || "",
          location: data.location || "",
          sport: data.sport || "",
        } : null);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load your profile.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => { active = false; };
  }, []);

  function selectProfileImage(event, kind) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    if (!allowedTypes.has(file.type)) {
      setError("Choose a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Profile images must be 5 MB or smaller.");
      return;
    }

    setError("");
    setNotice("");
    if (kind === "avatar") setAvatarFile(file);
    else setCoverFile(file);
  }

  async function uploadProfileImage(file, kind) {
    const extensionByType = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const extension = extensionByType[file.type];
    if (!extension) throw new Error("Choose a JPG, PNG, WebP, or GIF image.");
    const path = `${user.id}/${kind}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await client.storage
      .from("profile-images")
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });
    if (uploadError) throw uploadError;
    const { data: publicData } = client.storage.from("profile-images").getPublicUrl(path);
    return { path, url: publicData.publicUrl };
  }

  async function removePreviousProfileImage(url) {
    if (!client || !user || !url) return;
    const marker = "/storage/v1/object/public/profile-images/";
    const markerIndex = url.indexOf(marker);
    if (markerIndex < 0) return;
    let path;
    try {
      path = decodeURIComponent(url.slice(markerIndex + marker.length).split("?")[0]);
    } catch {
      return;
    }
    if (!path.startsWith(`${user.id}/`)) return;
    const { error: removeError } = await client.storage.from("profile-images").remove([path]);
    if (removeError) console.warn("The old profile image could not be removed.", removeError);
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!client || !user || !draft) return;
    setSaving(true);
    setError("");
    setNotice("");

    let avatarUpload = null;
    let coverUpload = null;
    let profileSaved = false;
    try {
      if (avatarFile) avatarUpload = await uploadProfileImage(avatarFile, "avatar");
      if (coverFile) coverUpload = await uploadProfileImage(coverFile, "cover");

      const mediaUpdates = {};
      if (avatarUpload) mediaUpdates.avatar_url = avatarUpload.url;
      if (coverUpload) mediaUpdates.cover_url = coverUpload.url;
      let data;

      if (USE_SPRING_API) {
        data = await backendRequest("/api/profiles/me", {
          method: "PATCH",
          body: JSON.stringify(draft),
        });
        if (!data) throw new Error("The profile update was not returned. Check the profile RLS policies.");
        if (Object.keys(mediaUpdates).length) {
          const { data: imageData, error: imageSaveError } = await client
            .from("profiles")
            .update(mediaUpdates)
            .eq("id", user.id)
            .select("avatar_url,cover_url")
            .single();
          if (imageSaveError) throw imageSaveError;
          data = { ...data, ...imageData };
        } else {
          data = { ...data, avatar_url: profile.avatar_url || null, cover_url: profile.cover_url || null };
        }
      } else {
        const { data: profileData, error: updateError } = await client
          .from("profiles")
          .update({ ...draft, ...mediaUpdates })
          .eq("id", user.id)
          .select(PROFILE_COLUMNS)
          .single();
        if (updateError) throw updateError;
        data = profileData;
      }
      if (!data) throw new Error("The profile update was not returned. Check the profile RLS policies.");

      const nextProfile = {
        ...profile,
        ...data,
        avatar_url: data.avatar_url ?? profile.avatar_url ?? null,
        cover_url: data.cover_url ?? profile.cover_url ?? null,
      };
      setProfile(nextProfile);
      setDraft({
        full_name: nextProfile.full_name || "",
        headline: nextProfile.headline || "",
        bio: nextProfile.bio || "",
        location: nextProfile.location || "",
        sport: nextProfile.sport || "",
      });
      profileSaved = true;
      setAvatarFile(null);
      setCoverFile(null);
      setEditing(false);
      setNotice("Profile changes saved.");
      window.dispatchEvent(new CustomEvent("sportslink:profile-updated", {
        detail: {
          id: user.id,
          name: nextProfile.full_name || nextProfile.username || user.email?.split("@")[0] || "SPORTSLINK Member",
          avatarUrl: nextProfile.avatar_url || null,
        },
      }));

      if (avatarUpload && profile.avatar_url && profile.avatar_url !== avatarUpload.url) {
        await removePreviousProfileImage(profile.avatar_url);
      }
      if (coverUpload && profile.cover_url && profile.cover_url !== coverUpload.url) {
        await removePreviousProfileImage(profile.cover_url);
      }
    } catch (saveError) {
      if (!profileSaved) {
        const paths = [avatarUpload?.path, coverUpload?.path].filter(Boolean);
        if (paths.length && client) {
          const { error: cleanupError } = await client.storage.from("profile-images").remove(paths);
          if (cleanupError) console.warn("New profile image cleanup failed.", cleanupError);
        }
      }
      setError(saveError instanceof Error ? saveError.message : "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="empty-state card" role="status"><Activity/><h2>Loading your profile…</h2></div>;
  if (error && !profile) return <div className="page-stack"><Heading eyebrow="YOUR PROFILE" title="Profile" subtitle="Your public SPORTSLINK profile."/><div className="inline-notice" role="alert">{error}</div></div>;
  if (!profile) return <div className="page-stack"><Heading eyebrow="YOUR PROFILE" title="Profile" subtitle="Your public SPORTSLINK profile."/><div className="empty-state card"><UserRound/><h2>No profile data is visible</h2><p>This may mean the profile row is missing or the current SELECT policy hides it. Verify profile creation and RLS before changing database policy or creating rows manually.</p></div></div>;

  const name = profile.full_name || profile.username || user?.email?.split("@")[0] || "SPORTSLINK Member";
  const skills = Array.isArray(profile.skills) ? profile.skills : typeof profile.skills === "string" ? profile.skills.split(",").map((skill) => skill.trim()).filter(Boolean) : [];

  return <div className="page-stack">
    <div className={`profile-cover-large ${(coverPreview || profile.cover_url) ? "profile-cover-with-image" : ""}`}>
      {(coverPreview || profile.cover_url) && <img className="profile-cover-image" src={coverPreview || profile.cover_url} alt="" />}
      <span className="cover-label"><UserRound size={15}/> PUBLIC PROFILE</span>
      {editing && <>
        <input ref={coverFileInputRef} className="profile-image-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => selectProfileImage(event, "cover")} aria-label="Choose a public profile cover image" />
        <button className="profile-cover-upload-button" type="button" onClick={() => coverFileInputRef.current?.click()} disabled={saving}><ImagePlus size={15}/>{(coverPreview || profile.cover_url) ? "Change cover image" : "Add cover image"}</button>
      </>}
    </div>
    <section className="profile-overview card">
      <div className="profile-avatar-edit-wrap">
        <ProfileAvatar profile={{ ...profile, avatar_url: avatarPreview || profile.avatar_url }} name={name}/>
        {editing && <>
          <input ref={avatarFileInputRef} className="profile-image-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => selectProfileImage(event, "avatar")} aria-label="Choose a profile picture" />
          <button className="profile-avatar-upload-button" type="button" onClick={() => avatarFileInputRef.current?.click()} disabled={saving} title={(avatarPreview || profile.avatar_url) ? "Change profile picture" : "Add profile picture"}><Camera size={15}/><span>{(avatarPreview || profile.avatar_url) ? "Change photo" : "Add photo"}</span></button>
        </>}
      </div>
      <div className="profile-overview-actions">
        {editing
          ? <form onSubmit={saveProfile} className="settings-actions"><button type="button" className="button button-secondary" disabled={saving} onClick={() => { setDraft({ full_name: profile.full_name || "", headline: profile.headline || "", bio: profile.bio || "", location: profile.location || "", sport: profile.sport || "" }); setAvatarFile(null); setCoverFile(null); setError(""); setNotice(""); setEditing(false); }}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}><Save size={15}/>{saving ? "Saving…" : "Save profile"}</button></form>
          : <button className="button button-primary" type="button" onClick={() => { setError(""); setEditing(true); }}><Pencil size={15}/> Edit profile</button>}
      </div>
      <div className="profile-overview-copy">
        <h1>{name}</h1>
        {editing ? <label className="settings-field">Name<input value={draft.full_name} maxLength={120} onChange={(event) => setDraft({ ...draft, full_name: event.target.value })}/></label> : profile.headline && <p className="profile-headline">{profile.headline}</p>}
        {profile.location && <span className="profile-location"><MapPin size={14}/> {profile.location}</span>}
        {(profile.sport || profile.role) && <div className="profile-sports-tags">{profile.sport && <span>{profile.sport}</span>}{profile.role && <span>{profile.role}</span>}</div>}
      </div>
    </section>
    <Notice>{notice}</Notice>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <div className="profile-content-grid">
      <div className="profile-main-column">
        <section className="content-card card"><h2>About</h2>{editing ? <label className="settings-field">Headline<input value={draft.headline} maxLength={180} onChange={(event) => setDraft({ ...draft, headline: event.target.value })}/></label> : profile.headline ? <p className="profile-headline">{profile.headline}</p> : <p className="about-text">No headline added.</p>}{editing ? <label className="settings-field">About<textarea rows={5} maxLength={5000} value={draft.bio} onChange={(event) => setDraft({ ...draft, bio: event.target.value })}/></label> : <p className="about-text">{profile.bio || "No bio added."}</p>}</section>
        <section className="content-card card"><h2>Profile details</h2>{editing ? <><label className="settings-field">Location<input value={draft.location} maxLength={160} onChange={(event) => setDraft({ ...draft, location: event.target.value })}/></label><label className="settings-field">Sport<input value={draft.sport} maxLength={100} onChange={(event) => setDraft({ ...draft, sport: event.target.value })}/></label></> : <dl className="stat-grid">{[["Username", profile.username], ["Sport", profile.sport], ["Role", profile.role], ["Location", profile.location]].filter(([, value]) => value).map(([label, value]) => <div className="stat-cell" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}</section>
      </div>
      <aside className="profile-side-column"><section className="content-card card"><h3>Skills</h3>{skills.length ? <div className="skill-tags">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div> : <p>No skills added.</p>}</section><section className="content-card card"><h3>Profile visibility</h3><p>Public profile data shown here is limited by your Supabase RLS policies.</p></section></aside>
    </div>
  </div>;
}