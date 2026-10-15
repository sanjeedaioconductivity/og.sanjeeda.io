/**
 * The nine career dimensions of a 3D CV profile, and the rules that hang off them.
 *
 * Every candidate has all nine; career stage only changes the ORDER they are shown
 * and printed in (concept §6). The order lists below are copied from the concept doc
 * and must stay in sync with it: a CV generated later reads the same lists.
 */

export type DimensionId =
  | 'knowledge'
  | 'skills'
  | 'projects'
  | 'education'
  | 'certifications'
  | 'trainings'
  | 'attributes'
  | 'experience'
  | 'exposure';

export type CareerStage = 'junior' | 'mid' | 'senior';

export const CAREER_STAGES: { id: CareerStage; label: string }[] = [
  { id: 'junior', label: 'Junior / Fresh Candidate' },
  { id: 'mid', label: 'Mid-Career Professional' },
  { id: 'senior', label: 'Senior / Leadership Candidate' },
];

export function careerStageLabel(stage: CareerStage | ''): string {
  return CAREER_STAGES.find((s) => s.id === stage)?.label ?? '';
}

export const DIMENSIONS: Record<DimensionId, { label: string; blurb: string }> = {
  knowledge: { label: 'Knowledge Status', blurb: 'Subjects, concepts and systems you understand.' },
  skills: { label: 'Skill Status', blurb: 'What you can do, how well, and your proof.' },
  projects: { label: 'Relevant Projects', blurb: 'Project-based proof of your abilities.' },
  education: { label: 'Degree / Education', blurb: 'Degrees and academic background.' },
  certifications: { label: 'Certifications', blurb: 'Professional certificates you have earned.' },
  trainings: { label: 'Trainings', blurb: 'Short courses, workshops and bootcamps.' },
  attributes: { label: 'Attribute Fitness', blurb: 'Work style, strengths and behaviours.' },
  experience: { label: 'Experience', blurb: 'Jobs, internships, freelance and volunteer roles.' },
  exposure: { label: 'Exposure', blurb: 'Industries, clients, systems and contexts you have worked in.' },
};

export const STAGE_ORDER: Record<CareerStage, DimensionId[]> = {
  junior: [
    'knowledge', 'skills', 'projects', 'education', 'certifications',
    'trainings', 'attributes', 'experience', 'exposure',
  ],
  mid: [
    'experience', 'exposure', 'projects', 'education', 'certifications',
    'attributes', 'knowledge', 'skills', 'trainings',
  ],
  senior: [
    'exposure', 'projects', 'experience', 'attributes', 'knowledge',
    'skills', 'trainings', 'education', 'certifications',
  ],
};

/** Minimum profile completion before a CV can be generated (concept §11). */
export const MIN_COMPLETION_FOR_CV = 60;

export type DimensionStatus = 'good' | 'review' | 'missing';

/**
 * A dimension's status is derived from its score rather than stored, so the
 * badge and the completion ring can never disagree.
 */
export function statusFromScore(score: number): DimensionStatus {
  if (score >= 80) return 'good';
  if (score > 0) return 'review';
  return 'missing';
}

export function completionPercent(scores: Record<DimensionId, number>): number {
  const ids = Object.keys(DIMENSIONS) as DimensionId[];
  const total = ids.reduce((sum, id) => sum + (scores[id] ?? 0), 0);
  return Math.round(total / ids.length);
}

export function isDimensionId(value: string): value is DimensionId {
  return value in DIMENSIONS;
}
