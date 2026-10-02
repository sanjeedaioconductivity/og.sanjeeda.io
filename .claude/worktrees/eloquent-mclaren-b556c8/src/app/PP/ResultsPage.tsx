"use client";
import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Download,} from "lucide-react";
import { QuestionData } from "./QuestionBlock";
import MbtiPreferenceGraph from "./MBTI/MbtiPreferenceGraph";
import LearningStyle3DGraph from "./LearningStyles/LearningStyle3DGraph";
import MIBarChart from "./MIBarChart";
import DISCCircularChart from "./DISCCircularChart";
import WorkingWithNumbersScore from "./Attributes/Abilities/WorkingwithNum";
import WorkingWithWordsScore from "./Attributes/Abilities/WorkingwithWord";
import WorkingWithShapesScore from "./Attributes/Abilities/WorkingwithShape";
import WorkingWithPeopleScore from "./Attributes/Motivation & Interests/WorkingwithPeople";
import WorkingWithDataScore from "./Attributes/Motivation & Interests/WorkingwithData";
import WorkingWithThingsScore from "./Attributes/Motivation & Interests/WorkingwithThing";
import DiplomaticIndependentScore from "./Attributes/Personality/DiplomaticIndependentScore";
import CooperativeCompetitiveScore from "./Attributes/Personality/CooperativeCompetitiveScore";
import SubmissiveAssertiveScore from "./Attributes/Personality/SubmissiveAssertiveScore";
import SpontaneousConscientiousScore from "./Attributes/Personality/SpontaneousConscientiousScore";
import InnovativeConventionalScore from "./Attributes/Personality/InnovativeConventionalScore";
import ReactiveOrganizedScore from "./Attributes/Personality/ReactiveOrganizedScore";
import IntrovertExtrovertScore from "./Attributes/Personality/IntrovertExtrovertScore";
import SelfSufficientGroupOrientedScore from "./Attributes/Personality/SelfSufficientGroupOrientedScore";
import ReservedOutgoingScore from "./Attributes/Personality/ReservedOutgoingScore";
import EmotionalStableScore from "./Attributes/Personality/EmotionalStableScore";
import RestlessPoisedScore from "./Attributes/Personality/RestlessPoisedScore";
import ExcitableRelaxedScore from "./Attributes/Personality/ExcitableRelaxedScore";
import FrankSocialDesirabilityScore from "./Attributes/Personality/FrankSocialDesirabilityScore";
import CareerLockingReadinessPage from "./CareerLockingReadiness/CareerLockingReadinessPage";
 
interface Match {
  name: string;
  score: number;
}

interface CareerMatchProfileProps {
  matches: Match[];
}

const CareerMatchProfile: React.FC<CareerMatchProfileProps> = ({ matches }) => {
  const top6Matches = [...matches]
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return (
    <div>
      <h3 className="text-lg font-semibold">Career Match Profile</h3>

      <ol className="mt-3 space-y-1">
        {top6Matches.map((match, index) => (
          <li key={match.name} className="text-sm">
            {index + 1}. {match.name} — {match.score}
          </li>
        ))}
      </ol>
    </div>
  );
};

interface ResultsPageProps {
  skillScores: Record<string, number>;
  traitScores: Record<string, number>;
  skillCategories: Record<string, string[]>;
  careerMatches: Match[];
  onRestart: () => void;
  candidateName: string;
  candidateEmail: string;
  allQuestions: QuestionData[];
  userResponses: Record<string, string | number | undefined>;
}

