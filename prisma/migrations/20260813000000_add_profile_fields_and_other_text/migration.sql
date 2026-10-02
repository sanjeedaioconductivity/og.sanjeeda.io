-- Sprint 6 (frontend wizard part 1) — persistence gaps found while building SCR-001…SCR-005.
--
-- 1. candidate_profiles was missing 6 of SCR-001's 24 FRS fields, so those inputs had
--    nowhere to save: current employer, current job title, willingness to relocate, and
--    the three 5-point career-satisfaction ratings.
--
-- 2. validateEnumField() already *requires* free text whenever an enum is set to "Other",
--    but no column existed to hold it — the text validated and was then silently dropped.
--    One *_other_text column per enum that actually offers "Other" in its FRS card and in
--    the OgQuestions seed. Column widths mirror the FRS per-field caps (50 or 100).
--
--    Deliberately excluded, because none of them has an "Other" value:
--    offer_education_reimbursement (Yes/Limited/No/Not clear), offer_job_security
--    (Very secure/Somewhat secure/Not sure/Risky), offer_restrictive_clause (Yes/No/Not clear),
--    offer_employment_type and offer_work_arrangement (enumerated, no free-text fallback).

-- AlterTable: SCR-001 candidate profile fields (6)
ALTER TABLE `candidate_profiles`
  ADD COLUMN `willing_to_relocate` VARCHAR(191) NULL DEFAULT 'Not sure',
  ADD COLUMN `current_employer` VARCHAR(191) NULL,
  ADD COLUMN `current_job_title` VARCHAR(191) NULL,
  ADD COLUMN `overall_job_satisfaction` INTEGER NULL,
  ADD COLUMN `career_growth_satisfaction` INTEGER NULL,
  ADD COLUMN `work_life_balance_satisfaction` INTEGER NULL;

-- AlterTable: SCR-003 "Other" free text (3)
ALTER TABLE `offers`
  ADD COLUMN `offer_contract_duration_other_text` VARCHAR(50) NULL,
  ADD COLUMN `offer_probation_other_text` VARCHAR(50) NULL,
  ADD COLUMN `reporting_level_other_text` VARCHAR(100) NULL;

-- AlterTable: SCR-004 "Other" free text (1)
ALTER TABLE `offer_compensation`
  ADD COLUMN `offer_review_cycle_other_text` VARCHAR(50) NULL;

-- AlterTable: SCR-005 "Other" free text (9)
ALTER TABLE `offer_benefits_security`
  ADD COLUMN `offer_health_coverage_other_text` VARCHAR(100) NULL,
  ADD COLUMN `offer_life_insurance_other_text` VARCHAR(100) NULL,
  ADD COLUMN `offer_retirement_benefits_other_text` VARCHAR(100) NULL,
  ADD COLUMN `offer_sick_leave_other_text` VARCHAR(100) NULL,
  ADD COLUMN `offer_parental_leave_other_text` VARCHAR(100) NULL,
  ADD COLUMN `offer_device_support_other_text` VARCHAR(100) NULL,
  ADD COLUMN `offer_meal_support_other_text` VARCHAR(100) NULL,
  ADD COLUMN `offer_wellness_benefits_other_text` VARCHAR(100) NULL,
  ADD COLUMN `offer_visa_support_other_text` VARCHAR(100) NULL;
