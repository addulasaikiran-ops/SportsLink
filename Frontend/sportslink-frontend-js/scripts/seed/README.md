# SPORTSLINK synthetic seed accounts

This tool creates clearly flagged synthetic demo accounts and activity. **Do not present seed accounts as real people to production visitors.** Use a staging or local Supabase project.

## Safety defaults
- `npm run seed:demo -- --dry-run` is the default and does not write data.
- The script refuses the known production Supabase project ref `ozqitjwttigfpmnroeqi` unless BOTH `--i-know-this-is-production` and `SEED_ALLOW_PROD=true` are explicitly supplied. Do not seed production for fake social proof.
- The service-role key is server-side only and is read from `SUPABASE_SERVICE_ROLE_KEY`. Never add it to a `NEXT_PUBLIC_` variable.
- Seed emails use the reserved non-deliverable `.invalid` domain.
- Synthetic accounts use `user_metadata.is_seed=true` and `profiles.is_seed=true`. Activity is limited to seed accounts.
- Do not run the write mode until the new migration has been applied to a staging project and the live schema has been reviewed.

## Setup
From `Frontend/sportslink-frontend-js`:
1. Apply `supabase/migrations/20261029043000_add_seed_profile_flag.sql` to a staging/local project with the base app schema already installed.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your shell environment. Do not commit these values.
3. Run `npm install` if needed.
4. Run `npm run seed:demo -- --dry-run` to validate 500 generated personas.
5. After reviewing schema notes and dry-run output, run `npm run seed:demo -- --count 20 --write` first.
6. Review staging UI and data. Then use `npm run seed:demo -- --count 500 --write`.

## Cleanup
```bash
npm run seed:cleanup -- --dry-run
npm run seed:cleanup -- --write
```

Cleanup deletes only users with `user_metadata.is_seed=true` and seed-batch metadata. It requires explicit `--write` and asks for a confirmation token. Review cascade behavior and storage separately before cleanup.

## Limits / verification
The runner inspects actual table columns and validates required fields before writes. It does not change RLS, auth settings, or existing policies. If the base schema, trigger-created profile row, or permissions differ from the inspected staging database, stop and reconcile before write mode. The repository's public directory currently displays only the newest 100 profiles; seeded accounts may affect staging discovery results.