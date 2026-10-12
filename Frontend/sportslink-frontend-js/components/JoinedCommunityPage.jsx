"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Sparkles, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

function safeDestination(raw) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/home";
  const path = raw.split(/[?#]/)[0];
  if (["/joined", "/onboarding", "/login", "/signup"].includes(path) || path.startsWith("/auth/")) return "/home";
  return raw;
}

export function JoinedCommunityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = safeDestination(searchParams.get("next") || "/home");
  const [member, setMember] = useState({ name: "", role: "", sport: "" });

  useEffect(() => {
    let active = true;
    async function loadMember() {
      const supabase = createClient();
      if (!supabase) return;
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        router.replace("/login?next=%2Fjoined");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,role,sport,onboarding_completed_at")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (!active) return;
      if (!profile?.onboarding_completed_at) {
        router.replace("/onboarding");
        return;
      }
      setMember({
        name: profile.full_name || auth.user.user_metadata?.full_name || auth.user.user_metadata?.name || "",
        role: profile.role || "",
        sport: profile.sport || ""
      });
    }
    loadMember();
    return () => { active = false; };
  }, [router]);

  const greeting = member.name.trim() ? member.name.trim().split(/\s+/)[0] : "there";

  return <main className="joined-page">
    <header className="joined-header">
      <Link href="/" className="joined-brand" aria-label="SPORTSLINK home"><img className="sportslink-logo" src="/sportslink_project_brief_final.png" alt="SPORTSLINK" /></Link>
      <ThemeToggle compact/>
    </header>
    <section className="joined-card">
      <div className="joined-symbol"><CheckCircle2 size={38} strokeWidth={2.3}/></div>
      <p className="joined-kicker"><Sparkles size={14} style={{display:"inline",verticalAlign:"-2px"}}/> YOU’RE OFFICIALLY IN</p>
      <h1>Welcome to the <span>SPORTSLINK</span> community{member.name ? `, ${greeting}` : ""}.</h1>
      <p className="joined-message">Your profile is ready. You’ve taken the first step toward meeting the people, teams and opportunities that can move your sporting journey forward.</p>
      {(member.role || member.sport) && <div className="joined-member-details">
        {member.role && <span>{member.role.replaceAll("_"," ")}</span>}
        {member.sport && <span>{member.sport}</span>}
        <span><CheckCircle2 size={13} style={{display:"inline",verticalAlign:"-2px",marginRight:5}}/> Profile complete</span>
      </div>}
      <div className="joined-actions">
        <button type="button" className="button" onClick={() => { router.replace(destination); router.refresh(); }}>Enter your community <ArrowRight size={17}/></button>
        <Link href="/home" className="joined-secondary"><Users size={16} style={{display:"inline",verticalAlign:"-3px",marginRight:5}}/> Explore SPORTSLINK</Link>
      </div>
      <p className="joined-footnote">Your next move starts with a connection. Let’s make it count.</p>
    </section>
  </main>;
}
