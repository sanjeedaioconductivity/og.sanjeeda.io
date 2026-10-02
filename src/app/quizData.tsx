export type BroadSkillCategory =
  | "AnalyticalProblemSolving"
  | "CommunicationInfluence"
  | "EthicalProfessional"
  | "InterpersonalTeam"
  | "LeadershipInitiative"
  | "LearningDevelopment"
  | "SelfManagement";

  export interface CareerProfile {
  name: string;
  traits: Partial<Record<string, number>>;
  skills: Record<BroadSkillCategory, number>;
}

export const broadSkillCategories: BroadSkillCategory[] = 
[
'AnalyticalProblemSolving', 'CommunicationInfluence', 'EthicalProfessional', 
'InterpersonalTeam', 'LeadershipInitiative', 'LearningDevelopment', 'SelfManagement',
];
// Mapping: Granular Skill -> 7 Main Categories [cite: 1]
export const skillCategoryMapping: Record<BroadSkillCategory, string[]> = {
AnalyticalProblemSolving: 
[ 
'analyticalApproach', 'anomalyIdentification', 'criticalReasoning', 'creativeProblemSolving', 
'decisionMethodology','informationUtilization', 'informationOrganization', 'logicalEvaluation', 
'patternDetection', 'quantitativeAnalysis', 'systematicProblemSolving',
],
CommunicationInfluence: 
[ 
'assertiveCommunication', 'audienceAwareness','conceptCommunication', 'communicationAdaptability', 
'communicationFlexibility', 'explanatoryClarity', 'feedbackDelivery', 'influenceStyle', 
'persuasionApproach', 'verbalExplanation',  
],
EthicalProfessional: 
[ 
'attributionIntegrity', 'ethicalConsistency', 'ethicalDecisionMaking', 'honestyInSelfPresentation', 
'policyCompliance', 'professionalEthics', 'processIntegrity', 'ruleAdherence', 
'transparency', 'transactionIntegrity', 
],
InterpersonalTeam: 
[ 
'collaboration', 'conflictResolution', 'empathy', 'groupDynamics', 
'interpersonalAdaptability', 'networkingAbility','perspectiveTaking', 'relationshipMaintenance', 
'socialIntuition', 'teamManagement',  
],
LeadershipInitiative: 
[ 
'actionOrientation', 'changeLeadership', 'decisionCatalyst', 'delegationAbility', 
'directionalLeadership', 'initiativeTaking', 'motivationalAbility', 'professionalAssertiveness' 
],
LearningDevelopment: 
[
'adaptiveLearning', 'continuousLearning', 'feedbackProcessing', 'growthOrientation', 
'informationProcessing', 'knowledgeAcquisition', 'learningApproach', 'learningFlexibility', 
'reflectivePractice' 
],
SelfManagement: 
[ 
'adaptability', 'emotionalRegulation', 'planningOrganization', 'prioritization', 
'reliability', 'resilience', 'selfEvaluation', 'stressManagement', 
'timeManagement', 'workConsistency',
],
};

export const traitList = [
  'Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'EmotionalStability', 'Linguistic', 
  'LogicalMathematical', 'Spatial', 'BodilyKinesthetic', 'Musical', 'Interpersonal','Intrapersonal', 'Naturalist',
  'Dominance', 'Influence', 'Steadiness', 'Compliance'
] as const;

