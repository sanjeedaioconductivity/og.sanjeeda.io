'use client';

import * as React from 'react';
import toast from 'react-hot-toast';

import WizardShell from '../../_components/WizardShell';
import Field, { FieldSection } from '../../_components/fields/Field';
import RadioCards from '../../_components/fields/RadioCards';
import { NumericInput, Select } from '../../_components/fields/Inputs';

import { getScreen, type WizardScreen } from '../../_constants/screens';
import {
  AFTER_HOURS_AVAILABILITY,
  ENERGY_POSITIVE_VALUES,
  ENERGY_WARNING_VALUES,
  HYBRID_DAYS,
  LEAVE_FLEXIBILITY,
  OVERTIME_COMPENSATION,
  PERSONAL_ENERGY,
  SCR006_COPY,
  SCR006_DEFAULTS,
  SCR006_LIMITS,
  TIME_FLEXIBILITY,
  TRAVEL_REQUIREMENT,
  WEEKEND_WORK,
  WFH_SUPPORT,
  WORKLIFE_IMPORTANCE,
} from '../../_constants/scr006';

import * as api from '../../_state/api';
import { useWizardContext } from '../../_state/useWizardContext';
import { useDraftAutosave } from '../../_state/useDraftAutosave';

const SCREEN = getScreen('SCR-006');
const C = SCR006_COPY;

type WorkLifeForm = {
  offerWorkingHours: number | null;
  offerWeekendWork: string;
  offerTravelRequirement: string;
  offerHybridDays: string;
  offerCommuteMinutes: number | null;
  offerTimeFlexibility: string;
  offerWfhSupport: string;
  offerOvertimeCompensation: string;
  offerAfterHoursAvailability: string;
  offerLeaveFlexibility: string;
  offerPersonalEnergy: string;
  offerWorklifeImportance: string;
};

const EMPTY_FORM: WorkLifeForm = {
  offerWorkingHours: null,
  offerWeekendWork: SCR006_DEFAULTS.offerWeekendWork,
  offerTravelRequirement: SCR006_DEFAULTS.offerTravelRequirement,
  offerHybridDays: SCR006_DEFAULTS.offerHybridDays,
  offerCommuteMinutes: null,
  offerTimeFlexibility: SCR006_DEFAULTS.offerTimeFlexibility,
  offerWfhSupport: SCR006_DEFAULTS.offerWfhSupport,
  offerOvertimeCompensation: SCR006_DEFAULTS.offerOvertimeCompensation,
  offerAfterHoursAvailability: SCR006_DEFAULTS.offerAfterHoursAvailability,
  offerLeaveFlexibility: SCR006_DEFAULTS.offerLeaveFlexibility,
  offerPersonalEnergy: SCR006_DEFAULTS.offerPersonalEnergy,
  offerWorklifeImportance: SCR006_DEFAULTS.offerWorklifeImportance,
};

/**
 * SCR-006 — Work & Life.
 *
 * 12 fields, all optional.
 *
 * Commute and WFH support are hidden for Remote offers.
 *
 * Numeric values must remain null when blank rather than being converted to 0.
 */
