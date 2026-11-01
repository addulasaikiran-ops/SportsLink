"use client";

import { useEffect, useState } from "react";
import { Activity, BriefcaseBusiness, CalendarClock, MapPin, PlusCircle, RefreshCw, Send, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Heading } from "./shared";

const TYPES = [
  ["job", "Job"], ["trial", "Trial"], ["scholarship", "Scholarship"],
  ["team", "Team opportunity"], ["sponsorship", "Sponsorship"], ["volunteer", "Volunteer"], ["other", "Other"],
];
const FIELDS = "id,created_by,title,description,opportunity_type,sport,location,is_remote,status,application_deadline,created_at,owner:profiles!opportunities_created_by_fkey(id,full_name,username,avatar_url,role,profile_details_completed)";

function dateLabel(value) {
  if (!value) return "No deadline";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No deadline" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function OpportunitiesPage() {
  const [client, setClient] = useState(null);
  const [user, setUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [myApplications, setMyApplications] = useState(new Map());
  const [applicationsByOpportunity, setApplicationsByOpportunity] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [draft, setDraft] = useState({ title: "", description: "", opportunity_type: "job", sport: "", location: "", is_remote: false, application_deadline: "" });
  const [applicationDrafts, setApplicationDrafts] = useState({});

  async function load(supabase, activeUser) {
    const { data, error: listError } = await supabase.from("opportunities")
      .select(FIELDS).order("created_at", { ascending: false }).limit(100);
    if (listError) throw listError;
    const opportunities = data || [];
    setRows(opportunities);
    const { data: mine, error: mineError } = await supabase.from("opportunity_applications")
      .select("id,opportunity_id,status,created_at,message").eq("applicant_id", activeUser.id)
      .order("created_at", { ascending: false });
    if (mineError) throw mineError;
    setMyApplications(new Map((mine || []).map((item) => [item.opportunity_id, item])));
    const ownedIds = opportunities.filter((item) => item.created_by === activeUser.id).map((item) => item.id);
    if (ownedIds.length) {
      const { data: applications, error: applicationsError } = await supabase.from("opportunity_applications")
        .select("id,opportunity_id,applicant_id,message,status,created_at,applicant:profiles!opportunity_applications_applicant_id_fkey(id,full_name,username,role,sport)")
        .in("opportunity_id", ownedIds).order("created_at", { ascending: false });
      if (applicationsError) throw applicationsError;
      const grouped = new Map();
      for (const application of applications || []) grouped.set(application.opportunity_id, [...(grouped.get(application.opportunity_id) || []), application]);
      setApplicationsByOpportunity(grouped);
    } else setApplicationsByOpportunity(new Map());
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
        if (!data.user) throw new Error("Sign in to browse opportunities.");
        if (active) setUser(data.user);
        await load(supabase, data.user);
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Unable to load opportunities."); }
      finally { if (active) setLoading(false); }
    }
    initialize();
    return () => { active = false; };
  }, []);

  async function createOpportunity(event) {
    event.preventDefault();
    if (!client || !user) return;
    setError(""); setNotice("");
    if (draft.title.trim().length < 3) return setError("Add a title with at least 3 characters.");
    if (draft.description.trim().length < 10) return setError("Add a description of at least 10 characters.");
    if (!draft.location.trim() && !draft.is_remote) return setError("Add a location or mark this opportunity as remote.");
    const deadline = draft.application_deadline ? new Date(draft.application_deadline) : null;
    if (deadline && (Number.isNaN(deadline.getTime()) || deadline <= new Date())) return setError("The application deadline must be in the future.");
    setSaving(true);
    try {
      const payload = {
        created_by: user.id, title: draft.title.trim(), description: draft.description.trim(),
        opportunity_type: draft.opportunity_type, sport: draft.sport.trim() || null,
        location: draft.location.trim() || null, is_remote: draft.is_remote, status: "open",
        application_deadline: deadline ? deadline.toISOString() : null,
      };
      const { error: insertError } = await client.from("opportunities").insert(payload);
      if (insertError) throw insertError;
      setDraft({ title: "", description: "", opportunity_type: "job", sport: "", location: "", is_remote: false, application_deadline: "" });
      setShowForm(false);
      await load(client, user);
      setNotice("Opportunity published successfully.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to publish opportunity."); }
    finally { setSaving(false); }
  }

  async function apply(item) {
    if (!client || !user) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const message = (applicationDrafts[item.id] || "").trim();
      const { error: applyError } = await client.from("opportunity_applications").insert({
        opportunity_id: item.id, applicant_id: user.id, message, status: "submitted",
      });
      if (applyError) throw applyError;
      await load(client, user);
      setNotice("Your application has been submitted.");
    } catch (e) {
      setError(e instanceof Error && e.message.includes("duplicate") ? "You have already applied for this opportunity." : e instanceof Error ? e.message : "Unable to submit your application.");
    } finally { setSaving(false); }
  }

  async function updateApplication(application, status) {
    if (!client || !user) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const { error: updateError } = await client.from("opportunity_applications").update({ status })
        .eq("id", application.id).eq("opportunity_id", application.opportunity_id);
      if (updateError) throw updateError;
      await load(client, user);
      setNotice("Application status updated.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update application."); }
    finally { setSaving(false); }
  }

  async function updateOpportunity(item, status) {
    if (!client || !user) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const { error: updateError } = await client.from("opportunities").update({ status })
        .eq("id", item.id).eq("created_by", user.id);
      if (updateError) throw updateError;
      await load(client, user);
      setNotice(status === "closed" ? "Opportunity closed." : "Opportunity reopened.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update opportunity."); }
    finally { setSaving(false); }
  }

  const visible = rows.filter((item) => {
    const matchesText = [item.title, item.description, item.sport, item.location, item.owner?.full_name, item.owner?.username].filter(Boolean).join(" ").toLowerCase().includes(query.trim().toLowerCase());
    return matchesText && (typeFilter === "all" || item.opportunity_type === typeFilter);
  });

  return <div className="page-stack opportunities-page">
    <Heading eyebrow="SPORTS CAREERS & COLLABORATION" title="Opportunities" subtitle="Discover roles, trials, scholarships and collaborations—or publish an opportunity for the SPORTSLINK community."
      action={<button className="button button-primary" type="button" onClick={() => setShowForm((value) => !value)}><PlusCircle size={16}/>{showForm ? "Cancel" : "Post opportunity"}</button>} />
    {error && <p className="auth-error" role="alert">{error}</p>}
    {notice && <p className="inline-notice" role="status" aria-live="polite">{notice}</p>}
    {showForm && <form onSubmit={createOpportunity} className="content-card card settings-form">
      <h2>Publish an opportunity</h2>
      <div className="event-form-grid">
        <label className="settings-field">Title<input required minLength={3} maxLength={180} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. U-19 football trial" /></label>
        <label className="settings-field">Type<select value={draft.opportunity_type} onChange={(e) => setDraft({ ...draft, opportunity_type: e.target.value })}>{TYPES.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="settings-field">Sport<input maxLength={100} value={draft.sport} onChange={(e) => setDraft({ ...draft, sport: e.target.value })} placeholder="Football, cricket…" /></label>
        <label className="settings-field">Location<input maxLength={180} value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="City or venue" disabled={draft.is_remote} /></label>
        <label className="settings-field">Application deadline<input type="datetime-local" value={draft.application_deadline} onChange={(e) => setDraft({ ...draft, application_deadline: e.target.value })} /></label>
      </div>
      <label className="settings-field">Description<textarea required minLength={10} maxLength={5000} rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
      <label className="settings-field" style={{display:"flex",gap:8,alignItems:"center"}}><input type="checkbox" checked={draft.is_remote} onChange={(e) => setDraft({ ...draft, is_remote: e.target.checked, location: e.target.checked ? "" : draft.location })}/>Remote / online opportunity</label>
      <button className="button button-primary" type="submit" disabled={saving}>{saving ? "Publishing…" : "Publish opportunity"}</button>
    </form>}
    <div className="toolbar-row">
      <label className="settings-field" style={{flex:1}}>Search opportunities<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, sport, organization, or location"/></label>
      <label className="settings-field">Type<select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="all">All types</option>{TYPES.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button className="button button-secondary" type="button" onClick={() => client && user && load(client,user).catch((e) => setError(e.message))} disabled={saving}><RefreshCw size={15}/>Refresh</button>
    </div>
    {loading ? <div className="empty-state card" role="status"><Activity/><p>Loading opportunities…</p></div>
      : !visible.length ? <div className="empty-state card"><BriefcaseBusiness/><h2>No matching opportunities</h2><p>Try another search, or publish the first opportunity for your sport.</p></div>
      : <div className="page-stack">{visible.map((item) => {
        const mine = item.created_by === user?.id;
        const application = myApplications.get(item.id);
        const pastDeadline = item.application_deadline && new Date(item.application_deadline) <= new Date();
        const applications = applicationsByOpportunity.get(item.id) || [];
        return <article className="content-card card" key={item.id}>
          <div className="page-heading" style={{alignItems:"flex-start",gap:16}}>
            <div style={{minWidth:0,flex:1}}><span className="badge">{TYPES.find(([value]) => value === item.opportunity_type)?.[1] || "Opportunity"}</span><h2 style={{marginTop:8}}>{item.title}</h2><p>{item.description}</p></div>
            <span className="badge">{item.status === "open" ? "Open" : item.status === "closed" ? "Closed" : "Draft"}</span>
          </div>
          <p style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>{item.sport && <span className="badge"><Users size={13}/> {item.sport}</span>}{item.location && <span className="badge"><MapPin size={13}/> {item.location}</span>}{item.is_remote && <span className="badge">Remote</span>}<span className="badge"><CalendarClock size={13}/> Deadline: {dateLabel(item.application_deadline)}</span></p>
          <small>Posted by {mine ? "you" : item.owner?.full_name || item.owner?.username || "SPORTSLINK member"} · {dateLabel(item.created_at)}</small>
          {!mine && item.status === "open" && !pastDeadline && !application && <div style={{display:"grid",gap:8,marginTop:14}}><label className="settings-field">Message to the opportunity owner (optional)<textarea rows={2} maxLength={2000} value={applicationDrafts[item.id] || ""} onChange={(e) => setApplicationDrafts({ ...applicationDrafts, [item.id]: e.target.value })} placeholder="Briefly introduce yourself and your interest."/></label><button className="button button-primary" type="button" onClick={() => apply(item)} disabled={saving}><Send size={15}/>Apply</button></div>}
          {!mine && application && <p className="inline-notice" role="status">Your application: {application.status}</p>}
          {mine && <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}><button className="button button-secondary" type="button" disabled={saving} onClick={() => updateOpportunity(item,item.status === "open" ? "closed" : "open")}>{item.status === "open" ? "Close opportunity" : "Reopen opportunity"}</button><span className="badge">{applications.length} application{applications.length === 1 ? "" : "s"}</span></div>}
          {mine && applications.length > 0 && <div style={{display:"grid",gap:10,marginTop:14}}><h3>Applicants</h3>{applications.map((app) => <div className="content-card" style={{padding:12}} key={app.id}><strong>{app.applicant?.full_name || app.applicant?.username || "Applicant"}</strong><p>{app.message || "No message included."}</p><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><span className="badge">{app.status}</span>{app.status !== "withdrawn" && app.status !== "rejected" && <><button className="button button-secondary" type="button" disabled={saving} onClick={() => updateApplication(app,"reviewing")}>Review</button><button className="button button-secondary" type="button" disabled={saving} onClick={() => updateApplication(app,"shortlisted")}>Shortlist</button><button className="button button-secondary" type="button" disabled={saving} onClick={() => updateApplication(app,"rejected")}>Reject</button></>}</div></div>)}</div>}
        </article>;
      })}</div>}
  </div>;
}
