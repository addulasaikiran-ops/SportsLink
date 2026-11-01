"use client";

import { useEffect, useState } from "react";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import { backendRequest } from "@/lib/api/backend";
import "./chat-ui.css";

export default function NexconnChatUI() {
  const [status, setStatus] = useState("connecting");
  const [message, setMessage] = useState("Connecting your secure SPORTSLINK session…");

  useEffect(() => {
    let cancelled = false;
    let chatApp;

    async function start() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setStatus("setup");
        setMessage("SPORTSLINK authentication is not configured in this environment.");
        return;
      }

      const sessionResult = await supabase.auth.getSession();
      const session = sessionResult?.data?.session;
      if (!session?.access_token) {
        setStatus("signin");
        setMessage("Sign in to SPORTSLINK to access your messages.");
        return;
      }

      const appKey = process.env.NEXT_PUBLIC_NEXCONN_APP_KEY;
      if (!appKey) {
        setStatus("setup");
        setMessage("Chat is not configured yet. Add the public Nexconn app key and configure the secure token endpoint.");
        return;
      }

      try {
        const tokenResponse = await fetch("/api/nexconn/token", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + session.access_token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });
        const tokenData = await tokenResponse.json().catch(() => ({}));
        if (!tokenResponse.ok || !tokenData.token) {
          throw new Error(tokenData.error || "Secure chat authentication is not available yet.");
        }

        const chatSdk = await import("@nexconn/chat");
        const chatUiSdk = await import("@nexconn/chatui");
        if (cancelled) return;

        chatSdk.NCEngine.initialize({ appKey });

        // Nexconn IDs use the same stable, hyphen-free Supabase UUID mapping
        // as the token endpoint. Fetch profiles only through SPORTSLINK's
        // authenticated API so profile visibility continues to obey backend RLS.
        let profileRowsPromise;
        const loadProfileRows = () => {
          if (!profileRowsPromise) {
            profileRowsPromise = Promise.all([
              backendRequest("/api/profiles"),
              backendRequest("/api/profiles/me").catch(() => null),
            ]).then(([others, current]) => {
              const rows = [...(Array.isArray(others) ? others : [])];
              if (current && typeof current === "object") rows.push(current);
              return rows;
            }).catch((error) => {
              profileRowsPromise = null;
              throw error;
            });
          }
          return profileRowsPromise;
        };

        chatApp = chatUiSdk.NCChatUIApplication.initialize({
          language: "en_US",
          hooks: {
            reqUserProfiles: async (userIds = []) => {
              if (!Array.isArray(userIds) || userIds.length === 0) return [];
              const requestedIds = new Set(userIds.map((id) => String(id)));
              const rows = await loadProfileRows();
              return rows.filter((profile) => {
                const mappedId = String(profile?.id || "").replace(/[^a-zA-Z0-9]/g, "");
                return mappedId && requestedIds.has(mappedId);
              }).map((profile) => ({
                userId: String(profile.id).replace(/[^a-zA-Z0-9]/g, ""),
                name: String(profile.full_name || profile.username || "SPORTSLINK member").slice(0, 64),
                ...(typeof profile.avatar_url === "string" && /^https:\/\//i.test(profile.avatar_url)
                  ? { avatarUrl: profile.avatar_url }
                  : {}),
              }));
            },
            // SPORTSLINK does not yet have a shared Nexconn group/system
            // identity mapping. Keep these empty rather than inventing IDs.
            reqGroupProfiles: async () => [],
            reqSystemProfiles: async () => [],
            reqGroupMembers: async () => [],
          },
        });

        if (!chatApp) throw new Error("Nexconn Chat UI could not initialize.");
        chatApp.ready();

        const connection = await chatSdk.NCEngine.connect({ token: tokenData.token });
        // The official Nexconn ChatUI Web quickstart checks the SDK result's isOk flag.
        if (!connection?.isOk) {
          throw new Error("Nexconn could not connect this account. Check the app key, region, and token configuration.");
        }
        if (!cancelled) {
          setStatus("ready");
          setMessage("");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(error?.message || "Chat could not be started. Please try again.");
        }
      }
    }

    start();
    return () => {
      cancelled = true;
      try { chatApp?.destroy?.(); } catch { /* SDK may still be initializing. */ }
    };
  }, []);

  const heading = status === "connecting" ? "Preparing your inbox"
    : status === "signin" ? "Sign in to continue"
    : status === "error" ? "Chat is temporarily unavailable"
    : "One quick setup step";

  return (
    <section className="sl-chat-card" aria-label="SPORTSLINK messages">
      {status !== "ready" ? (
        <div className="sl-chat-state" role={status === "error" ? "alert" : "status"}>
          <div className={"sl-chat-state-icon " + (status === "connecting" ? "is-loading" : "")} aria-hidden="true">
            {status === "connecting" ? "↻" : status === "signin" ? "🔒" : status === "error" ? "!" : "✦"}
          </div>
          <h2>{heading}</h2>
          <p>{message}</p>
          {status === "signin" ? <a className="sl-chat-action" href="/auth/login">Sign in</a> : null}
          {status === "error" ? <button className="sl-chat-action" onClick={() => window.location.reload()}>Try again</button> : null}
          {status === "setup" ? <a className="sl-chat-help-link" href="https://docs.nexconn.ai/">View Nexconn setup guide ↗</a> : null}
        </div>
      ) : (
        <div id="sl-nexconn-chat-root" className="sl-nexconn-chat-root">
          <nc-chat-ui-app-provider></nc-chat-ui-app-provider>
        </div>
      )}
    </section>
  );
}
