"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Bell, BriefcaseBusiness, Compass, Home, MessageCircle, Search, Settings, Trophy, Users, Building2, Menu, X, CalendarDays } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
const nav = [
  ["/home","Home",Home],["/network","My Network",Users],["/discover","Discover",Compass],
  ["/opportunities","Opportunities",BriefcaseBusiness],["/messages","Messaging",MessageCircle],
  ["/notifications","Notifications",Bell],["/organizations","Organizations",Building2],["/events","Events",CalendarDays],["/settings","Settings",Settings]
];
function MemberAvatar({ url, name, className }) {
  if (url) return <img className={className} src={url} alt=""/>;
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SL";
  return <span className={`${className} avatar-initials`} aria-hidden="true">{initials}</span>;
}
export function AppShell({children}) {
  const path = usePathname();
  const router = useRouter();
  const isPublic = path === "/" || path === "/login" || path === "/signup" || path === "/about" || path === "/onboarding";
  const [currentUser, setCurrentUser] = useState(null);
  const logoutInProgress = useRef(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  useEffect(() => {
    if (isPublic) {
      logoutInProgress.current = false;
      setIsLoggingOut(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      router.replace(`/login?setup=supabase&next=${encodeURIComponent(path || "/home")}`);
      return;
    }
    let active = true;
    const loadUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !user) {
        setCurrentUser(null);
        router.replace(`/login?next=${encodeURIComponent(path || "/home")}`);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role, sport, location, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      setCurrentUser({
        id: user.id,
        email: user.email,
        name: profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "SPORTSLINK Member",
        role: profile?.role || user.user_metadata?.role || "athlete",
        sport: profile?.sport || "",
        location: profile?.location || "",
        avatar: profile?.avatar_url || null,
      });
    };
    loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setCurrentUser(null);
        if (!isPublic && !logoutInProgress.current) router.replace(`/login?next=${encodeURIComponent(path || "/home")}`);
      } else {
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "SPORTSLINK Member",
          role: session.user.user_metadata?.role || "athlete",
          avatar: null,
        });
        queueMicrotask(loadUser);
      }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [isPublic, path, router]);
  useEffect(() => {
    const supabase = createClient();
    if (!currentUser?.id || !supabase) {
      setUnreadNotifications(0);
      return undefined;
    }
    let active = true;
    async function refreshUnreadCount() {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", currentUser.id)
        .eq("is_read", false);
      if (active && !error) setUnreadNotifications(count || 0);
    }
    refreshUnreadCount();
    const timer = setInterval(refreshUnreadCount, 15000);
    return () => { active = false; clearInterval(timer); };
  }, [currentUser?.id]);
  const [open,setOpen] = useState(false);
  const [search,setSearch] = useState("");
  const displayName = currentUser?.name || "SPORTSLINK Member";
  const displayRole = currentUser?.role ? currentUser.role.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase()) : "";
  function submitSearch(event) { if (event.key === "Enter" && search.trim()) router.push(`/discover?search=${encodeURIComponent(search.trim())}`); }

  async function handleLogout() {
    if (logoutInProgress.current) return;
    logoutInProgress.current = true;
    setIsLoggingOut(true);
    setCurrentUser(null);

    const supabase = createClient();
    try {
      if (supabase) {
        // Clear only this browser's session; avoid waiting for remote-wide revocation.
        await supabase.auth.signOut({ scope: "local" });
      }
    } catch (error) {
      // Always leave the protected workspace if auth cleanup reports a transient error.
      console.error("Unable to complete local sign-out cleanly.", error);
    } finally {
      router.replace("/");
      router.refresh();
    }
  }

  if (isPublic) return children;
  return <div className={`app-root ${path === "/messages" ? "app-root-messages" : ""}`}>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="topbar"><div className="topbar-inner">
      <button className="icon-button mobile-menu" onClick={()=>setOpen(!open)} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="primary-navigation">{open?<X/>:<Menu/>}</button>
      <Link href="/home" className="brand"><span className="brand-mark"><Activity size={22}/></span><span>SPORTS<span className="brand-accent">LINK</span></span></Link>
      <ThemeToggle compact />
      <label className="global-search" aria-label="Search SPORTSLINK"><Search size={17} aria-hidden="true"/><input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={submitSearch} placeholder="Search people, clubs, sports…" aria-label="Search people, clubs, and sports" autoComplete="off"/></label>
      <div className="topbar-actions"><Link href="/notifications" className="icon-button" aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} unread` : "Notifications"}><Bell size={20}/>{unreadNotifications>0&&<span className="notification-dot" aria-hidden="true"/>}</Link><Link href="/profile" className="mini-profile"><MemberAvatar url={currentUser?.avatar} name={displayName} className="avatar mini-profile-avatar"/><span><b>{displayName}</b><small>My profile</small></span></Link><button className="logout-button" onClick={handleLogout} disabled={isLoggingOut} title="Log out" aria-busy={isLoggingOut}>{isLoggingOut ? "Logging out…" : "Log out"}</button></div>
    </div></header>
    <div className="app-layout">
      <aside className={`sidebar ${open?"sidebar-open":""}`}>
        <div className="sidebar-profile card"><div className="cover-strip"/><MemberAvatar url={currentUser?.avatar} name={displayName} className="avatar avatar-lg profile-avatar"/><b className="profile-name">{displayName}</b><p>{[displayRole, currentUser?.sport].filter(Boolean).join(" · ")}</p><small>{currentUser?.location || currentUser?.email || "Complete your professional profile"}</small><Link className="sidebar-link-accent" href="/profile">View your profile →</Link></div>
        <nav className="side-nav" id="primary-navigation" aria-label="Primary navigation"><p className="nav-section-label">YOUR WORKSPACE</p>{nav.map(([href,label,Icon])=><Link key={href} href={href} onClick={()=>setOpen(false)} aria-current={path===href ? "page" : undefined} className={`nav-link ${path===href?"active":""}`}><Icon size={18}/><span>{label}</span>{href==="/notifications"&&unreadNotifications>0&&<span className="nav-count">{unreadNotifications>99?"99+":unreadNotifications}</span>}</Link>)}</nav>
        <div className="sidebar-promo card"><div className="promo-icon"><Trophy size={19}/></div><b>Take your career further</b><p>Discover opportunities built for your sporting journey.</p><Link href="/opportunities">Explore opportunities →</Link></div>
        <div className="sidebar-footer">✓ Built for the world of sport</div>
      </aside>
      {open&&<button className="mobile-backdrop" onClick={()=>setOpen(false)} aria-label="Close navigation"/>}
      <main className="main-content" id="main-content" tabIndex="-1">{children}</main>
      <aside className="right-rail">
        <div className="rail-card card"><div className="rail-heading"><h3>Community activity</h3></div><p>Posts and public profiles are shown only when available under your account's access.</p><Link href="/discover" className="rail-more">Discover public profiles →</Link></div>
        <footer className="site-footer"><div><Link href="/settings">About</Link><Link href="/settings">Help Center</Link><Link href="/settings">Privacy</Link><Link href="/settings">Terms</Link></div><p><b>SPORTSLINK</b> © {new Date().getFullYear()} · Connecting the world of sport.</p></footer>
      </aside>
    </div>
  </div>;
}
