import type { CareerStage } from './dimensions';
import {
  EMPTY_ATTRIBUTES,
  newId,
  type Attributes,
  type EntriesByDimension,
  type Entry,
  type EvidenceRef,
  type ListDimensionId,
} from './entries';

/**
 * Prototype sample data — the candidate shown in the design mockups.
 *
 * Phase 1 has no backend or AI: "extracting" an uploaded CV loads this profile
 * instead of parsing the file. The email and phone are deliberately fake
 * (example.com, a 0000 number) so the prototype never shows a real person's
 * contact details.
 */

export const SAMPLE_BASIC_PROFILE = {
  fullName: 'Mirza Faizan Baig',
  title: 'Fresh Computer Science Graduate',
  email: 'faizan.baig@example.com',
  mobile: '+92 300 0000000',
  city: 'Karachi, Pakistan',
  linkedin: 'linkedin.com/in/faizanbaig',
  portfolio: 'github.com/faizanbaig',
  careerStage: 'junior' as CareerStage,
  jobFamilies: ['IT Support', 'System Support'],
  preferredLocation: 'Karachi, Pakistan',
};

/* ---------------------------------------------------------------------------
   Sample entries, taken from mockup screens 8–15.

   SAMPLE_EXTRACTED is what "extracting" the uploaded CV loads. It is chosen so
   the statuses match mockups 5 and 7: Projects, Certifications and Trainings
   come back Missing, Knowledge / Attributes / Exposure need review. That lands
   the profile just under the 60% lock (48%), so the demo shows the lock and
   lets the candidate unlock it by completing sections.

   SAMPLE_EXTRAS fills an empty dimension from its "Use sample entries" link, so
   a reviewer can see each screen populated like its mockup.
   --------------------------------------------------------------------------- */

const ev = (name: string): EvidenceRef => ({ name, size: 184_000, kind: 'file' });
const entry = (values: Record<string, string>, evidence: EvidenceRef | null = null): Entry => ({
  id: newId(),
  values,
  evidence,
});

export function sampleExtracted(): { entries: EntriesByDimension; attributes: Attributes } {
  return {
    entries: {
      knowledge: [
        entry({ area: 'Operating Systems', level: 'Good Understanding', source: 'Degree subject' }, ev('os-course-transcript.pdf')),
        entry({ area: 'Networking Fundamentals', level: 'Working Knowledge', source: 'Training' }, ev('ccna-basics-certificate.pdf')),
        entry({ area: 'Troubleshooting Concepts', level: 'Good Understanding', source: 'Project' }),
        entry({ area: 'System Security', level: 'Basic Awareness', source: 'Course' }),
      ],
      skills: [
        entry({ name: 'MS Excel', category: 'Tools / Software', level: 'Good', source: 'Project', related: 'Sales dashboard project', lastUsed: 'Currently using' }, ev('sales-dashboard.xlsx')),
        entry({ name: 'Windows Troubleshooting', category: 'Technical', level: 'Advanced', source: 'Work Experience', related: 'IT Support internship', lastUsed: 'Currently using' }, ev('internship-letter.pdf')),
        entry({ name: 'Networking Support', category: 'Technical', level: 'Working', source: 'Training', related: 'CCNA basic training', lastUsed: 'Used in last 6 months' }, ev('ccna-basics-certificate.pdf')),
        entry({ name: 'Customer Support', category: 'Functional', level: 'Good', source: 'Work Experience', related: '1 year at the computer lab', lastUsed: 'Currently using' }, ev('lab-assistant-letter.pdf')),
      ],
      projects: [],
      education: [
        entry({ degree: 'BS Computer Science', institution: 'University of Karachi', startYear: '2021', endYear: '2025', grade: 'CGPA 3.15 / 4.00' }, ev('bs-transcript.pdf')),
        entry({ degree: 'Intermediate (Pre-Engineering)', institution: 'Govt. College', startYear: '2019', endYear: '2021', grade: 'Grade A' }, ev('intermediate-certificate.pdf')),
        entry({ degree: 'Matriculation (Science)', institution: 'DPS School', startYear: '2017', endYear: '2019', grade: 'Grade A+' }, ev('matric-certificate.pdf')),
      ],
      certifications: [],
      trainings: [],
      experience: [
        entry(
          {
            title: 'IT Support Intern', organization: 'XYZ Solutions', type: 'Internship', location: 'Karachi',
            start: '2024-06', end: '2024-08',
            responsibilities: 'Assisted in troubleshooting hardware and software issues.\nInstalled and configured Windows OS.\nSupported users and documented solutions.',
          },
          ev('internship-letter.pdf'),
        ),
        entry({
          title: 'Computer Lab Assistant', organization: 'University of Karachi', type: 'Part-time', location: 'On-campus',
          start: '2023-06', end: '2024-05',
          responsibilities: 'Managed lab activities and user support.\nMaintained systems and peripherals.\nPrepared lab usage reports.',
        }),
      ],
      exposure: [
        entry({
          title: 'University IT operations', type: 'Tools and systems exposure',
          context: 'Supported a 60-seat computer lab used by several departments.', duration: '12 months',
          related: 'Computer Lab Assistant',
        }),
      ],
    },
    attributes: {
      ...EMPTY_ATTRIBUTES,
      Reliability: { rating: 'High', source: 'Self-reflection' },
      'Problem Solving': { rating: 'High', source: 'Self-reflection' },
      Communication: { rating: 'High', source: 'Self-reflection' },
      Teamwork: { rating: 'High', source: 'Self-reflection' },
      Adaptability: { rating: 'Medium', source: 'Self-reflection' },
      'Time Management': { rating: 'High', source: 'Self-reflection' },
      'Attention to Detail': { rating: 'High', source: 'Self-reflection' },
      'Learning Agility': { rating: 'High', source: 'Self-reflection' },
      'Professional Integrity': { rating: 'High', source: 'Self-reflection' },
    },
  };
}

