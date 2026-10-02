 'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

import WizardShell from '../../_components/WizardShell';
import Field, {
  FieldSection,
  FieldSubSection,
} from '../../_components/fields/Field';
import RadioCards, {
  RatingCards,
} from '../../_components/fields/RadioCards';
import Chips from '../../_components/fields/Chips';
import Combobox from '../../_components/fields/Combobox';
import {
  NumericInput,
  PairedRow,
  Select,
  TextInput,
} from '../../_components/fields/Inputs';
import ConsentCard from '../../_components/ConsentCard';
import CompareModePicker from '../../_components/CompareModePicker';
import { useCompareMode } from '../../_state/useCompareMode';

import { getScreen, type WizardScreen } from '../../_constants/screens';
import { CURRENCY_OPTIONS } from '../../_constants/currencies';
import {
  CAREER_STAGES,
  CURRENT_BENEFITS,
  CURRENT_WORK_ARRANGEMENTS,
  EMPLOYED_STATUSES,
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_TYPES,
  PAY_FREQUENCIES,
  PREFERRED_WORK_ARRANGEMENTS,
  PREFERRED_WORK_LOCATIONS,
  SATISFACTION_ANCHORS,
  SCR001_COPY,
  SCR001_DEFAULTS,
  SCR001_LIMITS,
  WILLING_TO_RELOCATE,
  YES_NO,
} from '../../_constants/scr001';

import * as api from '../../_state/api';
import { useReferenceData } from '../../_state/useReferenceData';
import { useDraftAutosave } from '../../_state/useDraftAutosave';

const SCREEN = getScreen('SCR-001');
const C = SCR001_COPY;

type ProfileForm = {
  careerStage: string | null;
  careerStageOtherText: string;
  careerSwitcher: string;
  targetFunctionalDomain: string | null;
  currentCountry: string | null;
  currentCity: string | null;
  preferredWorkArrangement: string | null;
  preferredWorkLocation: string | null;
  preferredCountry: string | null;
  preferredLocationText: string;
  willingToRelocate: string;
  employmentStatus: string;
  currentJobTitle: string;
  employmentType: string;
  currentBaseSalary: number | null;
  currentCurrency: string | null;
  payFrequency: string;
  currentBenefits: string[];
  currentWorkArrangement: string;
  workingHoursPerWeek: number | null;
  averageDailyCommuteMinutes: number | null;
  overallJobSatisfaction: number | null;
  careerGrowthSatisfaction: number | null;
  workLifeBalanceSatisfaction: number | null;
};

const EMPTY_FORM: ProfileForm = {
  careerStage: null,
  careerStageOtherText: '',
  careerSwitcher: SCR001_DEFAULTS.careerSwitcher,
  targetFunctionalDomain: null,
  currentCountry: null,
  currentCity: null,
  preferredWorkArrangement: null,
  preferredWorkLocation: null,
  preferredCountry: null,
  preferredLocationText: '',
  willingToRelocate: SCR001_DEFAULTS.willingToRelocate,
  employmentStatus: SCR001_DEFAULTS.employmentStatus,
  currentJobTitle: '',
  employmentType: SCR001_DEFAULTS.employmentType,
  currentBaseSalary: null,
  currentCurrency: null,
  payFrequency: SCR001_DEFAULTS.payFrequency,
  currentBenefits: [],
  currentWorkArrangement: SCR001_DEFAULTS.currentWorkArrangement,
  workingHoursPerWeek: SCR001_DEFAULTS.workingHoursPerWeek,
  averageDailyCommuteMinutes:
    SCR001_DEFAULTS.averageDailyCommuteMinutes,
  overallJobSatisfaction: null,
  careerGrowthSatisfaction: null,
  workLifeBalanceSatisfaction: null,
};

/**
 * SCR-001 — Candidate Profile.
 *
 * Two required fields:
 * 1. Career stage
 * 2. Preferred work arrangement
 *
 * The profile is reused across evaluation sessions.
 */
