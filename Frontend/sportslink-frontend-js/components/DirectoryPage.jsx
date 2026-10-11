"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowUpRight, Compass, Search, Sparkles, UserPlus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { backendRequest } from "@/lib/api/backend";
import { Heading, SearchBox } from "./shared";

const USE_SPRING_API = process.env.NEXT_PUBLIC_USE_SPRING_API === "true";

const PROFILE_COLUMNS = "id,username,full_name,headline,avatar_url,sport,role,created_at";

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

  async function loadProfiles(supabase) {
    setLoading(true);
    setError("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

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
    <section className="directory-hero">
      <div className="directory-hero-copy">
        <p className="directory-hero-kicker"><Sparkles size={14}/>{isNetwork ? "YOUR SPORTING CIRCLE" : "MEET THE SPORTS COMMUNITY"}</p>
        <h1>{isNetwork ? <>Build your <span>network.</span></> : <>Discover your <span>next connection.</span></>}</h1>
        <p>{isNetwork
          ? (USE_SPRING_API ? "Find athletes, coaches, scouts and sports professionals. Follow members to stay close to their journey." : "Explore member profiles and find people who share your sport, goals and interests.")
          : "Find people by name, sport or expertise and explore the real profiles behind the SPORTSLINK community."}</p>
        <div className="directory-hero-note"><Users size={15}/><span>Real member profiles · Filter by sport · No sample listings</span></div>
      </div>
      <div className="directory-hero-art" aria-hidden="true"><span className="directory-orbit directory-orbit-one"/><span className="directory-orbit directory-orbit-two"/><span className="directory-hero-icon">{isNetwork ? <Users size={35}/> : <Compass size={35}/>}</span><span className="directory-art-dot directory-art-dot-one"/><span className="directory-art-dot directory-art-dot-two"/></div>
    </section>
    <section className="directory-controls card" aria-label="Search and filter members">
      <div className="directory-search-row">
        <SearchBox value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isNetwork ? "Search people by name, sport or role…" : "Search by name, sport or expertise…"}/>
        {isNetwork && <button className="button button-secondary directory-clear" type="button" onClick={() => { setQuery(""); setSport("All sports"); }}>Reset filters</button>}
        <span className="directory-result-count">{filteredProfiles.length} <small>{filteredProfiles.length === 1 ? "profile" : "profiles"}</small></span>
      </div>
      <div className="directory-filter-heading"><span>Explore by sport</span><small>{sports.length - 1} {sports.length - 1 === 1 ? "sport" : "sports"} represented</small></div>
      <div className="chip-row directory-sport-chips" role="group" aria-label="Filter by sport">{sports.map((item) => <button key={item} type="button" className={`chip ${sport === item ? "chip-active" : ""}`} aria-pressed={sport === item} onClick={() => setSport(item)}>{item}</button>)}</div>
    </section>
    {isNetwork && <div className="directory-capability-note"><UserPlus size={16}/><p>{USE_SPRING_API ? "Following is available where shown on a member card. Formal connection invitations are not available yet." : "Profile browsing is available now. Follow and connection requests will be added when the connection service is enabled."}</p></div>}
    {error && <div className="inline-notice directory-error" role="alert"><p>{error}</p><button className="button button-secondary" type="button" disabled={!client || loading} onClick={() => client && loadProfiles(client)}>{loading ? "Loading…" : "Retry"}</button></div>}
    {loading ? <div className="directory-loading card" role="status"><Activity/><h3>Finding your sports community…</h3><p>Loading profiles visible to your account.</p></div>
      : error ? null
        : filteredProfiles.length === 0 ? <div className="directory-empty card"><span className="directory-empty-icon"><Search size={24}/></span><h2>{profiles.length ? "No profiles match those filters" : "Your directory is waiting for its first members"}</h2><p>{profiles.length ? "Try another name, role or sport, or reset the filters to explore all available profiles." : "No public profiles are available under your current account access yet. New members will appear here when their profiles are available."}</p>{(query || sport !== "All sports") && <button className="button button-secondary" type="button" onClick={() => { setQuery(""); setSport("All sports"); }}>Clear search and filters <ArrowUpRight size={15}/></button>}</div>
          : <div className="people-grid directory-people-grid">{filteredProfiles.map((profile) => {
            const name = profile.full_name || profile.username || "SPORTSLINK Member";
            return <article className="person-card card directory-person-card" key={profile.id}>
              <div className="person-cover directory-person-cover"><span>{profile.sport || "SPORTSLINK MEMBER"}</span></div>
              <ProfileAvatar profile={profile} name={name} />
              <div className="person-card-body">
                <h3><Link href={`/members/${encodeURIComponent(profile.id)}`} className="author-profile-link">{name}</Link></h3>
                <p className="directory-member-headline">{profile.headline || "SPORTSLINK community member"}</p>
                {(profile.sport || profile.role) && <small className="directory-member-meta">{[profile.sport, profile.role].filter(Boolean).join(" · ")}</small>}
                <Link className="button button-primary button-full directory-view-profile" href={`/members/${encodeURIComponent(profile.id)}`}>View profile <ArrowUpRight size={14}/></Link>
                {USE_SPRING_API
                  ? <button className="button button-outline button-full directory-follow" type="button" disabled={followBusyId === profile.id} onClick={() => toggleFollow(profile.id)}><UserPlus size={15}/>{followBusyId === profile.id ? "Saving…" : followingIds.has(profile.id) ? "Following" : "Follow"}</button>
                  : <button className="button button-outline button-full directory-follow" type="button" disabled title="Follow and connection requests are not enabled in this deployment"><UserPlus size={15}/>Connect soon</button>}
              </div>
            </article>;
          })}</div>}
  </div>;
}