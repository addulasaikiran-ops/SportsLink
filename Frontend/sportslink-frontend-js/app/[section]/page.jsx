import { SectionPage } from "@/components/SectionPage";
import { DirectoryPage } from "@/components/DirectoryPage";
import { BookmarksPage, MessagesPage, NotificationsPage, OpportunitiesPage, ProfilePage } from "@/components/WorkspacePages";
import { notFound } from "next/navigation";

const allowed = ["network","discover","opportunities","messages","notifications","profile","bookmarks","organizations","settings","events"];
const sectionTitles = {
  network: "My Network",
  discover: "Discover",
  opportunities: "Opportunities",
  messages: "Messages",
  notifications: "Notifications",
  profile: "My Profile",
  bookmarks: "Saved Items",
  organizations: "Organizations",
  settings: "Settings",
  events: "Events"
};
const sectionDescriptions = {
  network: "Manage your SPORTSLINK connections and grow your professional sports network.",
  discover: "Discover athletes, coaches, clubs, scouts and other professionals across sport.",
  opportunities: "Explore sporting careers, roles, internships and collaborations on SPORTSLINK.",
  messages: "Manage your private conversations with your SPORTSLINK connections.",
  notifications: "View updates and activity from your SPORTSLINK network.",
  profile: "Manage your SPORTSLINK member profile and professional sporting details.",
  bookmarks: "Review the SPORTSLINK posts and opportunities you have saved.",
  organizations: "Discover and manage sports clubs and organizations on SPORTSLINK.",
  settings: "Manage your SPORTSLINK account and preferences.",
  events: "Discover and manage events shared with the SPORTSLINK community."
};

export function generateStaticParams() { return allowed.map((section) => ({section})); }

export async function generateMetadata({ params }) {
  const { section } = await params;
  return { title: sectionTitles[section] || "Page Not Found", description: sectionDescriptions[section] || "Your SPORTSLINK member workspace.", robots: { index: false, follow: false } };
}

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
    case "bookmarks": return <BookmarksPage key={section} />;
    default: return <SectionPage key={section} section={section} />;
  }
}
