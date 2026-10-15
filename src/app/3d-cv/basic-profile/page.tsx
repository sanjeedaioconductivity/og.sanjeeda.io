'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '../_components/AppShell';
import { Action, Field, PageHeading, SelectInput, TextInput } from '../_components/ui';
import { CAREER_STAGES, type CareerStage } from '../_lib/dimensions';
import { CITY_SUGGESTIONS, JOB_FAMILIES, suggestTitle } from '../_lib/sample';
import { useCv3d, type BasicProfile } from '../_lib/store';

/**
 * Screen 6 — Basic Profile Details. Confirms identity, contact details, career
 * stage and target job families.
 *
 * Concept §6 lists what must NOT be collected here (national ID, date of birth,
 * gender, marital status, religion, father's name). Do not add those fields.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Form = Omit<BasicProfile, 'confirmed'>;
type Errors = Partial<Record<keyof Form, string>>;

export default function BasicProfilePage() {
  const { state, hydrated } = useCv3d();
  if (!hydrated) return <AppShell>{null}</AppShell>;
  // Mount the form only once saved state is loaded, so its initial values are right.
  return <BasicProfileForm initial={state.basic} />;
}

function BasicProfileForm({ initial }: { initial: BasicProfile }) {
  const router = useRouter();
  const { saveBasic } = useCv3d();
  const [form, setForm] = useState<Form>(() => {
    const { confirmed, ...start } = initial;
    void confirmed;
    return start;
  });
  const [errors, setErrors] = useState<Errors>({});

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function validate(): Errors {
    const e: Errors = {};
    if (!form.fullName.trim()) e.fullName = 'Please enter your full name.';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Please enter a valid email address.';
    const digits = form.mobile.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) e.mobile = 'Please enter a valid mobile number.';
    if (!form.city.trim()) e.city = 'Please enter your city or location.';
    if (!form.careerStage) e.careerStage = 'Please choose your career stage.';
    if (form.jobFamilies.length === 0) e.jobFamilies = 'Choose at least one target job family.';
    return e;
  }

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      document.getElementById(`bp-${first}`)?.focus();
      return;
    }
    saveBasic({
      ...form,
      fullName: form.fullName.trim(),
      title: form.title.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      city: form.city.trim(),
      linkedin: form.linkedin.trim(),
      portfolio: form.portfolio.trim(),
      preferredLocation: form.preferredLocation.trim(),
    });
    toast.success('Basic profile saved.');
    router.push('/3d-cv/dashboard');
  }

  const err = (k: keyof Form) => (errors[k] ? { 'aria-invalid': true, 'aria-describedby': `bp-${k}-error` } : {});
  const remaining = JOB_FAMILIES.filter((j) => !form.jobFamilies.includes(j));

  return (
    <AppShell>
      <PageHeading
        title={
          <>
            Confirm Your
            <br />
            Basic Profile
          </>
        }
        subtitle="This information will appear on your CV and help us personalize your job-specific applications."
      />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field id="bp-fullName" label="Full Name" required error={errors.fullName}>
          <TextInput id="bp-fullName" autoComplete="name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} {...err('fullName')} />
        </Field>

        <Field id="bp-title" label="Professional Title">
          <div className="relative">
            <TextInput
              id="bp-title"
              className="pr-28"
              placeholder="e.g. IT Support Associate"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                const t = suggestTitle(form.careerStage, form.jobFamilies);
                if (!t) {
                  toast('Choose your career stage or a job family first, then try again.', { icon: 'ℹ️' });
                  return;
                }
                set('title', t);
              }}
              className="absolute right-1.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full bg-[hsl(var(--cv-primary-soft))] px-2.5 py-1 text-xs font-semibold text-[hsl(var(--cv-primary-ink))] hover:brightness-95"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              AI Suggest
            </button>
          </div>
        </Field>

        <Field id="bp-email" label="Email Address" required error={errors.email}>
          <TextInput id="bp-email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} {...err('email')} />
        </Field>
        <Field id="bp-mobile" label="Mobile Number" required error={errors.mobile}>
          <TextInput id="bp-mobile" type="tel" autoComplete="tel" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} {...err('mobile')} />
        </Field>
        <Field id="bp-city" label="City / Location" required error={errors.city}>
          <TextInput id="bp-city" list="bp-city-list" value={form.city} onChange={(e) => set('city', e.target.value)} {...err('city')} />
        </Field>
        <Field id="bp-linkedin" label="LinkedIn Profile" optional>
          <TextInput id="bp-linkedin" placeholder="linkedin.com/in/your-name" value={form.linkedin} onChange={(e) => set('linkedin', e.target.value)} />
        </Field>
        <Field id="bp-portfolio" label="Portfolio / Website / GitHub" optional>
          <TextInput id="bp-portfolio" placeholder="github.com/your-name" value={form.portfolio} onChange={(e) => set('portfolio', e.target.value)} />
        </Field>
        <Field id="bp-careerStage" label="Career Stage" required error={errors.careerStage}>
          <SelectInput id="bp-careerStage" value={form.careerStage} onChange={(e) => set('careerStage', e.target.value as CareerStage | '')} {...err('careerStage')}>
            <option value="">Select your career stage</option>
            {CAREER_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field id="bp-jobFamilies" label="Target Job Family (select all that apply)" required error={errors.jobFamilies}>
          {form.jobFamilies.length > 0 && (
            <ul className="flex flex-wrap gap-2 pb-1">
              {form.jobFamilies.map((j) => (
                <li key={j}>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--cv-primary-soft))] py-1 pl-3 pr-1.5 text-xs font-semibold text-[hsl(var(--cv-primary-ink))]">
                    {j}
                    <button
                      type="button"
                      onClick={() => set('jobFamilies', form.jobFamilies.filter((x) => x !== j))}
                      aria-label={`Remove ${j}`}
                      className="rounded-full p-0.5 hover:bg-[hsl(var(--cv-primary)/0.15)]"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <SelectInput
            id="bp-jobFamilies"
            value=""
            onChange={(e) => e.target.value && set('jobFamilies', [...form.jobFamilies, e.target.value])}
            disabled={remaining.length === 0}
            {...err('jobFamilies')}
          >
            <option value="">+ Add a job family</option>
            {remaining.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field id="bp-preferredLocation" label="Preferred Job Location" optional>
          <TextInput id="bp-preferredLocation" list="bp-city-list" value={form.preferredLocation} onChange={(e) => set('preferredLocation', e.target.value)} />
        </Field>
        <datalist id="bp-city-list">
          {CITY_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <div className="flex items-start gap-3 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
          <Heart className="h-4 w-4 shrink-0 text-[hsl(var(--cv-primary-ink))]" aria-hidden />
          You can edit this information anytime before generating a CV.
        </div>

        <Action look="cta" type="submit">
          Save and Continue
        </Action>
      </form>
    </AppShell>
  );
}