// --- SKILLS LIST --- (Granular skills)
export const skillList = [

//1.  AnalyticalProblemSolving "Analytical & Problem-Solving Skills"
'analyticalApproach','anomalyIdentification','criticalReasoning','creativeProblemSolving',
'decisionMethodology','informationUtilization','informationOrganization','logicalEvaluation', 
'patternDetection','quantitativeAnalysis','systematicProblemSolving',

//2.  CommunicationInfluence "Communication & Influence Skills"
'assertiveCommunication','audienceAwareness','conceptCommunication','communicationAdaptability', 
'communicationFlexibility','explanatoryClarity','feedbackDelivery','influenceStyle',
'persuasionApproach', 'verbalExplanation', 

//3. EthicalProfessional "Ethical Professional Skills"
'attributionIntegrity','ethicalConsistency','ethicalDecisionMaking','honestyInSelfPresentation', 
'policyCompliance','professionalEthics','processIntegrity','ruleAdherence',
'transparency','transactionIntegrity',  

//4. InterpersonalTeam "Interpersonal & Team Skills"
'collaboration','conflictResolution','empathy','groupDynamics',
'interpersonalAdaptability','networkingAbility','perspectiveTaking','relationshipMaintenance',
'socialIntuition','teamManagement',  

//5. LeadershipInitiative "Leadership & Initiative Skills"
'actionOrientation','changeLeadership','decisionCatalyst','delegationAbility',
'directionalLeadership', 'initiativeTaking','motivationalAbility','professionalAssertiveness', 

//6. LearningDevelopment "Learning & Development Skills"
'adaptiveLearning','continuousLearning','feedbackProcessing','growthOrientation',
'informationProcessing', 'knowledgeAcquisition','learningApproach','learningFlexibility',
'reflectivePractice', 

//7. SelfManagement "Self-Management Skills"
'adaptability', 'emotionalRegulation','planningOrganization','prioritization',  
'reliability','resilience','selfEvaluation','stressManagement',
'timeManagement','workConsistency'
];

