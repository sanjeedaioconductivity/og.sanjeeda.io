'use client';

import * as React from 'react';
import toast from 'react-hot-toast';

import WizardShell from '../../_components/WizardShell';
import Field, { FieldSection } from '../../_components/fields/Field';
import RadioCards, { RatingCards } from '../../_components/fields/RadioCards';
import Chips from '../../_components/fields/Chips';
import { TextArea } from '../../_components/fields/Inputs';

import { getScreen, type WizardScreen } from '../../_constants/screens';
import {
  COMPANY_REPUTATION,
  CULTURE_ANCHORS,
  EMPLOYER_TREATMENT_SIGNAL,
  INCLUSION_CONFIDENCE,
  LEADERSHIP_STABILITY,
  LEADERSHIP_STYLE,
  MANAGER_IMPRESSION,
  PSYCH_SAFETY,
  RED_FLAGS,
  SCR008_COPY,
  SCR008_DEFAULTS,
  SCR008_LIMITS,
  SCR008_WARNING_VALUES,
  WORK_PRESSURE,
} from '../../_constants/scr008';

import * as api from '../../_state/api';
import { useWizardContext } from '../../_state/useWizardContext';
import { useDraftAutosave } from '../../_state/useDraftAutosave';

const SCREEN = getScreen('SCR-008');
const C = SCR008_COPY;

type CultureForm = {
  offerManagerImpression: string;
  offerTeamCultureFit: number | null;
  offerRedFlags: string[];
  offerRedFlagsOtherText: string;
  offerNotes: string;
  offerValuesAlignment: number | null;
  offerInclusionConfidence: string;
  offerWorkPressure: string;
  offerCompanyReputation: string;
  offerCompanyReputationOtherText: string;
  offerLeadershipStability: string;
  offerEmployerTreatmentSignal: string;
  offerLeadershipStyle: string;
  offerPsychSafety: string;
  offerPurposeSense: number | null;
  offerCultureImportance: number | null;
};

const EMPTY_FORM: CultureForm = {
  offerManagerImpression: SCR008_DEFAULTS.offerManagerImpression,
  offerTeamCultureFit: SCR008_DEFAULTS.offerTeamCultureFit,
  offerRedFlags: [],
  offerRedFlagsOtherText: '',
  offerNotes: '',
  offerValuesAlignment: SCR008_DEFAULTS.offerValuesAlignment,
  offerInclusionConfidence: SCR008_DEFAULTS.offerInclusionConfidence,
  offerWorkPressure: SCR008_DEFAULTS.offerWorkPressure,
  offerCompanyReputation: SCR008_DEFAULTS.offerCompanyReputation,
  offerCompanyReputationOtherText: '',
  offerLeadershipStability: SCR008_DEFAULTS.offerLeadershipStability,
  offerEmployerTreatmentSignal: SCR008_DEFAULTS.offerEmployerTreatmentSignal,
  offerLeadershipStyle: SCR008_DEFAULTS.offerLeadershipStyle,
  offerPsychSafety: SCR008_DEFAULTS.offerPsychSafety,
  offerPurposeSense: SCR008_DEFAULTS.offerPurposeSense,
  offerCultureImportance: SCR008_DEFAULTS.offerCultureImportance,
};

/**
 * SCR-008 — Culture & Manager.
 * All fields are optional and divided into two sections:
 * Manager and Culture.
 */
