import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const INTENT_COOKIE = 'sportslink-google-signup-started';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/auth/callback',
};

function redirectAndClearCookie(path, origin) {
  const response = NextResponse.redirect(new URL(path, origin));
  response.cookies.set(INTENT_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 });
  return response;
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const isGoogleSignup = searchParams.get('flow') === 'google-signup';
  const requestedNext = searchParams.get('next') || '/home';
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/home';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (isGoogleSignup) {
        const cookieStore = await cookies();
        const startedAt = Number(cookieStore.get(INTENT_COOKIE)?.value);
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        const createdAt = user?.created_at ? Date.parse(user.created_at) : Number.NaN;

        // This button is signup-only. If Google resolves to an existing account,
        // revoke the just-created session instead of turning signup into sign-in.
        // A small tolerance accounts for clock skew between the app and Supabase.
        const validIntent = Number.isFinite(startedAt) && startedAt > 0;
        const validUserCreation = Number.isFinite(createdAt) && createdAt >= startedAt - 5000;
        if (!validIntent || userError || !user || !validUserCreation) {
          await supabase.auth.signOut();
          const errorPath = validIntent && !userError && user && Number.isFinite(createdAt)
            ? '/signup?error=google_existing_account'
            : '/signup?error=google_signup_session';
          return redirectAndClearCookie(errorPath, origin);
        }
      }

      const response = NextResponse.redirect(new URL(next, origin));
      if (isGoogleSignup) {
        response.cookies.set(INTENT_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 });
      }
      return response;
    }
  }

  if (isGoogleSignup) {
    return redirectAndClearCookie('/signup?error=google_signup_failed', origin);
  }

  return NextResponse.redirect(new URL('/login?error=confirmation', origin));
}
