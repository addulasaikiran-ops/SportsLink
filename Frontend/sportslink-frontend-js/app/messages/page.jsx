import NexconnChatUI from "@/components/chat/NexconnChatUI";

export const metadata = {
  title: "Messages | SPORTSLINK",
  description: "Connect with athletes, coaches, clubs, and scouts on SPORTSLINK.",
};

export default function MessagesPage() {
  return (
    <main className="sl-messages-page">
      <header className="sl-messages-heading">
        <div>
          <p className="sl-messages-eyebrow">SPORTSLINK NETWORK</p>
          <h1>Messages</h1>
          <p>Keep your team conversations and sports connections in one place.</p>
        </div>
      </header>
      <NexconnChatUI />
    </main>
  );
}