// export const careerDatabase: CareerProfile[] = [
//   {
//     name: "Software Developer",
//     traits: { Openness: 5, Conscientiousness: 4, Extraversion: 2,  Agreeableness: 3, 'Emotional Stability': 3}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4, InterpersonalTeam:3, LeadershipInitiative: 2, LearningDevelopment: 5, SelfManagement: 4 },
//    },
//   {
//     name: "Data Analyst",
//     traits: { Openness: 4, Conscientiousness: 5, Extraversion: 3,  Agreeableness: 3, 'Emotional Stability': 3}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 5, CommunicationInfluence: 4, EthicalProfessional: 5, InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4 },
//    },
//    {
//     name: "Cybersecurity Manager",
//     traits: { Openness: 4, Conscientiousness: 5, Extraversion: 3,  Agreeableness: 3, 'Emotional Stability': 4}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 5, CommunicationInfluence: 4, EthicalProfessional: 5, InterpersonalTeam: 4, LeadershipInitiative: 5, LearningDevelopment: 5, SelfManagement: 4 },
//    },
//    {
//     name: "AI/Machine Learning Specialist",
//     traits: { Openness: 5, Conscientiousness: 4, Extraversion: 2,  Agreeableness: 3, 'Emotional Stability': 3}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4, InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 5, SelfManagement: 4 },
//    },
//    {
//     name: "Cloud Architect",
//     traits: { Openness: 5, Conscientiousness: 5, Extraversion: 3,  Agreeableness: 3, 'Emotional Stability': 4}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 5, CommunicationInfluence: 4, EthicalProfessional: 4, InterpersonalTeam: 3, LeadershipInitiative: 4, LearningDevelopment: 5, SelfManagement: 4 },
//    },
//   {
//     name: "Financial Analyst",
//     traits: { Openness: 3, Conscientiousness: 5, Extraversion: 3,  Agreeableness: 3, 'Emotional Stability': 4}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 5, CommunicationInfluence: 4, EthicalProfessional: 5, InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4 },
//    },
//    {
//     name: "Chartered Accountant",
//     traits: { Openness: 2, Conscientiousness: 5, Extraversion: 2,  Agreeableness: 3, 'Emotional Stability': 3}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 5, InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 5 },
//    },
//    {
//     name: "Marketing Manager", // Replacing Marketing Specialist from old list
//     traits: { Openness: 5, Conscientiousness: 4, Extraversion: 5,  Agreeableness: 4, 'Emotional Stability': 4}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 3, InterpersonalTeam: 5, LeadershipInitiative: 5, LearningDevelopment: 4, SelfManagement: 4 },
//   },
//   {
//     name: "Project Manager",
//     traits: { Openness: 4, Conscientiousness: 5, Extraversion: 4,  Agreeableness: 4, 'Emotional Stability': 5}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 5, CommunicationInfluence: 4, EthicalProfessional: 4, InterpersonalTeam: 5, LeadershipInitiative: 5, LearningDevelopment: 4, SelfManagement: 5},
//   },
//   {
//     name: "Human Resources Manager", // Replacing HR Coordinator
//     traits: { Openness: 4, Conscientiousness: 4, Extraversion: 5, Agreeableness: 5, 'Emotional Stability': 4}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 5, InterpersonalTeam: 5, LeadershipInitiative: 4, LearningDevelopment: 4, SelfManagement: 4},
//   },
//   {
//     name: "Physician",
//     traits: { Openness: 4, Conscientiousness: 5, Extraversion: 3, Agreeableness: 4, 'Emotional Stability': 5}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 5, CommunicationInfluence: 4, EthicalProfessional: 5, InterpersonalTeam: 4, LeadershipInitiative: 4, LearningDevelopment: 5, SelfManagement: 4},
//   },
//    {
//     name: "Physical Therapist",
//     traits: { Openness: 4, Conscientiousness: 4, Extraversion: 4, Agreeableness: 5, 'Emotional Stability': 4}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 4, InterpersonalTeam: 5, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4},
//   },
//    {
//     name: "Nurse",
//     traits: { Openness: 3, Conscientiousness: 5, Extraversion: 4, Agreeableness: 5, 'Emotional Stability': 5}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 4, CommunicationInfluence: 4, EthicalProfessional: 5, InterpersonalTeam: 5, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 5},
//   },
//    {
//     name: "Electrical Engineer",
//     traits: { Openness: 4, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, 'Emotional Stability': 3}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 5, InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4},
//   },
//    {
//     name: "Mechanical Engineer",
//      traits: { Openness: 4, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, 'Emotional Stability': 3}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 5, InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4},
//   },
//    {
//     name: "Telecom Engineer",
//     traits: { Openness: 4, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, 'Emotional Stability': 4}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4, InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 5, SelfManagement: 4},
//   },
//    {
//     name: "Teacher/Educator",
//     traits: { Openness: 5, Conscientiousness: 4, Extraversion: 4, Agreeableness: 5, 'Emotional Stability': 4}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 4, InterpersonalTeam: 5, LeadershipInitiative: 4, LearningDevelopment: 5, SelfManagement: 4},
//     },
//    {
//     name: "Creative Designer",
//     traits: { Openness: 5, Conscientiousness: 4, Extraversion: 3, Agreeableness: 3, 'Emotional Stability': 3}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 4, CommunicationInfluence: 4, EthicalProfessional: 3, InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4},
//     },
//    {
//     name: "Civil Service Officer",
//     traits: { Openness: 3, Conscientiousness: 5, Extraversion: 3, Agreeableness: 4, 'Emotional Stability': 4}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 4, CommunicationInfluence: 4, EthicalProfessional: 5, InterpersonalTeam: 4, LeadershipInitiative: 4, LearningDevelopment: 4, SelfManagement: 4},
//   },
//   {
//     name: "Operations Manager",
//     traits: { Openness: 3, Conscientiousness: 5, Extraversion: 4, Agreeableness: 4, 'Emotional Stability': 4}, // Using 'Emotional Stability' key
//     skills: { AnalyticalProblemSolving: 5, CommunicationInfluence: 4, EthicalProfessional: 4, InterpersonalTeam: 4, LeadershipInitiative: 5, LearningDevelopment: 4, SelfManagement: 5},
//    },
// ];

// Career Name → Stable Short Code
