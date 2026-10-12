"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineSupport() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const updateStatus = () => setOffline(!window.navigator.onLine);
    updateStatus();
    window.addEventListener("offline", updateStatus);
    window.addEventListener("online", updateStatus);

    // The worker caches a lightweight recovery page for failed navigations.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
        console.warn("SPORTSLINK offline fallback could not be installed.", error);
      });
    }

    return () => {
      window.removeEventListener("offline", updateStatus);
      window.removeEventListener("online", updateStatus);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="offline-status-banner" role="status" aria-live="polite">
      <span className="offline-status-icon" aria-hidden="true"><WifiOff size={18} /></span>
      <span className="offline-status-copy">
        <strong>You're offline</strong>
        Your connection is unavailable. SPORTSLINK will reconnect when your internet returns.
      </span>
      <button type="button" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );
}
