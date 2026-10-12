-- Track profile-detail completion separately from onboarding access.
-- This is a completion indicator, not an identity-verification claim.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_details_completed boolean NOT NULL DEFAULT false;

-- Preserve a completion badge for existing profiles with the required details.
UPDATE public.profiles
SET profile_details_completed = true
WHERE onboarding_completed_at IS NOT NULL
  AND char_length(btrim(coalesce(full_name, ''))) >= 2
  AND nullif(btrim(coalesce(sport, '')), '') IS NOT NULL
  AND char_length(btrim(coalesce(bio, ''))) >= 20
  AND position(',' in coalesce(location, '')) > 0;
