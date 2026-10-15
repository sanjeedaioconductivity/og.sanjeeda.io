'use client';

import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import AppShell from '../_components/AppShell';
import DimensionList from '../_components/DimensionList';
import ProgressRing from '../_components/ProgressRing';
import { Action, PageHeading, WarningNote } from '../_components/ui';
import { MIN_COMPLETION_FOR_CV, STAGE_ORDER, statusFromScore } from '../_lib/dimensions';
import { useCv3d } from '../_lib/store';

/**
 * Screen 5 — 3D Profile Extraction Review. Shows how the uploaded CV landed in
 * the nine dimensions and what still needs work.
 */
export default function ReviewPage() {
  const router = useRouter();
  const { state, scores, completion, hydrated, requestMentor } = useCv3d();
  const stage = state.basic.careerStage || state.account?.careerStage || '';

  if (!hydrated) return <AppShell>{null}</AppShell>;

  if (!state.extracted) {
    return (
      <AppShell>
        <PageHeading title="Nothing to review yet" subtitle="Upload a CV first and we will organize it into your 9 career dimensions." />
        <Action look="primary" href="/3d-cv/upload">
          Upload Existing CV
        </Action>
      </AppShell>
    );
  }

  const order = STAGE_ORDER[stage || 'junior'];
  const firstGap = order.find((id) => statusFromScore(scores[id]) !== 'good');
  const below = completion < MIN_COMPLETION_FOR_CV;

  return (
    <AppShell>
      <PageHeading
        title={
          <>
            Review Your
            <br />
            3D Profile
          </>
        }
        subtitle="We organized your information into 9 career dimensions. Please review and complete missing areas."
      />

      <ProgressRing percent={completion} />

      <div className="mt-6">
        <DimensionList scores={scores} stage={stage} />
      </div>

      {below && (
        <div className="mt-4">
          <WarningNote>
            Your profile needs more information before we can generate a strong CV. Please complete the required
            sections or request mentor support.
          </WarningNote>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {firstGap && (
          <Action look="primary" href={`/3d-cv/profile/${firstGap}`}>
            Review Missing Areas
          </Action>
        )}
        <Action
          look="neutral"
          onClick={() => {
            requestMentor();
            toast.success('Mentor support requested. A Sanjeeda mentor will contact you.');
          }}
          disabled={state.mentorRequested}
        >
          {state.mentorRequested ? 'Mentor Support Requested' : 'Request Mentor Support'}
        </Action>
        <Action look="neutral" onClick={() => router.push(state.basic.confirmed ? '/3d-cv/dashboard' : '/3d-cv/basic-profile')}>
          {state.basic.confirmed ? 'Continue to Dashboard' : 'Continue: Confirm Basic Profile'}
        </Action>
      </div>
    </AppShell>
  );
}
