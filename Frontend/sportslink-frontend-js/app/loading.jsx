export default function Loading() {
  return <div className="page-stack loading-page" role="status" aria-label="Loading SPORTSLINK">
    <div className="skeleton skeleton-heading" />
    <div className="skeleton-stats"><div className="skeleton skeleton-stat"/><div className="skeleton skeleton-stat"/><div className="skeleton skeleton-stat"/></div>
    <div className="skeleton skeleton-composer"/>
    <div className="skeleton skeleton-post"/>
    <span className="sr-only">Loading page content…</span>
  </div>;
}
