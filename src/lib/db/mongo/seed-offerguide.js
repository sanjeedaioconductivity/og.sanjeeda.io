// OfferGuide — Mongo seed script (v4 — fully FRS-verified)
// Run with: node seed-offerguide.js
// Requires MONGODB_URI in the environment (matches the existing dbConnect.js convention).
//
// ============================================================================
// WHAT CHANGED FROM THE PREVIOUS PASS
// ============================================================================
// Every field below was individually verified against its own FRS field card
// (SCR-003, SCR-005, SCR-006, SCR-007, SCR-008) — not inferred from summary
// tables or the prototype. SCR-005 required OCR (the source PDF has no text
// layer) but every field card was still confirmed directly, not guessed.
//
// Category assignment corrections from the last pass:
// - offer_restrictive_clause: Benefits -> STABILITY. Its own FRS card says
//   "Strong stability signal per prototype scoring engine" — "Security" on
//   its card is the FRS's screen-section label, not a real scoring category.
// - offer_job_security: confirmed Stability (unchanged), now with its real
//   allowed values (Very secure / Somewhat secure / Not sure / Risky), not
//   the generic yesno placeholder used before.
//
// New fields added:
// - offer_probation (Stability) — fully specified in SCR-003's FRS, was
//   missing from the schema entirely until this pass.
// - offer_employer_treatment_signal, offer_leadership_style (both Culture) —
//   new questions created by splitting offer_company_reputation and
//   offer_leadership_stability into a Stability-facing version (kept,
//   wording tightened) and a genuinely distinct Culture-facing version (new),
//   instead of one answer counting in two categories at once.
//
// The generic "yesno" scoreType has been removed (Sprint 10, Epic 10.6 — the
// enum and its yesNoScores sub-schema are gone from OgQuestions.js). Every field
// that was previously "yesno" is "enum" with that field's own literal FRS
// allowed values and explicit per-option scores — no field's score depends on
// the scoring engine guessing which bucket an arbitrary string belongs to.
//
// Score scale: every enum field uses one consistent set of anchor scores —
// 100 (best) / 65 (moderate/second-tier) / 45 (genuine uncertainty — "Not
// clear", "Not sure", null) / 20 (worst) — trimmed to fewer tiers where a
// field has fewer meaningful options, and following the field's own explicit
// FRS ranking language throughout. Two fields deliberately break from this
// scale because their own FRS text is explicit about it:
// - offer_probation: FRS says "all other values including Not clear and
//   Other score lowest" — so Not clear scores 20 here, not the usual 45.
// - offer_restrictive_clause: FRS says "Not clear scores middle" — so it
//   scores 65 here, not the usual 45.
// These are exceptions because the source documents say so explicitly, not
// inconsistency.
//
// scoreType "numeric" fields (offer_working_hours, offer_commute_minutes,
// offer_annual_leave_days) use configurable threshold bands (see
// OgQuestions.js) plus an explicit nullScore for when the value is left
// blank/marked "Not clear" — annual_leave_days' FRS card is explicit that
// this should be a neutral score (45), applied the same way to the other two
// numeric fields for consistency.
//
// STILL EXCLUDED — confirmed correctly out of scope, not gaps:
// - offer_notes (not scored — private notes, per its own FRS card)
// - offer_red_flags (penalty mechanism, not an averaged field)
// - offer_worklife_importance, offer_growth_importance, offer_culture_importance
//   (importance-slider weight modifiers, not scored questions themselves)
// - offer_contract_duration, offer_reporting_level, offer_company_name,
//   offer_job_title (SCR-003) — all confirmed "No scoring impact in MVP" on
//   their own FRS cards
//
// STILL A GENUINE GAP, NOT RESOLVED HERE (flagged for Jamil):
// - SCR-002's evaluation_priorities business rules use pre-taxonomy category
//   names ("Benefits and Security category", "Culture and Manager category")
//   that don't match the final 7-category taxonomy used everywhere else.
//   SCR-002 itself says this mapping is provisional ("Full priority-to-
//   category weight mapping to be defined in the Scoring Rules document") —
//   SCR-010 §7's table is what's actually implemented in OgScoringConfig's
//   priorityCategoryMap below, and needs no change. SCR-002's own text is
//   just stale and worth a cleanup edit at the source.

import mongoose from "mongoose";
import { pathToFileURL } from "node:url";
import { OgQuestions } from "./models/OgQuestions.js";
import { OgScoringConfig } from "./models/OgScoringConfig.js";
import { OgGeography } from "./models/OgGeography.js";
import { OgMarketBenchmarks } from "./models/OgMarketBenchmarks.js";
import { OgFunctionalDomains } from "./models/OgFunctionalDomains.js";
import { OgConsentToggles } from "./models/OgConsentToggles.js";
import { WizardDraft } from "./models/WizardDraft.js";
import { parseGeoData } from "../../offerguide/geoData.js";

