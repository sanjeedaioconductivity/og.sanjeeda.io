/**
 * Thin client over the Sprint 4 candidate API.
 *
 * Two rules run through everything here:
 *
 * 1. `credentials: 'include'` on every call. Identity is a `guestToken` httpOnly
 *    cookie the server mints on first read/write, or a portal JWT. The frontend
 *    never reads, sets or even sees the token — it just has to let the browser
 *    send it. Drop this and every guest silently becomes a new person on each
 *    request.
 *
 * 2. 404 is an empty state, not an error. `GET /candidate-profile` and
 *    `GET /wizard-draft` both answer 404 for a first-time visitor. Callers get
 *    `null` and carry on.
 *
 * MySQL is the system of record via /candidate-profile and /offers/*. WizardDraft
 * is explicitly NOT — it is resume convenience only.
 */

const BASE = '/api/offerguide';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (res.status === 404) return null;
  if (res.status === 204) return null;

  if (!res.ok) {
    // The Sprint 4 routes answer { error: "..." } — surface the server's own
    // message where there is one, since enum rejections name the allowed values.
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body?.error === 'string') message = body.error;
    } catch {
      /* non-JSON body — keep the generic message */
    }
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ profile */

export type CandidateProfile = {
  id: number;
  careerStage: string;
  careerStageOtherText: string | null;
  careerSwitcher: string | null;
  targetFunctionalDomain: string | null;
  currentCountry: string | null;
  currentCity: string | null;
  preferredWorkArrangement: string;
  preferredWorkLocation: string | null;
  preferredCountry: string | null;
  preferredLocationText: string | null;
  willingToRelocate: string | null;
  currentWorkArrangement: string | null;
  currentJobTitle: string | null;
  employmentType: string | null;
  employmentStatus: string | null;
  currentBaseSalary: string | null;
  currentCurrency: string | null;
  payFrequency: string | null;
  workingHoursPerWeek: number | null;
  averageDailyCommuteMinutes: number | null;
  currentBenefits: string[] | null;
  overallJobSatisfaction: number | null;
  careerGrowthSatisfaction: number | null;
  workLifeBalanceSatisfaction: number | null;
  consentSettings: ConsentSettings | null;
};

export type ConsentSettings = {
  shareAnonymous?: boolean;
  selections?: Record<string, boolean>;
};

export function getCandidateProfile() {
  return request<CandidateProfile>('/candidate-profile');
}

