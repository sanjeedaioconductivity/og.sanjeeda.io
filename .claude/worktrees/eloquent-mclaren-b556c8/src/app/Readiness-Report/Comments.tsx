import StatusBadge from "./_components/StatusBadge";

type Comment = {
  author: string;
  role?: string;
  date: string; // YYYY-MM-DD
  tag: "Strength" | "Risk" | "Next Step";
  text: string;
};

const comments: Comment[] = [
  {
    author: "Reviewer A",
    role: "Mentor",
    date: "2025-12-14",
    tag: "Strength",
    text: "Strong documentation habit and consistent follow-through on action items.",
  },
  {
    author: "Reviewer B",
    role: "Sponser",
    date: "2025-12-13",
    tag: "Risk",
    text: "Time management during peak workload needs a clearer prioritization method.",
  },
  {
    author: "Reviewer C",
    role: "Interviewer",
    date: "2025-12-15",
    tag: "Next Step",
    text: "Complete the tools walkthrough and add an SOP with screenshots.",
  },
    {
    author: "Reviewer D",
    role: "Candidate",
    date: "2025-12-15",
    tag: "Next Step",
    text: "xyz.",
  },
];

export default function Comments() {
  return (
    <div className="space-y-3">
      {comments.map((c, idx) => (
        <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-slate-900">
              {c.author}
              {c.role ? <span className="font-normal text-slate-600"> • {c.role}</span> : null}
            </div>

            <div className="flex items-center gap-2">
              <TagChip tag={c.tag} />
              <span className="text-xs text-slate-500">{c.date}</span>
            </div>
          </div>

          <p className="mt-2 text-sm text-slate-700">{c.text}</p>

          <div className="mt-3">
            {/* optional: overall item status */}
            <StatusBadge status="On Track" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TagChip({ tag }: { tag: Comment["tag"] }) {
  const cls =
    tag === "Strength"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tag === "Risk"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>
      {tag}
    </span>
  );
}