const ResultsPage: React.FC<ResultsPageProps> = ({
  skillScores, traitScores, skillCategories, careerMatches, candidateName, candidateEmail, allQuestions, userResponses,
}) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const downloadPDF = async () => { 
    const container = document.getElementById("results-container") as HTMLElement | null;
    if (!container) return;
    setIsExporting(true);

    // ✅ same PDF on mobile + laptop
    const EXPORT_WIDTH = 900;
    const SCALE = 3;

    const waitTwoFrames = () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );

    const safeFontsReady = async () => {
      await document.fonts?.ready;
    };

    const captureElement = async (el: HTMLElement) => {
      return await html2canvas(el, {
        scale: SCALE,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: EXPORT_WIDTH,
        windowWidth: EXPORT_WIDTH,
        scrollX: 0,
        scrollY: 0,
      });
    };

    const addCanvasToPdf = (pdf: jsPDF, canvas: HTMLCanvasElement, addNewPage: boolean) => {
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const marginX = 12;
      const marginTop = 16;

      const usableWidth = pageWidth - marginX * 2;
      const usableHeight = pageHeight - marginTop * 2;

      const pxPerMm = canvas.width / usableWidth;
      const pageHeightPx = Math.floor(usableHeight * pxPerMm);

      let renderedHeight = 0;
      let first = true;

      while (renderedHeight < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - renderedHeight);

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;

        const ctx = sliceCanvas.getContext("2d");
        if (!ctx) break;

        ctx.drawImage(
          canvas,
          0,
          renderedHeight,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        const imgData = sliceCanvas.toDataURL("image/png", 1.0);
        const sliceHeightMm = sliceHeight / pxPerMm;

        if (!first || addNewPage) pdf.addPage();
        pdf.addImage(imgData, "PNG", marginX, marginTop, usableWidth, sliceHeightMm);

        first = false;
        addNewPage = false;
        renderedHeight += sliceHeight;
      }
    };

    // --- save inline styles to restore ---
    const prev = {
      width: container.style.width,
      maxWidth: container.style.maxWidth,
      position: container.style.position,
      left: container.style.left,
      top: container.style.top,
      background: container.style.background,
    };

    const chartsRow = container.querySelector('[data-pdf="charts"]') as HTMLElement | null;
    const miBlock = container.querySelector('[data-pdf-block="mi"]') as HTMLElement | null;

    const prevCharts = chartsRow
      ? {
          display: chartsRow.style.display,
          gridTemplateColumns: (chartsRow.style as any).gridTemplateColumns,
          columnGap: (chartsRow.style as any).columnGap,
          rowGap: (chartsRow.style as any).rowGap,
          alignItems: (chartsRow.style as any).alignItems,
          justifyItems: (chartsRow.style as any).justifyItems,
        }
      : null;

    const prevMi = miBlock
      ? {
          gridColumn: (miBlock.style as any).gridColumn,
          width: miBlock.style.width,
          maxWidth: miBlock.style.maxWidth,
          margin: miBlock.style.margin,
        }
      : null;

    const prefRow = container.querySelector('[data-pdf="pref-row"]') as HTMLElement | null;
    const mbtiPref = container.querySelector('[data-pdf-block="mbti-pref"]') as HTMLElement | null;
    const lsPref = container.querySelector('[data-pdf-block="ls-pref"]') as HTMLElement | null;
    const lsChartWrap = container.querySelector("[data-pdf-ls-chart]") as HTMLElement | null;

    const prevPrefRow = prefRow
      ? {
          display: prefRow.style.display,
          gridTemplateColumns: prefRow.style.gridTemplateColumns,
          columnGap: prefRow.style.columnGap,
          rowGap: prefRow.style.rowGap,
          alignItems: prefRow.style.alignItems,
        }
      : null;

    const prevMbtiPref = mbtiPref ? { marginLeft: mbtiPref.style.marginLeft } : null;
    const prevLsPref = lsPref ? { marginLeft: lsPref.style.marginLeft } : null;
    const prevLsChart = lsChartWrap ? { height: lsChartWrap.style.height } : null;

    try {
      await safeFontsReady();

      // ✅ move offscreen so user doesn't see changes
      container.style.position = "fixed";
      container.style.left = "-10000px";
      container.style.top = "0";
      container.style.background = "#ffffff";

      // ✅ fixed export width
      container.style.width = `${EXPORT_WIDTH}px`;
      container.style.maxWidth = `${EXPORT_WIDTH}px`;

    // ✅ Force Personality block width for stable html2canvas capture
    const personalityBlock = container.querySelector('[data-pdf="personality"]') as HTMLElement | null;
    const prevPersonality = personalityBlock ? { width: personalityBlock.style.width } : null;

if (personalityBlock) {
  personalityBlock.style.width = `${EXPORT_WIDTH}px`; // 900px
}  
if (personalityBlock && prevPersonality) {
  personalityBlock.style.width = prevPersonality.width;
}
// ✅ PDF chart layout: MI + DISC in SAME ROW (like screen)
if (chartsRow) {
  chartsRow.style.display = "grid";
  (chartsRow.style).gridTemplateColumns = "1fr 260px"; // MI flexible, DISC fixed (matches your w-[260px])
  (chartsRow.style).columnGap = "16px";
  (chartsRow.style).rowGap = "0px";
  (chartsRow.style).alignItems = "start";
  (chartsRow.style).justifyItems = "start";
}

// ✅ DO NOT force MI to full width row
if (miBlock) {
  (miBlock.style).gridColumn = "";        // reset
  miBlock.style.width = "100%";
  miBlock.style.maxWidth = "none";
  miBlock.style.margin = "0";
}


  // ✅ PDF-only: force MBTI + Learning Styles to 2 columns (even on mobile)
  if (prefRow) {
    prefRow.style.display = "grid";
    prefRow.style.gridTemplateColumns = "1.5fr 1fr";
    prefRow.style.columnGap = "18px";
    prefRow.style.rowGap = "0px";
    prefRow.style.alignItems = "start";
    }

    // ✅ avoid left crop in PDF (desktop has lg:-ml-4)
    if (mbtiPref) mbtiPref.style.marginLeft = "0";
    if (lsPref) lsPref.style.marginLeft = "0";

    // ✅ make LearningStyle chart fit nicely in PDF column
    if (lsChartWrap) lsChartWrap.style.height = "250px";

    // ✅ force charts resize cleanly
    window.dispatchEvent(new Event("resize"));
    await waitTwoFrames();
    await new Promise((r) => setTimeout(r, 250));

    // ✅ collect pages IN ORDER (1,2,3...)
    const pages = Array.from(
      container.querySelectorAll<HTMLElement>("[data-pdf-page]")
    ).sort((a, b) => Number(a.dataset.pdfPage || "0") - Number(b.dataset.pdfPage || "0"));

    if (pages.length === 0) return;

    const pdf = new jsPDF("p", "mm", "a4");

    for (let i = 0; i < pages.length; i++) {
      const canvas = await captureElement(pages[i]);
      addCanvasToPdf(pdf, canvas, i !== 0);
    }

      pdf.save("CIR.pdf");
    } finally {
      // ✅ restore everything
      container.style.width = prev.width;
      container.style.maxWidth = prev.maxWidth;
      container.style.position = prev.position;
      container.style.left = prev.left;
      container.style.top = prev.top;
      container.style.background = prev.background;

    if (chartsRow && prevCharts) {
      chartsRow.style.display = prevCharts.display;
      (chartsRow.style as any).gridTemplateColumns = prevCharts.gridTemplateColumns;
      (chartsRow.style as any).columnGap = prevCharts.columnGap;
      (chartsRow.style as any).rowGap = prevCharts.rowGap;
      (chartsRow.style as any).alignItems = prevCharts.alignItems;
      (chartsRow.style as any).justifyItems = prevCharts.justifyItems;
    }

    if (miBlock && prevMi) {
    (miBlock.style as any).gridColumn = prevMi.gridColumn;
    miBlock.style.width = prevMi.width;
    miBlock.style.maxWidth = prevMi.maxWidth;
    miBlock.style.margin = prevMi.margin;
    }

    if (prefRow && prevPrefRow) {
    prefRow.style.display = prevPrefRow.display;
    prefRow.style.gridTemplateColumns = prevPrefRow.gridTemplateColumns;
    prefRow.style.columnGap = prevPrefRow.columnGap;
    prefRow.style.rowGap = prevPrefRow.rowGap;
    prefRow.style.alignItems = prevPrefRow.alignItems;
    }

    if (mbtiPref && prevMbtiPref) mbtiPref.style.marginLeft = prevMbtiPref.marginLeft;
    if (lsPref && prevLsPref) lsPref.style.marginLeft = prevLsPref.marginLeft;
    if (lsChartWrap && prevLsChart) lsChartWrap.style.height = prevLsChart.height;

    window.dispatchEvent(new Event("resize"));
    setIsExporting(false);
    }
  };

  if (!skillScores || !traitScores || !skillCategories || !careerMatches) {
    return <p>Loading results or encountering data issue...</p>;
  }

  // ---------- MBTI / LS helpers (your current code kept) ----------
  type PrefSide = "L" | "R";

  function toLikertNumber(v: string | number | undefined): number | null {
    if (v === undefined || v === null) return null;
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return null;
    if (n < 1 || n > 5) return null;
    return n;
  }

  function computeBinaryPreference(
    items: Array<{ id: string; side: PrefSide }>,
    responses: Record<string, string | number | undefined>
  ): { leftPct: number; rightPct: number } | null {
    let left = 0;
    let right = 0;
    let answered = 0;

    for (const it of items) {
      const val = toLikertNumber(responses[it.id]);
      if (val === null) continue;

      answered += 1;
      const norm = (val - 1) / 4;

      if (it.side === "L") {
        left += norm;
        right += 1 - norm;
      } else {
        right += norm;
        left += 1 - norm;
      }
    }

    if (answered === 0) return null;

    const total = left + right;
    const leftPct = (left / total) * 100;
    return { leftPct, rightPct: 100 - leftPct };
  }

  const hasMbtiEI =
    !!userResponses["MBTI-EI-1"] ||
    !!userResponses["MBTI-EI-2"] ||
    !!userResponses["MBTI-EI-3"] ||
    !!userResponses["MBTI-EI-4"];

  const eiItems: Array<{ id: string; side: PrefSide }> = hasMbtiEI
    ? [
        { id: "MBTI-EI-1", side: "L" },
        { id: "MBTI-EI-2", side: "R" },
        { id: "MBTI-EI-3", side: "L" },
        { id: "MBTI-EI-4", side: "R" },
      ]
    : [
        { id: "E-L1", side: "L" },
        { id: "E-L2", side: "R" },
      ];

  const ei = computeBinaryPreference(eiItems, userResponses);

  const hasMbtiSN =
    !!userResponses["MBTI-SN-1"] ||
    !!userResponses["MBTI-SN-2"] ||
    !!userResponses["MBTI-SN-3"] ||
    !!userResponses["MBTI-SN-4"];

  const snItems: Array<{ id: string; side: PrefSide }> = hasMbtiSN
    ? [
        { id: "MBTI-SN-1", side: "L" },
        { id: "MBTI-SN-2", side: "R" },
        { id: "MBTI-SN-3", side: "L" },
        { id: "MBTI-SN-4", side: "R" },
      ]
    : [];

  const sn = computeBinaryPreference(snItems, userResponses);

  const hasMbtiTF =
    !!userResponses["MBTI-TF-1"] ||
    !!userResponses["MBTI-TF-2"] ||
    !!userResponses["MBTI-TF-3"] ||
    !!userResponses["MBTI-TF-4"];

  const tfItems: Array<{ id: string; side: PrefSide }> = hasMbtiTF
    ? [
        { id: "MBTI-TF-1", side: "L" },
        { id: "MBTI-TF-2", side: "R" },
        { id: "MBTI-TF-3", side: "L" },
        { id: "MBTI-TF-4", side: "R" },
      ]
    : [];

  const tf = computeBinaryPreference(tfItems, userResponses);

  const hasMbtiJP =
    !!userResponses["MBTI-JP-1"] ||
    !!userResponses["MBTI-JP-2"] ||
    !!userResponses["MBTI-JP-3"] ||
    !!userResponses["MBTI-JP-4"];

  const jpItems: Array<{ id: string; side: PrefSide }> = hasMbtiJP
    ? [
        { id: "MBTI-JP-1", side: "L" },
        { id: "MBTI-JP-2", side: "R" },
        { id: "MBTI-JP-3", side: "L" },
        { id: "MBTI-JP-4", side: "R" },
      ]
    : [];

  const jp = computeBinaryPreference(jpItems, userResponses);

  const mbtiRows = [
    ...(ei
      ? [
          {
            leftLabel: "Extraversion",
            rightLabel: "Introversion",
            leftPct: ei.leftPct,
            rightPct: ei.rightPct,
          },
        ]
      : []),
    ...(sn
      ? [
          {
            leftLabel: "Sensing",
            rightLabel: "Intuition",
            leftPct: sn.leftPct,
            rightPct: sn.rightPct,
          },
        ]
      : []),
    ...(tf
      ? [
          {
            leftLabel: "Thinking",
            rightLabel: "Feeling",
            leftPct: tf.leftPct,
            rightPct: tf.rightPct,
          },
        ]
      : []),
    ...(jp
      ? [
          {
            leftLabel: "Judging",
            rightLabel: "Perceiving",
            leftPct: jp.leftPct,
            rightPct: jp.rightPct,
          },
        ]
      : []),
  ];

  // ---------- charts data ----------
  const miLabels = [
    "Linguistic",
    "LogicalMathematical",
    "Spatial",
    "BodilyKinesthetic",
    "Musical",
    "Interpersonal",
    "Intrapersonal",
    "Naturalist",
  ];
  const miData = miLabels.map((label) => traitScores[label.replace("-", "")] ?? 0);
  const miChartData = { labels: miLabels, data: miData };

  const discLabels = ["Dominance", "Influence", "Steadiness", "Compliance"];
  const discData = discLabels.map((label) => traitScores[label] ?? 0);
  const discChartData = { labels: discLabels, data: discData };

  return (
    <div className="m-10">
      {/* Download button (outside capture so it won’t appear in PDF) */}
      <div className="mt-24 mb-4 flex justify-center sm:justify-start">
         
      </div>
                                        <button
              type="button"
              onClick={downloadPDF}
              disabled={isExporting}
              className="
                relative inline-flex items-center justify-center gap-2
                 px-4 py-2 mt-2 -mb-2 -ml-1 text-sm font-semibold
                text-indigo-600
                bg-tranparent from-indigo-500/20 via-violet-500/20 to-pink-500/20
                border-0 outline-none ring-0
                shadow-[0_8px_30px_rgba(2,6,23,0.08)]
                backdrop-blur-md
                transition-all duration-300
                hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(2,6,23,0.14)]
                active:translate-y-0
                disabled:cursor-not-allowed disabled:opacity-60
                focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60
              "
            >
              <span
                className="
                  pointer-events-none absolute inset-0 rounded-2xl
                  bg-gradient from-indigo-500/20 via-violet-500/20 to-pink-500/20
                  opacity-0 blur-md transition-opacity duration-300
                  group-hover:opacity-100
                "
                aria-hidden="true"
              />
              <Download className="relative h-4 w-4 transition-transform duration-300 group-hover:scale-110 " />
              <span className="relative whitespace-nowrap">
                {isExporting ? "Generating PDF..." : "Download"}
              </span>
            </button>
      <div id="results-container" className="w-full overflow-x-hidden px-3 sm:px-0">

        <div data-pdf-page="1">


          <h1 className="text-2xl">
            5<span style={{ color: "Red" }}>E </span>Report (C<span style={{ color: "Red" }}>!</span>R)
          </h1>

          {candidateName && (
            <h1 className="text-lg">
              Candidate Name: <span className="font-semibold">{candidateName}</span>
            </h1>
          )}
          {candidateEmail && <h1 className="font-semibold text-lg">Email: {candidateEmail}</h1>}


          <CareerMatchProfile matches={careerMatches} />

          <h3 className="trait-summary-header">Summary Profiles (Visualized)</h3>

          <div data-pdf="pref-row"
            className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-0 items-start"
          >
            <div data-pdf-block="mbti-pref" className="min-w-0 lg:-ml-4">
              <MbtiPreferenceGraph rows={mbtiRows} />
            </div>

            <div data-pdf-block="ls-pref" className="min-w-0">
              <LearningStyle3DGraph responses={userResponses} />
            </div>
          </div>
