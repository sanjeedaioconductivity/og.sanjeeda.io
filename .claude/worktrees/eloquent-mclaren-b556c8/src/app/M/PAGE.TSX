// 'use client';
// import React, { useState, useCallback, useMemo, useEffect } from 'react';
// import toast from 'react-hot-toast';
// import QuestionBlock from '../PP/QuestionBlock';
// import type { Answer, QuestionData } from '../PP/QuestionBlock';
// import ResultsPage from '../PP/ResultsPage';
// import {
//   skillList,
//   traitList,
//   skillCategoryMapping,
//   broadSkillCategories,
//   TraitCategory,
// } from '../quizData';
// import CustomAlert from '../components/CustomAlert';
// import {
//   AllCareerProfiles,
//   CareerAnalyticsProfile,
//   selectTopMatchesWithFieldCap,
// } from '../careerAnalytics';

// type SelectedAnswers = Record<string, string | number>;

// interface Candidate {
//   name: string;
//   email: string;
//   age: string;
//     history?: {
//     oldName: string;
//     oldEmail: string;
//     oldAge: string;
//     changedAt: string;
//   }[];
// }

// interface CheckData {
//   exists: boolean;
//   candidate: Candidate;
// }

// function App() {
//   const [questions, setQuestions] = useState<QuestionData[]>([]);
//   const [quizState, setQuizState] = useState<'quiz' | 'results'>('quiz');

//   const [finalScores, setFinalScores] = useState<Record<string, number> | null>(null);
//   const [traitScores, setTraitScores] = useState<Record<string, number> | null>(null);
//   const [careerMatches, setCareerMatches] = useState<{ name: string; score: number }[] | null>(null);

//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
//   const [checkData, setCheckData] = useState<CheckData | null>(null);
//   const [showSlider, setShowSlider] = useState<boolean>(false);

//   const [showAlert, setShowAlert] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');
  
  
//   // ---------------- FETCH QUESTIONS ----------------
//   useEffect(() => {
//     const fetchQuestions = async () => {
//       try {
//         const res = await fetch('/api/questions');
//         const data = await res.json();
//         if (data.success) setQuestions(data.questions);
//       } catch (err) {
//         console.error(err);
//       }
//     };
//     fetchQuestions();
//   }, []);

//   // ---------------- ANSWER CHANGE ----------------
//   const handleAnswerChange = useCallback(
//     (questionId: string, value: string | number) => {
//       setSelectedAnswers((prev) => ({ ...prev, [questionId]: value }));

//       const q = questions[currentIndex];
//       if (q && q.type !== 'text' && currentIndex < questions.length - 1) {
//         setCurrentIndex((p) => p + 1);
//       }
//     },
//     [currentIndex, questions]
//   );

//   const goToNext = () => setCurrentIndex((p) => Math.min(p + 1, questions.length - 1));
//   const goToPrevious = () => setCurrentIndex((p) => Math.max(p - 1, 0));

//   // ---------------- HELPERS ----------------
//   const getFormatWeight = (type: string) => {
//     if (type === 'forced') return 1.2;
//     if (type === 'sjt') return 1.4;
//     return 1;
//   };

//   const findSelectedAnswer = (q: QuestionData, value: any) => {
//     return q.answers?.find((a) => a.id === value || a.optionKey === value);
//   };

//   // ---------------- PROGRESS ----------------
//   const answeredCount = useMemo(() => {
//     return questions.filter((q) => selectedAnswers[q.id]).length;
//   }, [questions, selectedAnswers]);

//   const progressPct = questions.length
//     ? Math.round((answeredCount / questions.length) * 100)
//     : 0;

//   const unanswered = questions.filter((q) => !selectedAnswers[q.id]);

//   // ---------------- SUBMIT ----------------
//   const handleSubmit = async () => {
//     if (unanswered.length) {
//       toast.error('Answer all questions');
//       return;
//     }

//     const email = String(selectedAnswers['INFO-EMAIL'] || '');

