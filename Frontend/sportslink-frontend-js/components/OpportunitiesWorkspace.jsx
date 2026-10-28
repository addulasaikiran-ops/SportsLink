"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, BriefcaseBusiness, CalendarDays, MapPin, RefreshCw, Search } from "lucide-react";
import { backendRequest } from "@/lib/api/backend";
import { Heading, Notice, SearchBox } from "@/components/shared";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function opportunityType(value) {
  return (value || "other").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function OpportunitiesWorkspace() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const data = await backendRequest("/api/opportunities");
      if (!Array.isArray(data)) throw new Error("The opportunities service returned an unexpected response.");
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't load opportunities. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return items;
    return items.filter((item) => [
      item.title, item.description, item.opportunity_type, item.sport, item.location,
      item.creator?.full_name, item.creator?.username, item.creator?.role
    ].some((value) => String(value || "").toLocaleLowerCase().includes(term)));
  }, [items, query]);

  return <div className="page-stack">
    <Heading eyebrow="OPPORTUNITIES" title="Find your next opportunity" subtitle="Explore sporting roles, trials, scholarships and collaborations shared by the SPORTSLINK community."
      action={<button className="button button-secondary" type="button" onClick={() => load({ quiet: true })} disabled={loading || refreshing} aria-label="Refresh opportunities"><RefreshCw size={15} className={refreshing ? "spin" : ""}/><span>Refresh</span></button>} />
    <div className="card" style={{ padding: "16px" }}>
      <SearchBox value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by role, sport, location or organization"/>
      <p style={{ color: "var(--muted)", fontSize: 12, margin: "10px 0 0" }} aria-live="polite">
        {loading ? "Loading available opportunities…" : `${filtered.length} ${filtered.length === 1 ? "opportunity" : "opportunities"} found`}
      </p>
    </div>
    {error && <div className="card" style={{ padding: 18 }}>
      <Notice>{error}</Notice>
      <button className="button button-primary" type="button" onClick={() => load()} disabled={loading}><RefreshCw size={15}/> Try again</button>
    </div>}
    {loading ? <div className="card empty-state" role="status"><Activity className="spin"/><p>Finding opportunities for you…</p></div>
      : !error && filtered.length === 0 ? <div className="card empty-state">
        <BriefcaseBusiness size={25}/>
        <h2>{items.length ? "No matching opportunities" : "Your next chapter starts here"}</h2>
        <p>{items.length ? "Try another keyword or clear your search." : "There aren't any opportunities to show yet. Check back soon as clubs and sports professionals share new roles."}</p>
        {query && <button className="button button-secondary" type="button" onClick={() => setQuery("")}>Clear search</button>}
      </div>
      : !error && <div className="opportunity-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 285px), 1fr))", gap: 14 }}>
        {filtered.map((item) => <article className="card" key={item.id} style={{ padding: 18, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 9px", borderRadius: 999, background: "#edf3ff", color: "#245ce5", fontSize: 11, fontWeight: 700 }}>
              <BriefcaseBusiness size={13}/>{opportunityType(item.opportunity_type)}
            </span>
            {item.status && <span style={{ fontSize: 10, color: item.status === "open" ? "#16794b" : "var(--muted)", background: item.status === "open" ? "#e8f8ef" : "#f1f3f7", padding: "5px 8px", borderRadius: 999 }}>{opportunityType(item.status)}</span>}
          </div>
          <div>
            <h2 style={{ margin: "0 0 7px", fontSize: 17, lineHeight: 1.35, overflowWrap: "anywhere" }}>{item.title || "Sports opportunity"}</h2>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 12, lineHeight: 1.6, overflowWrap: "anywhere" }}>{item.creator?.full_name || item.creator?.username || "SPORTSLINK member"}{item.creator?.role ? ` · ${opportunityType(item.creator.role)}` : ""}</p>
          </div>
          {item.description && <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap", overflowWrap: "anywhere", display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, color: "var(--muted)", fontSize: 12 }}>
            {item.sport && <span style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "6px 8px" }}>{item.sport}</span>}
            {item.location && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, border: "1px solid var(--line)", borderRadius: 8, padding: "6px 8px", maxWidth: "100%", overflowWrap: "anywhere" }}><MapPin size={13}/>{item.is_remote ? `Remote · ${item.location}` : item.location}</span>}
            {item.is_remote && !item.location && <span style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "6px 8px" }}>Remote</span>}
          </div>
          <div style={{ marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--muted)", fontSize: 11 }}><CalendarDays size={13}/>{item.application_deadline ? `Deadline ${formatDate(item.application_deadline)}` : `Posted ${formatDate(item.created_at) || "recently"}`}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#245ce5" }}>SPORTSLINK</span>
          </div>
        </article>)}
      </div>}
    <style jsx>{`
      @media (max-width: 620px) {
        .opportunity-list { grid-template-columns: minmax(0, 1fr) !important; }
      }
    `}</style>
  </div>;
}
