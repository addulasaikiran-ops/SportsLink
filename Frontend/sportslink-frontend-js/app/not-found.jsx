import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="system-state card system-state-404">
      <div className="system-state-404-art" aria-hidden="true">
        <span>4</span><Search size={48} strokeWidth={1.6} /><span>4</span>
      </div>
      <p className="eyebrow">404 · OFF THE PITCH</p>
      <h1>Looks like this page missed the match.</h1>
      <p>The link may be outdated, the address may be incorrect, or the page may have moved. Let's get you back in the game.</p>
      <div className="system-state-actions">
        <Link className="button button-primary" href="/">
          Go to SPORTSLINK <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <button className="button button-secondary" type="button" onClick={() => window.history.back()}>
          <ArrowLeft size={16} aria-hidden="true" /> Go back
        </button>
      </div>
      <p className="system-state-footnote">SPORTSLINK · Your world of sport, connected.</p>
    </main>
  );
}
