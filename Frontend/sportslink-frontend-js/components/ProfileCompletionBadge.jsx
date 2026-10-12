import { Star } from "lucide-react";

export function ProfileCompletionBadge({ completed, size = 14 }) {
  if (!completed) return null;
  return <Star
    className="profile-completion-badge"
    size={size}
    fill="currentColor"
    strokeWidth={2.25}
    role="img"
    aria-label="Profile complete"
    title="Profile complete"
  />;
}