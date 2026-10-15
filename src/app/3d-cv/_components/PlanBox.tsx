'use client';

import { Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { FREE_VERSION_LIMIT } from '../_lib/cv';

/** Free-plan usage and the upgrade prompt for version history (concept §12–13). */
export default function PlanBox({ used }: { used: number }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--cv-primary)/0.3)] bg-[hsl(var(--cv-primary-soft))] p-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-[hsl(var(--cv-primary-ink))]">
          Free plan · {Math.min(used, FREE_VERSION_LIMIT)} of {FREE_VERSION_LIMIT} CV versions
        </span>
        <button
          type="button"
          onClick={() => toast('Paid plans are coming soon. The Sanjeeda team will contact you.', { icon: '👑' })}
          className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs font-semibold text-[hsl(var(--cv-primary-ink))] hover:brightness-95"
        >
          <Crown className="h-3.5 w-3.5" aria-hidden />
          Upgrade
        </button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Free versions expire after 3 weeks. Upgrade to keep your version history, readiness reports and verified CVs.
      </p>
    </div>
  );
}

