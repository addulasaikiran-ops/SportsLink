# SPORTSLINK — JavaScript / React / Next.js

SPORTSLINK is a sports-professional networking platform built with Next.js App Router, React, JavaScript/JSX, and CSS. **This project intentionally uses JavaScript, not TypeScript.**

## Run in VS Code

1. Extract the ZIP and open the `sportslink-frontend-js` folder (the folder containing `package.json`).
2. Copy `.env.local.example` to `.env.local` in PowerShell:

   ```powershell
   Copy-Item .env.local.example .env.local
   ```

3. Install packages and start the app:

   ```powershell
   npm install
   npm run dev
   ```

4. Visit `http://localhost:3000`.

## Public pages

- `/` — landing page
- `/about` — about SPORTSLINK
- `/login` — Supabase email/password login
- `/signup` — Supabase account creation

## Workspace pages

`/home`, `/network`, `/discover`, `/opportunities`, `/messages`, `/notifications`, `/profile`, `/organizations`, `/events`, and `/settings` are protected by Supabase-backed middleware when environment variables are configured.

## Supabase backend

The app uses the Supabase project configured in `.env.local`. See [`docs/supabase-setup.md`](docs/supabase-setup.md) for Auth URL configuration and current integration status.

- Browser client: `lib/supabase/client.js`
- Server client: `lib/supabase/server.js`
- Session refresh / route protection: `middleware.js`
- Email confirmation callback: `app/auth/callback/route.js`

Only a publishable key is used in browser-facing code. Never add a Supabase `service_role` or secret key to this project or any `NEXT_PUBLIC_` variable. Database tables have row-level security; keep RLS enabled and verify policies before adding client-side database features.

The profile, Discover/My Network directory, Home feed and profile Follow buttons can optionally use the Spring Boot API by setting `NEXT_PUBLIC_USE_SPRING_API=true` in `.env.local`. Before enabling it, configure `SUPABASE_PUBLISHABLE_KEY` in the backend process environment and verify the profile/posts/follows endpoints against live Supabase rows and RLS policies. The default is `false`, which preserves the current direct-Supabase behavior.

## UI/UX standards

- Shared design system and page-specific guidance in `design-system/`.
- Keyboard skip link, visible focus, reduced-motion support, and accessible controls.
- Responsive public pages and workspace layout.
- Loading, error, and not-found UI.

## Integration status

**Implemented:** Supabase email/password signup and login, confirmation callback, cookie-backed session refresh, protected routes, RLS-filtered profile discovery, signed-in profile reads/updates, and a community feed with post creation. Those data screens can use direct Supabase access by default or the new optional Spring Boot API integration.

**Not connected yet:** connections, messaging, notifications, opportunities/applications, events, organizations, reactions, and comments. These routes show empty or unavailable states and do not display sample records or persist demo data.

The repository contains no database migrations or trigger definitions. The signup profile trigger and deployed RLS policies must be verified in the Supabase project before diagnosing missing profile rows or changing the database.

Before production deployment, test the production build, configure the deployed site's Auth redirect URLs, review RLS and grants, and verify all data access paths.
