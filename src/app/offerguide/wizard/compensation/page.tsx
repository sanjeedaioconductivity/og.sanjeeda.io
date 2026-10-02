'use client';

import * as React from 'react';
import toast from 'react-hot-toast';

import WizardShell from '../../_components/WizardShell';
import Field, { FieldSection } from '../../_components/fields/Field';
import RadioCards, { BinaryRadioCards } from '../../_components/fields/RadioCards';
import Combobox from '../../_components/fields/Combobox';
import { NumericInput, PairedRow, Select } from '../../_components/fields/Inputs';
import OtherTextInput from '../../_components/fields/OtherTextInput';
import CompensationBar from '@/components/shared/CompensationBar';

import { getScreen, type WizardScreen } from '../../_constants/screens';
import { CURRENCY_OPTIONS } from '../../_constants/currencies';
import {
  ALLOWANCE_FREQUENCIES,
  BONUS_COMMISSION_TYPES,
  EQUITY_TYPES,
  GROSS_NET,
  NEGOTIATION_ROOM,
  PAY_PERIODS,
  RELOCATION_SUPPORT,
  REVIEW_CYCLES,
  SCR004_COPY,
  SCR004_DEFAULTS,
  SCR004_LIMITS,
} from '../../_constants/scr004';
import * as api from '../../_state/api';
import { useWizardContext } from '../../_state/useWizardContext';
import { useDraftAutosave } from '../../_state/useDraftAutosave';

const SCREEN = getScreen('SCR-004');
const C = SCR004_COPY;

type CompForm = {
  offerBaseSalary: number | null;
  offerPayPeriod: string;
  offerCurrency: string | null;
  offerGrossNet: string;
  offerTakeHome: number | null;
  offerSigningBonus: number | null;
  offerAnnualBonus: number | null;
  offerAnnualBonusType: string;
  offerCommission: number | null;
  offerCommissionType: string;
  offerEquity: number | null;
  offerEquityType: string;
  offerTransportAllowance: number | null;
  offerTransportFrequency: string;
  offerOtherAllowance: number | null;
  offerOtherAllowanceFrequency: string;
  offerRelocationSupport: string | null;
  offerRelocationAmount: number | null;
  offerReviewCycle: string;
  offerReviewCycleOtherText: string;
  offerNegotiationRoom: string;
};

const EMPTY_FORM: CompForm = {
  offerBaseSalary: null,
  offerPayPeriod: SCR004_DEFAULTS.offerPayPeriod,
  offerCurrency: null,
  offerGrossNet: SCR004_DEFAULTS.offerGrossNet,
  offerTakeHome: null,
  offerSigningBonus: null,
  offerAnnualBonus: null,
  offerAnnualBonusType: SCR004_DEFAULTS.offerAnnualBonusType,
  offerCommission: null,
  offerCommissionType: SCR004_DEFAULTS.offerCommissionType,
  offerEquity: null,
  offerEquityType: SCR004_DEFAULTS.offerEquityType,
  offerTransportAllowance: null,
  offerTransportFrequency: SCR004_DEFAULTS.offerTransportFrequency,
  offerOtherAllowance: null,
  offerOtherAllowanceFrequency: SCR004_DEFAULTS.offerOtherAllowanceFrequency,
  offerRelocationSupport: null,
  offerRelocationAmount: null,
  offerReviewCycle: SCR004_DEFAULTS.offerReviewCycle,
  offerReviewCycleOtherText: '',
  offerNegotiationRoom: SCR004_DEFAULTS.offerNegotiationRoom,
};

/**
 * SCR-004 — Compensation. 20 fields, 3 required, four sections with mini-stepper,
 * plus the fixed CompensationBar.
 *
 * Three conditional groups are HIDDEN outright (not dimmed) per the resolved
 * SCR-004 §5 vs §8 conflict — see scr004.ts's file header:
 *   - transport allowance + frequency, when offer_work_arrangement = Remote
 *   - review cycle, when offer_employment_type ∈ {Contract, Temporary}
 *   - relocation support + amount, when offer country AND city both match
 *     SCR-001's current country/city (visible the instant either differs;
 *     always visible if SCR-001 location was left blank)
 *
 * The work arrangement / employment type / offer location needed for those
 * gates live on the Offer row (set on SCR-003), and current country/city live
 * on the candidate profile (SCR-001) — this screen reads both once on load.
 */