<div className="trait-visual-grid">
<div data-pdf="charts"
className="flex flex-col items-center -gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-1">
  {/* MI */}
  <div data-pdf-block="mi" className="w-full lg:flex-0 lg:min-w-0">
    <MIBarChart chartData={miChartData} title="MULTI INTELLIGENCES PROFILE" />
  </div>
  {/* DISC */}
  <div data-pdf-block="disc" className="w-full flex justify-center lg:w-[330px] lg:flex-none lg:justify-center">
    <DISCCircularChart chartData={discChartData} />
  </div>
</div>

</div>

        </div>
        <div data-pdf-page="2" className="bg-white mt-6">
          <div className="w-full mt-0 sm:-mt-2" data-pdf="attributes">
            <h3 className="text-lg font-bold">Attributes</h3>

            <div className="max-w-2xl mx-auto mt-6">
              <h4 className="text-lg text-center font-semibold text-gray-700 mb-3">Abilities</h4>
              <div className="border border-gray-400 rounded-2xl px-4 py-3">
                <div className="-space-y-1">
                  <WorkingWithNumbersScore questions={allQuestions} responses={userResponses} />
                  <WorkingWithWordsScore questions={allQuestions} responses={userResponses} />
                  <WorkingWithShapesScore questions={allQuestions} responses={userResponses} />
                </div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto mt-4">
              <h4 className="text-lg text-center font-semibold text-gray-700 mb-3">
                Motivation &amp; Interests
              </h4>
              <div className="border border-gray-400 rounded-[18px] px-4 py-3">
                <div className="-space-y-1">
                  <WorkingWithPeopleScore questions={allQuestions} responses={userResponses} />
                  <WorkingWithDataScore questions={allQuestions} responses={userResponses} />
                  <WorkingWithThingsScore questions={allQuestions} responses={userResponses} />
                </div>
              </div>
            </div>

