"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, CalendarDays, Globe, MapPin, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Heading } from "./shared";

const PROFILE_COLUMNS = "id,username,full_name,headline,bio,avatar_url,location,sport,role,skills,website_url,created_at";

function initials(name) {
  return name.trim().split(/\\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SL";
}

function websiteHref(value) {
  if (!value || typeof value !== "string") return "";
  try {
    const candidate = /^https?:\\/\\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

function formatMemberSince(value) {
  if (!value) return "";
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(timestamp)
    : "";
}

function formatPostDate(value) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(timestamp)
    : "";
}

function ProfileAvatar({ profile, name }) {
  return profile?.avatar_url
    ? <img className="avatar avatar-profile-large" src={profile.avatar_url} alt={`${name} profile`} />
    : <span className="avatar avatar-profile-large avatar-initials" aria-hidden="true">{initials(name)}</span>;
}

export function PublicProfilePage({ profileId }) {
  const [viewerId, setViewerId] = useState("");
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [postsError, setPostsError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");
      setPostsError("");
      setProfile(null);
      setPosts([]);

      try {
        const supabase = createClient();
        if (!supabase) throw new Error("Supabase is not configured for this deployment.");

        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authData.user) throw new Error("Sign in to view SPORTSLINK member profiles.");

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(PROFILE_COLUMNS)
          .eq("id", profileId)
          .maybeSingle();
        if (profileError) throw profileError;
        if (!profileData) throw new Error("This member profile is unavailable.");

        if (active) {
          setViewerId(authData.user.id);
          setProfile(profileData);
        }

        const { data: recentPosts, error: recentPostsError } = await supabase
          .from("posts")
          .select("id,content,created_at")
          .eq("author_id", profileId)
          .eq("visibility", "public")
          .order("created_at", { ascending: false })
          .limit(6);

        if (recentPostsError) {
          if (active) setPostsError("This profile is available, but public posts could not be loaded.");
        } else if (active) {
          setPosts(recentPosts || []);
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load this member profile.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => { active = false; };
  }, [profileId]);

  if (loading) {
    return <div className="page-stack"><Heading eyebrow="MEMBER PROFILE" title="Loading profile" subtitle="Loading real details from SPORTSLINK."/><div className="empty-state card" role="status"><Activity/><h2>Loading member profile…</h2></div></div>;
  }

  if (error || !profile) {
    return <div className="page-stack">
      <Heading eyebrow="MEMBER PROFILE" title="Profile unavailable" subtitle="SPORTSLINK shows profile details that are available under account access rules."/>
      <div className="inline-notice" role="alert"><p>{error || "This member profile is unavailable."}</p><Link className="button button-secondary" href="/discover"><ArrowLeft size={15}/> Back to Discover</Link></div>
    </div>;
  }

  const name = profile.full_name || profile.username || "SPORTSLINK Member";
  const skills = Array.isArray(profile.skills)
    ? profile.skills
    : typeof profile.skills === "string"
      ? profile.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
      : [];
  const website = websiteHref(profile.website_url);
  const memberSince = formatMemberSince(profile.created_at);

  return <div className="page-stack public-member-profile">
    <div className="profile-cover-large">
      <span className="cover-label"><UserRound size={15}/> MEMBER PROFILE</span>
    </div>

    <section className="profile-overview card">
      <ProfileAvatar profile={profile} name={name}/>
      <div className="profile-overview-actions">
        {viewerId === profile.id
          ? <Link className="button button-primary" href="/profile">Edit my profile</Link>
          : <Link className="button button-secondary" href="/discover"><ArrowLeft size={15}/> Back to Discover</Link>}
      </div>
      <div className="profile-overview-copy">
        <h1>{name}</h1>
        {profile.username && <p className="profile-headline">@{profile.username}</p>}
        {profile.headline && <p className="profile-headline">{profile.headline}</p>}
        {profile.location && <span className="profile-location"><MapPin size={14}/> {profile.location}</span>}
        {(profile.sport || profile.role) && <div className="profile-sports-tags">{profile.sport && <span>{profile.sport}</span>}{profile.role && <span>{profile.role.replaceAll("_", " ")}</span>}</div>}
        {website && <p className="profile-location"><Globe size={14}/><a href={website} target="_blank" rel="noopener noreferrer">{profile.website_url}</a></p>}
      </div>
    </section>

    <div className="profile-content-grid">
      <div className="profile-main-column">
        <section className="content-card card">
          <h2>About</h2>
          <p className="about-text">{profile.bio || "This member hasn’t added an About description yet."}</p>
        </section>

        <section className="content-card card">
          <h2>Profile details</h2>
          <dl className="stat-grid">
            {[
              ["Username", profile.username ? `@${profile.username}` : ""],
              ["Sport", profile.sport],
              ["Role", profile.role ? profile.role.replaceAll("_", " ") : ""],
              ["Location", profile.location],
              ["Member since", memberSince],
              ["Website", website ? profile.website_url : ""],
            ].filter(([, value]) => value).map(([label, value]) =>
              <div className="stat-cell" key={label}><dt>{label}</dt><dd>{label === "Website" ? <a href={website} target="_blank" rel="noopener noreferrer">{value}</a> : value}</dd></div>
            )}
          </dl>
          {!profile.username && !profile.sport && !profile.role && !profile.location && !memberSince && !website
            && <p className="about-text">No additional profile details have been added yet.</p>}
        </section>

        <section className="content-card card">
          <h2>Recent public posts</h2>
          {postsError && <p className="about-text" role="status">{postsError}</p>}
          {!postsError && posts.length === 0
            ? <p className="about-text">No public posts yet.</p>
            : <div className="profile-post-list">{posts.map((post) =>
              <article className="profile-post-item" key={post.id}>
                <p>{post.content || "Shared a photo or video."}</p>
                <small>{formatPostDate(post.created_at)}</small>
              </article>
            )}</div>}
        </section>
      </div>

      <aside className="profile-side-column">
        <section className="content-card card">
          <h3>Skills & expertise</h3>
          {skills.length
            ? <div className="skill-tags">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
            : <p className="about-text">No skills added yet.</p>}
        </section>
        <section className="content-card card">
          <h3>Member</h3>
          {memberSince && <p className="profile-location"><CalendarDays size={14}/> Joined {memberSince}</p>}
          <p className="about-text">This profile displays the member’s saved SPORTSLINK details and public posts. Email addresses and private account data are not shown.</p>
        </section>
      </aside>
    </div>
  </div>;
}
