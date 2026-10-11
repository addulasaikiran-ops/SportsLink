# Discover and network — page-specific UX rules

## User goal
Find relevant people, roles, clubs, and professional connections.

## Behavior
- Search across names, roles, sports, and organization type where applicable.
- Global search routes to Discover using a URL query so the view can be shared or refreshed.
- Search is forgiving of letter case and has a clear action.
- Empty search results explain what to try next and offer a one-action reset.
- Render only profiles returned by Supabase under the current RLS policies.
- Keep connection, follow, and save actions unavailable until backed by persistent server operations.

## Layout
- Keep profile cards consistent in image ratio, metadata order, and CTA position.
- Use a single-column card layout on narrow screens and avoid horizontal scrolling.
- Keep the search field visible near the results.
