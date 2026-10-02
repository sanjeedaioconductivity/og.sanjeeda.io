'use client';

import * as React from 'react';
import toast from 'react-hot-toast';

import WizardShell from '../../_components/WizardShell';
import Field, { FieldSection } from '../../_components/fields/Field';
import RadioCards from '../../_components/fields/RadioCards';
import { NotClearNumberInput, Select } from '../../_components/fields/Inputs';
import OtherTextInput from '../../_components/fields/OtherTextInput';

import { getScreen, type WizardScreen } from '../../_constants/screens';
import {
  DEVICE_SUPPORT,
  EDUCATION_REIMBURSEMENT,
  HEALTH_COVERAGE,
  JOB_SECURITY,
  JOB_SECURITY_WARNING_VALUES,
  LIFE_INSURANCE,
  MEAL_SUPPORT,
  PARENTAL_LEAVE,
  RESTRICTIVE_CLAUSE,
  RESTRICTIVE_CLAUSE_WARNING_VALUES,
  RETIREMENT_BENEFITS,
  SCR005_COPY,
  SCR005_DEFAULTS,
  SCR005_LIMITS,
  SICK_LEAVE,
  VISA_SUPPORT,
  WELLNESS_BENEFITS,
} from '../../_constants/scr005';
import * as api from '../../_state/api';
import { useWizardContext } from '../../_state/useWizardContext';
import { useDraftAutosave } from '../../_state/useDraftAutosave';

const SCREEN = getScreen('SCR-005');
const C = SCR005_COPY;

type BenefitsForm = {
  offerHealthCoverage: string;
  offerHealthCoverageOtherText: string;
  offerLifeInsurance: string;
  offerLifeInsuranceOtherText: string;
  offerRetirementBenefits: string;
  offerRetirementBenefitsOtherText: string;
  offerAnnualLeaveDays: number | null;
  annualLeaveNotClear: boolean;
  offerSickLeave: string;
  offerSickLeaveOtherText: string;
  offerParentalLeave: string;
  offerParentalLeaveOtherText: string;
  offerEducationReimbursement: string;
  offerDeviceSupport: string;
  offerDeviceSupportOtherText: string;
  offerMealSupport: string;
  offerMealSupportOtherText: string;
  offerWellnessBenefits: string;
  offerWellnessBenefitsOtherText: string;
  offerVisaSupport: string;
  offerVisaSupportOtherText: string;
  offerJobSecurity: string;
  offerRestrictiveClause: string;
};

const EMPTY_FORM: BenefitsForm = {
  offerHealthCoverage: SCR005_DEFAULTS.offerHealthCoverage,
  offerHealthCoverageOtherText: '',
  offerLifeInsurance: SCR005_DEFAULTS.offerLifeInsurance,
  offerLifeInsuranceOtherText: '',
  offerRetirementBenefits: SCR005_DEFAULTS.offerRetirementBenefits,
  offerRetirementBenefitsOtherText: '',
  offerAnnualLeaveDays: null,
  annualLeaveNotClear: false,
  offerSickLeave: SCR005_DEFAULTS.offerSickLeave,
  offerSickLeaveOtherText: '',
  offerParentalLeave: SCR005_DEFAULTS.offerParentalLeave,
  offerParentalLeaveOtherText: '',
  offerEducationReimbursement: SCR005_DEFAULTS.offerEducationReimbursement,
  offerDeviceSupport: SCR005_DEFAULTS.offerDeviceSupport,
  offerDeviceSupportOtherText: '',
  offerMealSupport: SCR005_DEFAULTS.offerMealSupport,
  offerMealSupportOtherText: '',
  offerWellnessBenefits: SCR005_DEFAULTS.offerWellnessBenefits,
  offerWellnessBenefitsOtherText: '',
  offerVisaSupport: SCR005_DEFAULTS.offerVisaSupport,
  offerVisaSupportOtherText: '',
  offerJobSecurity: SCR005_DEFAULTS.offerJobSecurity,
  offerRestrictiveClause: SCR005_DEFAULTS.offerRestrictiveClause,
};