//     const res = await fetch(`/api/candidates?email=${email}`);
//     const data = await res.json();

//     if (data.exists) {
//       setCheckData(data);
//       setShowAlert(true);
//       return;
//     }

//     await saveResponses();
//     generateReport();
//   };

//   // ---------------- SAVE ----------------
//   const saveResponses = async () => {
//     const payload = {
//       name: selectedAnswers['INFO-NAME'] || '',
//       email: selectedAnswers['INFO-EMAIL'] || '',
//       age: selectedAnswers['INFO-AGE'] || '',
//     };

//     const res = await fetch('/api/saveResponses', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload),
//     });

//     if (!res.ok) throw new Error('Save failed');
//     toast.success('Saved!');
//   };

//   // ---------------- REPORT ----------------
//   const generateReport = () => {
//     const skillScores: Record<string, number> = {};
//     skillList.forEach((s) => (skillScores[s] = 0));

//     questions.forEach((q) => {
//       const ans = findSelectedAnswer(q, selectedAnswers[q.id]);
//       if (!ans?.scores) return;

//       const weight =
//         getFormatWeight(q.type) *
//         (q.traitWeight || 1) *
//         (q.sectionWeight || 1);

//       Object.entries(ans.scores).forEach(([k, v]) => {
//         skillScores[k] += Number(v) * weight;
//       });
//     });

//     setFinalScores(skillScores);

//     const matches = AllCareerProfiles.map((c: CareerAnalyticsProfile) => ({
//       name: c.name,
//       score: Math.random() * 100,
//     }));

//     setCareerMatches(selectTopMatchesWithFieldCap(matches, 6, 2));

//     setQuizState('results');
//   };

// const isAnswered = (questionId: string) => {
//   const v = selectedAnswers[questionId];
//   return v !== undefined && v !== null && v !== '';
// };

// const totalCount = questions.length;

// const unansweredQuestionIds = useMemo(() => {
//   return questions.filter(q => !isAnswered(q.id)).map(q => q.id);
// }, [questions, selectedAnswers]);

//   const handleRestart = () => {
//     setSelectedAnswers({});
//     setFinalScores(null);
//     setTraitScores(null);
//     setCareerMatches(null);
//     setQuizState('quiz');
//     setCurrentIndex(0);
//   };

//   const currentQuestion = questions[currentIndex];

//   return (
//     <>
//       {quizState === 'quiz' && (
//         <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
//           {/* ✅ Responsive page container: more breathing on big screens, tighter on mobile */}
//           <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 2xl:max-w-screen-2xl 2xl:px-12 2xl:py-10">
//             {/* ✅ Responsive gap for large screens */}
//             <div className="grid grid-cols-1 gap-6 lg:gap-8 2xl:gap-10 lg:grid-cols-12">
//               {/* Sidebar */}
//               <aside className="order-2 lg:order-1 lg:col-span-4 xl:col-span-3">
//                 {/* ✅ top offset a bit larger on big screens */}
                
//                 <div className="space-y-4 lg:sticky lg:top-24 2xl:top-28">
                  
//                 {/* Progress Card */}
//                 <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:mt-20 lg:p-6 shadow-sm">
//                   <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
//                     <h2 className="text-base font-semibold text-slate-900">Progress</h2>
//                     <div className="text-sm text-slate-500 sm:text-right">
//                       <span>{progressPct}% complete</span>
//                     </div>
//                   </div>
                  
//                   <div className="mt-4 h-2.5 w-full rounded-full bg-slate-100">
//                     <div className="h-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-[width]"
//                      style={{ width: `${progressPct}%` }}
//                     />
//                   </div>

//                 </div>

