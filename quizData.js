export const broadSkillCategories = 
[
'AnalyticalProblemSolving', 'CommunicationInfluence', 'EthicalProfessional', 'InterpersonalTeam', 'LeadershipInitiative', 'LearningDevelopment', 'SelfManagement',
];

// Mapping: Granular Skill -> 7 Main Categories [cite: 1]
export const skillCategoryMapping = {
  AnalyticalProblemSolving: 
[ 
'analyticalApproach', 'anomalyIdentification', 'criticalReasoning', 'creativeProblemSolving', 
'decisionMethodology','informationUtilization', 'informationOrganization', 'logicalEval uation', 
'patternDetection', 'quantitativeAnalysis', 'systematicProblemSolving',
],
  CommunicationInfluence: 
[ 
'assertiveCommunication', 'audienceAwareness','conceptCommunication', 'communicationAdaptability', 
'communicationFlexibility', 'explanatoryClarity', 'feedbackDelivery', 'influenceStyle', 'persuasionApproach', 
'verbalExplanation',  
],
EthicalProfessional: 
[ 
'attributionIntegrity', 'ethicalConsistency', 'ethicalDecisionMaking', 'honestyInSelfPresentation', 
'policyCompliance', 'professionalEthics', 'processIntegrity', 'ruleAdherence', 'transparency', 'transactionIntegrity', 
],
InterpersonalTeam: 
[ 
'collaboration', 'conflictResolution', 'empathy', 'groupDynamics', 'interpersonalAdaptability', 
'networkingAbility','perspectiveTaking', 'relationshipMaintenance', 'socialIntuition', 'teamManagement',  
],
  
LeadershipInitiative: 
[ 
'actionOrientation', 'changeLeadership', 'decisionCatalyst', 'delegationAbility', 
'directionalLeadership', 'initiativeTaking', 'motivationalAbility', 'professionalAssertiveness' 
],
  
LearningDevelopment: 
[
'adaptiveLearning', 'continuousLearning', 'feedbackProcessing', 'growthOrientation', 
'informationProcessing', 'knowledgeAcquisition', 'learningApproach', 'learningFlexibility', 'reflectivePractice' 
],
SelfManagement: 
[ 
'adaptability', 'emotionalRegulation', 'planningOrganization', 'prioritization', 
'reliability', 'resilience', 'selfEvaluation', 'stressManagement', 'timeManagement', 'workConsistency',
],
};

// List of all high-level traits/sections we calculate directly
export const traitList = [ /* ... same as before ... */
'Openness','Conscientiousness','Extraversion','Agreeableness','Emotional Stability','HonestyHumility',
'Linguistic','LogicalMathematical','Spatial','BodilyKinesthetic','Musical','Interpersonal','Intrapersonal','Naturalist',
'Dominance','Influence','Steadiness','Compliance'
];

// --- SKILLS LIST --- (Granular skills)
export const skills = [
'actionOrientation', 'adaptability', 'adaptiveLearning', 'analyticalApproach', 'anomalyIdentification', 'assertiveCommunication', 'attributionIntegrity', 
'audienceAwareness', 'changeLeadership', 'collaboration', 'communicationAdaptability', 'communicationFlexibility', 'conceptCommunication', 'conflictResolution', 
'continuousLearning', 'creativeProblemSolving', 'criticalReasoning','decisionCatalyst', 'decisionMethodology', 'delegationAbility', 'directionalLeadership', 'empathy',
'emotionalRegulation', 'ethicalConsistency', 'ethicalDecisionMaking', 'explanatoryClarity','feedbackDelivery', 'feedbackProcessing', 'growthOrientation', 
'groupDynamics', 'honestyInSelfPresentation','influenceStyle', 'informationOrganization', 'informationProcessing', 'informationUtilization', 'initiativeTaking', 
'interpersonalAdaptability','knowledgeAcquisition', 'learningApproach', 'learningFlexibility', 'logicalEvaluation','motivationalAbility','networkingAbility',
'patternDetection', 'perspectiveTaking', 'persuasionApproach', 'planningOrganization', 'policyCompliance','prioritization', 'processIntegrity', 
'professionalAssertiveness','professionalEthics','quantitativeAnalysis','reflectivePractice', 'relationshipMaintenance', 'reliability', 'resilience', 'ruleAdherence',
'selfEvaluation', 'socialIntuition', 'stressManagement', 'systematicProblemSolving','teamManagement', 'timeManagement', 'transactionIntegrity', 'transparency', 
'verbalExplanation', 'workConsistency'
];

