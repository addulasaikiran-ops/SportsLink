import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PRODUCTION_ORIGIN = 'https://sportslink.up.railway.app';

function getPublicOrigin(request) {
  const requestUrl = new URL(request.url);

  // Prefer an explicitly configured public origin. This avoids redirecting
  // users to the internal 0.0.0.0:8080 listener behind a reverse proxy.
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredOrigin) {
    try {
      const parsed = new URL(configuredOrigin);
      if (parsed.protocol === 'https:' || parsed.hostname === 'localhost') {
        return parsed.origin;
      }
    } catch {
      // Ignore invalid configuration and safely use the production origin.
    }
  }

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host') || requestUrl.host;

  if (host === 'sportslink.up.railway.app') return PRODUCTION_ORIGIN;
  if (host && !host.startsWith('0.0.0.0') && !host.startsWith('127.0.0.1')) {
    const protocol = forwardedProto === 'https' || host.includes('localhost') ? (forwardedProto || requestUrl.protocol.replace(':', '')) : 'https';
    return `${protocol}://${host}`;
  }

  // A stable safe fallback for production requests whose proxy headers expose
  // only the internal listener address.
  return PRODUCTION_ORIGIN;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const origin = getPublicOrigin(request);
  const code = searchParams.get('code');
  const requestedNext = searchParams.get('next') || '/onboarding';
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/onboarding';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL('/login?error=confirmation', origin));
}
