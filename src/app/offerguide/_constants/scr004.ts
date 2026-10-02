/**
 * SCR-004 Compensation — 20 fields, 3 required, 4 sections.
 *
 * Every allowed value, default and help string below is transcribed from the
 * OG_SCR004 Product Dictionary and cross-checked against the `OgQuestions` seed
 * where the field is scored, so a PATCH never 400s on a value this file sends.
 *
 * Three SCR-004 conditional groups are HIDDEN, not dimmed — resolved 2026-08-13
 * against the FRS's own internal conflict (§5 Key Product Decisions says hidden,
 * §8 Screen Layout says dimmed-with-pill; §5 is authoritative, confirmed by the
 * Product Owner):
 *   - offer_transport_allowance + offer_transport_frequency, when Remote
 *   - offer_review_cycle, when Contract or Temporary
 *   - offer_relocation_support + offer_relocation_amount, when offer country AND
 *     city both match SCR-001's (visible as soon as either differs; always
 *     visible if SCR-001 location was left blank)
 */

export const PAY_PERIODS = ['Monthly', 'Annually'] as const;

export const GROSS_NET = ['Gross pay', 'Net pay'] as const;

export const BONUS_COMMISSION_TYPES = ['% of base', 'Fixed value'] as const;

export const EQUITY_TYPES = [
  'Estimated value',
  '% of base',
  'Unknown value',
] as const;

export const ALLOWANCE_FREQUENCIES = ['Monthly', 'Quarterly', 'Annually'] as const;

export const RELOCATION_SUPPORT = [
  'None',
  'Offered',
  'Reimbursed',
  'Not clear',
] as const;

export const REVIEW_CYCLES = [
  '3 months',
  '6 months',
  'Annual',
  'Not clear',
  'Other',
] as const;

export const NEGOTIATION_ROOM = [
  'High',
  'Medium',
  'Low',
  'Not sure',
  'Not applicable',
] as const;

export const SCR004_DEFAULTS = {
  offerPayPeriod: 'Monthly',
  offerGrossNet: 'Gross pay',
  offerAnnualBonusType: '% of base',
  offerCommissionType: '% of base',
  offerEquityType: 'Estimated value',
  offerTransportFrequency: 'Monthly',
  offerOtherAllowanceFrequency: 'Monthly',
  offerReviewCycle: 'Not clear',
  offerNegotiationRoom: 'Not sure',
} as const;

export const SCR004_LIMITS = {
  reviewCycleOtherMax: 50,
  percentMin: 0,
  percentMax: 100,
} as const;

export const SCR004_COPY = {
  purpose: 'What is the full financial value of this offer?',
  requirementNote:
    'Base salary, currency, and pay period are required. All other fields are optional — the more you add, the more accurate your total compensation figure will be.',

  sections: {
    base: 'Base compensation',
    variable: 'Variable and one-time',
    allowances: 'Allowances',
    quality: 'Compensation quality',
  },

  labels: {
    baseSalary: 'Base salary',
    payPeriod: 'Pay period',
    currency: 'Currency',
    grossNet: 'Gross or net pay',
    takeHome: 'Expected take-home',
    signingBonus: 'Signing bonus',
    annualBonus: 'Annual bonus',
    annualBonusType: 'Annual bonus type',
    commission: 'Commission',
    commissionType: 'Commission type',
    equity: 'Equity / ESOPs',
    equityType: 'Equity type',
    transportAllowance: 'Transport allowance',
    transportFrequency: 'Transport allowance frequency',
    otherAllowance: 'Other allowance',
    otherAllowanceFrequency: 'Other allowance frequency',
    relocationSupport: 'Relocation support',
    relocationAmount: 'Relocation amount',
    reviewCycle: 'Salary review cycle',
    negotiationRoom: 'Salary negotiation room',
  },

  helpText: {
    baseSalary:
      'Enter the base salary as stated in your offer letter. Do not include bonuses, allowances, or other additional pay. Use the pay period field to tell us whether this is a monthly or annual figure.',
    payPeriod: 'Select whether the salary you entered is a monthly or annual figure.',
    currency: 'Select the currency in which your salary will be paid.',
    grossNet:
      'Select whether the salary you entered is your gross pay (before tax and deductions) or net pay (what you actually receive). Most offer letters state gross salary.',
    takeHome:
      'Optional. Enter the amount you expect to receive in your bank account each month after tax and deductions. Leave blank if you are unsure.',
    signingBonus:
      'Enter the total signing bonus amount if offered. This is a one-time payment typically made on joining.',
    annualBonus:
      'Enter the annual bonus as a percentage of your base salary or as a fixed amount.',
    commission:
      'Enter the commission or variable pay as a percentage of base salary or as a fixed amount. Leave blank if your role does not include commission.',
    equity:
      'Enter the estimated value of any equity, stock options, or ESOPs included in your offer. If you are unsure of the value, select Unknown value as the type.',
    transportAllowance:
      'Enter the transport or fuel allowance included in your offer. Select the frequency at which it is paid.',
    otherAllowance:
      'Enter the total of any other recurring allowances in your offer — such as mobile, internet, meal, or utility allowances.',
    relocationSupport:
      'Select whether the company is offering any relocation support. This is only relevant if the role requires you to move to a new city or country.',
    relocationAmount:
      'Enter the relocation amount if your offer includes a relocation allowance or reimbursement.',
    reviewCycle:
      'Select how often your salary will be reviewed. An earlier review cycle means faster opportunities for salary growth.',
    negotiationRoom:
      'Based on your conversations with the employer, how much room do you think exists to negotiate the salary? Select Not sure if you genuinely do not know, or Not applicable if you have already accepted.',
  },
} as const;