// Consistent anchor scores, applied throughout instead of bespoke per-field
// numbers, per the "clean uniform default scale" decision.
const BEST = 100;
const MODERATE = 65;
const UNCLEAR = 45; // genuine uncertainty
const WORST = 20;

// ===========================================================================
// OgQuestions — 48 fields, every one individually verified against its own
// FRS field card. See top-of-file comment for the full change log.
//
// Exported (not just used inline by seed()) so Sprint 5's scoring engine
// unit tests exercise this exact data — the "current seed data" the
// handoff's acceptance criteria refer to — instead of a hand-duplicated copy
// that could silently drift from it.
// ===========================================================================
export const ogQuestionsData = [
  // ===================== Benefits (SCR-005) =====================
  {
    fieldId: "offer_health_coverage", screen: "SCR-005", category: "Benefits",
    label: "Health insurance", helpText: "Select the health insurance coverage included in your offer. Self means coverage for you only. Self + family means your dependents are also covered.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Self + family", sortOrder: 1, active: true, score: BEST },
      { value: "Self", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Other", sortOrder: 4, active: true, score: UNCLEAR },
      { value: "None", sortOrder: 5, active: true, score: WORST },
    ],
    active: true, sortOrder: 1,
  },
  {
    fieldId: "offer_life_insurance", screen: "SCR-005", category: "Benefits",
    label: "Life insurance", helpText: "Select whether life insurance is provided as part of your offer.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Provided", sortOrder: 1, active: true, score: BEST },
      { value: "Not clear", sortOrder: 2, active: true, score: UNCLEAR },
      { value: "Other", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Not provided", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 2,
  },
  {
    fieldId: "offer_retirement_benefits", screen: "SCR-005", category: "Benefits",
    label: "Provident fund / retirement", helpText: "Select whether the offer includes provident fund, gratuity, or retirement plan support. Partial means the employer contributes but not at the full statutory or enhanced level.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Provided", sortOrder: 1, active: true, score: BEST },
      { value: "Partial", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Other", sortOrder: 4, active: true, score: UNCLEAR },
      { value: "Not provided", sortOrder: 5, active: true, score: WORST },
    ],
    active: true, sortOrder: 3,
  },
  {
    fieldId: "offer_annual_leave_days", screen: "SCR-005", category: "Benefits",
    label: "Paid annual leave", helpText: "Enter the number of paid annual leave days stated in your offer letter. If you are not sure, toggle Not clear.",
    uiControl: "numeric_input", scoreType: "numeric",
    numericBands: [
      { upTo: 10, score: 25 },
      { upTo: 15, score: 50 },
      { upTo: 20, score: 75 },
      { upTo: 30, score: 90 },
      { score: 100 },
    ],
    nullScore: 45,
    active: true, sortOrder: 4,
  },
  {
    fieldId: "offer_sick_leave", screen: "SCR-005", category: "Benefits",
    label: "Sick leave", helpText: "Select the sick leave policy as stated in your offer letter or discussed during interviews.",
    uiControl: "dropdown", scoreType: "enum",
    options: [
      { value: "As needed", sortOrder: 1, active: true, score: BEST },
      { value: "15+ days per year", sortOrder: 2, active: true, score: 78 },
      { value: "10 days per year", sortOrder: 3, active: true, score: 55 },
      { value: "5 days per year", sortOrder: 4, active: true, score: 30 },
      { value: "Not clear", sortOrder: 5, active: true, score: UNCLEAR },
      { value: "Other", sortOrder: 6, active: true, score: UNCLEAR },
    ],
    active: true, sortOrder: 5,
  },
  {
    fieldId: "offer_parental_leave", screen: "SCR-005", category: "Benefits",
    label: "Parental leave", helpText: "Select the parental leave policy as stated in your offer letter. Statutory only means the company provides only the legally required minimum. Enhanced means the company goes beyond the statutory minimum. Not applicable if this is not relevant to you.",
    uiControl: "dropdown", scoreType: "enum",
    options: [
      { value: "Enhanced", sortOrder: 1, active: true, score: BEST },
      { value: "Statutory only", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not applicable", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Not clear", sortOrder: 4, active: true, score: UNCLEAR },
      { value: "Other", sortOrder: 5, active: true, score: UNCLEAR },
      { value: "None", sortOrder: 6, active: true, score: WORST },
    ],
    active: true, sortOrder: 6,
  },
  {
    fieldId: "offer_education_reimbursement", screen: "SCR-005", category: "Benefits",
    label: "Education reimbursement", helpText: "Select whether the offer includes financial support for education, courses, or certifications. Limited means partial reimbursement or a capped budget.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Yes", sortOrder: 1, active: true, score: BEST },
      { value: "Limited", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "No", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 7,
  },
  {
    fieldId: "offer_device_support", screen: "SCR-005", category: "Benefits",
    label: "Device support", helpText: "Select whether the company will provide a laptop or work device for this role.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Yes", sortOrder: 1, active: true, score: BEST },
      { value: "Not clear", sortOrder: 2, active: true, score: UNCLEAR },
      { value: "Other", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "No", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 8,
  },
  {
    fieldId: "offer_meal_support", screen: "SCR-005", category: "Benefits",
    label: "Meal support", helpText: "Select whether the company provides meal support such as a subsidised canteen, meal vouchers, or free meals. Do not include cash meal allowances here — those belong in the compensation screen.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Yes", sortOrder: 1, active: true, score: BEST },
      { value: "Partial", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Other", sortOrder: 4, active: true, score: UNCLEAR },
      { value: "No", sortOrder: 5, active: true, score: WORST },
    ],
    active: true, sortOrder: 9,
  },
  {
    fieldId: "offer_wellness_benefits", screen: "SCR-005", category: "Benefits",
    label: "Wellness benefits", helpText: "Select whether the offer includes wellness or mental health support — such as gym memberships, therapy sessions, or an employee assistance programme.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Yes", sortOrder: 1, active: true, score: BEST },
      { value: "Partial", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Other", sortOrder: 4, active: true, score: UNCLEAR },
      { value: "No", sortOrder: 5, active: true, score: WORST },
    ],
    active: true, sortOrder: 10,
  },
  {
    fieldId: "offer_visa_support", screen: "SCR-005", category: "Benefits",
    label: "Visa sponsorship", helpText: "Select whether the company will sponsor your work visa or permit for this role. This is only relevant if you need a visa to work in the country where this role is based.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Provided", sortOrder: 1, active: true, score: BEST },
      { value: "Partial", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not applicable", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Not clear", sortOrder: 4, active: true, score: UNCLEAR },
      { value: "Other", sortOrder: 5, active: true, score: UNCLEAR },
      { value: "Not provided", sortOrder: 6, active: true, score: WORST },
    ],
    active: true, sortOrder: 11,
  },

  // ===================== Stability =====================
  {
    fieldId: "offer_employment_type", screen: "SCR-003", category: "Stability",
    label: "Employment type", helpText: "Select the employment type offered in this role.",
    uiControl: "dropdown", scoreType: "enum",
    options: [
      { value: "Full-time", sortOrder: 1, active: true, score: BEST },
      { value: "Contract", sortOrder: 2, active: true, score: MODERATE },
      { value: "Part-time", sortOrder: 3, active: true, score: WORST },
      { value: "Temporary", sortOrder: 4, active: true, score: WORST },
      { value: "Internship", sortOrder: 5, active: true, score: WORST },
      { value: "Freelance", sortOrder: 6, active: true, score: WORST },
      { value: "Other", sortOrder: 7, active: true, score: WORST },
    ],
    active: true, sortOrder: 1,
  },
  {
    fieldId: "offer_probation", screen: "SCR-003", category: "Stability",
    label: "Probation period", helpText: "Select the probation period as stated in your offer letter. If you are unsure or it was not mentioned, select Not clear.",
    uiControl: "dropdown", scoreType: "enum",
    options: [
      { value: "No probation", sortOrder: 1, active: true, score: BEST },
      { value: "3 months", sortOrder: 2, active: true, score: MODERATE },
      { value: "1 month", sortOrder: 3, active: true, score: WORST },
      { value: "6 months", sortOrder: 4, active: true, score: WORST },
      { value: "Not clear", sortOrder: 5, active: true, score: WORST },
      { value: "Other", sortOrder: 6, active: true, score: WORST },
    ],
    active: true, sortOrder: 2,
  },
  {
    fieldId: "offer_job_security", screen: "SCR-005", category: "Stability",
    label: "Job security feeling", helpText: "Based on your overall impression — how secure does this role feel to you? Consider the company's stability, the role's criticality, and what you picked up during the interview process.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Very secure", sortOrder: 1, active: true, score: BEST },
      { value: "Somewhat secure", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not sure", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Risky", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 3,
  },
  {
    fieldId: "offer_restrictive_clause", screen: "SCR-005", category: "Stability",
    label: "Restrictive clause / bond", helpText: "Does your offer letter include a bond, non-compete clause, or any other restrictive agreement? Yes may limit your ability to change jobs or work for competitors in future. If unsure, check your offer letter or consult a legal advisor.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "No", sortOrder: 1, active: true, score: BEST },
      { value: "Not clear", sortOrder: 2, active: true, score: MODERATE },
      { value: "Yes", sortOrder: 3, active: true, score: WORST },
    ],
    active: true, sortOrder: 4,
  },
  {
    fieldId: "offer_company_reputation", screen: "SCR-008", category: "Stability",
    label: "Company reputation", helpText: "Based on your research, how would you rate this company's overall market reputation and organizational stability?",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Strong", sortOrder: 1, active: true, score: BEST },
      { value: "Mixed", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Other", sortOrder: 4, active: true, score: UNCLEAR },
      { value: "Weak", sortOrder: 5, active: true, score: WORST },
    ],
    active: true, sortOrder: 5,
  },
  {
    fieldId: "offer_leadership_stability", screen: "SCR-008", category: "Stability",
    label: "Leadership stability", helpText: "How stable has this company's leadership team been — any recent departures, reorganizations, or turnover?",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Stable", sortOrder: 1, active: true, score: BEST },
      { value: "Not clear", sortOrder: 2, active: true, score: UNCLEAR },
      { value: "Changing", sortOrder: 3, active: true, score: WORST },
    ],
    active: true, sortOrder: 6,
  },

  // ===================== Culture (SCR-008) =====================
  {
    fieldId: "offer_manager_impression", screen: "SCR-008", category: "Culture",
    label: "Manager impression", helpText: "Rate your overall impression of the hiring manager based on your interviews. Concerning signals a potential red flag worth investigating before accepting.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Strong", sortOrder: 1, active: true, score: BEST },
      { value: "Positive", sortOrder: 2, active: true, score: 80 },
      { value: "Neutral", sortOrder: 3, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 4, active: true, score: UNCLEAR },
      { value: "Concerning", sortOrder: 5, active: true, score: WORST },
    ],
    active: true, sortOrder: 1,
  },
  {
    fieldId: "offer_team_culture_fit", screen: "SCR-008", category: "Culture",
    label: "Team culture fit", helpText: "How well do you think you'd fit with this team's culture? 1 = Not at all, 5 = Perfect fit.",
    uiControl: "rating_radio_cards", scoreType: "rating", ratingMultiplier: 20, active: true, sortOrder: 2,
  },
  {
    fieldId: "offer_values_alignment", screen: "SCR-008", category: "Culture",
    label: "Values alignment", helpText: "How well do the company's stated values align with your personal values? 1 = No alignment, 5 = Strong alignment.",
    uiControl: "rating_radio_cards", scoreType: "rating", ratingMultiplier: 20, active: true, sortOrder: 3,
  },
  {
    fieldId: "offer_inclusion_confidence", screen: "SCR-008", category: "Culture",
    label: "D&I confidence", helpText: "How confident are you that this company values diversity and inclusion? Base this on what you observed during the interview process and any research you have done.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "High", sortOrder: 1, active: true, score: BEST },
      { value: "Medium", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Low", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 4,
  },
  {
    fieldId: "offer_work_pressure", screen: "SCR-008", category: "Culture",
    label: "Work pressure", helpText: "Based on what you observed, how would you describe the day-to-day work pressure?",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Healthy", sortOrder: 1, active: true, score: BEST },
      { value: "Not clear", sortOrder: 2, active: true, score: UNCLEAR },
      { value: "High", sortOrder: 3, active: true, score: MODERATE },
      { value: "Very high", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 5,
  },
  {
    fieldId: "offer_psych_safety", screen: "SCR-008", category: "Culture",
    label: "Psychological safety", helpText: "Based on your interviews, do you feel you could speak up, ask questions, or disagree without fear? This is a key signal of a healthy team culture.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "High", sortOrder: 1, active: true, score: BEST },
      { value: "Medium", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Low", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 6,
  },
  {
    fieldId: "offer_employer_treatment_signal", screen: "SCR-008", category: "Culture",
    label: "How this company treats employees", helpText: "Based on reviews, research, or what you've heard, how would you describe the way this company treats its employees day-to-day?",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Positive", sortOrder: 1, active: true, score: BEST },
      { value: "Mixed", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Negative", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 7,
  },
  {
    fieldId: "offer_leadership_style", screen: "SCR-008", category: "Culture",
    label: "Leadership approachability", helpText: "Based on what you observed, how would you describe the leadership team's day-to-day style and approachability?",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Approachable", sortOrder: 1, active: true, score: BEST },
      { value: "Mixed", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Distant", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 8,
  },

  // ===================== Purpose (SCR-008) =====================
  {
    fieldId: "offer_purpose_sense", screen: "SCR-008", category: "Purpose",
    label: "Sense of purpose", helpText: "How much sense of meaning or purpose do you think this role and company would give you? 1 = No sense of purpose, 5 = Strong sense of purpose.",
    uiControl: "rating_radio_cards", scoreType: "rating", ratingMultiplier: 20, active: true, sortOrder: 1,
  },

  // ===================== Work-Life (SCR-006) =====================
  {
    fieldId: "offer_weekend_work", screen: "SCR-006", category: "Work-Life",
    label: "Weekend work frequency", helpText: "Select how often you would be expected to work on weekends in this role.",
    uiControl: "dropdown", scoreType: "enum",
    options: [
      { value: "Never", sortOrder: 1, active: true, score: BEST },
      { value: "Rarely", sortOrder: 2, active: true, score: 80 },
      { value: "Sometimes", sortOrder: 3, active: true, score: 60 },
      { value: "Not clear", sortOrder: 4, active: true, score: UNCLEAR },
      { value: "Often", sortOrder: 5, active: true, score: 30 },
      { value: "Alternate", sortOrder: 6, active: true, score: 30 },
    ],
    active: true, sortOrder: 1,
  },
  {
    fieldId: "offer_travel_requirement", screen: "SCR-006", category: "Work-Life",
    label: "Travel requirement", helpText: "Select how much travel is expected in this role. Occasional means a few times per year. Frequent means regular travel that significantly affects your schedule.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "None", sortOrder: 1, active: true, score: BEST },
      { value: "Occasional", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Frequent", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 2,
  },
  {
    fieldId: "offer_hybrid_days", screen: "SCR-006", category: "Work-Life",
    label: "Hybrid days per week", helpText: "Select how many days per week you are expected to work from the office. Select Not applicable if the role is fully on-site or fully remote.",
    uiControl: "dropdown", scoreType: "enum",
    options: [
      { value: "Flexible", sortOrder: 1, active: true, score: BEST },
      { value: "1 day", sortOrder: 2, active: true, score: 90 },
      { value: "2-3 days", sortOrder: 3, active: true, score: MODERATE },
      { value: "Not applicable", sortOrder: 4, active: true, score: UNCLEAR },
      { value: "Not clear", sortOrder: 5, active: true, score: UNCLEAR },
      { value: "4+ days", sortOrder: 6, active: true, score: 30 },
    ],
    active: true, sortOrder: 3,
  },
  {
    fieldId: "offer_time_flexibility", screen: "SCR-006", category: "Work-Life",
    label: "Time flexibility", helpText: "Select how flexible the working hours are in this role. High means you can choose when to start and end your day. Low means fixed hours with no flexibility.",
    uiControl: "dropdown", scoreType: "enum",
    options: [
      { value: "High", sortOrder: 1, active: true, score: BEST },
      { value: "Medium", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Low", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 4,
  },
  {
    fieldId: "offer_wfh_support", screen: "SCR-006", category: "Work-Life",
    label: "WFH support", helpText: "Select the level of work-from-home support for this role. Sometimes means occasional WFH is permitted but not the norm. Fully supported means you can work from home as needed without restriction.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Fully supported", sortOrder: 1, active: true, score: BEST },
      { value: "Sometimes", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Not offered", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 5,
  },
  {
    fieldId: "offer_overtime_compensation", screen: "SCR-006", category: "Work-Life",
    label: "Overtime compensation", helpText: "Select whether overtime is compensated in this role. Yes means any overtime is paid or offset with time off. No means overtime is expected but not compensated.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Yes", sortOrder: 1, active: true, score: BEST },
      { value: "Not clear", sortOrder: 2, active: true, score: UNCLEAR },
      { value: "No", sortOrder: 3, active: true, score: WORST },
    ],
    active: true, sortOrder: 6,
  },
  {
    fieldId: "offer_after_hours_availability", screen: "SCR-006", category: "Work-Life",
    label: "After hours availability", helpText: "Based on what you observed during interviews, how often would you be expected to be available after working hours?",
    uiControl: "dropdown", scoreType: "enum",
    options: [
      { value: "Rarely", sortOrder: 1, active: true, score: BEST },
      { value: "Sometimes", sortOrder: 2, active: true, score: 70 },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Often", sortOrder: 4, active: true, score: 40 },
      { value: "Always", sortOrder: 5, active: true, score: WORST },
    ],
    active: true, sortOrder: 7,
  },
  {
    fieldId: "offer_leave_flexibility", screen: "SCR-006", category: "Work-Life",
    label: "Leave approval flexibility", helpText: "Select how flexible the leave approval process appears to be in this role. High means leave is easy to get approved. Low means leave requires significant advance notice or is frequently denied.",
    uiControl: "dropdown", scoreType: "enum",
    options: [
      { value: "High", sortOrder: 1, active: true, score: BEST },
      { value: "Medium", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Low", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 8,
  },
  {
    fieldId: "offer_personal_energy", screen: "SCR-006", category: "Work-Life",
    label: "Personal energy fit", helpText: "Based on everything you know about this role so far — how do you think it will affect your energy levels? Trust your gut feeling here.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Energizing", sortOrder: 1, active: true, score: BEST },
      { value: "Manageable", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not sure", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Tiring", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 9,
  },
  {
    fieldId: "offer_working_hours", screen: "SCR-006", category: "Work-Life",
    label: "Working hours per week", helpText: "Enter the average number of hours you are expected to work each week in this role.",
    uiControl: "numeric_input", scoreType: "numeric",
    numericBands: [
      { upTo: 35, score: 100 },
      { upTo: 40, score: 85 },
      { upTo: 45, score: 65 },
      { upTo: 50, score: 45 },
      { score: 20 },
    ],
    nullScore: 45,
    active: true, sortOrder: 10,
  },
  {
    fieldId: "offer_commute_minutes", screen: "SCR-006", category: "Work-Life",
    label: "Commute time", helpText: "Enter your estimated daily commute time in minutes (total round trip). Leave blank if you are not sure yet.",
    uiControl: "numeric_input", scoreType: "numeric",
    numericBands: [
      { upTo: 30, score: 90 },
      { upTo: 60, score: 70 },
      { upTo: 90, score: 48 },
      { score: 30 },
    ],
    nullScore: 45,
    active: true, sortOrder: 11,
  },

  // ===================== Growth (SCR-007) =====================
  {
    fieldId: "offer_goal_match", screen: "SCR-007", category: "Growth",
    label: "Goal match", helpText: "How well does this role align with your long-term career goals? 1 = Not at all, 5 = Perfect match.",
    uiControl: "rating_radio_cards", scoreType: "rating", ratingMultiplier: 20, active: true, sortOrder: 1,
  },
  {
    fieldId: "offer_learning_budget", screen: "SCR-007", category: "Growth",
    label: "Learning budget", helpText: "Does the company provide a budget for learning — such as online courses, certifications, or conferences?",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Yes", sortOrder: 1, active: true, score: BEST },
      { value: "Not clear", sortOrder: 2, active: true, score: UNCLEAR },
      { value: "Other", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "No", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 2,
  },
  {
    fieldId: "offer_training_support", screen: "SCR-007", category: "Growth",
    label: "Training support", helpText: "How much structured training or onboarding support does this role provide?",
    uiControl: "dropdown", scoreType: "enum",
    options: [
      { value: "Strong", sortOrder: 1, active: true, score: BEST },
      { value: "Moderate", sortOrder: 2, active: true, score: 75 },
      { value: "Limited", sortOrder: 3, active: true, score: 50 },
      { value: "Not clear", sortOrder: 4, active: true, score: UNCLEAR },
      { value: "None", sortOrder: 5, active: true, score: WORST },
    ],
    active: true, sortOrder: 3,
  },
  {
    fieldId: "offer_promotion_path", screen: "SCR-007", category: "Growth",
    label: "Promotion path clarity", helpText: "Is there a clear promotion path for this role? Yes means the company has defined career levels and timelines. Somewhat means progression exists but is informal or unclear.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Yes", sortOrder: 1, active: true, score: BEST },
      { value: "Somewhat", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "No", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 4,
  },
  {
    fieldId: "offer_mentorship", screen: "SCR-007", category: "Growth",
    label: "Mentorship access", helpText: "Will you have access to mentorship in this role? Yes means formal or informal mentorship from experienced leaders. Somewhat means limited or ad hoc mentorship opportunities.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Yes", sortOrder: 1, active: true, score: BEST },
      { value: "Somewhat", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "No", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 5,
  },
  {
    fieldId: "offer_strong_leaders", screen: "SCR-007", category: "Growth",
    label: "Exposure to strong leaders", helpText: "Based on your interviews, will this role give you exposure to strong, inspiring leaders? Consider the quality of leadership you observed during the interview process.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Yes", sortOrder: 1, active: true, score: BEST },
      { value: "Somewhat", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "No", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 6,
  },
  {
    fieldId: "offer_internal_mobility", screen: "SCR-007", category: "Growth",
    label: "Internal mobility", helpText: "Does this company support internal mobility — moving to different roles or teams within the organisation?",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "Yes", sortOrder: 1, active: true, score: BEST },
      { value: "Somewhat", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "No", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 7,
  },
  {
    fieldId: "offer_role_scope", screen: "SCR-007", category: "Growth",
    label: "Role scope", helpText: "How would you describe the scope of this role? Narrow means focused, specialist work. Balanced means a mix of depth and breadth. High ownership means significant autonomy and decision-making responsibility.",
    uiControl: "radio_cards", scoreType: "enum",
    options: [
      { value: "High ownership", sortOrder: 1, active: true, score: BEST },
      { value: "Balanced", sortOrder: 2, active: true, score: MODERATE },
      { value: "Not clear", sortOrder: 3, active: true, score: UNCLEAR },
      { value: "Narrow", sortOrder: 4, active: true, score: WORST },
    ],
    active: true, sortOrder: 8,
  },
  {
    fieldId: "offer_brand_value", screen: "SCR-007", category: "Growth",
    label: "Brand value for CV", helpText: "How much would working at this company strengthen your CV and future career prospects? 1 = Low impact, 5 = High impact.",
    uiControl: "rating_radio_cards", scoreType: "rating", ratingMultiplier: 20, active: true, sortOrder: 9,
  },
  {
    fieldId: "offer_skill_potential", screen: "SCR-007", category: "Growth",
    label: "Skill-building potential", helpText: "How much potential does this role have to grow your skills? 1 = Minimal, 5 = Significant.",
    uiControl: "rating_radio_cards", scoreType: "rating", ratingMultiplier: 20, active: true, sortOrder: 10,
  },
  {
    fieldId: "offer_promotion_timeline", screen: "SCR-007", category: "Growth",
    label: "Promotion timeline", helpText: "Based on what was discussed in interviews, when might you expect to be considered for promotion?",
    uiControl: "dropdown", scoreType: "enum",
    options: [
      { value: "3-6 months", sortOrder: 1, active: true, score: BEST },
      { value: "6-12 months", sortOrder: 2, active: true, score: 70 },
      { value: "12-18 months", sortOrder: 3, active: true, score: 40 },
      { value: "Not clear", sortOrder: 4, active: true, score: UNCLEAR },
      { value: "Other", sortOrder: 5, active: true, score: UNCLEAR },
      { value: "18+ months", sortOrder: 6, active: true, score: WORST },
    ],
    active: true, sortOrder: 11,
  },
];

// ===========================================================================
// OgScoringConfig — v1 is the schema-defaults baseline (every adjustment
// layer at zero effect, matching the prototype's actual base+priority-only
// behavior exactly). v2 is the active config and exercises the
// importance-slider adjustment layers with non-zero values, per §3.3 of the
// Sprint 5 handoff ("the mechanism must exist and be exercised by tests").
// Exported for the same "single source of truth for tests" reason as
// ogQuestionsData above.
// ===========================================================================
export const ogScoringConfigsData = [
  {
    version: 1,
    effectiveFrom: new Date("2026-07-01"),
    isActive: false,
  },
  {
    version: 2,
    effectiveFrom: new Date(),
    isActive: true,
    importanceWeighting: {
      offer_worklife_importance: { Low: -0.4, Medium: 0, High: 0.4 },
      offer_growth_importance: { perPointIncrement: 0.2 },
      offer_culture_importance: { perPointIncrement: 0.2 },
    },
  },
];

// ===========================================================================
// OgMarketBenchmarks — 2 role/location pairs. Exported for the same reason
// as above — the salary scoring engine's unit tests exercise this exact data.
// ===========================================================================
export const ogMarketBenchmarksData = [
  {
    role: "Software Engineer", location: "Lahore", currency: "PKR",
    p25: 220000, p50: 280000, p75: 350000, sampleSize: 42,
  },
  {
    role: "Data Analyst", location: "Karachi", currency: "PKR",
    p25: 150000, p50: 180000, p75: 220000, sampleSize: 27,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected. Seeding OfferGuide collections...");

  // ===========================================================================
  // OgQuestions
  // ===========================================================================
  const allFieldIds = ogQuestionsData.map((q) => q.fieldId);
  await OgQuestions.deleteMany({ fieldId: { $in: allFieldIds } });
  await OgQuestions.insertMany(ogQuestionsData);
  console.log(`✓ OgQuestions seeded (${allFieldIds.length} fully FRS-verified fields)`);

  // ===========================================================================
  // OgScoringConfig — default priorityCategoryMap already matches SCR-010
  // §7's authoritative table exactly.
  // ===========================================================================
  await OgScoringConfig.deleteMany({ version: { $in: ogScoringConfigsData.map((c) => c.version) } });
  await OgScoringConfig.insertMany(ogScoringConfigsData);
  console.log("✓ OgScoringConfig seeded (v1 + v2)");

  // ===========================================================================
  // OgGeography — every country, from the shared geoData dataset.
  //
  // Deliberately NOT deleteMany + insertMany like the collections above.
  // Geography is the one collection admins edit at runtime (the admin config
  // routes add and deactivate cities), so a full rebuild here would silently
  // discard their work every time anyone reseeded the question bank. Countries
  // that already exist keep their stored cities and active flags; only genuinely
  // new entries are written.
  //
  // scripts/seed-geography.mjs runs this same merge on its own, for when only
  // the location lists need topping up.
  // ===========================================================================
  const geoCountries = parseGeoData();
  let geoCreated = 0;
  let geoCitiesAdded = 0;

  for (const country of geoCountries) {
    const existing = await OgGeography.findOne({ countryCode: country.countryCode });

    if (!existing) {
      await OgGeography.create(country);
      geoCreated += 1;
      geoCitiesAdded += country.cities.length;
      continue;
    }

    const seen = new Set(existing.cities.map((c) => c.cityId));
    const additions = country.cities.filter((c) => !seen.has(c.cityId));
    if (additions.length > 0) {
      existing.cities.push(...additions);
      geoCitiesAdded += additions.length;
      await existing.save();
    }
  }

  console.log(
    `✓ OgGeography seeded (${geoCountries.length} countries known, ` +
      `${geoCreated} created, ${geoCitiesAdded} cities added)`
  );

  // ===========================================================================
  // OgMarketBenchmarks
  // ===========================================================================
  await OgMarketBenchmarks.deleteMany({
    $or: ogMarketBenchmarksData.map(({ role, location }) => ({ role, location })),
  });
  await OgMarketBenchmarks.insertMany(ogMarketBenchmarksData);
  console.log("✓ OgMarketBenchmarks seeded (2 role/location pairs)");

  // ===========================================================================
  // OgFunctionalDomains — unchanged
  // ===========================================================================
  await OgFunctionalDomains.deleteMany({ domainId: { $in: ["engineering", "marketing"] } });
  await OgFunctionalDomains.insertMany([
    { domainId: "engineering", name: "Engineering & Technology", active: true, sortOrder: 1 },
    { domainId: "marketing", name: "Marketing & Communications", active: true, sortOrder: 2 },
  ]);
  console.log("✓ OgFunctionalDomains seeded (2 sample domains)");

  // ===========================================================================
  // OgConsentToggles — completed to the full set of 6 in Sprint 6.
  //
  // Previously seeded 3 of 6 and flagged as out of scope. Sprint 6 puts the
  // consent card on SCR-001 and its DoD calls for "six toggles: master
  // consent_share_anonymous, plus five sub-toggles — salary ranges, benefits
  // patterns, growth signals, culture signals, acceptance patterns". The card
  // renders whatever this collection returns, so the missing three were a data
  // gap rather than a UI one.
  // ===========================================================================
  await OgConsentToggles.deleteMany({
    toggleId: {
      $in: [
        "consent_share_anonymous",
        "consent_salary_ranges",
        "consent_benefits_patterns",
        "consent_growth_signals",
        "consent_culture_signals",
        "consent_acceptance_patterns",
      ],
    },
  });
  await OgConsentToggles.insertMany([
    {
      toggleId: "consent_share_anonymous",
      label: "Contribute my anonymised pattern",
      helpText: "Toggle on to help improve market intelligence for all candidates. Your data is fully anonymised before contributing.",
      sourceScreen: "SCR-001", isMaster: true, active: true, sortOrder: 0,
    },
    {
      toggleId: "consent_salary_ranges",
      label: "Salary ranges",
      helpText: "Share your anonymised salary range to help improve salary benchmarks for similar roles.",
      sourceScreen: "SCR-004", isMaster: false, active: true, sortOrder: 1,
    },
    {
      toggleId: "consent_benefits_patterns",
      label: "Benefits patterns",
      helpText: "Share your anonymised benefits package to help others see what is typical for similar roles.",
      sourceScreen: "SCR-005", isMaster: false, active: true, sortOrder: 2,
    },
    {
      toggleId: "consent_growth_signals",
      label: "Growth signals",
      helpText: "Share your anonymised growth signals to help others understand career development opportunities in similar roles.",
      sourceScreen: "SCR-007", isMaster: false, active: true, sortOrder: 3,
    },
    {
      toggleId: "consent_culture_signals",
      label: "Culture signals",
      helpText: "Share your anonymised culture and manager signals to help others read what a workplace is actually like.",
      sourceScreen: "SCR-008", isMaster: false, active: true, sortOrder: 4,
    },
    {
      toggleId: "consent_acceptance_patterns",
      label: "Acceptance patterns",
      helpText: "Share whether you accepted or declined, anonymised, to help others understand which offers candidates take.",
      sourceScreen: "SCR-010", isMaster: false, active: true, sortOrder: 5,
    },
  ]);
  console.log("✓ OgConsentToggles seeded (master + 5 sub-toggles — full set of 6)");

  // ===========================================================================
  // WizardDraft — unchanged
  // ===========================================================================
  await WizardDraft.deleteMany({ candidateProfileId: { $in: [9001, 9002] } });
  await WizardDraft.insertMany([
    {
      candidateProfileId: 9001, evaluationSessionId: 5001, currentScreen: "SCR-004",
      answers: {
        career_stage: "Mid-Level", preferred_work_arrangement: "Hybrid",
        evaluation_type: "New job offer", offer_work_arrangement: "Hybrid",
        offer_employment_type: "Full-time",
      },
    },
    {
      candidateProfileId: 9002, currentScreen: "SCR-001",
      answers: { career_stage: "Entry Level" },
    },
  ]);
  console.log("✓ WizardDraft seeded (2 sample drafts)");

  console.log("\nAll collections seeded. Inspect with: mongosh, or Compass, against the og_* / wizard_drafts collections.");
  await mongoose.disconnect();
}

// Only auto-run when executed directly (`node seed-offerguide.js`) — not
// when imported for its exported data (e.g. by the scoring engine's unit
// tests), so importing this module never opens a live Mongo connection.
const isMainModule = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isMainModule) {
  seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
