# Home feed — page-specific UX rules

## User goal
Understand what's happening in sport and publish a useful professional update with minimal friction.

## Hierarchy
1. Welcome/context and live feed summary.
2. Composer as the primary action.
3. Feed filters, newest/high-signal posts, author identity, post body/media.
4. Reactions, comments, save/share actions.

## Behavior
- Composer has a visible accessible name, character count, and clear empty-submit feedback.
- A post appears only after Supabase confirms it was saved; the feed uses the authenticated user's RLS visibility.
- Show a genuine empty state when no visible posts exist.
- Do not offer reaction, save, or comment actions until they have a real backend implementation.
- Report/more actions must not be inert; until moderation exists, show a clear status message.

## Responsive and accessibility
- Keep author identity and primary post action usable at 320–375px.
- Media reserves a stable aspect ratio.
- Every icon-only action has an accessible name.
- Status and validation feedback are announced without moving focus unexpectedly.
