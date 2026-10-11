"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, Bell, BriefcaseBusiness, CheckCheck, Heart, MapPin, MessageCircle, Pencil, Save, Trash2, UserPlus, UserRound, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { backendRequest } from "@/lib/api/backend";
import { Heading, Notice } from "./shared";

const USE_SPRING_API = process.env.NEXT_PUBLIC_USE_SPRING_API === "true";

function EmptyWorkspacePage({ title, eyebrow, subtitle, icon: Icon, message }) {
  return <div className="page-stack">
    <Heading eyebrow={eyebrow} title={title} subtitle={subtitle}/>
    <div className="empty-state card"><Icon/><h2>{message}</h2><p>This feature has no connected data source yet. No sample records are shown.</p></div>
  </div>;
}

export function MessagesPage() {
  return <EmptyWorkspacePage title="Messaging" eyebrow="MESSAGING" subtitle="Conversations with real SPORTSLINK members." icon={Users} message="No conversations available"/>;
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
    } else if (item.entity_type === "event") {
      router.push("/events");
    } else {
      router.push("/home");
    }
  }

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  if (loading) return <div className="page-stack"><Heading eyebrow="NOTIFICATIONS" title="Notifications" subtitle="Updates from your SPORTSLINK activity."/><div className="empty-state card" role="status"><Activity/><h2>Loading your notifications…</h2></div></div>;

  return <div className="page-stack">
    <Heading eyebrow="NOTIFICATIONS" title="Notifications" subtitle="Reactions, comments, and new followers from your SPORTSLINK community." action={unreadCount>0?<button className="button button-secondary" type="button" onClick={markAllRead} disabled={busyId==="all"}><CheckCheck size={16}/>{busyId==="all"?"Saving…":"Mark all read"}</button>:null}/>
    <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
      <span className="badge">{unreadCount} unread</span>
      <span style={{fontSize:13,color:"var(--muted-foreground,#64748b)"}}>Notifications are saved to your account.</span>
    </div>
    {error&&<p className="auth-error" role="alert">{error}</p>}
    {notice&&<p className="inline-notice" role="status">{notice}</p>}
    {!notifications.length
      ? <div className="empty-state card"><Bell/><h2>You're all caught up</h2><p>New likes, comments, and followers will show up here.</p></div>
      : <div style={{display:"grid",gap:10}}>{notifications.map((item)=>{
        const actor=item.actor||{};
        const actorName=actor.full_name||actor.username||"A SPORTSLINK member";
        return <article key={item.id} className="content-card card" style={{display:"flex",gap:12,alignItems:"flex-start",padding:16,borderLeft:item.is_read?undefined:"3px solid #2563eb",background:item.is_read?undefined:"var(--surface-muted,#f8fafc)"}}>
          <div style={{width:42,height:42,flex:"0 0 42px",borderRadius:12,display:"grid",placeItems:"center",background:"var(--surface,#fff)",border:"1px solid var(--border,#e2e8f0)"}}><NotificationTypeIcon type={item.type}/></div>
          <div style={{flex:1,minWidth:0}}>
            <button type="button" onClick={()=>openNotification(item)} style={{display:"block",width:"100%",textAlign:"left",padding:0,border:0,background:"transparent",color:"inherit",cursor:"pointer"}}>
              <strong>{actorName}</strong>
              <p style={{margin:"4px 0",overflowWrap:"anywhere"}}>{item.message || (item.type==="follow"?"started following you":item.type==="comment"?"commented on your post":item.type==="reaction"?"reacted to your post":"sent you a notification")}</p>
              <small style={{color:"var(--muted-foreground,#64748b)"}}>{notificationTime(item.created_at)}</small>
            </button>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
            {!item.is_read&&<button type="button" className="button button-secondary" style={{padding:"6px 9px",fontSize:12}} onClick={()=>markRead(item.id)} disabled={busyId===item.id}><CheckCheck size={14}/>Read</button>}
            <button type="button" className="button button-secondary" style={{padding:"6px 9px",fontSize:12}} aria-label="Delete notification" title="Delete notification" onClick={()=>deleteNotification(item.id)} disabled={busyId===item.id}><Trash2 size={14}/></button>
          </div>
        </article>;
      })}</div>}
  </div>;
}

export function OpportunitiesPage() {
  return <EmptyWorkspacePage title="Opportunities" eyebrow="OPPORTUNITIES" subtitle="Roles and opportunities from SPORTSLINK organizations." icon={BriefcaseBusiness} message="No live opportunities available"/>;
}

const PROFILE_COLUMNS = "id,username,full_name,headline,bio,avatar_url,location,sport,role,skills,created_at,updated_at";

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

  async function saveProfile(event) {
    event.preventDefault();
    if (!client || !user || !draft) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      let data;
      if (USE_SPRING_API) {
        data = await backendRequest("/api/profiles/me", {
          method: "PATCH",
          body: JSON.stringify(draft),
        });
      } else {
        const { data: profileData, error: updateError } = await client
          .from("profiles")
          .update(draft)
          .eq("id", user.id)
          .select(PROFILE_COLUMNS)
          .single();
        if (updateError) throw updateError;
        data = profileData;
      }
      if (!data) throw new Error("The profile update was not returned. Check the profile RLS policies.");
      setProfile(data);
      setDraft({
        full_name: data.full_name || "",
        headline: data.headline || "",
        bio: data.bio || "",
        location: data.location || "",
        sport: data.sport || "",
      });
      setEditing(false);
      setNotice("Profile changes saved.");
    } catch (saveError) {
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
    <div className="profile-cover-large"><span className="cover-label"><UserRound size={15}/> PUBLIC PROFILE</span></div>
    <section className="profile-overview card">
      <ProfileAvatar profile={profile} name={name}/>
      <div className="profile-overview-actions">
        {editing
          ? <form onSubmit={saveProfile} className="settings-actions"><button type="button" className="button button-secondary" disabled={saving} onClick={() => { setDraft({ full_name: profile.full_name || "", headline: profile.headline || "", bio: profile.bio || "", location: profile.location || "", sport: profile.sport || "" }); setEditing(false); }}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}><Save size={15}/>{saving ? "Saving…" : "Save profile"}</button></form>
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