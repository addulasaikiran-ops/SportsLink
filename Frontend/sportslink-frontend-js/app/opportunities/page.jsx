import OpportunitiesWorkspace from "@/components/OpportunitiesWorkspace";

export const metadata = {
  title: "Opportunities | SPORTSLINK",
  description: "Explore sporting roles, trials, scholarships and collaborations on SPORTSLINK.",
  robots: { index: false, follow: false }
};

export default function OpportunitiesPage() {
  return <OpportunitiesWorkspace />;
}
