"use client";

import { useEffect, useState } from "react";
import { Activity, Search, UserPlus, Users } from "lucide-react";
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

  async function loadProfiles(supabase) {
    setLoading(true);
    setError("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      let data;
      if (USE_SPRING_API) {
        data = await backendRequest("/api/profiles");
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

  return <div className="page-stack">
    <Heading
      eyebrow={isNetwork ? "BUILD YOUR CIRCLE" : "EXPAND YOUR HORIZON"}
      title={isNetwork ? "My Network" : "Discover"}
      subtitle={isNetwork ? "Public profiles visible to your account. Connection requests are not connected yet." : "Search public SPORTSLINK profiles."}
    />
    <div className="toolbar-row"><SearchBox value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isNetwork ? "Search public profiles" : "Search by name, sport, or expertise"}/>
      {isNetwork && <button className="button button-secondary" type="button" onClick={() => setQuery("")}>Clear</button>}
    </div>
    <div className="chip-row" role="group" aria-label="Filter by sport">{sports.map((item) => <button key={item} type="button" className={`chip ${sport === item ? "chip-active" : ""}`} aria-pressed={sport === item} onClick={() => setSport(item)}>{item}</button>)}</div>
    {isNetwork && <p className="inline-notice" role="status">Connection and invitation records are not available in the current database schema.</p>}
    {error && <div className="inline-notice" role="alert"><p>{error}</p><button className="button button-secondary" type="button" disabled={!client || loading} onClick={() => client && loadProfiles(client)}>{loading ? "Loading…" : "Retry"}</button></div>}
    {loading ? <div className="empty-state card" role="status"><Activity/><h3>Loading public profiles…</h3></div>
      : error ? null
        : filteredProfiles.length === 0 ? <div className="empty-state card"><Search/><h3>{profiles.length ? "No profiles match" : "No public profiles available"}</h3><p>{profiles.length ? "Try a different name, role, sport, or location." : "Only profiles visible under your account's current RLS policies appear here."}</p></div>
          : <div className="people-grid">{filteredProfiles.map((profile) => {
            const name = profile.full_name || profile.username || "SPORTSLINK Member";
            return <article className="person-card card" key={profile.id}>
              <div className="person-cover" />
              <ProfileAvatar profile={profile} name={name} />
              <div className="person-card-body">
                <h3>{name}</h3>
                {profile.headline && <p>{profile.headline}</p>}
                {(profile.sport || profile.role) && <small>{[profile.sport, profile.role].filter(Boolean).join(" · ")}</small>}
                <button className="button button-outline button-full" type="button" disabled title="Connection requests are not backed by a database table yet"><UserPlus size={15}/> Connect</button>
              </div>
            </article>;
          })}</div>}
  </div>;
}