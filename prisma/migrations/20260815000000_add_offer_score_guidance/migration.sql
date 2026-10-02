-- Sprint 7 (SCR-010 Results) — persist the three guidance panels.
--
-- SCR-010 §6.3-6.5 specify strengths, watch-outs and suggested next steps as
-- generated output. Sprint 7 handoff §5 requires them to come from the scoring
-- engine response, and states plainly that a threshold comparison in the
-- frontend producing a displayed value "is a defect". So they are derived
-- server-side by deriveGuidance() and stored here alongside the scores that
-- produced them.
--
-- Persisted rather than recomputed on read for the same reason the score itself
-- is: the row is stamped with the scoring_config_version that produced it, so a
-- later admin retune never silently rewrites a candidate's past results.
--
-- Shapes:
--   strengths  [{ "category": "Salary", "score": 82 }, ...]  max 4
--   watch_outs ["Bonus is variable — confirm payout rules", ...]  max 5
--   next_steps ["Negotiate salary or guaranteed cash value", ...]  max 4
--
-- Defaults are empty arrays so existing rows scored before this migration read
-- back as "no guidance" rather than NULL, and the render path needs no
-- null-guard beyond its normal empty-state branch.

ALTER TABLE `offer_scores`
  ADD COLUMN `strengths` JSON NOT NULL,
  ADD COLUMN `watch_outs` JSON NOT NULL,
  ADD COLUMN `next_steps` JSON NOT NULL;

-- MySQL rejects a literal DEFAULT on a JSON column, so existing rows are
-- backfilled explicitly instead. New rows always get their value from the
-- application layer (deriveGuidance always returns all three keys).
UPDATE `offer_scores`
SET `strengths` = JSON_ARRAY(),
    `watch_outs` = JSON_ARRAY(),
    `next_steps` = JSON_ARRAY();