{/* ✅ Personality (PDF-safe) */}
<div className="max-w-[900px] mx-auto mt-4" data-pdf="personality">
  <h4 className="text-lg text-center font-semibold text-gray-700 mb-3">
    Personality
  </h4>

  <div className="border border-gray-400 rounded-[18px] px-4 py-4">
    {/* ✅ no negative spacing in PDF */}
    <div className="space-y-1">
      <DiplomaticIndependentScore questions={allQuestions} responses={userResponses} />
      <CooperativeCompetitiveScore questions={allQuestions} responses={userResponses} />
      <SubmissiveAssertiveScore questions={allQuestions} responses={userResponses} />
      <SpontaneousConscientiousScore questions={allQuestions} responses={userResponses} />
      <InnovativeConventionalScore questions={allQuestions} responses={userResponses} />
      <ReactiveOrganizedScore questions={allQuestions} responses={userResponses} />
      <IntrovertExtrovertScore questions={allQuestions} responses={userResponses} />
      <SelfSufficientGroupOrientedScore questions={allQuestions} responses={userResponses} />
      <ReservedOutgoingScore questions={allQuestions} responses={userResponses} />
      <EmotionalStableScore questions={allQuestions} responses={userResponses} />
      <RestlessPoisedScore questions={allQuestions} responses={userResponses} />
      <ExcitableRelaxedScore questions={allQuestions} responses={userResponses} />
      <FrankSocialDesirabilityScore questions={allQuestions} responses={userResponses} />
    </div>
  </div>
