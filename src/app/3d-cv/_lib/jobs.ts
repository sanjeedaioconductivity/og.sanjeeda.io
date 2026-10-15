/**
 * Job description analysis — the Phase 1 stand-in for the AI parser.
 *
 * Reads a pasted job description with plain rules: section headings decide
 * whether a term is required or preferred, and terms are found by matching a
 * fixed dictionary plus the words the candidate already used in their own
 * profile. It never adds a requirement that isn't in the text. When the real
 * parser lands it should return the same JobAnalysis shape.
 */

export type TermKind = 'skill' | 'tool' | 'knowledge' | 'attribute';

export interface JobTerm {
  term: string;
  kind: TermKind;
  required: boolean;
  /** Lower-case spellings searched for, in the job text and in profile entries. */
  aliases: string[];
}

export interface JobAnalysis {
  title: string;
  company: string;
  terms: JobTerm[];
  /** e.g. "Bachelor's degree in Computer Science", or null if none is asked for. */
  education: string | null;
  /** Minimum years asked for; 0 for "fresh graduates welcome"; null if not stated. */
  experienceYears: number | null;
  responsibilities: string[];
}

export interface JobDescription {
  id: string;
  source: 'paste' | 'file' | 'link' | 'saved';
  link?: string;
  text: string;
  analysis: JobAnalysis;
}

type DictEntry = [term: string, kind: TermKind, aliases: string[]];

const DICTIONARY: DictEntry[] = [
  // Knowledge
  ['Operating Systems', 'knowledge', ['operating system', 'operating systems']],
  ['Networking Fundamentals', 'knowledge', ['networking', 'network fundamentals', 'networking fundamentals', 'networking support']],
  ['TCP/IP', 'knowledge', ['tcp/ip', 'tcp-ip', 'ip addressing', 'subnetting']],
  ['DNS & DHCP', 'knowledge', ['dns', 'dhcp']],
  ['LAN/WAN', 'knowledge', ['lan/wan', 'lan', 'wan']],
  ['Hardware Components', 'knowledge', ['hardware']],
  ['System Security', 'knowledge', ['security', 'cybersecurity', 'antivirus']],
  ['Cloud Computing', 'knowledge', ['cloud', 'azure', 'aws', 'microsoft 365 admin']],
  ['IT Service Management', 'knowledge', ['itil', 'itsm', 'service management', 'sla']],
  ['Active Directory', 'knowledge', ['active directory', 'group policy']],
  ['Virtualization', 'knowledge', ['virtualization', 'vmware', 'hyper-v']],
  ['Backup & Recovery', 'knowledge', ['backup', 'recovery']],
  ['Databases', 'knowledge', ['database', 'databases']],
  // Skills
  ['Troubleshooting', 'skill', ['troubleshoot', 'troubleshooting']],
  ['Technical Support', 'skill', ['technical support', 'it support', 'desktop support', 'help desk', 'helpdesk', 'service desk']],
  ['Customer Support', 'skill', ['customer support', 'customer service', 'user support', 'end users', 'end-user']],
  ['Installation & Configuration', 'skill', ['install', 'installation', 'configure', 'configuration', 'configured', 'installed']],
  ['Documentation', 'skill', ['documentation', 'document', 'documented', 'reporting', 'reports']],
  ['System Maintenance', 'skill', ['maintenance', 'maintain', 'maintained', 'peripherals']],
  ['Web Development', 'skill', ['web development', 'website']],
  // Tools
  ['Windows', 'tool', ['windows']],
  ['Linux', 'tool', ['linux', 'ubuntu']],
  ['MS Office', 'tool', ['ms office', 'microsoft office', 'office 365', 'outlook', 'word']],
  ['MS Excel', 'tool', ['excel', 'ms excel', 'spreadsheets']],
  ['Ticketing Systems', 'tool', ['ticketing', 'jira', 'servicenow', 'freshdesk', 'zendesk']],
  ['Packet Tracer', 'tool', ['packet tracer']],
  ['HTML/CSS', 'tool', ['html', 'css']],
  ['JavaScript', 'tool', ['javascript']],
  ['SQL', 'tool', ['sql']],
  ['Python', 'tool', ['python']],
  ['Power BI', 'tool', ['power bi']],
  // Attributes
  ['Communication', 'attribute', ['communication', 'communicate', 'communicating']],
  ['Teamwork', 'attribute', ['teamwork', 'team player', 'collaborate', 'collaboration']],
  ['Problem Solving', 'attribute', ['problem solving', 'problem-solving', 'analytical']],
  ['Attention to Detail', 'attribute', ['attention to detail', 'detail-oriented', 'detail oriented']],
  ['Time Management', 'attribute', ['time management', 'prioritize', 'prioritise', 'deadlines']],
  ['Customer Orientation', 'attribute', ['customer-focused', 'customer focused', 'customer orientation', 'service-oriented']],
  ['Adaptability', 'attribute', ['adaptable', 'adaptability', 'flexible', 'fast-paced']],
  ['Learning Agility', 'attribute', ['willingness to learn', 'eager to learn', 'quick learner', 'learning agility']],
  ['Reliability', 'attribute', ['reliable', 'dependable', 'reliability']],
  ['Leadership', 'attribute', ['leadership', 'lead a team', 'supervise']],
  ['Professional Integrity', 'attribute', ['integrity', 'confidential', 'confidentiality']],
];

