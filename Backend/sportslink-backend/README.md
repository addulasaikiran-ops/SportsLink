# SPORTSLINK Spring Boot backend

This service is the authenticated REST API foundation for SPORTSLINK. The current milestone verifies Supabase access tokens and exposes the current authenticated user's ID. Profile/feed/business APIs will be added in later increments after the existing Supabase schema and Row Level Security (RLS) behavior are verified.

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

Every other endpoint requires authentication by default.

## Supabase JWT configuration

By default, the service verifies signatures using this project's public Supabase JWKS endpoint and validates the issuer:

- Issuer: `https://ozqitjwttigfpmnroeqi.supabase.co/auth/v1`
- JWKS: `https://ozqitjwttigfpmnroeqi.supabase.co/auth/v1/.well-known/jwks.json`

Optional environment overrides:

- `SUPABASE_JWT_ISSUER`
- `SUPABASE_JWKS_URL`
- `SPORTSLINK_CORS_ALLOWED_ORIGIN` (defaults to `http://localhost:3000`)

The URLs above are public configuration, not keys. Do not put access tokens, passwords, Supabase secret keys, or service-role keys in source control.

## Frontend helper

The Next.js client helper at `Frontend/sportslink-frontend-js/lib/api/backend.js` uses the current Supabase session's access token and calls the API URL from `NEXT_PUBLIC_API_URL`. If that variable is unset it uses `http://localhost:8080`.

Example from client-side React code:

```javascript
import { backendRequest } from "@/lib/api/backend";

const currentUser = await backendRequest("/api/me");
```

For local development, set `NEXT_PUBLIC_API_URL=http://localhost:8080` in the frontend's `.env.local` if you want to make the setting explicit, then restart the Next.js dev server.

## Verification status

Automated tests cover the public health endpoint, rejection without authentication, and an authenticated mock JWT. After starting the service locally, also test `GET /api/me` from the signed-in frontend using a real session. The real-token integration has not been assumed based on the health endpoint alone.

Database-backed profile, post, connection, messaging, notification, and opportunity APIs are not implemented in this milestone. Verify the project's deployed Supabase schema, grants, and RLS policies before adding database writes or privileged access.