//                   {/* Question Map */}
//                   <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//                     <div className="flex items-center justify-between border-b border-slate-200  px-3 py-3 2xl:px-5 2xl:py-4">
//                       <h3 className="text-sm 2xl:text-base font-semibold">Question Map</h3>
//                        <button
//                         type="button"
//                         onClick={() => setShowSlider((prev: boolean) => !prev)}
//                         className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-whitesmoke px-3 py-2 text-xs 2xl:text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
//                       >
//                         {showSlider ? 'Hide' : 'Show'} questions <span aria-hidden="true">{showSlider ? '🙉' : '🙈'}</span>
//                       </button>
//                     </div>

//                     {showSlider ? (
//                       <div className="max-h-[45vh] sm:max-h-[55vh] lg:max-h-[65vh] 2xl:max-h-[70vh] overflow-auto p-2 2xl:p-3">
//                         <div className="space-y-2">
//                           {questions.map((q, idx) => {
//                             const current = idx === currentIndex;
//                             const answered = isAnswered(q.id);

//                             const dotClass = current
//                               ? 'bg-indigo-600'
//                               : answered
//                               ? 'bg-emerald-500'
//                               : 'bg-rose-400';

//                             const rowClass = current
//                               ? 'border-indigo-200 bg-indigo-50 text-indigo-900'
//                               : answered
//                               ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
//                               : 'border-rose-200 bg-rose-50/50 text-rose-900 hover:bg-rose-50';

//                             return (
//                               <button
//                                 key={q.id}
//                                 type="button"
//                                 onClick={() => setCurrentIndex(idx)}
//                                 className={`w-full rounded-xl border px-3 py-2 2xl:px-4 2xl:py-3 text-left text-sm 2xl:text-base transition ${rowClass} focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600`}
//                               >
//                                 <div className="flex items-center gap-3">
//                                   <span className="inline-flex h-7 w-7 2xl:h-8 2xl:w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900/5 text-xs 2xl:text-sm font-bold">
//                                     {idx + 1}
//                                   </span>

//                                   <span className="min-w-0 flex-1">
//                                     <span className="block truncate text-xs 2xl:text-sm font-medium">
//                                       {q.text.length > 70 ? `${q.text.slice(0, 70)}…` : q.text}
//                                     </span>
//                                     <span className="mt-1 block text-[11px] 2xl:text-xs text-slate-500">
//                                       {current ? 'Current' : answered ? 'Answered' : 'Pending'}
//                                     </span>
//                                   </span>

//                                   <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
//                                 </div>
//                               </button>
//                             );
//                           })}
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="p-4 2xl:p-5 text-sm 2xl:text-base text-slate-600">
//                         {/* Tap <span className="font-semibold">“Show questions”</span> to open the list. */}
//                       </div>
//                     )}
//                   </div>

//                   {/* Helpful Tip */}
//                   <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 2xl:p-6 shadow-sm">
//                     <p className="text-sm 2xl:text-base font-semibold">Quick Tips!</p>
//                     <p className="mt-1 text-sm 2xl:text-base text-slate-600">
//                     Tap <span className="font-semibold text-sm ">Show questions 🙈</span> to open the list.
//                     </p>
//                     <p className="mt-1 text-sm 2xl:text-base text-slate-600">Answer honestly—there are no right or wrong choices.</p>
//                     <p className="mt-1 text-sm 2xl:text-base font-semibold">Private & secure</p>
//                     <p className="mt-1 text-sm 2xl:text-base text-slate-600">Your answers are used only to generate your report.</p>
//                   </div>

//                 </div>
//               </aside>

//               {/* Main Quiz Card */}
//               <section className="order-1 lg:order-2 lg:col-span-8 xl:col-span-9">
//                 <div className="rounded-2xl border mt-20 border-slate-200 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.08)]">
//                   {/* ✅ Responsive padding */}
//                   <div className="border-b  border-slate-200 p-5 sm:p-8 lg:px-16 2xl:p-12">
//                     <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//                       <div className="-mb-3">
         
