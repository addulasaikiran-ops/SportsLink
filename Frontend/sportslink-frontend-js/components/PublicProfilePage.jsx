"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, Award, CalendarDays, GraduationCap, Globe, MapPin, Trophy, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Heading } from "./shared";

const PROFILE_COLUMNS = "id,username,full_name,headline,bio,avatar_url,cover_url,location,sport,role,skills,studied_at,website_url,created_at";

function initials(name) {
  return name.trim().split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SL";
}

function websiteHref(value) {
  if (!value || typeof value !== "string") return "";
  try {
    const trimmed = value.trim();
    const hasProtocol = trimmed.toLowerCase().startsWith("https://") || trimmed.toLowerCase().startsWith("http://");
    const candidate = hasProtocol ? trimmed : `https://${trimmed}`;
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

  const roleLabel = (profile.role || "member").replaceAll("_", " ");
  const heroHeadline = [roleLabel, profile.sport].filter(Boolean).join(" · ");

  return <div className="page-stack profile-page-redesign public-member-profile profile-reference-public">
    <section className="profile-hero-card card">
      {profile.cover_url && <img className="profile-cover-image" src={profile.cover_url} alt="" />}
      <div className="profile-hero-shade" aria-hidden="true" />
      <div className="profile-reference-kicker"><UserRound size={16}/><span>PUBLIC PROFILE</span></div>
      <div className="profile-hero-content">
        <div className="profile-reference-avatar-wrap">
          <div className="profile-reference-avatar-ring">
            <ProfileAvatar profile={profile} name={name}/>
          </div>
        </div>
        <div className="profile-reference-identity">
          <h1>{name}</h1>
          <p className="profile-reference-subtitle">{heroHeadline}</p>
          {profile.headline && <p className="profile-reference-headline">{profile.headline}</p>}
          {profile.location && <p className="profile-reference-location"><MapPin size={17}/>{profile.location}</p>}
          <div className="profile-reference-tags">
            {profile.sport && <span>{profile.sport}</span>}
            {profile.role && <span>{roleLabel}</span>}
          </div>
          {website && <p className="profile-reference-location"><Globe size={16}/><a href={website} target="_blank" rel="noopener noreferrer">{profile.website_url}</a></p>}
        </div>
        <div className="profile-reference-actions">
          {viewerId === profile.id
            ? <Link className="button button-primary profile-reference-edit-button" href="/profile">Edit profile</Link>
            : <Link className="button button-secondary profile-reference-edit-button" href="/discover"><ArrowLeft size={16}/> Discover members</Link>}
        </div>
      </div>
    </section>

    <div className="profile-reference-grid">
      <div className="profile-reference-main-column">
        <section className="profile-reference-card card">
          <h2><UserRound size={27}/> About</h2>
          <p className="profile-reference-about">{profile.bio || "This member hasn’t added an About description yet."}</p>
          <div className="profile-reference-divider"/>
          <h3><GraduationCap size={31}/> Education</h3>
          <p className="profile-reference-education">{profile.studied_at || "Education not added yet."}</p>
        </section>

        <section className="profile-reference-card card profile-reference-posts-card">
          <h2><Activity size={25}/> Recent public posts</h2>
          {postsError && <p className="profile-reference-empty" role="status">{postsError}</p>}
          {!postsError && posts.length === 0
            ? <p className="profile-reference-subtle">No public posts yet.</p>
            : <div className="profile-reference-post-list">{posts.map((post) =>
              <article className="profile-reference-post-item" key={post.id}>
                <p>{post.content || "Shared a photo or video."}</p>
                <small>{formatPostDate(post.created_at)}</small>
              </article>
            )}</div>}
        </section>

        <section className="profile-reference-card card">
          <h2><UserRound size={25}/> Profile details</h2>
          <dl className="profile-reference-details">
            {[
              ["Username", profile.username ? "@" + profile.username : ""],
              ["Sport", profile.sport],
              ["Role", roleLabel],
              ["Location", profile.location],
              ["Member since", memberSince],
              ["Website", website ? profile.website_url : ""],
            ].filter(([, value]) => value).map(([label, value]) =>
              <div className="profile-reference-detail-row" key={label}>
                <dt>{label}</dt>
                <dd>{label === "Website" ? <a href={website} target="_blank" rel="noopener noreferrer">{value}</a> : value}</dd>
              </div>
            )}
          </dl>
        </section>
      </div>

      <aside className="profile-reference-side-column">
        <section className="profile-reference-card card">
          <h2><Trophy size={28}/> Sports</h2>
          <div className="profile-reference-pill-list">
            {profile.sport && <span><Activity size={17}/>{profile.sport}</span>}
            {profile.role && <span><UserRound size={17}/>{roleLabel}</span>}
            {!profile.sport && !profile.role && <p className="profile-reference-empty">No sports details added yet.</p>}
          </div>
        </section>

        <section className="profile-reference-card card">
          <h2><Award size={28}/> Skills</h2>
          {skills.length
            ? <div className="profile-reference-skill-list">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
            : <p className="profile-reference-empty">No skills added yet.</p>}
        </section>

        <section className="profile-reference-card card profile-reference-member-card">
          <h2><CalendarDays size={25}/> Member</h2>
          <p className="profile-reference-subtle">{memberSince ? "Member since " + memberSince + "." : "A member of the SPORTSLINK community."}</p>
          <p className="profile-reference-subtle">Email addresses and private account details are never shown on public profiles.</p>
        </section>
      </aside>
    </div>
  </div>;
}
