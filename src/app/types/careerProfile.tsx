import { CareerCode } from "../careerCodes";

export interface CareerAnalyticsProfile {
  code: CareerCode;
  name: string;
  
  mbti: MBTI;
  workingStyle: WorkingStyle;
  multipleIntelligence: MultipleIntelligence;
  disc: DISC;
  attributes: Attributes;
}

export type MBTI = {
  EI: number; SN: number; TF: number; JP: number;
};

export type WorkingStyle = {
  Auditory: number; Visual: number; Kinesthetic: number;
};

export type MultipleIntelligence = {
  Linguistic: number; LogicalMathematical: number; Spatial: number;  
  BodilyKinesthetic: number; Musical: number; Interpersonal: number; Intrapersonal: number; Naturalist: number;
};

export type DISC = {
  Dominance: number; Influence: number; Steadiness: number; Compliance: number;
};

export type Attributes = {
  WorkingWithNumbers: number;
  WorkingWithWords: number;
  WorkingWithShapes: number;
  WorkingWithPeople: number;
  WorkingWithData: number;
  WorkingWithThings: number;

  DiplomaticIndependentScore: number;
  CooperativeCompetitiveScore: number;
  SubmissiveAssertiveScore: number;
  SpontaneousConscientiousScore: number;
  InnovativeConventionalScore: number;
  ReactiveOrganizedScore: number;
  IntrovertExtrovertScore: number;
  SelfSufficientGroupOrientedScore: number;
  ReservedOutgoingScore: number;
  EmotionalStableScore: number;
  RestlessPoisedScore: number;
  ExcitableRelaxedScore: number;
  FrankSocialDesirabilityScore: number;
};
