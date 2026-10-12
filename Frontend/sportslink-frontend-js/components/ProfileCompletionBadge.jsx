export function ProfileCompletionBadge({ completed, size = 16 }) {
  if (!completed) return null;

  // A blue seal with a white check, inspired by verification-style badges.
  // This indicates a completed SPORTSLINK profile, not verified identity.
  const badgeSize = Math.max(14, size);
  const points = [];
  const cx = 20;
  const cy = 20;
  const outer = 19.2;
  const inner = 16.8;
  const teeth = 12;
  for (let i = 0; i < teeth * 2; i += 1) {
    const angle = (-Math.PI / 2) + (i * Math.PI / teeth);
    const radius = i % 2 === 0 ? outer : inner;
    points.push(`${(cx + Math.cos(angle) * radius).toFixed(2)},${(cy + Math.sin(angle) * radius).toFixed(2)}`);
  }

  return (
    <svg
      className="profile-completion-badge"
      width={badgeSize}
      height={badgeSize}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Profile complete"
      title="Profile complete"
      focusable="false"
    >
      <polygon points={points.join(" ")} fill="#239AF0" />
      <path
        d="M10.8 20.6 16.5 26.1 29.5 13.6"
        stroke="#FFFFFF"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
