"use client";

import "./globals.css";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <head><title>Application Error | SPORTSLINK</title></head>
      <body>
        <main className="system-state card system-state-error" role="alert">
          <span className="system-state-icon system-state-error-icon" aria-hidden="true">
            <AlertTriangle size={25} />
          </span>
          <p className="eyebrow">SPORTSLINK · RECOVERY MODE</p>
          <h1>We lost our footing for a moment.</h1>
          <p>An unexpected app error stopped this screen from loading. Try again, or refresh after checking your connection.</p>
          <div className="system-state-actions">
            <button className="button button-primary" type="button" onClick={() => reset()}>
              <RefreshCw size={16} aria-hidden="true" /> Try again
            </button>
            <a className="button button-secondary" href="/">Return to home</a>
          </div>
        </main>
      </body>
    </html>
  );
}
