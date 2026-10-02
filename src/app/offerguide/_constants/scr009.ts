/**
 * SCR-009 Compare & Market Intelligence — 0 data-entry fields.
 *
 * TWO CONFLICTS between this screen's FRS and the Sprint 7 handoff. The handoff
 * wins in both cases — it is the newer document and both rulings are explicit.
 *
 * 1. CONSENT — editable or read-only?
 *    SCR-009 FRS §2 calls the consent toggles "interactive" and §7 defines all
 *    six as new fields on this screen. But Sprint 6 already MOVED consent
 *    capture to SCR-001 (that handoff said so, and pointed at this FRS §7 purely
 *    as the field-definition source). Sprint 7 handoff Story 7.2.4 then states:
 *    "SCR-009 shows it back to the candidate and nothing more... read-only...
 *    with no interactive control... No second editable copy of consent anywhere
 *    in the product."
 *    → Built READ-ONLY, with a link back to SCR-001.
 *
 * 2. MARKET INTELLIGENCE — placeholder numbers or empty states?
 *    SCR-009 FRS §6.3 marks every metric "Placeholder" and §5 says "Placeholder
 *    data shown in MVP". Sprint 7 handoff Story 7.2.3 overrides that outright:
 *    "There is no benchmark data at launch. Every card ships in an empty
 *    state... No placeholder numbers, no sample ranges, no invented
 *    percentages. A candidate evaluating a real offer must not see a figure
 *    that looks like market data but isn't."
 *    → Built as honest EMPTY STATES. The approved mockup shows populated
 *      figures, but that illustrates the future data-present state; shipping
 *      those numbers would put invented market data in front of someone making
 *      a real salary decision.
 *    Each card is a data-absent BRANCH of the same component, so real community
 *    data later populates it with no structural rewrite.
 */

/** The 7 scoring categories, in fixed comparison-table order. */
export const SCORE_CATEGORIES = [
  'Salary',
  'Benefits',
  'Stability',
  'Work-Life',
  'Growth',
  'Culture',
  'Purpose',
] as const;

export type ScoreCategory = (typeof SCORE_CATEGORIES)[number];

/** Maps a category label to its key on the score payload. */
export const CATEGORY_SCORE_KEYS: Record<ScoreCategory, string> = {
  Salary: 'salaryScore',
  Benefits: 'benefitsScore',
  Stability: 'stabilityScore',
  'Work-Life': 'worklifeScore',
  Growth: 'growthScore',
  Culture: 'cultureScore',
  Purpose: 'purposeScore',
};

/**
 * Market intelligence data shape.
 *
 * Every field is nullable so each card renders its own data-absent branch
 * independently — that is what lets real community data drop in later without a
 * structural rewrite, and it means a partially-populated payload (say, salary
 * but no red flags) degrades per-card rather than blanking the panel.
 */
export type MarketIntelligence = {
  /**
   * True when the figures below are illustrative rather than real community
   * data. Drives the visible "Sample data" badge — see the note on
   * SAMPLE_MARKET_INTELLIGENCE.
   */
  isSampleData: boolean;
  salaryRange: {
    p25: number;
    median: number;
    p75: number;
    currency: string;
    period: string;
  } | null;
  bonusPrevalencePct: number | null;
  flexibilityPct: number | null;
  commonBenefits: string[];
  commonRedFlags: { label: string; count: number }[];
  competitiveness: {
    /** 0-100 position along the Below → Near → Strong track. */
    position: number;
    note: string;
  } | null;
};

/**
 * Illustrative values matching the approved SCR-009 mockup and the FRS's
 * "Placeholder data shown in MVP" instruction (§5, §6.3, §9).
 *
 * NOTE ON THE CONFLICT: Sprint 7 handoff Story 7.2.3 says the opposite — empty
 * states only, "no placeholder numbers, no sample ranges, no invented
 * percentages", on the grounds that a candidate evaluating a real offer must
 * not see a figure that looks like market data but isn't. The Product Owner
 * chose the FRS/mockup behaviour, so these ship — but carrying
 * `isSampleData: true`, which renders a visible "Sample data" badge on the
 * panel. That keeps the screen looking complete (the FRS's intent) without any
 * chance of the numbers being mistaken for real benchmarks (the handoff's
 * concern). Removing the badge is a one-line change if the PO prefers.
 *
 * There is no benchmark data at launch, so nothing real can populate this yet;
 * swap this constant for the API payload when the community pool exists.
 */
export const SAMPLE_MARKET_INTELLIGENCE: MarketIntelligence = {
  isSampleData: true,
  salaryRange: {
    p25: 280000,
    median: 360000,
    p75: 450000,
    currency: 'PKR',
    period: 'month',
  },
  bonusPrevalencePct: 78,
  flexibilityPct: 64,
  commonBenefits: ['Health insurance', 'Provident fund', 'Learning budget'],
  commonRedFlags: [
    { label: 'Unclear role', count: 3 },
    { label: 'Long hours', count: 2 },
  ],
  competitiveness: { position: 72, note: 'above median' },
};