//                         {/* ✅ Scale title for big screens */}
//                         <h1 className="-mt-1 text-xl sm:text-2xl lg:text-3xl 2xl:text-4xl font-semibold">
//                           <span lang="ur" dir="rtl" className="font-urdu leading-[2] text-right mr-2 inline-block"> خودی</span>
//                           <span className="text-slate-300">/</span> Personality Assessment
//                         </h1>
//                       </div>

//                       {/* Mobile quick actions */}
//                       <div className="flex flex-wrap items-center gap-2 sm:justify-end mt-3">
//                         <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs 2xl:text-sm font-semibold text-slate-700">
//                           <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" aria-hidden="true" />
//                           {answeredCount}/{totalCount || '—'} answered
//                         </span>

//                         {/* <button
//                           type="button"
//                           onClick={() => setShowSlider((prev) => !prev)}
//                           className="lg:hidden inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm 2xl:text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
//                         >
//                           Questi
//                         </button> */}
//                       </div>
//                     </div>
//                   </div>

//                   {/* ✅ Responsive padding */}
//                   <div className="p-5 sm:p-8 lg:p-10 2xl:p-12">
//                     {!currentQuestion ? (
//                       <div className="py-10 sm:py-12 text-center">
//                         <div className="mx-auto h-10 w-10 animate-pulse rounded-2xl bg-slate-100" />
//                         <p className="mt-3 text-sm 2xl:text-base text-slate-600">Loading questions…</p>
//                       </div>
//                     ) : (
//                       <QuestionBlock
//                         key={currentQuestion.id}
//                         questionData={currentQuestion}
//                         questionIndex={currentIndex}
//                         selectedAnswerValue={selectedAnswers[currentQuestion.id]}
//                         onAnswerChange={handleAnswerChange}
//                       />
//                     )}

//                     {/* Navigation Buttons */}
//                     <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
//                       <button
//                         type="button"
//                         onClick={goToPrevious}
//                         disabled={currentIndex === 0}
//                         className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 2xl:px-6 2xl:py-4 text-sm 2xl:text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
//                       >
//                         Previous
//                       </button>

//                       {currentIndex < questions.length - 1 ? (
//                         <button
//                           type="button"
//                           onClick={goToNext}
//                           disabled={!currentQuestion || !isAnswered(currentQuestion.id)}
//                           className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 2xl:px-6 2xl:py-4 text-sm 2xl:text-base font-semibold text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
//                         >
//                           Next
//                         </button>
//                       ) : (
//                         <button
//                           type="button"
//                           onClick={handleSubmit}
//                           disabled={!currentQuestion || !isAnswered(currentQuestion.id) || unansweredQuestionIds.length > 0}
//                           className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 2xl:px-6 2xl:py-4 text-sm 2xl:text-base font-semibold text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
//                         >
//                           View Results
//                         </button>
//                       )}
//                     </div>

//                   </div>
//                 </div>
//               </section>
//             </div>
//           </div>
//         </div>
//       )}

//       {quizState === 'results' && finalScores && traitScores && careerMatches && (
//         <ResultsPage
//           skillScores={finalScores}
//           traitScores={traitScores}
//           skillCategories={skillCategoryMapping}
//           careerMatches={careerMatches} // ✅ now valid Match[]
//           onRestart={handleRestart}
//           candidateName={String(selectedAnswers['INFO-NAME'] || '')}
//           candidateEmail={String(selectedAnswers['INFO-EMAIL'] || '')}
//           allQuestions={questions}
//           userResponses={selectedAnswers}
//         />
//       )}

//       {showAlert && checkData && (
//         <CustomAlert
//           message={alertMessage}
//           onConfirm={async () => {
//             setSelectedAnswers((prev) => ({
//               ...prev,
//               'INFO-NAME': checkData.candidate.name,
//               'INFO-EMAIL': checkData.candidate.email,
//               'INFO-AGE': checkData.candidate.age,
//             }));
//             setShowAlert(false);
//             try {
//               await saveResponses();
//               generateReport();
//             } catch (err) {
//               console.error('❌ Error saving:', err);
//               toast.error('Failed to save responses or generate report');
//             }
//           }}
//           onCancel={() => {
//             setSelectedAnswers((prev) => ({
//               ...prev,
//               'INFO-NAME': '',
//               'INFO-EMAIL': '',
//               'INFO-AGE': '',
//             }));
//             setShowAlert(false);
//           }}
//         />
//       )}
//     </>
//   );
// }
// export default App;































 // recent work
