"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Settings, PlusCircle, RefreshCw, Save, XCircle, LockKeyhole, MapPin, UserRound, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Heading } from "./shared";

const EVENT_COLUMNS = "id,created_by,title,description,event_type,sport,location,starts_at,ends_at,status,created_at";
const PROFILE_COLUMNS = "id,username,full_name,headline,bio,location,sport,website_url,role";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

const inputClass = "settings-field";

function EmptyOrganizationPage() {
  return <div className="page-stack organizations-page">
    <Heading eyebrow="ORGANIZATIONS" title="Organizations" subtitle="Clubs and organizations in the SPORTSLINK community." />
    <div className="empty-state card"><UserRound/><h2>No organizations available</h2><p>Organization management is not connected yet. No sample records are shown.</p></div>
  </div>;
}

export function SectionPage({ section }) {
  const [client, setClient] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [events, setEvents] = useState([]);
  const [profileDraft, setProfileDraft] = useState(null);
  const [passwordDraft, setPasswordDraft] = useState({ password: "", confirm: "" });
  const [eventDraft, setEventDraft] = useState({
    title: "", description: "", event_type: "meetup", sport: "", location: "", starts_at: "", ends_at: "",
  });

  async function loadEvents(supabase, activeUser) {
    const { data, error: listError } = await supabase
      .from("events")
      .select(EVENT_COLUMNS)
      .order("starts_at", { ascending: true })
      .limit(100);
    if (listError) throw listError;
    const rows = data || [];
    const creatorIds = [...new Set(rows.map((row) => row.created_by))];
    let profilesById = new Map();
    if (creatorIds.length) {
      const { data: creators, error: creatorsError } = await supabase
        .from("profiles")
        .select("id,username,full_name")
        .in("id", creatorIds);
      if (creatorsError) throw creatorsError;
      profilesById = new Map((creators || []).map((creator) => [creator.id, creator]));
    }
    setEvents(rows.map((row) => ({ ...row, creator: profilesById.get(row.created_by) || null })));
  }

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    setClient(supabase);
    setLoading(true);
    setError("");
    setNotice("");

    async function initialize() {
      try {
        if (!supabase) throw new Error("Supabase is not configured for this deployment.");
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!data.user) throw new Error("Your session is missing. Sign in again and reload this page.");
        if (!active) return;
        setUser(data.user);

        if (section === "events") {
          await loadEvents(supabase, data.user);
        } else if (section === "settings") {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select(PROFILE_COLUMNS)
            .eq("id", data.user.id)
            .maybeSingle();
          if (profileError) throw profileError;
          if (!active) return;
          setProfileDraft({
            full_name: profile?.full_name || data.user.user_metadata?.full_name || "",
            username: profile?.username || "",
            headline: profile?.headline || "",
            bio: profile?.bio || "",
            location: profile?.location || "",
            sport: profile?.sport || "",
            website_url: profile?.website_url || "",
          });
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load this page.");
      } finally {
        if (active) setLoading(false);
      }
    }

    initialize();
    return () => { active = false; };
  }, [section]);

  async function createEvent(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!client || !user) return;
    if (eventDraft.title.trim().length < 3) {
      setError("Give your event a title with at least 3 characters.");
      return;
    }
    if (eventDraft.location.trim().length < 2) {
      setError("Add a location so people know where the event will take place.");
      return;
    }
    const startsAt = new Date(eventDraft.starts_at);
    const endsAt = eventDraft.ends_at ? new Date(eventDraft.ends_at) : null;
    if (!eventDraft.starts_at || Number.isNaN(startsAt.getTime())) {
      setError("Choose a valid event start date and time.");
      return;
    }
    if (endsAt && (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt)) {
      setError("The event end time must be later than its start time.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        created_by: user.id,
        title: eventDraft.title.trim(),
        description: eventDraft.description.trim(),
        event_type: eventDraft.event_type,
        sport: eventDraft.sport.trim() || null,
        location: eventDraft.location.trim(),
        starts_at: startsAt.toISOString(),
        ends_at: endsAt ? endsAt.toISOString() : null,
        status: "published",
      };
      const { error: insertError } = await client.from("events").insert(payload);
      if (insertError) throw insertError;
      setEventDraft({ title: "", description: "", event_type: "meetup", sport: "", location: "", starts_at: "", ends_at: "" });
      await loadEvents(client, user);
      setNotice("Your event is published.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to publish this event.");
    } finally {
      setSaving(false);
    }
  }

  async function cancelEvent(eventId) {
    if (!client || !user) return;
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const { error: updateError } = await client
        .from("events")
        .update({ status: "cancelled" })
        .eq("id", eventId)
        .eq("created_by", user.id);
      if (updateError) throw updateError;
      await loadEvents(client, user);
      setNotice("Your event has been cancelled.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to cancel this event.");
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!client || !user || !profileDraft) return;
    setError("");
    setNotice("");
    const username = profileDraft.username.trim().toLowerCase();
    if (username && !/^[a-z0-9_]{3,30}$/.test(username)) {
      setError("Username must be 3–30 characters using lowercase letters, numbers, and underscores.");
      return;
    }
    const website = profileDraft.website_url.trim();
    if (website && !/^https?:\/\//i.test(website)) {
      setError("Website URL must start with http:// or https://.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: user.id,
        full_name: profileDraft.full_name.trim(),
        username: username || null,
        headline: profileDraft.headline.trim(),
        bio: profileDraft.bio.trim(),
        location: profileDraft.location.trim() || null,
        sport: profileDraft.sport.trim() || null,
        website_url: website || null,
      };
      const { data, error: saveError } = await client
        .from("profiles")
        .upsert(payload, { onConflict: "id" })
        .select(PROFILE_COLUMNS)
        .single();
      if (saveError) throw saveError;
      setProfileDraft({
        full_name: data.full_name || "",
        username: data.username || "",
        headline: data.headline || "",
        bio: data.bio || "",
        location: data.location || "",
        sport: data.sport || "",
        website_url: data.website_url || "",
      });
      setNotice("Your profile and account details have been saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save your settings.");
    } finally {
      setSaving(false);
    }
  }

  async function updatePassword(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!client) return;
    if (passwordDraft.password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (passwordDraft.password !== passwordDraft.confirm) {
      setError("The password confirmation does not match.");
      return;
    }
    setSaving(true);
    try {
      const { error: passwordError } = await client.auth.updateUser({ password: passwordDraft.password });
      if (passwordError) throw passwordError;
      setPasswordDraft({ password: "", confirm: "" });
      setNotice("Your password has been updated.");
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : "Unable to update your password.");
    } finally {
      setSaving(false);
    }
  }

  if (section === "organizations") return <EmptyOrganizationPage />;

  if (loading) {
    return <div className="page-stack"><Heading eyebrow={section === "events" ? "EVENTS" : "ACCOUNT SETTINGS"} title={section === "events" ? "Sports Events" : "Settings"} subtitle={section === "events" ? "Create and discover sporting events." : "Manage your profile and account."} /><div className="empty-state card" role="status"><RefreshCw/><h2>Loading your {section === "events" ? "events" : "settings"}…</h2></div></div>;
  }

  if (section === "events") {
    return <div className="page-stack events-page">
      <Heading eyebrow="SPORTS EVENTS" title="Events" subtitle="Publish competitions, training sessions, tryouts, and community meetups." />
      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && <p className="inline-notice" role="status" aria-live="polite">{notice}</p>}
      <section className="event-management-grid">
      <section className="content-card card event-create-card">
        <h2><PlusCircle size={19} style={{ verticalAlign: "middle", marginRight: 8 }}/>Create an event</h2>
        <p>Published events appear in the community list. You can cancel events you created.</p>
        <form onSubmit={createEvent} className="settings-form event-create-form">
          <label className={inputClass}>Event title<input required maxLength={160} value={eventDraft.title} onChange={(e) => setEventDraft({ ...eventDraft, title: e.target.value })} placeholder="e.g. Weekend football trials" /></label>
          <label className={inputClass}>Description<textarea rows={3} maxLength={3000} value={eventDraft.description} onChange={(e) => setEventDraft({ ...eventDraft, description: e.target.value })} placeholder="What should participants know?" /></label>
          <div className="event-form-grid">
            <label className={inputClass}>Event type<select value={eventDraft.event_type} onChange={(e) => setEventDraft({ ...eventDraft, event_type: e.target.value })}><option value="training">Training</option><option value="competition">Competition</option><option value="tryout">Tryout</option><option value="meetup">Meetup</option><option value="other">Other</option></select></label>
            <label className={inputClass}>Sport (optional)<input maxLength={100} value={eventDraft.sport} onChange={(e) => setEventDraft({ ...eventDraft, sport: e.target.value })} placeholder="e.g. Football" /></label>
            <label className={inputClass}>Location<input required maxLength={240} value={eventDraft.location} onChange={(e) => setEventDraft({ ...eventDraft, location: e.target.value })} placeholder="Venue or online" /></label>
            <label className={inputClass}>Starts at<input required type="datetime-local" value={eventDraft.starts_at} onChange={(e) => setEventDraft({ ...eventDraft, starts_at: e.target.value })} /></label>
            <label className={inputClass}>Ends at (optional)<input type="datetime-local" value={eventDraft.ends_at} onChange={(e) => setEventDraft({ ...eventDraft, ends_at: e.target.value })} /></label>
          </div>
          <div><button className="button button-primary" type="submit" disabled={saving}>{saving ? "Publishing…" : "Publish event"}</button></div>
        </form>
      </section>
      <aside className="content-card card event-live-preview" aria-label="Live event preview">
        <div className="eyebrow"><CalendarDays size={14} style={{ verticalAlign: "middle", marginRight: 6 }}/>LIVE PREVIEW</div>
        <div style={{margin:"12px 0 16px",borderRadius:14,background:"linear-gradient(135deg,#172554,#1d4ed8 58%,#0f766e)",minHeight:130,padding:18,color:"#fff",display:"flex",flexDirection:"column",justifyContent:"space-between",gap:16}}>
          <span style={{fontSize:11,letterSpacing:1.2,fontWeight:700}}>SPORTSLINK · COMMUNITY EVENT</span>
          <div><div style={{fontSize:12,opacity:.85,textTransform:"uppercase"}}>{eventDraft.event_type.replaceAll("_"," ") || "EVENT"}{eventDraft.sport.trim() ? " · " + eventDraft.sport.trim() : ""}</div><h2 style={{fontSize:24,lineHeight:1.15,margin:"6px 0 0",overflowWrap:"anywhere"}}>{eventDraft.title.trim() || "Your event title"}</h2></div>
        </div>
        <p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",minHeight:42}}>{eventDraft.description.trim() || "Add a description to help people understand what this event is about."}</p>
        <div style={{display:"grid",gap:10,marginTop:14}}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}><CalendarDays size={17}/><span><strong style={{display:"block",fontSize:13}}>Date and time</strong><span>{eventDraft.starts_at ? formatDate(new Date(eventDraft.starts_at).toISOString()) : "Choose a start date and time"}{eventDraft.ends_at ? " – " + formatDate(new Date(eventDraft.ends_at).toISOString()) : ""}</span></span></div>
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}><MapPin size={17}/><span><strong style={{display:"block",fontSize:13}}>Location</strong><span>{eventDraft.location.trim() || "Add an event location"}</span></span></div>
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}><Users size={17}/><span><strong style={{display:"block",fontSize:13}}>Organized by</strong><span>{user?.user_metadata?.full_name || user?.email?.split("@")[0] || "You"}</span></span></div>
        </div>
        <p style={{marginTop:18,fontSize:12,color:"var(--muted-foreground,#64748b)"}}>This preview updates as you fill in the event form. Publishing saves the event to Supabase.</p>
      </aside>
      </section>
      <section className="page-stack event-list-section">
        <div className="page-heading"><div><p className="eyebrow">COMMUNITY CALENDAR</p><h2>Community events</h2><p>Published event records from SPORTSLINK.</p></div><button className="button button-secondary" type="button" onClick={() => loadEvents(client, user)} disabled={saving}><RefreshCw size={15}/> Refresh</button></div>
        {!events.length ? <div className="empty-state card"><CalendarDays/><h2>No events published yet</h2><p>Create the first event above to share it with the community.</p></div> : <div style={{ display: "grid", gap: 14 }}>{events.map((item) => {
          const creatorName = item.created_by === user?.id ? "You" : item.creator?.full_name || item.creator?.username || "SPORTSLINK member";
          return <article key={item.id} className="content-card card event-list-card">
            <div className="event-list-card-head">
              <div style={{ minWidth: 0, flex: 1 }}><div className="eyebrow">{item.event_type.replaceAll("_", " ")}{item.sport ? ` · ${item.sport}` : ""}</div><h3>{item.title}</h3><p>{item.description || "No additional details provided."}</p></div>
              <span className="badge">{item.status === "cancelled" ? "Cancelled" : "Published"}</span>
            </div>
            <p><CalendarDays size={15} style={{ verticalAlign: "middle", marginRight: 6 }}/>{formatDate(item.starts_at)}{item.ends_at ? ` – ${formatDate(item.ends_at)}` : ""}</p>
            <p>{item.location} · Posted by {creatorName}</p>
            {item.status === "published" && item.created_by === user?.id && <button className="button button-secondary" type="button" onClick={() => cancelEvent(item.id)} disabled={saving}><XCircle size={15}/> Cancel event</button>}
          </article>;
        })}</div>}
      </section>
    </div>;
  }

  return <div className="page-stack settings-page">
    <Heading eyebrow="ACCOUNT SETTINGS" title="Settings" subtitle="Update the details connected to your SPORTSLINK account." />
    {error && <p className="auth-error" role="alert">{error}</p>}
    {notice && <p className="inline-notice" role="status" aria-live="polite">{notice}</p>}
    <div className="settings-content-grid">
    {!profileDraft ? <div className="empty-state card settings-profile-card"><Settings/><h2>Your profile details are not available</h2><p>You can still manage your password below. Check that your Supabase profile row exists if you expected existing details.</p></div> : <form onSubmit={saveProfile} className="content-card card settings-form settings-profile-card">
      <h2><UserRound size={19} style={{ verticalAlign: "middle", marginRight: 8 }}/>Profile details</h2>
      <p>These details are saved to your profile and shown according to the current database access rules.</p>
      <label className={inputClass}>Email address<input value={user?.email || ""} readOnly aria-describedby="settings-email-help" /></label>
      <small id="settings-email-help">Email changes are managed by Supabase Auth and may require confirmation.</small>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <label className={inputClass}>Full name<input required maxLength={120} value={profileDraft.full_name} onChange={(e) => setProfileDraft({ ...profileDraft, full_name: e.target.value })} /></label>
        <label className={inputClass}>Username<input maxLength={30} value={profileDraft.username} onChange={(e) => setProfileDraft({ ...profileDraft, username: e.target.value })} placeholder="3–30 characters" /></label>
        <label className={inputClass}>Headline<input maxLength={180} value={profileDraft.headline} onChange={(e) => setProfileDraft({ ...profileDraft, headline: e.target.value })} placeholder="Your sporting role or goal" /></label>
        <label className={inputClass}>Sport<input maxLength={100} value={profileDraft.sport} onChange={(e) => setProfileDraft({ ...profileDraft, sport: e.target.value })} /></label>
        <label className={inputClass}>Location<input maxLength={160} value={profileDraft.location} onChange={(e) => setProfileDraft({ ...profileDraft, location: e.target.value })} /></label>
        <label className={inputClass}>Website URL<input type="url" value={profileDraft.website_url} onChange={(e) => setProfileDraft({ ...profileDraft, website_url: e.target.value })} placeholder="https://example.com" /></label>
      </div>
      <label className={inputClass}>About<textarea rows={5} maxLength={5000} value={profileDraft.bio} onChange={(e) => setProfileDraft({ ...profileDraft, bio: e.target.value })} /></label>
      <div><button className="button button-primary" type="submit" disabled={saving}><Save size={15}/>{saving ? "Saving…" : "Save profile settings"}</button></div>
    </form>}
    <form onSubmit={updatePassword} className="content-card card settings-form settings-security-card">
      <h2><LockKeyhole size={19} style={{ verticalAlign: "middle", marginRight: 8 }}/>Security</h2>
      <p>Change your password. Use at least 8 characters and keep it private.</p>
      <label className={inputClass}>New password<input type="password" autoComplete="new-password" minLength={8} required value={passwordDraft.password} onChange={(e) => setPasswordDraft({ ...passwordDraft, password: e.target.value })} /></label>
      <label className={inputClass}>Confirm new password<input type="password" autoComplete="new-password" minLength={8} required value={passwordDraft.confirm} onChange={(e) => setPasswordDraft({ ...passwordDraft, confirm: e.target.value })} /></label>
      <div><button className="button button-secondary" type="submit" disabled={saving}>{saving ? "Updating…" : "Update password"}</button></div>
    </form>
    </div>
    <p className="settings-security-footnote">Account updates are saved by Supabase. Sign-in and database access remain protected by your existing authentication and row-level security policies.</p>
  </div>;
}
