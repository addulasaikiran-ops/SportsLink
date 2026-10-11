import { PublicProfilePage } from "@/components/PublicProfilePage";

export default async function MemberProfileRoute({ params }) {
  const { id } = await params;
  return <PublicProfilePage profileId={id} />;
}
