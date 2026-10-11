# SPORTSLINK Spring Boot backend

This service provides authenticated REST API endpoints for SPORTSLINK identity, profiles, the community feed, social interactions, opportunities/applications, notifications, and conversations/messages. It validates Supabase access tokens and forwards the caller's validated token to Supabase REST. The caller's Supabase grants and Row Level Security (RLS) policies remain in force; this backend does not use a privileged service-role key.

## Requirements and local run

- Java 25
- Windows: use `gradlew.bat`; Linux/macOS CI uses `bash ./gradlew`.

From this directory:

```powershell
.\gradlew.bat test
.\gradlew.bat bootRun
```

Default server port: 8080. If it is occupied by an existing SPORTSLINK instance, stop that instance in its own terminal with Ctrl+C; do not terminate an unidentified process. To run a second local instance, use a different server port.

## Endpoints

Every endpoint below except `GET /api/health` requires a valid Supabase access token in `Authorization: Bearer <token>`.

### Health and identity
- `GET /api/health` — public health check.
- `GET /api/me` — verified JWT subject ID.

### Profiles
- `GET /api/profiles` — up to 100 other profiles visible to the caller under RLS.
- `GET /api/profiles/me` — current user's readable profile row.
- `PATCH /api/profiles/me` — update `full_name`, `headline`, `bio`, `location`, and/or `sport`; lengths are validated. Identity, username, role and avatar fields are not editable through this endpoint.

### Posts
- `GET /api/posts` — up to 100 newest posts visible to the caller under RLS.
- `POST /api/posts` — create a post with `content` and `visibility` (`public` or `followers`). The author ID is taken from the verified JWT.
- `GET /api/posts/{postId}/comments` — list comments visible under the parent post's RLS.
- `POST /api/posts/{postId}/comments` — create a comment; author ID comes from the JWT; content is limited to 2,000 characters.
- `GET /api/posts/{postId}/reactions` — list reactions visible to the caller.
- `PUT /api/posts/{postId}/reaction` — set the caller's reaction (`like`, `celebrate`, or `support`).
- `DELETE /api/posts/{postId}/reaction` — remove the caller's reaction.

### Follows
- `GET /api/follows?direction=following` — profiles followed by the caller.
- `GET /api/follows?direction=followers` — followers of the caller.
- `POST /api/follows/{profileId}` — follow a profile; the caller's ID is set by the backend.
- `DELETE /api/follows/{profileId}` — unfollow a profile.
- The existing database has a `follows` table, not a separate connection-invitation table; following is not the same as accepting a professional connection request.

### Notifications
- `GET /api/notifications` — latest notifications visible to the caller.
- `GET /api/notifications?unreadOnly=true` — only unread notifications.
- `PATCH /api/notifications/{notificationId}/read` — mark own notification as read.
- `DELETE /api/notifications/{notificationId}` — delete own notification.
- This API does not allow clients to create notifications directly; database triggers or trusted application actions should own notification generation.

### Opportunities and applications
- `GET /api/opportunities` — open opportunities and caller-owned opportunities allowed by RLS.
- `POST /api/opportunities` — create an opportunity with validated title, description, type, location/sport, remote status and deadline. Creator ID is taken from the JWT; status defaults to `open` and may be `draft`.
- `GET /api/applications/me` — applications made by the caller.
- `GET /api/opportunities/{opportunityId}/applications` — applications visible to the caller under RLS (e.g. for their own opportunity).
- `POST /api/opportunities/{opportunityId}/applications` — apply as the authenticated caller; initial status is always `submitted`.
- `PATCH /api/applications/{applicationId}/status` — opportunity owner may set `reviewing`, `shortlisted`, `accepted`, or `rejected`; RLS determines who may update an application.

### Conversations and messages
- `GET /api/conversations` — conversations the caller may read.
- `POST /api/conversations` — create a conversation using JSON fields `is_group`, optional `title`, and `member_ids` (array of UUIDs). Current user is added by the backend. Member insertion uses the caller's token and database policies.
- `GET /api/conversations/{conversationId}/messages` — up to 100 messages in a conversation the caller may access.
- `POST /api/conversations/{conversationId}/messages` — send a message as the authenticated caller.
- `PATCH /api/conversations/{conversationId}/read` — update the caller's membership read timestamp.

### Not implemented
The current live schema has no `organizations` or `events` table. Reactions/comments are exposed by the API but existing home-feed action buttons are not yet wired to them. Professional connection invitations, post media uploads, reposts, saves, search ranking, real-time delivery, and moderation are not implemented by this milestone.

## Supabase configuration

Default project issuer/JWKS endpoints:

- Issuer: `https://ozqitjwttigfpmnroeqi.supabase.co/auth/v1`
- JWKS: `https://ozqitjwttigfpmnroeqi.supabase.co/auth/v1/.well-known/jwks.json`

Backend environment variables:

- `SUPABASE_JWT_ISSUER` — optional issuer override.
- `SUPABASE_JWKS_URL` — optional public JWKS URL override.
- `SUPABASE_URL` — Supabase project URL used for REST calls.
- `SUPABASE_PUBLISHABLE_KEY` — required for database APIs; use a publishable key, never a secret/service-role key.
- `SPORTSLINK_CORS_ALLOWED_ORIGIN` — frontend origin; default `http://localhost:3000`.

Do not commit access tokens, passwords, or private API keys. The service forwards the user's Bearer token instead of bypassing RLS with a service-role key.

## Frontend integration

`Frontend/sportslink-frontend-js/lib/api/backend.js` sends the current Supabase access token to Spring Boot. API URL comes from `NEXT_PUBLIC_API_URL` and defaults to `http://localhost:8080`.

The profile screen, profile directory and Home feed can opt into Spring Boot by setting `NEXT_PUBLIC_USE_SPRING_API=true` in the frontend `.env.local`. Default is `false`, preserving existing behavior. Verify the live endpoints and database RLS first, set `SUPABASE_PUBLISHABLE_KEY` in the backend process environment, and restart both servers after environment changes.

## Verification

GitHub Actions runs `bash ./gradlew build` on Linux. Automated tests cover health/authentication, profile and feed behavior, safe user-ID assignment for posts/comments/reactions/follows/opportunity applications/messages, and request validation. They mock the shared Supabase REST client; they do not replace a local integration test against actual rows and the deployed database policies.

The live database currently reports RLS enabled on the existing public tables. The profile table's signup trigger copies the signup metadata role into `profiles.role`; signup roles were aligned with the table's allowed role values in the frontend. Verify the frontend's local project URL matches this project before enabling backend integration. No database schema, migrations, RLS policies or production settings were changed as part of this PR.