export default function WorkLifePage() {
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
    React.useState<WorkLifeForm>(EMPTY_FORM);

  const [loading, setLoading] =
    React.useState(true);

  const [submitting, setSubmitting] =
    React.useState(false);

  const [
    offerWorkArrangement,
    setOfferWorkArrangement,
  ] = React.useState<string | null>(null);

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

      if (offer) {
        setOfferWorkArrangement(
          offer.offerWorkArrangement ?? null,
        );

        const w = (
          offer as {
            workLife?: api.OfferWorkLife | null;
          }
        ).workLife;

        if (w) {
          setForm({
            offerWorkingHours:
              w.offerWorkingHours ?? null,

            offerWeekendWork:
              w.offerWeekendWork ||
              SCR006_DEFAULTS.offerWeekendWork,

            offerTravelRequirement:
              w.offerTravelRequirement ||
              SCR006_DEFAULTS.offerTravelRequirement,

            offerHybridDays:
              w.offerHybridDays ||
              SCR006_DEFAULTS.offerHybridDays,

            offerCommuteMinutes:
              w.offerCommuteMinutes ?? null,

            offerTimeFlexibility:
              w.offerTimeFlexibility ||
              SCR006_DEFAULTS.offerTimeFlexibility,

            offerWfhSupport:
              w.offerWfhSupport ||
              SCR006_DEFAULTS.offerWfhSupport,

            offerOvertimeCompensation:
              w.offerOvertimeCompensation ||
              SCR006_DEFAULTS.offerOvertimeCompensation,

            offerAfterHoursAvailability:
              w.offerAfterHoursAvailability ||
              SCR006_DEFAULTS.offerAfterHoursAvailability,

            offerLeaveFlexibility:
              w.offerLeaveFlexibility ||
              SCR006_DEFAULTS.offerLeaveFlexibility,

            offerPersonalEnergy:
              w.offerPersonalEnergy ||
              SCR006_DEFAULTS.offerPersonalEnergy,

            offerWorklifeImportance:
              w.offerWorklifeImportance ||
              SCR006_DEFAULTS.offerWorklifeImportance,
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
    <K extends keyof WorkLifeForm>(
      key: K,
      value: WorkLifeForm[K],
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

  const isRemote =
    offerWorkArrangement === 'Remote';

  const showCommute = !isRemote;
  const showWfhSupport = !isRemote;

  // `target` is set when the candidate clicked a later step on the module
  // stepper; the Next button leaves it undefined and goes to SCR-007.
  async function handleNext(target?: WizardScreen) {
    if (!offerId) return;

    setSubmitting(true);

    try {
      const normalizedForm: WorkLifeForm = {
        ...form,

        offerCommuteMinutes:
          showCommute
            ? form.offerCommuteMinutes
            : null,

        offerWfhSupport:
          showWfhSupport
            ? form.offerWfhSupport
            : SCR006_DEFAULTS.offerWfhSupport,
      };

      const payload: Record<string, unknown> = {
        offerWorkingHours:
          normalizedForm.offerWorkingHours,

        offerWeekendWork:
          normalizedForm.offerWeekendWork,

        offerTravelRequirement:
          normalizedForm.offerTravelRequirement,

        offerHybridDays:
          normalizedForm.offerHybridDays,

        offerTimeFlexibility:
          normalizedForm.offerTimeFlexibility,

        offerOvertimeCompensation:
          normalizedForm.offerOvertimeCompensation,

        offerAfterHoursAvailability:
          normalizedForm.offerAfterHoursAvailability,

        offerLeaveFlexibility:
          normalizedForm.offerLeaveFlexibility,

        offerPersonalEnergy:
          normalizedForm.offerPersonalEnergy,

        offerWorklifeImportance:
          normalizedForm.offerWorklifeImportance,

        offerCommuteMinutes:
          normalizedForm.offerCommuteMinutes,

        offerWfhSupport:
          normalizedForm.offerWfhSupport,
      };

      await api.updateOfferWorkLife(
        offerId,
        payload,
      );

      void saveNow(normalizedForm);

      navigateWithContext(
        (target ?? getScreen('SCR-007')).href,
        {
          session:
            sessionId ?? undefined,
          offer: offerId,
        },
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not save work & life details.',
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
      introRequirementNote={
        C.requirementNote
      }
      onBack={() =>
        navigateWithContext(
          getScreen('SCR-005').href,
          {
            session:
              sessionId ?? undefined,
            offer:
              offerId ?? undefined,
          },
        )
      }
      onNext={handleNext}
      isSubmitting={submitting}
    >
      {/* =========================================
          SECTION 1 — DAILY REALITY
      ========================================= */}

      <FieldSection
        index={1}
        title={C.sections.dailyReality}
        meta="6 fields"
      >
        <Field
          label={C.labels.workingHours}
          helpText={
            C.helpText.workingHours
          }
        >
          <NumericInput
            value={
              form.offerWorkingHours
            }
            onChange={(v) =>
              set(
                'offerWorkingHours',
                v,
              )
            }
            onBlur={onBlur}
            unit="hrs / week"
            min={
              SCR006_LIMITS
                .workingHoursMin
            }
            max={
              SCR006_LIMITS
                .workingHoursMax
            }
            placeholder="e.g. 45"
          />
        </Field>

        <Field
          label={C.labels.weekendWork}
          helpText={
            C.helpText.weekendWork
          }
        >
          <Select
            options={WEEKEND_WORK}
            value={
              form.offerWeekendWork
            }
            onChange={(v) =>
              set(
                'offerWeekendWork',
                v,
              )
            }
            onBlur={onBlur}
          />
        </Field>

        <Field
          label={
            C.labels.travelRequirement
          }
          helpText={
            C.helpText
              .travelRequirement
          }
        >
          <RadioCards
            name={
              C.labels.travelRequirement
            }
            options={
              TRAVEL_REQUIREMENT
            }
            value={
              form.offerTravelRequirement
            }
            onChange={(v) =>
              set(
                'offerTravelRequirement',
                v,
              )
            }
          />
        </Field>

        <Field
          label={C.labels.hybridDays}
          helpText={
            C.helpText.hybridDays
          }
        >
          <Select
            options={HYBRID_DAYS}
            value={
              form.offerHybridDays
            }
            onChange={(v) =>
              set(
                'offerHybridDays',
                v,
              )
            }
            onBlur={onBlur}
          />
        </Field>

        {showCommute && (
          <Field
            label={
              C.labels.commuteMinutes
            }
            helpText={
              C.helpText.commuteMinutes
            }
          >
            <NumericInput
              value={
                form.offerCommuteMinutes
              }
              onChange={(v) =>
                set(
                  'offerCommuteMinutes',
                  v,
                )
              }
              onBlur={onBlur}
              unit="min / day"
              min={
                SCR006_LIMITS
                  .commuteMinutesMin
              }
              max={
                SCR006_LIMITS
                  .commuteMinutesMax
              }
              placeholder="Round trip"
            />
          </Field>
        )}

        <Field
          label={
            C.labels.timeFlexibility
          }
          helpText={
            C.helpText
              .timeFlexibility
          }
        >
          <Select
            options={TIME_FLEXIBILITY}
            value={
              form.offerTimeFlexibility
            }
            onChange={(v) =>
              set(
                'offerTimeFlexibility',
                v,
              )
            }
            onBlur={onBlur}
          />
        </Field>
      </FieldSection>

      {/* =========================================
          SECTION 2 — FLEXIBILITY
      ========================================= */}

      <FieldSection
        index={2}
        title={C.sections.flexibility}
        meta="6 fields"
      >
        {showWfhSupport && (
          <Field
            label={C.labels.wfhSupport}
            helpText={
              C.helpText.wfhSupport
            }
          >
            <RadioCards
              name={
                C.labels.wfhSupport
              }
              options={WFH_SUPPORT}
              value={
                form.offerWfhSupport
              }
              onChange={(v) =>
                set(
                  'offerWfhSupport',
                  v,
                )
              }
            />
          </Field>
        )}

        <Field
          label={
            C.labels
              .overtimeCompensation
          }
          helpText={
            C.helpText
              .overtimeCompensation
          }
        >
          <RadioCards
            name={
              C.labels
                .overtimeCompensation
            }
            options={
              OVERTIME_COMPENSATION
            }
            value={
              form.offerOvertimeCompensation
            }
            onChange={(v) =>
              set(
                'offerOvertimeCompensation',
                v,
              )
            }
          />
        </Field>

        <Field
          label={
            C.labels
              .afterHoursAvailability
          }
          helpText={
            C.helpText
              .afterHoursAvailability
          }
        >
          <Select
            options={
              AFTER_HOURS_AVAILABILITY
            }
            value={
              form.offerAfterHoursAvailability
            }
            onChange={(v) =>
              set(
                'offerAfterHoursAvailability',
                v,
              )
            }
            onBlur={onBlur}
          />
        </Field>

        <Field
          label={
            C.labels.leaveFlexibility
          }
          helpText={
            C.helpText
              .leaveFlexibility
          }
        >
          <Select
            options={
              LEAVE_FLEXIBILITY
            }
            value={
              form.offerLeaveFlexibility
            }
            onChange={(v) =>
              set(
                'offerLeaveFlexibility',
                v,
              )
            }
            onBlur={onBlur}
          />
        </Field>

        <Field
          label={
            C.labels.personalEnergy
          }
          helpText={
            C.helpText.personalEnergy
          }
        >
          <RadioCards
            name={
              C.labels.personalEnergy
            }
            options={
              PERSONAL_ENERGY
            }
            value={
              form.offerPersonalEnergy
            }
            onChange={(v) =>
              set(
                'offerPersonalEnergy',
                v,
              )
            }
            positiveValues={
              ENERGY_POSITIVE_VALUES
            }
            warningValues={
              ENERGY_WARNING_VALUES
            }
          />
        </Field>

        <Field
          label={
            C.labels
              .worklifeImportance
          }
          helpText={
            C.helpText
              .worklifeImportance
          }
        >
          <RadioCards
            name={
              C.labels
                .worklifeImportance
            }
            options={
              WORKLIFE_IMPORTANCE
            }
            value={
              form.offerWorklifeImportance
            }
            onChange={(v) =>
              set(
                'offerWorklifeImportance',
                v,
              )
            }
          />
        </Field>
      </FieldSection>
    </WizardShell>
  );
}