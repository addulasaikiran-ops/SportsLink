# SPORTSLINK — Repository Audit & Verified Facts

> Audit basis: GitHub main, inspected through the recursive Git tree and source files on 2026-11-01. This is repository evidence, not runtime telemetry. Line numbers refer to the named files and can shift with later commits.

## Audit method and repository counts

| Fact | Result | Evidence / method | Status |
|---|---:|---|---|
| Tracked files | 189 | Recursive Git tree; count entries with type=blob. | VERIFIED |
| Tree directories | 63 | Same recursive tree; count entries with type=tree. | VERIFIED |
| Git tree entries | 252 | 189 blobs + 63 tree entries. | VERIFIED |
| Frontend files | 129 | Tree paths under Frontend/sportslink-frontend-js/. | VERIFIED |
| Backend files | 42 | Tree paths under Backend/sportslink-backend/. | VERIFIED |
| Workflow files | 4 | Tree paths under .github/workflows/. | VERIFIED |
| App Router page modules | 13 | Enumerated app/**/page.jsx and page.js. | VERIFIED |
| Dynamic workspace slugs | 10 | Allowlist in app/[section]/page.jsx. | VERIFIED |
| Concrete page paths if dynamic slugs expanded | 22 | 12 explicit page paths + 10 dynamic section paths; not 22 files. | VERIFIED |
| App Router route modules | 3 | Enumerated app/**/route.js. | VERIFIED |
| SQL migrations | 14 | All *.sql under both migration directories. | VERIFIED |
| Backend API operations | 29 | Mapping annotations in 10 Java controller files. | VERIFIED |
| Backend test source files | 1 | SportslinkBackendApplicationTests.java; no frontend test/spec suffixes found. | VERIFIED |

**Counting note:** 189 is a Git-tree tracked-file count, not a local find count. Generated or ignored files are not included.

## Stack and versions

### Frontend

Evidence: Frontend/sportslink-frontend-js/package.json and package-lock.json (lockfileVersion 3).

| Package | Manifest | Resolved |
|---|---|---|
| Next.js | ^15.1.0 | 15.5.27 |
| React | ^19.0.0 | 19.3.0 |
| React DOM | ^19.0.0 | 19.3.0 |
| @supabase/ssr | 0.12.7 | 0.12.7 |
| @supabase/supabase-js | 2.117.1 | 2.117.1 |
| GSAP | ^3.15.0 | 3.15.0 |
| @gsap/react | ^2.1.2 | Lockfile package |
| lucide-react | ^0.468.0 | 0.468.0 |
| lit | ^3.3.2 | Lockfile package |
| @nexconn/chat | ^26.2.1 | 26.2.1 |
| @nexconn/chatui | ^26.2.5 | 26.2.5 |
| @nexconn/engine | ^26.2.1 | 26.2.1 |

- Frontend is JavaScript / JSX; Frontend/sportslink-frontend-js/README.md says it intentionally uses JavaScript, not TypeScript.
- CI uses Node 22 for frontend CI, Node 20 for Android APK and demo seed workflows.
- Package scripts: dev, build, start, seed:demo, seed:cleanup.

### Backend

Evidence: Backend/sportslink-backend/build.gradle, gradle/wrapper/gradle-wrapper.properties, .github/workflows/backend-ci.yml.

- Java toolchain 25.
- Spring Boot Gradle plugin 4.1.1.
- Gradle wrapper 9.7.1.
- Dependency management plugin 1.1.7.
- Spring starters: Web MVC, Security, OAuth2 Resource Server, Validation, Jackson.
- Test starters: Security Test, Web MVC Test, Validation Test; JUnit Platform launcher at test runtime.
- Test task uses JUnit Platform.

## Frontend route inventory

Evidence: page modules under Frontend/sportslink-frontend-js/app/. Dynamic section allowlist is defined in app/[section]/page.jsx.

| Route | Module | Description |
|---|---|---|
| / | app/page.jsx | Public landing |
| /about | app/about/page.jsx | About |
| /login | app/login/page.jsx | Login |
| /signup | app/signup/page.jsx | Signup |
| /privacy | app/privacy/page.jsx | Privacy policy |
| /home | app/home/page.jsx | Member home feed |
| /members/[id] | app/members/[id]/page.jsx | Member profile |
| /messages | app/messages/page.jsx | Nexconn chat UI |
| /opportunities | app/opportunities/page.jsx | Opportunities wrapper |
| /invite | app/invite/page.jsx | Invite members |
| /joined | app/joined/page.jsx | Joined/community welcome |
| /onboarding | app/onboarding/page.jsx | Profile onboarding |
| /[section] | app/[section]/page.jsx | Dynamic section route with 10 allowed slugs |

