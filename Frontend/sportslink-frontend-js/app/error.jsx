"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    document.title = "Something Went Wrong | SPORTSLINK";
    // Keep the technical detail in diagnostics, not on the public error page.
    if (error) console.error("SPORTSLINK page error:", error);
  }, [error]);

  return (
    <main className="system-state card system-state-error" role="alert">
      <span className="system-state-icon system-state-error-icon" aria-hidden="true">
        <AlertTriangle size={25} />
      </span>
      <p className="eyebrow">TEMPORARY SETBACK</p>
      <h1>We hit a bump in the road.</h1>
      <p>That page couldn't load right now. Your account is safe. Try loading it again, or return to the SPORTSLINK home page.</p>
      {error?.digest && <p className="system-state-reference">Reference: {error.digest}</p>}
      <div className="system-state-actions">
        <button className="button button-primary" type="button" onClick={() => reset()}>
          <RefreshCw size={16} aria-hidden="true" /> Try again
        </button>
        <Link className="button button-secondary" href="/">
          Back to home <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <p className="system-state-footnote">If you're offline, reconnect to the internet and then retry.</p>
    </main>
  );
}