// Point mapping for qualitative terms
// const pointMap =
// { 
// 'Excellent': 5, 
// 'Strong': 4, 
// 'High': 4, 
// 'Moderate': 3, 
// 'Good': 3, 
// 'Balanced': 3, 
// 'Limited': 2, 
// 'Poor': 1, 
// 'Minimal': 1 
// };

// const createLikertAnswers = (baseSkills, reverse = false) => { 
//   const scaleMapping = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };
//   const reversedMapping = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 };
//   const mapping = reverse ? reversedMapping : scaleMapping;
//   const answers = [];
  
//   for (let i = 1; i <= 5; i++) {
//    const mappedScoreValue = mapping[i];
//    const scores = {};
//    baseSkills.forEach(skill => { scores[skill] = mappedScoreValue; });
//    answers.push({
//    id: `likert-${i}`, 
//    text: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'][i - 1],
//    value: i, 
//    scores: scores, 
//    baseScoreValue: mappedScoreValue
//    });
//   }
  
//   return answers;
// };

export const careerDatabase = [
  {
    name: "Software Developer",
    traits: { Openness: 1.2, Conscientiousness: 1.3, 'Emotional Stability': 1.0 }, // Using 'Emotional Stability' key
    skills: { AnalyticalProblemSolving: 1.4, LearningDevelopment: 1.2, SelfManagement: 1.0, EthicalProfessional: 0.8, CommunicationInfluence: 0.7 }
  },
  {
    name: "Data Analyst",
    traits: { Conscientiousness: 1.4, Openness: 1.0, 'Emotional Stability': 1.0 },
    skills: { AnalyticalProblemSolving: 1.5, EthicalProfessional: 1.0, SelfManagement: 0.9, CommunicationInfluence: 0.8 }
  },
   {
    name: "Cybersecurity Manager",
    traits: { Conscientiousness: 1.4, 'Emotional Stability': 1.3, Openness: 0.9 },
    skills: { EthicalProfessional: 1.4, AnalyticalProblemSolving: 1.3, LeadershipInitiative: 1.1, SelfManagement: 1.0, CommunicationInfluence: 0.8 }
  },
   {
    name: "AI/Machine Learning Specialist",
    traits: { Openness: 1.4, Conscientiousness: 1.2, 'Emotional Stability': 1.0 },
    skills: { AnalyticalProblemSolving: 1.5, LearningDevelopment: 1.3, EthicalProfessional: 1.1, CommunicationInfluence: 0.7 }
  },
   {
    name: "Cloud Architect",
    traits: { Conscientiousness: 1.3, Openness: 1.2, 'Emotional Stability': 1.1 },
    skills: { AnalyticalProblemSolving: 1.3, LearningDevelopment: 1.2, SelfManagement: 1.1, LeadershipInitiative: 1.0, CommunicationInfluence: 0.9 }
  },
  {
    name: "Financial Analyst",
    traits: { Conscientiousness: 1.4, 'Emotional Stability': 1.2, Openness: 0.8 }, // Updated weights from compatibility doc
    skills: { AnalyticalProblemSolving: 1.4, EthicalProfessional: 1.3, SelfManagement: 1.0,  CommunicationInfluence: 0.9 } // Updated weights
  },
   {
    name: "Chartered Accountant",
    traits: { Conscientiousness: 1.5, 'Emotional Stability': 1.1, Agreeableness: 0.8 },
    skills: { EthicalProfessional: 1.5, AnalyticalProblemSolving: 1.3, SelfManagement: 1.2, CommunicationInfluence: 0.8 }
  },
   {
    name: "Marketing Manager", // Replacing Marketing Specialist from old list
    traits: { Extraversion: 1.2, Openness: 1.3, 'Emotional Stability': 1.0 },
    skills: { CommunicationInfluence: 1.5, LeadershipInitiative: 1.2, InterpersonalTeam: 1.1, AnalyticalProblemSolving: 1.0, LearningDevelopment: 0.9 }
  },
  {
    name: "Project Manager",
    traits: { Conscientiousness: 1.4, 'Emotional Stability': 1.2, Extraversion: 1.0 }, // Updated weights
    skills: { LeadershipInitiative: 1.3, SelfManagement: 1.3, InterpersonalTeam: 1.2, CommunicationInfluence: 1.1, AnalyticalProblemSolving: 0.9 } // Updated weights
  },
  {
    name: "Human Resources Manager", // Replacing HR Coordinator
    traits: { Agreeableness: 1.3, 'Emotional Stability': 1.2, Extraversion: 1.1 },
    skills: { InterpersonalTeam: 1.4, CommunicationInfluence: 1.2, EthicalProfessional: 1.2, LeadershipInitiative: 1.0, SelfManagement: 0.9 }
  },
    {
    name: "Physician",
    traits: { Conscientiousness: 1.4, Agreeableness: 1.2, 'Emotional Stability': 1.3 },
    skills: { EthicalProfessional: 1.4, AnalyticalProblemSolving: 1.3, LearningDevelopment: 1.2, CommunicationInfluence: 1.1, InterpersonalTeam: 1.0 }
  },
   {
    name: "Physical Therapist",
    traits: { Agreeableness: 1.3, Conscientiousness: 1.2, 'Emotional Stability': 1.1 },
    skills: { InterpersonalTeam: 1.3, CommunicationInfluence: 1.2, AnalyticalProblemSolving: 1.0, LearningDevelopment: 1.0, SelfManagement: 0.9 }
  },
   {
    name: "Nurse",
    traits: { Agreeableness: 1.3, Conscientiousness: 1.3, 'Emotional Stability': 1.2 },
    skills: { InterpersonalTeam: 1.3, EthicalProfessional: 1.2, SelfManagement: 1.1, CommunicationInfluence: 1.0, AnalyticalProblemSolving: 0.9 }
  },
   {
    name: "Electrical Engineer",
    traits: { Conscientiousness: 1.3, Openness: 1.0, 'Emotional Stability': 1.0 },
    skills: { AnalyticalProblemSolving: 1.4, SelfManagement: 1.1, LearningDevelopment: 1.0, EthicalProfessional: 0.9, CommunicationInfluence: 0.8, }
  },
   {
    name: "Mechanical Engineer",
    traits: { Conscientiousness: 1.3, Openness: 1.1, 'Emotional Stability': 1.0 },
    skills: { AnalyticalProblemSolving: 1.4, SelfManagement: 1.1, EthicalProfessional: 0.9, CommunicationInfluence: 0.8 } // Note: Using MI 'Spatial' trait here
  },
   {
    name: "Telecom Engineer",
    traits: { Conscientiousness: 1.3, Openness: 1.1, 'Emotional Stability': 1.1 },
    skills: { AnalyticalProblemSolving: 1.3, SelfManagement: 1.1, LearningDevelopment: 1.1, LeadershipInitiative: 0.9, CommunicationInfluence: 0.8 }
  },
   {
    name: "Teacher/Educator",
    traits: { Agreeableness: 1.2, Openness: 1.1, 'Emotional Stability': 1.1 },
    skills: { CommunicationInfluence: 1.4, InterpersonalTeam: 1.2, LearningDevelopment: 1.1, LeadershipInitiative: 1.0, SelfManagement: 1.0 }
  },
   {
    name: "Creative Designer",
    traits: { Openness: 1.5, Conscientiousness: 1.0, Extraversion: 0.9 },
    skills: { CommunicationInfluence: 1.2, AnalyticalProblemSolving: 1.1, LearningDevelopment: 1.1, SelfManagement: 1.0, InterpersonalTeam: 0.9 }
  },
   {
    name: "Civil Service Officer",
    traits: { Conscientiousness: 1.3, Agreeableness: 1.1, 'Emotional Stability': 1.2 },
    skills: { EthicalProfessional: 1.4, CommunicationInfluence: 1.1, AnalyticalProblemSolving: 1.0, LeadershipInitiative: 1.1, InterpersonalTeam: 1.0 }
  },
  {
    name: "Operations Manager",
    traits: { Conscientiousness: 1.4, 'Emotional Stability': 1.2, Extraversion: 1.0 }, // Updated weights
    skills: { LeadershipInitiative: 1.3, AnalyticalProblemSolving: 1.1, SelfManagement: 1.2, CommunicationInfluence: 1.0, InterpersonalTeam: 1.0 } // Updated weights
  },
];

