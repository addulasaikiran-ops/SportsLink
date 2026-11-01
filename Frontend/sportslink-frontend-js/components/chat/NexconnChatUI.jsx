"use client";

import { useEffect, useState } from "react";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
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
        chatApp = chatUiSdk.NCChatUIApplication.initialize({
          language: "en_US",
          hooks: {
            // Connect these hooks to authorized SPORTSLINK profile/group APIs before production.
            reqUserProfiles: async () => [],
            reqGroupProfiles: async () => [],
            reqSystemProfiles: async () => [],
            reqGroupMembers: async () => [],
          },
        });

        if (!chatApp) throw new Error("Nexconn Chat UI could not initialize.");
        chatApp.ready();

        const connection = await chatSdk.NCEngine.connect({ token: tokenData.token });
        if (!connection || !connection.isOk) throw new Error("Nexconn could not connect this account.");
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
