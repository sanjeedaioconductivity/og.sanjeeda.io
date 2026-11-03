'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/portal/AuthProvider';
import { storePortalToken } from '@/lib/portal/session';
import AppShell from '../_components/AppShell';
import GoogleSignupButton from '../_components/GoogleSignupButton';
import { Action, CheckboxRow, Field, SelectInput, TextInput } from '../_components/ui';
import { CAREER_STAGES, type CareerStage } from '../_lib/dimensions';
import { CITY_SUGGESTIONS } from '../_lib/sample';
import { useCv3d } from '../_lib/store';

/**
 * Screen 2 — Signup / Account Creation. Two ways in: Google or email.
 *
 * Google signs in through the portal's real auth: our full-width button opens
 * Google's popup and POST /api/auth { action: "google-token" } verifies the token
 * server-side, so the candidate gets a portal session plus a verified name and email. The rest of the form is still
 * required: Google doesn't give us city or career stage, and consent must be
 * explicit.
 *
 * Email sign-up is still prototype-only: the 3D CV account lives in local state
 * and the password is validated but never stored.
 *
 * LinkedIn and mobile-OTP sign-in were removed from this page on request. Their
 * server routes (/api/auth/linkedin, /api/auth/otp) remain, inactive until keys
 * are set — see lib/portal/linkedin.ts and lib/portal/otp.ts to bring them back.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Partial<Record<'fullName' | 'email' | 'mobile' | 'password' | 'city' | 'careerStage' | 'consent', string>>;

/**
 * Reads the query string after mount rather than with useSearchParams: that hook
 * forces a <Suspense> boundary whose streamed copy of this page stays in the DOM
 * (hidden), duplicating every field id and the Google button.
 */
export default function SignupPage() {
  const router = useRouter();
  const [thenUpload, setThenUpload] = useState(false);
  const { createAccount, chooseStart } = useCv3d();
  const { refresh } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [careerStage, setCareerStage] = useState<CareerStage | ''>('');
  const [consent, setConsent] = useState(false);
  const [wantsMentor, setWantsMentor] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  /** Set once Google sign-in succeeds; its name and email fill the form. */
  const [signedIn, setSignedIn] = useState<{ name: string; email: string } | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);

  // The "Upload Existing CV" shortcut arrives as ?then=upload. The URL is only
  // readable after mount.
  useEffect(() => {
    setThenUpload(new URLSearchParams(window.location.search).get('then') === 'upload');
  }, []);

  function validate(): Errors {
    const e: Errors = {};
    if (!fullName.trim()) e.fullName = 'Please enter your full name.';
    if (!EMAIL_RE.test(email.trim())) e.email = 'Please enter a valid email address.';
    const digits = mobile.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) e.mobile = 'Please enter a valid mobile number.';
    if (!signedIn && password.length < 8) e.password = 'Use at least 8 characters.';
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
      signupMethod: signedIn ? 'google' : 'email',
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

  async function onGoogle(accessToken: string) {
    setGoogleBusy(true);
    try {
      const { data } = await axios.post<{ token?: string; email?: string; message?: string; user?: { name?: string; email?: string } }>(
        '/api/auth',
        { action: 'google-token', accessToken },
      );
      if (!data.token) throw new Error(data.message);
      storePortalToken(data.token);
      await refresh();
      const name = data.user?.name ?? '';
      const mail = data.email ?? data.user?.email ?? '';
      setSignedIn({ name, email: mail });
      setFullName((n) => n || name);
      setEmail(mail);
      setErrors((e) => ({ ...e, fullName: undefined, email: undefined, password: undefined }));
      toast.success('Signed in with Google. Add a few details to finish your profile.');
      setTimeout(() => document.getElementById('su-mobile')?.focus(), 50);
    } catch {
      onGoogleError();
    } finally {
      setGoogleBusy(false);
    }
  }

  function onGoogleError() {
    toast.error('Google sign-in did not complete. Please try again or sign up with email.');
  }

  const err = (k: keyof Errors) => (errors[k] ? { 'aria-invalid': true, 'aria-describedby': `su-${k}-error` } : {});

  return (
    <AppShell>
      {/* Sanjeeda brand on this page: the 3D CV purple tokens are re-pointed to
          the site's brand blue (#1746b5 / #8eb4ff in dark), so every shared field,
          checkbox and focus ring follows without touching the components. */}
      <div
        className={[
          '[--cv-primary:222_77%_40%] [--cv-primary-ink:222_77%_40%] [--cv-primary-soft:224_100%_96%]',
          'dark:[--cv-primary:222_70%_55%] dark:[--cv-primary-ink:220_100%_78%] dark:[--cv-primary-soft:222_40%_26%]',
          'mx-auto max-w-sm',
        ].join(' ')}
      >
        <section className="py-2" aria-labelledby="su-heading">
          <h1 id="su-heading" className="text-xl font-bold tracking-tight text-brand-ink dark:text-white">
            Create your account
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Start your 3D CV profile. It takes about two minutes.
          </p>

          <div className="mt-4">
            {signedIn ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                <span>
                  Signed in with Google as <span className="font-semibold">{signedIn.email}</span>
                </span>
              </div>
            ) : (
              <GoogleSignupButton onToken={onGoogle} onError={onGoogleError} busy={googleBusy} />
            )}
          </div>

          <div className="my-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {signedIn ? 'Finish your profile' : 'Or sign up with email'}
            <span className="h-px flex-1 bg-border" />
          </div>

          <form
            onSubmit={onSubmit}
            noValidate
            // Compact: smaller labels/inputs and tighter rows, set here so the shared
            // field components stay unchanged for the other 3D CV screens.
            className="grid gap-3 [&_input:not([type=checkbox])]:py-2 [&_input:not([type=checkbox])]:text-[13px] [&_input[type=checkbox]]:h-4 [&_input[type=checkbox]]:w-4 [&_label]:text-xs [&_select]:py-2 [&_select]:text-[13px]"
          >
            <Field id="su-fullName" label="Full Name" required error={errors.fullName}>
              <TextInput id="su-fullName" autoComplete="name" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} {...err('fullName')} />
            </Field>
            <Field id="su-email" label="Email Address" required error={errors.email}>
              <TextInput
                id="su-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                readOnly={!!signedIn}
                onChange={(e) => setEmail(e.target.value)}
                className={signedIn ? 'bg-muted' : undefined}
                {...err('email')}
              />
            </Field>
            <Field id="su-mobile" label="Mobile Number" required error={errors.mobile}>
              <TextInput id="su-mobile" type="tel" autoComplete="tel" placeholder="+92 300 1234567" value={mobile} onChange={(e) => setMobile(e.target.value)} {...err('mobile')} />
            </Field>
            {!signedIn && (
              <Field id="su-password" label="Password" required error={errors.password}>
                <TextInput id="su-password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} {...err('password')} />
              </Field>
            )}
            <Field id="su-city" label="City" required error={errors.city}>
              <TextInput id="su-city" list="su-city-list" autoComplete="address-level2" placeholder="e.g. Karachi, Pakistan" value={city} onChange={(e) => setCity(e.target.value)} {...err('city')} />
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

            <div className="space-y-2 pt-0.5">
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

            <div>
              <Action look="cta" type="submit" className="py-2.5 text-sm">
                Create My Account
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Action>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link href="/auth" className="font-semibold text-brand-blue hover:underline dark:text-brand-blue-bright">
                  Log in
                </Link>
              </p>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
