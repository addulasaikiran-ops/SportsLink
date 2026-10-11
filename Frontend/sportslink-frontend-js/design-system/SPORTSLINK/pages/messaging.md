# Messaging — page-specific UX rules

## User goal
Continue professional conversations safely and with confidence.

## Behavior
- Conversation selection visibly identifies the active conversation.
- The composer supports Enter-to-send on desktop, visible send button, non-empty validation, and an accessible label.
- Do not render seeded conversations or claim delivery before a persistent messaging backend exists.
- Attachment controls must explain when upload is unavailable.
- Until messaging is connected, show an empty/unavailable state and do not accept messages into local-only state.
- Production messaging requires authentication, recipient authorization, rate limiting, reporting/blocking, server-side persistence, and delivery/error states.

## Responsive and accessibility
- Conversation list and thread must remain navigable on narrow screens.
- Keep focus order logical and preserve visible focus rings.
- Don't use color alone to indicate the active conversation.
