export type Mentor = {
  mentorId: string;
  fullName: string;
  email: string;
};

export type WeeklySchedule = {
  week: string;
  module: string;
  sessionTitle: string;
  focus: string;
  activity: string;
  output: string;
  duration: number | string;
  status: string;
  notes: string;
};

export type SessionFlow = {
  week: string;
  activity: string;
  deliveryMode: string;
  resourceTemplate: string;
  portfolioLink: string;
};

export type CapstoneTimeline = {
  week: string;
  component: string;
  deliverable: string;
  due: string;
  status: string;
  notes: string;
};

export type PortfolioItem = {
  no: number | string;
  item: string;
  relatedWeek: string;
  purpose: string;
  status: string;
  evidenceLink: string;
  facilitatorRemarks: string;
};

export type EvaluationItem = {
  area: string;
  weightage: number | string;
  evidenceRequired: string;
  evaluatorNotes: string;
};

export type Program = {
  programId?: string;
  programName: string;
  title: string;
  category: string;
  recommendedDuration: string;
  frequency: string;
  sessionDuration: string;
  totalHours: number | string;
  trainingStyle: string;
  finalOutput: string;
  programPromise: string;
  startDate: string;
  endDate: string;
  status: string;
  assignedMentorId: string;
  assignedMentorName: string;
  assignedMentorEmail: string;
  weeklySchedule: WeeklySchedule[];
  sessionFlow: SessionFlow[];
  capstoneTimeline: CapstoneTimeline[];
  portfolioChecklist: PortfolioItem[];
  evaluationPlan: EvaluationItem[];
  createdAt?: string;
};

export const emptyProgram: Program = {
  programName: "",
  title: "",
  category: "",
  recommendedDuration: "",
  frequency: "",
  sessionDuration: "",
  totalHours: "",
  trainingStyle: "",
  finalOutput: "",
  programPromise: "",
  startDate: "",
  endDate: "",
  status: "Draft",
  assignedMentorId: "",
  assignedMentorName: "",
  assignedMentorEmail: "",
  weeklySchedule: [],
  sessionFlow: [],
  capstoneTimeline: [],
  portfolioChecklist: [],
  evaluationPlan: [],
};

export const ROW_STATUS_OPTIONS = [
  "Not Started",
  "In Progress",
  "Completed",
  "Deferred",
];

/**
 * Source: Professional_Grooming_Program_HR_Freshers_Training_Schedule.xlsx
 * sheet "Portfolio Checklist" (20 items).
 */
export const PGP_PORTFOLIO_TEMPLATE: PortfolioItem[] = [
  ["Personal HR Sustainability Plan", "Week 1", "Shows professional discipline, ethics, and development plan"],
  ["HR Role Map", "Week 1", "Clarifies HR functions and fresher role expectations"],
  ["Job Description", "Week 2", "Demonstrates job analysis and role profiling skill"],
  ["Recruitment Tracker", "Week 2", "Shows recruitment systemization and funnel tracking"],
  ["Interview Scorecard", "Week 2", "Shows structured and objective assessment skill"],
  ["Candidate Communication Template", "Week 2", "Shows candidate experience and employer branding discipline"],
  ["Onboarding Checklist", "Week 3", "Shows readiness to manage joining and induction"],
  ["Employee Master Data Sheet", "Week 3", "Shows digital HR record keeping"],
  ["HR Documentation Checklist", "Week 4", "Shows compliance and audit readiness"],
  ["Basic HR Policy Draft", "Week 4", "Shows policy drafting ability"],
  ["Payroll Input Sheet", "Week 6", "Shows payroll coordination capability"],
  ["Training Calendar", "Week 6", "Shows training coordination capability"],
  ["Employee Engagement Plan", "Week 7", "Shows engagement planning skill"],
  ["Stakeholder Matrix", "Week 7", "Shows stakeholder identification and communication planning"],
  ["Conflict Case Report", "Week 8", "Shows grievance documentation and neutrality"],
  ["HR Project Plan", "Week 8", "Shows small HR project management skill"],
  ["HR Dashboard", "Week 5", "Shows HR analytics and reporting capability"],
  ["CV", "Week 9", "Shows employability readiness"],
  ["LinkedIn Profile Outline", "Week 9", "Shows professional visibility and personal branding"],
  ["HR Career Roadmap", "Week 9", "Shows personal career management direction"],
].map(([item, relatedWeek, purpose], index) => ({
  no: index + 1,
  item,
  relatedWeek,
  purpose,
  status: "Not Started",
  evidenceLink: "",
  facilitatorRemarks: "",
}));

/**
 * Source: same workbook, sheet "Evaluation Plan".
 * Weightage is stored as a percentage (the sheet holds fractions: 0.1 -> 10).
 * The six areas total 100%.
 */
export const PGP_EVALUATION_TEMPLATE: EvaluationItem[] = [
  ["Attendance and participation", 10, "Attendance, punctuality, participation, professionalism"],
  ["Weekly assignments", 25, "Completed templates and module assignments"],
  ["Recruitment and onboarding simulation", 15, "Mock interview, JD, scorecard, onboarding checklist"],
  ["HR dashboard task", 15, "Excel dashboard and management interpretation"],
  ["Conflict and stakeholder role play", 10, "Role-play observation and documentation"],
  ["Final capstone project", 25, "Complete HR starter system and presentation"],
].map(([area, weightage, evidenceRequired]) => ({
  area: area as string,
  weightage: weightage as number,
  evidenceRequired: evidenceRequired as string,
  evaluatorNotes: "",
}));

/** Re-numbers the `no` column so it always matches row order. */
export function renumberPortfolio(rows: PortfolioItem[]): PortfolioItem[] {
  return rows.map((row, index) => ({ ...row, no: index + 1 }));
}

/** Weightage total, tolerant of blank or non-numeric cells. */
export function totalWeightage(rows: EvaluationItem[]): number {
  return rows.reduce((sum, row) => {
    const value = Number(row.weightage);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}

/** Sum of the hours entered against each weekly session. */
export function totalScheduledHours(rows: WeeklySchedule[]): number {
  return rows.reduce((sum, row) => {
    const value = Number(row.duration);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}

/** Sorts "Week 10" after "Week 9" instead of lexically before it. */
export function compareWeeks(a: string, b: string): number {
  const parse = (value: string) => {
    const match = /(\d+)/.exec(value || "");
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  };

  return parse(a) - parse(b) || (a || "").localeCompare(b || "");
}
