"use client";

import { useEffect, useState } from "react";
import { Activity, Building2, Check, Globe, MapPin, PlusCircle, RefreshCw, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Heading } from "./shared";

const ORG_FIELDS = "id,owner_id,name,description,sport,location,website_url,status,created_at,owner:profiles!organizations_owner_id_fkey(id,full_name,username,avatar_url,role)";
const ORG_TYPES = ["club", "sports_organization", "academy", "association", "other"];

export function OrganizationsPage() {
  const [client, setClient] = useState(null);
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [memberships, setMemberships] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState({ name: "", description: "", sport: "", location: "", website_url: "" });

  async function load(supabase, activeUser) {
    const { data, error: listError } = await supabase.from("organizations").select(ORG_FIELDS).order("created_at", { ascending: false }).limit(100);
    if (listError) throw listError;
    setOrganizations(data || []);
    const { data: mine, error: memberError } = await supabase.from("organization_members")
      .select("organization_id,status,role").eq("user_id", activeUser.id);
    if (memberError) throw memberError;
    setMemberships(new Map((mine || []).map((row) => [row.organization_id, row])));
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
        if (!data.user) throw new Error("Sign in to view organizations.");
        if (active) setUser(data.user);
        await load(supabase, data.user);
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Unable to load organizations."); }
      finally { if (active) setLoading(false); }
    }
    initialize();
    return () => { active = false; };
  }, []);

  async function createOrganization(event) {
    event.preventDefault();
    if (!client || !user) return;
    setError(""); setNotice("");
    if (draft.name.trim().length < 3) return setError("Organization name must be at least 3 characters.");
    if (draft.description.trim().length < 10) return setError("Add a short description of at least 10 characters.");
    if (draft.website_url.trim() && !/^https?:\/\//i.test(draft.website_url.trim())) return setError("Website must start with http:// or https://.");
    setSaving(true);
    try {
      const payload = { owner_id: user.id, name: draft.name.trim(), description: draft.description.trim(), sport: draft.sport.trim() || null, location: draft.location.trim() || null, website_url: draft.website_url.trim() || null, status: "active" };
      const { data, error: insertError } = await client.from("organizations").insert(payload).select("id").single();
      if (insertError) throw insertError;
      const { error: memberError } = await client.from("organization_members").insert({ organization_id: data.id, user_id: user.id, role: "owner", status: "active" });
      if (memberError) throw memberError;
      setDraft({ name: "", description: "", sport: "", location: "", website_url: "" });
      setShowForm(false);
      await load(client, user);
      setNotice("Organization created successfully.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create organization."); }
    finally { setSaving(false); }
  }

  async function joinOrganization(org) {
    if (!client || !user) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const { error: joinError } = await client.from("organization_members").insert({ organization_id: org.id, user_id: user.id, role: "member", status: "pending" });
      if (joinError) throw joinError;
      await load(client, user);
      setNotice("Membership request sent to the organization owner.");
    } catch (e) { setError(e instanceof Error && e.message.includes("duplicate") ? "You already have a membership record for this organization." : e instanceof Error ? e.message : "Unable to request membership."); }
    finally { setSaving(false); }
  }

  async function reviewMembership(member, status) {
    if (!client || !user) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const { error: updateError } = await client.from("organization_members").update({ status }).eq("organization_id", member.organization_id).eq("user_id", member.user_id);
      if (updateError) throw updateError;
      await load(client, user);
      setNotice(status === "active" ? "Membership approved." : "Membership declined.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update membership."); }
    finally { setSaving(false); }
  }

  const visible = organizations.filter((org) => [org.name, org.description, org.sport, org.location].filter(Boolean).join(" ").toLowerCase().includes(query.trim().toLowerCase()));

  return <div className="page-stack organizations-page">
    <Heading eyebrow="CLUBS & SPORTS ORGANIZATIONS" title="Organizations" subtitle="Discover clubs, academies and sports organizations. Create a home for your team and manage membership requests."
      action={<button className="button button-primary" type="button" onClick={() => setShowForm((value) => !value)}><PlusCircle size={16}/>{showForm ? "Cancel" : "Create organization"}</button>} />
    {error && <p className="auth-error" role="alert">{error}</p>}
    {notice && <p className="inline-notice" role="status" aria-live="polite">{notice}</p>}
    {showForm && <form onSubmit={createOrganization} className="content-card card settings-form">
      <h2>Create an organization</h2>
      <div className="event-form-grid">
        <label className="settings-field">Organization name<input required minLength={3} maxLength={160} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}/></label>
        <label className="settings-field">Sport<input maxLength={100} value={draft.sport} onChange={(e) => setDraft({ ...draft, sport: e.target.value })} placeholder="Football, cricket…"/></label>
        <label className="settings-field">Location<input maxLength={180} value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })}/></label>
        <label className="settings-field">Website<input type="url" value={draft.website_url} onChange={(e) => setDraft({ ...draft, website_url: e.target.value })} placeholder="https://example.org"/></label>
      </div>
      <label className="settings-field">About<textarea required minLength={10} maxLength={3000} rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}/></label>
      <button className="button button-primary" type="submit" disabled={saving}>{saving ? "Creating…" : "Create organization"}</button>
    </form>}
    <div className="toolbar-row"><label className="settings-field" style={{flex:1}}>Search organizations<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, sport, or location"/></label><button className="button button-secondary" type="button" disabled={saving} onClick={() => client && user && load(client,user).catch((e) => setError(e.message))}><RefreshCw size={15}/>Refresh</button></div>
    {loading ? <div className="empty-state card" role="status"><Activity/><p>Loading organizations…</p></div>
      : !visible.length ? <div className="empty-state card"><Building2/><h2>No organizations found</h2><p>Create an organization or try another search. No synthetic organization records are displayed.</p></div>
      : <div className="people-grid">{visible.map((org) => {
        const mine = org.owner_id === user?.id;
        const membership = memberships.get(org.id);
        const members = (membership?.status === "active" ? 1 : 0);
        return <article className="content-card card" key={org.id}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}><span className="avatar avatar-xl avatar-initials"><Building2 size={22}/></span><div style={{minWidth:0,flex:1}}><h2>{org.name}</h2><p>{org.description}</p></div><span className="badge">{org.status}</span></div>
          <p style={{display:"flex",gap:8,flexWrap:"wrap"}}>{org.sport && <span className="badge"><Users size={13}/> {org.sport}</span>}{org.location && <span className="badge"><MapPin size={13}/> {org.location}</span>}{org.website_url && <a className="badge" href={org.website_url} target="_blank" rel="noreferrer"><Globe size={13}/> Website</a>}</p>
          <small>Managed by {mine ? "you" : org.owner?.full_name || org.owner?.username || "SPORTSLINK member"}</small>
          {!mine && !membership && <button className="button button-primary" type="button" disabled={saving} onClick={() => joinOrganization(org)}>Request to join</button>}
          {!mine && membership?.status === "pending" && <span className="badge">Membership requested</span>}
          {!mine && membership?.status === "active" && <span className="badge"><Check size={13}/> Member</span>}
          {mine && <div style={{display:"grid",gap:8,marginTop:12}}><strong>Membership requests</strong>{/* Loaded on demand below to keep the default organization query small. */}<OwnerMemberships client={client} organization={org} onReview={reviewMembership} saving={saving}/></div>}
        </article>;
      })}</div>}
  </div>;
}

function OwnerMemberships({ client, organization, onReview, saving }) {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    client.from("organization_members").select("organization_id,user_id,role,status,created_at,profile:profiles!organization_members_user_id_fkey(full_name,username,sport,role)")
      .eq("organization_id", organization.id).eq("status", "pending").then(({data,error:queryError}) => {
        if (!active) return;
        if (queryError) setError(queryError.message); else setMembers(data || []);
      });
    return () => { active = false; };
  }, [client, organization.id]);
  if (error) return <p className="auth-error">{error}</p>;
  if (!members.length) return <small>No pending requests.</small>;
  return <div style={{display:"grid",gap:8}}>{members.map((member) => <div key={member.user_id} className="content-card" style={{padding:10}}><strong>{member.profile?.full_name || member.profile?.username || "Member"}</strong><div style={{display:"flex",gap:8,marginTop:8}}><button className="button button-secondary" type="button" disabled={saving} onClick={() => onReview(member,"active")}>Approve</button><button className="button button-secondary" type="button" disabled={saving} onClick={() => onReview(member,"declined")}>Decline</button></div></div>)}</div>;
}