Dynamic section slugs: network, discover, opportunities, messages, notifications, profile, bookmarks, organizations, settings, events.

Additional App Router modules:
- Route handlers: POST /api/nexconn/token, GET /auth/callback, and the sportslink-icon.png asset route.
- Metadata/system modules: manifest.js, robots.js, sitemap.js, error.jsx, global-error.jsx, loading.jsx, not-found.jsx, layout.jsx.

## Backend API inventory

Evidence: class and method mapping annotations in controller files under Backend/sportslink-backend/src/main/java/com/sportslink/sportslink_backend/. Unless marked public, each operation requires a JWT because SecurityConfig.java permits only OPTIONS and /api/health without authentication.

| Method | Path | Auth | Controller |
|---|---|---:|---|
| GET | /api/health | No | HealthController |
| GET | /api/me | Yes | MeController |
| GET | /api/profiles | Yes | ProfileController |
| GET | /api/profiles/me | Yes | ProfileController |
| PATCH | /api/profiles/me | Yes | ProfileController |
| GET | /api/posts | Yes | PostController |
| POST | /api/posts | Yes | PostController |
| GET | /api/posts/{postId}/comments | Yes | PostInteractionController |
| POST | /api/posts/{postId}/comments | Yes | PostInteractionController |
| GET | /api/posts/{postId}/reactions | Yes | PostInteractionController |
| PUT | /api/posts/{postId}/reaction | Yes | PostInteractionController |
| DELETE | /api/posts/{postId}/reaction | Yes | PostInteractionController |
| GET | /api/follows | Yes | FollowController |
| POST | /api/follows/{profileId} | Yes | FollowController |
| DELETE | /api/follows/{profileId} | Yes | FollowController |
| GET | /api/notifications | Yes | NotificationController |
| PATCH | /api/notifications/{notificationId}/read | Yes | NotificationController |
| DELETE | /api/notifications/{notificationId} | Yes | NotificationController |
| GET | /api/opportunities | Yes | OpportunityController |
| POST | /api/opportunities | Yes | OpportunityController |
| GET | /api/applications/me | Yes | OpportunityApplicationController |
| GET | /api/opportunities/{opportunityId}/applications | Yes | OpportunityApplicationController |
| POST | /api/opportunities/{opportunityId}/applications | Yes | OpportunityApplicationController |
| PATCH | /api/applications/{applicationId}/status | Yes | OpportunityApplicationController |
| GET | /api/conversations | Yes | ConversationController |
| POST | /api/conversations | Yes | ConversationController |
| GET | /api/conversations/{conversationId}/messages | Yes | ConversationController |
| POST | /api/conversations/{conversationId}/messages | Yes | ConversationController |
| PATCH | /api/conversations/{conversationId}/read | Yes | ConversationController |

### Frontend callers and wiring nuance

- Shared backend adapter: Frontend/sportslink-frontend-js/lib/api/backend.js.
- Profiles and follows: components/DirectoryPage.jsx, components/PublicProfilePage.jsx, components/WorkspacePages.jsx.
- Feed: components/HomeFeed.jsx.
- Conversations/messages: components/WorkspacePages.jsx.
- Opportunity listing: components/OpportunitiesWorkspace.jsx.
- Nexconn token is a Next.js route handler, not a Spring endpoint.
- NEXT_PUBLIC_USE_SPRING_API defaults to false in .env.local.example; some features directly access Supabase unless enabled.
- Some backend endpoints (e.g. notification mutations, opportunity application operations, reactions/comments) are not shown as callers through backendRequest; direct Supabase code or incomplete UI states exist. Do not imply all 29 operations are exercised by the frontend.

## Database migrations (filename order)

Fourteen SQL migration files exist across two directories; this is not one canonical migration root.

