"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, ArrowRight, CheckCircle2, GraduationCap, MapPin, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

const ROLE_OPTIONS = [
  ["athlete", "Athlete"],
  ["coach", "Coach"],
  ["scout", "Scout / Recruiter"],
  ["agent", "Agent / Sports Manager"],
  ["club", "Club / Team"],
  ["sports_organization", "Sports Organization"],
  ["medical", "Medical / Performance Specialist"],
  ["media", "Media / Creator"],
  ["trainer", "Trainer / Analyst"],
  ["other", "Other Sports Professional"],
];

const SPORTS = [
  "Cricket", "Football (Soccer)", "Basketball", "Volleyball", "Tennis",
  "Badminton", "Athletics", "Swimming", "Hockey", "Kabaddi", "Wrestling",
  "Boxing", "Rugby", "Table Tennis", "Chess", "Esports", "Gymnastics",
  "Weightlifting", "Martial Arts", "Cycling", "Other",
];

function safeDestination(raw) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/home";
  const path = raw.split("?")[0].split("#")[0];
  if (path === "/onboarding" || path === "/login" || path === "/signup" || path.startsWith("/auth/")) return "/home";
  return raw;
}

function splitLocation(value) {
  const parts = (value || "").split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 3) return { city: parts[0], region: parts.slice(1, -1).join(", "), country: parts[parts.length - 1] };
  return { city: parts[0] || "", region: "", country: parts[1] || "" };
}

function BrandHeader() {
  return <header className="onboarding-header">
    <Link href="/" className="public-brand" aria-label="SPORTSLINK home">
      <span className="public-brand-mark"><Activity size={22}/></span>
      <span>SPORTS<span>LINK</span></span>
    </Link>
    <ThemeToggle compact/>
  </header>;
}

