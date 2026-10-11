# SPORTSLINK Spring Boot backend

This service is the authenticated REST API foundation for SPORTSLINK. It validates Supabase access tokens and exposes current-user and profile endpoints. The profile API forwards the caller's validated access token to Supabase REST, so the caller's Supabase grants and Row Level Security (RLS) policies remain in force.

## Requirements

- Java 25
- Windows: use `gradlew.bat`; Linux/macOS: use `bash ./gradlew`

## Run locally

From this directory:

```powershell
.\gradlew.bat test
.\gradlew.bat bootRun
```

The default server port is 8080. If that port is occupied, stop the existing SPORTSLINK backend from its own terminal with Ctrl+C, or temporarily run a second instance on another port using `--args='--server.port=8081'`.

## Current endpoints

- `GET /api/health` — public health check.
- `GET /api/me` — requires `Authorization: Bearer <Supabase access token>`; returns the validated JWT subject as `id` and `authenticated: true`.
- `GET /api/profiles/me` — returns the caller's readable profile row.
- `PATCH /api/profiles/me` — updates only `full_name`, `headline`, `bio`, `location`, and `sport`; field lengths are validated.

Every endpoint except `GET /api/health` requires authentication. Profile endpoints use the JWT subject to select the profile ID; clients cannot supply another user's ID. The update endpoint does not permit changing identity, username, role, or avatar.

## Supabase configuration

By default, the service verifies JWT signatures using this project's public Supabase JWKS endpoint and validates the issuer:

- Issuer: `https://ozqitjwttigfpmnroeqi.supabase.co/auth/v1`
- JWKS: `https://ozqitjwttigfpmnroeqi.supabase.co/auth/v1/.well-known/jwks.json`

Environment variables supported by the backend:

- `SUPABASE_JWT_ISSUER` — optional JWT issuer override.
- `SUPABASE_JWKS_URL` — optional JWKS URL override.
- `SUPABASE_URL` — Supabase project URL for REST requests.
- `SUPABASE_PUBLISHABLE_KEY` — required by profile endpoints; use the project's publishable key from the frontend environment, never a service-role key.
- `SPORTSLINK_CORS_ALLOWED_ORIGIN` — allowed frontend origin; defaults to `http://localhost:3000`.

The URLs above are public configuration, not keys. Never put access tokens, passwords, Supabase secret keys, or service-role keys in source control. The profile service forwards the user's own Bearer token rather than using a privileged server key, so Supabase RLS policies still apply.

## Frontend integration

The Next.js helper at `Frontend/sportslink-frontend-js/lib/api/backend.js` gets the current Supabase access token and calls `NEXT_PUBLIC_API_URL`; by default it uses `http://localhost:8080`.

The existing profile UI remains on its current direct-Supabase implementation unless `NEXT_PUBLIC_USE_SPRING_API=true` is set in the frontend `.env.local`. Enable that flag only after setting `SUPABASE_PUBLISHABLE_KEY` for the backend. Restart both servers after changing environment variables.

Example from client-side React code:

```javascript
import { backendRequest } from "@/lib/api/backend";

const currentUser = await backendRequest("/api/me");
```

## Verification status and next work

Automated tests cover the public health endpoint, rejection without authentication, the protected identity endpoint, and profile controller behavior. These tests mock the profile service; they do not verify the live Supabase profile table or its deployed RLS policies.

Before enabling the backend profile UI, verify that a row exists in `profiles`, that the relevant SELECT and UPDATE RLS policies work, and that the backend can call Supabase REST with the publishable key and user's access token. The repository contains no database migrations or trigger definitions; the signup profile trigger and RLS configuration must be verified in the Supabase project.

Post creation/feed, connections, messaging, notifications, opportunities/applications, events, organizations, reactions, and comments remain future backend work.
