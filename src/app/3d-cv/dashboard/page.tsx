'use client';

import { useRouter } from 'next/navigation';
import { Lock, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '../_components/AppShell';
import DimensionList from '../_components/DimensionList';
import ProgressRing from '../_components/ProgressRing';
import { Action, PageHeading, WarningNote } from '../_components/ui';
import { careerStageLabel, MIN_COMPLETION_FOR_CV, STAGE_ORDER, statusFromScore } from '../_lib/dimensions';
import { useCv3d } from '../_lib/store';

/**
 * Screen 7 — 3D Profile Builder Dashboard: completion score, the nine
 * dimensions in this career stage's order, and the 60% generation lock.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { state, scores, completion, hydrated, requestMentor } = useCv3d();
  const stage = state.basic.careerStage || state.account?.careerStage || '';

  if (!hydrated) return <AppShell tabs>{null}</AppShell>;

  const order = STAGE_ORDER[stage || 'junior'];
  const nextGap = order.find((id) => statusFromScore(scores[id]) !== 'good');
  const locked = completion < MIN_COMPLETION_FOR_CV;
  const firstName = state.basic.fullName.split(' ')[0];

  return (
    <AppShell tabs>
      <PageHeading
        title={
          <>
            Build Your
            <br />
            3D Profile
          </>
        }
        subtitle={
          firstName
            ? `Hi ${firstName}, complete your 9 career dimensions to generate stronger job-specific CVs.`
            : 'Complete your 9 career dimensions to generate stronger job-specific CVs.'
        }
      />

      <ProgressRing percent={completion} />

      <p className="mt-6 text-xs text-muted-foreground">
        {stage ? (
          <>
            Ordered for a <span className="font-semibold text-foreground">{careerStageLabel(stage)}</span> CV.
          </>
        ) : (
          'Set your career stage in your basic profile to get the recommended order.'
        )}
      </p>
      <div className="mt-2">
        <DimensionList scores={scores} stage={stage} />
      </div>

      {locked && completion > 0 && (
        <div className="mt-4">
          <WarningNote>
            Your profile needs more information before we can generate a strong CV. Please complete the required
            sections or request mentor support.
          </WarningNote>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {nextGap && (
          <Action look="cta" href={`/3d-cv/profile/${nextGap}`}>
            Continue Profile Completion
          </Action>
        )}
        <Action
          look="primary"
          disabled={locked}
          title={locked ? `Reach ${MIN_COMPLETION_FOR_CV}% profile completion to unlock` : undefined}
          onClick={() => router.push('/3d-cv/job')}
        >
          {locked && <Lock className="h-4 w-4" aria-hidden />}
          {locked ? 'Generate CV (Locked)' : 'Generate CV'}
        </Action>
        <div className="grid grid-cols-2 gap-3">
          <Action
            look="outline"
            className="px-2 text-sm"
            onClick={() =>
              toast('Open any dimension, then edit an entry to attach a certificate, letter, file or link as proof.', {
                icon: 'ℹ️',
              })
            }
          >
            <Upload className="h-4 w-4" aria-hidden />
            Upload Evidence
          </Action>
          <Action
            look="outline"
            className="px-2 text-sm"
            disabled={state.mentorRequested}
            onClick={() => {
              requestMentor();
              toast.success('Mentor support requested. A Sanjeeda mentor will contact you.');
            }}
          >
            {state.mentorRequested ? 'Mentor Requested' : 'Request Mentor Support'}
          </Action>
        </div>
      </div>
    </AppShell>
  );
}
