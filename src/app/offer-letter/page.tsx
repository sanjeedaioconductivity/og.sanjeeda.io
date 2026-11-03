"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  FileDown,
  Gift,
  Lock,
  Maximize2,
  Minus,
  MoreHorizontal,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import HelpIcon from "@/components/shared/HelpIcon";

type Side = "current" | "offer";
type Section = "basic" | "allowance" | "variable" | "benefits";

type ValuePair = Record<Side, string>;

type Field = {
  key: string;
  label: string;
  type?: "amount" | "percent";
  section: Section;
  dependsOn?: string;
  help: string;
};

const fields: Field[] = [
  { key: "basicSalary", label: "Basic Salary", type: "amount", section: "basic", help: "Your fixed monthly basic pay before any allowances. Percentage-based heads below are calculated from this figure." },
  { key: "houseRent", label: "House Rent", type: "percent", section: "basic", dependsOn: "basicSalary", help: "House rent allowance as a percentage of basic salary (commonly 40–50%)." },
  { key: "utilities", label: "Utilities", type: "percent", section: "basic", dependsOn: "basicSalary", help: "Utilities allowance as a percentage of basic salary (commonly around 10%)." },
  { key: "medical", label: "Medical", type: "percent", section: "basic", dependsOn: "basicSalary", help: "Monthly medical allowance as a percentage of basic salary." },
  { key: "lfa", label: "LFA", type: "percent", section: "basic", dependsOn: "basicSalary", help: "Leave Fare Assistance, expressed as a percentage of basic salary and spread monthly." },
  { key: "fuel", label: "Fuel Adjustment", type: "amount", section: "basic", help: "Fixed monthly fuel adjustment paid in cash with your salary." },
  { key: "retention", label: "Other Amount", type: "amount", section: "basic", help: "Any other fixed monthly cash component, such as a retention or special allowance." },

  { key: "secondCar", label: "Second Car", type: "amount", section: "allowance", help: "Monthly cash allowance for a second vehicle, if offered." },
  { key: "disturbance", label: "Disturbance", type: "amount", section: "allowance", help: "Allowance for relocation, hardship or a difficult posting, per month." },
  { key: "marketPremium", label: "Market Premium", type: "amount", section: "allowance", help: "Extra monthly pay for scarce skills or a competitive market." },
  { key: "driverSalary", label: "Driver Salary", type: "amount", section: "allowance", help: "Monthly amount the employer pays toward a driver." },
  { key: "servant", label: "Servant", type: "amount", section: "allowance", help: "Monthly allowance toward household staff." },

  { key: "variableBonus", label: "Variable Bonus", type: "amount", section: "variable", help: "Expected performance bonus, converted to a monthly figure (annual bonus ÷ 12)." },
  { key: "specialMilestone", label: "Special Milestone", type: "amount", section: "variable", help: "Milestone or project-completion payouts, averaged per month." },

  { key: "car", label: "Car", type: "amount", section: "benefits", help: "Monthly value of a company-maintained car (e.g. lease or depreciation cost)." },
  { key: "carFuel", label: "Car Fuel", type: "amount", section: "benefits", help: "Monthly value of fuel the company pays for the car." },
  { key: "carInsurance", label: "Car Insurance", type: "amount", section: "benefits", help: "Annual car insurance premium divided by 12." },
  { key: "medicalOpd", label: "Medical OPD", type: "amount", section: "benefits", help: "Monthly value of outpatient medical cover or reimbursement." },
  { key: "pf", label: "Provident Fund", type: "amount", section: "benefits", help: "Employer's monthly contribution to your provident fund." },
  { key: "gratuity", label: "Gratuity", type: "amount", section: "benefits", help: "Monthly accrual toward gratuity, usually one basic salary per year of service ÷ 12." },
];

const sections: {
  key: Section;
  label: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  /** Text colour on a solid `color` fill (the selected tab). */
  onColor: string;
}[] = [
  { key: "basic", label: "Basic", blurb: "Fixed monthly cash: basic salary and the allowances tied to it.", icon: Wallet, color: "#1746b5", onColor: "#ffffff" },
  { key: "allowance", label: "Allowance", blurb: "Additional monthly cash allowances on top of the basic package.", icon: Gift, color: "#eab308", onColor: "#ffffff" },
  { key: "variable", label: "Variable", blurb: "Pay that depends on performance or milestones, averaged per month.", icon: TrendingUp, color: "#e83444", onColor: "#ffffff" },
  { key: "benefits", label: "Benefits", blurb: "Non-cash perks and retirement contributions, valued per month.", icon: ShieldCheck, color: "#16a34a", onColor: "#ffffff" },
];

const initialValues: Record<string, ValuePair> = Object.fromEntries(
  fields.map((field) => [field.key, { current: "", offer: "" }])
);

const toNumber = (value: string) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

const formatNumber = (value: number) =>
  Number.isFinite(value) ? Math.round(value).toLocaleString() : "0";

