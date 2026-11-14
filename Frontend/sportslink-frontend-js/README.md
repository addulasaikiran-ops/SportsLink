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

## Chromium / Playwright end-to-end tests

The repository uses one pinned Playwright Test version and its bundled Chromium browser for browser automation. Tests live in `e2e/`; configuration is in `playwright.config.js`.

### Run locally

From `Frontend/sportslink-frontend-js`:

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

Playwright starts the Next.js development server automatically at `http://127.0.0.1:3000`. Public-page and anonymous-route tests run without Supabase credentials by checking the documented setup fallback. To run the backend API checks too, start Spring Boot in another terminal:

```bash
cd ../../Backend/sportslink-backend
bash ./gradlew bootRun
```

Then, in the frontend terminal:

```bash
API_BASE_URL=http://127.0.0.1:8080 npm run test:e2e
```

On PowerShell, set the variable with `$env:API_BASE_URL = "http://127.0.0.1:8080"` before running the test command.

### GitHub Actions

`.github/workflows/chromium-e2e.yml` builds the production frontend, starts the Spring Boot API, installs Chromium on the GitHub runner, and runs the browser/API smoke suite. HTML reports, JUnit output, failure screenshots, traces and backend logs are uploaded as a workflow artifact.

The initial suite intentionally uses no production Supabase credentials and does not create, modify or delete real user data. It verifies public routes, the unauthenticated protection redirects for workspace routes, the public API health endpoint and anonymous rejection by `GET /api/me`. Authenticated user journeys and write-operation tests should be added only against a dedicated non-production Supabase test project and dedicated test account.
