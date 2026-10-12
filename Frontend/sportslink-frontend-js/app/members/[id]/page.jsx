import { PublicProfilePage } from "@/components/PublicProfilePage";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: id ? "Member Profile" : "Member Not Found",
    description: "View a public sports profile on SPORTSLINK."
  };
}

export default async function MemberProfileRoute({ params }) {
  const { id } = await params;
  return <PublicProfilePage profileId={id} />;
}
