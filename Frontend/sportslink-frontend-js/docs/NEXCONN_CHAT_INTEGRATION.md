# Nexconn Chat integration for SPORTSLINK

## Included

- Responsive `/messages` page.
- Client adapter for Nexconn's Lit-based Chat UI.
- Server endpoint that validates the current Supabase user before requesting a Nexconn user token.
- Safe setup/error states when credentials are missing.

## Dependencies

The frontend manifest includes `@nexconn/chat`, `@nexconn/engine`, `@nexconn/chatui`, and `lit`. Install with the repository package manager and keep the Nexconn packages on compatible versions as described at https://github.com/NexconnAI-Dev/nexconn-chatui-web.

## Environment

Set these values in local environment and the frontend's Railway service:

- `NEXT_PUBLIC_NEXCONN_APP_KEY`: public Nexconn app key.
- `NEXCONN_TOKEN_ENDPOINT`: server-side URL for a trusted SPORTSLINK token issuer.
- `NEXCONN_SERVER_SECRET`: server-only secret for authenticating to that token issuer. Never prefix with `NEXT_PUBLIC_`.

The endpoint must accept `POST { "userId": "<Supabase auth user id>" }`, authenticated with `Authorization: Bearer <NEXCONN_SERVER_SECRET>`, and return `{ "token": "<user-scoped Nexconn token>" }`. It must map each Supabase user to a stable Nexconn identity and issue tokens through Nexconn's supported server-side process. Do not guess undocumented token-signing algorithms.

## Required before production

1. Configure the Nexconn application and server-side token issuer.
2. Connect the four ChatUI profile hooks in `components/chat/NexconnChatUI.jsx` to authorized SPORTSLINK profile/group APIs. They currently return empty arrays so no profile data is fabricated.
3. Verify the deployed sign-in route; the current link is `/auth/login`.
4. Test authenticated/unauthenticated states, token expiry, one-to-one chat, and mobile viewport sizing.
5. Verify SDK versions and initialization settings against your Nexconn account's current docs.

This integration is scaffolding until the token issuer and profile hooks are configured and end-to-end tests pass.