</div>
          </div>
        </div>

        {/* <div data-pdf-page="3" className="bg-white mt-6">
          <CareerLockingReadinessPage candidateName={candidateName} careerMatches={careerMatches} skillScores={skillScores} traitScores={traitScores}/>
        </div> */}
                    <button
              type="button"
              onClick={downloadPDF}
              disabled={isExporting}
              className="
                relative inline-flex items-center justify-center gap-2
                 px-4 py-2 mt-2 -mb-2 ml-64 text-sm font-semibold
                text-indigo-600
                bg-gradient-to-b from-indigo-500/20 via-violet-500/20 to-pink-500/20
                border-0 outline-none ring-0
                shadow-[0_8px_30px_rgba(2,6,23,0.08)]
                backdrop-blur-md
                transition-all duration-300
                hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(2,6,23,0.14)]
                active:translate-y-0
                disabled:cursor-not-allowed disabled:opacity-60
                focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60
              "
            >
              <span
                className="
                  pointer-events-none absolute inset-0 rounded-2xl
                  bg-gradient from-indigo-500/20 via-violet-500/20 to-pink-500/20
                  opacity-0 blur-md transition-opacity duration-300
                  group-hover:opacity-100
                "
                aria-hidden="true"
              />
              <Download className="relative h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              <span className="relative whitespace-nowrap">
                {isExporting ? "Generating PDF..." : "Download CIR"}
              </span>
            </button>
      </div>
    </div>
);};
export default ResultsPage;