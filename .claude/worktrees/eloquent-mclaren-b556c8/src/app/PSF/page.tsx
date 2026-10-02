export default function PositionSuccessFormPage() {
  const positionInfo = {
    title: '.NET Developer',
    division: 'OMS (Order Management System)',
    reportsTo: 'Sr. Software Engineer',
    spanOfControl: '-',
    jobGrade: '-',
    location: 'Karachi',
    departmentGoals: [
      'Develop scalable, secure, and high-performance software aligned with OMEX technology roadmap.',
      'Ensure maintainable code and support DevOps, CI/CD, and cloud integration practices.',
      'Maintain service reliability and responsiveness across global time zones.',
    ],
  };

  const successAreas = [
    'C#, .NET Framework, OOP, Design Patterns',
    'Data Structures, Multithreading, Performance Optimization',
    'SQL & NoSQL Databases, Redis',
    'SDLC methodologies (Agile, Scrum, XP)',
    'Dev tools (Git, SVN, Jira, TDD Tools)',
    'CI/CD tools (GitScrum, Azure DevOps, etc.)',
    'Cloud basics (AWS, Azure, GCP)',
    'Logging tools (e.g., ELK stack)',
    'Deliver clean, testable, and well-documented code within deadlines',
    'Effective communication and collaboration across distributed teams',
    'Ability to troubleshoot and debug independently',
  ];

  const jdPoints = [
    'Develop and maintain high-performance applications using C#, .NET Framework, and object-oriented principles.',
    'Implement multithreading, parallel computing, and performance/memory profiling techniques.',
    'Work with SQL and NoSQL databases, including in-memory structures like Redis.',
    'Integrate and manage communication using message brokers such as MSMQ, AMQ, or Kafka.',
  ];

  const projects = [
    'Development and maintenance of web and client/server socket applications',
    'Integration of message brokers and real-time communication APIs',
    'Design and development of data-intensive components (including in-memory structures)',
    'Participation in sprint planning, code reviews, and testing cycles',
    'Migration or optimization of legacy systems and performance profiling',
  ];

  const challenges = [
    'Domain Knowledge',
    'Effective Coordination',
    'Client Communication',
    'Optimizing System Performance',
    'Cross-Functional Alignment',
  ];

  const requiredExpertise = {
    education: 'BSCS',
    experience: '2 years minimum',
    personality: [
      'Detail Oriented',
      'Committed & Reliable',
      'Collaborative Mindset',
      'Focused & Self-Driven',
    ],
  };

  return (
    <div className="mt-12 min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-[#0f172a] via-[#1d4ed8] to-[#0f766e] px-6 py-8 text-white sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">
                  Position Success Form
                </p>
                <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{positionInfo.title}</h1>
                <p className="mt-3 max-w-3xl text-sm text-white/85 sm:text-base">
                  A professional role overview covering position details, key success areas, job scope,
                  major challenges, and required expertise for success.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[430px]">
                <StatCard label="Department" value={positionInfo.division} />
                <StatCard label="Reports To" value={positionInfo.reportsTo} />
                <StatCard label="Location" value={positionInfo.location} />
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-12 lg:p-8">
            <section className="space-y-6 lg:col-span-8">
              <Card title="Position Information" subtitle="Core details of the role and team context.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoItem label="Position Title" value={positionInfo.title} />
                  <InfoItem label="Division / Department" value={positionInfo.division} />
                  <InfoItem label="Reports To" value={positionInfo.reportsTo} />
                  <InfoItem label="Span of Control" value={positionInfo.spanOfControl} />
                  <InfoItem label="Job Grade" value={positionInfo.jobGrade} />
                  <InfoItem label="Job Location" value={positionInfo.location} />
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-800">Department Goals</h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {positionInfo.departmentGoals.map((goal) => (
                      <li key={goal} className="flex gap-3">
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              <Card title="Success Factors at Job" subtitle="Skills, behaviors, and capabilities needed to perform well.">
                <div className="grid gap-3 sm:grid-cols-2">
                  {successAreas.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm"
                    >
                      <div className="flex gap-3">
                        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          ✓
                        </span>
                        <span>{item}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Job Description" subtitle="Primary responsibilities of the position.">
                <div className="space-y-3">
                  {jdPoints.map((point, index) => (
                    <div key={point} className="flex gap-4 rounded-2xl bg-slate-50 p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-slate-700">{point}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Projects Required from this Position" subtitle="Typical workstreams and delivery expectations.">
                <div className="grid gap-3">
                  {projects.map((project) => (
                    <div key={project} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      {project}
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            <aside className="space-y-6 lg:col-span-4">
              <Card title="Major Challenges / Problems" subtitle="Critical issues the role is expected to manage.">
                <div className="flex flex-wrap gap-2">
                  {challenges.map((challenge) => (
                    <span
                      key={challenge}
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800"
                    >
                      {challenge}
                    </span>
                  ))}
                </div>
              </Card>

              <Card title="Required Expertise for Success" subtitle="Education, experience, and personality profile.">
                <div className="space-y-4">
                  <InfoItem label="Education Required" value={requiredExpertise.education} />
                  <InfoItem label="Experience Required" value={requiredExpertise.experience} />
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-800">Personality Required</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {requiredExpertise.personality.map((trait) => (
                        <span
                          key={trait}
                          className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Readiness • Opportunities • Success" subtitle="A concise success snapshot for hiring and evaluation.">
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <div className="font-semibold text-emerald-800">Readiness</div>
                    <p className="mt-1">Candidate should have a solid .NET foundation with hands-on experience in enterprise development practices.</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <div className="font-semibold text-blue-800">Opportunities</div>
                    <p className="mt-1">The role offers exposure to performance optimization, cloud integration, CI/CD, and distributed team collaboration.</p>
                  </div>
                  <div className="rounded-2xl bg-violet-50 p-4">
                    <div className="font-semibold text-violet-800">Success</div>
                    <p className="mt-1">Success is measured by reliable delivery, maintainable code quality, system responsiveness, and teamwork across global stakeholders.</p>
                  </div>
                </div>
              </Card>

              <Card title="Company Contact" subtitle="Reference details captured in the source document.">
                <div className="space-y-2 text-sm text-slate-700">
                  <p>B-65, Block 2, Gulshan-e-Iqbal, Karachi, Sindh, Pakistan 75300</p>
                  <p>+92 331 2465537</p>
                  <p>+92 332 2302442</p>
                  <p>www.conductivity.com.pk</p>
                  <p>info@conductivity.com.pk</p>
                  <p>Consultancy (Pvt.) Ltd.</p>
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">{label}</div>
      <div className="mt-2 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