export function createCandidateProfile(body: Record<string, unknown>) {
  return request<CandidateProfile>('/candidate-profile', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateCandidateProfile(body: Record<string, unknown>) {
  return request<CandidateProfile>('/candidate-profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * Consent lives on its own route, and returns the settings object rather than the
 * whole profile.
 *
 * `PATCH /candidate-profile` deliberately ignores `consentSettings` — only POST
 * accepts it there — so an existing profile's consent has to go through
 * /candidate-profile/consent. Sending it to the main PATCH looks like it works and
 * silently changes nothing.
 *
 * The route 404s when no profile exists yet, so consent must always be written
 * AFTER the profile save, never alongside it.
 */
export function updateConsent(body: ConsentSettings) {
  return request<ConsentSettings>('/candidate-profile/consent', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * Create-or-update, so callers don't have to track whether a profile exists.
 * POST answers 400 ("A profile already exists…") on a repeat, which is a normal
 * outcome on a return visit rather than a failure — fall through to PATCH.
 */
export async function saveCandidateProfile(body: Record<string, unknown>) {
  const existing = await getCandidateProfile();
  if (existing) return updateCandidateProfile(body);
  return createCandidateProfile(body);
}

/* -------------------------------------------------------------------- draft */

export type WizardDraft = {
  currentScreen: string;
  answers: Record<string, unknown>;
  updatedAt?: string;
};

export function getWizardDraft() {
  return request<WizardDraft>('/wizard-draft');
}

/**
 * Draft writes are best-effort. A failed autosave must never block the candidate:
 * the real data has already gone to MySQL through the screen's own save, and the
 * 30-day TTL is enforced by the Mongo index, never here.
 *
 * Writes are serialised through one promise chain. Step changes no longer wait
 * for the flush before navigating (it was a full extra round trip on every
 * "Saving…" — QA report A3), so the leaving screen's PUT can still be in flight
 * when the arriving screen's first autosave fires. Without ordering, a slow
 * earlier write could land last and drag `currentScreen` back a step; the chain
 * guarantees the last call is the last write.
 */
let draftWriteChain: Promise<unknown> = Promise.resolve();

export function saveWizardDraft(
  currentScreen: string,
  answers: Record<string, unknown>,
): Promise<WizardDraft | null> {
  const write = draftWriteChain.then(() =>
    request<WizardDraft>('/wizard-draft', {
      method: 'PUT',
      body: JSON.stringify({ currentScreen, answers }),
    }).catch(() => null),
  );
  draftWriteChain = write;
  return write;
}

/* ---------------------------------------------------------------- session */

export type EvaluationSession = {
  id: number;
  candidateProfileId: number;
  evaluationType: string;
  evaluationOfferCount: string;
  evaluationPriorities: string[];
  evaluationPriorityOtherText: string | null;
  scoringConfigVersion: number;
  offers?: Offer[];
};

/**
 * Most-recent-first. SCR-002 is shown once per session, never repeated when a
 * second or third offer is added — so callers use the newest session in this list
 * as "the current one" rather than always creating a fresh row.
 */
export function getEvaluationSessions() {
  return request<EvaluationSession[]>('/evaluation-sessions');
}

export function getEvaluationSession(sessionId: number) {
  return request<EvaluationSession>(`/evaluation-sessions/${sessionId}`);
}

/**
 * The server stamps `scoringConfigVersion` itself on creation — the frontend must
 * never send or override it (SCR-002 FRS, Sprint 6 DoD). Nothing in this body ever
 * includes that field.
 */
export function createEvaluationSession(body: {
  evaluationType: string;
  evaluationOfferCount: string;
  evaluationPriorities: string[];
  evaluationPriorityOtherText?: string | null;
}) {
  return request<EvaluationSession>('/evaluation-sessions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/* ------------------------------------------------------------------ offers */

export type Offer = {
  id: number;
  evaluationSessionId: number;
  label: string | null;
  companyName: string | null;
  roleTitle: string | null;
  offerFunctionalDomain: string | null;
  offerReceivedDate: string | null;
  offerCountry: string | null;
  offerCity: string | null;
  offerWorkArrangement: string;
  offerEmploymentType: string;
  offerContractDuration: string | null;
  offerContractDurationOtherText: string | null;
  offerProbation: string | null;
  offerProbationOtherText: string | null;
  reportingLevel: string | null;
  reportingLevelOtherText: string | null;
};

export function createOffer(
  sessionId: number,
  body: Record<string, unknown>,
) {
  return request<Offer>(`/evaluation-sessions/${sessionId}/offers`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * The offer with all five per-step child rows. Each is null until its screen
 * has been saved once, which is what the module stepper reads as "done".
 */
export type OfferWithSteps = Offer & {
  compensation: OfferCompensation | null;
  benefitsSecurity: OfferBenefitsSecurity | null;
  workLife: OfferWorkLife | null;
  growth: OfferGrowth | null;
  culture: OfferCulture | null;
};

export function getOffer(offerId: number) {
  return request<OfferWithSteps>(`/offers/${offerId}`);
}

export function updateOffer(offerId: number, body: Record<string, unknown>) {
  return request<Offer>(`/offers/${offerId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * Deletes the offer and its sub-model rows (the route runs that in one
 * transaction). Answers 204, which `request` maps to null; a 404 (not this
 * candidate's offer, or already gone) is also null rather than an error.
 */
export function deleteOffer(offerId: number) {
  return request<null>(`/offers/${offerId}`, { method: 'DELETE' });
}

export type OfferCompensation = {
  offerId: number;
  offerBaseSalary: string;
  offerPayPeriod: string;
  offerCurrency: string;
  offerGrossNet: string | null;
  offerTakeHome: string | null;
  offerSigningBonus: string | null;
  offerAnnualBonus: string | null;
  offerAnnualBonusType: string | null;
  offerCommission: string | null;
  offerCommissionType: string | null;
  offerEquity: string | null;
  offerEquityType: string | null;
  offerTransportAllowance: string | null;
  offerTransportFrequency: string | null;
  offerOtherAllowance: string | null;
  offerOtherAllowanceFrequency: string | null;
  offerRelocationSupport: string | null;
  offerRelocationAmount: string | null;
  offerReviewCycle: string | null;
  offerReviewCycleOtherText: string | null;
  offerNegotiationRoom: string | null;
};

export function updateOfferCompensation(
  offerId: number,
  body: Record<string, unknown>,
) {
  return request<OfferCompensation>(`/offers/${offerId}/compensation`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export type OfferBenefitsSecurity = {
  offerId: number;
  offerHealthCoverage: string | null;
  offerHealthCoverageOtherText: string | null;
  offerLifeInsurance: string | null;
  offerLifeInsuranceOtherText: string | null;
  offerRetirementBenefits: string | null;
  offerRetirementBenefitsOtherText: string | null;
  offerAnnualLeaveDays: number | null;
  offerSickLeave: string | null;
  offerSickLeaveOtherText: string | null;
  offerParentalLeave: string | null;
  offerParentalLeaveOtherText: string | null;
  offerEducationReimbursement: string | null;
  offerDeviceSupport: string | null;
  offerDeviceSupportOtherText: string | null;
  offerMealSupport: string | null;
  offerMealSupportOtherText: string | null;
  offerWellnessBenefits: string | null;
  offerWellnessBenefitsOtherText: string | null;
  offerVisaSupport: string | null;
  offerVisaSupportOtherText: string | null;
  offerJobSecurity: string | null;
  offerRestrictiveClause: string | null;
};

export function updateOfferBenefitsSecurity(
  offerId: number,
  body: Record<string, unknown>,
) {
  return request<OfferBenefitsSecurity>(`/offers/${offerId}/benefits-security`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/* ------------------------------------------- SCR-006 / 007 / 008 field groups */

export type OfferWorkLife = {
  offerId: number;
  offerWorkingHours: number | null;
  offerWeekendWork: string | null;
  offerTravelRequirement: string | null;
  offerHybridDays: string | null;
  offerCommuteMinutes: number | null;
  offerTimeFlexibility: string | null;
  offerWfhSupport: string | null;
  offerOvertimeCompensation: string | null;
  offerAfterHoursAvailability: string | null;
  offerLeaveFlexibility: string | null;
  offerPersonalEnergy: string | null;
  offerWorklifeImportance: string | null;
};

export function updateOfferWorkLife(
  offerId: number,
  body: Record<string, unknown>,
) {
  return request<OfferWorkLife>(`/offers/${offerId}/worklife`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export type OfferGrowth = {
  offerId: number;
  offerLearningBudget: string | null;
  offerTrainingSupport: string | null;
  offerBrandValue: number | null;
  offerSkillPotential: number | null;
  offerGoalMatch: number | null;
  offerPromotionPath: string | null;
  offerMentorship: string | null;
  offerStrongLeaders: string | null;
  offerInternalMobility: string | null;
  offerRoleScope: string | null;
  offerPromotionTimeline: string | null;
  offerGrowthImportance: number | null;
};

export function updateOfferGrowth(
  offerId: number,
  body: Record<string, unknown>,
) {
  return request<OfferGrowth>(`/offers/${offerId}/growth`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export type OfferCulture = {
  offerId: number;
  offerManagerImpression: string | null;
  offerTeamCultureFit: number | null;
  offerRedFlags: string[] | null;
  offerNotes: string | null;
  offerValuesAlignment: number | null;
  offerInclusionConfidence: string | null;
  offerWorkPressure: string | null;
  offerCompanyReputation: string | null;
  offerLeadershipStability: string | null;
  offerEmployerTreatmentSignal: string | null;
  offerLeadershipStyle: string | null;
  offerPsychSafety: string | null;
  offerPurposeSense: number | null;
  offerCultureImportance: number | null;
};

export function updateOfferCulture(
  offerId: number,
  body: Record<string, unknown>,
) {
  return request<OfferCulture>(`/offers/${offerId}/culture`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/* -------------------------------------------------------------------- scoring */

/**
 * The scoring engine's output. Every value here is READ and rendered — SCR-010
 * must never recompute, re-derive or "sanity-check" any of it (Sprint 7 §5,
 * "Non-negotiable"). `strengths` / `watchOuts` / `nextSteps` are derived
 * server-side by `deriveGuidance()` per SCR-010 §6.3–6.5.
 */
export type OfferScore = {
  offerId?: number;
  salaryScore: number;
  benefitsScore: number;
  stabilityScore: number;
  worklifeScore: number;
  growthScore: number;
  cultureScore: number;
  purposeScore: number;
  overallScore: number;
  recommendationLabel: string;
  strengths: { category: string; score: number }[];
  watchOuts: string[];
  nextSteps: string[];
  scoringConfigVersion: number;
  fieldScoringRulesVersion: number;
};

/**
 * Computes and persists this offer's score, then returns it. Safe to call
 * repeatedly — the backend re-scores from the offer's current answers and
 * overwrites the prior result, so entering SCR-010 always reflects the latest
 * answers rather than a stale row.
 */
export function computeOfferScore(offerId: number) {
  return request<OfferScore>(`/offers/${offerId}/compute-score`, { method: 'POST' });
}

/**
 * Reads the stored score without recomputing. Use this when the score should
 * reflect what was computed before (revisiting a result) rather than being
 * re-run against the current answers — `computeOfferScore` is the one with the
 * side effect. Resolves to null when the offer has never been scored.
 */
export function getOfferScore(offerId: number) {
  return request<OfferScore>(`/offers/${offerId}/score`).catch(() => null);
}

/** SCR-009's comparison, including the server-decided winner. */
export type SessionComparison = {
  sessionId: number;
  evaluationOfferCount: string | null;
  offerCount: number;
  bestOverallScore: number | null;
  /** True when more than one offer shares the top score — badge BOTH. */
  isTie: boolean;
  winnerOfferIds: number[];
  offers: {
    id: number;
    label: string | null;
    companyName: string | null;
    roleTitle: string | null;
    offerWorkArrangement: string | null;
    isWinner: boolean;
    score: OfferScore | null;
  }[];
};

export function getSessionComparison(sessionId: number) {
  return request<SessionComparison>(`/evaluation-sessions/${sessionId}/compare`);
}

/* ------------------------------------------------------------------- config */

export type GeographyCountry = { countryCode: string; countryName: string };
export type GeographyCity = { cityId: string; name: string };
export type ConsentToggle = {
  toggleId: string;
  label: string;
  helpText?: string;
  sourceScreen?: string;
  isMaster?: boolean;
};
export type FunctionalDomain = { domainId?: string; name: string };

export function getCountries() {
  return request<GeographyCountry[]>('/config/geography');
}

export function getCities(countryCode: string) {
  return request<GeographyCity[]>(
    `/config/geography?countryCode=${encodeURIComponent(countryCode)}`,
  );
}

export function getFunctionalDomains() {
  return request<FunctionalDomain[]>('/config/functional-domains');
}

export function getConsentToggles() {
  return request<ConsentToggle[]>('/config/consent-toggles');
}
