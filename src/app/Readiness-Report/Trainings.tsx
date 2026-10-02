import StatusBadge, { ReadinessStatus } from "./_components/StatusBadge";

type Training = {
  title: string;
  provider?: string;
  status: ReadinessStatus;
  evidence?: string;
};

const trainings: Training[] = [
  {
    title: "Workplace Communication",
    provider: "Internal",
    status: "Completed",
    evidence: "Certificate uploaded",
  },
  {
    title: "Role-Specific Tools",
    provider: "Team",
    status: "In Progress",
    evidence: "50% modules done",
  },
  {
    title: "Quality & Compliance",
    provider: "Internal",
    status: "Planned",
    evidence: "Scheduled for next week",
  },
];

export default function Trainings() {
  return (
    <div>
      <h1 className="font-bold text-base mb-3">4. Trainings</h1>

      {/* Knowledge-style table */}
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="px-4 py-3">Training</th>
            <th className="px-4 py-3">Provider</th>
            <th className="px-4 py-3">Evidence</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 bg-white">
          {trainings.map((t) => (
            <tr key={t.title} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 align-top text-xs text-slate-900">
                {t.title}
              </td>

              <td className="px-4 py-3 align-top text-xs text-slate-700">
                {t.provider ?? "—"}
              </td>

              <td className="px-4 py-3 align-top text-xs text-slate-700">
                {t.evidence ?? "—"}
              </td>

              <td className="px-4 py-3 align-top">
                <StatusBadge status={t.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