export default function CandidateProfilePage() {
  const router = useRouter();
  // This screen needs no session of its own, so it doesn't use
  // useWizardContext — but "Start a new evaluation" arrives here with
  // `?session=new`, and that marker has to reach SCR-002 or it locks onto the
  // candidate's latest session instead of creating one.
  const startingNewSession = useSearchParams().get('session') === 'new';

  // CR-05 — Full Compare / Quick Compare, chosen here at the start of the flow.
  // Not part of `form`: it is not an answer about the candidate and is never sent
  // to /candidate-profile. See CompareModePicker for the reasoning.
  const { mode: compareMode, setMode: setCompareMode } = useCompareMode();

  const [form, setForm] =
    React.useState<ProfileForm>(EMPTY_FORM);

  const [loading, setLoading] =
    React.useState(true);

  const [submitting, setSubmitting] =
    React.useState(false);

  const [showErrors, setShowErrors] =
    React.useState(false);

  const [consentToggles, setConsentToggles] =
    React.useState<api.ConsentToggle[]>([]);

  const [shareAnonymous, setShareAnonymous] =
    React.useState(false);

  const [selections, setSelections] =
    React.useState<Record<string, boolean>>({});

  const {
    countries,
    cities,
    functionalDomains,
    loadingCountries,
  } = useReferenceData(form.currentCountry);

  const {
    scheduleSave,
    saveNow,
  } = useDraftAutosave(SCREEN.id);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      const [profile, draft, toggles] =
        await Promise.all([
          api
            .getCandidateProfile()
            .catch(() => null),

          api
            .getWizardDraft()
            .catch(() => null),

          api
            .getConsentToggles()
            .catch(() => []),
        ]);

      if (cancelled) return;

      setConsentToggles(
        toggles ?? [],
      );

      if (profile) {
        setForm((prev) => ({
          ...prev,

          careerStage:
            profile.careerStage ?? null,

          careerStageOtherText:
            profile.careerStageOtherText ?? '',

          careerSwitcher:
            profile.careerSwitcher ??
            prev.careerSwitcher,

          targetFunctionalDomain:
            profile.targetFunctionalDomain ??
            null,

          currentCountry:
            profile.currentCountry ?? null,

          currentCity:
            profile.currentCity ?? null,

          preferredWorkArrangement:
            profile.preferredWorkArrangement ??
            null,

          preferredWorkLocation:
            profile.preferredWorkLocation ??
            null,

          preferredCountry:
            profile.preferredCountry ?? null,

          preferredLocationText:
            profile.preferredLocationText ??
            '',

          willingToRelocate:
            profile.willingToRelocate ??
            prev.willingToRelocate,

          employmentStatus:
            profile.employmentStatus ??
            prev.employmentStatus,

          currentJobTitle:
            profile.currentJobTitle ?? '',

          employmentType:
            profile.employmentType ??
            prev.employmentType,

          currentBaseSalary:
            profile.currentBaseSalary != null
              ? Number(
                  profile.currentBaseSalary,
                )
              : null,

          currentCurrency:
            profile.currentCurrency ?? null,

          payFrequency:
            profile.payFrequency ??
            prev.payFrequency,

          currentBenefits:
            profile.currentBenefits ?? [],

          currentWorkArrangement:
            profile.currentWorkArrangement ??
            prev.currentWorkArrangement,

          workingHoursPerWeek:
            profile.workingHoursPerWeek ??
            null,

          averageDailyCommuteMinutes:
            profile.averageDailyCommuteMinutes ??
            null,

          overallJobSatisfaction:
            profile.overallJobSatisfaction ??
            null,

          careerGrowthSatisfaction:
            profile.careerGrowthSatisfaction ??
            null,

          workLifeBalanceSatisfaction:
            profile.workLifeBalanceSatisfaction ??
            null,
        }));

        setShareAnonymous(
          profile.consentSettings
            ?.shareAnonymous ?? false,
        );

        setSelections(
          profile.consentSettings
            ?.selections ?? {},
        );
      }

      const draftAnswers =
        draft?.answers as
          | Partial<ProfileForm>
          | undefined;

      if (
        draftAnswers &&
        Object.keys(draftAnswers).length > 0
      ) {
        setForm((prev) => ({
          ...prev,
          ...draftAnswers,
        }));
      }

      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const set = React.useCallback(
    <K extends keyof ProfileForm>(
      key: K,
      value: ProfileForm[K],
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

  const isEmployed =
    EMPLOYED_STATUSES.includes(
      form.employmentStatus,
    );

  const isCareerSwitcher =
    form.careerSwitcher === 'Yes';

  const wantsSpecificCity =
    form.preferredWorkLocation ===
    'Specific city';

  const wantsSpecificCountry =
    form.preferredWorkLocation ===
      'Specific country' ||
    wantsSpecificCity;

  const showCommute =
    form.currentWorkArrangement !==
    'Remote';

  const missingCareerStage =
    !form.careerStage;

  const missingArrangement =
    !form.preferredWorkArrangement;

  const careerStageOtherMissing =
    form.careerStage === 'Other' &&
    form.careerStageOtherText.trim() === '';

  const canProceed =
    !missingCareerStage &&
    !missingArrangement &&
    !careerStageOtherMissing;

  // `target` is set when the candidate clicked a later step on the module
  // stepper; the Next button leaves it undefined and goes to SCR-002.
  async function handleNext(target?: WizardScreen) {
    setShowErrors(true);

    if (!canProceed) {
      toast.error(
        careerStageOtherMissing
          ? 'Please specify your career stage.'
          : 'Career stage and preferred work arrangement are required.',
      );

      return;
    }

    setSubmitting(true);

    try {
      const payload: Record<
        string,
        unknown
      > = {
        careerStage:
          form.careerStage,

        careerStageOtherText:
          form.careerStage === 'Other'
            ? form.careerStageOtherText
            : null,

        careerSwitcher:
          form.careerSwitcher,

        targetFunctionalDomain:
          isCareerSwitcher
            ? form.targetFunctionalDomain
            : null,

        currentCountry:
          form.currentCountry,

        currentCity:
          form.currentCity,

        preferredWorkArrangement:
          form.preferredWorkArrangement,

        preferredWorkLocation:
          form.preferredWorkLocation,

        preferredCountry:
          wantsSpecificCountry
            ? form.preferredCountry
            : null,

        preferredLocationText:
          wantsSpecificCity
            ? form.preferredLocationText
            : null,

        willingToRelocate:
          form.willingToRelocate,

        employmentStatus:
          form.employmentStatus,
      };

      if (isEmployed) {
        Object.assign(payload, {
          currentJobTitle:
            form.currentJobTitle ||
            null,

          employmentType:
            form.employmentType,

          currentBaseSalary:
            form.currentBaseSalary,

          currentCurrency:
            form.currentCurrency,

          payFrequency:
            form.payFrequency,

          currentBenefits:
            form.currentBenefits,

          currentWorkArrangement:
            form.currentWorkArrangement,

          workingHoursPerWeek:
            form.workingHoursPerWeek,

          averageDailyCommuteMinutes:
            showCommute
              ? form.averageDailyCommuteMinutes
              : null,

          overallJobSatisfaction:
            form.overallJobSatisfaction,

          careerGrowthSatisfaction:
            form.careerGrowthSatisfaction,

          workLifeBalanceSatisfaction:
            form.workLifeBalanceSatisfaction,
        });
      }

      await api.saveCandidateProfile(
        payload,
      );

      if (consentToggles.length > 0) {
        await api.updateConsent({
          shareAnonymous,
          selections,
        });
      }

      void saveNow(form);

      const nextHref = (target ?? getScreen('SCR-002')).href;
      router.push(
        startingNewSession
          ? `${nextHref}?session=new`
          : nextHref,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not save your profile.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading your profile…
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
        router.push('/offerguide')
      }
      onNext={handleNext}
      isSubmitting={submitting}
    >
      {/* ======================================================
          CR-05 — HOW TO EVALUATE (before any question is asked)
      ====================================================== */}

      <CompareModePicker
        mode={compareMode}
        onChange={setCompareMode}
      />

      {/* ======================================================
          SECTION 1 — PERSONAL CAREER PROFILE
      ====================================================== */}

      <FieldSection
        index={1}
        title={C.sections.personal}
        meta="3 sub-sections"
      >
        <FieldSubSection
          title={
            C.subSections.professional
          }
          columns={3}
        >

        <Field
          label={C.labels.careerStage}
          required
          helpText={
            C.helpText.careerStage
          }
        >
          <RadioCards
            name={C.labels.careerStage}
            options={CAREER_STAGES}
            value={form.careerStage}
            onChange={(v) =>
              set('careerStage', v)
            }
            otherText={
              form.careerStageOtherText
            }
            onOtherTextChange={(t) =>
              set(
                'careerStageOtherText',
                t,
              )
            }
            otherMaxLength={
              SCR001_LIMITS
                .careerStageOtherTextMax
            }
          />

          {showErrors &&
            missingCareerStage && (
              <p className="mt-1.5 text-xs text-destructive">
                Select your career stage
                to continue.
              </p>
            )}

          {showErrors &&
            careerStageOtherMissing && (
              <p className="mt-1.5 text-xs text-destructive">
                Please specify your career
                stage.
              </p>
            )}
        </Field>

        <Field
          label={C.labels.careerSwitcher}
          helpText={
            C.helpText.careerSwitcher
          }
        >
          <RadioCards
            name={
              C.labels.careerSwitcher
            }
            options={YES_NO}
            value={form.careerSwitcher}
            onChange={(v) =>
              set(
                'careerSwitcher',
                v,
              )
            }
          />
        </Field>

        <Field
          label={
            C.labels
              .targetFunctionalDomain
          }
          helpText={
            C.helpText
              .targetFunctionalDomain
          }
          conditional={{
            pill: 'if career switcher',
            active: isCareerSwitcher,
          }}
        >
          <Combobox
            options={functionalDomains}
            value={
              form.targetFunctionalDomain
            }
            onChange={(v) =>
              set(
                'targetFunctionalDomain',
                v,
              )
            }
            onBlur={onBlur}
            disabled={!isCareerSwitcher}
            placeholder="Select a domain"
          />
        </Field>

        </FieldSubSection>

        <FieldSubSection
          title={
            C.subSections.location
          }
        >

        <Field
          label={
            C.labels.currentCountry
          }
          helpText={
            C.helpText.currentCountry
          }
        >
          <Combobox
            options={countries}
            value={form.currentCountry}
            onChange={(v) => {
              set('currentCountry', v);
              set('currentCity', null);
            }}
            onBlur={onBlur}
            loading={loadingCountries}
            placeholder="Select a country"
          />
        </Field>

        <Field
          label={
            C.labels.currentCity
          }
          helpText={
            C.helpText.currentCity
          }
        >
          {/* allowCustom: the seeded list is major cities only, and the column
              is free text — a candidate from a smaller town types their own. */}
          <Combobox
            options={cities}
            value={form.currentCity}
            onChange={(v) =>
              set('currentCity', v)
            }
            onBlur={onBlur}
            allowCustom
            disabled={
              !form.currentCountry
            }
            placeholder={
              form.currentCountry
                ? 'Select or type a city'
                : 'Select a country first'
            }
          />
        </Field>

        </FieldSubSection>

        <FieldSubSection
          title={
            C.subSections.preferences
          }
        >

        <Field
          label={
            C.labels
              .preferredWorkArrangement
          }
          required
          helpText={
            C.helpText
              .preferredWorkArrangement
          }
        >
          <RadioCards
            name={
              C.labels
                .preferredWorkArrangement
            }
            options={
              PREFERRED_WORK_ARRANGEMENTS
            }
            value={
              form.preferredWorkArrangement
            }
            onChange={(v) =>
              set(
                'preferredWorkArrangement',
                v,
              )
            }
          />

          {showErrors &&
            missingArrangement && (
              <p className="mt-1.5 text-xs text-destructive">
                Select your preferred work
                arrangement to continue.
              </p>
            )}
        </Field>

        <Field
          label={
            C.labels
              .preferredWorkLocation
          }
          helpText={
            C.helpText
              .preferredWorkLocation
          }
        >
          <Select
            options={
              PREFERRED_WORK_LOCATIONS
            }
            value={
              form.preferredWorkLocation
            }
            onChange={(v) =>
              set(
                'preferredWorkLocation',
                v,
              )
            }
            onBlur={onBlur}
            placeholder="Select a preference"
          />
        </Field>

        <Field
          label={
            C.labels.preferredCountry
          }
          helpText={
            C.helpText.preferredCountry
          }
          conditional={{
            pill:
              'if specific country or city',
            active:
              wantsSpecificCountry,
          }}
        >
          <Combobox
            options={countries}
            value={
              form.preferredCountry
            }
            onChange={(v) =>
              set(
                'preferredCountry',
                v,
              )
            }
            onBlur={onBlur}
            disabled={
              !wantsSpecificCountry
            }
            placeholder="Select a country"
          />
        </Field>

        <Field
          label={
            C.labels
              .preferredLocationText
          }
          helpText={
            C.helpText
              .preferredLocationText
          }
          conditional={{
            pill: 'if specific city',
            active:
              wantsSpecificCity,
          }}
        >
          <TextInput
            value={
              form.preferredLocationText
            }
            onChange={(v) =>
              set(
                'preferredLocationText',
                v,
              )
            }
            onBlur={onBlur}
            maxLength={
              SCR001_LIMITS
                .preferredLocationTextMax
            }
            disabled={
              !wantsSpecificCity
            }
            placeholder="e.g. Lahore"
          />
        </Field>

        <Field
          label={
            C.labels.willingToRelocate
          }
          helpText={
            C.helpText
              .willingToRelocate
          }
        >
          <RadioCards
            name={
              C.labels
                .willingToRelocate
            }
            options={
              WILLING_TO_RELOCATE
            }
            value={
              form.willingToRelocate
            }
            onChange={(v) =>
              set(
                'willingToRelocate',
                v,
              )
            }
          />
        </Field>

        </FieldSubSection>
      </FieldSection>

      {/* ======================================================
          SECTION 2 — CURRENT EMPLOYMENT
      ====================================================== */}

      <FieldSection
        index={2}
        title={C.sections.employment}
        meta={
          isEmployed
            ? '5 sub-sections'
            : undefined
        }
      >
        <FieldSubSection
          title={
            C.subSections
              .employmentInfo
          }
        >

        <Field
          label={
            C.labels.employmentStatus
          }
          helpText={
            C.helpText
              .employmentStatus
          }
        >
          <Select
            options={
              EMPLOYMENT_STATUSES
            }
            value={
              form.employmentStatus
            }
            onChange={(v) =>
              set(
                'employmentStatus',
                v,
              )
            }
            onBlur={onBlur}
          />
        </Field>

        {isEmployed && (
          <>
            <Field
              label={
                C.labels.currentJobTitle
              }
              helpText={
                C.helpText
                  .currentJobTitle
              }
            >
              <TextInput
                value={
                  form.currentJobTitle
                }
                onChange={(v) =>
                  set(
                    'currentJobTitle',
                    v,
                  )
                }
                onBlur={onBlur}
                maxLength={
                  SCR001_LIMITS
                    .currentJobTitleMax
                }
                placeholder="Job title"
              />
            </Field>

            <Field
              label={
                C.labels.employmentType
              }
              helpText={
                C.helpText
                  .employmentType
              }
            >
              <Select
                options={
                  EMPLOYMENT_TYPES
                }
                value={
                  form.employmentType
                }
                onChange={(v) =>
                  set(
                    'employmentType',
                    v,
                  )
                }
                onBlur={onBlur}
              />
            </Field>
          </>
        )}

        {!isEmployed && (
          <p className="text-sm text-muted-foreground sm:col-span-2">
            The rest of this section only
            applies to candidates who are
            currently working, so we&apos;ve
            left it out. Nothing here is
            required.
          </p>
        )}

        </FieldSubSection>

        {isEmployed && (
          <>
            <FieldSubSection
              title={
                C.subSections
                  .compensation
              }
            >

            <Field
              label={
                C.labels
                  .currentBaseSalary
              }
              helpText={
                C.helpText
                  .currentBaseSalary
              }
            >
              <PairedRow
                primary={
                  <NumericInput
                    value={
                      form.currentBaseSalary
                    }
                    onChange={(v) =>
                      set(
                        'currentBaseSalary',
                        v,
                      )
                    }
                    onBlur={onBlur}
                    min={1}
                    allowDecimal
                    placeholder="Enter amount"
                  />
                }
                secondary={
                  <Select
                    options={
                      PAY_FREQUENCIES
                    }
                    value={
                      form.payFrequency
                    }
                    onChange={(v) =>
                      set(
                        'payFrequency',
                        v,
                      )
                    }
                    onBlur={onBlur}
                  />
                }
                secondaryWidth="w-32"
              />
            </Field>

            <Field
              label={
                C.labels.currentCurrency
              }
              helpText={
                C.helpText
                  .currentCurrency
              }
            >
              <Combobox
                options={
                  CURRENCY_OPTIONS
                }
                value={
                  form.currentCurrency
                }
                onChange={(v) =>
                  set(
                    'currentCurrency',
                    v,
                  )
                }
                onBlur={onBlur}
                placeholder="Select a currency"
              />
            </Field>

            </FieldSubSection>

            <FieldSubSection
              title={
                C.subSections.benefits
              }
            >

            <Field
              label={
                C.labels.currentBenefits
              }
              helpText={
                C.helpText
                  .currentBenefits
              }
              fullWidth
            >
              <Chips
                name={
                  C.labels
                    .currentBenefits
                }
                options={
                  CURRENT_BENEFITS
                }
                value={
                  form.currentBenefits
                }
                onChange={(v) =>
                  set(
                    'currentBenefits',
                    v,
                  )
                }
              />
            </Field>

            </FieldSubSection>

            <FieldSubSection
              title={
                C.subSections
                  .workingConditions
              }
              columns={3}
            >

            <Field
              label={
                C.labels
                  .currentWorkArrangement
              }
              helpText={
                C.helpText
                  .currentWorkArrangement
              }
            >
              <RadioCards
                name={
                  C.labels
                    .currentWorkArrangement
                }
                options={
                  CURRENT_WORK_ARRANGEMENTS
                }
                value={
                  form.currentWorkArrangement
                }
                onChange={(v) =>
                  set(
                    'currentWorkArrangement',
                    v,
                  )
                }
              />
            </Field>

            <Field
              label={
                C.labels
                  .workingHoursPerWeek
              }
              helpText={
                C.helpText
                  .workingHoursPerWeek
              }
            >
              <NumericInput
                value={
                  form.workingHoursPerWeek
                }
                onChange={(v) =>
                  set(
                    'workingHoursPerWeek',
                    v,
                  )
                }
                onBlur={onBlur}
                unit="hrs / week"
                min={
                  SCR001_LIMITS
                    .workingHoursMin
                }
                max={
                  SCR001_LIMITS
                    .workingHoursMax
                }
              />
            </Field>

            {showCommute && (
              <Field
                label={
                  C.labels
                    .averageDailyCommuteMinutes
                }
                helpText={
                  C.helpText
                    .averageDailyCommuteMinutes
                }
              >
                <NumericInput
                  value={
                    form.averageDailyCommuteMinutes
                  }
                  onChange={(v) =>
                    set(
                      'averageDailyCommuteMinutes',
                      v,
                    )
                  }
                  onBlur={onBlur}
                  unit="min / day"
                  min={
                    SCR001_LIMITS
                      .commuteMinutesMin
                  }
                  max={
                    SCR001_LIMITS
                      .commuteMinutesMax
                  }
                />
              </Field>
            )}

            </FieldSubSection>

            <FieldSubSection
              title={
                C.subSections
                  .satisfaction
              }
              columns={3}
            >

            <Field
              label={
                C.labels
                  .overallJobSatisfaction
              }
              helpText={
                C.helpText
                  .overallJobSatisfaction
              }
            >
              <RatingCards
                name={
                  C.labels
                    .overallJobSatisfaction
                }
                value={
                  form.overallJobSatisfaction
                }
                onChange={(v) =>
                  set(
                    'overallJobSatisfaction',
                    v,
                  )
                }
                lowAnchor={
                  SATISFACTION_ANCHORS.low
                }
                highAnchor={
                  SATISFACTION_ANCHORS.high
                }
              />
            </Field>

            <Field
              label={
                C.labels
                  .careerGrowthSatisfaction
              }
              helpText={
                C.helpText
                  .careerGrowthSatisfaction
              }
            >
              <RatingCards
                name={
                  C.labels
                    .careerGrowthSatisfaction
                }
                value={
                  form.careerGrowthSatisfaction
                }
                onChange={(v) =>
                  set(
                    'careerGrowthSatisfaction',
                    v,
                  )
                }
                lowAnchor={
                  SATISFACTION_ANCHORS.low
                }
                highAnchor={
                  SATISFACTION_ANCHORS.high
                }
                showAnchors={false}
              />
            </Field>

            <Field
              label={
                C.labels
                  .workLifeBalanceSatisfaction
              }
              helpText={
                C.helpText
                  .workLifeBalanceSatisfaction
              }
            >
              <RatingCards
                name={
                  C.labels
                    .workLifeBalanceSatisfaction
                }
                value={
                  form.workLifeBalanceSatisfaction
                }
                onChange={(v) =>
                  set(
                    'workLifeBalanceSatisfaction',
                    v,
                  )
                }
                lowAnchor={
                  SATISFACTION_ANCHORS.low
                }
                highAnchor={
                  SATISFACTION_ANCHORS.high
                }
                showAnchors={false}
              />
            </Field>

            </FieldSubSection>
          </>
        )}
      </FieldSection>

      <ConsentCard
        toggles={consentToggles}
        shareAnonymous={
          shareAnonymous
        }
        selections={selections}
        onShareAnonymousChange={
          setShareAnonymous
        }
        onSelectionChange={(
          id,
          value,
        ) =>
          setSelections((prev) => ({
            ...prev,
            [id]: value,
          }))
        }
      />
    </WizardShell>
  );
}