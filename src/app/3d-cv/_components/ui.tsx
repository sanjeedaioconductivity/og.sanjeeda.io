'use client';

import Link from 'next/link';
import { forwardRef } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DimensionStatus } from '../_lib/dimensions';

/* ---------------------------------------------------------------------------
   Buttons. Three looks from the mockups:
     cta      Sanjeeda red, the screen's main forward step ("Save and Continue")
     primary  purple, the main action where red would mean "continue"
     outline  purple outline, secondary actions
   Pass `href` to render a link, otherwise a <button>.
   --------------------------------------------------------------------------- */

type Look = 'cta' | 'primary' | 'outline' | 'neutral';

const LOOKS: Record<Look, string> = {
  cta: 'bg-[hsl(var(--cv-cta))] text-white hover:brightness-110',
  primary: 'bg-[hsl(var(--cv-primary))] text-white hover:brightness-110',
  outline:
    'border border-[hsl(var(--cv-primary))] text-[hsl(var(--cv-primary-ink))] bg-card hover:bg-[hsl(var(--cv-primary-soft))]',
  neutral: 'border border-border bg-card text-foreground hover:bg-muted',
};

const BASE =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--cv-primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100';

interface ActionProps {
  look?: Look;
  href?: string;
  className?: string;
  children: React.ReactNode;
}

export function Action({
  look = 'primary',
  href,
  className,
  children,
  ...rest
}: ActionProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = cn(BASE, LOOKS[look], className);
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------------------
   Badges
   --------------------------------------------------------------------------- */

const STATUS: Record<DimensionStatus, { label: string; cls: string }> = {
  good: {
    label: 'Good',
    cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  review: {
    label: 'Needs Review',
    cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  missing: {
    label: 'Missing',
    cls: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  },
};

export function StatusBadge({ status }: { status: DimensionStatus }) {
  const s = STATUS[status];
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', s.cls)}>
      {s.label}
    </span>
  );
}

/**
 * The seven verification labels from concept §8. User-facing wording stays soft:
 * there is no "Unverified" — an entry with no proof is "Candidate-Stated".
 */
export type Verification =
  | 'candidate-stated'
  | 'evidence-uploaded'
  | 'pending'
  | 'sanjeeda-verified'
  | 'project-proven'
  | 'test-verified'
  | 'employer-verified';

const VERIFICATION: Record<Verification, { label: string; cls: string }> = {
  'candidate-stated': {
    label: 'Candidate-Stated',
    cls: 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  },
  'evidence-uploaded': {
    label: 'Evidence Uploaded',
    cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  pending: {
    label: 'Verification Pending',
    cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  'sanjeeda-verified': {
    label: 'Sanjeeda Verified',
    cls: 'bg-[hsl(var(--cv-primary-soft))] text-[hsl(var(--cv-primary-ink))]',
  },
  'project-proven': {
    label: 'Project-Proven',
    cls: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  },
  'test-verified': {
    label: 'Test-Verified',
    cls: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  },
  'employer-verified': {
    label: 'Employer / Institution Verified',
    cls: 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  },
};

export function VerificationBadge({ status }: { status: Verification }) {
  const v = VERIFICATION[status];
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', v.cls)}>
      {v.label}
    </span>
  );
}

/* ---------------------------------------------------------------------------
   Notices
   --------------------------------------------------------------------------- */

export function SafeNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
        <CheckCircle2 className="h-5 w-5" aria-hidden />
      </span>
      <p className="pt-1.5 text-sm">{children}</p>
    </div>
  );
}

export function WarningNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-300" aria-hidden />
      <p className="text-sm">{children}</p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Page heading — the two-line bold title + muted subtitle every screen opens with
   --------------------------------------------------------------------------- */

export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{title}</h1>
        {action}
      </div>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
    </header>
  );
}

/* ---------------------------------------------------------------------------
   Form fields
   --------------------------------------------------------------------------- */

const INPUT =
  'w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/80 focus:border-[hsl(var(--cv-primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--cv-primary)/0.25)] aria-[invalid=true]:border-rose-500';

export function Field({
  id,
  label,
  required,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
        {required && <span className="text-rose-600 dark:text-rose-300"> *</span>}
        {optional && <span className="font-normal text-muted-foreground"> (Optional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...props }, ref) {
    return <input ref={ref} className={cn(INPUT, className)} {...props} />;
  },
);

export function SelectInput({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(INPUT, 'appearance-auto', className)} {...props}>
      {children}
    </select>
  );
}

export function CheckboxRow({
  id,
  checked,
  onChange,
  children,
  invalid,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  invalid?: boolean;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-invalid={invalid || undefined}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-[hsl(var(--cv-primary))]"
      />
      <span className="text-muted-foreground">{children}</span>
    </label>
  );
}
