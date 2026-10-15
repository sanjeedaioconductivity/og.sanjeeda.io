import type { Verification } from '../_components/ui';
import type { DimensionId } from './dimensions';

/**
 * Profile entries for the nine dimensions, the form fields that edit them, and
 * the completeness score each dimension earns.
 *
 * Every list dimension stores the same shape — string values keyed by field —
 * so one spec-driven form (EntryForm) edits all of them. Attribute Fitness is
 * the exception: it is a fixed list of ratings, not a list of entries.
 */

export interface EvidenceRef {
  /** File name, or the link the candidate pasted. */
  name: string;
  /** Bytes for a file, 0 for a link. Prototype: the file itself is never kept. */
  size: number;
  kind: 'file' | 'link';
}

export interface Entry {
  id: string;
  values: Record<string, string>;
  evidence: EvidenceRef | null;
}

export type ListDimensionId = Exclude<DimensionId, 'attributes'>;

/**
 * Candidates can't grant themselves a Sanjeeda / test / employer verification;
 * those come from the Phase 2 review workflow. What they control is proof.
 */
export function verificationOf(evidence: EvidenceRef | null): Verification {
  return evidence ? 'evidence-uploaded' : 'candidate-stated';
}

/* ---------------------------------------------------------------------------
   Option lists (concept doc §15, screens 8–16)
   --------------------------------------------------------------------------- */

export const KNOWLEDGE_LEVELS = [
  'Basic Awareness',
  'Working Knowledge',
  'Good Understanding',
  'Advanced Understanding',
  'Expert-Level Knowledge',
] as const;
export const KNOWLEDGE_SOURCES = ['Course', 'Training', 'Degree subject', 'Certificate', 'Project', 'Test', 'Mentor verification'] as const;

export const SKILL_CATEGORIES = ['Technical', 'Functional', 'Soft / Behavioral', 'Tools / Software'] as const;
export const SKILL_LEVELS = ['Basic', 'Working', 'Good', 'Advanced', 'Expert'] as const;
export const SKILL_SOURCES = ['Project', 'Work Experience', 'Training', 'Certificate', 'Test', 'Mentor verification'] as const;
export const LAST_USED = ['Currently using', 'Used in last 6 months', 'Used in last year', 'More than a year ago'] as const;

export const PROJECT_TYPES = ['Academic', 'Workplace', 'Client', 'Self-Initiated', 'Freelance', 'Volunteer', 'Training-Based', 'Research'] as const;

export const EMPLOYMENT_TYPES = [
  'Full-time', 'Part-time', 'Internship', 'Freelance', 'Volunteer', 'Apprenticeship', 'Family business', 'Self-employed',
] as const;

export const EXPOSURE_TYPES = [
  'Industry exposure', 'Client exposure', 'Tools and systems exposure', 'Team exposure', 'Cross-functional exposure',
  'International exposure', 'Field exposure', 'Regulatory exposure', 'Market exposure', 'Leadership exposure',
] as const;

export const ATTRIBUTES = [
  'Reliability', 'Problem Solving', 'Communication', 'Teamwork', 'Adaptability', 'Time Management',
  'Attention to Detail', 'Learning Agility', 'Professional Integrity', 'Customer Orientation', 'Leadership',
] as const;
export type AttributeName = (typeof ATTRIBUTES)[number];
export const ATTRIBUTE_RATINGS = ['Low', 'Medium', 'High'] as const;
export type AttributeRating = (typeof ATTRIBUTE_RATINGS)[number];
export const ATTRIBUTE_SOURCES = [
  'Self-reflection', 'Mentor comments', 'Employer feedback', 'Project evidence', 'Work experience', 'Test or assessment',
] as const;

export interface AttributeValue {
  rating: AttributeRating | '';
  source: string;
}
export type Attributes = Record<AttributeName, AttributeValue>;

export const EMPTY_ATTRIBUTES = Object.fromEntries(
  ATTRIBUTES.map((a) => [a, { rating: '', source: '' }]),
) as Attributes;

/**
 * The mockup's dots disagreed with its own dropdown (three dots and five dots both
 * read "High"). The dropdown is the real value; dots are drawn from it.
 */
export const RATING_DOTS: Record<AttributeRating, number> = { Low: 2, Medium: 3, High: 5 };