| # | Migration | Purpose |
|---:|---|---|
| 1 | supabase/migrations/20261011122552_connect_events_and_post_media_storage.sql | Adds events table, indexes and RLS; post-media Storage bucket and owner-folder write policies. |
| 2 | supabase/migrations/20261011122712_secure_post_media_storage.sql | Makes post-media private; read policy checks visibility of parent post. |
| 3 | supabase/migrations/20261011124314_backfill_missing_profiles_and_harden_signup_trigger.sql | Backfills existing Auth profiles; recreates hardened signup profile trigger. |
| 4 | supabase/migrations/20261011125211_connect_post_interaction_notifications.sql | Notification index and triggers for comments, reactions, follows. |
| 5 | supabase/migrations/20261011142230_notify_new_message_recipients.sql | Trigger creates message recipient notifications. |
| 6 | supabase/migrations/20261011190647_sportslink_member_onboarding_fields.sql | Adds studied_at and onboarding_completed_at to profiles. |
| 7 | supabase/migrations/20261011192634_grant_messaging_rls_helper_execution.sql | Grants authenticated EXECUTE on messaging RLS helper functions. |
| 8 | supabase/migrations/20261011192853_harden_messaging_rls_helpers.sql | Hardens conversation member/creator security-definer predicates. |
| 9 | supabase/migrations/20261012000100_profile_image_storage.sql | Adds cover_url, profile-images bucket and own-folder write policies. |
| 10 | supabase/migrations/20261012125215_harden_messaging_security_definer_rpcs.sql | Moves privileged helpers/implementation to private schema and leaves invoker wrapper. |
| 11 | supabase/migrations/20261012150000_sportslink_profile_details_completed.sql | Adds profile details completion flag and backfills qualifying profiles. |
| 12 | supabase/migrations/20261029043000_add_seed_profile_flag.sql | Adds is_seed and index. |
| 13 | Frontend/sportslink-frontend-js/supabase/migrations/20261029090000_add_organizations_connections_and_performance.sql | Adds organizations, organization_members, connection_requests, indexes, policies and guard trigger. |
| 14 | Frontend/sportslink-frontend-js/supabase/migrations/20261101000000_add_connection_requests_with_rls.sql | Creates/defines connection_requests, participant RLS, identity guard and updated_at. |

### Tables named by inspected SQL and data-access code

profiles, posts, post_media, post_reactions, post_bookmarks, post_reposts, comments, follows, notifications, conversations, conversation_members, messages, opportunities, opportunity_applications, events, organizations, organization_members, connection_requests.

This is not a full live database catalog. Several tables are referenced by code/foreign-key relations but not created in the 14 migrations. The repository does not include a baseline schema migration; do not present the 14 files as a complete bootstrap schema.

### connection_requests — VERIFIED WIRED

It is explicitly used by both requested components:
- DirectoryPage.jsx lines 67, 135, 139 and 156: selects requests for both participants, accepts incoming, inserts outgoing, declines incoming.
- PublicProfilePage.jsx lines 101, 175 and 183: reads an existing pair's request, accepts and creates requests.
- Schema and RLS are present in frontend migration files 13 and 14.

Do not label this table unused or unwired.

## Security and request handling

### Backend

- SecurityConfig.java lines 21–58 configures JWT resource-server authentication; OPTIONS and /api/health are allowed; other requests require authentication.
- CORS origin allowlist comes from SPORTSLINK_CORS_ALLOWED_ORIGIN, default localhost:3000; methods GET/POST/PUT/PATCH/DELETE/OPTIONS; headers Authorization/Content-Type/Accept; credentials false.
- SupabaseJwtDecoder.java uses Nimbus JWK signature verification for RS256/ES256 and a Supabase Auth user-verification fallback, then validates subject, issuer, authenticated audience and expiry.
- DTOs use Jakarta Validation (@NotBlank, @Size, @Pattern); controllers use @Valid.
- SupabaseRestClient.java forwards caller JWT and publishable key; it does not use a service-role key for the request path.
- CSRF disabled for bearer-token API; HTTP Basic and form login disabled.
- No rate-limiting implementation found in inspected controllers/security/config.
- No custom CSP or dedicated security-header configuration found in inspected backend config. This is a scoped negative finding, not proof across every possible infrastructure layer.

### Frontend

- Supabase browser/server clients: lib/supabase/client.js, lib/supabase/server.js.
- middleware.js refreshes/checks Supabase user sessions, gates configured workspace roots, and checks onboarding/profile-completion status.
- OAuth callback exchanges code for session in app/auth/callback/route.js.
- Nexconn token handler verifies user with Supabase Auth, keeps Nexconn secret server-side, requires HTTPS base URL, sets no-store response, and uses an 8-second timeout.

## CI workflows and scripts

| Workflow | Behavior |
|---|---|
| .github/workflows/backend-ci.yml | Push/PR to main for backend paths; Temurin Java 25 + Gradle; runs bash ./gradlew build. |
| .github/workflows/frontend-ci.yml | Push/PR to main for frontend paths; Node 22; validates/regenerates lockfile; npm ci; npm run build; uploads lockfile artifact. Conditional sync job writes only the named repair branch. |
| .github/workflows/build-android-apk.yml | Manual dispatch; Node 20; installs Capacitor tools temporarily; generates Android project; builds and uploads debug APK. |
| .github/workflows/seed-sportslink-demo.yml | Manual dispatch with typed confirmation and environment guard; runs seed scripts using Actions secrets. |

Frontend scripts from package.json: dev, build, start, seed:demo, seed:cleanup. Backend CI build command: ./gradlew build.

## Environment-variable names only

