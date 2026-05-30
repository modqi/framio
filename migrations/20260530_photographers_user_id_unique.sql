-- Migration: add UNIQUE constraint on photographers.user_id
-- Date: 2026-05-30
--
-- Why:
--   app/api/approve-photographer/route.ts upserts the photographers row with
--   `{ onConflict: "user_id" }`. Postgres requires a UNIQUE (or exclusion)
--   constraint on the conflict target, otherwise the upsert fails with:
--       42P10: there is no unique or exclusion constraint matching the
--              ON CONFLICT specification
--   Because the constraint was missing, every approval upsert errored out and
--   no photographers row was ever created — approved photographers were still
--   treated as clients downstream (storage signatures, dashboard ownership).
--
--   This also enforces the one-row-per-photographer invariant the app assumes.
--
-- Safety:
--   Verified there are currently no duplicate user_id rows, so the constraint
--   creation will succeed without de-duplication. If a future run hits
--   "could not create unique index ... duplicate key", de-dupe first with:
--
--     DELETE FROM photographers a USING photographers b
--     WHERE a.ctid < b.ctid AND a.user_id = b.user_id;

ALTER TABLE photographers
  ADD CONSTRAINT photographers_user_id_key UNIQUE (user_id);