/** Suggested knowledge areas by target job family; anything unlisted gets GENERAL. */
const GENERAL_KNOWLEDGE = [
  'Industry Fundamentals', 'Professional Communication', 'Data & Reporting', 'Project Coordination',
  'Customer Needs', 'Workplace Tools', 'Quality & Compliance', 'Documentation & Reporting',
];
export const SUGGESTED_KNOWLEDGE: Record<string, string[]> = {
  'IT Support': [
    'Operating Systems', 'Networking Fundamentals', 'Hardware Components', 'System Security',
    'Troubleshooting Concepts', 'Cloud Computing Basics', 'IT Service Management', 'Documentation & Reporting',
  ],
  'System Support': [
    'Operating Systems', 'Server Administration', 'Backup & Recovery', 'System Security',
    'Virtualization Basics', 'Scripting Basics', 'IT Service Management', 'Monitoring & Alerts',
  ],
  'Network Administration': [
    'Networking Fundamentals', 'TCP/IP & Subnetting', 'Routing & Switching', 'DNS & DHCP',
    'Firewalls & VPN', 'Wireless Networking', 'Network Monitoring', 'Network Security',
  ],
  'Software Development': [
    'Programming Fundamentals', 'Data Structures', 'Databases & SQL', 'Version Control',
    'Web Technologies', 'APIs', 'Software Testing', 'Software Design',
  ],
  'Data Analysis': [
    'Statistics', 'Excel & Spreadsheets', 'SQL', 'Data Visualization',
    'Data Cleaning', 'Business Metrics', 'Python for Data', 'Reporting',
  ],
};
export function suggestedKnowledge(jobFamilies: string[]): { label: string; areas: string[] } {
  const family = jobFamilies.find((f) => SUGGESTED_KNOWLEDGE[f]);
  return family
    ? { label: `Suggested for ${family}`, areas: SUGGESTED_KNOWLEDGE[family] }
    : { label: 'Suggested', areas: GENERAL_KNOWLEDGE };
}

/* ---------------------------------------------------------------------------
   Form specs
   --------------------------------------------------------------------------- */

