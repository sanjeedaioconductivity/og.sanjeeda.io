// Career Name → Stable Short Code
export const careerCodeMap = {
  /* COMPUTER SCIENCE / IT */
  "Software Developer": "IT_SD",
  "Frontend Developer": "IT_FE",
  "Backend Developer": "IT_BE",
  "Full Stack Developer": "IT_FS",
  "Mobile App Developer": "IT_MOB",
  "Data Analyst": "IT_DA",
  "Data Scientist": "IT_DS",
  "AI/Machine Learning Specialist": "IT_AI",
  "Cybersecurity Analyst": "IT_CSA",
  "Cybersecurity Manager": "IT_CSM",
  "Cloud Architect": "IT_CA",
  "DevOps Engineer": "IT_DEVOPS",
  "System Administrator": "IT_SYS",
  "Network Engineer": "IT_NET",
  "Database Administrator": "IT_DBA",
  "QA / Test Engineer": "IT_QA",
  "UI/UX Designer": "IT_UX",
  "Product Manager (Tech)": "IT_PM",

  /* ENGINEERING */
  "Electrical Engineer": "ENG_EE",
  "Mechanical Engineer": "ENG_ME",
  "Civil Engineer": "ENG_CE",
  "Telecom Engineer": "ENG_TE",
  "Chemical Engineer": "ENG_CH",
  "Industrial Engineer": "ENG_IE",
  "Mechatronics Engineer": "ENG_MEC",
  "Robotics Engineer": "ENG_ROB",
  "Automotive Engineer": "ENG_AUTO",
  "Quality Engineer": "ENG_QA",

  /* MEDICAL / HEALTHCARE */
  "Physician": "MED_MD",
  "Surgeon": "MED_SUR",
  "Medical Officer": "MED_MO",
  "Nurse": "MED_RN",
  "Physical Therapist": "MED_PT",
  "Occupational Therapist": "MED_OT",
  "Pharmacist": "MED_PHR",
  "Medical Lab Technologist": "MED_MLT",
  "Radiologist": "MED_RAD",
  "Healthcare Administrator": "MED_ADMIN",
  "Public Health Officer": "MED_PHO",

  /* ACCOUNTS / FINANCE */
  "Chartered Accountant": "FIN_CA",
  "Financial Analyst": "FIN_FA",
  "Accounts Officer": "FIN_AO",
  "Audit Manager": "FIN_AUD",
  "Tax Consultant": "FIN_TAX",
  "Budget Analyst": "FIN_BUD",
  "Investment Analyst": "FIN_INV",
  "Risk Analyst": "FIN_RISK",
  "Banking Officer": "FIN_BANK",

  /* EDUCATION */
  "Teacher / Educator": "EDU_TCH",
  "Lecturer": "EDU_LEC",
  "Professor": "EDU_PROF",
  "Academic Coordinator": "EDU_AC",
  "Curriculum Developer": "EDU_CUR",
  "Education Consultant": "EDU_CONS",
  "School Administrator": "EDU_ADMIN",
  "Online Instructor": "EDU_OL",

  /* SUPPLY CHAIN / OPERATIONS */
  "Supply Chain Analyst": "SCM_SCA",
  "Logistics Coordinator": "SCM_LOG",
  "Procurement Officer": "SCM_PROC",
  "Operations Manager": "SCM_OM",
  "Warehouse Manager": "SCM_WH",
  "Inventory Planner": "SCM_INV",
  "Production Planner": "SCM_PP",

  /* MARKETING */
  "Marketing Manager": "MKT_MM",
  "Digital Marketing Specialist": "MKT_DM",
  "Brand Manager": "MKT_BR",
  "Content Strategist": "MKT_CS",
  "SEO Specialist": "MKT_SEO",
  "Market Research Analyst": "MKT_MR",
  "Growth Marketer": "MKT_GR",

  /* SALES */
  "Sales Executive": "SAL_SE",
  "Business Development Executive": "SAL_BD",
  "Account Manager": "SAL_AM",
  "Sales Manager": "SAL_SM",
  "Key Account Manager": "SAL_KAM",
  "Inside Sales Representative": "SAL_ISR",
  "Customer Success Manager": "SAL_CSM",

  /* HUMAN RESOURCES */
  "Human Resources Manager": "HR_MGR",
  "HR Business Partner": "HR_BP",
  "Talent Acquisition Specialist": "HR_TA",
  "Recruitment Officer": "HR_REC",
  "Learning & Development Manager": "HR_LD",
  "Compensation & Benefits Analyst": "HR_CB",
  "Employee Relations Officer": "HR_ER",

  /* ARTS / DESIGN */
  "Creative Designer": "ART_CD",
  "Graphic Designer": "ART_GD",
  "Illustrator": "ART_ILL",
  "Fine Artist": "ART_FA",
  "Art Director": "ART_AD",
  "Visual Artist": "ART_VA",

  /* MEDIA SCIENCES */
  "Journalist": "MED_JRN",
  "News Reporter": "MED_REP",
  "Media Analyst": "MED_MA",
  "Public Relations Officer": "MED_PR",
  "Broadcast Producer": "MED_BP",
  "Media Planner": "MED_MP",

  /* MULTIMEDIA */
  "Multimedia Designer": "MM_DSG",
  "Video Editor": "MM_VE",
  "Motion Graphics Artist": "MM_MG",
  "Animator": "MM_AN",
  "Game Designer": "MM_GD",
  "3D Artist": "MM_3D",
  "Sound Designer": "MM_SD",

} as const;

export type CareerCode = typeof careerCodeMap[keyof typeof careerCodeMap];