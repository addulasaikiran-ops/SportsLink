import { JoinedCommunityPage } from "@/components/JoinedCommunityPage";

export const metadata = {
  title: "Welcome to the Community",
  description: "Celebrate completing your SPORTSLINK profile and take your first step into the community.",
  robots: { index: false, follow: false }
};

export default function JoinedPage() {
  return <JoinedCommunityPage />;
}