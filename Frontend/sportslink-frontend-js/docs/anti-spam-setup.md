# SPORTSLINK signup anti-spam setup

The signup form has basic client-side abuse friction by default: a hidden honeypot, a minimum form-fill time, single-flight submission locking, a short retry cooldown, field length limits, and Supabase Auth's own project rate limits.

For server-verified bot challenges:

1. Create a Cloudflare Turnstile widget for the SPORTSLINK signup hostname.
2. In the Supabase Dashboard, enable CAPTCHA protection for Auth and choose Cloudflare Turnstile. Use the widget's site key and secret key in Supabase's CAPTCHA provider settings.
3. Set the public site key as `NEXT_PUBLIC_SUPABASE_CAPTCHA_SITE_KEY` in the frontend deployment environment (Railway). Do not put the Turnstile secret key in a `NEXT_PUBLIC_` variable or in the frontend repository.
4. Redeploy and test signup with both a valid CAPTCHA and an expired/failed challenge. Supabase must have the same provider configured; the visible widget alone is not server-side verification.

The form passes the Turnstile token to `supabase.auth.signUp` only when the public site key is configured. Without that environment variable, the default honeypot, timing, duplicate-submit protection and Supabase Auth limits remain active, but the form does not show a CAPTCHA challenge.