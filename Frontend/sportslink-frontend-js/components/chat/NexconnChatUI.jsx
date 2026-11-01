"use client";

import { useEffect, useState } from "react";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import { backendRequest } from "@/lib/api/backend";
import "./chat-ui.css";

export default function NexconnChatUI() {
  const [status, setStatus] = useState("connecting");
  const [message, setMessage] = useState("Connecting your secure SPORTSLINK session…");
  const [providerReady, setProviderReady] = useState(false);

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

        // SPORTSLINK's Nexconn app is registered in North America; configure the SDK
        // region explicitly so client routing matches NEXCONN_API_BASE_URL.
        chatSdk.NCEngine.initialize({ appKey, areaCode: chatSdk.AreaCode.NA });

        // Read the recipient from the public-profile Send Message link. SPORTSLINK
        // profile UUIDs map to Nexconn IDs by removing non-alphanumeric characters.
        const requestedMember = new URLSearchParams(window.location.search).get("member");
        const targetUserId = requestedMember ? requestedMember.replace(/[^a-zA-Z0-9]/g, "") : "";

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
        // The provider element must be mounted before openChannel is called.
        // Otherwise ChatUI has no active UI host and channel opening can fail.
        if (!cancelled) setProviderReady(true);
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        const connection = await chatSdk.NCEngine.connect({ token: tokenData.token });
        // Nexconn docs show both isOk and code === 0 across SDK quickstarts/versions.
        // Accept either documented success signal for compatibility.
        if (!(connection?.isOk === true || connection?.code === 0)) {
          throw new Error("Nexconn could not connect this account. Check the app key, region, and token configuration.");
        }
        // Open the requested one-to-one channel only after authentication succeeds.
        // The ChatUI implementation imports DirectChannelIdentifier from @nexconn/chat,
        // so construct it from the Chat SDK module (not @nexconn/chatui).
        if (targetUserId) {
          const currentUserId = String(chatApp.getCurrenUserId?.() || "").replace(/[^a-zA-Z0-9]/g, "");
          if (targetUserId === currentUserId) {
            throw new Error("You cannot start a conversation with your own account.");
          }
          const channelResult = await chatApp.openChannel(new chatSdk.DirectChannelIdentifier(targetUserId), true);
          // Some ChatUI SDK builds return no result object on success; only treat
          // explicit non-zero result codes as failures.
          if (channelResult && typeof channelResult.code === "number" && channelResult.code !== 0) {
            console.error("Nexconn openChannel failed", { code: channelResult.code });
            throw new Error(`Could not open this member’s conversation (chat error ${channelResult.code}). Please try again.`);
          }
          if (channelResult && channelResult.isOk === false && typeof channelResult.code !== "number") {
            console.error("Nexconn openChannel returned an unsuccessful result");
            throw new Error("Could not open this member’s conversation. Please try again.");
          }
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
      {providerReady ? <div className="sl-nexconn-chat-root" style={status === "ready" ? undefined : { position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}><nc-chat-ui-app-provider></nc-chat-ui-app-provider></div> : null}
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
        <div className="sl-nexconn-chat-ready-spacer" aria-hidden="true" />
      )}
    </section>
  );
}