export default function CulturePage() {
  const {
    sessionId,
    offerId,
    resolving,
    navigateWithContext,
  } = useWizardContext();

  const {
    scheduleSave,
    saveNow,
  } = useDraftAutosave(SCREEN.id);

  const [form, setForm] =
    React.useState<CultureForm>(EMPTY_FORM);

  const [loading, setLoading] =
    React.useState(true);

  const [submitting, setSubmitting] =
    React.useState(false);

  React.useEffect(() => {
    if (resolving) return;

    let cancelled = false;

    async function load() {
      if (!sessionId || !offerId) {
        navigateWithContext(
          getScreen('SCR-003').href,
          {
            session: sessionId ?? undefined,
          },
        );

        return;
      }

      const offer = await api
        .getOffer(offerId)
        .catch(() => null);

      if (cancelled) return;

      const c = (
        offer as {
          culture?: api.OfferCulture | null;
        } | null
      )?.culture;

      if (c) {
        setForm((prev) => ({
          ...prev,

          offerManagerImpression:
            c.offerManagerImpression ||
            prev.offerManagerImpression,

          offerTeamCultureFit:
            c.offerTeamCultureFit ??
            prev.offerTeamCultureFit,

          offerRedFlags:
            Array.isArray(c.offerRedFlags)
              ? c.offerRedFlags
              : [],

          offerNotes:
            c.offerNotes ?? '',

          offerValuesAlignment:
            c.offerValuesAlignment ??
            prev.offerValuesAlignment,

          offerInclusionConfidence:
            c.offerInclusionConfidence ||
            prev.offerInclusionConfidence,

          offerWorkPressure:
            c.offerWorkPressure ||
            prev.offerWorkPressure,

          offerCompanyReputation:
            c.offerCompanyReputation ||
            prev.offerCompanyReputation,

          offerLeadershipStability:
            c.offerLeadershipStability ||
            prev.offerLeadershipStability,

          offerEmployerTreatmentSignal:
            c.offerEmployerTreatmentSignal ||
            prev.offerEmployerTreatmentSignal,

          offerLeadershipStyle:
            c.offerLeadershipStyle ||
            prev.offerLeadershipStyle,

          offerPsychSafety:
            c.offerPsychSafety ||
            prev.offerPsychSafety,

          offerPurposeSense:
            c.offerPurposeSense ??
            prev.offerPurposeSense,

          offerCultureImportance:
            c.offerCultureImportance ??
            prev.offerCultureImportance,
        }));
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
    <K extends keyof CultureForm>(
      key: K,
      value: CultureForm[K],
    ) => {
      setForm((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const onBlur = React.useCallback(
    () => scheduleSave(form),
    [scheduleSave, form],
  );

  React.useEffect(() => {
    if (loading) return;

    scheduleSave(form);
  }, [form, loading, scheduleSave]);

  // `target` is set when the candidate clicked a later step on the module
  // stepper; the Next button leaves it undefined and goes to SCR-009.
  async function handleNext(target?: WizardScreen) {
    if (!offerId) return;

    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        offerManagerImpression:
          form.offerManagerImpression,

        offerTeamCultureFit:
          form.offerTeamCultureFit,

        offerRedFlags:
          form.offerRedFlags,

        offerNotes:
          form.offerNotes || null,

        offerValuesAlignment:
          form.offerValuesAlignment,

        offerInclusionConfidence:
          form.offerInclusionConfidence,

        offerWorkPressure:
          form.offerWorkPressure,

        offerCompanyReputation:
          form.offerCompanyReputation,

        offerLeadershipStability:
          form.offerLeadershipStability,

        offerEmployerTreatmentSignal:
          form.offerEmployerTreatmentSignal,

        offerLeadershipStyle:
          form.offerLeadershipStyle,

        offerPsychSafety:
          form.offerPsychSafety,

        offerPurposeSense:
          form.offerPurposeSense,

        offerCultureImportance:
          form.offerCultureImportance,
      };

      if (
        form.offerCompanyReputation === 'Other'
      ) {
        payload.offerCompanyReputationOtherText =
          form.offerCompanyReputationOtherText;
      }

      await api.updateOfferCulture(
        offerId,
        payload,
      );

      void saveNow(form);

      navigateWithContext(
        (target ?? getScreen('SCR-009')).href,
        {
          session: sessionId ?? undefined,
          offer: offerId,
        },
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not save culture details.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (resolving || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading…
        </p>
      </div>
    );
  }

  return (
    <WizardShell
      screen={SCREEN}
      introPurpose={C.purpose}
      introRequirementNote={C.requirementNote}
      onBack={() =>
        navigateWithContext(
          getScreen('SCR-007').href,
          {
            session: sessionId ?? undefined,
            offer: offerId ?? undefined,
          },
        )
      }
      onNext={handleNext}
      isSubmitting={submitting}
    >
      <FieldSection
        index={1}
        title={C.sections.manager}
        meta="4 fields"
      >
        <Field
          label={C.labels.managerImpression}
          helpText={C.helpText.managerImpression}
        >
          <RadioCards
            name={C.labels.managerImpression}
            options={MANAGER_IMPRESSION}
            value={form.offerManagerImpression}
            onChange={(v) =>
              set('offerManagerImpression', v)
            }
            warningValues={
              SCR008_WARNING_VALUES.managerImpression
            }
          />
        </Field>

        <Field
          label={C.labels.teamCultureFit}
          helpText={C.helpText.teamCultureFit}
        >
          <RatingCards
            name={C.labels.teamCultureFit}
            value={form.offerTeamCultureFit}
            onChange={(v) =>
              set('offerTeamCultureFit', v)
            }
            lowAnchor={
              CULTURE_ANCHORS.teamCultureFit.low
            }
            highAnchor={
              CULTURE_ANCHORS.teamCultureFit.high
            }
          />
        </Field>

        <Field
          label={C.labels.redFlags}
          helpText={C.helpText.redFlags}
          fullWidth
        >
          <Chips
            name={C.labels.redFlags}
            options={RED_FLAGS}
            value={form.offerRedFlags}
            onChange={(v) =>
              set('offerRedFlags', v)
            }
            tone="warning"
            otherText={
              form.offerRedFlagsOtherText
            }
            onOtherTextChange={(t) =>
              set(
                'offerRedFlagsOtherText',
                t,
              )
            }
            otherMaxLength={
              SCR008_LIMITS.otherTextMax
            }
          />

          <p className="mt-1 text-[11px] font-medium text-warning">
            {C.redFlagsHint}
          </p>
        </Field>

        <Field
          label={C.labels.notes}
          helpText={C.helpText.notes}
          fullWidth
        >
          <TextArea
            value={form.offerNotes}
            onChange={(v) =>
              set('offerNotes', v)
            }
            onBlur={onBlur}
            maxLength={
              SCR008_LIMITS.notesMax
            }
            placeholder="Anything you want to remember about this offer…"
          />

          <p className="mt-1 text-[11px] italic text-muted-foreground">
            {C.notesNotScoredLabel}
          </p>
        </Field>
      </FieldSection>

      <FieldSection
        index={2}
        title={C.sections.culture}
        meta="10 fields"
      >
        <Field
          label={C.labels.valuesAlignment}
          helpText={
            C.helpText.valuesAlignment
          }
        >
          <RatingCards
            name={C.labels.valuesAlignment}
            value={form.offerValuesAlignment}
            onChange={(v) =>
              set('offerValuesAlignment', v)
            }
            lowAnchor={
              CULTURE_ANCHORS
                .valuesAlignment.low
            }
            highAnchor={
              CULTURE_ANCHORS
                .valuesAlignment.high
            }
          />
        </Field>

        <Field
          label={
            C.labels.inclusionConfidence
          }
          helpText={
            C.helpText.inclusionConfidence
          }
        >
          <RadioCards
            name={
              C.labels.inclusionConfidence
            }
            options={INCLUSION_CONFIDENCE}
            value={
              form.offerInclusionConfidence
            }
            onChange={(v) =>
              set(
                'offerInclusionConfidence',
                v,
              )
            }
            warningValues={
              SCR008_WARNING_VALUES
                .inclusionConfidence
            }
          />
        </Field>

        <Field
          label={C.labels.workPressure}
          helpText={C.helpText.workPressure}
        >
          <RadioCards
            name={C.labels.workPressure}
            options={WORK_PRESSURE}
            value={form.offerWorkPressure}
            onChange={(v) =>
              set('offerWorkPressure', v)
            }
            warningValues={
              SCR008_WARNING_VALUES
                .workPressure
            }
          />
        </Field>

        <Field
          label={
            C.labels.companyReputation
          }
          helpText={
            C.helpText.companyReputation
          }
        >
          <RadioCards
            name={
              C.labels.companyReputation
            }
            options={COMPANY_REPUTATION}
            value={
              form.offerCompanyReputation
            }
            onChange={(v) =>
              set(
                'offerCompanyReputation',
                v,
              )
            }
            warningValues={
              SCR008_WARNING_VALUES
                .companyReputation
            }
            otherText={
              form.offerCompanyReputationOtherText
            }
            onOtherTextChange={(t) =>
              set(
                'offerCompanyReputationOtherText',
                t,
              )
            }
            otherMaxLength={
              SCR008_LIMITS.otherTextMax
            }
          />
        </Field>

        <Field
          label={
            C.labels.leadershipStability
          }
          helpText={
            C.helpText.leadershipStability
          }
        >
          <RadioCards
            name={
              C.labels.leadershipStability
            }
            options={LEADERSHIP_STABILITY}
            value={
              form.offerLeadershipStability
            }
            onChange={(v) =>
              set(
                'offerLeadershipStability',
                v,
              )
            }
            warningValues={
              SCR008_WARNING_VALUES
                .leadershipStability
            }
          />
        </Field>

        <Field
          label={
            C.labels.employerTreatmentSignal
          }
          helpText={
            C.helpText
              .employerTreatmentSignal
          }
        >
          <RadioCards
            name={
              C.labels.employerTreatmentSignal
            }
            options={
              EMPLOYER_TREATMENT_SIGNAL
            }
            value={
              form.offerEmployerTreatmentSignal
            }
            onChange={(v) =>
              set(
                'offerEmployerTreatmentSignal',
                v,
              )
            }
            warningValues={
              SCR008_WARNING_VALUES
                .employerTreatmentSignal
            }
          />
        </Field>

        <Field
          label={C.labels.leadershipStyle}
          helpText={
            C.helpText.leadershipStyle
          }
        >
          <RadioCards
            name={C.labels.leadershipStyle}
            options={LEADERSHIP_STYLE}
            value={
              form.offerLeadershipStyle
            }
            onChange={(v) =>
              set(
                'offerLeadershipStyle',
                v,
              )
            }
            warningValues={
              SCR008_WARNING_VALUES
                .leadershipStyle
            }
          />
        </Field>

        <Field
          label={C.labels.psychSafety}
          helpText={C.helpText.psychSafety}
        >
          <RadioCards
            name={C.labels.psychSafety}
            options={PSYCH_SAFETY}
            value={form.offerPsychSafety}
            onChange={(v) =>
              set('offerPsychSafety', v)
            }
            warningValues={
              SCR008_WARNING_VALUES
                .psychSafety
            }
          />
        </Field>

        <Field
          label={C.labels.purposeSense}
          helpText={
            C.helpText.purposeSense
          }
        >
          <RatingCards
            name={C.labels.purposeSense}
            value={form.offerPurposeSense}
            onChange={(v) =>
              set('offerPurposeSense', v)
            }
            lowAnchor={
              CULTURE_ANCHORS
                .purposeSense.low
            }
            highAnchor={
              CULTURE_ANCHORS
                .purposeSense.high
            }
          />
        </Field>

        <Field
          label={
            C.labels.cultureImportance
          }
          helpText={
            C.helpText.cultureImportance
          }
        >
          <RatingCards
            name={
              C.labels.cultureImportance
            }
            value={
              form.offerCultureImportance
            }
            onChange={(v) =>
              set(
                'offerCultureImportance',
                v,
              )
            }
            lowAnchor={
              CULTURE_ANCHORS
                .cultureImportance.low
            }
            highAnchor={
              CULTURE_ANCHORS
                .cultureImportance.high
            }
          />
        </Field>
      </FieldSection>
    </WizardShell>
  );
}