//   const generateReport = () => {
    
//     const skillScoresAcc = skillList.reduce((acc, skill) => {
//       acc[skill] = 0;
//       return acc;
//     }, {} as { [key: string]: number });

//     const traitScoreAcc = traitList.reduce((acc, trait) => {
//       acc[trait] = { weightedScoreSum: 0, weightSum: 0 };
//       return acc;
//     }, {} as { [key: string]: { weightedScoreSum: number; weightSum: number } });

//   // ---------- LOOP ----------

//     questions.forEach((question) => {
//       const selectedValue = selectedAnswers[question.id]
//       if (!selectedValue) return;

//       // let selectedAnswerData = null;
//       let selectedAnswerData: Answer | undefined; //chapgt part 1 -> QuestionBlock.tsx

//       // if (question.type === 'likert' && question.answers) {
//       //   selectedAnswerData = question.answers.find(
//       //     (ans) => 'value' in ans && (ans).value === selectedValue
//       //   );
//       // } else if (question.answers) {
//       //   selectedAnswerData = findSelectedAnswer(question, selectedValue);
//       // } 

//       if (question.type === 'likert') { // chagpt part 2
//       selectedAnswerData = question.answers?.find(
//         (ans) => 'value' in ans && ans.value === selectedValue
//       );
//     } else {
//       selectedAnswerData = findSelectedAnswer(question, selectedValue);
//     }

//     // if (selectedAnswerData)
//     if (!selectedAnswerData) return; //chat gpt part 3

//       {
//       // const formatWeight = getFormatWeight(question.type); // chat gpt part 4
//       // const traitWeight = question.traitWeight || 1.0;
//       // const sectionWeight = question.sectionWeight || 1.0;
//       // const fullQuestionWeight = formatWeight * traitWeight * sectionWeight;

//       const fullWeight =
//       getFormatWeight(question.type) *
//       (question.traitWeight || 1) *
//       (question.sectionWeight || 1);

//   // ---------- SKILLS ----------
//         // if (selectedAnswerData.scores) {
//         //   const scores = selectedAnswerData.scores as unknown as Record<string, number>;
//         //   for (const skill in scores) {
//         //     if (skillScoresAcc.hasOwnProperty(skill)) {
//         //       const baseSkillScore = Number(scores[skill]);
//         //       if (!isNaN(baseSkillScore)) skillScoresAcc[skill] += baseSkillScore * fullQuestionWeight;
//         //     }
//         //   }
//         // }

//     if (selectedAnswerData.scores) { // chat gpt part 5
//       Object.entries(selectedAnswerData.scores).forEach(([skill, value]) => {
//         if (skillScoresAcc.hasOwnProperty(skill)) {
//           const v = Number(value);
//           if (!isNaN(v)) {
//             skillScoresAcc[skill] += v * fullWeight;
//           }
//         }
//       });
//     }

//   // ---------- TRAITS ----------
// const primaryTrait =
//   normalizeTraitKey(
//     selectedAnswerData.primaryTraitOverride || question.primaryTrait
//   );
  
//   const baseScoreForTrait = selectedAnswerData.baseScoreValue;

//   if (
//     primaryTrait && 
//     traitScoreAcc.hasOwnProperty(primaryTrait) && 
//     baseScoreForTrait !== undefined
//   ) {
//     const baseScoreNum = Number(baseScoreForTrait);
//     if (!isNaN(baseScoreNum)) {
//       // traitScoreAcc[primaryTrait].weightedScoreSum += baseScoreNum * fullQuestionWeight;  
//       // traitScoreAcc[primaryTrait].weightSum += fullQuestionWeight;
//     traitScoreAcc[primaryTrait].weightedScoreSum += baseScoreNum * fullWeight; // chat gpt part 6
//     traitScoreAcc[primaryTrait].weightSum += fullWeight;
//       }
//     }
//       }
//     });

