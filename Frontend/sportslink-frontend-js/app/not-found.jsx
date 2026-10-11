import Link from "next/link";
import { Search } from "lucide-react";
export default function NotFound() {
  return <main className="system-state card">
    <span className="system-state-icon"><Search size={22}/></span>
    <p className="eyebrow">404 · OFF THE PITCH</p>
    <h1>We couldn't find that page.</h1>
    <p>The link may be outdated, or the page may have moved.</p>
    <Link className="button button-primary" href="/">Return to SPORTSLINK</Link>
  </main>;
}
