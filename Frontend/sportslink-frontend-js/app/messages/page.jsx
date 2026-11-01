import { MessagesPage as MessagingWorkspace } from "@/components/WorkspacePages";

export const metadata = {
  title: "Messages | SPORTSLINK",
  description: "Connect with athletes, coaches, clubs, and scouts on SPORTSLINK.",
};

export default function MessagesPage() {
  return (
    <main className="sl-messages-page">
      <MessagingWorkspace />
    </main>
  );
}
