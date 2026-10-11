# SPORTSLINK Supabase setup (JavaScript)

The frontend is configured for Supabase project `ozqitjwttigfpmnroeqi`. The application expects `public.profiles` and `public.posts` with RLS enabled. This repository contains no database migrations or trigger definitions, so the installed signup trigger and live RLS policies have not been verified from source.

Signup sends `full_name` and `role` in Supabase Auth user metadata. A database trigger must create the corresponding `public.profiles` row. Verify that trigger and the signed-in user's profile in the Supabase Dashboard before changing database policy or manually creating rows. The earlier home feed stored sample posts only in browser localStorage; those posts were never written to `public.posts`.

## 1. Configure local environment

From the folder containing `package.json`, copy the example environment file:

```powershell
Copy-Item .env.local.example .env.local
```

The example contains the project URL and a **publishable** key. Publishable keys are intended for browser apps; never put a Supabase `service_role` or secret key in a `NEXT_PUBLIC_` variable or in client-side code.

## 2. Install packages and start Next.js

```powershell
npm install
npm run dev
```

Restart `npm run dev` whenever you change `.env.local`.

## 3. Configure Supabase Auth URLs

Open the [project Auth URL Configuration](https://supabase.com/dashboard/project/ozqitjwttigfpmnroeqi/auth/url-configuration).

Set **Site URL** to:

```text
http://localhost:3000
```

Add this redirect URL to the allow list:

```text
http://localhost:3000/auth/callback
```

When deploying, set the production Site URL and add the production callback URL as well.

## 4. Test signup and login

1. Visit `http://localhost:3000/signup`.
2. Create an account with an email address you can access and a password of at least 8 characters.
3. If email confirmation is enabled, open the confirmation email and follow the link.
4. You should return through `/auth/callback` and land on `/home`.
5. Log out, then sign in again at `/login`.
6. Open the Supabase Dashboard → Authentication → Users and verify that the account exists. Then verify that its Auth user ID has a corresponding `public.profiles.id` row. If it does not, inspect the installed trigger and its database logs; do not disable RLS or create a profile for another user from the browser.

If the confirmation email doesn't arrive, check spam and the project's Auth email settings/rate limits. Do not disable confirmation just to hide an error in the UI.

## Current integration scope

- Real Supabase email/password signup and login.
- PKCE confirmation callback exchange and cookie-backed SSR session handling.
- Protected workspace routes via Next.js middleware.
- Logout through Supabase Auth.
- The workspace shell and profile page read the signed-in user's profile.
- The home feed reads `posts` with the related author profile; RLS controls visible rows.
- Authenticated users can create public text posts; the author ID comes from the current Supabase user.
- Search and discovery show only profile rows returned under the current RLS policies.

Connections, comments, reactions, messaging, notifications, opportunities, events, organizations, and settings are not connected to database tables yet. Those pages show empty or unavailable states rather than sample records. Profile and post visibility still depends on the project's deployed RLS policies; verify those policies in the Dashboard before production use.
