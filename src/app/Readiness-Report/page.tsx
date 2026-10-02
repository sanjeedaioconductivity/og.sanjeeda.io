import KnowledgeStatus from "./Knowledge Status";
import SkillStatus from "./Skill Status";
import RelevantProjects from "./Relevant Projects";
import Trainings from "./Trainings";
import AttributeFitness from "./Attribute Fitness";
import Comments from "./Comments";
import Link from "next/link";

export default function ReadinessReportPage() {
  return (
    <main className="min-h-screen bg-slate-200 py-6">
      {/* A4 Paper Preview */}
      <div className="mx-auto w-[210mm] min-h-[297mm] bg-white shadow-xl">
        <div className="px-[12mm] py-[12mm]">
          {/* Header */}
          <header className="mb-5 border-b border-slate-200 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Candidate Readiness Report (CRR)
                </h1>
              </div>

              {/* Hide in PDF/print */}
              <Link
                href="/api/crr/pdf"
                target="_blank"
                className="no-print inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Download PDF
              </Link>
            </div>
          </header>

          {/* Content (A4 layout) */}
          <div className="space-y-4">
              <KnowledgeStatus />
              <SkillStatus />  
              <RelevantProjects />
              <Trainings />

            {/* Optional page break before long sections */}
            <div className="page-break" />

            <Section title="5. Attribute Fitness">
              <AttributeFitness />
            </Section>

            <Section title="6. Comments">
              <Comments />
            </Section>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