//   // ---------- FINAL SKILLS ----------
//     const finalSkillScores: { [key: string]: number } = {};
//     const normalizedSkillScores: { [key: string]: number } = {};

//     for (const skill in skillScoresAcc) {
//       const rawScore = parseFloat(skillScoresAcc[skill].toFixed(3));
//       finalSkillScores[skill] = rawScore;

//       // normalizedSkillScores[skill] =
//       //   maxSkillScores[skill] > 0 
//       //   ? Math.max(0, Math.min(100, (rawScore / maxSkillScores[skill]) * 100)) : 0;

//       normalizedSkillScores[skill] = // chat gpt part 7
//       maxSkillScores[skill] > 0
//         ? Math.min(100, (rawScore / maxSkillScores[skill]) * 100)
//         : 0;
//     }

//     setFinalScores(finalSkillScores);

// // ---------- FINAL TRAITS ----------
// const finalTraitScores: { [key: string]: number } = {};
// const normalizedTraitScores: { [key: string]: number } = {};

// for (const trait in traitScoreAcc) {
//   const { weightedScoreSum, weightSum } = traitScoreAcc[trait];
//   const avg = weightSum > 0 ? weightedScoreSum / weightSum : 0;

//   finalTraitScores[trait] = parseFloat(avg.toFixed(3));

//   // linear normalization only
//   normalizedTraitScores[trait] = Math.max(
//     0,
//     Math.min(100, ((avg - 1) / 4) * 100)
//   );
// }

// setTraitScores(finalTraitScores);
  
// // ---------- CATEGORY SCORES ----------
// const normalizedCategoryScores: Record<string, number> = {};

// broadSkillCategories.forEach((category) => {
//   const skills = skillCategoryMapping[category] ?? [];

//   const scores = skills
//     .map((skill) => normalizedSkillScores[skill])
//     .filter((v): v is number => typeof v === 'number');

//   normalizedCategoryScores[category] =
//     scores.length > 0
//       ? parseFloat(
//           (scores.reduce((sum, v) => sum + v, 0) / scores.length).toFixed(1)
//         )
//       : 0;
// });

//   // ---------- CAREER MATCH ----------
//     const matches = calculateCareerMatches(
//   normalizedTraitScores, 
//   normalizedCategoryScores
//   );

//   setCareerMatches(matches);