export const questions = [
{
  id: 'O-L1', type: 'likert', primaryTrait: 'Openness', 
  text: 'I enjoy exploring subjects outside my field of study or expertise.',
  formatWeight: 1.0, traitWeight: 1.0, 
  skills: ['continuousLearning', 'knowledgeAcquisition'],  
  options: [
  { label: "Strongly Disagree", value: 1 },{ label: "Disagree", value: 2 },
  { label: "Neutral", value: 3 },{ label: "Agree", value: 4 },{ label: "Strongly Agree", value: 5 }
  ]
},
{
  id: 'O-L2', type: 'likert', primaryTrait: 'Openness',
  text: 'I prefer practical, proven solutions over experimental or innovative approaches.',
  reverse: true,
  formatWeight: 1.0, traitWeight: 1.0, 
  skills: ['creativeProblemSolving', 'adaptability'],
  options: [
  { label: "Strongly Disagree", value: 1 },{ label: "Disagree", value: 2 },
  { label: "Neutral", value: 3 },{ label: "Agree", value: 4 },{ label: "Strongly Agree", value: 5 }
    ]
  },
  {
  id: 'O-FC', type: 'forced', primaryTrait: 'Openness', 
  text: 'When learning a new skill or subject, I typically:',
  formatWeight: 1.2, traitWeight: 1.0, 
  answers: [
  { 
    id: 'O-FC-A', optionKey: 'A', text: 'Explore different approaches', 
    scores: { learningFlexibility: 4, informationProcessing: 4 }, 
    baseScoreValue: 4
  },
  { 
    id: 'O-FC-B', optionKey: 'B', text: 'Master the fundamentals', 
    scores: { learningFlexibility: 3, informationProcessing: 4 },
    baseScoreValue: 3
  }
  ]
  },
  {
  id: 'O-SJT', type: 'sjt', primaryTrait: 'Openness', 
  text: 'Your team/group needs to develop a solution to a recurring problem. How would you most likely contribute?',
  formatWeight: 1.4, traitWeight: 1.0, 
  answers: [
  { 
    id: 'O-SJT-A', optionKey: 'A', text: 'Suggest unconventional approaches', 
    scores: { creativeProblemSolving: 5 }, 
    baseScoreValue: 5 
  },
  { 
    id: 'O-SJT-B', optionKey: 'B', text: 'Analyse what has worked', 
    scores: { creativeProblemSolving: 2 }, 
    baseScoreValue: 2
  },
  { 
    id: 'O-SJT-C', optionKey: 'C', text: 'Identify the underlying patterns', 
    scores: { creativeProblemSolving: 4, patternDetection: 4 },
    baseScoreValue: 4 
  },
  { id: 'O-SJT-D', optionKey: 'D', text: 'Propose testing multiple approaches', 
    scores: { creativeProblemSolving: 4, adaptability: 4 }, 
    baseScoreValue: 4 
  }
]
  },
  
];