const OfferLetter = () => {
  const [activeSection, setActiveSection] = useState<Section>("basic");
  const [values, setValues] = useState(initialValues);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    basicSalary: true,
  });
  const [error, setError] = useState("");

  const sectionFields = fields.filter((field) => field.section === activeSection);
  const activeMeta = sections.find((s) => s.key === activeSection)!;

  const handleToggle = (field: Field) => {
    if (field.dependsOn && !enabled[field.dependsOn]) {
      setError(
        `Turn on ${fields.find((f) => f.key === field.dependsOn)?.label} first — ${field.label} is calculated as a percentage of it.`
      );
      return;
    }

    setError("");

    setEnabled((prev) => {
      const next = { ...prev, [field.key]: !prev[field.key] };

      if (field.key === "basicSalary" && prev[field.key]) {
        fields.forEach((f) => {
          if (f.dependsOn === "basicSalary") next[f.key] = false;
        });
      }

      return next;
    });
  };

  const handleChange = (key: string, side: Side, value: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [side]: value,
      },
    }));
  };

  const handleReset = () => {
    setValues(initialValues);
    setEnabled({ basicSalary: true });
    setError("");
  };

  const getValue = (field: Field, side: Side) => {
    const raw = toNumber(values[field.key]?.[side] || "");

    if (field.type === "percent") {
      const basic = toNumber(values.basicSalary?.[side] || "");
      return basic ? Math.round((raw / 100) * basic) : 0;
    }

    return raw;
  };

  const getSectionTotal = (section: Section, side: Side) =>
    fields
      .filter((field) => field.section === section && enabled[field.key])
      .reduce((sum, field) => sum + getValue(field, side), 0);

  const totals = useMemo(
    () =>
      Object.fromEntries(
        sections.map((s) => [
          s.key,
          { current: getSectionTotal(s.key, "current"), offer: getSectionTotal(s.key, "offer") },
        ])
      ) as Record<Section, Record<Side, number>>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, enabled]
  );

  const monthlyCurrent = sections.reduce((sum, s) => sum + totals[s.key].current, 0);
  const monthlyOffer = sections.reduce((sum, s) => sum + totals[s.key].offer, 0);

  return (
    <section className="min-h-screen bg-brand-paper px-4 pb-3 pt-4 text-brand-ink dark:bg-darkBlue dark:text-white sm:px-6">
      {/* Page header: a flat red strip butting straight onto the site header. The
          negative margins cancel the section's padding so it runs edge to edge; the
          inner max-w-7xl lines its text up with the panels below. */}
      <div className="-mx-4 -mt-4 mb-2 bg-brand-accent px-4 text-white animate-in fade-in duration-500 sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-2.5 py-1.5">
          <span className="flex items-baseline gap-1.5 whitespace-nowrap text-base">
            <span className="font-bold text-white">Welcome to</span>
            {/* Mirrors the wordmark's heavy rounded face, at the same size as the strip text. */}
            <span
              className="font-black tracking-tight"
              style={{ fontFamily: "'Arial Rounded MT Bold', 'Helvetica Rounded', Arial, sans-serif" }}
            >
              Sanjeeda!
            </span>
          </span>
          <span className="h-4 w-px bg-white/40" />
          <h1 className="truncate text-base font-bold tracking-tight">Offer Letter</h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-3">

        {/* Workspace: calculator left, live results right — equal width and height on desktop */}
        <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col rounded-xl bg-whitesmoke p-3 shadow-sm ring-1 ring-brand-ink/5 animate-in fade-in slide-in-from-left-4 fill-mode-both duration-700 [animation-delay:100ms] dark:bg-white/5 dark:ring-white/10 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:min-h-[420px]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center text-sm font-semibold">
                  Build your comparison
                  <HelpIcon
                    label="Build your comparison"
                    text="Enter every figure as a monthly amount. Percentage heads are calculated from that side's basic salary, so set Basic Salary first."
                  />
                </h2>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-brand-ink/70 ring-1 ring-brand-ink/15 transition hover:bg-brand-blue-soft hover:text-brand-blue active:scale-95 dark:text-white/70 dark:ring-white/20 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>

            {/* Tabs */}
            <div role="tablist" className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {sections.map((s) => {
                const active = s.key === activeSection;
                const count = fields.filter((f) => f.section === s.key && enabled[f.key]).length;
                return (
                  <button
                    key={s.key}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => setActiveSection(s.key)}
                    style={
                      active
                        ? { backgroundColor: s.color, color: s.onColor, boxShadow: `0 4px 10px -4px ${s.color}99` }
                        : { backgroundColor: `${s.color}1f` }
                    }
                    className={`group flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-left ring-1 ring-inset transition-all duration-300 ${
                      active ? "ring-transparent" : "text-brand-ink ring-black/5 hover:brightness-95 dark:text-white dark:ring-white/10 dark:hover:brightness-125"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition ${
                        active ? "bg-white/20" : "bg-white group-hover:scale-110 dark:bg-white/10"
                      }`}
                    >
                      <span style={active ? undefined : { color: s.color }}>
                        <s.icon className="h-3.5 w-3.5" />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{s.label}</span>
                    <span
                      title={`${count} active`}
                      className={`shrink-0 rounded-full px-1.5 text-[11px] font-semibold leading-[18px] tabular-nums ${
                        active ? "bg-white/25" : "bg-white text-brand-ink/60 dark:bg-white/10 dark:text-white/70"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <p key={activeSection} className="mt-2 text-[11px] text-brand-ink/65 animate-in fade-in duration-300 dark:text-white/65">
              {activeMeta.blurb}
            </p>

            {error ? (
              <div role="alert" className="mt-2 flex items-start gap-2 rounded-xl border border-brand-accent/30 bg-brand-accent-soft px-3 py-2 text-xs text-brand-accent animate-in fade-in slide-in-from-top-1 dark:bg-brand-accent/10 dark:text-brand-accent-bright">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
              </div>
            ) : null}

            <div className="mt-2 hidden grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-brand-ink/45 dark:text-white/45 sm:grid">
              <span>Pay head</span>
              <span>Current</span>
              <span>Offer</span>
            </div>

            <div key={`rows-${activeSection}`} className="-mr-1 mt-1.5 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
              {sectionFields.map((field, i) => (
                <CalculatorRow
                  color={activeMeta.color}
                  key={field.key}
                  index={i}
                  field={field}
                  enabled={!!enabled[field.key]}
                  locked={!!field.dependsOn && !enabled[field.dependsOn]}
                  currentInput={values[field.key]?.current || ""}
                  offerInput={values[field.key]?.offer || ""}
                  currentValue={getValue(field, "current")}
                  offerValue={getValue(field, "offer")}
                  onToggle={() => handleToggle(field)}
                  onChange={handleChange}
                />
              ))}
            </div>

            <div className="mt-2 grid grid-cols-2 items-center gap-3 rounded-lg bg-brand-ink px-3 py-1.5 text-sm text-white sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <span className="col-span-2 flex items-center justify-between gap-2 font-medium sm:col-span-1">
                {activeMeta.label} total
                <DeltaBadge diff={totals[activeSection].offer - totals[activeSection].current} dark />
              </span>
              <span>
                <span className="mr-1 text-[11px] text-white/50 sm:hidden">Current</span>
                <AnimatedNumber value={totals[activeSection].current} className="font-semibold" />
              </span>
              <span>
                <span className="mr-1 text-[11px] text-white/50 sm:hidden">Offer</span>
                <AnimatedNumber value={totals[activeSection].offer} className="font-semibold" />
              </span>
            </div>
          </div>

          <ResultsPanel
            totals={totals}
            items={fields
              .filter((f) => enabled[f.key])
              .map((f) => ({ field: f, current: getValue(f, "current"), offer: getValue(f, "offer") }))}
            monthlyCurrent={monthlyCurrent}
            monthlyOffer={monthlyOffer}
          />
        </div>
      </div>
    </section>
  );
};

/** Eases the displayed figure toward `value` so totals glide instead of jump. */
function AnimatedNumber({ value, className = "" }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 450);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (value - from) * eased;
      fromRef.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className={`tabular-nums ${className}`}>{formatNumber(display)}</span>;
}

/** Current / Offer / Difference per month and per year, used in the panel and both windows. */
function TotalsStrip({ monthlyCurrent, monthlyOffer, className = "" }: { monthlyCurrent: number; monthlyOffer: number; className?: string }) {
  const diff = monthlyOffer - monthlyCurrent;
  const cols = [
    { label: "Current", value: monthlyCurrent, sign: "", tone: "text-brand-blue dark:text-brand-blue-bright" },
    { label: "Offer", value: monthlyOffer, sign: "", tone: "text-brand-accent dark:text-brand-accent-bright" },
    {
      label: "Difference",
      value: diff,
      sign: diff > 0 ? "+" : "",
      tone: diff > 0 ? "text-emerald-600 dark:text-emerald-300" : diff < 0 ? "text-brand-accent dark:text-brand-accent-bright" : "",
    },
  ];
  return (
    <div className={`grid grid-cols-3 divide-x divide-brand-ink/10 border-brand-ink/10 dark:divide-white/10 dark:border-white/10 ${className}`}>
      {cols.map((t) => (
        <div key={t.label} className="min-w-0 px-3 first:pl-0">
          <span className="block truncate text-[10px] uppercase tracking-wider text-brand-ink/50 dark:text-white/50">{t.label} / month</span>
          <span className={`block truncate text-base font-bold leading-tight tabular-nums ${t.tone}`}>
            {t.sign}
            <AnimatedNumber value={t.value} />
          </span>
          <span className="block truncate text-[10px] text-brand-ink/45 dark:text-white/45">
            {t.sign}
            <AnimatedNumber value={t.value * 12} /> / year
          </span>
        </div>
      ))}
    </div>
  );
}

function DeltaBadge({ diff, dark }: { diff: number; dark?: boolean }) {
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
  const tone =
    diff > 0
      ? dark
        ? "bg-emerald-400/15 text-emerald-300"
        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"
      : diff < 0
        ? dark
          ? "bg-brand-accent/20 text-brand-accent-bright"
          : "bg-brand-accent-soft text-brand-accent dark:bg-brand-accent/15 dark:text-brand-accent-bright"
        : dark
          ? "bg-white/10 text-white/70"
          : "bg-brand-ink/5 text-brand-ink/60 dark:bg-white/10 dark:text-white/60";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      <span>
        {diff > 0 ? "+" : ""}
        <AnimatedNumber value={diff} />
      </span>
    </span>
  );
}

type ResultItem = { field: Field; current: number; offer: number };

/** Right-hand panel: mirrors every switched-on pay head as it is added, plus the overall verdict. */
function ResultsPanel({
  totals,
  items,
  monthlyCurrent,
  monthlyOffer,
}: {
  totals: Record<Section, Record<Side, number>>;
  items: ResultItem[];
  monthlyCurrent: number;
  monthlyOffer: number;
}) {
  const [wins, setWins] = useState<Record<WindowView, WindowState>>({ breakdown: "closed", analytics: "closed" });
  // Stacking order, last = on top.
  const [order, setOrder] = useState<WindowView[]>([]);
  const bringToFront = (v: WindowView) => setOrder((o) => (o[o.length - 1] === v ? o : [...o.filter((x) => x !== v), v]));
  const setWin = (v: WindowView, state: WindowState) => {
    setWins((w) => ({ ...w, [v]: state }));
    if (state === "open") bringToFront(v);
  };

  // Esc closes the top-most visible window only.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const top = [...order].reverse().find((v) => wins[v] === "open");
      if (top) setWins((w) => ({ ...w, [top]: "closed" }));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [order, wins]);

  return (
    <aside
      aria-live="polite"
      className="flex flex-col rounded-xl bg-whitesmoke p-3 shadow-sm ring-1 ring-brand-ink/5 animate-in fade-in slide-in-from-right-4 fill-mode-both duration-700 [animation-delay:200ms] dark:bg-white/5 dark:ring-white/10 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:min-h-[420px] overflow-y-auto overflow-x-hidden"
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center text-sm font-semibold">
          Breakdown ({items.length} added)
          <HelpIcon label="Breakdown" text="Updates as you type. Every pay head you switch on appears below with its current and offered value." />
        </h2>
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
          <WindowMenu onOpen={(v) => setWin(v, "open")} itemsLabel={`${items.length} added`} />
        </div>
      </div>

      {/* Itemised: one line per switched-on head */}
      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        <div className="-mr-1 min-h-[120px] flex-1 space-y-3 overflow-y-auto pr-1">
          {sections.map((s) => {
            const rows = items.filter((it) => it.field.section === s.key);
            if (!rows.length) return null;
            return (
              <div key={s.key} className="animate-in fade-in duration-300">
                <p className="mb-1 flex items-center justify-between text-xs font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </span>
                  <DeltaBadge diff={totals[s.key].offer - totals[s.key].current} />
                </p>
                <ul
                  className="divide-y divide-brand-ink/5 rounded-xl border px-3 dark:divide-white/10"
                  style={{ backgroundColor: `${s.color}14`, borderColor: `${s.color}40` }}
                >
                  {rows.map((it) => (
                    <li
                      key={it.field.key}
                      className="flex items-center justify-between gap-3 py-1.5 text-xs animate-in fade-in slide-in-from-left-2 duration-300"
                    >
                      <span className="min-w-0 truncate text-brand-ink/75 dark:text-white/75">{it.field.label}</span>
                      <span className="flex shrink-0 items-center gap-2 tabular-nums">
                        <AnimatedNumber value={it.current} className="w-20 text-right text-brand-blue dark:text-brand-blue-bright" />
                        <AnimatedNumber value={it.offer} className="w-20 text-right font-semibold text-brand-accent dark:text-brand-accent-bright" />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {!items.length ? (
            <p className="rounded-xl border border-dashed border-brand-ink/15 p-4 text-center text-xs text-brand-ink/50 dark:border-white/15 dark:text-white/50">
              Switch on a pay head on the left and it will appear here.
            </p>
          ) : null}
        </div>
      </div>


      {/* Totals — same strip as the pop-out windows */}
      <TotalsStrip monthlyCurrent={monthlyCurrent} monthlyOffer={monthlyOffer} className="mt-3 border-t pt-3" />

      {windowViews.map((v) =>
        wins[v] !== "closed" ? (
          <ResultWindow
            key={v}
            view={v}
            totals={totals}
            items={items}
            monthlyCurrent={monthlyCurrent}
            monthlyOffer={monthlyOffer}
            hidden={wins[v] === "min"}
            zIndex={81 + order.indexOf(v)}
            onFocus={() => bringToFront(v)}
            onMinimize={() => setWin(v, "min")}
            onClose={() => setWin(v, "closed")}
          />
        ) : null
      )}

      {/* Dock for minimized windows */}
      {windowViews.some((v) => wins[v] === "min")
        ? createPortal(
            <div className="fixed bottom-4 right-4 z-[90] flex flex-wrap justify-end gap-2">
              {windowViews
                .filter((v) => wins[v] === "min")
                .map((v) => (
                  <div
                    key={v}
                    className="flex items-center gap-1 rounded-xl bg-brand-ink py-1 pl-3 pr-1 text-white shadow-2xl ring-1 ring-white/10 animate-in fade-in slide-in-from-bottom-4 duration-300"
                  >
                    <button type="button" onClick={() => setWin(v, "open")} className="flex items-center gap-2 py-1 pr-2 text-xs font-semibold">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      {v === "breakdown" ? `Breakdown · ${items.length} added` : "Analytics"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setWin(v, "open")}
                      aria-label={`Restore ${windowMeta[v].title}`}
                      title="Restore"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/15 hover:text-white active:scale-90"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setWin(v, "closed")}
                      aria-label={`Close ${windowMeta[v].title}`}
                      title="Close"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-white/75 transition hover:bg-brand-accent hover:text-white active:scale-90"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
            </div>,
            document.body
          )
        : null}
    </aside>
  );
}

type WindowView = "breakdown" | "analytics";
type WindowState = "closed" | "open" | "min";
const windowViews: WindowView[] = ["breakdown", "analytics"];

const windowMeta: Record<WindowView, { title: string; icon: React.ComponentType<{ className?: string }> }> = {
  breakdown: { title: "Offer breakdown", icon: Wallet },
  analytics: { title: "Offer analytics", icon: BarChart3 },
};

/** "⋯" menu that opens the Breakdown and Analytics windows. */
const HINT_SHOW_MS = 6000;
const HINT_GAP_MS = 15000;

function WindowMenu({ onOpen, itemsLabel }: { onOpen: (v: WindowView) => void; itemsLabel: string }) {
  const [open, setOpen] = useState(false);
  // Animated "View full Breakdown & Analytics" nudge. It loops: visible for
  // HINT_SHOW_MS, hidden for HINT_GAP_MS, then back. Hidden while the menu is open;
  // the cycle resumes (after a full gap) once it closes. Starts after mount, never in SSR.
  const [hint, setHint] = useState(false);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setHint(false);
      return;
    }
    let t: ReturnType<typeof setTimeout>;
    const show = () => {
      setHint(true);
      t = setTimeout(hide, HINT_SHOW_MS);
    };
    const hide = () => {
      setHint(false);
      t = setTimeout(show, HINT_GAP_MS);
    };
    t = setTimeout(show, started.current ? HINT_GAP_MS : 900);
    started.current = true;
    return () => clearTimeout(t);
  }, [open]);

  // × hides this round only; the loop brings it back after the next gap.
  const dismissHint = () => setHint(false);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const entries: { view: WindowView; label: string; hint: string; icon: React.ComponentType<{ className?: string }>; title: string }[] = [
    { view: "breakdown", label: "Breakdown", hint: itemsLabel, icon: Maximize2, title: "Open full breakdown" },
    { view: "analytics", label: "Analytics", hint: "Ratios & charts", icon: BarChart3, title: "Open analytics" },
  ];

  return (
    <div ref={ref} className="relative normal-case tracking-normal">
      <button
        type="button"
        aria-label="More views"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          dismissHint();
        }}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-brand-blue/10 hover:text-brand-blue active:scale-90 dark:hover:bg-white/10 dark:hover:text-white ${
          open ? "bg-brand-blue/10 text-brand-blue dark:bg-white/10 dark:text-white" : "text-brand-ink/60 dark:text-white/60"
        }`}
      >
        {hint ? <span className="pointer-events-none absolute inset-0 animate-ping rounded-lg bg-brand-blue/30" /> : null}
        <MoreHorizontal className="relative h-4 w-4" />
      </button>
      {hint && !open ? (
        <div
          role="status"
          className="absolute right-0 top-full z-30 mt-2 animate-in fade-in slide-in-from-top-2 duration-500"
        >
          <style>{`@keyframes fo-nudge { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(3px); } }`}</style>
          <div
            style={{ animation: "fo-nudge 1.6s ease-in-out infinite" }}
            className="relative flex w-max items-center gap-1.5 rounded-lg bg-brand-ink py-1.5 pl-2.5 pr-1 text-[11px] font-medium text-white shadow-lg"
          >
            <span className="absolute -top-1 right-2.5 h-2 w-2 rotate-45 bg-brand-ink" />
            <Sparkles className="relative h-3 w-3 text-brand-accent-bright" />
            <button
              type="button"
              onClick={() => {
                setOpen(true);
                dismissHint();
              }}
              className="relative hover:underline"
            >
              View full Breakdown &amp; Analytics
            </button>
            <button
              type="button"
              aria-label="Dismiss tip"
              onClick={dismissHint}
              className="relative flex h-4 w-4 items-center justify-center rounded text-white/60 hover:bg-white/15 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : null}
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-48 rounded-xl bg-white p-1 text-brand-ink shadow-xl ring-1 ring-brand-ink/10 animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-150 dark:bg-[#0f1a45] dark:text-white dark:ring-white/15"
        >
          {entries.map((e) => (
            <button
              key={e.view}
              type="button"
              role="menuitem"
              title={e.title}
              onClick={() => {
                setOpen(false);
                onOpen(e.view);
              }}
              className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-brand-blue-soft/70 dark:hover:bg-white/10"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-blue/10 text-brand-blue transition group-hover:bg-brand-blue group-hover:text-white dark:bg-white/10 dark:text-brand-blue-bright">
                <e.icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold">{e.label}</span>
                <span className="block truncate text-[10px] text-brand-ink/50 dark:text-white/50">{e.hint}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * A draggable pop-out window for the breakdown or analytics view. Both can be open at
 * once; the most recently touched one sits on top. Rendered through a portal because
 * the results panel keeps a transform from its entrance animation, which would trap a
 * `position: fixed` child inside the panel. A minimized window stays mounted (hidden)
 * so it keeps its position. "Save" marks <body> with the view being printed, and the
 * print rules show only that window, so the browser's Save as PDF captures just it.
 */
function ResultWindow({
  view,
  totals,
  items,
  monthlyCurrent,
  monthlyOffer,
  hidden,
  zIndex,
  onFocus,
  onMinimize,
  onClose,
}: {
  view: WindowView;
  totals: Record<Section, Record<Side, number>>;
  items: ResultItem[];
  monthlyCurrent: number;
  monthlyOffer: number;
  hidden: boolean;
  zIndex: number;
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
}) {
  // Side by side when the screen has room for both, otherwise cascaded.
  const [frame, setFrame] = useState(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(680, vw - 32);
    const y = Math.max(16, Math.min(96, vh * 0.1));
    if (vw >= 2 * w + 48) return { w, x: view === "breakdown" ? vw / 2 - w - 8 : vw / 2 + 8, y };
    return { w, x: view === "breakdown" ? 16 : Math.min(48, vw - w - 16), y: view === "breakdown" ? y : y + 40 };
  });
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const { title, icon: TitleIcon } = windowMeta[view];
  const generated = new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  const iconButton =
    "fo-no-print flex h-7 w-7 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/15 hover:text-white active:scale-90";

  const saveAsPdf = () => {
    document.body.dataset.foPrint = view;
    const clear = () => {
      delete document.body.dataset.foPrint;
      window.removeEventListener("afterprint", clear);
    };
    window.addEventListener("afterprint", clear);
    window.print();
  };

  return createPortal(
    <div
      role="dialog"
      aria-label={title}
      data-fo-window={view}
      onPointerDown={onFocus}
      style={{ left: frame.x, top: frame.y, width: frame.w, zIndex, maxHeight: `calc(100vh - ${frame.y}px - 16px)` }}
      className={`fixed flex-col overflow-hidden rounded-2xl bg-white text-brand-ink shadow-2xl ring-1 ring-brand-ink/10 animate-in fade-in zoom-in-95 duration-300 dark:bg-[#0f1a45] dark:text-white dark:ring-white/10 ${
        hidden ? "hidden" : "flex"
      }`}
    >
      <style>{`
        @media print {
          body[data-fo-print] > * { display: none !important; }
          body[data-fo-print="breakdown"] > [data-fo-window="breakdown"],
          body[data-fo-print="analytics"] > [data-fo-window="analytics"] {
            display: flex !important; position: static !important; width: 100% !important;
            max-height: none !important; box-shadow: none !important; animation: none !important;
          }
          [data-fo-window] .fo-no-print { display: none !important; }
          [data-fo-window] .fo-scroll { overflow: visible !important; }
          [data-fo-window] * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Title bar — drag handle */}
      <div
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          drag.current = { dx: e.clientX - frame.x, dy: e.clientY - frame.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const x = Math.min(Math.max(e.clientX - drag.current.dx, 80 - frame.w), window.innerWidth - 80);
          const y = Math.min(Math.max(e.clientY - drag.current.dy, 8), window.innerHeight - 48);
          setFrame((f) => ({ ...f, x, y }));
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        className="flex cursor-move touch-none select-none items-center justify-between gap-2 bg-brand-ink px-3 py-2 text-white"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-blue">
            <TitleIcon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{title}</p>
            <p className="text-[10px] text-white/60">Monthly figures · {generated}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={saveAsPdf} aria-label="Save as PDF" title="Save as PDF" className={iconButton}>
            <FileDown className="h-4 w-4" />
          </button>
          <button type="button" onClick={onMinimize} aria-label="Minimize" title="Minimize" className={iconButton}>
            <Minus className="h-4 w-4" />
          </button>
          <button type="button" onClick={onClose} aria-label="Close" title="Close" className={`${iconButton} hover:bg-brand-accent`}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

        <div className="fo-scroll flex-1 overflow-y-auto p-4">
          {/* Totals */}
          <TotalsStrip monthlyCurrent={monthlyCurrent} monthlyOffer={monthlyOffer} className="border-b pb-2" />

          {view === "analytics" ? (
            <AnalyticsView totals={totals} monthlyCurrent={monthlyCurrent} monthlyOffer={monthlyOffer} />
          ) : (
          /* All four sections */
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {sections.map((s, i) => {
              const rows = items.filter((it) => it.field.section === s.key);
              const sDiff = totals[s.key].offer - totals[s.key].current;
              return (
                <div
                  key={s.key}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="break-inside-avoid overflow-hidden rounded-xl ring-1 ring-brand-ink/10 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 dark:ring-white/10"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-brand-ink/5 px-3 py-2 dark:border-white/10" style={{ borderLeft: `3px solid ${s.color}` }}>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold">
                      <s.icon className="h-3.5 w-3.5" />
                      {s.label}
                    </span>
                    <span className="text-[10px] text-brand-ink/50 dark:text-white/50">{rows.length} added</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead className="text-[10px] uppercase tracking-wider text-brand-ink/45 dark:text-white/45">
                      <tr>
                        <th className="px-3 py-1.5 text-left font-medium">Head</th>
                        <th className="px-2 py-1.5 text-right font-medium">Current</th>
                        <th className="px-3 py-1.5 text-right font-medium">Offer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-ink/5 dark:divide-white/10">
                      {rows.length ? (
                        rows.map((it) => (
                          <tr key={it.field.key}>
                            <td className="px-3 py-1.5 text-brand-ink/75 dark:text-white/75">{it.field.label}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-brand-blue dark:text-brand-blue-bright">{formatNumber(it.current)}</td>
                            <td className="px-3 py-1.5 text-right font-semibold tabular-nums text-brand-accent dark:text-brand-accent-bright">{formatNumber(it.offer)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-3 py-3 text-center text-brand-ink/40 dark:text-white/40">
                            Nothing added
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-brand-paper/80 font-semibold dark:bg-white/5">
                      <tr>
                        <td className="px-3 py-1.5">
                          Total{" "}
                          <span className={`ml-1 text-[10px] font-semibold ${sDiff > 0 ? "text-emerald-600 dark:text-emerald-300" : sDiff < 0 ? "text-brand-accent" : "text-brand-ink/40 dark:text-white/40"}`}>
                            {sDiff > 0 ? "+" : ""}
                            {formatNumber(sDiff)}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{formatNumber(totals[s.key].current)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{formatNumber(totals[s.key].offer)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })}
          </div>
          )}

          <p className="mt-4 text-center text-[10px] text-brand-ink/40 dark:text-white/40">Generated with the Sanjeeda Offer Calculator · sanjeeda.io</p>
        </div>
    </div>,
    document.body
  );
}

function AnalyticsView({
  totals,
  monthlyCurrent,
  monthlyOffer,
}: {
  totals: Record<Section, Record<Side, number>>;
  monthlyCurrent: number;
  monthlyOffer: number;
}) {
  const sectionMax = Math.max(1, ...sections.flatMap((s) => [totals[s.key].current, totals[s.key].offer]));
  const share = (keys: Section[], side: Side) => {
    const total = side === "current" ? monthlyCurrent : monthlyOffer;
    return total ? (keys.reduce((sum, k) => sum + totals[k][side], 0) / total) * 100 : 0;
  };
  const pct = (a: number, b: number) => (a ? ((b - a) / a) * 100 : null);
  const fmtPct = (v: number | null) => (v === null ? "–" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`);
  const change = pct(monthlyCurrent, monthlyOffer);

  const ratios = [
    { label: "Overall change", value: fmtPct(change), hint: "Offer vs current, per month" },
    { label: "Fixed cash", value: `${share(["basic", "allowance"], "current").toFixed(0)}% → ${share(["basic", "allowance"], "offer").toFixed(0)}%`, hint: "Basic + allowances share" },
    { label: "Variable", value: `${share(["variable"], "current").toFixed(0)}% → ${share(["variable"], "offer").toFixed(0)}%`, hint: "Pay at risk" },
    { label: "Benefits", value: `${share(["benefits"], "current").toFixed(0)}% → ${share(["benefits"], "offer").toFixed(0)}%`, hint: "Non-cash share" },
  ];

  return (
    <div className="mt-3 space-y-4">
      {/* Key ratios */}
      <div className="grid grid-cols-2 gap-y-2 border-b border-brand-ink/10 pb-3 dark:border-white/10 sm:grid-cols-4 sm:divide-x sm:divide-brand-ink/10 sm:dark:divide-white/10">
        {ratios.map((r) => (
          <div key={r.label} className="min-w-0 px-3 sm:first:pl-0">
            <span className="block truncate text-[10px] uppercase tracking-wider text-brand-ink/50 dark:text-white/50">{r.label}</span>
            <span className="block truncate text-sm font-bold tabular-nums">{r.value}</span>
            <span className="block truncate text-[10px] text-brand-ink/45 dark:text-white/45">{r.hint}</span>
          </div>
        ))}
      </div>

      {/* Section by section */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[10px] uppercase tracking-wider text-brand-ink/50 dark:text-white/50">Section by section</span>
          <span className="flex gap-3 text-[10px] text-brand-ink/55 dark:text-white/55">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-3 rounded-full bg-brand-blue" /> Current
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-3 rounded-full bg-brand-accent" /> Offer
            </span>
          </span>
        </div>
        <div className="space-y-2.5">
          {sections.map((s, i) => {
            const t = totals[s.key];
            const p = pct(t.current, t.offer);
            return (
              <div
                key={s.key}
                style={{ animationDelay: `${i * 60}ms` }}
                className="grid grid-cols-[88px_minmax(0,1fr)_64px] items-center gap-3 text-xs animate-in fade-in slide-in-from-left-2 fill-mode-both duration-300"
              >
                <span className="inline-flex min-w-0 items-center gap-1.5 font-medium">
                  <s.icon className="h-3.5 w-3.5 shrink-0 text-brand-ink dark:text-white" />
                  <span className="truncate">{s.label}</span>
                </span>
                <div className="space-y-1">
                  {(["current", "offer"] as Side[]).map((side) => (
                    <div key={side} className="flex items-center gap-2">
                      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-brand-ink/5 dark:bg-white/10">
                        <div
                          className={`h-full rounded-full transition-[width] duration-700 ease-out ${side === "current" ? "bg-brand-blue" : "bg-brand-accent"}`}
                          style={{ width: `${(t[side] / sectionMax) * 100}%` }}
                        />
                      </div>
                      <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-brand-ink/70 dark:text-white/70">{formatNumber(t[side])}</span>
                    </div>
                  ))}
                </div>
                <span
                  className={`text-right text-[11px] font-semibold tabular-nums ${
                    p === null || p === 0 ? "text-brand-ink/40 dark:text-white/40" : p > 0 ? "text-emerald-600 dark:text-emerald-300" : "text-brand-accent dark:text-brand-accent-bright"
                  }`}
                >
                  {fmtPct(p)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Package mix */}
      <div className="border-t border-brand-ink/10 pt-3 dark:border-white/10">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="text-[10px] uppercase tracking-wider text-brand-ink/50 dark:text-white/50">Package mix</span>
          <span className="flex flex-wrap gap-x-2.5 text-[10px] text-brand-ink/55 dark:text-white/55">
            {sections.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full dark:ring-1 dark:ring-white/40" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
            ))}
          </span>
        </div>
        <div className="space-y-1.5">
          {(["current", "offer"] as Side[]).map((side) => {
            const total = side === "current" ? monthlyCurrent : monthlyOffer;
            return (
              <div key={side} className="flex items-center gap-3 text-xs">
                <span className="w-12 shrink-0 text-brand-ink/65 dark:text-white/65">{side === "current" ? "Current" : "Offer"}</span>
                <div className="flex h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-brand-ink/5 dark:bg-white/10">
                  {sections.map((s) => (
                    <div
                      key={s.key}
                      title={`${s.label}: ${formatNumber(totals[s.key][side])}`}
                      className="h-full transition-[width] duration-700 ease-out dark:brightness-125"
                      style={{ width: `${total ? (totals[s.key][side] / total) * 100 : 0}%`, backgroundColor: s.color }}
                    />
                  ))}
                </div>
                <span className="w-20 shrink-0 text-right font-semibold tabular-nums">{formatNumber(total)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CalculatorRow({
  index,
  color,
  field,
  enabled,
  locked,
  currentInput,
  offerInput,
  currentValue,
  offerValue,
  onToggle,
  onChange,
}: {
  index: number;
  /** Section colour used to tint the row and its switch. */
  color: string;
  field: Field;
  enabled: boolean;
  locked: boolean;
  currentInput: string;
  offerInput: string;
  currentValue: number;
  offerValue: number;
  onToggle: () => void;
  onChange: (key: string, side: Side, value: string) => void;
}) {
  const isPercent = field.type === "percent";
  return (
    <div
      // Tinted with the section colour: stronger when the head is switched on.
      style={{
        animationDelay: `${index * 45}ms`,
        backgroundColor: `${color}${enabled ? "1f" : "0a"}`,
        borderColor: `${color}${enabled ? "66" : "26"}`,
      }}
      className={`grid grid-cols-2 items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-3 sm:px-3 ${
        enabled ? "shadow-sm" : ""
      }`}
    >
      <div className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-1">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`Include ${field.label}`}
          onClick={onToggle}
          style={enabled ? { backgroundColor: color } : undefined}
          className={`relative h-3.5 w-6 shrink-0 rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-1 ${
            enabled ? "" : "bg-brand-ink/15 dark:bg-white/20"
          } ${locked ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-white shadow transition-transform duration-300 ${
              enabled ? "translate-x-2.5" : ""
            }`}
          />
        </button>
        <div className="min-w-0">
          <p className={`flex items-center text-[13px] font-medium leading-tight transition-colors ${enabled ? "" : "text-brand-ink/50 dark:text-white/50"}`}>
            <span className="truncate">{field.label}</span>
            <HelpIcon label={field.label} text={field.help} />
          </p>
          {isPercent ? (
            <p className="truncate text-[10px] leading-tight text-brand-ink/45 dark:text-white/45">
              {locked ? "Needs Basic Salary" : "% of basic"}
            </p>
          ) : null}
        </div>
      </div>

      <ValueInput
        id={`${field.key}-current`}
        label="Current"
        isPercent={isPercent}
        value={currentInput}
        computed={isPercent && enabled ? currentValue : null}
        disabled={!enabled}
        onChange={(v) => onChange(field.key, "current", v)}
      />
      <ValueInput
        id={`${field.key}-offer`}
        label="Offer"
        isPercent={isPercent}
        value={offerInput}
        computed={isPercent && enabled ? offerValue : null}
        disabled={!enabled}
        onChange={(v) => onChange(field.key, "offer", v)}
      />
    </div>
  );
}

function ValueInput({
  id,
  label,
  isPercent,
  value,
  computed,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  isPercent: boolean;
  value: string;
  /** For % heads: the amount the percentage works out to, shown inside the box. */
  computed: number | null;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[11px] font-medium text-brand-ink/50 dark:text-white/50 sm:sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className={`h-8 w-full rounded-lg border border-brand-ink/10 bg-white px-2.5 text-xs ${isPercent ? "pr-[4.75rem]" : "pr-2.5"} tabular-nums text-brand-ink outline-none transition placeholder:text-brand-ink/30 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 disabled:cursor-not-allowed disabled:bg-brand-ink/[0.03] disabled:text-brand-ink/30 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-white/30 dark:disabled:bg-white/5`}
        />
        {isPercent ? (
          <span className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-baseline gap-1 text-[11px] text-brand-ink/40 dark:text-white/40">
            {computed !== null ? <span className="text-[9px] tabular-nums text-brand-blue/70 dark:text-brand-blue-bright/80">= {formatNumber(computed)}</span> : null}
            %
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default OfferLetter;
