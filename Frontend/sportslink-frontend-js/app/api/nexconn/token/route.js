import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const authorization = request.headers.get("authorization") || "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const supabase = await createClient();
  const result = await supabase.auth.getUser(bearer);
  if (result.error || !result.data?.user) {
    return NextResponse.json({ error: "Your SPORTSLINK session is invalid or expired." }, { status: 401 });
  }

  const tokenEndpoint = process.env.NEXCONN_TOKEN_ENDPOINT;
  const serverSecret = process.env.NEXCONN_SERVER_SECRET;
  if (!tokenEndpoint || !serverSecret) {
    return NextResponse.json(
      { error: "Nexconn server authentication is not configured. Ask the administrator to set NEXCONN_TOKEN_ENDPOINT and NEXCONN_SERVER_SECRET." },
      { status: 503 },
    );
  }

  try {
    const upstream = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { Authorization: "Bearer " + serverSecret, "Content-Type": "application/json" },
      body: JSON.stringify({ userId: result.data.user.id }),
      cache: "no-store",
    });
    if (!upstream.ok) return NextResponse.json({ error: "The chat authentication service could not issue a token." }, { status: 502 });
    const payload = await upstream.json();
    if (typeof payload?.token !== "string" || !payload.token) {
      return NextResponse.json({ error: "The chat authentication service returned an invalid response." }, { status: 502 });
    }
    return NextResponse.json({ token: payload.token }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The chat authentication service could not be reached." }, { status: 502 });
  }
}
