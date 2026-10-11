# SPORTSLINK — UI Design System

Inspired by the public UI/UX Pro Max guidance; this is a project-specific adaptation, not a copy of its implementation.

## Product direction
A trusted, energetic professional network for athletes, coaches, scouts, clubs, sports scientists, and sports organizations. Prioritize credibility, discoverability, and useful professional actions over decorative effects.

## Visual language
- **Style:** clean professional SaaS / editorial sports network, light-first.
- **Primary:** `#245FE2` for navigation, links, and primary actions.
- **Text:** `#172033` primary; `#59667C` secondary; `#6B778C` muted.
- **Surfaces:** `#FFFFFF` cards; `#F5F7FB` application canvas.
- **Borders:** `#E3E8F1`; use borders before heavier shadows.
- **Typography:** Manrope for headings, DM Sans for body and controls.
- **Shape:** 8px small controls, 12px medium surfaces, 16px large cards.
- **Motion:** short, purposeful transitions; honor `prefers-reduced-motion`.

## Layout and responsive behavior
- Desktop: fixed-width navigation rail, flexible content, optional context rail.
- Tablet: hide context rail before shrinking the primary content excessively.
- Mobile: single-column content, collapsible navigation, no horizontal page overflow.
- Reserve media aspect ratios and avoid layout shifts.
- Keep touch controls comfortably sized and spaced.

## Interaction rules
- Every action has a visible hover, focus, pressed, selected, loading, success, or error state as appropriate.
- Use inline status messages for server feedback rather than browser alerts.
- Make the active navigation item obvious.
- Preserve browser navigation and use shareable URLs for discoverable views.
- Do not imply a message, connection request, or setting has reached a real backend unless confirmed by the server.

## Accessibility baseline
- Semantic landmarks and a skip link.
- Visible keyboard focus.
- Inputs have accessible labels.
- Status feedback uses `role="status"` and `aria-live` where useful.
- Errors are actionable and explained in plain language.
- Respect reduced-motion preferences.
- Keep body text readable and verify color contrast when changing the palette.

## Component patterns
- `AppShell`: shared header, global search, navigation, responsive rails.
- `HomeFeed`: post composer, filters, cards, reaction actions.
- `SectionPage`: network, discover, opportunities, messages, notifications, profile, organizations, settings.
- `app/loading.jsx`: stable skeleton layout.
- `app/error.jsx` / `app/not-found.jsx`: recovery paths.

## Future production gates
- Use JavaScript API contracts backed by real data; never seed user-facing flows with sample records.
- Add real authentication/authorization before exposing account or admin actions.
- Persist preferences and connection state server-side.
- Add image optimization, upload validation, pagination, and tests.
- Measure keyboard-only usability, mobile overflow, and WCAG contrast before release.
