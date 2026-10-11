import { NextResponse } from 'next/server';

const INTENT_COOKIE = 'sportslink-google-signup-started';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/auth/callback',
};

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(INTENT_COOKIE, String(Date.now()), {
    ...COOKIE_OPTIONS,
    maxAge: 10 * 60,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(INTENT_COOKIE, '', {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}