export function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next") || "/home";
  const destination = safeDestination(requestedNext);
  const [client, setClient] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    full_name: "", username: "", role: "athlete", sport_choice: "", custom_sport: "",
    studied_at: "", location_city: "", location_region: "", location_country: "",
    headline: "", bio: "",
  });

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    setClient(supabase);

    async function load() {
      try {
        if (!supabase) throw new Error("SPORTSLINK authentication is not configured. Please try again later.");
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authData.user) {
          router.replace("/login?next=%2Fonboarding");
          return;
        }
        if (!active) return;
        setUser(authData.user);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id,username,full_name,headline,bio,location,sport,role,studied_at,onboarding_completed_at,profile_details_completed,website_url")
          .eq("id", authData.user.id)
          .maybeSingle();
        if (profileError) throw profileError;
        if (!active) return;

        if (profile?.profile_details_completed) {
          router.replace(destination);
          return;
        }

        const location = splitLocation(profile?.location || "");
        const existingSport = profile?.sport || "";
        setDraft({
          full_name: profile?.full_name || authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || "",
          username: profile?.username || "",
          role: ROLE_OPTIONS.some(([value]) => value === (profile?.role || authData.user.user_metadata?.role))
            ? (profile?.role || authData.user.user_metadata?.role)
            : "athlete",
          sport_choice: SPORTS.includes(existingSport) ? existingSport : (existingSport ? "Other" : ""),
          custom_sport: SPORTS.includes(existingSport) ? "" : existingSport,
          studied_at: profile?.studied_at || "",
          location_city: location.city,
          location_region: location.region,
          location_country: location.country,
          headline: profile?.headline || "",
          bio: profile?.bio || "",
        });
        setReady(true);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "We couldn't load your profile. Please try again.");
      } finally {
        if (active) setChecking(false);
      }
    }

    load();
    return () => { active = false; };
  }, [router, destination]);

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!client || !user) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    const fullName = draft.full_name.trim();
    const bio = draft.bio.trim();
    const username = draft.username.trim().toLowerCase();
    const sport = draft.sport_choice === "Other" ? draft.custom_sport.trim() : draft.sport_choice;
    if (fullName.length < 2) return setError("Enter your full name to continue.");
    if (!draft.role) return setError("Choose your role in sport.");
    if (!sport) return setError("Choose a sport to continue.");
    if (bio.length < 20) return setError("Tell the community a little about you in at least 20 characters.");
    if (!draft.location_city.trim() || !draft.location_country.trim()) return setError("Add your city and country so members can discover people near them.");
    if (username && !/^[a-z0-9_]{3,30}$/.test(username)) return setError("Username must be 3–30 characters using lowercase letters, numbers, and underscores.");

    const location = [draft.location_city.trim(), draft.location_region.trim(), draft.location_country.trim()].filter(Boolean).join(", ");
    setSaving(true);
    try {
      const payload = {
        id: user.id,
        full_name: fullName,
        username: username || null,
        role: draft.role,
        sport,
        studied_at: draft.studied_at.trim() || null,
        location,
        headline: draft.headline.trim(),
        bio,
        onboarding_completed_at: new Date().toISOString(),
        profile_details_completed: true,
      };
      const { error: saveError } = await client
        .from("profiles")
        .upsert(payload, { onConflict: "id" });
      if (saveError) {
        if (saveError.code === "23505") throw new Error("That username is already taken. Please choose another one.");
        throw saveError;
      }
      // Use a full navigation after the profile is persisted so the
      // post-onboarding welcome page always opens with a fresh auth/profile state.
      window.location.assign(`/joined?next=${encodeURIComponent(destination)}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "We couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function skipForNow() {
    setError("");
    if (!client || !user) {
      setError("Your session has expired. Please sign in again.");
      return;
    }
    setSaving(true);
    try {
      const fullName = draft.full_name.trim()
        || user.user_metadata?.full_name
        || user.user_metadata?.name
        || user.email?.split("@")[0]
        || "SPORTSLINK Member";
      const allowedRole = ROLE_OPTIONS.some(([value]) => value === draft.role) ? draft.role : "athlete";
      const { error: skipError } = await client.from("profiles").upsert({
        id: user.id,
        full_name: fullName,
        role: allowedRole,
        onboarding_completed_at: new Date().toISOString(),
        profile_details_completed: false,
      }, { onConflict: "id" });
      if (skipError) throw skipError;
      // Reload the destination after saving the skip state so middleware sees
      // the latest onboarding completion timestamp.
      window.location.assign(destination);
    } catch (skipError) {
      setError(skipError instanceof Error ? skipError.message : "We couldn't skip profile setup. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="public-site onboarding-site">
    <BrandHeader/>
    <main className="onboarding-main">
      <section className="onboarding-intro">
        <span className="onboarding-step"><Sparkles size={14}/> YOUR SPORTSLINK PROFILE <span>·</span> STEP 1 OF 1</span>
        <h1>Let’s get to know <span>you.</span></h1>
        <p>A few details help us connect you with the right people, teams and opportunities in sport.</p>
        <div className="onboarding-promise"><ShieldCheck size={16}/> Your profile details are saved securely to your SPORTSLINK account.</div>
      </section>

      {!ready ? <section className="onboarding-card onboarding-loading card" role={error ? "alert" : "status"}>
        {error ? <><span className="onboarding-loading-icon"><UserRound size={22}/></span><h2>We couldn’t load your profile</h2><p>{error}</p><button type="button" className="button onboarding-primary" onClick={() => window.location.reload()}>Try again <ArrowRight size={16}/></button></> :
          <><span className="onboarding-loading-icon"><Activity size={22}/></span><h2>{checking ? "Getting things ready…" : "Almost there…"}</h2><p>Preparing your member profile.</p></>}
      </section> : <form className="onboarding-card card" onSubmit={submit} noValidate>
        <div className="onboarding-card-heading">
          <div className="onboarding-card-icon"><UserRound size={21}/></div>
          <div><h2>Build your member profile</h2><p>Fields marked with * are required. You can update your profile later.</p></div>
        </div>

        {error && <p className="auth-error onboarding-error" role="alert">{error}</p>}

        <section className="onboarding-section">
          <div className="onboarding-section-title"><span>01</span><div><h3>About you</h3><p>Tell the community who you are.</p></div></div>
          <div className="onboarding-fields">
            <label className="onboarding-field onboarding-field-wide">Full name <span>*</span>
              <input autoComplete="name" maxLength={120} required value={draft.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Your name as you want it displayed"/>
            </label>
            <label className="onboarding-field">Username <small>Optional</small>
              <div className="onboarding-username"><span>@</span><input autoComplete="username" maxLength={30} value={draft.username} onChange={(e) => update("username", e.target.value)} placeholder="yourname"/></div>
              <em>3–30 lowercase letters, numbers or underscores.</em>
            </label>
            <label className="onboarding-field">Your role in sport <span>*</span>
              <select required value={draft.role} onChange={(e) => update("role", e.target.value)}>
                {ROLE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="onboarding-field onboarding-field-wide">About you <span>*</span>
              <textarea required rows={4} maxLength={500} value={draft.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Share your sporting journey, experience, goals or what you’re looking to connect about…" />
              <em>{draft.bio.length}/500 · At least 20 characters</em>
            </label>
            <label className="onboarding-field onboarding-field-wide">Professional headline <small>Optional</small>
              <input maxLength={120} value={draft.headline} onChange={(e) => update("headline", e.target.value)} placeholder="e.g. U-19 cricketer · Aspiring sports physiotherapist"/>
            </label>
          </div>
        </section>

        <section className="onboarding-section">
          <div className="onboarding-section-title"><span>02</span><div><h3>Your sport and education</h3><p>Help members understand your sporting background.</p></div></div>
          <div className="onboarding-fields">
            <label className="onboarding-field">Primary sport <span>*</span>
              <select required value={draft.sport_choice} onChange={(e) => update("sport_choice", e.target.value)}>
                <option value="">Select your sport</option>
                {SPORTS.map((sport) => <option key={sport} value={sport}>{sport}</option>)}
              </select>
            </label>
            <label className="onboarding-field">Studied at <small>Optional</small>
              <div className="onboarding-icon-input"><GraduationCap size={17}/><input maxLength={180} value={draft.studied_at} onChange={(e) => update("studied_at", e.target.value)} placeholder="School, college, university or academy"/></div>
            </label>
            {draft.sport_choice === "Other" && <label className="onboarding-field onboarding-field-wide">Your sport <span>*</span>
              <input required maxLength={100} value={draft.custom_sport} onChange={(e) => update("custom_sport", e.target.value)} placeholder="Enter your sport"/>
            </label>}
          </div>
        </section>

        <section className="onboarding-section">
          <div className="onboarding-section-title"><span>03</span><div><h3>Where you’re based</h3><p>Make it easier to find local connections and opportunities.</p></div></div>
          <div className="onboarding-fields">
            <label className="onboarding-field">City / town <span>*</span>
              <div className="onboarding-icon-input"><MapPin size={17}/><input autoComplete="address-level2" maxLength={100} required value={draft.location_city} onChange={(e) => update("location_city", e.target.value)} placeholder="Your city or town"/></div>
            </label>
            <label className="onboarding-field">State / region <small>Optional</small>
              <input autoComplete="address-level1" maxLength={100} value={draft.location_region} onChange={(e) => update("location_region", e.target.value)} placeholder="State or region"/>
            </label>
            <label className="onboarding-field onboarding-field-wide">Country <span>*</span>
              <input autoComplete="country-name" maxLength={100} required value={draft.location_country} onChange={(e) => update("location_country", e.target.value)} placeholder="Your country"/>
            </label>
          </div>
        </section>

        <div className="onboarding-actions">
          <div className="onboarding-private-note"><CheckCircle2 size={16}/><span>Complete these details to earn a blue profile star. You can finish later from your profile.</span></div>
          <div className="onboarding-action-buttons">
            <button type="button" className="button button-secondary onboarding-skip" onClick={skipForNow} disabled={saving}>{saving ? "Saving…" : "Skip for now"}</button>
            <button type="submit" className="button onboarding-primary" disabled={saving} aria-busy={saving}>{saving ? "Saving your profile…" : "Save profile & continue"} {!saving && <ArrowRight size={17}/>}</button>
          </div>
        </div>
        <p className="onboarding-account-note">Signed in as <strong>{user?.email}</strong></p>
      </form>}

      <footer className="onboarding-footer">SPORTSLINK <span>·</span> CONNECT. GROW. ACHIEVE.</footer>
    </main>
  </div>;
}