export interface FieldSpec {
  key: string;
  label: string;
  kind: 'text' | 'textarea' | 'select' | 'month' | 'year' | 'number' | 'url' | 'checkbox';
  options?: readonly string[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** Two short fields share a row on wider screens. */
  half?: boolean;
  /** Hide (and ignore) this field when the predicate is true. */
  hiddenWhen?: (values: Record<string, string>) => boolean;
}

export interface DimensionSpec {
  /** Singular noun for buttons: "+ Add Project", "Edit project". */
  noun: string;
  heading: string;
  subtitle: string;
  fields: FieldSpec[];
  /** Extra rules beyond "required"; returns field-keyed messages. */
  validate?: (values: Record<string, string>, evidence: EvidenceRef | null) => Record<string, string>;
  /** Score target: this many evidence-backed entries make the dimension 100%. */
  target: number;
}

const YEAR_NOW = new Date().getFullYear();

function checkRange(values: Record<string, string>, start: string, end: string, label = 'End date'): Record<string, string> {
  if (values[start] && values[end] && values[end] < values[start]) {
    return { [end]: `${label} can't be before the start.` };
  }
  return {};
}

function checkYear(values: Record<string, string>, key: string): Record<string, string> {
  const y = Number(values[key]);
  if (values[key] && (!Number.isInteger(y) || y < 1950 || y > YEAR_NOW + 8)) return { [key]: 'Enter a 4-digit year.' };
  return {};
}

function checkUrl(values: Record<string, string>, key: string): Record<string, string> {
  const v = values[key]?.trim();
  if (v && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(v)) return { [key]: 'Enter a valid link.' };
  return {};
}

export const SPECS: Record<ListDimensionId, DimensionSpec> = {
  knowledge: {
    noun: 'Knowledge Area',
    heading: 'Add Your Knowledge Areas',
    subtitle: 'Tell us what subjects, concepts, tools, systems or professional areas you understand.',
    target: 5,
    fields: [
      { key: 'area', label: 'Knowledge area', kind: 'text', required: true, placeholder: 'e.g. Networking Fundamentals' },
      { key: 'level', label: 'Knowledge level', kind: 'select', options: KNOWLEDGE_LEVELS, required: true },
      { key: 'source', label: 'How did you gain it?', kind: 'select', options: KNOWLEDGE_SOURCES },
    ],
    validate: (v, ev): Record<string, string> =>
      v.level === 'Expert-Level Knowledge' && !ev ? { level: 'Expert-level claims need evidence. Attach proof below or choose a lower level.' } : {},
  },
  skills: {
    noun: 'Skill',
    heading: 'Add Your Skills',
    subtitle: 'Tell us what you can do, how well you can do it, and what proof you have.',
    target: 5,
    fields: [
      { key: 'name', label: 'Skill name', kind: 'text', required: true, placeholder: 'e.g. Windows Troubleshooting' },
      { key: 'category', label: 'Category', kind: 'select', options: SKILL_CATEGORIES, required: true, half: true },
      { key: 'level', label: 'Proficiency', kind: 'select', options: SKILL_LEVELS, required: true, half: true },
      { key: 'source', label: 'Proof type', kind: 'select', options: SKILL_SOURCES, half: true },
      { key: 'lastUsed', label: 'Last used', kind: 'select', options: LAST_USED, half: true },
      { key: 'related', label: 'Related project or experience', kind: 'text', placeholder: 'e.g. IT Support internship' },
    ],
    validate: (v, ev): Record<string, string> =>
      v.level === 'Expert' && !ev ? { level: 'Expert-level claims need evidence. Attach proof below or choose a lower level.' } : {},
  },
  projects: {
    noun: 'Project',
    heading: 'Add Your Projects',
    subtitle: 'Projects help prove your skills, knowledge and readiness for the jobs you want.',
    target: 2,
    fields: [
      { key: 'title', label: 'Project title', kind: 'text', required: true },
      { key: 'type', label: 'Project type', kind: 'select', options: PROJECT_TYPES, required: true, half: true },
      { key: 'role', label: 'Your role', kind: 'text', required: true, placeholder: 'e.g. Team Lead', half: true },
      { key: 'summary', label: 'Project summary', kind: 'textarea', required: true, placeholder: 'What was the project and what did you do?' },
      { key: 'skills', label: 'Skills used', kind: 'text', placeholder: 'Comma-separated, e.g. Troubleshooting, Windows' },
      { key: 'knowledge', label: 'Knowledge areas used', kind: 'text', placeholder: 'Comma-separated' },
      { key: 'tools', label: 'Tools used', kind: 'text', placeholder: 'Comma-separated, e.g. Packet Tracer' },
      { key: 'outcome', label: 'Outcome / result', kind: 'textarea', placeholder: 'Only what actually happened. No estimates you cannot back up.' },
      { key: 'start', label: 'Start', kind: 'month', half: true },
      { key: 'end', label: 'End', kind: 'month', half: true },
    ],
    validate: (v) => checkRange(v, 'start', 'end'),
  },
  education: {
    noun: 'Education',
    heading: 'Add Your Education',
    subtitle: 'Add all your degrees and academic background.',
    target: 1,
    fields: [
      { key: 'degree', label: 'Degree / program', kind: 'text', required: true, placeholder: 'e.g. BS Computer Science' },
      { key: 'institution', label: 'Institution', kind: 'text', required: true },
      { key: 'startYear', label: 'Start year', kind: 'year', required: true, half: true },
      { key: 'endYear', label: 'End year (or expected)', kind: 'year', required: true, half: true },
      { key: 'grade', label: 'Grade / CGPA / percentage', kind: 'text', placeholder: 'e.g. CGPA 3.15 / 4.00' },
      { key: 'majors', label: 'Major subjects', kind: 'text', placeholder: 'Comma-separated' },
      { key: 'fyp', label: 'Final year project', kind: 'text' },
    ],
    validate: (v) => ({ ...checkYear(v, 'startYear'), ...checkYear(v, 'endYear'), ...checkRange(v, 'startYear', 'endYear', 'End year') }),
  },
  certifications: {
    noun: 'Certification',
    heading: 'Add Your Certifications',
    subtitle: 'Add professional certificates you have earned.',
    target: 1,
    fields: [
      { key: 'name', label: 'Certification name', kind: 'text', required: true, placeholder: 'e.g. CompTIA IT Fundamentals (ITF+)' },
      { key: 'issuer', label: 'Issuing body', kind: 'text', required: true },
      { key: 'issued', label: 'Issue date', kind: 'month', required: true, half: true },
      { key: 'expires', label: 'Expiry date', kind: 'month', half: true, hint: 'Leave empty if it never expires.' },
      { key: 'credentialId', label: 'Credential ID', kind: 'text', half: true },
      { key: 'credentialUrl', label: 'Credential URL', kind: 'url', half: true },
    ],
    validate: (v) => ({ ...checkRange(v, 'issued', 'expires', 'Expiry date'), ...checkUrl(v, 'credentialUrl') }),
  },
  trainings: {
    noun: 'Training',
    heading: 'Add Your Trainings',
    subtitle: 'Add short courses, workshops and training programs.',
    target: 1,
    fields: [
      { key: 'title', label: 'Training title', kind: 'text', required: true },
      { key: 'provider', label: 'Provider', kind: 'text', required: true },
      { key: 'hours', label: 'Duration (hours)', kind: 'number', half: true },
      { key: 'completed', label: 'Completion date', kind: 'month', half: true },
      { key: 'areas', label: 'Areas covered', kind: 'text', placeholder: 'Comma-separated' },
      { key: 'skills', label: 'Skills gained', kind: 'text', placeholder: 'Comma-separated' },
    ],
  },
  experience: {
    noun: 'Experience',
    heading: 'Add Your Experience',
    subtitle: 'Add your work experience, internships and relevant roles.',
    target: 2,
    fields: [
      { key: 'title', label: 'Job title', kind: 'text', required: true },
      { key: 'organization', label: 'Organization / client', kind: 'text', required: true },
      { key: 'type', label: 'Employment type', kind: 'select', options: EMPLOYMENT_TYPES, required: true, half: true },
      { key: 'location', label: 'Location', kind: 'text', half: true },
      { key: 'start', label: 'Start', kind: 'month', required: true, half: true },
      { key: 'end', label: 'End', kind: 'month', required: true, half: true, hiddenWhen: (v) => v.current === 'true' },
      { key: 'current', label: 'I currently work here', kind: 'checkbox' },
      { key: 'responsibilities', label: 'Responsibilities', kind: 'textarea', required: true, hint: 'One per line. Each line becomes a bullet.' },
      { key: 'achievements', label: 'Achievements', kind: 'textarea', hint: 'One per line. Only numbers you can back up.' },
      { key: 'tools', label: 'Tools used', kind: 'text', placeholder: 'Comma-separated' },
      { key: 'skills', label: 'Skills applied', kind: 'text', placeholder: 'Comma-separated' },
    ],
    validate: (v) => (v.current === 'true' ? {} : checkRange(v, 'start', 'end')),
  },
  exposure: {
    noun: 'Exposure',
    heading: 'Add Your Exposure',
    subtitle: 'The industries, clients, systems, teams and contexts you have worked in or around.',
    target: 2,
    fields: [
      { key: 'title', label: 'Exposure title', kind: 'text', required: true, placeholder: 'e.g. Banking sector IT operations' },
      { key: 'type', label: 'Type of exposure', kind: 'select', options: EXPOSURE_TYPES, required: true },
      { key: 'context', label: 'Context', kind: 'textarea', required: true, placeholder: 'Where and how were you exposed to this?' },
      { key: 'duration', label: 'Duration', kind: 'text', half: true, placeholder: 'e.g. 3 months' },
      { key: 'related', label: 'Related role / project', kind: 'text', half: true },
      { key: 'learned', label: 'What you learned', kind: 'textarea' },
    ],
  },
};

/* ---------------------------------------------------------------------------
   Scoring — drives the status badges and the completion ring.
   Proof counts more than a claim: an entry with evidence is worth 1, a
   candidate-stated one 0.7. Attribute ratings backed by anything other than
   self-reflection are worth 1, self-rated ones 0.6.
   --------------------------------------------------------------------------- */

export const ATTRIBUTE_TARGET = 9;

export type EntriesByDimension = Record<ListDimensionId, Entry[]>;

export const EMPTY_ENTRIES: EntriesByDimension = {
  knowledge: [], skills: [], projects: [], education: [], certifications: [],
  trainings: [], experience: [], exposure: [],
};

export function scoreOf(entries: EntriesByDimension, attributes: Attributes): Record<DimensionId, number> {
  const out = {} as Record<DimensionId, number>;
  for (const id of Object.keys(SPECS) as ListDimensionId[]) {
    const weight = entries[id].reduce((sum, e) => sum + (e.evidence ? 1 : 0.7), 0);
    out[id] = Math.min(100, Math.round((weight / SPECS[id].target) * 100));
  }
  const attrWeight = Object.values(attributes).reduce(
    (sum, a) => sum + (a.rating ? (a.source && a.source !== 'Self-reflection' ? 1 : 0.6) : 0),
    0,
  );
  out.attributes = Math.min(100, Math.round((attrWeight / ATTRIBUTE_TARGET) * 100));
  return out;
}

/* ---------------------------------------------------------------------------
   Display helpers
   --------------------------------------------------------------------------- */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2024-06" → "Jun 2024". */
export function formatMonth(value: string): string {
  const [y, m] = value.split('-');
  if (!y || !m) return value;
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

/** Inclusive month count between two "YYYY-MM" values. */
export function monthsBetween(start: string, end: string): number {
  const [sy, sm] = start.split('-').map(Number);
  const [ey, em] = end.split('-').map(Number);
  return (ey - sy) * 12 + (em - sm) + 1;
}

export function splitList(value: string | undefined): string[] {
  return (value ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

export function splitLines(value: string | undefined): string[] {
  return (value ?? '').split('\n').map((s) => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
