import { SectionPage } from "@/components/SectionPage";
import { DirectoryPage } from "@/components/DirectoryPage";
import { MessagesPage, NotificationsPage, OpportunitiesPage, ProfilePage } from "@/components/WorkspacePages";
import { notFound } from "next/navigation";

const allowed = ["network","discover","opportunities","messages","notifications","profile","organizations","settings","events"];
export function generateStaticParams() { return allowed.map((section) => ({section})); }

export default async function Page({ params, searchParams }) {
  const { section } = await params;
  const search = await searchParams;
  if (!allowed.includes(section)) notFound();
  // `key` forces a fresh component (and fresh state) when navigating between sections.
  switch (section) {
    case "network":
    case "discover":
      return <DirectoryPage key={section} section={section} initialQuery={section === "discover" ? (search?.search || "") : ""} />;
    case "opportunities": return <OpportunitiesPage key={section} />;
    case "messages": return <MessagesPage key={section} />;
    case "notifications": return <NotificationsPage key={section} />;
    case "profile": return <ProfilePage key={section} />;
    default: return <SectionPage key={section} section={section} />;
  }
}
