import StatusBadge, { ReadinessStatus } from "./_components/StatusBadge";

type Project = {
  name: string;
  impact: string;
  techOrScope: string[];
  status: ReadinessStatus;
};

type Degree = {
  degree: string;
  completion: number;
};

type Certification = {
  certification: string;
  completion: number;
};

const projects: Project[] = [
  {
    name: "Candidate Screening Automation",
    impact: "Reduced manual screening time by 35% through structured scoring + templates.",
    techOrScope: ["Process Design", "Templates", "Stakeholder Alignment"],
    status: "Completed",
  },
  {
    name: "Readiness Report (CRR) Module",
    impact: "Centralized readiness tracking across knowledge, skills, and training.",
    techOrScope: ["Next.js", "TypeScript", "Tailwind"],
    status: "In Progress",
  },
  {
    name: "Training Compliance Tracker",
    impact: "Improved audit readiness with training evidence and reminders.",
    techOrScope: ["Reporting", "Compliance", "Documentation"],
    status: "On Track",
  },
];

const degrees: Degree[] = [
  { degree: "Bachelor of Computer Science", completion: 100 },
  { degree: "Master in Information Systems", completion: 60 },
];

const certifications: Certification[] = [
  { certification: "HR Analytics Certification", completion: 100 },
  { certification: "Project Management (PMP)", completion: 75 },
  { certification: "Agile Scrum Master", completion: 50 },
];

export default function RelevantProjects() {
  return (
    <div>
      <h1 className="font-bold text-base mb-3">3. Relevant Projects</h1>

      {/* Summary */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <span className="text-slate-600">Projects Tracked: </span>
          <span className="font-semibold text-slate-900">
            {projects.length}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 flex items-center gap-2">
          <span className="text-slate-600">Overall Status:</span>
          <StatusBadge status="On Track" />
        </div>
      </div>

      {/* Projects Table (Knowledge-style) */}
      <table className="w-full border-collapse text-left text-sm mb-6">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">Impact</th>
            <th className="px-4 py-3">Tech / Scope</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 bg-white">
          {projects.map((p) => (
            <tr key={p.name} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 align-top text-xs text-slate-900">
                {p.name}
              </td>

              <td className="px-4 py-3 align-top text-xs text-slate-700">
                {p.impact}
              </td>

              <td className="px-4 py-3 align-top text-xs text-slate-700">
                {p.techOrScope.join(", ")}
              </td>

              <td className="px-4 py-3 align-top">
                <StatusBadge status={p.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Degree & Certification (Knowledge-style, side-by-side) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Degree Table */}
        <div>
          <h2 className="font-semibold text-sm mb-2">Degrees</h2>
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3">Degree</th>
                <th className="px-4 py-3">Completion (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {degrees.map((d) => (
                <tr key={d.degree} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-xs text-slate-700">
                    {d.degree}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-900">
                    {d.completion}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Certification Table */}
        <div>
          <h2 className="font-semibold text-sm mb-2">Certifications</h2>
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3">Certification</th>
                <th className="px-4 py-3">Completion (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {certifications.map((c) => (
                <tr key={c.certification} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-xs text-slate-700">
                    {c.certification}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-900">
                    {c.completion}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