export default function CompensationPage() {
  const { sessionId, offerId, resolving, navigateWithContext } = useWizardContext();
  const { scheduleSave, saveNow } = useDraftAutosave(SCREEN.id);

  const [form, setForm] = React.useState<CompForm>(EMPTY_FORM);
  const [loading, setLoading] = React.useState(true);
  const [showErrors, setShowErrors] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Gating context — not this screen's own fields, just read to drive visibility.
  const [offerWorkArrangement, setOfferWorkArrangement] = React.useState<string | null>(null);
  const [offerEmploymentType, setOfferEmploymentType] = React.useState<string | null>(null);
  const [locationDiffers, setLocationDiffers] = React.useState(true);

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
        setOfferWorkArrangement(offer.offerWorkArrangement);
        setOfferEmploymentType(offer.offerEmploymentType);

        // Relocation visibility: hidden only when BOTH country and city match —
        // visible as soon as either differs, and always visible when SCR-001's
        // location was left blank (SCR-004 FRS §5).
        const profileHadLocation = !!(profile?.currentCountry || profile?.currentCity);
        const countryMatches =
          !offer.offerCountry ||
          !profile?.currentCountry ||
          offer.offerCountry === profile.currentCountry;
        const cityMatches =
          !offer.offerCity || !profile?.currentCity || offer.offerCity === profile.currentCity;
        setLocationDiffers(!profileHadLocation || !(countryMatches && cityMatches));

        if (offer.compensation) {
          const comp = offer.compensation;
          setForm({
            offerBaseSalary: comp.offerBaseSalary ? Number(comp.offerBaseSalary) : null,
            offerPayPeriod: comp.offerPayPeriod || SCR004_DEFAULTS.offerPayPeriod,
            offerCurrency: comp.offerCurrency,
            offerGrossNet: comp.offerGrossNet || SCR004_DEFAULTS.offerGrossNet,
            offerTakeHome: comp.offerTakeHome ? Number(comp.offerTakeHome) : null,
            offerSigningBonus: comp.offerSigningBonus ? Number(comp.offerSigningBonus) : null,
            offerAnnualBonus: comp.offerAnnualBonus ? Number(comp.offerAnnualBonus) : null,
            offerAnnualBonusType:
              comp.offerAnnualBonusType || SCR004_DEFAULTS.offerAnnualBonusType,
            offerCommission: comp.offerCommission ? Number(comp.offerCommission) : null,
            offerCommissionType:
              comp.offerCommissionType || SCR004_DEFAULTS.offerCommissionType,
            offerEquity: comp.offerEquity ? Number(comp.offerEquity) : null,
            offerEquityType: comp.offerEquityType || SCR004_DEFAULTS.offerEquityType,
            offerTransportAllowance: comp.offerTransportAllowance
              ? Number(comp.offerTransportAllowance)
              : null,
            offerTransportFrequency:
              comp.offerTransportFrequency || SCR004_DEFAULTS.offerTransportFrequency,
            offerOtherAllowance: comp.offerOtherAllowance
              ? Number(comp.offerOtherAllowance)
              : null,
            offerOtherAllowanceFrequency:
              comp.offerOtherAllowanceFrequency ||
              SCR004_DEFAULTS.offerOtherAllowanceFrequency,
            offerRelocationSupport: comp.offerRelocationSupport,
            offerRelocationAmount: comp.offerRelocationAmount
              ? Number(comp.offerRelocationAmount)
              : null,
            offerReviewCycle: comp.offerReviewCycle || SCR004_DEFAULTS.offerReviewCycle,
            offerReviewCycleOtherText: comp.offerReviewCycleOtherText ?? '',
            offerNegotiationRoom:
              comp.offerNegotiationRoom || SCR004_DEFAULTS.offerNegotiationRoom,
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
    <K extends keyof CompForm>(key: K, value: CompForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const onBlur = React.useCallback(() => scheduleSave(form), [scheduleSave, form]);

  React.useEffect(() => {
    if (loading) return;
    scheduleSave(form);
  }, [form, loading, scheduleSave]);

  const showTransport = offerWorkArrangement !== 'Remote';
  const showReviewCycle =
    offerEmploymentType !== 'Contract' && offerEmploymentType !== 'Temporary';
  const showRelocation = locationDiffers;

  const missingBaseSalary = !form.offerBaseSalary || form.offerBaseSalary <= 0;
  const missingCurrency = !form.offerCurrency;
  // FRS validation rule on offer_take_home: "must be less than or equal to
  // offer_base_salary" — a monthly take-home figure bigger than the stated base
  // salary is never legitimate, so this blocks Next the same as the required
  // fields rather than silently accepting a contradictory pair of numbers.
  const takeHomeExceedsBase =
    !!form.offerTakeHome &&
    !!form.offerBaseSalary &&
    form.offerTakeHome > form.offerBaseSalary;
  const canProceed =
    !missingBaseSalary &&
    !missingCurrency &&
    !!form.offerPayPeriod &&
    !takeHomeExceedsBase;

  // `target` is set when the candidate clicked a later step on the module
  // stepper; the Next button leaves it undefined and goes to SCR-005.
  async function handleNext(target?: WizardScreen) {
    setShowErrors(true);
    if (!canProceed) {
      toast.error(
        takeHomeExceedsBase
          ? 'Expected take-home cannot be more than the base salary.'
          : 'Base salary, currency, and pay period are required.',
      );
      return;
    }
    if (!offerId) return;

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        offerBaseSalary: form.offerBaseSalary,
        offerPayPeriod: form.offerPayPeriod,
        offerCurrency: form.offerCurrency,
        offerGrossNet: form.offerGrossNet,
        offerTakeHome: form.offerTakeHome,
        offerSigningBonus: form.offerSigningBonus,
        offerAnnualBonus: form.offerAnnualBonus,
        offerAnnualBonusType: form.offerAnnualBonusType,
        offerCommission: form.offerCommission,
        offerCommissionType: form.offerCommissionType,
        offerEquity: form.offerEquity,
        offerEquityType: form.offerEquityType,
        offerOtherAllowance: form.offerOtherAllowance,
        offerOtherAllowanceFrequency: form.offerOtherAllowanceFrequency,
        offerNegotiationRoom: form.offerNegotiationRoom,
        // Hidden fields are never submitted with a stale value from before the
        // gating condition changed — send null/default rather than whatever was
        // last typed behind a since-flipped work arrangement or employment type.
        offerTransportAllowance: showTransport ? form.offerTransportAllowance : null,
        offerTransportFrequency: showTransport
          ? form.offerTransportFrequency
          : SCR004_DEFAULTS.offerTransportFrequency,
        offerReviewCycle: showReviewCycle
          ? form.offerReviewCycle
          : SCR004_DEFAULTS.offerReviewCycle,
        offerReviewCycleOtherText:
          showReviewCycle && form.offerReviewCycle === 'Other'
            ? form.offerReviewCycleOtherText
            : null,
        offerRelocationSupport: showRelocation ? form.offerRelocationSupport : null,
        offerRelocationAmount: showRelocation ? form.offerRelocationAmount : null,
      };

      await api.updateOfferCompensation(offerId, payload);
      void saveNow(form);
      navigateWithContext((target ?? getScreen('SCR-005')).href, {
        session: sessionId ?? undefined,
        offer: offerId,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save compensation.',
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
  stickySlot={
        <CompensationBar
          inputs={{
            baseSalary: form.offerBaseSalary,
            payPeriod: form.offerPayPeriod,
            currency: form.offerCurrency,
            signingBonus: form.offerSigningBonus,
            annualBonus: form.offerAnnualBonus,
            annualBonusType: form.offerAnnualBonusType,
            commission: form.offerCommission,
            commissionType: form.offerCommissionType,
            equity: form.offerEquity,
            equityType: form.offerEquityType,
            transportAllowance: showTransport ? form.offerTransportAllowance : null,
            transportFrequency: form.offerTransportFrequency,
            otherAllowance: form.offerOtherAllowance,
            otherAllowanceFrequency: form.offerOtherAllowanceFrequency,
            relocationAmount: showRelocation ? form.offerRelocationAmount : null,
          }}
        />
      }
      onBack={() => navigateWithContext(getScreen('SCR-003').href, { session: sessionId ?? undefined, offer: offerId ?? undefined })}
      onNext={handleNext}
      nextDisabled={showErrors && !canProceed}
      isSubmitting={submitting}
    >
      <FieldSection index={1} title={C.sections.base} meta="5 fields">
        {/*
          Base salary (+ paired pay period) and Currency are ordinary grid
          Fields, same as every other pair on this screen — that's what gives
          them the identical gap and the identical 50/50 row-filling rhythm as
          Gross/net + Take-home just below, rather than a bespoke layout that
          only coincidentally shared the same gap value.
        */}
        <Field
          label={C.labels.baseSalary}
          required
          helpText={C.helpText.baseSalary}
        >
          <PairedRow
            primary={
              <NumericInput
                value={form.offerBaseSalary}
                onChange={(v) => set('offerBaseSalary', v)}
                onBlur={onBlur}
                min={1}
                allowDecimal
                // 'e.g.' prefix, like every other example placeholder in the wizard: a bare
                // "150,000" reads as an already-entered value (QA report A2), and
                // the candidate then hits the required-field error on Next.
                placeholder="e.g. 150,000"
              />
            }
            secondary={
              <BinaryRadioCards
                name={C.labels.payPeriod}
                options={PAY_PERIODS}
                value={form.offerPayPeriod}
                onChange={(v) => set('offerPayPeriod', v)}
              />
            }
            secondaryWidth="w-32"
          />
          {showErrors && missingBaseSalary && (
            <p className="mt-1 text-xs text-destructive">
              Enter a base salary greater than zero.
            </p>
          )}
        </Field>

        <Field label={C.labels.currency} required helpText={C.helpText.currency}>
          <Combobox
            options={CURRENCY_OPTIONS}
            value={form.offerCurrency}
            onChange={(v) => set('offerCurrency', v)}
            onBlur={onBlur}
            placeholder="Currency"
          />
          {showErrors && missingCurrency && (
            <p className="mt-1 text-xs text-destructive">
              Select the offer currency.
            </p>
          )}
        </Field>
        <Field label={C.labels.grossNet} helpText={C.helpText.grossNet}>
          <BinaryRadioCards
            name={C.labels.grossNet}
            options={GROSS_NET}
            value={form.offerGrossNet}
            onChange={(v) => set('offerGrossNet', v)}
          />
        </Field>

        <Field label={C.labels.takeHome} helpText={C.helpText.takeHome}>
          <NumericInput
            value={form.offerTakeHome}
            onChange={(v) => set('offerTakeHome', v)}
            onBlur={onBlur}
            min={1}
            allowDecimal
            placeholder="Take-home amount"
          />
          {showErrors && takeHomeExceedsBase && (
            <p className="mt-1 text-xs text-destructive">
              Cannot exceed the base salary.
            </p>
          )}
        </Field>
      </FieldSection>

      <FieldSection index={2} title={C.sections.variable} meta="6 fields">
        <Field label={C.labels.signingBonus} helpText={C.helpText.signingBonus}>
          <NumericInput
            value={form.offerSigningBonus}
            onChange={(v) => set('offerSigningBonus', v)}
            onBlur={onBlur}
            min={1}
            allowDecimal
            placeholder="Amount"
          />
        </Field>

        <Field label={C.labels.annualBonus} helpText={C.helpText.annualBonus}>
          <PairedRow
            primary={
              <NumericInput
                value={form.offerAnnualBonus}
                onChange={(v) => set('offerAnnualBonus', v)}
                onBlur={onBlur}
                min={0}
                max={
                  form.offerAnnualBonusType === '% of base'
                    ? SCR004_LIMITS.percentMax
                    : undefined
                }
                allowDecimal
                placeholder="Amount"
              />
            }
            secondary={
              <Select
                options={BONUS_COMMISSION_TYPES}
                value={form.offerAnnualBonusType}
                onChange={(v) => set('offerAnnualBonusType', v)}
                onBlur={onBlur}
              />
            }
          />
        </Field>

        <Field label={C.labels.commission} helpText={C.helpText.commission}>
          <PairedRow
            primary={
              <NumericInput
                value={form.offerCommission}
                onChange={(v) => set('offerCommission', v)}
                onBlur={onBlur}
                min={0}
                max={
                  form.offerCommissionType === '% of base'
                    ? SCR004_LIMITS.percentMax
                    : undefined
                }
                allowDecimal
                placeholder="Amount"
              />
            }
            secondary={
              <Select
                options={BONUS_COMMISSION_TYPES}
                value={form.offerCommissionType}
                onChange={(v) => set('offerCommissionType', v)}
                onBlur={onBlur}
              />
            }
          />
        </Field>

        <Field label={C.labels.equity} helpText={C.helpText.equity}>
          <PairedRow
            primary={
              <NumericInput
                value={form.offerEquity}
                onChange={(v) => set('offerEquity', v)}
                onBlur={onBlur}
                min={1}
                allowDecimal
                placeholder="Value"
              />
            }
            secondary={
              <Select
                options={EQUITY_TYPES}
                value={form.offerEquityType}
                onChange={(v) => set('offerEquityType', v)}
                onBlur={onBlur}
              />
            }
          />
        </Field>
      </FieldSection>

      <FieldSection index={3} title={C.sections.allowances} meta="4 fields">
        {showTransport && (
          <Field
            label={C.labels.transportAllowance}
            helpText={C.helpText.transportAllowance}
          >
            <PairedRow
              primary={
                <NumericInput
                  value={form.offerTransportAllowance}
                  onChange={(v) => set('offerTransportAllowance', v)}
                  onBlur={onBlur}
                  min={1}
                  allowDecimal
                  placeholder="Amount"
                />
              }
              secondary={
                <Select
                  options={ALLOWANCE_FREQUENCIES}
                  value={form.offerTransportFrequency}
                  onChange={(v) => set('offerTransportFrequency', v)}
                  onBlur={onBlur}
                />
              }
            />
          </Field>
        )}

        <Field label={C.labels.otherAllowance} helpText={C.helpText.otherAllowance}>
          <PairedRow
            primary={
              <NumericInput
                value={form.offerOtherAllowance}
                onChange={(v) => set('offerOtherAllowance', v)}
                onBlur={onBlur}
                min={1}
                allowDecimal
                placeholder="Amount"
              />
            }
            secondary={
              <Select
                options={ALLOWANCE_FREQUENCIES}
                value={form.offerOtherAllowanceFrequency}
                onChange={(v) => set('offerOtherAllowanceFrequency', v)}
                onBlur={onBlur}
              />
            }
          />
        </Field>
      </FieldSection>

      <FieldSection index={4} title={C.sections.quality} meta="4 fields">
        {showRelocation && (
          <Field
            label={C.labels.relocationSupport}
            helpText={C.helpText.relocationSupport}
            fullWidth
          >
            <PairedRow
              primary={
                <Select
                  options={RELOCATION_SUPPORT}
                  value={form.offerRelocationSupport}
                  onChange={(v) => set('offerRelocationSupport', v)}
                  onBlur={onBlur}
                  placeholder="Select"
                />
              }
              secondary={
                <NumericInput
                  value={form.offerRelocationAmount}
                  onChange={(v) => set('offerRelocationAmount', v)}
                  onBlur={onBlur}
                  min={1}
                  allowDecimal
                  placeholder="Amount"
                />
              }
              secondaryWidth="w-40"
            />
          </Field>
        )}

        {showReviewCycle && (
          <Field label={C.labels.reviewCycle} helpText={C.helpText.reviewCycle}>
            <Select
              options={REVIEW_CYCLES}
              value={form.offerReviewCycle}
              onChange={(v) => set('offerReviewCycle', v)}
              onBlur={onBlur}
            />
            {form.offerReviewCycle === 'Other' && (
              <OtherTextInput
                value={form.offerReviewCycleOtherText}
                onChange={(v) => set('offerReviewCycleOtherText', v)}
                maxLength={SCR004_LIMITS.reviewCycleOtherMax}
              />
            )}
          </Field>
        )}

        <Field
          label={C.labels.negotiationRoom}
          helpText={C.helpText.negotiationRoom}
        >
          <RadioCards
            name={C.labels.negotiationRoom}
            options={NEGOTIATION_ROOM}
            value={form.offerNegotiationRoom}
            onChange={(v) => set('offerNegotiationRoom', v)}
            fullWidthOptions={false}
          />
        </Field>
      </FieldSection>
    </WizardShell>
  );
}
