# Seed schema inspection notes

Read-only inspection of the connected Supabase project `ozqitjwttigfpmnroeqi` on 2026-10-29 found these public tables and confirmed RLS is enabled on them. This is the known production project, so it was inspected only; **do not seed it**.

Tables observed: profiles, posts, post_media, follows, post_reactions, comments, opportunities, opportunity_applications, conversations, conversation_members, messages, notifications, events, post_bookmarks, post_reposts.

Confirmed profile fields include id, username, full_name, headline, bio, avatar_url, location, sport, role, skills, website_url, created_at, updated_at, studied_at, onboarding_completed_at, cover_url, profile_details_completed. Role check allows athlete, coach, scout, agent, club, sports_organization, medical, media, trainer, other. The inspected schema did not yet show is_seed; apply the new migration to staging before write mode.

Posts include id, author_id, content (max 5000), visibility (public/followers), created_at, updated_at. Comments include post_id, author_id, content (1–2000), timestamps. Follows has composite primary key (follower_id, following_id). Reactions has composite primary key (post_id, user_id), reaction check allows like/celebrate/support. Events require title (3–160), location (2–240), starts_at, and event_type training/competition/tryout/meetup/other; status published/cancelled.

The source migration `20261011125211_connect_post_interaction_notifications.sql` confirms insert triggers create notifications for comments, reactions, and follows. Seed interactions must therefore only involve seed authors/targets. The profile-creation trigger and all RLS policies still need inspection on the actual staging project before any write run. The source repository alone cannot prove staging constraints or cascade behavior.