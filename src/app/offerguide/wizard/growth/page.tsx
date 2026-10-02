'use client';

import * as React from 'react';
import toast from 'react-hot-toast';

import WizardShell from '../../_components/WizardShell';
import Field, { FieldSection } from '../../_components/fields/Field';
import RadioCards, { RatingCards } from '../../_components/fields/RadioCards';
import { Select } from '../../_components/fields/Inputs';
import OtherTextInput from '../../_components/fields/OtherTextInput';

import { getScreen, type WizardScreen } from '../../_constants/screens';
import {
  GROWTH_ANCHORS,
  INTERNAL_MOBILITY,
  LEARNING_BUDGET,
  MENTORSHIP,
  PROMOTION_PATH,
  PROMOTION_TIMELINE,
  ROLE_SCOPE,
  SCR007_COPY,
  SCR007_DEFAULTS,
  SCR007_LIMITS,
  STRONG_LEADERS,
  TRAINING_SUPPORT,
} from '../../_constants/scr007';

import * as api from '../../_state/api';
import { useWizardContext } from '../../_state/useWizardContext';
import { useDraftAutosave } from '../../_state/useDraftAutosave';

const SCREEN = getScreen('SCR-007');
const C = SCR007_COPY;

type GrowthForm = {
  offerLearningBudget: string;
  offerLearningBudgetOtherText: string;
  offerTrainingSupport: string;
  offerBrandValue: number | null;
  offerSkillPotential: number | null;
  offerGoalMatch: number | null;
  offerPromotionPath: string;
  offerMentorship: string;
  offerStrongLeaders: string;
  offerInternalMobility: string;
  offerRoleScope: string;
  offerPromotionTimeline: string;
  offerPromotionTimelineOtherText: string;
  offerGrowthImportance: number | null;
};

const EMPTY_FORM: GrowthForm = {
  offerLearningBudget: SCR007_DEFAULTS.offerLearningBudget,
  offerLearningBudgetOtherText: '',
  offerTrainingSupport: SCR007_DEFAULTS.offerTrainingSupport,
  offerBrandValue: SCR007_DEFAULTS.offerBrandValue,
  offerSkillPotential: SCR007_DEFAULTS.offerSkillPotential,
  offerGoalMatch: SCR007_DEFAULTS.offerGoalMatch,
  offerPromotionPath: SCR007_DEFAULTS.offerPromotionPath,
  offerMentorship: SCR007_DEFAULTS.offerMentorship,
  offerStrongLeaders: SCR007_DEFAULTS.offerStrongLeaders,
  offerInternalMobility: SCR007_DEFAULTS.offerInternalMobility,
  offerRoleScope: SCR007_DEFAULTS.offerRoleScope,
  offerPromotionTimeline: SCR007_DEFAULTS.offerPromotionTimeline,
  offerPromotionTimelineOtherText: '',
  offerGrowthImportance: SCR007_DEFAULTS.offerGrowthImportance,
};

/**
 * SCR-007 — Growth.
 * 12 fields, all optional, two sections.
 *
 * Goal match and role scope both span the full desktop width.
 */