From .env.local.example:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_USE_SPRING_API
- NEXT_PUBLIC_NEXCONN_APP_KEY
- NEXCONN_APP_SECRET
- NEXCONN_API_BASE_URL

From backend application.properties:
- SUPABASE_JWT_ISSUER
- SUPABASE_JWKS_URL
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- SPORTSLINK_CORS_ALLOWED_ORIGIN

Other code reads NEXT_PUBLIC_SITE_URL in the root layout and auth callback. The seed workflow uses Actions secret names SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Names only; no values are reproduced.

## Feature wiring status

| Feature area | Status | Evidence / nuance |
|---|---|---|
| Landing, login, signup, onboarding | WIRED | Page modules, Supabase clients, OAuth callback and middleware. |
| Home feed and post creation | WIRED | HomeFeed.jsx uses Supabase; optional backend path for posts. |
| Post comments/reactions/bookmarks/reposts | WIRED | HomeFeed.jsx accesses these tables directly; backend also has comments/reaction endpoints. |
| Directory and connection requests | WIRED | DirectoryPage.jsx reads/writes connection_requests. |
| Public member profile and connection requests | WIRED | PublicProfilePage.jsx reads/accepts/creates requests. |
| Follows | WIRED | Spring follows used by several components when flag enabled; direct follow reads also exist. |
| Conversations/messages | WIRED | WorkspacePages.jsx calls backend conversation endpoints; separate Nexconn chat UI/token integration exists. |
| Notifications | WIRED | WorkspacePages.jsx direct Supabase list/update/delete; backend defines matching operations; triggers generate some types. |
| Opportunities | PARTIALLY WIRED | Opportunity list uses backend; applications API exists; some workspace route content remains empty/unavailable. |
| Organizations | WIRED | OrganizationsPage.jsx performs organization and membership reads/writes; migration adds tables/RLS. |
| Events | MIXED / VERIFY UI | SectionPage.jsx contains events queries/inserts/updates, and root migration adds events. Routing/UI integration should be independently smoke-tested before describing user flow as complete. |
| All Spring API endpoints | PARTIALLY WIRED | Callers exist for profile/follow/post/conversation/opportunity listing. Several operations use direct Supabase or have no matching backend caller. |

## Tests, known gaps and TODO/FIXME

- One backend test source: SportslinkBackendApplicationTests.java. It covers context load, public health, authentication rejection, profile read/update safety, post feed/create/validation, comment/reaction/follow identity, notifications, opportunity application and message sender identity. Tests mock SupabaseRestClient; they are not live-Supabase integration tests.
- No frontend test/spec files matching common .test.* or .spec.* suffixes are present in the tracked tree. Frontend CI performs a production build.
- Search for TODO FIXME did not return indexed results. This search-based result is not a full local grep and is not a verified claim that every source file has zero TODO/FIXME markers.
- No rate-limiting implementation found in inspected backend config.
- Migration directories coexist at root and under frontend; connection_requests schema is created in two files, with overlapping idempotent definitions/policies. Clarify canonical migration ordering before provisioning new environments.
- Several Spring operations are defined but are not evidenced as frontend callers through the backend adapter.
- Capacitor config and APK workflow exist; these prove a connected wrapper/debug build path, not a native app store publishing pipeline.

## Source map

- Counts: recursive Git tree of main (189 blob entries; 63 tree entries).
- Frontend stack/scripts: Frontend/sportslink-frontend-js/package.json; resolved versions: package-lock.json.
- Backend stack: Backend/sportslink-backend/build.gradle; Gradle wrapper properties.
- API definitions: ten backend *Controller.java files in Backend/sportslink-backend/src/main/java/com/sportslink/sportslink_backend/.
- API auth/CORS: SecurityConfig.java lines 21–58.
- JWT and Supabase proxy: SupabaseJwtDecoder.java, SupabaseRestClient.java.
- Routes: all Frontend/sportslink-frontend-js/app/**/page.*; dynamic list app/[section]/page.jsx.
- connection_requests: DirectoryPage.jsx lines 67, 135, 139, 156; PublicProfilePage.jsx lines 101, 175, 183.
- Organizations: OrganizationsPage.jsx lines 25, 28, 63, 65, 79, 91, 142.
- Events: SectionPage.jsx lines 45, 55, 85, 149, 168, 217.
- CI: .github/workflows/*.yml.
- Environment names: .env.local.example, backend application.properties, root layout/auth callback and seed workflow.
- Tests: SportslinkBackendApplicationTests.java.
- Migration purposes: SQL file table above.

## Status key

- VERIFIED — supported directly by a repository path, Git tree listing, manifest, code, or SQL migration.
- CONTRADICTED — repository evidence directly disagrees with an expectation or previous count.
- UNVERIFIED — not confirmed by inspected repository evidence; this does not mean false.
