export type ReadinessStatus =
  | "On Track"
  | "Needs Attention"
  | "At Risk"
  | "Completed"
  | "In Progress"
  | "Planned";

const styles: Record<ReadinessStatus, string> = {
  "On Track": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Needs Attention": "bg-amber-50 text-amber-700 border-amber-200",
  "At Risk": "bg-rose-50 text-rose-700 border-rose-200",
  "Completed": "bg-sky-50 text-sky-700 border-sky-200",
  "In Progress": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Planned": "bg-slate-50 text-slate-700 border-slate-200",
};

export default function StatusBadge({ status }: { status: ReadinessStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