export function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whole-word, case-insensitive containment. */
export function mentions(haystack: string, alias: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${escapeRe(alias.toLowerCase())}($|[^a-z0-9])`, 'i').test(haystack);
}

const BULLET = /^\s*(?:[-•*·▪●]|\d+[.)])\s*/;

type Section = 'intro' | 'responsibilities' | 'required' | 'preferred';

/**
 * A heading is a short, non-bullet line — either ending in ":" or at most four
 * words — so a bullet like "- Python is a plus" never switches section.
 */
function sectionOf(line: string): Section | null {
  if (BULLET.test(line)) return null;
  const l = line.toLowerCase().replace(/[:\-–]+\s*$/, '').trim();
  if (l.length > 60) return null;
  if (!/:\s*$/.test(line) && l.split(/\s+/).length > 4) return null;
  if (/(preferred|nice to have|nice-to-have|bonus|desirable|good to have|plus)/.test(l)) return 'preferred';
  if (/(requirements|qualifications|what we('| a)re looking for|must have|required|skills|who you are)/.test(l)) return 'required';
  if (/(responsibilities|duties|what you('| wi)ll do|role overview|key tasks)/.test(l)) return 'responsibilities';
  return null;
}

/**
 * @param profileTerms extra terms the candidate already uses (skill names,
 *   knowledge areas, tools) so domain words outside the dictionary still match.
 */
export function analyzeJob(text: string, profileTerms: { term: string; kind: TermKind }[] = []): JobAnalysis {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Tag every line with the section it sits under.
  let section: Section = 'intro';
  const tagged: { line: string; section: Section }[] = [];
  for (const line of lines) {
    const s = sectionOf(line);
    if (s) {
      section = s;
      continue;
    }
    tagged.push({ line, section });
  }

  const titleLine = lines.find((l) => /^(job\s*)?title\s*[:\-]/i.test(l));
  const title = (titleLine ? titleLine.replace(/^(job\s*)?title\s*[:\-]\s*/i, '') : lines[0] ?? '').slice(0, 80);
  const companyLine = lines.find((l) => /^(company|organi[sz]ation|employer)\s*[:\-]/i.test(l));
  const company = companyLine ? companyLine.replace(/^[^:\-]+[:\-]\s*/, '').slice(0, 80) : '';

  const dict: DictEntry[] = [...DICTIONARY];
  const known = new Set(DICTIONARY.flatMap(([, , a]) => a));
  for (const p of profileTerms) {
    const alias = p.term.toLowerCase().trim();
    if (alias.length >= 3 && !known.has(alias)) {
      dict.push([p.term, p.kind, [alias]]);
      known.add(alias);
    }
  }

  const terms: JobTerm[] = [];
  for (const [term, kind, aliases] of dict) {
    const hits = tagged.filter(({ line }) => aliases.some((a) => mentions(line, a)));
    if (hits.length === 0) continue;
    // Preferred only if every mention is under a "preferred" heading.
    const required = hits.some((h) => h.section !== 'preferred');
    if (!terms.some((t) => t.term === term)) terms.push({ term, kind, required, aliases });
  }

  const full = text.replace(/\s+/g, ' ');
  let experienceYears: number | null = null;
  const years = full.match(/(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?(?:years?|yrs?)(?:'|’)?\s*(?:of\s+)?(?:\w+\s+){0,3}experience/i);
  if (years) experienceYears = Number(years[1]);
  else if (/(fresh graduates?|no experience required|entry[- ]level)/i.test(full)) experienceYears = 0;

  // Line by line, so the phrase never runs into the next bullet.
  const EDU = /\b(bachelor'?s?|master'?s?|BS|BSc|BE|BCS|MBA|MS|diploma|intermediate|degree)\b[^.;]{0,80}/i;
  const eduLine = lines.map((l) => l.replace(BULLET, '').match(EDU)).find(Boolean);
  const education = eduLine ? eduLine[0].trim().replace(/[,;:]$/, '') : null;

  const responsibilities = tagged
    .filter((t) => t.section === 'responsibilities')
    .map((t) => t.line.replace(BULLET, ''))
    .slice(0, 8);

  return { title, company, terms, education, experienceYears, responsibilities };
}

/* ---------------------------------------------------------------------------
   Saved target roles — sample job descriptions for the prototype. Generic on
   purpose: no real employer is named.
   --------------------------------------------------------------------------- */

export const SAVED_ROLES: { id: string; label: string; text: string }[] = [
  {
    id: 'it-support-officer',
    label: 'IT Support Officer',
    text: `Job Title: IT Support Officer
Company: A Karachi-based software company

Responsibilities:
- Provide first-line technical support to end users in person and over the phone
- Troubleshoot hardware, software and Windows issues
- Install and configure laptops, printers and peripherals
- Log and track requests in the ticketing system
- Maintain documentation of common fixes

Requirements:
- Bachelor's degree in Computer Science or a related field
- 0-1 years of experience; fresh graduates welcome
- Working knowledge of networking fundamentals: TCP/IP, DNS, DHCP and LAN/WAN
- Good communication and customer service skills
- Problem solving and attention to detail

Preferred:
- CompTIA or Google IT Support certificate
- Exposure to Active Directory and Office 365
- Willingness to learn new tools`,
  },
  {
    id: 'system-support-associate',
    label: 'System Support Associate',
    text: `Job Title: System Support Associate
Company: A regional bank's IT operations team

What you'll do:
- Monitor servers and systems and escalate alerts within SLA
- Perform routine maintenance, backup and recovery checks
- Support users with Windows and Linux workstations
- Prepare daily system health reports

Requirements:
- Bachelor's degree in IT, CS or equivalent
- 1+ years of experience in IT support or system administration
- Knowledge of operating systems, virtualization and system security
- Strong troubleshooting and documentation skills
- Reliable, able to prioritize and work under deadlines

Nice to have:
- ITIL foundation
- Experience with VMware or Hyper-V
- Python or PowerShell scripting`,
  },
  {
    id: 'junior-network-admin',
    label: 'Junior Network Administrator',
    text: `Job Title: Junior Network Administrator
Company: A telecom services provider

Key tasks:
- Configure and maintain switches, routers and wireless access points
- Monitor LAN/WAN performance and resolve connectivity issues
- Document network changes and keep diagrams up to date

Qualifications:
- BS in Computer Science, Telecom or Electrical Engineering
- 2 years of experience in networking
- Strong understanding of TCP/IP, subnetting, DNS and DHCP
- Hands-on with Packet Tracer or real network equipment
- Team player with good communication

Desirable:
- CCNA certification
- Exposure to firewalls and network security`,
  },
];
