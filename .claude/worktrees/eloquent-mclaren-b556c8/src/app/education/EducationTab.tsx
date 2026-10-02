"use client";

import React, { useMemo, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css"
type Proficiency = "Beginner" | "Intermediate" | "Advanced";
type SkillType = "Technical" | "Soft";

type SkillRequirement = {
 id: string;
 name: string;
 type: SkillType;
 requiredLevel: Proficiency;
 weight?: number;
};

type JobRole = {
 id: string;
 fieldId: string;
 title: string;
 description: string;
 skills: SkillRequirement[];
};

type CareerField = {
 id: string;
 name: string;
 shortDesc?: string;
};

type SubDepartment = {
 id: string;
 fieldId: string;
 name: string;
 roles: JobRole[];
};

type UserSkill = {
 id: string;
 name: string;
 level: Proficiency;
 type: SkillType;
 source?: "Profile" | "Assessment";
};

type JobOpening = {
 id: string;
 roleId: string;
 title: string;
 company: string;
 location: string;
 isRemote?: boolean;
};

type MatchResult = {
 matchPercent: number;
 missingSkills: SkillRequirement[];
 weakSkills: Array<{ skill: SkillRequirement; userLevel: Proficiency; delta: number }>;
 recommendedLearningPath: Array<{ skillName: string; targetLevel: Proficiency; steps: string[] }>;
 recommendedOpenings: JobOpening[];
};

const PROF_TO_NUM: Record<Proficiency, number> = {
 Beginner: 1,
 Intermediate: 2,
 Advanced: 3,
};

function normalizeSkillName(s: string): string {
 return s.trim().toLowerCase();
}

function clamp(n: number, min: number, max: number): number {
 return Math.max(min, Math.min(max, n));
}

function getSkillScore(user: Proficiency | null, required: Proficiency): number {
 if (!user) return 0;
 const u = PROF_TO_NUM[user];
 const r = PROF_TO_NUM[required];
 if (u >= r) return 1;
 return clamp(u / r, 0, 0.999);
}

function buildLearningSteps(skillName: string, fromLevel: Proficiency, toLevel: Proficiency, type: SkillType): string[] {
 const from = PROF_TO_NUM[fromLevel];
 const to = PROF_TO_NUM[toLevel];
 const steps: string[] = [];

 steps.push(`Identify a learning roadmap for ${skillName} (${type}).`);
 if (from < 2 && to >= 2) steps.push("Complete beginner fundamentals + small exercises.");
 if (from < 3 && to >= 3) steps.push("Build 1–2 projects/case studies to demonstrate competency.");
 steps.push("Validate with a short assessment + add evidence to your profile (projects/certs/work).");

 if (from >= to) steps.unshift("You already meet the requirement — keep it fresh with practice.");
 return steps;
}

function computeMatch(role: JobRole, userSkills: UserSkill[], openings: JobOpening[], minOpeningMatchPercent = 60): MatchResult {
 const userMap = new Map<string, UserSkill>();
 for (const us of userSkills) userMap.set(normalizeSkillName(us.name), us);

 const missingSkills: SkillRequirement[] = [];
 const weakSkills: Array<{ skill: SkillRequirement; userLevel: Proficiency; delta: number }> = [];

 let totalWeight = 0;
 let weightedScoreSum = 0;

 for (const req of role.skills) {
  const w = req.weight ?? 1;
  totalWeight += w;

  const user = userMap.get(normalizeSkillName(req.name)) ?? null;
  const score = getSkillScore(user?.level ?? null, req.requiredLevel);
  weightedScoreSum += score * w;

  if (!user) {
   missingSkills.push(req);
  } else if (PROF_TO_NUM[user.level] < PROF_TO_NUM[req.requiredLevel]) {
   weakSkills.push({
    skill: req,
    userLevel: user.level,
    delta: PROF_TO_NUM[req.requiredLevel] - PROF_TO_NUM[user.level],
   });
  }
 }

 const matchPercent = totalWeight === 0 ? 0 : Math.round((weightedScoreSum / totalWeight) * 100);

 const recommendedLearningPath = [
  ...missingSkills.map((s) => ({
   skillName: s.name,
   targetLevel: s.requiredLevel,
   steps: buildLearningSteps(s.name, "Beginner", s.requiredLevel, s.type),
  })),
  ...weakSkills.map((w) => ({
   skillName: w.skill.name,
   targetLevel: w.skill.requiredLevel,
   steps: buildLearningSteps(w.skill.name, w.userLevel, w.skill.requiredLevel, w.skill.type),
  })),
 ].slice(0, 10);

 const recommendedOpenings =
  matchPercent >= minOpeningMatchPercent ? openings.filter((o) => o.roleId === role.id) : [];

 return { matchPercent, missingSkills, weakSkills, recommendedLearningPath, recommendedOpenings };
}

/** ---------------- Mock Data ---------------- */

const MOCK_FIELDS: CareerField[] = [
 { id: "hr", name: "HR", shortDesc: "People ops, recruitment, policies" },
 { id: "finance", name: "Finance", shortDesc: "Accounting, analysis, FP&A" },
 { id: "sales", name: "Sales", shortDesc: "Revenue, client acquisition, accounts"},
 { id: "marketing", name: "Marketing", shortDesc: "Growth, content, brand" },
 { id: "customer_relation", name: "Customer Relation", shortDesc: "Service, communication, public engagement" },
 { id: "supply_chain_management", name: "Supply Chain Management", shortDesc: "Procurement, logistics, inventory, production" },
 { id: "it", name: "IT", shortDesc: "Software, systems, data, networks" },
 { id: "product_innovation", name: "Product & Innovation", shortDesc: "Product strategy, roadmap, innovation" },
 { id: "program_delivery_management", name: "Program & Delivery Management", shortDesc: "Projects, PMO, portfolio delivery" },
 { id: "operations_process_excellence", name: "Operations & Process Excellence", shortDesc: "Business analysis, process improvement, governance" },
 { id: "engineering", name: "Engineering", shortDesc: "Civil, mechanical, electrical" },
 { id: "medical", name: "Medical", shortDesc: "Clinical and healthcare roles" },
 { id: "education", name: "Education", shortDesc: "Teaching, training, curriculum" },
];

const HR_DEPARTMENT_CONTENT = [
 {
  id: "hr_talent_acquisition",
  name: "Talent Acquisition",
  roles: [
   {
    title: "HR Intern",
    skills: ["CV screening", "Job posting", "Interview coordination", "HR documentation"],
   },
   {
    title: "TA Officer",
    skills: ["Candidate sourcing", "Interview scheduling", "Database management", "Offer drafting"],
   },
   {
    title: "Senior TA Specialist",
    skills: ["Employer branding", "Bulk hiring", "Stakeholder coordination", "Recruitment analytics"],
   },
   {
    title: "TA Manager",
    skills: ["Workforce planning", "Recruitment budgeting", "Team supervision", "Policy compliance"],
   },
   {
    title: "Head of TA",
    skills: ["Hiring strategy", "Employer brand leadership", "Executive hiring", "Talent pipeline development"],
   },
  ],
 },
 {
  id: "hr_comp_benefits",
  name: "Compensation & Benefits",
  roles: [
   {
    title: "HR Assistant",
    skills: ["Payroll data entry", "Leave records", "Benefits documentation", "Excel reporting"],
   },
   {
    title: "C&B Officer",
    skills: ["Salary processing", "EOBI/SESSI handling", "Tax deductions", "Employee queries"],
   },
   {
    title: "Senior Analyst",
    skills: ["Salary benchmarking", "Incentive planning", "Benefits cost analysis", "HRIS reporting"],
   },
   {
    title: "Compensation Manager",
    skills: ["Pay structure design", "Policy formulation", "Compliance oversight", "Budgeting"],
   },
   {
    title: "Head of Compensation",
    skills: ["Reward strategy", "Executive compensation planning", "Regulatory alignment", "Financial control"],
   },
  ],
 },
 {
  id: "hr_org_dev",
  name: "Organizational Development",
  roles: [
   {
    title: "Coordinator",
    skills: ["Training logistics", "Feedback collection", "Documentation", "HR reporting"],
   },
   {
    title: "OD Officer",
    skills: ["Performance appraisal support", "Competency mapping", "Employee surveys", "Data analysis"],
   },
   {
    title: "OD Specialist",
    skills: ["KPI framework design", "Succession planning", "Engagement strategy", "Change support"],
   },
   {
    title: "OD Manager",
    skills: ["Organizational restructuring", "Leadership development", "Performance governance", "HR strategy alignment"],
   },
   {
    title: "Head of OD",
    skills: ["Culture transformation", "Workforce strategy", "Executive advisory", "Organizational effectiveness"],
   },
  ],
 },
 {
  id: "hr_payroll",
  name: "Payroll Management",
  roles: [
   {
    title: "Assistant",
    skills: ["Attendance verification", "Data entry", "Pay slip preparation", "Record maintenance"],
   },
   {
    title: "Officer",
    skills: ["Salary calculation", "Overtime processing", "Tax deduction", "Compliance filing"],
   },
   {
    title: "Senior Executive",
    skills: ["Payroll reconciliation", "Statutory compliance", "Audit coordination", "MIS reports"],
   },
   {
    title: "Payroll Manager",
    skills: ["Payroll system control", "Risk management", "Policy enforcement", "Team supervision"],
   },
  ],
 },
 {
  id: "hr_change_management",
  name: "Change Management",
  roles: [
   {
    title: "Officer",
    skills: ["Change documentation", "Training coordination"],
   },
   {
    title: "Manager",
    skills: ["Change strategy", "Stakeholder engagement"],
   },
   {
    title: "Head",
    skills: ["Organizational transformation leadership"],
   },
  ],
 },
 {
  id: "hr_compliance",
  name: "Compliance",
  roles: [
   {
    title: "Officer",
    skills: ["Regulatory documentation", "Monitoring reports", "Policy implementation", "Compliance checks"],
   },
   {
    title: "Executive",
    skills: ["Regulatory filing", "Audit coordination", "Compliance tracking", "Risk documentation"],
   },
   {
    title: "Senior Specialist",
    skills: ["Regulatory advisory", "Internal control review", "Policy drafting", "Compliance analytics"],
   },
   {
    title: "Manager",
    skills: ["Compliance framework development", "Regulatory communication", "Team oversight", "Risk mitigation"],
   },
   {
    title: "Chief Compliance Officer",
    skills: ["Regulatory governance", "Compliance strategy", "Institutional oversight", "Legal"],
   },
  ],
 },
 {
  id: "hr_legal_affairs",
  name: "Legal Affairs",
  roles: [
   {
    title: "Officer",
    skills: ["Contract review", "Case documentation"],
   },
   {
    title: "Senior",
    skills: ["Legal drafting", "Compliance review"],
   },
   {
    title: "Manager",
    skills: ["Litigation management"],
   },
   {
    title: "Head",
    skills: ["Corporate legal governance"],
   },
  ],
 },
];

const FINANCE_DEPARTMENT_CONTENT = [
 {
  id: "finance_corporate_finance",
  name: "Corporate Finance",
  roles: [
   {
    title: "Finance Executive",
    skills: ["Voucher entry", "Bank reconciliation", "Ledger posting", "Reporting"],
   },
   {
    title: "Financial Analyst",
    skills: ["Budget preparation", "Financial modeling", "Variance analysis", "Forecasting"],
   },
   {
    title: "Senior Analyst",
    skills: ["Cost optimization", "Financial planning", "Capital budgeting", "Performance review"],
   },
   {
    title: "Finance Manager",
    skills: ["Budget control", "Team supervision", "Compliance management", "Cash flow oversight"],
   },
   {
    title: "Finance Director",
    skills: ["Capital structure planning", "Financial strategy", "Board reporting", "Risk control"],
   },
   {
    title: "CFO",
    skills: ["Corporate finance leadership", "Investor relations", "Governance oversight", "Enterprise risk strategy"],
   },
  ],
 },
 {
  id: "finance_fpa",
  name: "Financial Planning & Analysis (FP&A)",
  roles: [
   {
    title: "Executive",
    skills: ["Data consolidation", "Budget templates", "Excel modeling", "Reporting support"],
   },
   {
    title: "Analyst",
    skills: ["Forecasting", "Cost analysis", "KPI tracking", "Performance dashboards"],
   },
   {
    title: "Senior Analyst",
    skills: ["Financial scenario planning", "Margin analysis", "Strategic insights", "Management reporting"],
   },
   {
    title: "FP&A Manager",
    skills: ["Financial planning cycle management", "Budgeting strategy", "Variance control", "Stakeholder reporting"],
   },
   {
    title: "Finance Director",
    skills: ["Long-term financial planning", "Capital allocation", "Strategic financial oversight", "Board presentation"],
   },
  ],
 },
 {
  id: "finance_taxation",
  name: "Taxation",
  roles: [
   {
    title: "Assistant",
    skills: ["Tax filing support", "Documentation", "Data compilation", "FBR portal handling"],
   },
   {
    title: "Officer",
    skills: ["Income tax returns", "Sales tax filing", "Withholding tax compliance", "Audit support"],
   },
   {
    title: "Senior Consultant",
    skills: ["Tax advisory", "Compliance review", "Risk assessment", "Client handling"],
   },
   {
    title: "Tax Manager",
    skills: ["Tax planning", "Regulatory compliance", "Audit defense", "Team supervision"],
   },
   {
    title: "Head of Tax",
    skills: ["Corporate tax strategy", "Policy compliance", "Regulatory engagement", "Financial risk control"],
   },
  ],
 },
 {
  id: "finance_treasury",
  name: "Treasury",
  roles: [
   {
    title: "Officer",
    skills: ["Bank coordination", "Payment processing", "Liquidity tracking", "Documentation"],
   },
   {
    title: "Analyst",
    skills: ["Cash flow forecasting", "Fund allocation", "Risk assessment", "Banking reconciliation"],
   },
   {
    title: "Senior Analyst",
    skills: ["Investment planning", "Debt management", "Financial risk mitigation", "Reporting"],
   },
   {
    title: "Treasury Manager",
    skills: ["Liquidity strategy", "Banking negotiations", "Capital management", "Compliance oversight"],
   },
  ],
 },
 {
  id: "finance_risk_management",
  name: "Risk Management",
  roles: [
   {
    title: "Officer",
    skills: ["Risk documentation", "Compliance monitoring", "Reporting support", "Policy review"],
   },
   {
    title: "Analyst",
    skills: ["Risk assessment models", "Operational risk analysis", "Audit coordination", "Mitigation planning"],
   },
   {
    title: "Senior Analyst",
    skills: ["Enterprise risk mapping", "Regulatory risk analysis", "Fraud detection", "Reporting"],
   },
   {
    title: "Risk Manager",
    skills: ["Risk framework design", "Compliance governance", "Team supervision", "Strategic oversight"],
   },
   {
    title: "Head of Risk",
    skills: ["Enterprise risk leadership", "Governance advisory", "Regulatory liaison", "Crisis management"],
   },
  ],
 },
 {
  id: "finance_commercial_banking",
  name: "Commercial Banking",
  roles: [
   {
    title: "Banking Officer",
    skills: ["Account opening", "Cash handling", "KYC verification", "Customer servicing"],
   },
   {
    title: "Relationship Officer",
    skills: ["Deposit mobilization", "Loan processing", "Client coordination", "Target achievement"],
   },
   {
    title: "Senior RM",
    skills: ["Corporate portfolio handling", "Credit assessment", "Risk evaluation", "Revenue growth"],
   },
   {
    title: "Branch Manager",
    skills: ["Branch operations control", "Team supervision", "Compliance management", "Sales strategy"],
   },
   {
    title: "Regional Manager",
    skills: ["Multi-branch oversight", "Performance monitoring", "Regulatory compliance", "Strategic planning"],
   },
  ],
 },
 {
  id: "finance_corporate_banking",
  name: "Corporate Banking",
  roles: [
   {
    title: "Credit Officer",
    skills: ["Financial statement analysis", "Credit proposals", "Risk grading", "Documentation"],
   },
   {
    title: "RM",
    skills: ["Corporate client handling", "Loan structuring", "Negotiation", "Portfolio growth"],
   },
   {
    title: "Senior RM",
    skills: ["Large exposure management", "Syndicate financing", "Credit risk assessment", "Compliance review"],
   },
   {
    title: "Manager",
    skills: ["Corporate portfolio supervision", "Revenue planning", "Risk mitigation", "Team leadership"],
   },
   {
    title: "Head",
    skills: ["Corporate banking strategy", "Credit governance", "Regulatory liaison", "Institutional growth"],
   },
  ],
 },
 {
  id: "finance_islamic_banking",
  name: "Islamic Banking",
  roles: [
   {
    title: "Officer",
    skills: ["Account management", "Islamic product handling", "Documentation"],
   },
   {
    title: "Shariah Officer",
    skills: ["Shariah audit", "Product compliance", "Reporting", "Regulatory coordination"],
   },
   {
    title: "Senior Manager",
    skills: ["Islamic financing portfolio", "Product structuring (Murabaha, Ijarah)", "Risk monitoring"],
   },
   {
    title: "Head",
    skills: ["Shariah governance", "Islamic banking strategy", "Regulatory alignment", "Product development"],
   },
  ],
 },
 {
  id: "finance_microfinance",
  name: "Microfinance",
  roles: [
   {
    title: "Loan Officer",
    skills: ["Field verification", "Loan disbursement", "Recovery follow-up", "Client assessment"],
   },
   {
    title: "Credit Officer",
    skills: ["Credit analysis", "Portfolio tracking", "Documentation control", "Compliance"],
   },
   {
    title: "Branch Manager",
    skills: ["Microfinance operations", "Team supervision", "Recovery management", "Risk control"],
   },
   {
    title: "Regional Manager",
    skills: ["Regional loan portfolio oversight", "Policy compliance", "Performance monitoring"],
   },
  ],
 },
 {
  id: "finance_insurance",
  name: "Insurance",
  roles: [
   {
    title: "Officer",
    skills: ["Policy issuance", "Documentation", "Client servicing", "Premium calculation"],
   },
   {
    title: "Underwriter",
    skills: ["Risk evaluation", "Policy pricing", "Claim review", "Compliance"],
   },
   {
    title: "Senior Underwriter",
    skills: ["Complex risk assessment", "Reinsurance coordination", "Portfolio review"],
   },
   {
    title: "Manager",
    skills: ["Insurance operations control", "Team leadership", "Regulatory compliance"],
   },
   {
    title: "Head",
    skills: ["Insurance product strategy", "Underwriting governance", "Risk framework oversight"],
   },
  ],
 },
];

const SALES_DEPARTMENT_CONTENT = [
 {
  id: "sales_general",
  name: "Sales",
  roles: [
   {
    title: "Executive",
    skills: ["Client visits", "Order booking", "Sales reporting", "Target achievement"],
   },
   {
    title: "Senior Exec",
    skills: ["Key account handling", "Negotiation", "Revenue tracking", "CRM management"],
   },
   {
    title: "Supervisor",
    skills: ["Field team monitoring", "Sales planning", "Territory management"],
   },
   {
    title: "Manager",
    skills: ["Sales strategy", "Revenue forecasting", "Performance review", "Channel expansion"],
   },
   {
    title: "Head",
    skills: ["National sales planning", "Pricing strategy", "Distribution governance"],
   },
  ],
 },
 {
  id: "sales_corporate",
  name: "Corporate Sales",
  roles: [
   {
    title: "Officer",
    skills: ["Corporate client approach", "Proposal drafting", "CRM updates"],
   },
   {
    title: "KAM",
    skills: ["Contract negotiation", "Account growth", "Client retention"],
   },
   {
    title: "Senior KAM",
    skills: ["Strategic partnerships", "Portfolio expansion", "Revenue planning"],
   },
   {
    title: "Manager",
    skills: ["Corporate sales governance", "Target setting", "Team leadership"],
   },
  ],
 },
 {
  id: "sales_business_development",
  name: "Business Development",
  roles: [
   {
    title: "Executive",
    skills: ["Market visits", "Proposal drafting", "Client prospecting"],
   },
   {
    title: "Officer",
    skills: ["Deal negotiation", "Pipeline management", "Revenue forecasting"],
   },
   {
    title: "Manager",
    skills: ["Market expansion strategy", "Partnership development", "Financial projections"],
   },
   {
    title: "Head",
    skills: ["Growth strategy", "Strategic alliances", "Diversification planning"],
   },
  ],
 },
];

const MARKETING_DEPARTMENT_CONTENT = [
 {
  id: "marketing_general",
  name: "Marketing",
  roles: [
   {
    title: "Executive",
    skills: ["Campaign execution", "Social media handling", "Reporting"],
   },
   {
    title: "Officer",
    skills: ["Branding support", "Digital ads management", "Market analysis"],
   },
   {
    title: "Manager",
    skills: ["Marketing strategy", "Campaign budgeting", "Team supervision"],
   },
   {
    title: "Head",
    skills: ["Corporate branding", "Market positioning", "Revenue growth strategy"],
   },
  ],
 },
 {
  id: "marketing_brand_management",
  name: "Brand Management",
  roles: [
   {
    title: "Executive",
    skills: ["Brand monitoring", "Competitor analysis", "Campaign support"],
   },
   {
    title: "Officer",
    skills: ["Brand positioning", "Media coordination", "Product launches"],
   },
   {
    title: "Manager",
    skills: ["Brand strategy development", "ATL/BTL planning", "Budget control"],
   },
   {
    title: "Head",
    skills: ["Corporate brand governance", "Brand equity management"],
   },
  ],
 },
 {
  id: "marketing_market_research",
  name: "Market Research",
  roles: [
   {
    title: "Executive",
    skills: ["Data collection", "Surveys", "Field coordination"],
   },
   {
    title: "Analyst",
    skills: ["Data analysis", "SPSS usage", "Reporting"],
   },
   {
    title: "Senior Analyst",
    skills: ["Consumer insights", "Forecasting", "Statistical modeling"],
   },
   {
    title: "Manager",
    skills: ["Research strategy", "Client reporting", "Team leadership"],
   },
  ],
 },
 {
  id: "marketing_digital_marketing",
  name: "Digital Marketing",
  roles: [
   {
    title: "Digital Marketing Specialist",
    skills: [
     "Digital strategy development",
     "Campaign management",
     "SEO optimization",
     "Paid ads management",
     "Content planning",
     "Email marketing",
    ],
   },
   {
    title: "SEO Executive / Manager",
    skills: [
     "SEO strategy",
     "Technical SEO audits",
     "Content optimization",
     "Competitor analysis",
    ],
   },
   {
    title: "Social Media Executive",
    skills: [
     "Social media strategy",
     "Campaign design",
     "Influencer coordination",
     "Analytics tracking",
     "Content posting",
     "Community management",
     "Engagement monitoring",
    ],
   },
  ],
 },
];

const CUSTOMER_RELATION_DEPARTMENT_CONTENT = [
 {
  id: "cr_public_relations",
  name: "Public Relations",
  roles: [
   {
    title: "Officer",
    skills: ["Press release drafting", "Media coordination"],
   },
   {
    title: "Executive",
    skills: ["Event coverage", "Brand communication", "Crisis support"],
   },
   {
    title: "Manager",
    skills: ["Media strategy", "Corporate communication planning"],
   },
   {
    title: "Head",
    skills: ["Reputation management", "Communication governance"],
   },
  ],
 },
 {
  id: "cr_customer_service",
  name: "Customer Service",
  roles: [
   {
    title: "CSR",
    skills: ["Complaint handling", "Call logging", "Customer queries"],
   },
   {
    title: "Senior CSR",
    skills: ["Escalation handling", "Reporting", "Service monitoring"],
   },
   {
    title: "Supervisor",
    skills: ["Team monitoring", "Quality checks", "Performance reporting"],
   },
   {
    title: "Manager",
    skills: ["Service policy development", "Customer retention strategy"],
   },
  ],
 },
 {
  id: "cr_call_center_ops",
  name: "Call Center Operations",
  roles: [
   {
    title: "Agent",
    skills: ["Inbound/outbound calls", "CRM updates", "Issue resolution"],
   },
   {
    title: "Team Leader",
    skills: ["Team monitoring", "KPI tracking", "Coaching"],
   },
   {
    title: "Floor Manager",
    skills: ["Shift management", "Performance control"],
   },
   {
    title: "Operations Manager",
    skills: ["Call center strategy", "SLA compliance"],
   },
  ],
 },
];

const SUPPLY_CHAIN_DEPARTMENT_CONTENT = [
 {
  id: "scm_procurement",
  name: "Procurement",
  roles: [
   {
    title: "Officer",
    skills: ["Vendor sourcing", "Quotation comparison", "Purchase orders"],
   },
   {
    title: "Senior Officer",
    skills: ["Contract negotiation", "Cost analysis", "Vendor evaluation"],
   },
   {
    title: "Manager",
    skills: ["Procurement planning", "Supplier management", "Compliance"],
   },
   {
    title: "Head",
    skills: ["Strategic sourcing", "Cost optimization", "Policy governance"],
   },
  ],
 },
 {
  id: "scm_logistics",
  name: "Logistics",
  roles: [
   {
    title: "Officer",
    skills: ["Shipment tracking", "Dispatch planning", "Documentation"],
   },
   {
    title: "Senior Officer",
    skills: ["Route planning", "Freight negotiation", "Cost monitoring"],
   },
   {
    title: "Manager",
    skills: ["Logistics network management", "Vendor contracts", "Risk control"],
   },
  ],
 },
 {
  id: "scm_inventory_management",
  name: "Inventory Management",
  roles: [
   {
    title: "Store Officer",
    skills: ["Stock entry", "GRN handling", "Stock audits"],
   },
   {
    title: "Controller",
    skills: ["Inventory reconciliation", "Stock forecasting", "ERP tracking"],
   },
   {
    title: "Manager",
    skills: ["Warehouse operations", "Stock optimization", "Risk mitigation"],
   },
  ],
 },
 {
  id: "scm_manufacturing",
  name: "Manufacturing",
  roles: [
   {
    title: "Officer",
    skills: ["Line supervision", "Machine monitoring", "Quality checks"],
   },
   {
    title: "Senior Officer",
    skills: ["Output planning", "Workforce allocation"],
   },
   {
    title: "Manager",
    skills: ["Production scheduling", "Cost control", "Compliance"],
   },
   {
    title: "Plant Manager",
    skills: ["Factory operations", "Capacity planning", "Safety governance"],
   },
  ],
 },
 {
  id: "scm_production",
  name: "Production",
  roles: [
   {
    title: "Executive",
    skills: ["Line operation", "Reporting", "Safety compliance"],
   },
   {
    title: "Supervisor",
    skills: ["Shift management", "Quality monitoring"],
   },
   {
    title: "Manager",
    skills: ["Output planning", "Workforce control"],
   },
  ],
 },
 {
  id: "scm_quality_assurance",
  name: "Quality Assurance",
  roles: [
   {
    title: "Officer",
    skills: ["Quality checks", "SOP compliance"],
   },
   {
    title: "Analyst",
    skills: ["Process audits", "Defect analysis"],
   },
   {
    title: "Manager",
    skills: ["QA framework implementation", "Compliance monitoring"],
   },
   {
    title: "Head",
    skills: ["Quality governance", "ISO compliance strategy"],
   },
  ],
 },
 {
  id: "scm_quality_control",
  name: "Quality Control",
  roles: [
   {
    title: "Inspector",
    skills: ["Material inspection", "Testing"],
   },
   {
    title: "Supervisor",
    skills: ["Process monitoring", "Reporting"],
   },
   {
    title: "Manager",
    skills: ["Quality standards enforcement"],
   },
  ],
 },
 {
  id: "scm_lean_management",
  name: "Lean Management",
  roles: [
   {
    title: "Officer",
    skills: ["Process mapping", "Waste analysis"],
   },
   {
    title: "Specialist",
    skills: ["Kaizen implementation", "KPI tracking"],
   },
   {
    title: "Manager",
    skills: ["Continuous improvement strategy"],
   },
  ],
 },
];

const IT_DEPARTMENT_CONTENT = [
 {
  id: "it_web_development",
  name: "Web Development",
  roles: [
   {
    title: "Junior",
    skills: ["HTML", "CSS", "Debugging"],
   },
   {
    title: "Developer",
    skills: ["Frontend coding", "Backend coding", "API integration"],
   },
   {
    title: "Senior",
    skills: ["Architecture design", "Code optimization"],
   },
   {
    title: "Manager",
    skills: ["Project planning", "Team leadership"],
   },
  ],
 },
 {
  id: "it_mobile_app_development",
  name: "Mobile App Development",
  roles: [
   {
    title: "Junior",
    skills: ["Flutter basics", "Android basics", "Debugging"],
   },
   {
    title: "Developer",
    skills: ["API integration", "UI development"],
   },
   {
    title: "Senior",
    skills: ["Architecture planning", "Performance optimization"],
   },
   {
    title: "Manager",
    skills: ["Mobile strategy", "Release management"],
   },
  ],
 },
 {
  id: "it_business_intelligence",
  name: "Business Intelligence",
  roles: [
   {
    title: "Executive",
    skills: ["Data cleaning", "Dashboard support"],
   },
   {
    title: "Analyst",
    skills: ["SQL queries", "Power BI", "Reporting"],
   },
   {
    title: "Senior",
    skills: ["Data modeling", "KPI tracking"],
   },
   {
    title: "Manager",
    skills: ["BI strategy", "Analytics governance"],
   },
  ],
 },
 {
  id: "it_artificial_intelligence",
  name: "Artificial Intelligence",
  roles: [
   {
    title: "Engineer",
    skills: ["Python", "ML models", "Data preprocessing"],
   },
   {
    title: "Senior",
    skills: ["Model deployment", "Deep learning"],
   },
   {
    title: "Manager",
    skills: ["AI project leadership", "Solution strategy"],
   },
  ],
 },
 {
  id: "it_cloud_computing",
  name: "Cloud Computing",
  roles: [
   {
    title: "Engineer",
    skills: ["AWS setup", "Azure setup", "Deployment"],
   },
   {
    title: "Senior",
    skills: ["Cloud architecture", "Security"],
   },
   {
    title: "Manager",
    skills: ["Cloud governance", "Infrastructure planning"],
   },
  ],
 },
 {
  id: "it_devops",
  name: "DevOps",
  roles: [
   {
    title: "Engineer",
    skills: ["CI/CD pipelines", "Docker"],
   },
   {
    title: "Senior",
    skills: ["Infrastructure automation", "Kubernetes"],
   },
   {
    title: "Manager",
    skills: ["DevOps strategy", "Release governance"],
   },
  ],
 },
 {
  id: "it_erp_systems",
  name: "ERP Systems",
  roles: [
   {
    title: "Executive",
    skills: ["ERP data entry", "Module support"],
   },
   {
    title: "Consultant",
    skills: ["SAP configuration", "Oracle configuration"],
   },
   {
    title: "Manager",
    skills: ["ERP governance", "Implementation strategy"],
   },
  ],
 },
 {
  id: "it_mis_reporting",
  name: "MIS & Reporting",
  roles: [
   {
    title: "Officer",
    skills: ["Excel reports", "Database updates"],
   },
   {
    title: "Analyst",
    skills: ["Data modeling", "KPI dashboards"],
   },
   {
    title: "Manager",
    skills: ["Reporting framework", "Data governance"],
   },
  ],
 },
 {
  id: "it_network_administration",
  name: "Network Administration",
  roles: [
   {
    title: "Support",
    skills: ["LAN troubleshooting", "WAN troubleshooting"],
   },
   {
    title: "Engineer",
    skills: ["Router configuration", "Switch configuration"],
   },
   {
    title: "Senior",
    skills: ["Network security", "Firewall management"],
   },
   {
    title: "Manager",
    skills: ["Infrastructure planning"],
   },
  ],
 },
 {
  id: "it_database_administration",
  name: "Database Administration",
  roles: [
   {
    title: "Officer",
    skills: ["Data entry", "Backups"],
   },
   {
    title: "DBA",
    skills: ["SQL management", "Tuning"],
   },
   {
    title: "Senior",
    skills: ["Database optimization", "Security"],
   },
   {
    title: "Manager",
    skills: ["Database governance"],
   },
  ],
 },
 {
  id: "it_blockchain",
  name: "Blockchain",
  roles: [
   {
    title: "Developer",
    skills: ["Smart contracts", "Solidity"],
   },
   {
    title: "Senior",
    skills: ["DApp architecture", "Security"],
   },
   {
    title: "Lead",
    skills: ["Blockchain strategy", "Integration planning"],
   },
  ],
 },
]; 

const PRODUCT_INNOVATION_DEPARTMENT_CONTENT = [
 {
  id: "pi_product_management",
  name: "Product Management",
  roles: [
   {
    title: "Product Executive",
    skills: [
     "Product documentation",
     "Coordination with development teams",
     "Backlog updates",
     "Market data collection",
    ],
   },
   {
    title: "Product Manager",
    skills: [
     "Product roadmap planning",
     "Market analysis",
     "Feature prioritization",
     "Stakeholder coordination",
    ],
   },
   {
    title: "Senior Product Manager",
    skills: [
     "Product strategy",
     "Lifecycle management",
     "Cross-functional leadership",
     "Product performance monitoring",
    ],
   },
   {
    title: "Head of Product",
    skills: [
     "Product governance",
     "Innovation strategy",
     "Portfolio management",
     "Long-term product vision",
    ],
   },
  ],
 },
];

const PROGRAM_DELIVERY_DEPARTMENT_CONTENT = [
 {
  id: "pdm_project_management_pmo",
  name: "Project Management / PMO",
  roles: [
   {
    title: "Project Coordinator",
    skills: [
     "Project scheduling",
     "Documentation management",
     "Meeting coordination",
     "Progress tracking",
    ],
   },
   {
    title: "Project Manager",
    skills: [
     "Budget control",
     "Risk management",
     "Team coordination",
     "Milestone monitoring",
    ],
   },
   {
    title: "Senior Project Manager",
    skills: [
     "Multi-project oversight",
     "Stakeholder management",
     "Strategic project alignment",
     "Governance reporting",
    ],
   },
   {
    title: "PMO Head",
    skills: [
     "Portfolio management",
     "Project governance frameworks",
     "PM methodology development",
     "Executive reporting",
    ],
   },
  ],
 },
];

const OPERATIONS_PROCESS_EXCELLENCE_CONTENT = [
 {
  id: "ope_business_analysis",
  name: "Business Analysis",
  roles: [
   {
    title: "Business Analyst",
    skills: [
     "Requirement gathering",
     "Process documentation",
     "Stakeholder interviews",
     "Workflow analysis",
    ],
   },
   {
    title: "Senior Business Analyst",
    skills: [
     "Process modeling",
     "Solution design support",
     "Stakeholder coordination",
     "Gap analysis",
    ],
   },
   {
    title: "BA Manager",
    skills: [
     "Business analysis governance",
     "Team supervision",
     "Methodology implementation",
     "Process improvement strategy",
    ],
   },
  ],
 },
];
const MOCK_ROLES: JobRole[] = [
 {
  id: "role_fe",
  fieldId: "it",
  title: "Frontend Developer",
  description: "Build responsive interfaces, collaborate with designers, and ensure UX quality.",
  skills: [
   { id: "s1", name: "HTML/CSS", type: "Technical", requiredLevel: "Advanced", weight: 1.2 },
   { id: "s2", name: "JavaScript/TypeScript", type: "Technical", requiredLevel: "Advanced", weight: 1.4 },
   { id: "s3", name: "React", type: "Technical", requiredLevel: "Advanced", weight: 1.4 },
   { id: "s4", name: "Git", type: "Technical", requiredLevel: "Intermediate" },
   { id: "s5", name: "Communication", type: "Soft", requiredLevel: "Intermediate" },
   { id: "s6", name: "Problem Solving", type: "Soft", requiredLevel: "Intermediate" },
  ],
 },
];

const MOCK_OPENINGS: JobOpening[] = [
 { id: "j1", roleId: "role_fe", title: "Frontend Developer", company: "Sanjeeda Labs", location: "Karachi", isRemote: true },
];

const DEFAULT_USER_SKILLS: UserSkill[] = [
 { id: "1", name: "React", level: "Intermediate", type: "Technical", source: "Profile" },
 { id: "2", name: "JavaScript/TypeScript", level: "Intermediate", type: "Technical", source: "Assessment" },
 { id: "3", name: "HTML/CSS", level: "Advanced", type: "Technical", source: "Profile" },
 { id: "4", name: "Communication", level: "Intermediate", type: "Soft", source: "Assessment" },
 { id: "5", name: "Git", level: "Beginner", type: "Technical", source: "Profile" },
];


/** ---------------- Career Jobs Webpage UI ---------------- */

const FIELD_META: Record<
  string,
  {
    icon: string;
    color: string;
    accent: string;
    totalJobs: number;
  }
> = {
  hr: {
    icon: "fa-solid fa-users",
    color: "bg-blue-600 text-white",
    accent: "bg-blue-600",
    totalJobs: 28,
  },
  finance: {
    icon: "fa-solid fa-briefcase",
    color: "bg-emerald-600 text-white",
    accent: "bg-emerald-600",
    totalJobs: 34,
  },
  sales: {
    icon: "fa-solid fa-chart-line",
    color: "bg-orange-500 text-white",
    accent: "bg-orange-500",
    totalJobs: 18,
  },
  marketing: {
    icon: "fa-solid fa-bullhorn",
    color: "bg-pink-600 text-white",
    accent: "bg-pink-600",
    totalJobs: 22,
  },
  customer_relation: {
    icon: "fa-solid fa-headset",
    color: "bg-cyan-600 text-white",
    accent: "bg-cyan-600",
    totalJobs: 16,
  },
  supply_chain_management: {
    icon: "fa-solid fa-truck-fast",
    color: "bg-amber-500 text-white",
    accent: "bg-amber-500",
    totalJobs: 26,
  },
  it: {
    icon: "fa-solid fa-laptop-code",
    color: "bg-indigo-600 text-white",
    accent: "bg-indigo-600",
    totalJobs: 35,
  },
  product_innovation: {
    icon: "fa-solid fa-lightbulb",
    color: "bg-violet-600 text-white",
    accent: "bg-violet-600",
    totalJobs: 12,
  },
  program_delivery_management: {
    icon: "fa-solid fa-list-check",
    color: "bg-slate-700 text-white",
    accent: "bg-slate-700",
    totalJobs: 14,
  },
  operations_process_excellence: {
    icon: "fa-solid fa-gears",
    color: "bg-teal-600 text-white",
    accent: "bg-teal-600",
    totalJobs: 13,
  },
  engineering: {
    icon: "fa-solid fa-helmet-safety",
    color: "bg-yellow-500 text-white",
    accent: "bg-yellow-500",
    totalJobs: 20,
  },
  medical: {
    icon: "fa-solid fa-user-doctor",
    color: "bg-rose-600 text-white",
    accent: "bg-rose-600",
    totalJobs: 19,
  },
  education: {
    icon: "fa-solid fa-graduation-cap",
    color: "bg-sky-600 text-white",
    accent: "bg-sky-600",
    totalJobs: 15,
  },
};

const DEPARTMENT_OPTIONS: Record<string, Array<{ id: string; name: string }>> = {
 hr: HR_DEPARTMENT_CONTENT.map((item) => ({ id: item.id, name: item.name })),
 finance: FINANCE_DEPARTMENT_CONTENT.map((item) => ({ id: item.id, name: item.name })),
 sales: SALES_DEPARTMENT_CONTENT.map((item) => ({ id: item.id, name: item.name })),
 marketing: MARKETING_DEPARTMENT_CONTENT.map((item) => ({ id: item.id, name: item.name })),
 customer_relation: CUSTOMER_RELATION_DEPARTMENT_CONTENT.map((item) => ({ id: item.id, name: item.name })),
 supply_chain_management: SUPPLY_CHAIN_DEPARTMENT_CONTENT.map((item) => ({ id: item.id, name: item.name })),
 it: IT_DEPARTMENT_CONTENT.map((item) => ({ id: item.id, name: item.name })),
 product_innovation: PRODUCT_INNOVATION_DEPARTMENT_CONTENT.map((item) => ({ id: item.id, name: item.name })),
 program_delivery_management: PROGRAM_DELIVERY_DEPARTMENT_CONTENT.map((item) => ({ id: item.id, name: item.name })),
 operations_process_excellence: OPERATIONS_PROCESS_EXCELLENCE_CONTENT.map((item) => ({ id: item.id, name: item.name })),
};

function getDepartmentContent(fieldId: string | null, departmentId: string | null) {
 if (!fieldId || !departmentId) return null;

 const sourceMap: Record<string, Array<{ id: string; name: string; roles: Array<{ title: string; skills: string[] }> }>> = {
  hr: HR_DEPARTMENT_CONTENT,
  finance: FINANCE_DEPARTMENT_CONTENT,
  sales: SALES_DEPARTMENT_CONTENT,
  marketing: MARKETING_DEPARTMENT_CONTENT,
  customer_relation: CUSTOMER_RELATION_DEPARTMENT_CONTENT,
  supply_chain_management: SUPPLY_CHAIN_DEPARTMENT_CONTENT,
  it: IT_DEPARTMENT_CONTENT,
  product_innovation: PRODUCT_INNOVATION_DEPARTMENT_CONTENT,
  program_delivery_management: PROGRAM_DELIVERY_DEPARTMENT_CONTENT,
  operations_process_excellence: OPERATIONS_PROCESS_EXCELLENCE_CONTENT,
 };

 return sourceMap[fieldId]?.find((item) => item.id === departmentId) ?? null;
}

function FieldLogo({ fieldId }: { fieldId: string }) {
  const meta = FIELD_META[fieldId] ?? {
    icon: "fa-solid fa-layer-group",
    color: "bg-slate-700 text-white",
    accent: "bg-slate-700",
    totalJobs: 10,
  };

  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm ${meta.color}`}
    >
      <i className={meta.icon} aria-hidden="true" />
    </span>
  );
}

function StatBox({
 label,
 value,
 tone = "slate",
}: {
 label: string;
 value: string | number;
 tone?: "slate" | "blue" | "emerald";
}) {
 const tones = {
  slate: "bg-white/12 text-white",
  blue: "bg-white/14 text-white",
  emerald: "bg-emerald-400/18 text-emerald-50",
 };

 return (
  <div className={`${tones[tone]} px-4 py-3`}>
   <p className="text-[11px] uppercase tracking-wide opacity-75">{label}</p>
   <p className="mt-1 text-lg font-semibold">{value}</p>
  </div>
 );
}

function SearchInput({
 value,
 onChange,
 placeholder,
}: {
 value: string;
 onChange: (value: string) => void;
 placeholder: string;
}) {
 return (
  <div className="relative">
   <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
    🔎
   </span>
   <input
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
    className="h-10 w-full bg-white pl-9 pr-3 text-sm text-slate-800 outline-none shadow-inner focus:ring-blue-500"
   />
  </div>
 );
}

function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
 return (
  <button
   type="button"
   onClick={onClick}
   className="inline-flex h-9 items-center gap-2 bg-[#e8edf5] px-3 text-sm text-slate-700 hover:bg-[#dbe4ef]"
  >
   <span>‹</span>
   {label}
  </button>
 );
}

function DepartmentSelect({
 value,
 onChange,
 options,
}: {
 value: string;
 onChange: (value: string) => void;
 options: Array<{ id: string; name: string }>;
}) {
 return (
  <select
   value={value}
   onChange={(event) => onChange(event.target.value)}
   className="h-10 w-full bg-white px-3 text-sm text-slate-800 outline-none shadow-inner focus:ring-blue-500"
  >
   <option value="">Select department</option>
   {options.map((item) => (
    <option key={item.id} value={item.id}>
     {item.name}
    </option>
   ))}
  </select>
 );
}

function RoleList({
 department,
}: {
 department: { id: string; name: string; roles: Array<{ title: string; skills: string[] }> };
}) {
 return (
  <div className="bg-white shadow-sm">
   <div className=" bg-white/10 px-4 py-3">
    <h3 className="text-base font-semibold tracking-tight text-slate-900">{department.name}</h3>
    <p className="mt-1 text-xs text-slate-500">
     Available role ladder with core job skills.
    </p>
   </div>

   <div className="divide-y divide-slate-100/70">
    {department.roles.map((role, index) => (
     <div key={role.title} className="grid gap-3 px-4 py-4 md:grid-cols-[44px_1fr]">
      <span className="flex h-8 w-8 items-center justify-center bg-[#e8f1ff] text-sm font-medium text-blue-700">
       {index + 1}
      </span>

      <div>
       <h4 className="text-sm font-semibold text-slate-900">{role.title}</h4>

       <div className="mt-2 flex flex-wrap gap-2">
        {role.skills.map((skill) => (
         <span
          key={skill}
          className="bg-[#f6f8fb] px-2 py-1 text-xs text-slate-600 "
         >
          {skill}
         </span>
        ))}
       </div>
      </div>
     </div>
    ))}
   </div>
  </div>
 );
}

/** ---------------- Component ---------------- */

export default function EducationTab() {
 const [fields] = useState<CareerField[]>(MOCK_FIELDS);
 const [roles] = useState<JobRole[]>(MOCK_ROLES);
 const [userSkills, setUserSkills] = useState<UserSkill[]>(DEFAULT_USER_SKILLS);

 const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
 const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
 const [selectedSubDepartmentId, setSelectedSubDepartmentId] = useState<string | null>(null);
 const [search, setSearch] = useState<string>("");
 const [skillFilter, setSkillFilter] = useState<"all" | SkillType>("all");
 const [showOnlyMissing, setShowOnlyMissing] = useState<boolean>(false);
 const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

 const activeField = useMemo(
  () => fields.find((field) => field.id === activeFieldId) ?? null,
  [fields, activeFieldId]
 );

 const selectedRole = useMemo(
  () => roles.find((role) => role.id === selectedRoleId) ?? null,
  [roles, selectedRoleId]
 );

 const userMap = useMemo(() => {
  const map = new Map<string, UserSkill>();
  for (const skill of userSkills) map.set(normalizeSkillName(skill.name), skill);
  return map;
 }, [userSkills]);

 const fieldRoles = useMemo(() => {
  const list = roles.filter((role) => (activeFieldId ? role.fieldId === activeFieldId : true));
  const query = search.trim().toLowerCase();

  if (!query) return list;

  return list.filter(
   (role) =>
    role.title.toLowerCase().includes(query) ||
    role.description.toLowerCase().includes(query)
  );
 }, [roles, activeFieldId, search]);

 const roleSkills = useMemo(() => {
  if (!selectedRole) return [];

  let list = selectedRole.skills;

  if (skillFilter !== "all") list = list.filter((skill) => skill.type === skillFilter);
  if (showOnlyMissing) list = list.filter((req) => !userMap.has(normalizeSkillName(req.name)));

  return list;
 }, [selectedRole, skillFilter, showOnlyMissing, userMap]);

 const filteredFields = useMemo(() => {
  const query = search.trim().toLowerCase();

  if (!query) return fields;

  return fields.filter(
   (field) =>
    field.name.toLowerCase().includes(query) ||
    (field.shortDesc ?? "").toLowerCase().includes(query)
  );
 }, [fields, search]);

 const selectedDepartment = useMemo(
  () => getDepartmentContent(activeFieldId, selectedSubDepartmentId),
  [activeFieldId, selectedSubDepartmentId]
 );

 const departmentOptions = activeFieldId ? DEPARTMENT_OPTIONS[activeFieldId] ?? [] : [];
 const selectedMeta = activeFieldId ? FIELD_META[activeFieldId] : null;

 const totalJobs = fields.reduce(
  (sum, field) => sum + (FIELD_META[field.id]?.totalJobs ?? 10),
  0
 );

 function goBack() {
  if (selectedRoleId) {
   setSelectedRoleId(null);
   setMatchResult(null);
   return;
  }

  if (selectedSubDepartmentId) {
   setSelectedSubDepartmentId(null);
   setMatchResult(null);
   return;
  }

  if (activeFieldId) {
   setActiveFieldId(null);
   setSearch("");
   setMatchResult(null);
  }
 }

 function onMatchProfile() {
  if (!selectedRole) return;
  setMatchResult(computeMatch(selectedRole, userSkills, MOCK_OPENINGS, 60));
 }

 function addUserSkill() {
  setUserSkills((prev) => [
   ...prev,
   {
    id: Date.now().toString(),
    name: "New Skill",
    level: "Beginner",
    type: "Technical",
    source: "Profile",
   },
  ]);
 }

 function updateUserSkill(index: number, patch: Partial<UserSkill>) {
  setUserSkills((prev) =>
   prev.map((skill, i) => (i === index ? { ...skill, ...patch } : skill))
  );
 }

 function removeUserSkill(index: number) {
  setUserSkills((prev) => prev.filter((_, i) => i !== index));
 }

 return (
  <main className="min-h-screen bg-[#f4f7fb] text-slate-800 antialiased [font-feature-settings:'cv02','cv03','cv04','cv11']">
   <section className="bg-gradient-to-r from-[#0f2f5f] via-[#17457d] to-[#2563eb] pt-16 text-white md:pt-28">
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
     <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-end">
      <div>
       <p className="text-xs uppercase tracking-[0.18em] text-blue-100">
        Career Jobs Portal
       </p>
       <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        Jobs in Different Career Fields
       </h1>
       <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-50/85">
        Explore career fields, select departments, view role ladders, and identify skills required for job readiness.
       </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
       <StatBox label="Fields" value={fields.length} tone="blue" />
       <StatBox label="Jobs" value={totalJobs} tone="emerald" />
       <StatBox label="Skills" value={userSkills.length} />
      </div>
     </div>
    </div>
   </section>

   <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
     <aside className="space-y-1 w-72">
       <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={activeField ? "Search roles..." : "Search career fields..."}
      />
 
      <div className="bg-white shadow-sm w-72">
       <div className=" bg-white/10 px-4 py-3 ">
        <p className="text-sm font-semibold text-slate-900">Career Fields</p>
       </div>

       <div className="max-h-[620px]  
        overflow-y-auto">
        {fields.map((field) => {
         const isActive = field.id === activeFieldId;
         const meta = FIELD_META[field.id] ?? {
          logo: "▣",
          color: "bg-[#e8edf5] text-slate-700",
          accent: "bg-slate-600",
          totalJobs: 10,
         };

         return (
          <button
           key={field.id}
           type="button"
           onClick={() => {
            setActiveFieldId(field.id);
            setSelectedSubDepartmentId(null);
            setSelectedRoleId(null);
            setMatchResult(null);
           }}
           className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
            isActive ? "bg-[#17457d] text-white" : "hover:bg-[#f5f8fc]"
           }`}
          >

           <span className="min-w-0 flex-1">
            <span className={`block truncate text-xs ${isActive ? "text-white" : "text-slate-800"}`}>
             {field.name}
            </span>
            <span className={`block text-xs ${isActive ? "text-blue-100" : "text-slate-500"}`}>
             {meta.totalJobs} jobs
            </span>
           </span>
          </button>
         );
        })}
       </div>
      </div>
     </aside>

     <div className="space-y-5">
      {!activeField && !selectedRole ? (
       <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-3">
         {filteredFields.map((field) => {
          const meta = FIELD_META[field.id] ?? {
           logo: "▣",
           color: "bg-[#e8edf5] text-slate-700",
           accent: "bg-slate-600",
           totalJobs: 10,
          };

          return (
           <button
            key={field.id}
            type="button"
            onClick={() => {
             setActiveFieldId(field.id);
             setSelectedSubDepartmentId(null);
             setSelectedRoleId(null);
             setMatchResult(null);
            }}
            className="bg-white p-4 text-left shadow-sm transition hover:bg-[#eef5ff]"
           >
            <div className="flex items-start justify-between gap-3">
             <FieldLogo fieldId={field.id} />
             <span className="text-xs font-medium text-blue-700">Open →</span>
            </div>

            <h3 className="mt-4 text-base font-semibold tracking-tight text-slate-900">
             {field.name}
            </h3>
            <p className="mt-1 min-h-[38px] text-sm leading-5 text-slate-500">
             {field.shortDesc}
            </p>

            {/* <div className="mt-4 flex items-center justify-between bg-[#f3f6fa] px-3 py-2">
             <span className="text-xs text-slate-500">Available jobs</span>
             <span className="text-sm font-medium text-slate-800">
              {meta.totalJobs}
             </span>
            </div> */}
           </button>
          );
         })}
        </div>
       </>
      ) : null}

      {activeField && !selectedRole ? (
       <div className="space-y-4">
        <div className="bg-white p-4 shadow-sm">
         <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
           <FieldLogo fieldId={activeField.id} />
           <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
             Selected Career Field
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
             {activeField.name}
            </h2>
           </div>
          </div>

          <BackButton onClick={goBack} label="All Fields" />
         </div>

         <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px]">
          <DepartmentSelect
           value={selectedSubDepartmentId ?? ""}
           onChange={(value) => setSelectedSubDepartmentId(value || null)}
           options={departmentOptions}
          />

          <div className="bg-[#f3f6fa] px-3 py-2 text-sm text-slate-600">
           {selectedMeta?.totalJobs ?? fieldRoles.length} jobs listed
          </div>
         </div>
        </div>

        {selectedDepartment ? (
         <RoleList department={selectedDepartment} />
        ) : (
         <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {departmentOptions.length ? (
           departmentOptions.map((department) => (
            <button
             key={department.id}
             type="button"
             onClick={() => setSelectedSubDepartmentId(department.id)}
             className="bg-white p-4 text-left shadow-sm transition hover:bg-[#eef5ff]"
            >
             <p className="text-sm font-semibold text-slate-900">
              {department.name}
             </p>
             <p className="mt-2 text-xs text-slate-500">
              View job roles and required skills.
             </p>
             <span className="mt-4 inline-flex text-xs font-medium text-blue-700">
              View roles →
             </span>
            </button>
           ))
          ) : (
           fieldRoles.map((role) => (
            <button
             key={role.id}
             type="button"
             onClick={() => setSelectedRoleId(role.id)}
             className="bg-white p-4 text-left shadow-sm transition hover:bg-[#eef5ff]"
            >
             <p className="text-sm font-semibold text-slate-900">{role.title}</p>
             <p className="mt-2 text-xs leading-5 text-slate-500">
              {role.description}
             </p>
             <span className="mt-4 inline-flex text-xs font-medium text-blue-700">
              Match profile →
             </span>
            </button>
           ))
          )}
         </div>
        )}
       </div>
      ) : null}

      {selectedRole ? (
       <div className="space-y-4">
        <div className="bg-white p-4 shadow-sm">
         <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
           <p className="text-xs uppercase tracking-wide text-slate-400">
            Job Role
           </p>
           <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {selectedRole.title}
           </h2>
           <p className="mt-1 text-sm text-slate-500">
            {selectedRole.description}
           </p>
          </div>

          <div className="flex gap-2">
           <BackButton onClick={goBack} />
           <button
            type="button"
            onClick={onMatchProfile}
            className="h-9 bg-blue-600 px-4 text-sm text-white hover:bg-blue-700"
           >
            Match Profile
           </button>
          </div>
         </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
         <div className="bg-white shadow-sm">
          <div className=" bg-white/10 px-4 py-3">
           <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-semibold text-slate-900">
             Required Skills
            </p>

            <div className="flex flex-wrap gap-2">
             <select
              value={skillFilter}
              onChange={(event) => setSkillFilter(event.target.value as "all" | SkillType)}
              className="h-9 bg-white px-3 text-xs text-slate-700 outline-none shadow-inner"
             >
              <option value="all">All Skills</option>
              <option value="Technical">Technical</option>
              <option value="Soft">Soft</option>
             </select>

             <label className="flex h-9 items-center gap-2 bg-white px-3 text-xs text-slate-600 shadow-inner">
              <input
               type="checkbox"
               checked={showOnlyMissing}
               onChange={(event) => setShowOnlyMissing(event.target.checked)}
              />
              Missing only
             </label>
            </div>
           </div>
          </div>

          <div className="divide-y divide-slate-100/70">
           {roleSkills.map((req) => {
            const userSkill = userMap.get(normalizeSkillName(req.name)) ?? null;
            const score = getSkillScore(userSkill?.level ?? null, req.requiredLevel);
            const percent = Math.round(score * 100);
            const status = !userSkill ? "Missing" : percent === 100 ? "Matched" : "Partial";

            return (
             <div key={req.id} className="px-4 py-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
               <div>
                <p className="text-sm font-semibold text-slate-900">
                 {req.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                 {req.type} · Required: {req.requiredLevel} · Yours: {userSkill?.level ?? "None"}
                </p>
               </div>

               <span
                className={`w-fit px-2 py-1 text-xs ${
                 !userSkill
                  ? "bg-rose-50 text-rose-700"
                  : percent === 100
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-50 text-amber-700"
                }`}
               >
                {userSkill ? `${percent}% ${status}` : "Missing"}
               </span>
              </div>

              <div className="mt-3 h-1.5 bg-[#e8edf5]">
               <div
                className="h-1.5 bg-blue-600"
                style={{ width: `${userSkill ? percent : 0}%` }}
               />
              </div>
             </div>
            );
           })}
          </div>
         </div>

         <aside className="space-y-4">
          <div className="bg-white p-4 shadow-sm">
           <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">
             Your Skills
            </p>
            <button
             type="button"
             onClick={addUserSkill}
             className="bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
            >
             Add
            </button>
           </div>

           <div className="space-y-2">
            {userSkills.map((skill, index) => (
             <div key={`${skill.id}-${index}`} className="bg-[#f6f8fb] p-3">
              <input
               value={skill.name}
               onChange={(event) => updateUserSkill(index, { name: event.target.value })}
               className="h-8 w-full bg-white px-2 text-xs text-slate-800 outline-none shadow-inner"
              />

              <div className="mt-2 grid grid-cols-[1fr_1fr_32px] gap-2">
               <select
                value={skill.type}
                onChange={(event) => updateUserSkill(index, { type: event.target.value as SkillType })}
                className="h-8 bg-white px-2 text-xs outline-none shadow-inner"
               >
                <option value="Technical">Technical</option>
                <option value="Soft">Soft</option>
               </select>

               <select
                value={skill.level}
                onChange={(event) => updateUserSkill(index, { level: event.target.value as Proficiency })}
                className="h-8 bg-white px-2 text-xs outline-none shadow-inner"
               >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
               </select>

               <button
                type="button"
                onClick={() => removeUserSkill(index)}
                className="bg-white text-xs text-rose-600 shadow-inner hover:bg-rose-50"
               >
                ×
               </button>
              </div>
             </div>
            ))}
           </div>
          </div>

          <div className="bg-white p-4 shadow-sm">
           <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">
             Match Results
            </p>
            <button
             type="button"
             onClick={onMatchProfile}
             className="bg-[#e8edf5] px-3 py-1.5 text-xs text-slate-700 hover:bg-[#dbe4ef]"
            >
             Calculate
            </button>
           </div>

           {!matchResult ? (
            <p className="bg-[#f6f8fb] p-3 text-xs leading-5 text-slate-500">
             Click Match Profile to generate skill-gap results.
            </p>
           ) : (
            <div className="space-y-3">
             <div className="bg-[#e8f1ff] p-3">
              <p className="text-xs font-medium text-blue-700">Match Percentage</p>
              <p className="mt-1 text-2xl font-semibold text-blue-800">
               {matchResult.matchPercent}%
              </p>
             </div>

             <div className="grid grid-cols-3 gap-2 text-center">
              <StatBox label="Missing" value={matchResult.missingSkills.length} />
              <StatBox label="Weak" value={matchResult.weakSkills.length} />
              <StatBox label="Jobs" value={matchResult.recommendedOpenings.length} />
             </div>

             <div>
              <p className="mb-2 text-xs font-medium text-slate-700">
               Learning Path
              </p>
              <div className="space-y-2">
               {matchResult.recommendedLearningPath.length ? (
                matchResult.recommendedLearningPath.slice(0, 4).map((path) => (
                 <div key={path.skillName} className="bg-[#f6f8fb] p-3">
                  <p className="text-xs font-medium text-slate-800">
                   {path.skillName}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                   Target: {path.targetLevel}
                  </p>
                 </div>
                ))
               ) : (
                <p className="bg-[#f6f8fb] p-3 text-xs text-slate-500">
                 No learning steps needed.
                </p>
               )}
              </div>
             </div>
            </div>
           )}
          </div>
         </aside>
        </div>
       </div>
      ) : null}
     </div>
    </div>
   </section>
  </main>
 );
}
