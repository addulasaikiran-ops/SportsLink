import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const protectedRoots = new Set([
  '/home', '/network', '/discover', '/opportunities', '/messages',
  '/notifications', '/profile', '/organizations', '/settings', '/events', '/onboarding',
]);

function safeDestination(raw) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/home';
  const path = raw.split(/[?#]/)[0];
  if (path === '/onboarding' || path === '/login' || path === '/signup' || path.startsWith('/auth/')) return '/home';
  return raw;
}

function redirectTo(url, response) {
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach(({ name, value }) => redirect.cookies.set(name, value));
  return redirect;
}

function isProtectedPath(pathname) {
  for (const root of protectedRoots) {
    if (pathname === root || pathname.startsWith(`${root}/`)) return true;
  }
  return false;
}

export async function middleware(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const pathname = request.nextUrl.pathname;

  // Let public marketing pages render while the developer is configuring Supabase.
  // Protected pages also have a client-side configuration fallback in AppShell.
  if (!url || !key) {
    if (isProtectedPath(pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('setup', 'supabase');
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
    return redirectTo(loginUrl, response);
  }

  if (user && pathname !== '/auth/callback') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('id', user.id)
      .maybeSingle();
    const onboardingComplete = Boolean(profile?.onboarding_completed_at);

    if (!onboardingComplete && pathname !== '/onboarding') {
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = '/onboarding';
      onboardingUrl.search = '';
      const requestedPath = pathname + request.nextUrl.search;
      const destination = ['/','/about','/login','/signup'].includes(pathname) ? '/home' : requestedPath;
      onboardingUrl.searchParams.set('next', safeDestination(destination));
      return redirectTo(onboardingUrl, response);
    }

    if (onboardingComplete && pathname === '/onboarding') {
      const next = safeDestination(request.nextUrl.searchParams.get('next'));
      return redirectTo(new URL(next, request.url), response);
    }

    if (pathname === '/login' || pathname === '/signup') {
      const next = safeDestination(request.nextUrl.searchParams.get('next'));
      return redirectTo(new URL(next, request.url), response);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
