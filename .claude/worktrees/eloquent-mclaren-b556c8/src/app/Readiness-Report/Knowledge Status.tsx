import StatusBadge, { ReadinessStatus } from "./_components/StatusBadge";

type KnowledgeTask = {
  id: string;
  keyResultArea: string;
  assignedTask: string;
  status: ReadinessStatus;
  owner?: string;
  due?: string; // YYYY-MM-DD
};

const data: KnowledgeTask[] = [
  {
    id: "K-001",
    keyResultArea: "Domain Fundamentals",
    assignedTask: "Explain end-to-end workflow and key concepts",
    status: "On Track",
    owner: "Candidate",
    due: "2025-12-22",
  },
  {
    id: "K-002",
    keyResultArea: "Process Knowledge",
    assignedTask: "Document SOP: onboarding + handover checklist",
    status: "In Progress",
    owner: "Candidate",
    due: "2025-12-18",
  },
  {
    id: "K-003",
    keyResultArea: "Tools & Systems",
    assignedTask: "Create a demo: reporting dashboard walkthrough",
    status: "Needs Attention",
    owner: "Candidate",
    due: "2025-12-20",
  },
  {
    id: "K-004",
    keyResultArea: "Compliance / Quality",
    assignedTask: "Pass quality quiz (>= 85%) + summarize learning",
    status: "Planned",
    owner: "Candidate",
    due: "2025-12-28",
  },
];

export default function KnowledgeStatus() {
  return (
    <div>
      <h1 className="font-bold text-base">1. Knowledge Status</h1>

      {/* ✅ Legend row (so Legend is used and ESLint error is fixed) */}
      <div className="mt-2 mb-3 flex flex-wrap gap-2">
        <Legend label="On Track" />
        <Legend label="In Progress" />
        <Legend label="Needs Attention" />
        <Legend label="Planned" />
      </div>

      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="px-4 py-3">Key Result Area</th>
            <th className="px-4 py-3">Assigned Tasks</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Due</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 bg-white">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 align-top">
                <div className="text-slate-900 text-xs">{row.keyResultArea}</div>
              </td>

              <td className="px-4 py-3 align-top text-slate-700 text-xs">
                {row.assignedTask}
              </td>

              <td className="px-4 py-3 align-top text-slate-700 text-xs">
                {row.owner ?? "—"}
              </td>

              <td className="px-4 py-3 align-top text-slate-700 text-xs">
                {row.due ?? "—"}
              </td>

              <td className="px-4 py-3 align-top">
                <StatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Legend({ label }: { label: ReadinessStatus }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
      <StatusBadge status={label} />
    </div>
  );
}
