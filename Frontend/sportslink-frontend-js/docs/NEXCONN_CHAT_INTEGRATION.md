# Nexconn Chat integration for SPORTSLINK

## Included

- Responsive `/messages` page.
- Client adapter for Nexconn's Lit-based Chat UI.
- Server endpoint that validates the current Supabase user and requests a Nexconn access token directly from the Platform Chat API.
- Safe setup/error states when credentials are missing.

## Environment

Configure these variables in local development and the frontend's Railway service:

- `NEXT_PUBLIC_NEXCONN_APP_KEY`: Nexconn App Key. This is sent to the browser SDK and is public.
- `NEXCONN_APP_SECRET`: Nexconn App Secret. Server-only; never prefix with `NEXT_PUBLIC_`.
- `NEXCONN_API_BASE_URL`: regional HTTPS API base URL matching the data center selected in the Nexconn Console:
  - Singapore: `https://api.sg-light-api.com`
  - North America: `https://api.us-light-api.com`
  - Saudi Arabia: `https://api.sau-light-api.com`

The default value in `.env.local.example` is Singapore as an example. Confirm the actual Nexconn app region before deployment.

## Token issuance

`POST /api/nexconn/token` requires a valid Supabase access token in the Authorization Bearer header. The route verifies the user with Supabase, derives a stable alphanumeric Nexconn user ID from the Supabase UUID, and issues a token via `POST /v4/auth/access-token/issue`.

The server creates a fresh 18-character random nonce and millisecond timestamp, then computes the documented signature:

`SHA1(NEXCONN_APP_SECRET + Nonce + Timestamp)`

The App Key, signature, nonce, timestamp, request ID, display name, and optional HTTPS avatar URL are sent to Nexconn. The route returns only `result.accessToken` to the authenticated client and disables response caching. The App Secret is never sent to the browser.

## Required before production

1. Set the correct regional `NEXCONN_API_BASE_URL` for your Nexconn app in Railway.
2. Add `NEXT_PUBLIC_NEXCONN_APP_KEY` and `NEXCONN_APP_SECRET` to the frontend service's Railway variables. Keep the secret server-only.
3. Connect the four ChatUI profile hooks in `components/chat/NexconnChatUI.jsx` to authorized SPORTSLINK profile/group APIs. They currently return empty arrays so no profile data is fabricated.
4. Verify the deployed sign-in route; the current link is `/auth/login`.
5. Verify the Nexconn SDK package versions and initialization settings against the current docs.
6. Test authenticated/unauthenticated states, token issuance, one-to-one chat, reconnection, and mobile viewport sizing.

This removes the placeholder token-issuer dependency, but the complete chat experience remains unverified until the SDK initialization and end-to-end tests pass.
