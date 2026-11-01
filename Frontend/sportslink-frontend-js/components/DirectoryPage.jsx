"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Search, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { backendRequest } from "@/lib/api/backend";
import { Heading, SearchBox } from "./shared";
import { ProfileCompletionBadge } from "@/components/ProfileCompletionBadge";

const USE_SPRING_API = process.env.NEXT_PUBLIC_USE_SPRING_API === "true";

const PROFILE_COLUMNS = "id,username,full_name,headline,avatar_url,sport,role,created_at,profile_details_completed,is_seed";

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SL";
}

function ProfileAvatar({ profile, name }) {
  return profile.avatar_url
    ? <img className="avatar avatar-xl person-avatar" src={profile.avatar_url} alt="" />
    : <span className="avatar avatar-xl person-avatar avatar-initials" aria-hidden="true">{initials(name)}</span>;
}

export function DirectoryPage({ section, initialQuery = "" }) {
  const isNetwork = section === "network";
  const [profiles, setProfiles] = useState([]);
  const [query, setQuery] = useState(initialQuery);
  const [sport, setSport] = useState("All sports");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [client, setClient] = useState(null);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [followBusyId, setFollowBusyId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [connectionRequests, setConnectionRequests] = useState(new Map());

  async function loadProfiles(supabase) {
    setLoading(true);
    setError("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      setCurrentUserId(user?.id || "");
      if (user?.id) {
        const { data: requests, error: requestsError } = await supabase.from("connection_requests")
          .select("id,requester_id,recipient_id,status,created_at")
          .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
        if (requestsError && requestsError.code !== "42P01") throw requestsError;
        const requestMap = new Map();
        for (const request of requests || []) {
          const otherId = request.requester_id === user.id ? request.recipient_id : request.requester_id;
          requestMap.set(otherId, request);
        }
        setConnectionRequests(requestMap);
      }

      let data;
      if (USE_SPRING_API) {
        const [profileData, follows] = await Promise.all([
          backendRequest("/api/profiles"),
          backendRequest("/api/follows?direction=following"),
        ]);
        data = profileData;
        setFollowingIds(new Set((follows || []).map((follow) => follow.following_id)));
      } else {
        let request = supabase
          .from("profiles")
          .select(PROFILE_COLUMNS)
          .order("created_at", { ascending: false })
          .limit(100);
        if (user) request = request.neq("id", user.id);

        const { data: profileData, error: profileError } = await request;
        if (profileError) throw profileError;
        data = profileData;
      }
      setProfiles(data || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load public profiles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const supabase = createClient();
    setClient(supabase);
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }
    loadProfiles(supabase);
  }, []);

  async function toggleFollow(profileId) {
    if (!USE_SPRING_API || followBusyId) return;
    setFollowBusyId(profileId);
    setError("");
    try {
      if (followingIds.has(profileId)) {
        await backendRequest(`/api/follows/${encodeURIComponent(profileId)}`, { method: "DELETE" });
        setFollowingIds((current) => new Set([...current].filter((id) => id !== profileId)));
      } else {
        await backendRequest(`/api/follows/${encodeURIComponent(profileId)}`, { method: "POST" });
        setFollowingIds((current) => new Set(current).add(profileId));
      }
    } catch (followError) {
      setError(followError instanceof Error ? followError.message : "Unable to update this follow.");
    } finally {
      setFollowBusyId("");
    }
  }

  async function sendConnectionRequest(profileId) {
    if (!client || !currentUserId || followBusyId) return;
    setFollowBusyId(profileId); setError("");
    try {
      const existing = connectionRequests.get(profileId);
      if (existing?.recipient_id === currentUserId && existing.status === "pending") {
        const { error: updateError } = await client.from("connection_requests").update({ status: "accepted" }).eq("id", existing.id);
        if (updateError) throw updateError;
        setConnectionRequests((current) => new Map(current).set(profileId, { ...existing, status: "accepted" }));
      } else if (!existing) {
        const { data, error: insertError } = await client.from("connection_requests")
          .insert({ requester_id: currentUserId, recipient_id: profileId, status: "pending" })
          .select("id,requester_id,recipient_id,status,created_at").single();
        if (insertError) throw insertError;
        setConnectionRequests((current) => new Map(current).set(profileId, data));
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update this connection request.");
    } finally { setFollowBusyId(""); }
  }

  async function declineConnectionRequest(profileId) {
    if (!client || followBusyId) return;
    const existing = connectionRequests.get(profileId);
    if (!existing || existing.recipient_id !== currentUserId || existing.status !== "pending") return;
    setFollowBusyId(profileId); setError("");
    try {
      const { error: updateError } = await client.from("connection_requests").update({ status: "declined" }).eq("id", existing.id);
      if (updateError) throw updateError;
      setConnectionRequests((current) => new Map(current).set(profileId, { ...existing, status: "declined" }));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to decline this request."); }
    finally { setFollowBusyId(""); }
  }

  const normalizedQuery = query.trim().toLowerCase();
  const visibleProfiles = profiles.filter((profile) =>
    [profile.full_name, profile.username, profile.headline, profile.sport, profile.role]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
  const sports = ["All sports", ...new Set(profiles.map((profile) => profile.sport).filter(Boolean))];
  const filteredProfiles = visibleProfiles.filter((profile) => sport === "All sports" || profile.sport === sport);

  return <div className={`page-stack directory-page ${isNetwork ? "network-page" : "discover-page"}`}>
    <Heading
      eyebrow={isNetwork ? "BUILD YOUR CIRCLE" : "EXPAND YOUR HORIZON"}
      title={isNetwork ? "My Network" : "Discover"}
      subtitle={isNetwork
        ? "Discover athletes, coaches, scouts and sports professionals, then build your network."
        : "Search public SPORTSLINK profiles and send connection invitations."}
    />
    <div className="toolbar-row directory-toolbar"><SearchBox value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isNetwork ? "Search public profiles" : "Search by name, sport, or expertise"}/>
      {isNetwork && <button className="button button-secondary directory-clear" type="button" onClick={() => setQuery("")}>Clear</button>}
    </div>
    <div className="chip-row directory-sport-chips" role="group" aria-label="Filter by sport">{sports.map((item) => <button key={item} type="button" className={`chip ${sport === item ? "chip-active" : ""}`} aria-pressed={sport === item} onClick={() => setSport(item)}>{item}</button>)}</div>

    {error && <div className="inline-notice directory-error" role="alert"><p>{error}</p><button className="button button-secondary" type="button" disabled={!client || loading} onClick={() => client && loadProfiles(client)}>{loading ? "Loading…" : "Retry"}</button></div>}
    {loading ? <div className="empty-state card" role="status"><Activity/><h3>Loading public profiles…</h3></div>
      : error ? null
        : filteredProfiles.length === 0 ? <div className="empty-state card"><Search/><h3>{profiles.length ? "No profiles match" : "No public profiles available"}</h3><p>{profiles.length ? "Try a different name, role, sport, or location." : "Only profiles visible under your account's current RLS policies appear here."}</p></div>
          : <div className="people-grid directory-people-grid">{filteredProfiles.map((profile) => {
            const name = profile.full_name || profile.username || "SPORTSLINK Member";
            return <article className="person-card card directory-person-card" key={profile.id}>
              <div className="person-cover directory-person-cover" />
              <ProfileAvatar profile={profile} name={name} />
              <div className="person-card-body">
                <h3><Link href={`/members/${encodeURIComponent(profile.id)}`} className="author-profile-link">{name}<ProfileCompletionBadge completed={profile.profile_details_completed} />{profile.is_seed && <span className="demo-bot-badge">Demo Bot</span>}</Link></h3>
                {profile.headline && <p className="directory-member-headline">{profile.headline}</p>}
                {(profile.sport || profile.role) && <small className="directory-member-meta">{[profile.sport, profile.role].filter(Boolean).join(" · ")}</small>}
                <Link className="button button-primary button-full directory-view-profile" href={`/members/${encodeURIComponent(profile.id)}`}>View profile</Link>
                {(() => {
                  const request = connectionRequests.get(profile.id);
                  const incoming = request?.recipient_id === currentUserId && request.status === "pending";
                  const outgoing = request?.requester_id === currentUserId && request.status === "pending";
                  const connected = request?.status === "accepted";
                  return <div style={{display:"grid",gap:6}}>
                    <button className="button button-outline button-full directory-follow" type="button" disabled={followBusyId === profile.id || outgoing || connected || (request && request.status === "declined")} onClick={() => sendConnectionRequest(profile.id)}>
                      <UserPlus size={15}/>{followBusyId === profile.id ? "Saving…" : incoming ? "Accept request" : outgoing ? "Request sent" : connected ? "Connected" : request?.status === "declined" ? "Request declined" : "Connect"}
                    </button>
                    {incoming && <button className="button button-secondary button-full" type="button" disabled={followBusyId === profile.id} onClick={() => declineConnectionRequest(profile.id)}>Decline request</button>}
                  </div>;
                })()}
              </div>
            </article>;
          })}</div>}
  </div>;
}