export default function GrowthPage() {
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
    React.useState<GrowthForm>(EMPTY_FORM);

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

      const g = (
        offer as {
          growth?: api.OfferGrowth | null;
        } | null
      )?.growth;

      if (g) {
        setForm((prev) => ({
          ...prev,

          offerLearningBudget:
            g.offerLearningBudget ||
            prev.offerLearningBudget,

          offerTrainingSupport:
            g.offerTrainingSupport ||
            prev.offerTrainingSupport,

          offerBrandValue:
            g.offerBrandValue ??
            prev.offerBrandValue,

          offerSkillPotential:
            g.offerSkillPotential ??
            prev.offerSkillPotential,

          offerGoalMatch:
            g.offerGoalMatch ??
            prev.offerGoalMatch,

          offerPromotionPath:
            g.offerPromotionPath ||
            prev.offerPromotionPath,

          offerMentorship:
            g.offerMentorship ||
            prev.offerMentorship,

          offerStrongLeaders:
            g.offerStrongLeaders ||
            prev.offerStrongLeaders,

          offerInternalMobility:
            g.offerInternalMobility ||
            prev.offerInternalMobility,

          offerRoleScope:
            g.offerRoleScope ||
            prev.offerRoleScope,

          offerPromotionTimeline:
            g.offerPromotionTimeline ||
            prev.offerPromotionTimeline,

          offerGrowthImportance:
            g.offerGrowthImportance ??
            prev.offerGrowthImportance,
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
    <K extends keyof GrowthForm>(
      key: K,
      value: GrowthForm[K],
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
  // stepper; the Next button leaves it undefined and goes to SCR-008.
  async function handleNext(target?: WizardScreen) {
    if (!offerId) return;

    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        offerLearningBudget:
          form.offerLearningBudget,

        offerTrainingSupport:
          form.offerTrainingSupport,

        offerBrandValue:
          form.offerBrandValue,

        offerSkillPotential:
          form.offerSkillPotential,

        offerGoalMatch:
          form.offerGoalMatch,

        offerPromotionPath:
          form.offerPromotionPath,

        offerMentorship:
          form.offerMentorship,

        offerStrongLeaders:
          form.offerStrongLeaders,

        offerInternalMobility:
          form.offerInternalMobility,

        offerRoleScope:
          form.offerRoleScope,

        offerPromotionTimeline:
          form.offerPromotionTimeline,

        offerGrowthImportance:
          form.offerGrowthImportance,
      };

      if (
        form.offerLearningBudget === 'Other'
      ) {
        payload.offerLearningBudgetOtherText =
          form.offerLearningBudgetOtherText;
      }

      if (
        form.offerPromotionTimeline === 'Other'
      ) {
        payload.offerPromotionTimelineOtherText =
          form.offerPromotionTimelineOtherText;
      }

      await api.updateOfferGrowth(
        offerId,
        payload,
      );

      void saveNow(form);

      navigateWithContext(
        (target ?? getScreen('SCR-008')).href,
        {
          session: sessionId ?? undefined,
          offer: offerId,
        },
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not save growth details.',
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
          getScreen('SCR-006').href,
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
        title={C.sections.learning}
        meta="4 fields"
      >
        <Field
          label={C.labels.learningBudget}
          helpText={C.helpText.learningBudget}
        >
          <RadioCards
            name={C.labels.learningBudget}
            options={LEARNING_BUDGET}
            value={form.offerLearningBudget}
            onChange={(v) =>
              set('offerLearningBudget', v)
            }
            otherText={
              form.offerLearningBudgetOtherText
            }
            onOtherTextChange={(t) =>
              set(
                'offerLearningBudgetOtherText',
                t,
              )
            }
            otherMaxLength={
              SCR007_LIMITS.otherTextMax
            }
          />
        </Field>

        <Field
          label={C.labels.trainingSupport}
          helpText={C.helpText.trainingSupport}
        >
          <Select
            options={TRAINING_SUPPORT}
            value={form.offerTrainingSupport}
            onChange={(v) =>
              set('offerTrainingSupport', v)
            }
            onBlur={onBlur}
          />
        </Field>

        <Field
          label={C.labels.brandValue}
          helpText={C.helpText.brandValue}
        >
          <RatingCards
            name={C.labels.brandValue}
            value={form.offerBrandValue}
            onChange={(v) =>
              set('offerBrandValue', v)
            }
            lowAnchor={
              GROWTH_ANCHORS.brandValue.low
            }
            highAnchor={
              GROWTH_ANCHORS.brandValue.high
            }
          />
        </Field>

        <Field
          label={C.labels.skillPotential}
          helpText={C.helpText.skillPotential}
        >
          <RatingCards
            name={C.labels.skillPotential}
            value={form.offerSkillPotential}
            onChange={(v) =>
              set('offerSkillPotential', v)
            }
            lowAnchor={
              GROWTH_ANCHORS.skillPotential.low
            }
            highAnchor={
              GROWTH_ANCHORS.skillPotential.high
            }
          />
        </Field>
      </FieldSection>

      <FieldSection
        index={2}
        title={C.sections.progression}
        meta="8 fields"
      >
        <Field
          label={C.labels.goalMatch}
          helpText={C.helpText.goalMatch}
          fullWidth
        >
          <RatingCards
            name={C.labels.goalMatch}
            value={form.offerGoalMatch}
            onChange={(v) =>
              set('offerGoalMatch', v)
            }
            lowAnchor={
              GROWTH_ANCHORS.goalMatch.low
            }
            highAnchor={
              GROWTH_ANCHORS.goalMatch.high
            }
          />
        </Field>

        <Field
          label={C.labels.promotionPath}
          helpText={C.helpText.promotionPath}
        >
          <RadioCards
            name={C.labels.promotionPath}
            options={PROMOTION_PATH}
            value={form.offerPromotionPath}
            onChange={(v) =>
              set('offerPromotionPath', v)
            }
          />
        </Field>

        <Field
          label={C.labels.mentorship}
          helpText={C.helpText.mentorship}
        >
          <RadioCards
            name={C.labels.mentorship}
            options={MENTORSHIP}
            value={form.offerMentorship}
            onChange={(v) =>
              set('offerMentorship', v)
            }
          />
        </Field>

        <Field
          label={C.labels.strongLeaders}
          helpText={C.helpText.strongLeaders}
        >
          <RadioCards
            name={C.labels.strongLeaders}
            options={STRONG_LEADERS}
            value={form.offerStrongLeaders}
            onChange={(v) =>
              set('offerStrongLeaders', v)
            }
          />
        </Field>

        <Field
          label={C.labels.internalMobility}
          helpText={C.helpText.internalMobility}
        >
          <RadioCards
            name={C.labels.internalMobility}
            options={INTERNAL_MOBILITY}
            value={form.offerInternalMobility}
            onChange={(v) =>
              set('offerInternalMobility', v)
            }
          />
        </Field>

        <Field
          label={C.labels.roleScope}
          helpText={C.helpText.roleScope}
          fullWidth
        >
          <RadioCards
            name={C.labels.roleScope}
            options={ROLE_SCOPE}
            value={form.offerRoleScope}
            onChange={(v) =>
              set('offerRoleScope', v)
            }
          />
        </Field>

        <Field
          label={C.labels.promotionTimeline}
          helpText={C.helpText.promotionTimeline}
        >
          <Select
            options={PROMOTION_TIMELINE}
            value={form.offerPromotionTimeline}
            onChange={(v) =>
              set('offerPromotionTimeline', v)
            }
            onBlur={onBlur}
          />

          {form.offerPromotionTimeline ===
            'Other' && (
            <OtherTextInput
              value={
                form.offerPromotionTimelineOtherText
              }
              onChange={(v) =>
                set(
                  'offerPromotionTimelineOtherText',
                  v,
                )
              }
              maxLength={
                SCR007_LIMITS.otherTextMax
              }
            />
          )}
        </Field>

        <Field
          label={C.labels.growthImportance}
          helpText={C.helpText.growthImportance}
        >
          <RatingCards
            name={C.labels.growthImportance}
            value={form.offerGrowthImportance}
            onChange={(v) =>
              set('offerGrowthImportance', v)
            }
            lowAnchor={
              GROWTH_ANCHORS.growthImportance.low
            }
            highAnchor={
              GROWTH_ANCHORS.growthImportance.high
            }
          />
        </Field>
      </FieldSection>
    </WizardShell>
  );
}