export function sampleExtras(dimension: ListDimensionId): Entry[] {
  switch (dimension) {
    case 'projects':
      return [
        entry(
          {
            title: 'Computer Lab Support Project', type: 'Academic', role: 'Team Lead',
            summary: 'Supported lab users, maintained systems and resolved hardware/software issues.',
            skills: 'Troubleshooting, Windows, Communication', start: '2025-01', end: '2025-03',
          },
          ev('lab-project-report.pdf'),
        ),
        entry({
          title: 'Network Setup Simulation', type: 'Academic', role: 'Individual',
          summary: 'Designed and simulated a small office network in Packet Tracer.',
          skills: 'Networking, IP Addressing, Configuration', tools: 'Packet Tracer', start: '2024-10', end: '2024-12',
        }),
        entry(
          {
            title: 'Website for College Event', type: 'Self-Initiated', role: 'Developer',
            summary: 'Built a website to promote a college event and manage registrations.',
            skills: 'HTML, CSS, JavaScript', start: '2024-05', end: '2024-06',
          },
          { name: 'github.com/faizanbaig/college-event', size: 0, kind: 'link' },
        ),
      ];
    case 'certifications':
      return [
        entry({ name: 'CompTIA IT Fundamentals (ITF+)', issuer: 'CompTIA', issued: '2025-02' }, ev('comptia-itf.pdf')),
        entry({ name: 'Microsoft Office Specialist', issuer: 'Microsoft', issued: '2024-12' }, ev('mos-certificate.pdf')),
        entry({ name: 'Google IT Support Certificate', issuer: 'Coursera', issued: '2024-09' }, ev('google-it-support.pdf')),
      ];
    case 'trainings':
      return [
        entry({ title: 'CCNA Basics Training', provider: 'DigiSkills PK', hours: '40', completed: '2025-01' }, ev('ccna-basics-certificate.pdf')),
        entry({ title: 'Windows Server Administration', provider: 'Aptech', hours: '60', completed: '2024-11' }, ev('aptech-certificate.pdf')),
        entry({ title: 'Effective Communication', provider: 'Coursera', hours: '12', completed: '2024-10' }),
      ];
    case 'exposure':
      return [
        entry({
          title: 'Corporate helpdesk environment', type: 'Client exposure',
          context: 'Handled walk-in and ticketed requests from staff across departments during the internship.',
          duration: '3 months', related: 'IT Support Intern', learned: 'Prioritising tickets and explaining fixes to non-technical users.',
        }),
      ];
    default:
      return [];
  }
}

export const JOB_FAMILIES = [
  'IT Support',
  'System Support',
  'Network Administration',
  'Software Development',
  'Data Analysis',
  'Customer Service',
  'Sales & Business Development',
  'Marketing',
  'Finance & Accounting',
  'Human Resources',
  'Operations',
  'Project Management',
];

/** Suggestions only: city is free text (portal convention), these just speed typing. */
export const CITY_SUGGESTIONS = [
  'Karachi, Pakistan',
  'Lahore, Pakistan',
  'Islamabad, Pakistan',
  'Rawalpindi, Pakistan',
  'Faisalabad, Pakistan',
  'Multan, Pakistan',
  'Peshawar, Pakistan',
  'Quetta, Pakistan',
  'Hyderabad, Pakistan',
];

/**
 * Stand-in for the AI title suggestion: a fixed phrase per career stage and the
 * first target job family. It only rephrases what the candidate already chose.
 */
export function suggestTitle(stage: CareerStage | '', families: string[]): string {
  const family = families[0];
  if (stage === 'junior') return family ? `Aspiring ${family} Professional` : 'Fresh Graduate';
  if (stage === 'mid') return family ? `${family} Professional` : 'Experienced Professional';
  if (stage === 'senior') return family ? `${family} Lead` : 'Senior Professional';
  return family ? `${family} Professional` : '';
}
