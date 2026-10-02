/* eslint-disable react-hooks/exhaustive-deps */
 
'use client';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import QuestionBlock from '../PP/QuestionBlock';
import type { Answer, QuestionData } from '../PP/QuestionBlock';
import ResultsPage from '../PP/ResultsPage';
import { skillList, traitList, skillCategoryMapping, broadSkillCategories} from '../quizData';
import CustomAlert from '../components/CustomAlert';
import { GeneralCareerProfiles } from "../careerAnalytics";

type SelectedAnswers = Record<string, string | number>;

interface Candidate {
  name: string;
  email: string;
  age: string;
  history?: {
    oldName: string;
    oldEmail: string;
    oldAge: string;
    changedAt: string;
  }[];
}

interface CheckData {
  exists: boolean;
  candidate: Candidate;
}
 
function App() {
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [quizState, setQuizState] = useState<'quiz' | 'results'>('quiz');
 
  const [finalScores, setFinalScores] = useState<{ [key: string]: number } | null>(null);
  const [traitScores, setTraitScores] = useState<{ [key: string]: number } | null>(null);
  const [careerMatches, setCareerMatches] = useState<{ name: string; score: number }[] | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [checkData, setCheckData] = useState<CheckData | null>(null);
  const [showSlider, setShowSlider] = useState(false);

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch('/api/khudi-questions');
        const data = await res.json();
        if (data.success) setQuestions(data.questions);
        else console.error('❌ Failed to load questions:', data.message);
      } catch (err) {
        console.error('❌ Error fetching questions from backend:', err);
      }
    };
    fetchQuestions();
  }, []);

  const handleAnswerChange = useCallback(
    (questionId: string, selectedValue: string | number) => {
      setSelectedAnswers((prevAnswers) => ({
        ...prevAnswers,
        [questionId]: selectedValue,
      }));

      const currentQ = questions[currentIndex];
      if (currentQ && currentQ.type !== 'text') {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
      }
    },
    [currentIndex, questions]
  );

  const goToNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex((prev) => prev + 1);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  // ---------------- HELPERS ----------------
  const getFormatWeight = (questionType: 'likert' | 'forced' | 'sjt' | 'text' | 'select') => {
    
    switch (questionType) {
      case 'likert':
        return 1.0;
      case 'forced':
        return 1.2;
      case 'sjt':
        return 1.4;
      default:
        return 1.0;
    }
  };

  const findSelectedAnswer = (q: QuestionData, selectedValue: string | number) => {
    if (!q.answers) return undefined;

    const byId = q.answers.find((ans) => ans.id === selectedValue);
    if (byId) return byId;

    const byOptionKey = q.answers.find((ans) => ans.optionKey === selectedValue);
    if (byOptionKey) return byOptionKey;

    return undefined;
  };

  const TRAIT_ALIASES: Record<string, string> = {
  'Emotional Stability': 'EmotionalStability',
  'EmotionalStability': 'EmotionalStability',
  'Openness to Experience': 'Openness',
};

const normalizeTraitKey = (key?: string) => {
  if (!key) return undefined;
  return TRAIT_ALIASES[key] || key;
};

const SKILL_KEY_ALIASES: Record<string, string> = {
  ' timeManagement': 'timeManagement',
  'timeManagement ': 'timeManagement',
  'planningOrganization ': 'planningOrganization',
};

const CATEGORY_WEIGHTS: Record<string, number> = {
  AnalyticalProblemSolving: 0.22,
  CommunicationInfluence: 0.16,
  EthicalProfessional: 0.10,
  InterpersonalTeam: 0.14,
  LeadershipInitiative: 0.12,
  LearningDevelopment: 0.14,
  SelfManagement: 0.12,
};

const normalizeSkillKey = (key?: string) => {
  if (!key) return '';
  return SKILL_KEY_ALIASES[key] || key.trim();
};

const getLikertBaseScore = (
  question: QuestionData & { reverse?: boolean },
  selectedValue: string | number
) => {
  const raw = Number(selectedValue);
  if (Number.isNaN(raw)) return undefined;
  return question.reverse ? 6 - raw : raw;
};

