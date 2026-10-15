'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '../_components/AppShell';
import { Action, CheckboxRow, Field, PageHeading, SelectInput, TextInput } from '../_components/ui';
import { CAREER_STAGES, type CareerStage } from '../_lib/dimensions';
import { CITY_SUGGESTIONS } from '../_lib/sample';
import { useCv3d } from '../_lib/store';

/**
 * Screen 2 — Signup / Account Creation.
 *
 * Prototype: the account is held in local state only. The password is validated
 * but never stored anywhere — it has nowhere safe to go until this is wired to the
 * portal's real auth. Google / LinkedIn / OTP buttons explain that instead of
 * pretending to sign in.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Partial<Record<'fullName' | 'email' | 'mobile' | 'password' | 'city' | 'careerStage' | 'consent', string>>;

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const thenUpload = params.get('then') === 'upload';
  const { createAccount, chooseStart } = useCv3d();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [careerStage, setCareerStage] = useState<CareerStage | ''>('');
  const [consent, setConsent] = useState(false);
  const [wantsMentor, setWantsMentor] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  function validate(): Errors {
    const e: Errors = {};
    if (!fullName.trim()) e.fullName = 'Please enter your full name.';
    if (!EMAIL_RE.test(email.trim())) e.email = 'Please enter a valid email address.';
    const digits = mobile.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) e.mobile = 'Please enter a valid mobile number.';
    if (password.length < 8) e.password = 'Use at least 8 characters.';
    if (!city.trim()) e.city = 'Please enter your city.';
    if (!careerStage) e.careerStage = 'Please choose your career stage.';
    if (!consent) e.consent = 'Please agree so we can store your profile and create your CVs.';
    return e;
  }

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      document.getElementById(`su-${first}`)?.focus();
      return;
    }
    createAccount({
      fullName: fullName.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      city: city.trim(),
      careerStage,
      signupMethod: 'email',
      wantsMentor,
    });
    toast.success('Account created. Your free plan includes 3 CV versions.');
    if (thenUpload) {
      chooseStart('upload');
      router.push('/3d-cv/upload');
    } else {
      router.push('/3d-cv/start');
    }
  }

  function notYet(provider: string) {
    toast(`${provider} sign-up will be connected to the Sanjeeda portal login in the next phase. Please use the form below for now.`, {
      icon: 'ℹ️',
    });
  }

  const err = (k: keyof Errors) => (errors[k] ? { 'aria-invalid': true, 'aria-describedby': `su-${k}-error` } : {});

  return (
    <AppShell>
      <PageHeading
        title={
          <>
            Create Your
            <br />
            3D CV Profile
          </>
        }
        subtitle="Sign up once to build your verified profile and generate job-specific CVs."
      />

      <div className="space-y-2.5">
        <SocialButton onClick={() => notYet('Google')} icon={<span className="text-base font-bold text-[#EA4335]">G</span>}>
          Continue with Google
        </SocialButton>
        <SocialButton onClick={() => notYet('LinkedIn')} icon={<span className="text-base font-bold text-[#0A66C2] dark:text-[#5aa7f0]">in</span>}>
          Continue with LinkedIn
        </SocialButton>
        <SocialButton onClick={() => notYet('Mobile OTP')} icon={<Smartphone className="h-5 w-5" aria-hidden />}>
          Continue with Mobile (OTP)
        </SocialButton>
        <SocialButton
          onClick={() => document.getElementById('su-fullName')?.focus()}
          icon={<Mail className="h-5 w-5" aria-hidden />}
        >
          Continue with Email
        </SocialButton>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or sign up with email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field id="su-fullName" label="Full Name" required error={errors.fullName}>
          <TextInput id="su-fullName" autoComplete="name" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} {...err('fullName')} />
        </Field>
        <Field id="su-email" label="Email Address" required error={errors.email}>
          <TextInput id="su-email" type="email" autoComplete="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} {...err('email')} />
        </Field>
        <Field id="su-mobile" label="Mobile Number" required error={errors.mobile}>
          <TextInput id="su-mobile" type="tel" autoComplete="tel" placeholder="e.g. +92 300 1234567" value={mobile} onChange={(e) => setMobile(e.target.value)} {...err('mobile')} />
        </Field>
        <Field id="su-password" label="Password" required error={errors.password}>
          <TextInput id="su-password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} {...err('password')} />
        </Field>
        <Field id="su-city" label="City" required error={errors.city}>
          <TextInput id="su-city" list="su-city-list" autoComplete="address-level2" placeholder="Enter your city" value={city} onChange={(e) => setCity(e.target.value)} {...err('city')} />
          <datalist id="su-city-list">
            {CITY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field id="su-careerStage" label="Career Stage" required error={errors.careerStage}>
          <SelectInput id="su-careerStage" value={careerStage} onChange={(e) => setCareerStage(e.target.value as CareerStage | '')} {...err('careerStage')}>
            <option value="">Select your career stage</option>
            {CAREER_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </SelectInput>
        </Field>

        <div className="space-y-3 pt-1">
          <CheckboxRow id="su-consent" checked={consent} onChange={setConsent} invalid={!!errors.consent}>
            I agree that Sanjeeda may store my profile information, uploaded documents, generated CVs and readiness
            reports to help me create job-specific CVs, access mentor support and use related career services.
          </CheckboxRow>
          {errors.consent && (
            <p id="su-consent-error" className="pl-8 text-xs font-medium text-rose-600 dark:text-rose-300">
              {errors.consent}
            </p>
          )}
          <CheckboxRow id="su-mentor" checked={wantsMentor} onChange={setWantsMentor}>
            I may need mentor support to improve my profile.
          </CheckboxRow>
        </div>

        <p className="rounded-xl bg-[hsl(var(--cv-primary-soft))] p-3 text-xs text-[hsl(var(--cv-primary-ink))]">
          Your free account includes 3 CV versions. Free CV versions expire after 3 weeks unless upgraded.
        </p>

        <Action look="cta" type="submit">
          Create My Account
        </Action>
      </form>

      <p className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <Link href="/auth" className="font-semibold text-[hsl(var(--cv-primary-ink))] hover:underline">
          Login
        </Link>
      </p>
    </AppShell>
  );
}

function SocialButton({
  icon,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:border-[hsl(var(--cv-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--cv-primary))]"
    >
      <span className="flex w-6 justify-center">{icon}</span>
      {children}
    </button>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