/**
 * SCR-005 — Benefits & Security. 13 fields, all optional, two sections.
 *
 * `offer_visa_support` is the one conditional field, and it is DIMMED-with-pill
 * (never hidden) — that screen's own FRS card is explicit, and it differs from
 * SCR-004's relocation gate in two ways: visa compares COUNTRY ONLY (not city),
 * and it stays on screen rather than disappearing. Three states, all live:
 *   1. offer_country ≠ current_country → active
 *   2. offer_country = current_country → dimmed, default Not applicable,
 *      pill "if offer country ≠ current country"
 *   3. current_country left blank on SCR-001 → always visible and active —
 *      a live path, not an edge case, since current_country is optional
 *
 * offer_annual_leave_days is the one field where getting null vs 0 wrong would
 * silently corrupt scoring: the Sprint 5 engine reads a real 0 as "no leave"
 * and null as "unknown" via separate numericBands/nullScore paths.
 */
export default function BenefitsSecurityPage() {
  const { sessionId, offerId, resolving, navigateWithContext } = useWizardContext();
  const { scheduleSave, saveNow } = useDraftAutosave(SCREEN.id);

  const [form, setForm] = React.useState<BenefitsForm>(EMPTY_FORM);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  // Visa gating context: offer_country (SCR-003) vs current_country (SCR-001).
  const [offerCountry, setOfferCountry] = React.useState<string | null>(null);
  const [currentCountry, setCurrentCountry] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (resolving) return;
    let cancelled = false;

    async function load() {
      if (!sessionId || !offerId) {
        navigateWithContext(getScreen('SCR-003').href, { session: sessionId ?? undefined });
        return;
      }

      const [offer, profile] = await Promise.all([
        api.getOffer(offerId).catch(() => null),
        api.getCandidateProfile().catch(() => null),
      ]);
      if (cancelled) return;

      if (offer) {
        setOfferCountry(offer.offerCountry ?? null);
        setCurrentCountry(profile?.currentCountry ?? null);

        if (offer.benefitsSecurity) {
          const b = offer.benefitsSecurity;
          setForm({
            offerHealthCoverage: b.offerHealthCoverage || SCR005_DEFAULTS.offerHealthCoverage,
            offerHealthCoverageOtherText: b.offerHealthCoverageOtherText ?? '',
            offerLifeInsurance: b.offerLifeInsurance || SCR005_DEFAULTS.offerLifeInsurance,
            offerLifeInsuranceOtherText: b.offerLifeInsuranceOtherText ?? '',
            offerRetirementBenefits:
              b.offerRetirementBenefits || SCR005_DEFAULTS.offerRetirementBenefits,
            offerRetirementBenefitsOtherText: b.offerRetirementBenefitsOtherText ?? '',
            offerAnnualLeaveDays: b.offerAnnualLeaveDays ?? null,
            annualLeaveNotClear: b.offerAnnualLeaveDays == null,
            offerSickLeave: b.offerSickLeave || SCR005_DEFAULTS.offerSickLeave,
            offerSickLeaveOtherText: b.offerSickLeaveOtherText ?? '',
            offerParentalLeave: b.offerParentalLeave || SCR005_DEFAULTS.offerParentalLeave,
            offerParentalLeaveOtherText: b.offerParentalLeaveOtherText ?? '',
            offerEducationReimbursement:
              b.offerEducationReimbursement || SCR005_DEFAULTS.offerEducationReimbursement,
            offerDeviceSupport: b.offerDeviceSupport || SCR005_DEFAULTS.offerDeviceSupport,
            offerDeviceSupportOtherText: b.offerDeviceSupportOtherText ?? '',
            offerMealSupport: b.offerMealSupport || SCR005_DEFAULTS.offerMealSupport,
            offerMealSupportOtherText: b.offerMealSupportOtherText ?? '',
            offerWellnessBenefits:
              b.offerWellnessBenefits || SCR005_DEFAULTS.offerWellnessBenefits,
            offerWellnessBenefitsOtherText: b.offerWellnessBenefitsOtherText ?? '',
            offerVisaSupport: b.offerVisaSupport || SCR005_DEFAULTS.offerVisaSupport,
            offerVisaSupportOtherText: b.offerVisaSupportOtherText ?? '',
            offerJobSecurity: b.offerJobSecurity || SCR005_DEFAULTS.offerJobSecurity,
            offerRestrictiveClause:
              b.offerRestrictiveClause || SCR005_DEFAULTS.offerRestrictiveClause,
          });
        }
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolving, sessionId, offerId]);

  const set = React.useCallback(
    <K extends keyof BenefitsForm>(key: K, value: BenefitsForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const onBlur = React.useCallback(() => scheduleSave(form), [scheduleSave, form]);

  React.useEffect(() => {
    if (loading) return;
    scheduleSave(form);
  }, [form, loading, scheduleSave]);

  // Visa state 3 ("current_country left blank") reads as active, same as state 1 —
  // only an explicit, matching country pair dims the field.
  const visaActive = !currentCountry || !offerCountry || offerCountry !== currentCountry;

// `target` is set when the candidate clicked a later step on the module
// stepper; the Next button leaves it undefined and goes to SCR-006.
async function handleNext(target?: WizardScreen) {
  if (!offerId) return;

  setSubmitting(true);

  try {
    const normalizedForm: BenefitsForm = {
      ...form,

      offerVisaSupport: visaActive
        ? form.offerVisaSupport
        : SCR005_DEFAULTS.offerVisaSupport,

      offerVisaSupportOtherText: visaActive
        ? form.offerVisaSupportOtherText
        : '',
    };

    const payload: Record<string, unknown> = {
      offerHealthCoverage: normalizedForm.offerHealthCoverage,

      offerHealthCoverageOtherText:
        normalizedForm.offerHealthCoverage === 'Other'
          ? normalizedForm.offerHealthCoverageOtherText
          : null,

      offerLifeInsurance: normalizedForm.offerLifeInsurance,

      offerLifeInsuranceOtherText:
        normalizedForm.offerLifeInsurance === 'Other'
          ? normalizedForm.offerLifeInsuranceOtherText
          : null,

      offerRetirementBenefits:
        normalizedForm.offerRetirementBenefits,

      offerRetirementBenefitsOtherText:
        normalizedForm.offerRetirementBenefits === 'Other'
          ? normalizedForm.offerRetirementBenefitsOtherText
          : null,

      offerAnnualLeaveDays:
        normalizedForm.annualLeaveNotClear
          ? null
          : normalizedForm.offerAnnualLeaveDays,

      offerSickLeave: normalizedForm.offerSickLeave,

      offerSickLeaveOtherText:
        normalizedForm.offerSickLeave === 'Other'
          ? normalizedForm.offerSickLeaveOtherText
          : null,

      offerParentalLeave:
        normalizedForm.offerParentalLeave,

      offerParentalLeaveOtherText:
        normalizedForm.offerParentalLeave === 'Other'
          ? normalizedForm.offerParentalLeaveOtherText
          : null,

      offerEducationReimbursement:
        normalizedForm.offerEducationReimbursement,

      offerDeviceSupport:
        normalizedForm.offerDeviceSupport,

      offerDeviceSupportOtherText:
        normalizedForm.offerDeviceSupport === 'Other'
          ? normalizedForm.offerDeviceSupportOtherText
          : null,

      offerMealSupport:
        normalizedForm.offerMealSupport,

      offerMealSupportOtherText:
        normalizedForm.offerMealSupport === 'Other'
          ? normalizedForm.offerMealSupportOtherText
          : null,

      offerWellnessBenefits:
        normalizedForm.offerWellnessBenefits,

      offerWellnessBenefitsOtherText:
        normalizedForm.offerWellnessBenefits === 'Other'
          ? normalizedForm.offerWellnessBenefitsOtherText
          : null,

      offerVisaSupport:
        normalizedForm.offerVisaSupport,

      offerVisaSupportOtherText:
        visaActive &&
        normalizedForm.offerVisaSupport === 'Other'
          ? normalizedForm.offerVisaSupportOtherText
          : null,

      offerJobSecurity:
        normalizedForm.offerJobSecurity,

      offerRestrictiveClause:
        normalizedForm.offerRestrictiveClause,
    };

    await api.updateOfferBenefitsSecurity(offerId, payload);

    void saveNow(normalizedForm);

    navigateWithContext((target ?? getScreen('SCR-006')).href, {
      session: sessionId ?? undefined,
      offer: offerId,
    });
  } catch (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : 'Could not save.',
    );
  } finally {
    setSubmitting(false);
  }
}

  if (resolving || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
<WizardShell
  screen={SCREEN}
  introPurpose={C.purpose}
  introRequirementNote={C.requirementNote}
  onBack={() =>
    navigateWithContext(getScreen("SCR-004").href, {
      session: sessionId ?? undefined,
      offer: offerId ?? undefined,
    })
  }
  onNext={handleNext}
  isSubmitting={submitting}
>
      <FieldSection index={1} title={C.sections.benefits} meta="11 fields">
        <Field label={C.labels.healthCoverage} helpText={C.helpText.healthCoverage}>
          <RadioCards
            name={C.labels.healthCoverage}
            options={HEALTH_COVERAGE}
            value={form.offerHealthCoverage}
            onChange={(v) => set('offerHealthCoverage', v)}
            otherText={form.offerHealthCoverageOtherText}
            onOtherTextChange={(t) => set('offerHealthCoverageOtherText', t)}
            otherMaxLength={SCR005_LIMITS.otherTextMax}
          />
        </Field>

        <Field label={C.labels.lifeInsurance} helpText={C.helpText.lifeInsurance}>
          <RadioCards
            name={C.labels.lifeInsurance}
            options={LIFE_INSURANCE}
            value={form.offerLifeInsurance}
            onChange={(v) => set('offerLifeInsurance', v)}
            otherText={form.offerLifeInsuranceOtherText}
            onOtherTextChange={(t) => set('offerLifeInsuranceOtherText', t)}
            otherMaxLength={SCR005_LIMITS.otherTextMax}
          />
        </Field>

        <Field
          label={C.labels.retirementBenefits}
          helpText={C.helpText.retirementBenefits}
        >
          <RadioCards
            name={C.labels.retirementBenefits}
            options={RETIREMENT_BENEFITS}
            value={form.offerRetirementBenefits}
            onChange={(v) => set('offerRetirementBenefits', v)}
            otherText={form.offerRetirementBenefitsOtherText}
            onOtherTextChange={(t) => set('offerRetirementBenefitsOtherText', t)}
            otherMaxLength={SCR005_LIMITS.otherTextMax}
          />
        </Field>

        <Field label={C.labels.annualLeaveDays} helpText={C.helpText.annualLeaveDays}>
          <NotClearNumberInput
            value={form.offerAnnualLeaveDays}
            onChange={(v) => set('offerAnnualLeaveDays', v)}
            onBlur={onBlur}
            notClear={form.annualLeaveNotClear}
            onNotClearChange={(v) => set('annualLeaveNotClear', v)}
            unit="days"
            min={SCR005_LIMITS.annualLeaveDaysMin}
            max={SCR005_LIMITS.annualLeaveDaysMax}
          />
        </Field>

        <Field label={C.labels.sickLeave} helpText={C.helpText.sickLeave}>
          <Select
            options={SICK_LEAVE}
            value={form.offerSickLeave}
            onChange={(v) => set('offerSickLeave', v)}
            onBlur={onBlur}
          />
          {form.offerSickLeave === 'Other' && (
            <OtherTextInput
              value={form.offerSickLeaveOtherText}
              onChange={(v) => set('offerSickLeaveOtherText', v)}
              maxLength={SCR005_LIMITS.otherTextMax}
            />
          )}
        </Field>

        <Field label={C.labels.parentalLeave} helpText={C.helpText.parentalLeave}>
          <Select
            options={PARENTAL_LEAVE}
            value={form.offerParentalLeave}
            onChange={(v) => set('offerParentalLeave', v)}
            onBlur={onBlur}
          />
          {form.offerParentalLeave === 'Other' && (
            <OtherTextInput
              value={form.offerParentalLeaveOtherText}
              onChange={(v) => set('offerParentalLeaveOtherText', v)}
              maxLength={SCR005_LIMITS.otherTextMax}
            />
          )}
        </Field>

        <Field
          label={C.labels.educationReimbursement}
          helpText={C.helpText.educationReimbursement}
        >
          <RadioCards
            name={C.labels.educationReimbursement}
            options={EDUCATION_REIMBURSEMENT}
            value={form.offerEducationReimbursement}
            onChange={(v) => set('offerEducationReimbursement', v)}
          />
        </Field>

        <Field label={C.labels.deviceSupport} helpText={C.helpText.deviceSupport}>
          <RadioCards
            name={C.labels.deviceSupport}
            options={DEVICE_SUPPORT}
            value={form.offerDeviceSupport}
            onChange={(v) => set('offerDeviceSupport', v)}
            otherText={form.offerDeviceSupportOtherText}
            onOtherTextChange={(t) => set('offerDeviceSupportOtherText', t)}
            otherMaxLength={SCR005_LIMITS.otherTextMax}
          />
        </Field>

        <Field label={C.labels.mealSupport} helpText={C.helpText.mealSupport}>
          <RadioCards
            name={C.labels.mealSupport}
            options={MEAL_SUPPORT}
            value={form.offerMealSupport}
            onChange={(v) => set('offerMealSupport', v)}
            otherText={form.offerMealSupportOtherText}
            onOtherTextChange={(t) => set('offerMealSupportOtherText', t)}
            otherMaxLength={SCR005_LIMITS.otherTextMax}
          />
        </Field>

        <Field label={C.labels.wellnessBenefits} helpText={C.helpText.wellnessBenefits}>
          <RadioCards
            name={C.labels.wellnessBenefits}
            options={WELLNESS_BENEFITS}
            value={form.offerWellnessBenefits}
            onChange={(v) => set('offerWellnessBenefits', v)}
            otherText={form.offerWellnessBenefitsOtherText}
            onOtherTextChange={(t) => set('offerWellnessBenefitsOtherText', t)}
            otherMaxLength={SCR005_LIMITS.otherTextMax}
          />
        </Field>

        <Field
          label={C.labels.visaSupport}
          helpText={C.helpText.visaSupport}
          conditional={{
            pill: 'if offer country ≠ current country',
            active: visaActive,
          }}
        >
          {/* Full labels — desktop. Abbreviated — mobile. Same state, two
              renderings, only one ever in the tab order via CSS display. */}
          <div className="hidden sm:block">
            <RadioCards
              name={C.labels.visaSupport}
              options={VISA_SUPPORT}
              value={form.offerVisaSupport}
              onChange={(v) => set('offerVisaSupport', v)}
              disabled={!visaActive}
              otherText={form.offerVisaSupportOtherText}
              onOtherTextChange={(t) => set('offerVisaSupportOtherText', t)}
              otherMaxLength={SCR005_LIMITS.otherTextMax}
            />
          </div>
          <div className="sm:hidden">
            <RadioCards
              name={`${C.labels.visaSupport} (mobile)`}
              options={VISA_SUPPORT.map((v) => C.visaSupportShort[v] ?? v)}
              value={C.visaSupportShort[form.offerVisaSupport] ?? form.offerVisaSupport}
              onChange={(short) => {
                const full = VISA_SUPPORT.find(
                  (v) => (C.visaSupportShort[v] ?? v) === short,
                );
                if (full) set('offerVisaSupport', full);
              }}
              disabled={!visaActive}
              otherText={form.offerVisaSupportOtherText}
              onOtherTextChange={(t) => set('offerVisaSupportOtherText', t)}
              otherMaxLength={SCR005_LIMITS.otherTextMax}
            />
          </div>
        </Field>
      </FieldSection>

      <FieldSection index={2} title={C.sections.security} meta="2 fields">
        <Field label={C.labels.jobSecurity} helpText={C.helpText.jobSecurity}>
          <RadioCards
            name={C.labels.jobSecurity}
            options={JOB_SECURITY}
            value={form.offerJobSecurity}
            onChange={(v) => set('offerJobSecurity', v)}
            warningValues={JOB_SECURITY_WARNING_VALUES}
          />
        </Field>

        <Field label={C.labels.restrictiveClause} helpText={C.helpText.restrictiveClause}>
          <RadioCards
            name={C.labels.restrictiveClause}
            options={RESTRICTIVE_CLAUSE}
            value={form.offerRestrictiveClause}
            onChange={(v) => set('offerRestrictiveClause', v)}
            warningValues={RESTRICTIVE_CLAUSE_WARNING_VALUES}
          />
        </Field>
      </FieldSection>
    </WizardShell>
  );
}
