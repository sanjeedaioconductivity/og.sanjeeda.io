import { MBTI, WorkingStyle, MultipleIntelligence, DISC, Attributes } from "./types/careerProfile";

export interface CareerAnalyticsProfile {
  code: string;
  name: string;
  mbti: MBTI;
  workingStyle: WorkingStyle;
  multipleIntelligence: MultipleIntelligence;
  disc: DISC;
  attributes: Attributes;
  traits: Record<string, number>;
  skills: Record<string, number>;
}

export type CareerField =
  | "IT_CS" | "ENGINEERING" | "MEDICAL" | "FINANCE"
  | "EDUCATION" | "SUPPLY_CHAIN" | "MARKETING" | "SALES"
  | "HR" | "ARTS_DESIGN" | "MEDIA_SCIENCES" | "MULTIMEDIA";

export const CareerFieldPrefix: Record<CareerField, string[]> = {
  IT_CS: ["IT_"], ENGINEERING: ["ENG_"], MEDICAL: ["MED_"], FINANCE: ["FIN_"], 
  EDUCATION: ["EDU_"], SUPPLY_CHAIN: ["SCM_"], MARKETING: ["MKT_"], SALES: ["SAL_"],
  HR: ["HR_"], ARTS_DESIGN: ["ART_"], MEDIA_SCIENCES: ["MS_"], MULTIMEDIA: ["MM_"],
};

export const detectFieldByCode = (code: string): CareerField | null => {
  const entries = Object.entries(CareerFieldPrefix) as Array<[CareerField, string[]]>;
  for (const [field, prefixes] of entries) {
    if (prefixes.some((p) => code.startsWith(p))) return field;
  }
  return null;
};

