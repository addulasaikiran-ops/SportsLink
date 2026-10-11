import { Building2, CalendarDays, Settings } from "lucide-react";
import { Heading } from "./shared";

const sections = {
  organizations: {
    title: "Organizations",
    eyebrow: "ORGANIZATIONS",
    subtitle: "Clubs and organizations in the SPORTSLINK community.",
    icon: Building2,
    message: "No organizations available",
  },
  events: {
    title: "Sports Events",
    eyebrow: "EVENTS",
    subtitle: "Events published by the SPORTSLINK community.",
    icon: CalendarDays,
    message: "No events available",
  },
  settings: {
    title: "Settings",
    eyebrow: "ACCOUNT SETTINGS",
    subtitle: "Manage your SPORTSLINK account.",
    icon: Settings,
    message: "Settings are not connected yet",
  },
};

export function SectionPage({ section }) {
  const page = sections[section] || sections.settings;
  const Icon = page.icon;

  return <div className="page-stack">
    <Heading eyebrow={page.eyebrow} title={page.title} subtitle={page.subtitle}/>
    <div className="empty-state card"><Icon/><h2>{page.message}</h2><p>This page will display database-backed information when its Supabase integration is available. No sample records are shown.</p></div>
  </div>;
}