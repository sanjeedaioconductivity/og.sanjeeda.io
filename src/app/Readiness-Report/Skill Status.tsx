 import StatusBadge, { ReadinessStatus } from "./_components/StatusBadge";

type SkillRow = {
  skill: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  status: ReadinessStatus;
  notes?: string;
};

const skills: SkillRow[] = [
  {
    skill: "Communication",
    level: "Advanced",
    status: "On Track",
    notes: "Clear updates and stakeholder alignment.",
  },
  {
    skill: "Problem Solving",
    level: "Intermediate",
    status: "In Progress",
    notes: "Improving structured RCA.",
  },
  {
    skill: "Time Management",
    level: "Intermediate",
    status: "Needs Attention",
    notes: "Focus on prioritization under load.",
  },
  {
    skill: "Documentation",
    level: "Advanced",
    status: "Completed",
    notes: "Strong SOP + knowledge base contributions.",
  },
];

export default function SkillStatus() {
  return (
    <div>
      <h1 className="font-bold text-base mb-2">2. Skill Status</h1>
      {/* Summary row (same feel as Knowledge page) */}
      <div className="mb-3 flex flex-wrap items-center gap-6 text-xs">
        
        <div className="px-3 py-2">
          <span className="text-slate-600">Skills Tracked: </span>
          <span className="font-semibold text-slate-900">{skills.length}</span>
        </div>

        <div className=" px-3 py-2 flex items-center gap-2">
          <span className="text-slate-600">Overall Status:</span>
          <StatusBadge status="On Track" />
        </div>
      </div>

      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="px-4 py-3">Skill</th>
            <th className="px-4 py-3">Level</th>
            <th className="px-4 py-3">Notes</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 bg-white">
          {skills.map((s) => (
            <tr key={s.skill} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 align-top text-xs text-slate-900">
                {s.skill}
              </td>

              <td className="px-4 py-3 align-top text-xs text-slate-700">
                {s.level}
              </td>

              <td className="px-4 py-3 align-top text-xs text-slate-700">
                {s.notes ?? "—"}
              </td>

              <td className="px-4 py-3 align-top">
                <StatusBadge status={s.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