/** Card titles, in the FRS's display order. */
export const MARKET_CARD_TITLES = {
  salaryRange: 'Salary range',
  bonusPrevalence: 'Bonus prevalence',
  flexibility: 'Typical flexibility',
  commonBenefits: 'Common benefits',
  commonRedFlags: 'Common red flags',
  competitiveness: 'Competitiveness',
} as const;

/** Per-card help text for the ⓘ icons the FRS requires on every card header. */
export const MARKET_CARD_HELP = {
  salaryRange:
    'The 25th to 75th percentile salary range reported for similar roles and locations, with the median in the middle.',
  bonusPrevalence:
    'The share of similar offers in the community that include any kind of bonus.',
  flexibility:
    'The share of similar offers that are hybrid or fully remote.',
  commonBenefits:
    'The benefits most frequently reported in similar offers.',
  commonRedFlags:
    'The interview red flags most frequently reported for similar roles.',
  competitiveness:
    'Where your offer sits against the community range for similar roles.',
} as const;

export const MARKET_EMPTY_BODY = 'Not enough community data yet.';
export const MARKET_SAMPLE_BADGE = 'Sample data';

export const SCR009_COPY = {
  purpose: 'How do your offers stack up?',
  requirementNoteSingle:
    'Review your offer and see how it compares against anonymised market data from similar roles and locations.',
  requirementNoteMultiple:
    'Review your offers side by side and see how they compare against anonymised market data from similar roles and locations.',

  sections: {
    offers: 'Your offers',
    market: 'Market intelligence',
  },

  sectionHelp: {
    offers:
      'Each offer you have entered, with its overall fit score and strongest categories. Scores come from your answers and your selected priorities.',
    market:
      'Anonymised patterns contributed by the OfferGuide community. This is not external salary-survey data.',
    consent:
      'What you have chosen to contribute to the community data pool. Set on the profile screen — this is a read-only summary.',
  },

  addAnotherOffer: '+ Add another offer',
  /** Multi-offer view only — the card's confirm before DELETE /offers/{id}. */
  removeOffer: 'Remove',
  removeOfferConfirm:
    'Remove {offer} from this evaluation? Its answers and score will be deleted.',
  /**
   * Multi-offer view only. The market cards compare ONE offer against the
   * community figures, and with three offers on screen nothing said which
   * (QA report B5). Names the offer and why it was chosen.
   */
  marketScopeNote:
    'Showing the market comparison for {offer}, your top-scoring offer.',
  winnerBadge: 'Top match',
  tieBadge: 'Tie',
  winnerColumn: 'Winner',
  categoryColumn: 'Category',

  /**
   * CR-01 — the current-job baseline table. Shown from one offer upward, unlike
   * the score table above it, and hidden entirely for a candidate with no
   * current job (a student, or anyone who left the SCR-001 pay fields blank).
   */
  currentJob: {
    heading: 'Against your current job',
    baselineColumn: 'Current job',
    rows: {
      baseSalary: 'Base salary (annual)',
      totalPackage: 'Total package (annual)',
      workArrangement: 'Work arrangement',
      workingHours: 'Working hours',
      commute: 'Daily commute',
    },
    help: {
      baseSalary:
        'Your current base salary and each offer’s, both annualised, so a monthly figure and an annual one can be compared directly.',
      totalPackage:
        'Each offer’s full annual value including bonus, commission, equity and allowances. Your current job is shown at its base salary, which is the only figure OfferGuide asks you for.',
    },
    /** Shown only when an offer is priced in a different currency. */
    currencyNote:
      'One or more offers are in a different currency from your current salary, so no percentage change is shown for those — OfferGuide does not convert currencies. Compare those figures yourself using a rate you trust.',
  },

  /**
   * Shown under the market grid. Matches the FRS's own community-note tone:
   * honest about data maturity, framed as community patterns rather than an
   * external data source.
   */
  communityNote:
    'Market data is built from anonymised offer patterns contributed by the OfferGuide community. There is not enough data yet to show reliable figures — insights appear here and become more accurate as more candidates contribute.',

  privacyNote:
    'Your data is anonymised before contributing. No personal information is ever shared, and your private notes are never included.',

  consentSectionLabel: 'What you are contributing',
  consentReadOnlyNote: 'Set on your profile — this is a summary.',
  consentEditLink: 'Change on your profile',
  consentOn: 'On',
  consentOff: 'Off',
  consentMasterOffNote:
    'Sharing is off, so nothing is contributed to the community.',
} as const;