// 1) Your base lists
export const ITProfiles: CareerAnalyticsProfile[] = [
// 1. Software Developer (1-5 scale)
{
  code: "IT_SD",
  name: "Software Developer",
  mbti: { EI: 2, SN: 3, TF: 4, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 5, Spatial: 4, BodilyKinesthetic: 2, Musical: 1, Interpersonal: 2, Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 3, WorkingWithShapes: 4,
    WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 2,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 5, Conscientiousness: 4, Extraversion: 2, Agreeableness: 3, EmotionalStability: 3
  },
  skills: {
   AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4, InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 5, SelfManagement: 4
  },
},
// 2. Frontend Developer (1-5 scale)
{
  code: "IT_FE",
  name: "Frontend Developer",
  mbti: { EI: 3, SN: 3, TF: 4, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 4, Spatial: 4, BodilyKinesthetic: 2, Musical: 1, Interpersonal: 3, Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 3, WorkingWithShapes: 4,
    WorkingWithPeople: 3, WorkingWithData: 4, WorkingWithThings: 2,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 5, Conscientiousness: 4, Extraversion: 3, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 4, EthicalProfessional: 3, InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 3. Backend Developer
{
    code: "IT_BE",
    name: "Backend Developer",
    mbti: { EI: 2, SN: 4, TF: 4, JP: 3 },
    workingStyle: { Auditory: 1, Visual: 4, Kinesthetic: 2 },
    multipleIntelligence: {
      Linguistic: 2, LogicalMathematical: 5, Spatial: 3, BodilyKinesthetic: 2, Musical: 1, Interpersonal: 2, Intrapersonal: 4, Naturalist: 1
    },
    disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 4 },
    attributes: {
      WorkingWithNumbers: 5, WorkingWithWords: 2, WorkingWithShapes: 3, WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 3,
      DiplomaticIndependentScore: 4,
      CooperativeCompetitiveScore: 3,
      SubmissiveAssertiveScore: 3,
      SpontaneousConscientiousScore: 4,
      InnovativeConventionalScore: 4,
      ReactiveOrganizedScore: 4,
      IntrovertExtrovertScore: 2,
      SelfSufficientGroupOrientedScore: 4,
      ReservedOutgoingScore: 2,
      EmotionalStableScore: 4,
      RestlessPoisedScore: 3,
      ExcitableRelaxedScore: 3,
      FrankSocialDesirabilityScore: 3
    },
    traits: {
      Openness: 4, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
    },
    skills: {
     AnalyticalProblemSolving: 5, CommunicationInfluence: 2, EthicalProfessional: 4, InterpersonalTeam: 2, LeadershipInitiative: 2, LearningDevelopment: 4, SelfManagement: 5,
    },

},
// 4. Full Stack Developer
{
  code: "IT_FS",
  name: "Full Stack Developer",
  mbti: { EI: 2, SN: 3, TF: 4, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 4, Spatial: 4, BodilyKinesthetic: 2, Musical: 1, Interpersonal: 2, Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 3, WorkingWithShapes: 4, WorkingWithPeople: 2, WorkingWithData: 4, WorkingWithThings: 2,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: { 
    Openness: 4, Conscientiousness: 4, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4, InterpersonalTeam: 4, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 5. Mobile App Developer (1-5 scale)
{
  code: "IT_MOB",
  name: "Mobile App Developer",
  mbti: { EI: 2, SN: 3, TF: 4, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 4, Spatial: 4, BodilyKinesthetic: 2, Musical: 1, Interpersonal: 2, Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 3, WorkingWithShapes: 4, WorkingWithPeople: 2, WorkingWithData: 4, WorkingWithThings: 2,
    DiplomaticIndependentScore: 3, CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3, SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4, ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2, SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2, EmotionalStableScore: 4,
    RestlessPoisedScore: 3, ExcitableRelaxedScore: 3, FrankSocialDesirabilityScore: 3,
  },
  traits: { Openness: 4, Conscientiousness: 4, Extraversion: 3, Agreeableness: 3, EmotionalStability: 4 },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 3, SelfManagement: 4, InterpersonalTeam: 4, LeadershipInitiative: 3, LearningDevelopment: 4, EthicalProfessional: 4
  },
},
// 6. Data Analyst 
{
  code: "IT_DA",
  name: "Data Analyst",
  mbti: { EI: 2, SN: 4, TF: 4, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 4, Spatial: 3, BodilyKinesthetic: 1, Musical: 1, Interpersonal: 2, Intrapersonal: 4, Naturalist: 2,
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 3, WorkingWithShapes: 3, WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 2,
    DiplomaticIndependentScore: 3, CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3, SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4, ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2, SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2, EmotionalStableScore: 4,
    RestlessPoisedScore: 3, ExcitableRelaxedScore: 3, FrankSocialDesirabilityScore: 3,
  },
  traits: { Openness: 4, Conscientiousness: 4, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4 },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4, InterpersonalTeam: 4, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 7. Data Scientist (1-5 scale)
{
  code: "IT_DS",
  name: "Data Scientist",
  mbti: { EI: 2, SN: 4, TF: 4, JP: 3 },
  workingStyle: { Auditory: 1, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 5, Spatial: 4, BodilyKinesthetic: 1, Musical: 1, Interpersonal: 2, Intrapersonal: 4, Naturalist: 1,
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 3, WorkingWithShapes: 4, WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 2,
    DiplomaticIndependentScore: 4, CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3, SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4, ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2, SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2, EmotionalStableScore: 4,
    RestlessPoisedScore: 3, ExcitableRelaxedScore: 3, FrankSocialDesirabilityScore: 3,
  },
  traits: { Openness: 4, Conscientiousness: 4, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4 },  
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4, InterpersonalTeam: 2, LeadershipInitiative: 3, LearningDevelopment: 5, SelfManagement: 4,
  },
},
// 8. AI / Machine Learning Specialist
{
  code: "IT_AI",
  name: "AI/Machine Learning Specialist",
  mbti: { EI: 2, SN: 4, TF: 4, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 5, Spatial: 4, BodilyKinesthetic: 1, Musical: 1, Interpersonal: 2, Intrapersonal: 4, Naturalist: 1,
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 3, WorkingWithShapes: 4, WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 2,
    DiplomaticIndependentScore: 4, CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3, SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4, ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2, SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2, EmotionalStableScore: 4,
    RestlessPoisedScore: 3, ExcitableRelaxedScore: 3, FrankSocialDesirabilityScore: 3,
  },
  traits: { 
    Openness: 5, Conscientiousness: 4, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4, InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 5, SelfManagement: 4
  },
},
// 9. Cybersecurity Analyst
{
  code: "IT_CSA",
  name: "Cybersecurity Analyst",
  mbti: { EI: 2, SN: 4, TF: 4, JP: 3 },
  workingStyle: { Auditory: 1, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 4, Spatial: 3, BodilyKinesthetic: 1, Musical: 1, Interpersonal: 2, Intrapersonal: 4, Naturalist: 1,
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 3, WorkingWithShapes: 3, WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 2,
    DiplomaticIndependentScore: 3, CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3, SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4, ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2, SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2, EmotionalStableScore: 4,
    RestlessPoisedScore: 3, ExcitableRelaxedScore: 3, FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 4, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 5
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 5, InterpersonalTeam: 2, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 10. Cybersecurity Manager
{
  code: "IT_CSM",
  name: "Cybersecurity Manager",
  mbti: { EI: 2, SN: 3, TF: 4, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 4, Spatial: 3, BodilyKinesthetic: 2, Musical: 1, Interpersonal: 4,  Intrapersonal: 4, Naturalist: 1,
  },
  disc: { Dominance: 4, Influence: 3, Steadiness: 4, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 3, WorkingWithShapes: 4, WorkingWithPeople: 4, WorkingWithData: 4, WorkingWithThings: 3,
    DiplomaticIndependentScore: 4, CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3, SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4, ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2, SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 3, EmotionalStableScore: 4,
    RestlessPoisedScore: 3, ExcitableRelaxedScore: 3, FrankSocialDesirabilityScore: 3,
  },
  traits: { 
    Openness: 4, Conscientiousness: 4, Extraversion: 3, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 4, EthicalProfessional: 5, InterpersonalTeam: 4, LeadershipInitiative: 4, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 11. Cloud Architect
{
  code: "IT_CA",
  name: "Cloud Architect",
  mbti: { EI: 2, SN: 3, TF: 4, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 4, Spatial: 4,   BodilyKinesthetic: 2, Musical: 1, Interpersonal: 3, Intrapersonal: 4, Naturalist: 1,
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 3, WorkingWithShapes: 4, WorkingWithPeople: 3, WorkingWithData: 4, WorkingWithThings: 2,
    DiplomaticIndependentScore: 3, CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3, SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4, ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2, SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2, EmotionalStableScore: 4,
    RestlessPoisedScore: 3, ExcitableRelaxedScore: 3, FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 4, Conscientiousness: 5, Extraversion: 3, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 4, EthicalProfessional: 4, InterpersonalTeam: 3, LeadershipInitiative: 4, LearningDevelopment: 5, SelfManagement: 4
  },
},
// 12. DevOps Engineer
{
  code: "IT_DEVOPS",
  name: "DevOps Engineer",
  mbti: { EI: 2, SN: 3, TF: 4, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 4, Spatial: 4, BodilyKinesthetic: 2, Musical: 1, Interpersonal: 3, Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 3, WorkingWithShapes: 4, WorkingWithPeople: 3, WorkingWithData: 4, WorkingWithThings: 3,
    DiplomaticIndependentScore: 3, CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3, SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4, ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2, SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2, EmotionalStableScore: 4,
    RestlessPoisedScore: 3, ExcitableRelaxedScore: 3, FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 4, Conscientiousness: 4, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4, InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 13. System Administrator
{
  code: "IT_SYS",
  name: "System Administrator",
  mbti: { EI: 2, SN: 3, TF: 4, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 3, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 4, Spatial: 3, BodilyKinesthetic: 2, Musical: 1, Interpersonal: 3, Intrapersonal: 4, Naturalist: 1,
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 4, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 3, WorkingWithShapes: 3, WorkingWithPeople: 3, WorkingWithData: 4, WorkingWithThings: 4,
    DiplomaticIndependentScore: 3, CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3, SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4, ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2, SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2, EmotionalStableScore: 4,
    RestlessPoisedScore: 3, ExcitableRelaxedScore: 3, FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 3, Conscientiousness: 4, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 3, EthicalProfessional: 4, InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 14. Network Engineer
{
  code: "IT_NET",
  name: "Network Engineer",
  mbti: { EI: 2, SN: 3, TF: 4, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 4, Spatial: 4, BodilyKinesthetic: 2, Musical: 1, Interpersonal: 3, Intrapersonal: 4, Naturalist: 1,
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 4, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 3, WorkingWithShapes: 4, WorkingWithPeople: 3, WorkingWithData: 4, WorkingWithThings: 4,
    DiplomaticIndependentScore: 3, CooperativeCompetitiveScore: 3, 
    SubmissiveAssertiveScore: 3, SpontaneousConscientiousScore: 4, 
    InnovativeConventionalScore: 4, ReactiveOrganizedScore: 4, 
    IntrovertExtrovertScore: 2, SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2, EmotionalStableScore: 4, 
    RestlessPoisedScore: 3, ExcitableRelaxedScore: 3, FrankSocialDesirabilityScore: 3,
  },
  traits: { 
    Openness: 4, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4 
  },
  skills: { 
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4, InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4 
  },
},
// 15. Database Administrator 
{
  code: "IT_DBA",
  name: "Database Administrator",
  mbti: { EI: 2, SN: 4, TF: 4, JP: 3 },
  workingStyle: { Auditory: 1, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 5, Spatial: 3, BodilyKinesthetic: 2, Musical: 1, Interpersonal: 2, Intrapersonal: 4, Naturalist: 1,
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 3, WorkingWithShapes: 3, WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 3,
    DiplomaticIndependentScore: 4, CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3, SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4, ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2, SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2, EmotionalStableScore: 4,
    RestlessPoisedScore: 3, ExcitableRelaxedScore: 3, FrankSocialDesirabilityScore: 3,
  },
  traits: { 
    Openness: 4, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4 
  },
  skills: { 
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4, InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4 
  },
},
// 16. QA / Test Engineer 
{
  code: "IT_QA",
  name: "QA / Test Engineer",
  mbti: { EI: 2, SN: 3, TF: 4, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 4, Spatial: 3, BodilyKinesthetic: 2, Musical: 1, Interpersonal: 2, Intrapersonal: 4, Naturalist: 1,
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 4, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 3, WorkingWithShapes: 3, WorkingWithPeople: 2, WorkingWithData: 4, WorkingWithThings: 3,
    DiplomaticIndependentScore: 3, CooperativeCompetitiveScore: 3, SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 4, InnovativeConventionalScore: 4, ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2, SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2, EmotionalStableScore: 4,
    RestlessPoisedScore: 3, ExcitableRelaxedScore: 3, FrankSocialDesirabilityScore: 3,
  },
  traits: { 
    Openness: 4, Conscientiousness: 4, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4 
  },
  skills: { 
    AnalyticalProblemSolving: 4, CommunicationInfluence: 3, EthicalProfessional: 4, InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 17. UI/UX Designer
{
  code: "IT_UX",
  name: "UI/UX Designer",
  mbti: { EI: 3, SN: 3, TF: 4, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 5, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 4, Spatial: 5,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 3,
    Intrapersonal: 4, Naturalist: 1,
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 3,
    WorkingWithWords: 3,
    WorkingWithShapes: 5,
    WorkingWithPeople: 3,
    WorkingWithData: 4,
    WorkingWithThings: 3,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: { 
    Openness: 4, Conscientiousness: 4, Extraversion: 3, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 3, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 18. Product Manager (Tech)
{
  code: "IT_PM",
  name: "Product Manager (Tech)",
  mbti: { EI: 3, SN: 3, TF: 4, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 4, Spatial: 4,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 4,
    Intrapersonal: 4, Naturalist: 1,
  },
  disc: { Dominance: 4, Influence: 3, Steadiness: 4, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4,
    WorkingWithWords: 4,
    WorkingWithShapes: 4,
    WorkingWithPeople: 5,
    WorkingWithData: 4,
    WorkingWithThings: 3,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },

  traits: {
    Openness: 4, Conscientiousness: 4, Extraversion: 5, Agreeableness: 4, EmotionalStability: 4
  },
  
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 4,
    InterpersonalTeam: 5, LeadershipInitiative: 5, LearningDevelopment: 4, SelfManagement: 4
  }
}
];

export const EngineeringProfiles: CareerAnalyticsProfile[] = [
// 1. Electrical Engineer
{
  code: "ENG_EE",
  name: "Electrical Engineer",
  mbti: { EI: 2, SN: 4, TF: 5, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 5, Spatial: 4,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 2,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 2, WorkingWithShapes: 4,
    WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 4,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 4, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 5,
    InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 5
  }
},
// 2. Mechanical Engineer
{
  code: "ENG_ME",
  name: "Mechanical Engineer",
  mbti: { EI: 2, SN: 4, TF: 5, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 4 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 5, Spatial: 4,
    BodilyKinesthetic: 3, Musical: 1, Interpersonal: 2,
    Intrapersonal: 4, Naturalist: 2
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 2, WorkingWithShapes: 5,
    WorkingWithPeople: 2, WorkingWithData: 4, WorkingWithThings: 5,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 4, Conscientiousness: 4, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4
  }
},
// 3. Civil Engineer
{
  code: "ENG_CE",
  name: "Civil Engineer",
  mbti: { EI: 2, SN: 4, TF: 4, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 4, Spatial: 4,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 3,
    Intrapersonal: 3, Naturalist: 2
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 2, WorkingWithShapes: 4,
    WorkingWithPeople: 3, WorkingWithData: 4, WorkingWithThings: 3,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 5,
    InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4
  }
},
// 4. Telecom Engineer
{
  code: "ENG_TE",
  name: "Telecom Engineer",
  mbti: { EI: 2, SN: 3, TF: 4, JP: 4 },
  workingStyle: { Auditory: 3, Visual: 3, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 5, Spatial: 3,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 2,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 2, WorkingWithShapes: 3,
    WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 3,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 4, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 5, SelfManagement: 4
  }
},
// 5. Chemical Engineer 
{
  code: "ENG_CH",
  name: "Chemical Engineer",
  mbti: { EI: 2, SN: 3, TF: 5, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 5, Spatial: 3,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 2,
    Intrapersonal: 4, Naturalist: 2
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 2, WorkingWithShapes: 3,
    WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 4,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 4, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 5,
    InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4
  }
},
// 6. Industrial Engineer
{
  code: "ENG_IE",
  name: "Industrial Engineer",
  mbti: { EI: 3, SN: 4, TF: 4, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 5, Spatial: 3,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 4,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 4, Influence: 3, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 3, WorkingWithShapes: 3,
    WorkingWithPeople: 4, WorkingWithData: 5, WorkingWithThings: 3,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 4, Conscientiousness: 5, Extraversion: 3, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 4, EthicalProfessional: 4,
    InterpersonalTeam: 4, LeadershipInitiative: 4, LearningDevelopment: 5, SelfManagement: 4
  }
},
// 7. Mechatronics Engineer 
{
  code: "ENG_MEC",
  name: "Mechatronics Engineer",
  mbti: { EI: 3, SN: 4, TF: 5, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 5 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 5, Spatial: 4,
    BodilyKinesthetic: 4, Musical: 1, Interpersonal: 3,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 4, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 2, WorkingWithShapes: 4,
    WorkingWithPeople: 3, WorkingWithData: 4, WorkingWithThings: 5,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 5,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 5, Conscientiousness: 4, Extraversion: 3, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4,
    InterpersonalTeam: 4, LeadershipInitiative: 3, LearningDevelopment: 5, SelfManagement: 4
  }
},
// 8. Robotics Engineer 
{
  code: "ENG_ROB",
  name: "Robotics Engineer",
  mbti: { EI: 2, SN: 4, TF: 5, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 5, Kinesthetic: 4 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 5, Spatial: 5,
    BodilyKinesthetic: 3, Musical: 1, Interpersonal: 3,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 4, Influence: 2, Steadiness: 3, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 2, WorkingWithShapes: 5,
    WorkingWithPeople: 3, WorkingWithData: 5, WorkingWithThings: 4,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 5,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 5, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4,
    InterpersonalTeam: 4, LeadershipInitiative: 3, LearningDevelopment: 5, SelfManagement: 4
  }
},
// 9. Automotive Engineer 
{
  code: "ENG_AUTO",
  name: "Automotive Engineer",
  mbti: { EI: 3, SN: 4, TF: 4, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 4 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 4, Spatial: 4,
    BodilyKinesthetic: 3, Musical: 1, Interpersonal: 3,
    Intrapersonal: 3, Naturalist: 2
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 2, WorkingWithShapes: 4,
    WorkingWithPeople: 3, WorkingWithData: 4, WorkingWithThings: 5,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 4, Conscientiousness: 4, Extraversion: 3, Agreeableness: 3, EmotionalStability: 3
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4
  }
},
// 10. Quality Engineer 
{
  code: "ENG_QA",
  name: "Quality Engineer",
  mbti: { EI: 2, SN: 4, TF: 4, JP: 5 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 4, Spatial: 3,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 3,
    Intrapersonal: 4, Naturalist: 2
  },
  disc: { Dominance: 2, Influence: 2, Steadiness: 4, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 3, WorkingWithShapes: 3,
    WorkingWithPeople: 3, WorkingWithData: 5, WorkingWithThings: 3,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 2,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 2,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 2, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 5,
    InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 4, SelfManagement: 5
  }
}
];

export const MedicalProfiles: CareerAnalyticsProfile[] = [
// 1. Physician (1-5 scale)
{
  code: "MED_MD",
  name: "Physician",
  mbti: { EI: 3, SN: 3, TF: 3, JP: 4 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 4, Spatial: 3,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 2
  },
  disc: { Dominance: 3, Influence: 3, Steadiness: 4, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 4, WorkingWithShapes: 2,
    WorkingWithPeople: 5, WorkingWithData: 4, WorkingWithThings: 2,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 4, Conscientiousness: 5, Extraversion: 3, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 4, EthicalProfessional: 5,
    InterpersonalTeam: 4, LeadershipInitiative: 3, LearningDevelopment: 5, SelfManagement: 5
  },
},
// 2. Surgeon (1-5 scale)
{
  code: "MED_SUR",
  name: "Surgeon",
  mbti: { EI: 3, SN: 4, TF: 4, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 5 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 4, Spatial: 4,
    BodilyKinesthetic: 5, Musical: 1, Interpersonal: 4,
    Intrapersonal: 4, Naturalist: 2
  },
  disc: { Dominance: 5, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 3, WorkingWithShapes: 4,
    WorkingWithPeople: 4, WorkingWithData: 4, WorkingWithThings: 5,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 5,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 5,
    RestlessPoisedScore: 5,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 4, Conscientiousness: 5, Extraversion: 3, Agreeableness: 3, EmotionalStability: 5
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 5,
    InterpersonalTeam: 4, LeadershipInitiative: 4, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 3. Medical Officer (1-5 scale)
{
  code: "MED_MO",
  name: "Medical Officer",
  mbti: { EI: 3, SN: 3, TF: 3, JP: 5 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 4, Spatial: 2,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 4,
    Intrapersonal: 4, Naturalist: 2
  },
  disc: { Dominance: 3, Influence: 3, Steadiness: 4, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 4, WorkingWithShapes: 2,
    WorkingWithPeople: 4, WorkingWithData: 5, WorkingWithThings: 2,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 2,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 3, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 4, EthicalProfessional: 5,
    InterpersonalTeam: 4, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 4. Nurse (1-5 scale)
{
  code: "MED_RN",
  name: "Nurse",
  mbti: { EI: 4, SN: 4, TF: 2, JP: 4 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 5 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 3, Spatial: 3,
    BodilyKinesthetic: 5, Musical: 1, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 2
  },
  disc: { Dominance: 3, Influence: 4, Steadiness: 5, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 4, WorkingWithShapes: 2,
    WorkingWithPeople: 5, WorkingWithData: 4, WorkingWithThings: 4,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 5,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 4, Agreeableness: 5, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 4, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 5. Physical Therapist (1-5 scale)
{
  code: "MED_PT",
  name: "Physical Therapist",
  mbti: { EI: 4, SN: 4, TF: 2, JP: 3 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 5 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 3, Spatial: 4,
    BodilyKinesthetic: 5, Musical: 1, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 2
  },
  disc: { Dominance: 3, Influence: 4, Steadiness: 4, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 4, WorkingWithShapes: 3,
    WorkingWithPeople: 5, WorkingWithData: 3, WorkingWithThings: 5,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 5,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 4, Conscientiousness: 4, Extraversion: 4, Agreeableness: 5, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 4, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 6. Occupational Therapist (1-5 scale)
{
  code: "MED_OT",
  name: "Occupational Therapist",
  mbti: { EI: 4, SN: 4, TF: 2, JP: 4 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 5 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 3, Spatial: 4,
    BodilyKinesthetic: 5, Musical: 1, Interpersonal: 5,
    Intrapersonal: 5, Naturalist: 2
  },
  disc: { Dominance: 3, Influence: 4, Steadiness: 5, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 5, WorkingWithShapes: 3,
    WorkingWithPeople: 5, WorkingWithData: 3, WorkingWithThings: 5,
    DiplomaticIndependentScore: 5,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 5,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 4, Conscientiousness: 5, Extraversion: 4, Agreeableness: 5, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 4, LearningDevelopment: 5, SelfManagement: 5
  },
},
// 7. Pharmacist (1-5 scale)
{
  code: "MED_PHR",
  name: "Pharmacist",
  mbti: { EI: 2, SN: 4, TF: 4, JP: 4 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 4, Spatial: 2,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 4,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 2, Influence: 3, Steadiness: 4, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 4, WorkingWithShapes: 2,
    WorkingWithPeople: 4, WorkingWithData: 4, WorkingWithThings: 2,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 2,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 2,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 2, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 4, EthicalProfessional: 5,
    InterpersonalTeam: 4, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 8. Medical Lab Technologist (1-5 scale)
{
  code: "MED_MLT",
  name: "Medical Lab Technologist",
  mbti: { EI: 2, SN: 4, TF: 5, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 5, Spatial: 3,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 2,
    Intrapersonal: 4, Naturalist: 2
  },
  disc: { Dominance: 2, Influence: 1, Steadiness: 4, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 2, WorkingWithShapes: 2,
    WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 3,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 2,
    SubmissiveAssertiveScore: 2,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 2,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 1,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 1, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 2, EthicalProfessional: 5,
    InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 9. Radiologist (1-5 scale)
{
  code: "MED_RAD",
  name: "Radiologist",
  mbti: { EI: 2, SN: 4, TF: 5, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 5, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 5, Spatial: 5,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 2,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 1, Steadiness: 3, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 3, WorkingWithShapes: 5,
    WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 2,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 1,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 4, Conscientiousness: 5, Extraversion: 1, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 5,
    InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 10. Healthcare Administrator (1-5 scale)
{
  code: "MED_ADMIN",
  name: "Healthcare Administrator",
  mbti: { EI: 3, SN: 4, TF: 3, JP: 5 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 3, Spatial: 2,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 2
  },
  disc: { Dominance: 4, Influence: 3, Steadiness: 4, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 4, WorkingWithShapes: 2,
    WorkingWithPeople: 5, WorkingWithData: 4, WorkingWithThings: 1,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 3, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 4, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 4, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 11. Public Health Officer (1-5 scale)
{
  code: "MED_PHO",
  name: "Public Health Officer",
  mbti: { EI: 3, SN: 4, TF: 4, JP: 4 },
  workingStyle: { Auditory: 4, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 4, Spatial: 2,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 4
  },
  disc: { Dominance: 4, Influence: 4, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 4, WorkingWithShapes: 2,
    WorkingWithPeople: 5, WorkingWithData: 5, WorkingWithThings: 2,
    DiplomaticIndependentScore: 5,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 4, Conscientiousness: 4, Extraversion: 3, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 4, LearningDevelopment: 5, SelfManagement: 4
  },
},

];

export const FinanceProfiles: CareerAnalyticsProfile[] = [
// 1. Chartered Accountant (1-5 scale)
{
  code: "FIN_CA",
  name: "Chartered Accountant",
  mbti: { EI: 2, SN: 4, TF: 5, JP: 5 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 5, Spatial: 2,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 2,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 2, Influence: 1, Steadiness: 3, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 3, WorkingWithShapes: 2,
    WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 1,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 2,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 2,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 2, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 5,
    InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 2. Financial Analyst (1-5 scale)
{
  code: "FIN_FA",
  name: "Financial Analyst",
  mbti: { EI: 2, SN: 3, TF: 5, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 5, Spatial: 3,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 3,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 3, WorkingWithShapes: 2,
    WorkingWithPeople: 3, WorkingWithData: 5, WorkingWithThings: 1,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 5,
    InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 3. Accounts Officer (1-5 scale)
{
  code: "FIN_AO",
  name: "Accounts Officer",
  mbti: { EI: 2, SN: 4, TF: 4, JP: 5 },
  workingStyle: { Auditory: 2, Visual: 3, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 4, Spatial: 2,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 3,
    Intrapersonal: 3, Naturalist: 1
  },
  disc: { Dominance: 2, Influence: 2, Steadiness: 4, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 3, WorkingWithShapes: 1,
    WorkingWithPeople: 3, WorkingWithData: 4, WorkingWithThings: 2,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 2,
    SubmissiveAssertiveScore: 2,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 2,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 2, Conscientiousness: 5, Extraversion: 2, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 3, EthicalProfessional: 5,
    InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 3, SelfManagement: 5
  },
},
// 4. Audit Manager (1-5 scale)
{
  code: "FIN_AUD",
  name: "Audit Manager",
  mbti: { EI: 3, SN: 4, TF: 5, JP: 5 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 5, Spatial: 3,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 4,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 4, Influence: 3, Steadiness: 3, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 4, WorkingWithShapes: 2,
    WorkingWithPeople: 4, WorkingWithData: 5, WorkingWithThings: 2,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 3, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 4, EthicalProfessional: 5,
    InterpersonalTeam: 4, LeadershipInitiative: 5, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 5. Tax Consultant (1-5 scale)
{
  code: "FIN_TAX",
  name: "Tax Consultant",
  mbti: { EI: 2, SN: 3, TF: 4, JP: 5 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 5, Spatial: 2,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 3,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 4, WorkingWithShapes: 2,
    WorkingWithPeople: 3, WorkingWithData: 5, WorkingWithThings: 1,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 4, EthicalProfessional: 5,
    InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 6. Budget Analyst (1-5 scale)
{
  code: "FIN_BUD",
  name: "Budget Analyst",
  mbti: { EI: 2, SN: 4, TF: 4, JP: 5 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 5, Spatial: 3,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 2,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 4, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 3, WorkingWithShapes: 3,
    WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 1,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 7. Investment Analyst (1-5 scale)
{
  code: "FIN_INV",
  name: "Investment Analyst",
  mbti: { EI: 2, SN: 3, TF: 5, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 5, Spatial: 4,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 3,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 4, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 3, WorkingWithShapes: 4,
    WorkingWithPeople: 3, WorkingWithData: 5, WorkingWithThings: 1,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 4, Conscientiousness: 4, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 5, SelfManagement: 4
  },
},
//  8. Risk Analyst (1-5 scale)
{
  code: "FIN_RISK",
  name: "Risk Analyst",
  mbti: { EI: 2, SN: 3, TF: 5, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 5, Spatial: 3,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 3,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 3, WorkingWithShapes: 2,
    WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 1,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 2,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 5,
    InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 9. Banking Officer (1-5 scale)
{
  code: "FIN_BANK",
  name: "Banking Officer",
  mbti: { EI: 4, SN: 4, TF: 3, JP: 4 },
  workingStyle: { Auditory: 3, Visual: 3, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 4, Spatial: 2,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 5,
    Intrapersonal: 3, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 4, Steadiness: 4, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 4, WorkingWithShapes: 1,
    WorkingWithPeople: 5, WorkingWithData: 4, WorkingWithThings: 1,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 2,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 2, Conscientiousness: 4, Extraversion: 4, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 3, LearningDevelopment: 3, SelfManagement: 4
  },
},
];

export const EducationProfiles: CareerAnalyticsProfile[] = [
// 1. Teacher / Educator (1-5 scale)
{
  code: "EDU_TCH",
  name: "Teacher / Educator",
  mbti: { EI: 4, SN: 3, TF: 2, JP: 4 },
  workingStyle: { Auditory: 4, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 5, LogicalMathematical: 3, Spatial: 3,
    BodilyKinesthetic: 3, Musical: 2, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 2
  },
  disc: { Dominance: 3, Influence: 5, Steadiness: 4, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 5, WorkingWithShapes: 2,
    WorkingWithPeople: 5, WorkingWithData: 3, WorkingWithThings: 2,
    DiplomaticIndependentScore: 5,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 4, Conscientiousness: 4, Extraversion: 4, Agreeableness: 5, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 4, LearningDevelopment: 5, SelfManagement: 4
  },
},
// 2. Lecturer (1-5 scale)
{
  code: "EDU_LEC",
  name: "Lecturer",
  mbti: { EI: 4, SN: 3, TF: 3, JP: 4 },
  workingStyle: { Auditory: 4, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 5, LogicalMathematical: 3, Spatial: 2,
    BodilyKinesthetic: 2, Musical: 2, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 4, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 5, WorkingWithShapes: 2,
    WorkingWithPeople: 5, WorkingWithData: 3, WorkingWithThings: 1,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 4, Conscientiousness: 4, Extraversion: 4, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 3, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 3, LearningDevelopment: 5, SelfManagement: 4
  },
},
// 3. Professor (1-5 scale)
{
  code: "EDU_PROF",
  name: "Professor",
  mbti: { EI: 3, SN: 3, TF: 4, JP: 4 },
  workingStyle: { Auditory: 4, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 5, LogicalMathematical: 4, Spatial: 2,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 4,
    Intrapersonal: 5, Naturalist: 2
  },
  disc: { Dominance: 3, Influence: 3, Steadiness: 3, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 5, WorkingWithShapes: 2,
    WorkingWithPeople: 4, WorkingWithData: 4, WorkingWithThings: 1,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 5, Conscientiousness: 5, Extraversion: 3, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 4, LeadershipInitiative: 4, LearningDevelopment: 5, SelfManagement: 5
  },
},
// 4. Academic Coordinator (1-5 scale)
{
  code: "EDU_AC",
  name: "Academic Coordinator",
  mbti: { EI: 4, SN: 4, TF: 3, JP: 5 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 3, Spatial: 2,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 4, Steadiness: 4, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 4, WorkingWithShapes: 2,
    WorkingWithPeople: 5, WorkingWithData: 4, WorkingWithThings: 2,
    DiplomaticIndependentScore: 5,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 5,
  },
  traits: {
    Openness: 4, Conscientiousness: 5, Extraversion: 4, Agreeableness: 5, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 4, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 5. Curriculum Developer (1-5 scale)
{
  code: "EDU_CUR",
  name: "Curriculum Developer",
  mbti: { EI: 2, SN: 3, TF: 3, JP: 5 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 5, LogicalMathematical: 3, Spatial: 3,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 4,
    Intrapersonal: 4, Naturalist: 2
  },
  disc: { Dominance: 2, Influence: 3, Steadiness: 3, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 5, WorkingWithShapes: 3,
    WorkingWithPeople: 4, WorkingWithData: 4, WorkingWithThings: 1,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 2,
    SubmissiveAssertiveScore: 2,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 4, Conscientiousness: 5, Extraversion: 2, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 4, EthicalProfessional: 5,
    InterpersonalTeam: 4, LeadershipInitiative: 3, LearningDevelopment: 5, SelfManagement: 5
  },
},
// 6. Education Consultant (1-5 scale)
{
  code: "EDU_CONS",
  name: "Education Consultant",
  mbti: { EI: 4, SN: 3, TF: 2, JP: 3 },
  workingStyle: { Auditory: 4, Visual: 3, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 3, Spatial: 2,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 2
  },
  disc: { Dominance: 3, Influence: 5, Steadiness: 3, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 4, WorkingWithShapes: 2,
    WorkingWithPeople: 5, WorkingWithData: 3, WorkingWithThings: 1,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 3,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 3,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 4, Conscientiousness: 4, Extraversion: 4, Agreeableness: 5, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 4, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 7. School Administrator (1-5 scale)
{
  code: "EDU_ADMIN",
  name: "School Administrator",
  mbti: { EI: 3, SN: 4, TF: 3, JP: 5 },
  workingStyle: { Auditory: 3, Visual: 3, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 3, Spatial: 2,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 5,
    Intrapersonal: 3, Naturalist: 2
  },
  disc: { Dominance: 4, Influence: 3, Steadiness: 4, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 3, WorkingWithShapes: 2,
    WorkingWithPeople: 5, WorkingWithData: 4, WorkingWithThings: 2,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 5,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 3, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 4, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 5, LearningDevelopment: 3, SelfManagement: 5
  },
},
//  8. Online Instructor (1-5 scale)
{
  code: "EDU_OL",
  name: "Online Instructor",
  mbti: { EI: 4, SN: 3, TF: 2, JP: 3 },
  workingStyle: { Auditory: 4, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 5, LogicalMathematical: 3, Spatial: 3,
    BodilyKinesthetic: 2, Musical: 2, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 5, Steadiness: 4, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 5, WorkingWithShapes: 2,
    WorkingWithPeople: 5, WorkingWithData: 3, WorkingWithThings: 1,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 3,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 3,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 4, Conscientiousness: 4, Extraversion: 4, Agreeableness: 5, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 4, LearningDevelopment: 5, SelfManagement: 4
  },
},  
];

export const SupplyChainProfiles: CareerAnalyticsProfile[] = [

// 1. Supply Chain Analyst (1-5 scale)
{
  code: "SCM_SCA",
  name: "Supply Chain Analyst",
  mbti: { EI: 2, SN: 3, TF: 5, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 5, Spatial: 3,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 3,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 3, WorkingWithShapes: 2,
    WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 2,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 4, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 2. Logistics Coordinator (1-5 scale)
{
  code: "SCM_LOG",
  name: "Logistics Coordinator",
  mbti: { EI: 3, SN: 4, TF: 3, JP: 5 },
  workingStyle: { Auditory: 3, Visual: 3, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 3, Spatial: 3,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 4,
    Intrapersonal: 3, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 3, Steadiness: 4, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 3, WorkingWithShapes: 2,
    WorkingWithPeople: 4, WorkingWithData: 4, WorkingWithThings: 4,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 2,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 3, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 4, EthicalProfessional: 4,
    InterpersonalTeam: 4, LeadershipInitiative: 3, LearningDevelopment: 3, SelfManagement: 5
  },
},
// 3. Procurement Officer (1-5 scale)
{
  code: "SCM_PROC",
  name: "Procurement Officer",
  mbti: { EI: 3, SN: 3, TF: 4, JP: 4 },
  workingStyle: { Auditory: 3, Visual: 3, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 4, Spatial: 2,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 4,
    Intrapersonal: 3, Naturalist: 1
  },
  disc: { Dominance: 4, Influence: 4, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 4, WorkingWithShapes: 1,
    WorkingWithPeople: 4, WorkingWithData: 4, WorkingWithThings: 2,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 4, Extraversion: 3, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 4,
    InterpersonalTeam: 4, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 4. Operations Manager (1-5 scale)
{
  code: "SCM_OM",
  name: "Operations Manager",
  mbti: { EI: 4, SN: 4, TF: 4, JP: 4 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 4, Spatial: 3,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 5, Influence: 4, Steadiness: 3, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 4, WorkingWithShapes: 2,
    WorkingWithPeople: 5, WorkingWithData: 4, WorkingWithThings: 4,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 5,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 5,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 4, Conscientiousness: 5, Extraversion: 4, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 4, EthicalProfessional: 4,
    InterpersonalTeam: 5, LeadershipInitiative: 5, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 5. Warehouse Manager (1-5 scale)
{
  code: "SCM_WH",
  name: "Warehouse Manager",
  mbti: { EI: 4, SN: 4, TF: 3, JP: 5 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 4 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 4, Spatial: 4,
    BodilyKinesthetic: 4, Musical: 1, Interpersonal: 4,
    Intrapersonal: 3, Naturalist: 2
  },
  disc: { Dominance: 4, Influence: 3, Steadiness: 4, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 3, WorkingWithShapes: 4,
    WorkingWithPeople: 4, WorkingWithData: 4, WorkingWithThings: 5,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 4, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 4, EthicalProfessional: 4,
    InterpersonalTeam: 4, LeadershipInitiative: 5, LearningDevelopment: 3, SelfManagement: 5
  },
},
// 6. Inventory Planner (1-5 scale)
{
  code: "SCM_INV",
  name: "Inventory Planner",
  mbti: { EI: 2, SN: 4, TF: 4, JP: 5 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 5, Spatial: 3,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 3,
    Intrapersonal: 4, Naturalist: 2
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 4, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 3, WorkingWithShapes: 3,
    WorkingWithPeople: 3, WorkingWithData: 5, WorkingWithThings: 3,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 7. Production Planner (1-5 scale)
{
  code: "SCM_PP",
  name: "Production Planner",
  mbti: { EI: 3, SN: 4, TF: 4, JP: 5 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 5, Spatial: 3,
    BodilyKinesthetic: 3, Musical: 1, Interpersonal: 3,
    Intrapersonal: 4, Naturalist: 2
  },
  disc: { Dominance: 4, Influence: 2, Steadiness: 4, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 3, WorkingWithShapes: 3,
    WorkingWithPeople: 3, WorkingWithData: 5, WorkingWithThings: 3,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 3, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4,
    InterpersonalTeam: 4, LeadershipInitiative: 4, LearningDevelopment: 4, SelfManagement: 5
  },
},
];

export const MarketingProfiles: CareerAnalyticsProfile[] = [
// 1. Marketing Manager (1-5 scale)
{
  code: "MKT_MM",
  name: "Marketing Manager",
  mbti: { EI: 4, SN: 3, TF: 3, JP: 4 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 3, Spatial: 3,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 4, Influence: 5, Steadiness: 3, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 5, WorkingWithShapes: 3,
    WorkingWithPeople: 5, WorkingWithData: 4, WorkingWithThings: 1,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 4, Conscientiousness: 4, Extraversion: 4, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 4,
    InterpersonalTeam: 5, LeadershipInitiative: 5, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 2. Digital Marketing Specialist (1-5 scale)
{
  code: "MKT_DM",
  name: "Digital Marketing Specialist",
  mbti: { EI: 3, SN: 4, TF: 4, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 4, Spatial: 4,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 3,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 3, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 3, WorkingWithShapes: 4,
    WorkingWithPeople: 3, WorkingWithData: 5, WorkingWithThings: 1,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 4, Conscientiousness: 4, Extraversion: 3, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 3, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 5, SelfManagement: 4
  },
},
// 3. Brand Manager (1-5 scale)
{
  code: "MKT_BR",
  name: "Brand Manager",
  mbti: { EI: 4, SN: 3, TF: 3, JP: 4 },
  workingStyle: { Auditory: 3, Visual: 5, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 3, Spatial: 4,
    BodilyKinesthetic: 2, Musical: 2, Interpersonal: 4,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 4, Influence: 4, Steadiness: 3, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 4, WorkingWithShapes: 4,
    WorkingWithPeople: 4, WorkingWithData: 4, WorkingWithThings: 1,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 5,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 5, Conscientiousness: 4, Extraversion: 4, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 4,
    InterpersonalTeam: 4, LeadershipInitiative: 4, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 4. Content Strategist (1-5 scale)
{
  code: "MKT_CS",
  name: "Content Strategist",
  mbti: { EI: 3, SN: 3, TF: 3, JP: 4 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 1 },
  multipleIntelligence: {
    Linguistic: 5, LogicalMathematical: 3, Spatial: 4,
    BodilyKinesthetic: 1, Musical: 2, Interpersonal: 4,
    Intrapersonal: 5, Naturalist: 1
  },
  disc: { Dominance: 2, Influence: 4, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 5, WorkingWithShapes: 3,
    WorkingWithPeople: 4, WorkingWithData: 4, WorkingWithThings: 1,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 5,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 5, Conscientiousness: 4, Extraversion: 3, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 4,
    InterpersonalTeam: 4, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 5. SEO Specialist (1-5 scale)
{
  code: "MKT_SEO",
  name: "SEO Specialist",
  mbti: { EI: 2, SN: 4, TF: 5, JP: 4 },
  workingStyle: { Auditory: 1, Visual: 4, Kinesthetic: 1 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 5, Spatial: 3,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 2,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 3, WorkingWithShapes: 2,
    WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 1,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 2,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 5, SelfManagement: 5
  },
},
// 6. Market Research Analyst (1-5 scale)
{
  code: "MKT_MR",
  name: "Market Research Analyst",
  mbti: { EI: 2, SN: 4, TF: 5, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 3, Kinesthetic: 1 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 5, Spatial: 2,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 3,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 3, WorkingWithShapes: 2,
    WorkingWithPeople: 3, WorkingWithData: 5, WorkingWithThings: 1,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 2,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 5,
    InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 7. Growth Marketer (1-5 scale)
{
  code: "MKT_GR",
  name: "Growth Marketer",
  mbti: { EI: 4, SN: 4, TF: 4, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 4, Spatial: 4,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 4,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 4, Influence: 4, Steadiness: 2, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 3, WorkingWithShapes: 4,
    WorkingWithPeople: 4, WorkingWithData: 5, WorkingWithThings: 1,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 5,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 3,
    InnovativeConventionalScore: 5,
    ReactiveOrganizedScore: 3,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 5, Conscientiousness: 4, Extraversion: 4, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 4, EthicalProfessional: 4,
    InterpersonalTeam: 4, LeadershipInitiative: 4, LearningDevelopment: 5, SelfManagement: 4
  },
}
];

export const SalesProfiles: CareerAnalyticsProfile[] = [ 
//  1. Sales Executive (1-5 scale)
{
  code: "SAL_SE",
  name: "Sales Executive",
  mbti: { EI: 5, SN: 3, TF: 3, JP: 3 },
  workingStyle: { Auditory: 4, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 3, Spatial: 2,
    BodilyKinesthetic: 3, Musical: 1, Interpersonal: 5,
    Intrapersonal: 3, Naturalist: 1
  },
  disc: { Dominance: 4, Influence: 5, Steadiness: 3, Compliance: 2 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 5, WorkingWithShapes: 1,
    WorkingWithPeople: 5, WorkingWithData: 3, WorkingWithThings: 2,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 5,
    SpontaneousConscientiousScore: 3,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 3,
    IntrovertExtrovertScore: 5,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 5,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 3, Extraversion: 5, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 3, CommunicationInfluence: 5, EthicalProfessional: 4,
    InterpersonalTeam: 4, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 2. Business Development Executive (1-5 scale)
{
  code: "SAL_BD",
  name: "Business Development Executive",
  mbti: { EI: 5, SN: 3, TF: 3, JP: 3 },
  workingStyle: { Auditory: 4, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 5, LogicalMathematical: 3, Spatial: 2,
    BodilyKinesthetic: 3, Musical: 1, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 4, Influence: 5, Steadiness: 2, Compliance: 2 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 5, WorkingWithShapes: 1,
    WorkingWithPeople: 5, WorkingWithData: 3, WorkingWithThings: 2,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 5,
    SubmissiveAssertiveScore: 5,
    SpontaneousConscientiousScore: 3,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 3,
    IntrovertExtrovertScore: 5,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 5,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 4, Conscientiousness: 3, Extraversion: 5, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 4,
    InterpersonalTeam: 4, LeadershipInitiative: 4, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 3. Account Manager (1-5 scale)
{
  code: "SAL_AM",
  name: "Account Manager",
  mbti: { EI: 4, SN: 3, TF: 2, JP: 4 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 3, Spatial: 2,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 4, Steadiness: 4, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 4, WorkingWithShapes: 1,
    WorkingWithPeople: 5, WorkingWithData: 4, WorkingWithThings: 1,
    DiplomaticIndependentScore: 5,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 4, Extraversion: 4, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 3, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 4. Sales Manager (1-5 scale)
{
  code: "SAL_SM",
  name: "Sales Manager",
  mbti: { EI: 5, SN: 3, TF: 3, JP: 4 },
  workingStyle: { Auditory: 4, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 4, Spatial: 2,
    BodilyKinesthetic: 3, Musical: 1, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 5, Influence: 4, Steadiness: 3, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 4, WorkingWithShapes: 1,
    WorkingWithPeople: 5, WorkingWithData: 4, WorkingWithThings: 2,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 5,
    SubmissiveAssertiveScore: 5,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 5,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 4, Extraversion: 5, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 4, LeadershipInitiative: 5, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 5. Key Account Manager (1-5 scale)
{
  code: "SAL_KAM",
  name: "Key Account Manager",
  mbti: { EI: 4, SN: 3, TF: 2, JP: 5 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 4, Spatial: 2,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 4, Influence: 3, Steadiness: 4, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 4, WorkingWithShapes: 1,
    WorkingWithPeople: 5, WorkingWithData: 5, WorkingWithThings: 1,
    DiplomaticIndependentScore: 5,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 5,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 5,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 4, Agreeableness: 4, EmotionalStability: 5
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 4, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 6. Inside Sales Representative (1-5 scale)
{
  code: "SAL_ISR",
  name: "Inside Sales Representative",
  mbti: { EI: 4, SN: 3, TF: 3, JP: 3 },
  workingStyle: { Auditory: 5, Visual: 3, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 5, LogicalMathematical: 3, Spatial: 1,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 5,
    Intrapersonal: 3, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 5, Steadiness: 3, Compliance: 2 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 5, WorkingWithShapes: 1,
    WorkingWithPeople: 5, WorkingWithData: 3, WorkingWithThings: 1,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 3,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 3,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 3, Extraversion: 4, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 3, CommunicationInfluence: 5, EthicalProfessional: 4,
    InterpersonalTeam: 4, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 7. Customer Success Manager (1-5 scale)
{
  code: "SAL_CSM",
  name: "Customer Success Manager",
  mbti: { EI: 4, SN: 3, TF: 2, JP: 4 },
  workingStyle: { Auditory: 4, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 3, Spatial: 2,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 5,
    Intrapersonal: 5, Naturalist: 1
  },
  disc: { Dominance: 2, Influence: 4, Steadiness: 5, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 5, WorkingWithShapes: 1,
    WorkingWithPeople: 5, WorkingWithData: 4, WorkingWithThings: 1,
    DiplomaticIndependentScore: 5,
    CooperativeCompetitiveScore: 2,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 5,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 5,
    RestlessPoisedScore: 2,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 5,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 4, Agreeableness: 5, EmotionalStability: 5
  },
  skills: {
    AnalyticalProblemSolving: 3, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 5
  },
},
];

export const HRProfiles: CareerAnalyticsProfile[] = [
// 1. Human Resources Manager (1-5 scale)
{
  code: "HR_MGR",
  name: "Human Resources Manager",
  mbti: { EI: 4, SN: 3, TF: 3, JP: 4 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 3, Spatial: 2,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 4, Influence: 4, Steadiness: 3, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 5, WorkingWithShapes: 1,
    WorkingWithPeople: 5, WorkingWithData: 4, WorkingWithThings: 1,
    DiplomaticIndependentScore: 5,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 4, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 5, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 2. HR Business Partner (1-5 scale)
{
  code: "HR_BP",
  name: "HR Business Partner",
  mbti: { EI: 4, SN: 3, TF: 4, JP: 4 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 4, Spatial: 2,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 4, Influence: 3, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 4, WorkingWithShapes: 1,
    WorkingWithPeople: 5, WorkingWithData: 5, WorkingWithThings: 1,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 4, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 4, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 3. Talent Acquisition Specialist (1-5 scale)
{
  code: "HR_TA",
  name: "Talent Acquisition Specialist",
  mbti: { EI: 5, SN: 3, TF: 3, JP: 3 },
  workingStyle: { Auditory: 4, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 5, LogicalMathematical: 2, Spatial: 2,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 5,
    Intrapersonal: 3, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 5, Steadiness: 3, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 5, WorkingWithShapes: 1,
    WorkingWithPeople: 5, WorkingWithData: 3, WorkingWithThings: 1,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 5,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 3,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 5,
    SelfSufficientGroupOrientedScore: 5,
    ReservedOutgoingScore: 5,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 4, Extraversion: 5, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 3, CommunicationInfluence: 5, EthicalProfessional: 4,
    InterpersonalTeam: 5, LeadershipInitiative: 3, LearningDevelopment: 3, SelfManagement: 4
  },
},
// 4. Recruitment Officer (1-5 scale)
{
  code: "HR_REC",
  name: "Recruitment Officer",
  mbti: { EI: 4, SN: 3, TF: 3, JP: 3 },
  workingStyle: { Auditory: 4, Visual: 3, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 2, Spatial: 2,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 5,
    Intrapersonal: 3, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 4, Steadiness: 3, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 5, WorkingWithShapes: 1,
    WorkingWithPeople: 5, WorkingWithData: 3, WorkingWithThings: 1,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 5,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 3,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 5,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 4, Extraversion: 4, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 3, CommunicationInfluence: 5, EthicalProfessional: 4,
    InterpersonalTeam: 5, LeadershipInitiative: 3, LearningDevelopment: 3, SelfManagement: 4
  },
},
// 5. Learning & Development Manager (1-5 scale)
{
  code: "HR_LD",
  name: "Learning & Development Manager",
  mbti: { EI: 4, SN: 3, TF: 3, JP: 4 },
  workingStyle: { Auditory: 4, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 5, LogicalMathematical: 3, Spatial: 3,
    BodilyKinesthetic: 2, Musical: 2, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 4, Steadiness: 4, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 5, WorkingWithShapes: 2,
    WorkingWithPeople: 5, WorkingWithData: 3, WorkingWithThings: 1,
    DiplomaticIndependentScore: 5,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 4, Conscientiousness: 5, Extraversion: 4, Agreeableness: 5, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 3, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 4, LearningDevelopment: 5, SelfManagement: 5
  },
},
// 6. Compensation & Benefits Analyst (1-5 scale)
{
  code: "HR_CB",
  name: "Compensation & Benefits Analyst",
  mbti: { EI: 2, SN: 4, TF: 5, JP: 5 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 5, Spatial: 3,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 2,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 2, Influence: 1, Steadiness: 3, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 3, WorkingWithShapes: 2,
    WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 1,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 2,
    SubmissiveAssertiveScore: 2,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 2,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 2,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 5,
    InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 3, SelfManagement: 5
  },
},
// 7. Employee Relations Officer (1-5 scale)
{
  code: "HR_ER",
  name: "Employee Relations Officer",
  mbti: { EI: 4, SN: 3, TF: 3, JP: 4 },
  workingStyle: { Auditory: 4, Visual: 3, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 5, LogicalMathematical: 3, Spatial: 2,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 4, Influence: 3, Steadiness: 4, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 5, WorkingWithShapes: 1,
    WorkingWithPeople: 5, WorkingWithData: 4, WorkingWithThings: 1,
    DiplomaticIndependentScore: 5,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 5,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 4, Agreeableness: 5, EmotionalStability: 5
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 5,
    InterpersonalTeam: 5, LeadershipInitiative: 3, LearningDevelopment: 3, SelfManagement: 5
  },
},
];

export const ArtsProfiles: CareerAnalyticsProfile[] = [
// 1. Creative Designer (1-5 scale)
{
  code: "ART_CD",
  name: "Creative Designer",
  mbti: { EI: 4, SN: 2, TF: 2, JP: 3 },
  workingStyle: { Auditory: 3, Visual: 5, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 2, Spatial: 5,
    BodilyKinesthetic: 3, Musical: 2, Interpersonal: 4,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 4, Steadiness: 3, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 1, WorkingWithWords: 4, WorkingWithShapes: 5,
    WorkingWithPeople: 4, WorkingWithData: 2, WorkingWithThings: 2,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 3,
    InnovativeConventionalScore: 5,
    ReactiveOrganizedScore: 3,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 3,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 5, Conscientiousness: 3, Extraversion: 4, Agreeableness: 3, EmotionalStability: 3
  },
  skills: {
    AnalyticalProblemSolving: 3, CommunicationInfluence: 4, EthicalProfessional: 4,
    InterpersonalTeam: 4, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 3
  },
},
// 2. Graphic Designer (1-5 scale)
{
  code: "ART_GD",
  name: "Graphic Designer",
  mbti: { EI: 3, SN: 2, TF: 3, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 5, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 3, Spatial: 5,
    BodilyKinesthetic: 2, Musical: 2, Interpersonal: 3,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 2, Influence: 3, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 1, WorkingWithWords: 4, WorkingWithShapes: 5,
    WorkingWithPeople: 3, WorkingWithData: 3, WorkingWithThings: 2,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 2,
    SubmissiveAssertiveScore: 2,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 4, Conscientiousness: 4, Extraversion: 3, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 3, CommunicationInfluence: 3, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 3. Illustrator (1-5 scale)
{
  code: "ART_ILL",
  name: "Illustrator",
  mbti: { EI: 2, SN: 1, TF: 2, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 5, Kinesthetic: 4 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 2, Spatial: 5,
    BodilyKinesthetic: 4, Musical: 2, Interpersonal: 2,
    Intrapersonal: 5, Naturalist: 2
  },
  disc: { Dominance: 2, Influence: 2, Steadiness: 4, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 1, WorkingWithWords: 3, WorkingWithShapes: 5,
    WorkingWithPeople: 2, WorkingWithData: 2, WorkingWithThings: 4,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 2,
    SubmissiveAssertiveScore: 2,
    SpontaneousConscientiousScore: 3,
    InnovativeConventionalScore: 5,
    ReactiveOrganizedScore: 3,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 2,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 5, Conscientiousness: 3, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 2, CommunicationInfluence: 2, EthicalProfessional: 4,
    InterpersonalTeam: 2, LeadershipInitiative: 1, LearningDevelopment: 5, SelfManagement: 4
  },
},
// 4. Fine Artist (1-5 scale)
{
  code: "ART_FA",
  name: "Fine Artist",
  mbti: { EI: 2, SN: 1, TF: 1, JP: 2 },
  workingStyle: { Auditory: 2, Visual: 5, Kinesthetic: 5 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 1, Spatial: 5,
    BodilyKinesthetic: 5, Musical: 3, Interpersonal: 2,
    Intrapersonal: 5, Naturalist: 3
  },
  disc: { Dominance: 2, Influence: 2, Steadiness: 3, Compliance: 2 },
  attributes: {
    WorkingWithNumbers: 1, WorkingWithWords: 3, WorkingWithShapes: 5,
    WorkingWithPeople: 2, WorkingWithData: 1, WorkingWithThings: 5,
    DiplomaticIndependentScore: 5,
    CooperativeCompetitiveScore: 2,
    SubmissiveAssertiveScore: 2,
    SpontaneousConscientiousScore: 2,
    InnovativeConventionalScore: 5,
    ReactiveOrganizedScore: 2,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 2,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 3,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 2,
  },
  traits: {
    Openness: 5, Conscientiousness: 2, Extraversion: 2, Agreeableness: 3, EmotionalStability: 3
  },
  skills: {
    AnalyticalProblemSolving: 2, CommunicationInfluence: 2, EthicalProfessional: 3,
    InterpersonalTeam: 2, LeadershipInitiative: 1, LearningDevelopment: 5, SelfManagement: 3
  },
},
// 5. Art Director (1-5 scale)
{
  code: "ART_AD",
  name: "Art Director",
  mbti: { EI: 4, SN: 2, TF: 3, JP: 4 },
  workingStyle: { Auditory: 4, Visual: 5, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 3, Spatial: 5,
    BodilyKinesthetic: 2, Musical: 2, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 4, Influence: 4, Steadiness: 2, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 4, WorkingWithShapes: 5,
    WorkingWithPeople: 5, WorkingWithData: 3, WorkingWithThings: 2,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 3,
    InnovativeConventionalScore: 5,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 5,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 5, Conscientiousness: 4, Extraversion: 4, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 4,
    InterpersonalTeam: 5, LeadershipInitiative: 5, LearningDevelopment: 4, SelfManagement: 4
  },
},
//  6. Visual Artist (1-5 scale)
{
  code: "ART_VA",
  name: "Visual Artist",
  mbti: { EI: 3, SN: 1, TF: 2, JP: 2 },
  workingStyle: { Auditory: 2, Visual: 5, Kinesthetic: 4 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 2, Spatial: 5,
    BodilyKinesthetic: 4, Musical: 2, Interpersonal: 3,
    Intrapersonal: 5, Naturalist: 2
  },
  disc: { Dominance: 2, Influence: 3, Steadiness: 3, Compliance: 2 },
  attributes: {
    WorkingWithNumbers: 1, WorkingWithWords: 3, WorkingWithShapes: 5,
    WorkingWithPeople: 3, WorkingWithData: 2, WorkingWithThings: 4,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 2,
    SpontaneousConscientiousScore: 2,
    InnovativeConventionalScore: 5,
    ReactiveOrganizedScore: 2,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 3,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 5, Conscientiousness: 2, Extraversion: 3, Agreeableness: 3, EmotionalStability: 3
  },
  skills: {
    AnalyticalProblemSolving: 2, CommunicationInfluence: 3, EthicalProfessional: 3,
    InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 5, SelfManagement: 3
  },
}
];

export const MediaSciencesProfiles: CareerAnalyticsProfile[] = [
 //  1. Journalist (1-5 scale)
{
  code: "MS_JRN",
  name: "Journalist",
  mbti: { EI: 4, SN: 3, TF: 3, JP: 3 },
  workingStyle: { Auditory: 4, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 5, LogicalMathematical: 3, Spatial: 3,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 4,
    Intrapersonal: 4, Naturalist: 2
  },
  disc: { Dominance: 3, Influence: 4, Steadiness: 2, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 5, WorkingWithShapes: 2,
    WorkingWithPeople: 4, WorkingWithData: 4, WorkingWithThings: 1,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 3,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 3,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 3,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 4, Conscientiousness: 3, Extraversion: 4, Agreeableness: 3, EmotionalStability: 3
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 4,
    InterpersonalTeam: 4, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 2. News Reporter (1-5 scale)
{
  code: "MS_REP",
  name: "News Reporter",
  mbti: { EI: 5, SN: 4, TF: 3, JP: 2 },
  workingStyle: { Auditory: 4, Visual: 4, Kinesthetic: 4 },
  multipleIntelligence: {
    Linguistic: 5, LogicalMathematical: 3, Spatial: 3,
    BodilyKinesthetic: 3, Musical: 1, Interpersonal: 5,
    Intrapersonal: 3, Naturalist: 2
  },
  disc: { Dominance: 4, Influence: 5, Steadiness: 2, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 5, WorkingWithShapes: 2,
    WorkingWithPeople: 5, WorkingWithData: 4, WorkingWithThings: 2,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 5,
    SpontaneousConscientiousScore: 2,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 3,
    IntrovertExtrovertScore: 5,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 5,
    EmotionalStableScore: 3,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 4,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 4, Conscientiousness: 3, Extraversion: 5, Agreeableness: 3, EmotionalStability: 3
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 5, EthicalProfessional: 4,
    InterpersonalTeam: 4, LeadershipInitiative: 4, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 3. Media Analyst (1-5 scale)
{
  code: "MS_MA",
  name: "Media Analyst",
  mbti: { EI: 2, SN: 4, TF: 5, JP: 4 },
  workingStyle: { Auditory: 2, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 5, Spatial: 4,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 3,
    Intrapersonal: 4, Naturalist: 2
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 5, WorkingWithWords: 3, WorkingWithShapes: 3,
    WorkingWithPeople: 2, WorkingWithData: 5, WorkingWithThings: 2,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 2,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 2,
    ExcitableRelaxedScore: 2,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 4. Public Relations Officer (1-5 scale)
{
  code: "MS_PR",
  name: "Public Relations Officer",
  mbti: { EI: 5, SN: 3, TF: 2, JP: 4 },
  workingStyle: { Auditory: 4, Visual: 4, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 5, LogicalMathematical: 2, Spatial: 2,
    BodilyKinesthetic: 2, Musical: 1, Interpersonal: 5,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 4, Influence: 5, Steadiness: 3, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 1, WorkingWithWords: 5, WorkingWithShapes: 1,
    WorkingWithPeople: 5, WorkingWithData: 3, WorkingWithThings: 1,
    DiplomaticIndependentScore: 5,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 5,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 5,
    SelfSufficientGroupOrientedScore: 4,
    ReservedOutgoingScore: 5,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 4,
  },
  traits: {
    Openness: 4, Conscientiousness: 4, Extraversion: 5, Agreeableness: 4, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 3, CommunicationInfluence: 5, EthicalProfessional: 4,
    InterpersonalTeam: 5, LeadershipInitiative: 4, LearningDevelopment: 4, SelfManagement: 4
  },
},
// 5. Broadcast Producer (1-5 scale)
{
  code: "MS_BP",
  name: "Broadcast Producer",
  mbti: { EI: 4, SN: 4, TF: 3, JP: 5 },
  workingStyle: { Auditory: 4, Visual: 5, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 4, LogicalMathematical: 3, Spatial: 4,
    BodilyKinesthetic: 2, Musical: 2, Interpersonal: 4,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 4, Influence: 3, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 4, WorkingWithShapes: 4,
    WorkingWithPeople: 4, WorkingWithData: 4, WorkingWithThings: 2,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 4,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 4,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 4,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 4, Conscientiousness: 5, Extraversion: 4, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 4, EthicalProfessional: 4,
    InterpersonalTeam: 4, LeadershipInitiative: 4, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 6. Media Planner (1-5 scale)
{
  code: "MS_MP",
  name: "Media Planner",
  mbti: { EI: 3, SN: 4, TF: 4, JP: 4 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 2 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 4, Spatial: 4,
    BodilyKinesthetic: 1, Musical: 1, Interpersonal: 3,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 3, Steadiness: 3, Compliance: 5 },
  attributes: {
    WorkingWithNumbers: 4, WorkingWithWords: 3, WorkingWithShapes: 3,
    WorkingWithPeople: 3, WorkingWithData: 5, WorkingWithThings: 1,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 5,
    InnovativeConventionalScore: 3,
    ReactiveOrganizedScore: 5,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 2,
    ExcitableRelaxedScore: 2,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 3, Conscientiousness: 5, Extraversion: 3, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 3, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 3, LearningDevelopment: 4, SelfManagement: 5
  },
}  
]; 

export const MultimediaProfiles: CareerAnalyticsProfile[] = [
// 1. Multimedia Designer (1-5 scale)
{
  code: "MM_DSG",
  name: "Multimedia Designer",
  mbti: { EI: 3, SN: 4, TF: 3, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 5, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 2, Spatial: 5,
    BodilyKinesthetic: 3, Musical: 2, Interpersonal: 3,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 3, Steadiness: 3, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 3, WorkingWithShapes: 5,
    WorkingWithPeople: 3, WorkingWithData: 2, WorkingWithThings: 3,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 3,
    InnovativeConventionalScore: 5,
    ReactiveOrganizedScore: 3,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 3,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 5, Conscientiousness: 3, Extraversion: 3, Agreeableness: 3, EmotionalStability: 3
  },
  skills: {
    AnalyticalProblemSolving: 3, CommunicationInfluence: 3, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 4, SelfManagement: 3
  },
},
// 2. Video Editor (1-5 scale)
{
  code: "MM_VE",
  name: "Video Editor",
  mbti: { EI: 2, SN: 4, TF: 3, JP: 4 },
  workingStyle: { Auditory: 4, Visual: 5, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 3, Spatial: 5,
    BodilyKinesthetic: 2, Musical: 4, Interpersonal: 2,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 2, Influence: 2, Steadiness: 4, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 2, WorkingWithShapes: 4,
    WorkingWithPeople: 2, WorkingWithData: 3, WorkingWithThings: 3,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 2,
    SubmissiveAssertiveScore: 2,
    SpontaneousConscientiousScore: 4,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 4, Conscientiousness: 5, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 2, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 4, SelfManagement: 5
  },
},
// 3. Motion Graphics Artist (1-5 scale)
{
  code: "MM_MG",
  name: "Motion Graphics Artist",
  mbti: { EI: 2, SN: 4, TF: 3, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 5, Kinesthetic: 4 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 3, Spatial: 5,
    BodilyKinesthetic: 4, Musical: 3, Interpersonal: 2,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 2, Steadiness: 3, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 2, WorkingWithShapes: 5,
    WorkingWithPeople: 2, WorkingWithData: 3, WorkingWithThings: 3,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 3,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 3,
    InnovativeConventionalScore: 5,
    ReactiveOrganizedScore: 3,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 3,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 5, Conscientiousness: 4, Extraversion: 2, Agreeableness: 3, EmotionalStability: 3
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 2, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 5, SelfManagement: 4
  },
},
// 4. Animator (1-5 scale)
{
  code: "MM_AN",
  name: "Animator",
  mbti: { EI: 2, SN: 4, TF: 2, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 5, Kinesthetic: 5 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 2, Spatial: 5,
    BodilyKinesthetic: 5, Musical: 3, Interpersonal: 2,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 2, Influence: 2, Steadiness: 4, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 1, WorkingWithWords: 2, WorkingWithShapes: 5,
    WorkingWithPeople: 2, WorkingWithData: 2, WorkingWithThings: 4,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 2,
    SubmissiveAssertiveScore: 2,
    SpontaneousConscientiousScore: 3,
    InnovativeConventionalScore: 5,
    ReactiveOrganizedScore: 3,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 3,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 5, Conscientiousness: 4, Extraversion: 2, Agreeableness: 3, EmotionalStability: 3
  },
  skills: {
    AnalyticalProblemSolving: 3, CommunicationInfluence: 2, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 5, SelfManagement: 4
  },
},
// 5. Game Designer (1-5 scale)
{
  code: "MM_GD",
  name: "Game Designer",
  mbti: { EI: 3, SN: 3, TF: 4, JP: 3 },
  workingStyle: { Auditory: 3, Visual: 4, Kinesthetic: 4 },
  multipleIntelligence: {
    Linguistic: 3, LogicalMathematical: 4, Spatial: 4,
    BodilyKinesthetic: 3, Musical: 2, Interpersonal: 3,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 3, Influence: 3, Steadiness: 2, Compliance: 3 },
  attributes: {
    WorkingWithNumbers: 3, WorkingWithWords: 4, WorkingWithShapes: 4,
    WorkingWithPeople: 3, WorkingWithData: 4, WorkingWithThings: 3,
    DiplomaticIndependentScore: 4,
    CooperativeCompetitiveScore: 4,
    SubmissiveAssertiveScore: 3,
    SpontaneousConscientiousScore: 3,
    InnovativeConventionalScore: 5,
    ReactiveOrganizedScore: 3,
    IntrovertExtrovertScore: 3,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 3,
    EmotionalStableScore: 3,
    RestlessPoisedScore: 4,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 5, Conscientiousness: 3, Extraversion: 3, Agreeableness: 3, EmotionalStability: 3
  },
  skills: {
    AnalyticalProblemSolving: 5, CommunicationInfluence: 4, EthicalProfessional: 4,
    InterpersonalTeam: 4, LeadershipInitiative: 3, LearningDevelopment: 5, SelfManagement: 3
  },
},
// 6. 3D Artist (1-5 scale)
{
  code: "MM_3D",
  name: "3D Artist",
  mbti: { EI: 2, SN: 4, TF: 3, JP: 3 },
  workingStyle: { Auditory: 2, Visual: 5, Kinesthetic: 4 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 3, Spatial: 5,
    BodilyKinesthetic: 4, Musical: 2, Interpersonal: 2,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 2, Influence: 2, Steadiness: 4, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 2, WorkingWithShapes: 5,
    WorkingWithPeople: 2, WorkingWithData: 3, WorkingWithThings: 4,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 2,
    SubmissiveAssertiveScore: 2,
    SpontaneousConscientiousScore: 3,
    InnovativeConventionalScore: 5,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 3,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 5, Conscientiousness: 4, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 4, CommunicationInfluence: 2, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 5, SelfManagement: 4
  },
},
// 7. Sound Designer (1-5 scale)
{
  code: "MM_SD",
  name: "Sound Designer",
  mbti: { EI: 2, SN: 3, TF: 3, JP: 3 },
  workingStyle: { Auditory: 5, Visual: 2, Kinesthetic: 3 },
  multipleIntelligence: {
    Linguistic: 2, LogicalMathematical: 3, Spatial: 2,
    BodilyKinesthetic: 2, Musical: 5, Interpersonal: 2,
    Intrapersonal: 4, Naturalist: 1
  },
  disc: { Dominance: 2, Influence: 2, Steadiness: 4, Compliance: 4 },
  attributes: {
    WorkingWithNumbers: 2, WorkingWithWords: 2, WorkingWithShapes: 2,
    WorkingWithPeople: 2, WorkingWithData: 3, WorkingWithThings: 4,
    DiplomaticIndependentScore: 3,
    CooperativeCompetitiveScore: 2,
    SubmissiveAssertiveScore: 2,
    SpontaneousConscientiousScore: 3,
    InnovativeConventionalScore: 4,
    ReactiveOrganizedScore: 4,
    IntrovertExtrovertScore: 2,
    SelfSufficientGroupOrientedScore: 3,
    ReservedOutgoingScore: 2,
    EmotionalStableScore: 4,
    RestlessPoisedScore: 3,
    ExcitableRelaxedScore: 2,
    FrankSocialDesirabilityScore: 3,
  },
  traits: {
    Openness: 4, Conscientiousness: 4, Extraversion: 2, Agreeableness: 3, EmotionalStability: 4
  },
  skills: {
    AnalyticalProblemSolving: 3, CommunicationInfluence: 2, EthicalProfessional: 4,
    InterpersonalTeam: 3, LeadershipInitiative: 2, LearningDevelopment: 4, SelfManagement: 4
  },
}
];

// 2) Put ALL roles here (IT + ENG + MED + ...)
export const AllCareerProfiles: CareerAnalyticsProfile[] = [
  ...ITProfiles,
  ...EngineeringProfiles,
  ...MedicalProfiles,
  ...FinanceProfiles,
  ...EducationProfiles,
  ...SupplyChainProfiles,
  ...MarketingProfiles,
  ...SalesProfiles,
  ...HRProfiles,
  ...ArtsProfiles,
  ...MediaSciencesProfiles,
  ...MultimediaProfiles,
];
// --- UI MATCH OUTPUT (traits+skills based) WITH FIELD CAP ---

export interface Match {
  name: string;
  score: number;
  code?: string;
  field?: CareerField;
}

/** Select top N with maxPerField constraint */
export function selectTopMatchesWithFieldCap(
  input: Match[],
  topN = 6,
  maxPerField = 2
): Match[] {
  // enrich with code+field
  const nameToProfile = new Map(AllCareerProfiles.map((p) => [p.name, p]));
  const enriched: Match[] = input
    .map((m) => {
      const prof = nameToProfile.get(m.name);
      const field = prof ? detectFieldByCode(prof.code) : null;
      return {
        ...m,
        code: prof?.code,
        field: field ?? undefined,
      };
    })
    .filter((m) => !!m.field); // only those we can map to a field

  // sort by score desc
  enriched.sort((a, b) => b.score - a.score);

  // greedy pick with cap
  const picked: Match[] = [];
  const counts: Record<CareerField, number> = {
    IT_CS: 0,
    ENGINEERING: 0,
    MEDICAL: 0,
    FINANCE: 0,
    EDUCATION: 0,
    SUPPLY_CHAIN: 0,
    MARKETING: 0,
    SALES: 0,
    HR: 0,
    ARTS_DESIGN: 0,
    MEDIA_SCIENCES: 0,
    MULTIMEDIA: 0,
  };

  for (const m of enriched) {
    if (picked.length >= topN) break;
    const f = m.field as CareerField;
    if (counts[f] >= maxPerField) continue;
    picked.push({ name: m.name, score: m.score }); // keep UI shape same
    counts[f] += 1;
  }

  // If still not enough (rare), fill ignoring cap? (or keep cap strictly)
  // Keeping cap strictly; if you want always 6, uncomment fallback below.
  /*
  if (picked.length < topN) {
    for (const m of enriched) {
      if (picked.length >= topN) break;
      if (picked.some((x) => x.name === m.name)) continue;
      picked.push({ name: m.name, score: m.score });
    }
  }
  */

  return picked;
}
// 3) Helper (must be AFTER AllCareerProfiles)
const makeProfilesByField = (field: CareerField): CareerAnalyticsProfile[] => {
  return AllCareerProfiles.filter((p) => detectFieldByCode(p.code) === field);
};

export interface CareerFamilyProfile {
  code: string;
  name: string;
  traits: Record<string, number>;
  skills: Record<string, number>;
  exampleRoles: string[];
}

const averageRecord = (records: Array<Record<string, number>>) => {
  const allKeys = Array.from(
    new Set(records.flatMap((record) => Object.keys(record || {})))
  );

  const averaged: Record<string, number> = {};

  allKeys.forEach((key) => {
    const values = records
      .map((record) => record?.[key])
      .filter((value): value is number => typeof value === 'number');

    if (!values.length) return;

    averaged[key] = parseFloat(
      (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)
    );
  });

  return averaged;
};

const buildFamilyProfile = (
  field: CareerField,
  code: string,
  name: string,
  exampleRoles: string[]
): CareerFamilyProfile => {
  const roles = makeProfilesByField(field);

  return {
    code,
    name,
    traits: averageRecord(roles.map((role) => role.traits)),
    skills: averageRecord(roles.map((role) => role.skills)),
    exampleRoles,
  };
};

export const GeneralCareerProfiles: CareerFamilyProfile[] = [
  buildFamilyProfile(
    "IT_CS",
    "FAM_TECH",
    "Technology & Digital Systems",
    ["Software Developer", "Data Analyst", "Cloud Architect"]
  ),
  buildFamilyProfile(
    "ENGINEERING",
    "FAM_ENGINEERING",
    "Engineering & Applied Technical",
    ["Electrical Engineer", "Mechanical Engineer", "Robotics Engineer"]
  ),
  buildFamilyProfile(
    "MEDICAL",
    "FAM_HEALTH",
    "Health & Care",
    ["Physician", "Nurse", "Medical Lab Technologist"]
  ),
  buildFamilyProfile(
    "FINANCE",
    "FAM_FINANCE",
    "Finance & Compliance",
    ["Chartered Accountant", "Financial Analyst", "Risk Analyst"]
  ),
  buildFamilyProfile(
    "EDUCATION",
    "FAM_EDUCATION",
    "Teaching & Education",
    ["Teacher / Educator", "Lecturer", "Curriculum Developer"]
  ),
  buildFamilyProfile(
    "SUPPLY_CHAIN",
    "FAM_OPERATIONS",
    "Operations & Supply Chain",
    ["Supply Chain Analyst", "Logistics Coordinator", "Operations Manager"]
  ),
  buildFamilyProfile(
    "MARKETING",
    "FAM_MARKETING",
    "Marketing & Brand Communication",
    ["Marketing Manager", "Digital Marketing Specialist", "Market Research Analyst"]
  ),
  buildFamilyProfile(
    "SALES",
    "FAM_SALES",
    "Sales & Client Relations",
    ["Sales Executive", "Account Manager", "Customer Success Manager"]
  ),
  buildFamilyProfile(
    "HR",
    "FAM_HR",
    "People & Talent Development",
    ["Human Resources Manager", "Talent Acquisition Specialist", "Learning & Development Manager"]
  ),
  buildFamilyProfile(
    "ARTS_DESIGN",
    "FAM_ARTS",
    "Arts & Creative Design",
    ["Creative Designer", "Graphic Designer", "Art Director"]
  ),
  buildFamilyProfile(
    "MEDIA_SCIENCES",
    "FAM_MEDIA",
    "Media & Public Communication",
    ["Journalist", "Media Analyst", "Public Relations Officer"]
  ),
  buildFamilyProfile(
    "MULTIMEDIA",
    "FAM_MULTIMEDIA",
    "Multimedia & Interactive Design",
    ["Multimedia Designer", "Animator", "Game Designer"]
  ),
];

// 4) Now exports that depend on the helper
export const ITCSCareerProfiles = makeProfilesByField("IT_CS");
export const EngineeringCareerProfiles = makeProfilesByField("ENGINEERING");
export const MedicalCareerProfiles = makeProfilesByField("MEDICAL");
export const FinanceCareerProfiles = makeProfilesByField("FINANCE");
export const EducationCareerProfiles = makeProfilesByField("EDUCATION");
export const SupplyChainCareerProfiles = makeProfilesByField("SUPPLY_CHAIN");
export const MarketingCareerProfiles = makeProfilesByField("MARKETING");
export const SalesCareerProfiles = makeProfilesByField("SALES");
export const HRCareerProfiles = makeProfilesByField("HR");
export const ArtsDesignCareerProfiles = makeProfilesByField("ARTS_DESIGN");
export const MediaSciencesCareerProfiles = makeProfilesByField("MEDIA_SCIENCES");
export const MultimediaCareerProfiles = makeProfilesByField("MULTIMEDIA");

// 5) Map
export const CareerProfilesByField = {
  IT_CS: ITCSCareerProfiles, 
  ENGINEERING: EngineeringCareerProfiles, 
  MEDICAL: MedicalCareerProfiles, 
  FINANCE: FinanceCareerProfiles,
  EDUCATION: EducationCareerProfiles, 
  SUPPLY_CHAIN: SupplyChainCareerProfiles, 
  MARKETING: MarketingCareerProfiles, 
  SALES: SalesCareerProfiles,
  HR: HRCareerProfiles, 
  ARTS_DESIGN: ArtsDesignCareerProfiles, 
  MEDIA_SCIENCES: MediaSciencesCareerProfiles, 
  MULTIMEDIA: MultimediaCareerProfiles,
} as const;



// Maps (fast lookup)
const toMap = (arr: CareerAnalyticsProfile[]) =>
  arr.reduce((acc, p) => {
    acc[p.code] = p;
    return acc;
  }, {} as Record<string, CareerAnalyticsProfile>);

export const ITCSCareerProfilesMap = toMap(ITCSCareerProfiles);
export const EngineeringCareerProfilesMap = toMap(EngineeringCareerProfiles);
export const MedicalCareerProfilesMap = toMap(MedicalCareerProfiles);
export const FinanceCareerProfilesMap = toMap(FinanceCareerProfiles);
export const EducationCareerProfilesMap = toMap(EducationCareerProfiles);
export const SupplyChainCareerProfilesMap = toMap(SupplyChainCareerProfiles);
export const MarketingCareerProfilesMap = toMap(MarketingCareerProfiles);
export const SalesCareerProfilesMap = toMap(SalesCareerProfiles);
export const HRCareerProfilesMap = toMap(HRCareerProfiles);
export const ArtsDesignCareerProfilesMap = toMap(ArtsDesignCareerProfiles);
export const MediaSciencesCareerProfilesMap = toMap(MediaSciencesCareerProfiles);
export const MultimediaCareerProfilesMap = toMap(MultimediaCareerProfiles);


const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// 1..5 scale => max diff = 4
const similarity1to5 = (a: number, b: number) => clamp01(1 - Math.abs(a - b) / 4);

const avgSimilarity = (candidate: Record<string, number>, role: Record<string, number>) => {
  const keys = Object.keys(role);
  if (keys.length === 0) return 0;
  let sum = 0;
  for (const k of keys) {
    sum += similarity1to5(candidate[k] ?? 3, role[k]); // default candidate value = 3
  }
  return sum / keys.length;
};

export interface CandidateAnalyticsProfile {
  mbti: MBTI;
  workingStyle: WorkingStyle;
  multipleIntelligence: MultipleIntelligence;
  disc: DISC;
  attributes: Attributes;
  traits: Record<string, number>;
  skills: Record<string, number>;
}

export const scoreCareerMatch = (
  candidate: CandidateAnalyticsProfile,
  role: CareerAnalyticsProfile
) => {
  // weights (tune anytime)
  const w = {
    mbti: 0.15,
    workingStyle: 0.10,
    multipleIntelligence: 0.20,
    disc: 0.15,
    attributes: 0.20,
    traits: 0.10,
    skills: 0.10,
  };

  const s =
    w.mbti * avgSimilarity(candidate.mbti as any, role.mbti as any) +
    w.workingStyle * avgSimilarity(candidate.workingStyle as any, role.workingStyle as any) +
    w.multipleIntelligence * avgSimilarity(candidate.multipleIntelligence as any, role.multipleIntelligence as any) +
    w.disc * avgSimilarity(candidate.disc as any, role.disc as any) +
    w.attributes * avgSimilarity(candidate.attributes as any, role.attributes as any) +
    w.traits * avgSimilarity(candidate.traits, role.traits) +
    w.skills * avgSimilarity(candidate.skills, role.skills);

  return s; // 0..1
};

export interface ScoredRole {
  role: CareerAnalyticsProfile;
  field: CareerField;
  score: number; // 0..1
}

export const getTopCareerMatches = (
  candidate: CandidateAnalyticsProfile,
  topN: number = 6
): ScoredRole[] => {
  // 1) score everything
  const scored: ScoredRole[] = AllCareerProfiles
    .map((role) => {
      const field = detectFieldByCode(role.code);
      if (!field) return null;
      return {
        role,
        field,
        score: scoreCareerMatch(candidate, role),
      } as ScoredRole;
    })
    .filter(Boolean) as ScoredRole[];

  // 2) group by field
  const byField = new Map<CareerField, ScoredRole[]>();
  for (const item of scored) {
    const arr = byField.get(item.field) ?? [];
    arr.push(item);
    byField.set(item.field, arr);
  }

  // 3) sort roles within each field
  for (const [field, arr] of byField.entries()) {
    arr.sort((a, b) => b.score - a.score);
    byField.set(field, arr);
  }

  // 4) sort fields by their best score (field strength)
  const fieldsSorted = Array.from(byField.entries())
    .map(([field, arr]) => ({ field, best: arr[0]?.score ?? 0 }))
    .sort((a, b) => b.best - a.best)
    .map((x) => x.field);

  // 5) selection with max 2 per field (round-robin)
  const selected: ScoredRole[] = [];
  const pickedCount: Record<CareerField, number> = {
    IT_CS: 0,
    ENGINEERING: 0,
    MEDICAL: 0,
    FINANCE: 0,
    EDUCATION: 0,
    SUPPLY_CHAIN: 0,
    MARKETING: 0,
    SALES: 0,
    HR: 0,
    ARTS_DESIGN: 0,
    MEDIA_SCIENCES: 0,
    MULTIMEDIA: 0,
  };

  // two rounds => max 2 per field
  for (let round = 0; round < 2 && selected.length < topN; round++) {
    for (const field of fieldsSorted) {
      if (selected.length >= topN) break;

      if (pickedCount[field] >= 2) continue;
      const roles = byField.get(field) ?? [];
      const pick = roles[round]; // round 0 => best, round 1 => second best
      if (!pick) continue;

      selected.push(pick);
      pickedCount[field] += 1;
    }
  }

  // 6) If still not enough (some fields had no roles), fill remaining from global list
  if (selected.length < topN) {
    const selectedCodes = new Set(selected.map((x) => x.role.code));

    const remaining = scored
      .filter((x) => !selectedCodes.has(x.role.code))
      .sort((a, b) => b.score - a.score);

    for (const r of remaining) {
      if (selected.length >= topN) break;
      if (pickedCount[r.field] >= 2) continue;
      selected.push(r);
      pickedCount[r.field] += 1;
    }
  }

  // final sort by score (optional)
  selected.sort((a, b) => b.score - a.score);
  return selected.slice(0, topN);
};