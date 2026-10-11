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

- Real Supabase email/password signup and login, PKCE confirmation callback, cookie-backed SSR sessions, protected routes, and logout.
- Profiles and public posts are stored in Supabase; profile edits and password changes save through Supabase Auth/Postgres.
- Photo and video attachments (up to five per post and 50 MB per file) are uploaded to the private `post-media` Storage bucket. Only a post's author or viewers allowed by the post visibility policy can request a signed media URL.
- Event creation, listing, and cancellation are backed by `public.events`; the creator is recorded from the authenticated user, and RLS restricts edits/cancellations to that creator.
- Search/discovery and feed visibility continue to rely on deployed Supabase row-level security policies.
- Reactions, comments, messaging, notifications, opportunities, and organizations are still not fully connected to interactive database-backed pages. Do not treat the UI as production-ready for those workflows until they are implemented and tested.