//   // ---------- SHOW RESULT ----------
//     setQuizState('results');
//     window.scrollTo(0, 0);
//   };


  //chatgpt
  // const generateReport = () => {

  // ---------- SKILL + TRAIT ACCUMULATION ----------
  // const skillScoresAcc = skillList.reduce((acc, skill) => {
  //   acc[skill] = 0;
  //   return acc;
  // }, {} as Record<string, number>);

  // const traitScoreAcc = traitList.reduce((acc, trait) => {
  //   acc[trait] = { weightedScoreSum: 0, weightSum: 0 };
  //   return acc;
  // }, {} as Record<string, { weightedScoreSum: number; weightSum: number }>);

  // ---------- LOOP ----------
  // questions.forEach((question) => {
  //   const selectedValue = selectedAnswers[question.id];
  //   if (!selectedValue) return;

    // let selectedAnswerData: Answer | undefined;

    // if (question.type === 'likert') {
    //   selectedAnswerData = question.answers?.find(
    //     (ans) => 'value' in ans && ans.value === selectedValue
    //   );
    // } else {
    //   selectedAnswerData = findSelectedAnswer(question, selectedValue);
    // }

    // if (!selectedAnswerData) return;

    // const fullWeight =
    //   getFormatWeight(question.type) *
    //   (question.traitWeight || 1) *
    //   (question.sectionWeight || 1);

    // ---------- SKILLS ----------
    // if (selectedAnswerData.scores) {
    //   Object.entries(selectedAnswerData.scores).forEach(([skill, value]) => {
    //     if (skillScoresAcc.hasOwnProperty(skill)) {
    //       const v = Number(value);
    //       if (!isNaN(v)) {
    //         skillScoresAcc[skill] += v * fullWeight;
    //       }
    //     }
    //   });
    // }

    // ---------- TRAITS ----------
    // const primaryTrait =
    //   selectedAnswerData.primaryTraitOverride || question.primaryTrait;

    // const baseScore = selectedAnswerData.baseScoreValue;

  //   if (
  //     primaryTrait &&
  //     traitScoreAcc[primaryTrait] &&
  //     baseScore !== undefined
  //   ) {
  //     const v = Number(baseScore);
  //     if (!isNaN(v)) {
  //       traitScoreAcc[primaryTrait].weightedScoreSum += v * fullWeight;
  //       traitScoreAcc[primaryTrait].weightSum += fullWeight;
  //     }
  //   }
  // });

  // ---------- FINAL SKILLS ----------
  // const finalSkillScores: Record<string, number> = {};
  // const normalizedSkillScores: Record<string, number> = {};

  // for (const skill in skillScoresAcc) {
  //   const raw = parseFloat(skillScoresAcc[skill].toFixed(3));
  //   finalSkillScores[skill] = raw;

    // normalizedSkillScores[skill] =
    //   maxSkillScores[skill] > 0
    //     ? Math.min(100, (raw / maxSkillScores[skill]) * 100)
    //     : 0;
  // }

  // setFinalScores(finalSkillScores);

  // ---------- FINAL TRAITS ----------
  // const finalTraitScores: Record<string, number> = {};
  // const normalizedTraitScores: Record<string, number> = {};

  // for (const trait in traitScoreAcc) {
  //   const { weightedScoreSum, weightSum } = traitScoreAcc[trait];

  //   const avg = weightSum > 0 ? weightedScoreSum / weightSum : 0;

  //   finalTraitScores[trait] = parseFloat(avg.toFixed(3));
  //   const boosted = Math.pow((avg - 1) / 4, 1.5); // amplify difference
  //   normalizedTraitScores[trait] = Math.min(100, Math.max(0, boosted * 100));  
  // }

  // setTraitScores(finalTraitScores);

  // ---------- CATEGORY SCORES ----------
  // const normalizedCategoryScores: Record<string, number> = {};

// broadSkillCategories.forEach((category) => {
//   const skills = skillCategoryMapping[category];

//   if (!skills || skills.length === 0) {
//     normalizedCategoryScores[category] = 0;
//     return;
//   }

//   const scores: number[] = [];

//   skills.forEach((skill) => {
//     if (normalizedSkillScores[skill] !== undefined) {
//       scores.push(normalizedSkillScores[skill]);
//     }
//   });

//   if (scores.length === 0) {
//     normalizedCategoryScores[category] = 0;
//     return;
//   }

//   // ✅ NEW LOGIC (paste here)
//   const max = Math.max(...scores);
//   const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

//   const categoryScore = max * 0.6 + avg * 0.4;

//   normalizedCategoryScores[category] = parseFloat(categoryScore.toFixed(1));
// });

  // overwrite with trait-driven intelligence
  // normalizedCategoryScores['LogicalMathematical'] =
  //   normalizedTraitScores['LogicalMathematical'];

  // normalizedCategoryScores['Spatial'] =
  //   normalizedTraitScores['Spatial'];

  // ---------- CAREER MATCH ----------
  // const matches = calculateCareerMatches(
  //   normalizedTraitScores,
  //   normalizedCategoryScores
  // );

  // setCareerMatches(matches);

  // ---------- SHOW RESULT ----------
//   setQuizState('results');
//   window.scrollTo(0, 0);
// };