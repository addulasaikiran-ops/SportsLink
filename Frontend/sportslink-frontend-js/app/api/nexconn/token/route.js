import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message, status) {
  return NextResponse.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request) {
  const authorization = request.headers.get("authorization") || "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer) return jsonError("Authentication required.", 401);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser(bearer);
  const user = data?.user;
  if (error || !user) {
    return jsonError("Your SPORTSLINK session is invalid or expired.", 401);
  }

  const appKey = process.env.NEXT_PUBLIC_NEXCONN_APP_KEY;
  const appSecret = process.env.NEXCONN_APP_SECRET;
  const baseUrl = process.env.NEXCONN_API_BASE_URL?.trim().replace(/\/+$/, "");

  if (!appKey || !appSecret || !baseUrl) {
    return jsonError(
      "Nexconn is not configured. Set the app key, server-only app secret, and regional API base URL.",
      503,
    );
  }

  let apiUrl;
  try {
    apiUrl = new URL("/v4/auth/access-token/issue", baseUrl);
    if (apiUrl.protocol !== "https:") throw new Error("HTTPS is required");
  } catch {
    return jsonError("The configured Nexconn API base URL is invalid.", 503);
  }

  // Nexconn user IDs support letters and numbers. Removing UUID hyphens keeps
  // the mapping stable and within Nexconn's documented 64-byte limit.
  const userId = user.id.replace(/[^a-zA-Z0-9]/g, "");
  const metadata = user.user_metadata || {};
  const displayName = String(
    metadata.full_name || metadata.name || user.email?.split("@")[0] || "SPORTSLINK User",
  ).trim().slice(0, 64) || "SPORTSLINK User";
  const avatarUrl = metadata.avatar_url || metadata.picture;

  // Nexconn's Platform Chat API signature is SHA1(App Secret + Nonce + Timestamp).
  // Generate a fresh nonce and request ID for each request.
  const nonce = randomBytes(9).toString("hex"); // 18 characters
  const timestamp = String(Date.now());
  const signature = createHash("sha1")
    .update(appSecret + nonce + timestamp, "utf8")
    .digest("hex");

  const body = { userId, name: displayName };
  if (typeof avatarUrl === "string" && /^https:\/\//i.test(avatarUrl)) {
    body.avatarUrl = avatarUrl;
  }

  try {
    const upstream = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "App-Key": appKey,
        Nonce: nonce,
        Timestamp: timestamp,
        Signature: signature,
        "X-Request-ID": randomUUID().replace(/-/g, ""),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok || payload?.code !== 0 || typeof payload?.result?.accessToken !== "string") {
      // Avoid returning upstream internals or credentials to the client.
      console.error("Nexconn token issue failed", {
        status: upstream.status,
        code: payload?.code ?? null,
        requestId: upstream.headers.get("X-Request-ID"),
      });
      return jsonError("Nexconn could not issue a chat access token. Check the server configuration and Nexconn app region.", 502);
    }

    return NextResponse.json(
      { token: payload.result.accessToken },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (cause) {
    console.error("Nexconn token API request failed", {
      message: cause instanceof Error ? cause.message : "Unknown error",
    });
    return jsonError("Nexconn could not be reached. Try again shortly.", 502);
  }
}