type ScoreRecord = Record<string, number>;

const norm100ToScale5 = (value: number): number => {
  const clamped = Math.max(0, Math.min(100, value ?? 0));
  return 1 + (clamped / 100) * 4;
};

const similarity1to5 = (candidateValue: number, roleValue: number): number => {
  return Math.max(0, 1 - Math.abs(candidateValue - roleValue) / 4);
};

const weightedAverageSimilarity = (
  candidateScores100: ScoreRecord,
  roleScores15: Record<string, number>,
  weightMap?: Record<string, number>
): number => {
  const entries = Object.entries(roleScores15 || {});
  if (entries.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [rawKey, roleValue] of entries) {
    const normalizedKey = normalizeTraitKey(rawKey) || rawKey;
    const candidateValueOn5Scale = norm100ToScale5(
      candidateScores100[normalizedKey] ?? 50
    );

    const weight = weightMap?.[normalizedKey] ?? 1;
    weightedSum += similarity1to5(candidateValueOn5Scale, roleValue) * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
};

  // ---------------- PROGRESS ----------------
  const answeredCount = useMemo(() => {
    return questions.reduce((count, q) => {
      const v = selectedAnswers[q.id];
      const hasAnswer = v !== undefined && v !== null && v !== '';
      return hasAnswer ? count + 1 : count;
    }, 0);
  }, [questions, selectedAnswers]);

  const progressPct = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;

  // ---------------- SUBMIT ----------------
  const handleSubmit = async () => {
    if (unansweredQuestionIds.length > 0) {
      toast.error('Please answer all questions before submitting.');
      return;
    }

    const email = String(selectedAnswers['INFO-EMAIL'] || '');

    try {
      const checkRes = await fetch(`/api/khudi-candidates?email=${email}`);
      const data = await checkRes.json();

      if (data.exists && data.candidate) {
        setCheckData(data);
        setAlertMessage('Do you want to continue with previous details?');
        setShowAlert(true);
        return;
      }

      await saveResponses();
      generateReport();
    } 
    catch (error: unknown) {
      console.error('❌ Error in handleSubmit:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  // ---------------- SAVE ----------------
  const saveResponses = async () => {
    
    const likertResponses = questions
      .filter((q) => q.type === 'likert')
      .map((q) => ({
        questionId: q.id,
        responseText: q.options?.find((opt) => opt.value === selectedAnswers[q.id])?.label || 'No response',
        responseValue: typeof selectedAnswers[q.id] === 'number' ? selectedAnswers[q.id] : null,
      }));

    const forcedResponses = questions
      .filter((q) => q.type === 'forced')
      .map((q) => ({
        questionId: q.id,
        optionKey: findSelectedAnswer(q, selectedAnswers[q.id])?.optionKey || 'No response',
      }));

    const sjtResponses = questions
      .filter((q) => q.type === 'sjt')
      .map((q) => ({
        questionId: q.id,
        optionKey: findSelectedAnswer(q, selectedAnswers[q.id])?.optionKey || 'No response',
      }));

    const payload = {
      name: selectedAnswers['INFO-NAME'] || '',
      email: selectedAnswers['INFO-EMAIL'] || '',
      age: selectedAnswers['INFO-AGE'] || '',
      likertResponses,
      forcedResponses,
      sjtResponses,
    };

    const res = await fetch('/api/khudi-responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(await res.text());

    toast.success('✅ Responses saved successfully!');
  };

  // ---------------- REPORT ----------------

  const generateReport = () => {
  const skillScoresAcc = skillList.reduce((acc, skill) => {
    acc[skill] = 0;
    return acc;
  }, {} as Record<string, number>);

  const allTraitKeys = new Set<string>(traitList);

  questions.forEach((q) => {
    const normalizedPrimary = normalizeTraitKey(q.primaryTrait);
    if (normalizedPrimary) allTraitKeys.add(normalizedPrimary);

    q.answers?.forEach((ans) => {
      const override = normalizeTraitKey(ans.primaryTraitOverride);
      if (override) allTraitKeys.add(override);
    });
  });

  const traitScoreAcc = Array.from(allTraitKeys).reduce((acc, trait) => {
    acc[trait] = { weightedScoreSum: 0, weightSum: 0 };
    return acc;
  }, {} as Record<string, { weightedScoreSum: number; weightSum: number }>);

  questions.forEach((question) => {
    const selectedValue = selectedAnswers[question.id];
    if (selectedValue === undefined || selectedValue === null || selectedValue === '') return;

    const fullWeight =
      getFormatWeight(question.type) *
      (question.traitWeight || 1) *
      (question.sectionWeight || 1);

    // ---------------- LIKERT ----------------
    if (question.type === 'likert') {
      const likertBase = getLikertBaseScore(
        question as QuestionData & { reverse?: boolean },
        selectedValue
      );

      if (likertBase === undefined) return;

      const primaryTrait = normalizeTraitKey(question.primaryTrait);
      if (primaryTrait && traitScoreAcc[primaryTrait]) {
        traitScoreAcc[primaryTrait].weightedScoreSum += likertBase * fullWeight;
        traitScoreAcc[primaryTrait].weightSum += fullWeight;
      }

      (question.skills ?? []).forEach((rawSkill) => {
        const skill = normalizeSkillKey(rawSkill);
        if (skill && skillScoresAcc.hasOwnProperty(skill)) {
          skillScoresAcc[skill] += likertBase * fullWeight;
        }
      });

      return;
    }

    // ---------------- FORCED / SJT ----------------
    const selectedAnswerData = findSelectedAnswer(question, selectedValue);
    if (!selectedAnswerData) return;

    if (selectedAnswerData.scores) {
      Object.entries(selectedAnswerData.scores).forEach(([rawSkill, value]) => {
        const skill = normalizeSkillKey(rawSkill);
        if (skill && skillScoresAcc.hasOwnProperty(skill)) {
          const v = Number(value);
          if (!Number.isNaN(v)) {
            skillScoresAcc[skill] += v * fullWeight;
          }
        }
      });
    }

    const primaryTrait = normalizeTraitKey(
      selectedAnswerData.primaryTraitOverride || question.primaryTrait
    );

    const baseScoreForTrait = Number(selectedAnswerData.baseScoreValue);
    if (
      primaryTrait &&
      traitScoreAcc[primaryTrait] &&
      !Number.isNaN(baseScoreForTrait)
    ) {
      traitScoreAcc[primaryTrait].weightedScoreSum += baseScoreForTrait * fullWeight;
      traitScoreAcc[primaryTrait].weightSum += fullWeight;
    }
  });

  // ---------- FINAL SKILLS ----------
  const finalSkillScores: Record<string, number> = {};
  const normalizedSkillScores: Record<string, number> = {};

  for (const skill in skillScoresAcc) {
    const rawScore = parseFloat(skillScoresAcc[skill].toFixed(3));
    finalSkillScores[skill] = rawScore;

    normalizedSkillScores[skill] =
      maxSkillScores[skill] > 0
        ? Math.min(100, (rawScore / maxSkillScores[skill]) * 100)
        : 0;
  }

  setFinalScores(finalSkillScores);

  // ---------- FINAL TRAITS ----------
  const finalTraitScores: Record<string, number> = {};
  const normalizedTraitScores: Record<string, number> = {};

  for (const trait in traitScoreAcc) {
    const { weightedScoreSum, weightSum } = traitScoreAcc[trait];
    const avg = weightSum > 0 ? weightedScoreSum / weightSum : 0;

    finalTraitScores[trait] = parseFloat(avg.toFixed(3));
    normalizedTraitScores[trait] = Math.max(
      0,
      Math.min(100, ((avg - 1) / 4) * 100)
    );
  }

  setTraitScores(finalTraitScores);

  // ---------- CATEGORY SCORES ----------
  const normalizedCategoryScores: Record<string, number> = {};

  broadSkillCategories.forEach((category) => {
    const skills = skillCategoryMapping[category] ?? [];

    const scores = skills
      .map((rawSkill) => normalizedSkillScores[normalizeSkillKey(rawSkill)])
      .filter((v): v is number => typeof v === 'number');

    if (scores.length === 0) {
      normalizedCategoryScores[category] = 0;
      return;
    }

    const max = Math.max(...scores);
    const avg = scores.reduce((sum, v) => sum + v, 0) / scores.length;

    normalizedCategoryScores[category] = parseFloat(
      (max * 0.6 + avg * 0.4).toFixed(1)
    );
  });

  // ---------- CAREER FAMILY MATCH ----------
  const matches = calculateCareerMatches(
    normalizedTraitScores,
    normalizedCategoryScores
  );

  setCareerMatches(matches);
  setQuizState('results');
  window.scrollTo(0, 0);
};

  const isAnswered = (questionId: string) => {
    const v = selectedAnswers[questionId];
    return v !== undefined && v !== null && v !== '';
  };

  const totalCount = questions.length;

  const unansweredQuestionIds = useMemo(() => {
    return questions
      .filter((q) => selectedAnswers[q.id] === undefined || selectedAnswers[q.id] === null || selectedAnswers[q.id] === '')
      .map((q) => q.id);
  }, [questions, selectedAnswers]);  

  const handleRestart = () => {
    setSelectedAnswers({});
    setFinalScores(null);
    setTraitScores(null);
    setCareerMatches(null);
    setQuizState('quiz');
    setCurrentIndex(0);
    window.scrollTo(0, 0);
  };

  const currentQuestion = questions[currentIndex];

const calculateMaxSkillScore = useCallback(
  (skillToCalc: string) => {
    let maxScore = 0;

    questions.forEach((question) => {
      const formatWeight = getFormatWeight(question.type);
      const traitWeight = question.traitWeight || 1.0;
      const sectionWeight = question.sectionWeight || 1.0;
      const fullQuestionWeight = formatWeight * traitWeight * sectionWeight;

      let maxBaseForQuestion = 0;

      // Likert questions now contribute through question.skills
      if (question.type === 'likert') {
        const hasSkill = (question.skills ?? []).some(
          (rawSkill) => normalizeSkillKey(rawSkill) === skillToCalc
        );

        if (hasSkill) {
          maxBaseForQuestion = 5; // highest likert value
        }
      } 
      else {
        question.answers?.forEach((answer: Answer) => {
          const scores = answer.scores;
          if (!scores) return;

          Object.entries(scores).forEach(([rawSkill, value]) => {
            const normalizedSkill = normalizeSkillKey(rawSkill);
            const baseScore = Number(value);

            if (
              normalizedSkill === skillToCalc &&
              !Number.isNaN(baseScore) &&
              baseScore > maxBaseForQuestion
            ) {
              maxBaseForQuestion = baseScore;
            }
          });
        });
      }

      maxScore += maxBaseForQuestion * fullQuestionWeight;
    });

    return maxScore > 0 ? maxScore : 1;
  },
  [questions]
);

  const maxSkillScores = useMemo(() => {
    const maxScores: Record<string, number> = {};
    skillList.forEach((skill) => {
      maxScores[skill] = calculateMaxSkillScore(skill);
    });
    return maxScores;
  }, [calculateMaxSkillScore]);


const calculateCareerMatches = (
  normTraitScores: ScoreRecord,
  normCategoryScores: ScoreRecord
) => {
  const results = GeneralCareerProfiles.map((family) => {
    const traitMatch = weightedAverageSimilarity(
      normTraitScores,
      family.traits
    );

    const skillMatch = weightedAverageSimilarity(
      normCategoryScores,
      family.skills,
      CATEGORY_WEIGHTS
    );

    const overallMatch = traitMatch * 0.40 + skillMatch * 0.60;

    return {
      name: family.name,
      score: parseFloat((overallMatch * 100).toFixed(1)),
    };
  });

  return results.sort((a, b) => b.score - a.score).slice(0, 6);
};

  return (
    <>
      {quizState === 'quiz' && (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-darkBlue dark:via-darkBlue dark:to-darkBlue text-slate-900 dark:text-slate-100">
          {/* ✅ Responsive page container: more breathing on big screens, tighter on mobile */}
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 2xl:max-w-screen-2xl 2xl:px-12 2xl:py-10">
            {/* ✅ Responsive gap for large screens */}
            <div className="grid grid-cols-1 gap-6 lg:gap-8 2xl:gap-10 lg:grid-cols-12">
              {/* Sidebar */}
              <aside className="order-2 lg:order-1 lg:col-span-4 xl:col-span-3">
                {/* ✅ top offset a bit larger on big screens */}
                
                <div className="space-y-4 lg:sticky lg:top-24 2xl:top-28">
                  
                {/* Progress Card */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 sm:mt-20 lg:p-6 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">Progress</h2>
                    <div className="text-sm text-slate-500 sm:text-right">
                      <span>{progressPct}% complete</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 h-2.5 w-full rounded-full bg-slate-100">
                    <div className="h-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-[width]"
                     style={{ width: `${progressPct}%` }}
                    />
                  </div>

                </div>

                  {/* Question Map */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200  px-3 py-3 2xl:px-5 2xl:py-4">
                      <h3 className="text-sm 2xl:text-base font-semibold">Question Map</h3>
                       <button
                        type="button"
                        onClick={() => setShowSlider((prev) => !prev)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5smoke px-3 py-2 text-xs 2xl:text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
                      >
                        {showSlider ? 'Hide' : 'Show'} questions <span aria-hidden="true">{showSlider ? '🙉' : '🙈'}</span>
                      </button>
                    </div>

                    {showSlider ? (
                      <div className="max-h-[45vh] sm:max-h-[55vh] lg:max-h-[65vh] 2xl:max-h-[70vh] overflow-auto p-2 2xl:p-3">
                        <div className="space-y-2">
                          {questions.map((q, idx) => {
                            const current = idx === currentIndex;
                            const answered = isAnswered(q.id);

                            const dotClass = current
                              ? 'bg-indigo-600'
                              : answered
                              ? 'bg-emerald-500'
                              : 'bg-rose-400';

                            const rowClass = current
                              ? 'border-indigo-200 bg-indigo-50 text-indigo-900'
                              : answered
                              ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              : 'border-rose-200 bg-rose-50/50 text-rose-900 hover:bg-rose-50';

                            return (
                              <button
                                key={q.id}
                                type="button"
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-full rounded-xl border px-3 py-2 2xl:px-4 2xl:py-3 text-left text-sm 2xl:text-base transition ${rowClass} focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="inline-flex h-7 w-7 2xl:h-8 2xl:w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900/5 text-xs 2xl:text-sm font-bold">
                                    {idx + 1}
                                  </span>

                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs 2xl:text-sm font-medium">
                                      {q.text.length > 70 ? `${q.text.slice(0, 70)}…` : q.text}
                                    </span>
                                    <span className="mt-1 block text-[11px] 2xl:text-xs text-slate-500">
                                      {current ? 'Current' : answered ? 'Answered' : 'Pending'}
                                    </span>
                                  </span>

                                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 2xl:p-5 text-sm 2xl:text-base text-slate-600 dark:text-slate-300">
                        {/* Tap <span className="font-semibold">“Show questions”</span> to open the list. */}
                      </div>
                    )}
                  </div>

                  {/* Helpful Tip */}
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 sm:p-5 2xl:p-6 shadow-sm">
                    <p className="text-sm 2xl:text-base font-semibold">Quick Tips!</p>
                    <p className="mt-1 text-sm 2xl:text-base text-slate-600 dark:text-slate-300">
                    Tap <span className="font-semibold text-sm ">Show questions 🙈</span> to open the list.
                    </p>
                    <p className="mt-1 text-sm 2xl:text-base text-slate-600 dark:text-slate-300">Answer honestly—there are no right or wrong choices.</p>
                    <p className="mt-1 text-sm 2xl:text-base font-semibold">Private & secure</p>
                    <p className="mt-1 text-sm 2xl:text-base text-slate-600 dark:text-slate-300">Your answers are used only to generate your report.</p>

                   </div>
                </div>
              </aside>

              {/* Main Quiz Card */}
              <section className="order-1 lg:order-2 lg:col-span-8 xl:col-span-9">
                <div className="rounded-2xl border mt-20 border-slate-200 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
                  {/* ✅ Responsive padding */}
                  <div className="border-b  border-slate-200 p-5 sm:p-8 lg:px-16 2xl:p-12">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="-mb-3">
         
                        {/* ✅ Scale title for big screens */}
                        <h1 className="-mt-1 text-xl sm:text-2xl lg:text-3xl 2xl:text-4xl font-semibold">
                          <span lang="ur" dir="rtl" className="font-urdu leading-[2] text-right mr-2 inline-block"> خودی</span>
                             <span>Personality Assessment</span>
                        </h1>
                      </div>

                      {/* Mobile quick actions */}
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end mt-3">
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs 2xl:text-sm font-semibold text-slate-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" aria-hidden="true" />
                          {answeredCount}/{totalCount || '—'} answered
                        </span>

                        {/* <button
                          type="button"
                          onClick={() => setShowSlider((prev) => !prev)}
                          className="lg:hidden inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm 2xl:text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
                        >
                          Questi
                        </button> */}
                      </div>
                    </div>
                  </div>

                  {/* ✅ Responsive padding */}
                  <div className="p-5 sm:p-8 lg:p-10 2xl:p-12">
                    {!currentQuestion ? (
                      <div className="py-10 sm:py-12 text-center">
                        <div className="mx-auto h-10 w-10 animate-pulse rounded-2xl bg-slate-100" />
                        <p className="mt-3 text-sm 2xl:text-base text-slate-600 dark:text-slate-300">Loading questions…</p>
                      </div>
                    ) : (
                      <QuestionBlock
                        key={currentQuestion.id}
                        questionData={currentQuestion}
                        questionIndex={currentIndex}
                        selectedAnswerValue={selectedAnswers[currentQuestion.id]}
                        onAnswerChange={handleAnswerChange}
                      />
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={goToPrevious}
                        disabled={currentIndex === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 2xl:px-6 2xl:py-4 text-sm 2xl:text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
                      >
                        Previous
                      </button>

                      {currentIndex < questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={goToNext}
                          disabled={!currentQuestion || !isAnswered(currentQuestion.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 2xl:px-6 2xl:py-4 text-sm 2xl:text-base font-semibold text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={!currentQuestion || !isAnswered(currentQuestion.id) || unansweredQuestionIds.length > 0}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 2xl:px-6 2xl:py-4 text-sm 2xl:text-base font-semibold text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                        >
                          View Results
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {quizState === 'results' && finalScores && traitScores && careerMatches && (
        <ResultsPage
          skillScores={finalScores}
          traitScores={traitScores}
          skillCategories={skillCategoryMapping}
          careerMatches={careerMatches} // ✅ now valid Match[]
          onRestart={handleRestart}
          candidateName={String(selectedAnswers['INFO-NAME'] || '')}
          candidateEmail={String(selectedAnswers['INFO-EMAIL'] || '')}
          allQuestions={questions}
          userResponses={selectedAnswers}
        />
      )}

      {showAlert && checkData && (
        <CustomAlert
          message={alertMessage}
          onConfirm={async () => {
            setSelectedAnswers((prev) => ({
              ...prev,
              'INFO-NAME': checkData.candidate.name,
              'INFO-EMAIL': checkData.candidate.email,
              'INFO-AGE': checkData.candidate.age,
            }));
            setShowAlert(false);
            try {
              await saveResponses();
              generateReport();
            } catch (err) {
              console.error('❌ Error saving:', err);
              toast.error('Failed to save responses or generate report');
            }
          }}
          onCancel={() => {
            setSelectedAnswers((prev) => ({
              ...prev,
              'INFO-NAME': '',
              'INFO-EMAIL': '',
              'INFO-AGE': '',
            }));
            setShowAlert(false);
          }}
        />
      )}
    </>
  );
}
export default App;