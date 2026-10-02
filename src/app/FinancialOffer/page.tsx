//  "use client";

// import React, { useMemo, useState } from "react";

// type ValuePair = {
//   current: string;
//   offer: string;
// };

// type Field = {
//   key: string;
//   label: string;
//   type?: "amount" | "percent";
//   section: "basic" | "allowance" | "variable" | "benefits";
//   dependsOn?: string;
// };

// const fields: Field[] = [
//   { key: "basicSalary", label: "Basic Salary", type: "amount", section: "basic" },
//   { key: "houseRent", label: "House Rent %", type: "percent", section: "basic", dependsOn: "basicSalary" },
//   { key: "utilities", label: "Utilities %", type: "percent", section: "basic", dependsOn: "basicSalary" },
//   { key: "medical", label: "Medical %", type: "percent", section: "basic", dependsOn: "basicSalary" },
//   { key: "lfa", label: "LFA %", type: "percent", section: "basic", dependsOn: "basicSalary" },
//   { key: "fuel", label: "Fuel Adj.", type: "amount", section: "basic" },
//   { key: "retention", label: "Other Amount", type: "amount", section: "basic" },

//   { key: "secondCar", label: "Second Car", section: "allowance" },
//   { key: "disturbance", label: "Disturbance", section: "allowance" },
//   { key: "marketPremium", label: "Market Premium", section: "allowance" },
//   { key: "driverSalary", label: "Driver Salary", section: "allowance" },
//   { key: "servant", label: "Servant", section: "allowance" },

//   { key: "variableBonus", label: "Variable Bonus", section: "variable" },
//   { key: "specialMilestone", label: "Special Milestone", section: "variable" },

//   { key: "car", label: "Car", section: "benefits" },
//   { key: "carFuel", label: "Car Fuel", section: "benefits" },
//   { key: "carInsurance", label: "Car Insurance", section: "benefits" },
//   { key: "medicalOpd", label: "Medical OPD", section: "benefits" },
//   { key: "pf", label: "PF", section: "benefits" },
//   { key: "gratuity", label: "Gratuity", section: "benefits" },
// ];

// const initialValues: Record<string, ValuePair> = Object.fromEntries(
//   fields.map((field) => [field.key, { current: "", offer: "" }])
// );

// const toNumber = (value: string) => {
//   const n = parseFloat(value);
//   return Number.isFinite(n) ? n : 0;
// };

// const formatNumber = (value: number) =>
//   Number.isFinite(value) ? value.toLocaleString() : "0";

// const FinancialOffer = () => {
//   const [activeSection, setActiveSection] = useState<Field["section"]>("basic");
//   const [values, setValues] = useState(initialValues);
//   const [enabled, setEnabled] = useState<Record<string, boolean>>({
//     basicSalary: true,
//   });
//   const [error, setError] = useState("");

//   const sectionFields = fields.filter((field) => field.section === activeSection);

//   const handleToggle = (field: Field) => {
//     if (field.dependsOn && !enabled[field.dependsOn]) {
//       setError(`Please enable ${fields.find((f) => f.key === field.dependsOn)?.label} first.`);
//       return;
//     }

//     setError("");

//     setEnabled((prev) => {
//       const next = { ...prev, [field.key]: !prev[field.key] };

//       if (field.key === "basicSalary" && prev[field.key]) {
//         fields.forEach((f) => {
//           if (f.dependsOn === "basicSalary") next[f.key] = false;
//         });
//       }

//       return next;
//     });
//   };

//   const handleChange = (key: string, side: "current" | "offer", value: string) => {
//     setValues((prev) => ({
//       ...prev,
//       [key]: {
//         ...prev[key],
//         [side]: value,
//       },
//     }));
//   };

//   const getValue = (field: Field, side: "current" | "offer") => {
//     const raw = toNumber(values[field.key]?.[side] || "");
//     if (field.type === "percent") {
//       const basic = toNumber(values.basicSalary?.[side] || "");
//       return basic ? Math.round((raw / 100) * basic) : 0;
//     }
//     return raw;
//   };

//   const getSectionTotal = (section: Field["section"], side: "current" | "offer") => {
//     return fields
//       .filter((field) => field.section === section)
//       .reduce((sum, field) => {
//         if (!enabled[field.key]) return sum;
//         if (field.key === "basicSalary") return sum + toNumber(values.basicSalary?.[side] || "");
//         return sum + getValue(field, side);
//       }, 0);
//   };

//   const monthlyCurrent = useMemo(
//     () =>
//       getSectionTotal("basic", "current") +
//       getSectionTotal("allowance", "current") +
//       getSectionTotal("variable", "current") +
//       getSectionTotal("benefits", "current"),
//     [values, enabled]
//   );

//   const monthlyOffer = useMemo(
//     () =>
//       getSectionTotal("basic", "offer") +
//       getSectionTotal("allowance", "offer") +
//       getSectionTotal("variable", "offer") +
//       getSectionTotal("benefits", "offer"),
//     [values, enabled]
//   );

//   const annualCurrent = monthlyCurrent * 12;
//   const annualOffer = monthlyOffer * 12;
//   const diff = monthlyOffer - monthlyCurrent;

//   return (
//     <section className="mt-20 min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
//       <div className="mx-auto max-w-6xl">
//         <div className="mb-5 rounded-3xl bg-white p-5 shadow-sm">
//           <h1 className="text-2xl font-bold text-slate-900">Financial Offer Calculator </h1>
//           <p className="mt-1 text-sm text-slate-500">
//             - Simple compensation calculator
//           </p>
//         </div>

//         <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-3">
//           <SmallSummary label="Basic" current={getSectionTotal("basic", "current")} offer={getSectionTotal("basic", "offer")} />
//           <SmallSummary label="Allowance" current={getSectionTotal("allowance", "current")} offer={getSectionTotal("allowance", "offer")} />
//           <SmallSummary label="Difference" current={0} offer={diff} highlight />
//         </div>

//         <div className="mb-5 flex flex-wrap gap-6">
//           <SectionChip active={activeSection === "basic"} onClick={() => setActiveSection("basic")}>
//             Basic
//           </SectionChip>
//           <SectionChip active={activeSection === "allowance"} onClick={() => setActiveSection("allowance")}>
//             Allowance
//           </SectionChip>
//           <SectionChip active={activeSection === "variable"} onClick={() => setActiveSection("variable")}>
//             Variable
//           </SectionChip>
//           <SectionChip active={activeSection === "benefits"} onClick={() => setActiveSection("benefits")}>
//             Benefits
//           </SectionChip>
//         </div>

//         {error && (
//           <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//             {error}
//           </div>
//         )}

//         <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 xl:grid-cols-3">
//           {sectionFields.map((field) => (
//             <CompactCard
//               key={field.key}
//               field={field}
//               enabled={!!enabled[field.key]}
//               currentInput={values[field.key]?.current || ""}
//               offerInput={values[field.key]?.offer || ""}
//               currentValue={getValue(field, "current")}
//               offerValue={getValue(field, "offer")}
//               onToggle={() => handleToggle(field)}
//               onChange={handleChange}
//             />
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// function MiniStat({ title, value }: { title: string; value: string }) {
//   return (
//     <div className="rounded-2xl bg-white p-4 shadow-sm">
//       <p className="text-xs text-slate-500">{title}</p>
//       <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
//     </div>
//   );
// }

// function SmallSummary({
//   label,
//   current,
//   offer,
//   highlight,
// }: {
//   label: string;
//   current: number;
//   offer: number;
//   highlight?: boolean;
// }) {
//   return (
//     <div className={`rounded-2xl p-4 shadow-sm ${highlight ? "bg-slate-900 text-white" : "bg-white"}`}>
//       <p className={`text-sm ${highlight ? "text-white/70" : "text-slate-500"}`}>{label}</p>
//       <div className="mt-2 flex items-center justify-between">
//         {!highlight && (
//           <div>
//             <p className="text-xs text-slate-400">Current</p>
//             <p className="font-semibold text-[#014FB7]">{current.toLocaleString()}</p>
//           </div>
//         )}
//         <div className={highlight ? "w-full" : "text-right"}>
//           <p className={`text-xs ${highlight ? "text-white/60" : "text-slate-400"}`}>
//             {highlight ? "Offer - Current" : "Offer"}
//           </p>
//           <p className={`font-semibold ${highlight ? "text-emerald-300" : "text-[#ea2626]"}`}>
//             {offer.toLocaleString()}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// function SectionChip({
//   children,
//   active,
//   onClick,
// }: {
//   children: React.ReactNode;
//   active: boolean;
//   onClick: () => void;
// }) {
//   return (
//     <button
//       onClick={onClick}
//       className={`rounded-full px-4 py-2 text-sm font-medium transition ${
//         active
//           ? "bg-slate-900 text-white"
//           : "bg-white text-slate-700 shadow-sm hover:bg-slate-100"
//       }`}
//     >
//       {children}
//     </button>
//   );
// }

// function CompactCard({
//   field,
//   enabled,
//   currentInput,
//   offerInput,
//   currentValue,
//   offerValue,
//   onToggle,
//   onChange,
// }: {
//   field: Field;
//   enabled: boolean;
//   currentInput: string;
//   offerInput: string;
//   currentValue: number;
//   offerValue: number;
//   onToggle: () => void;
//   onChange: (key: string, side: "current" | "offer", value: string) => void;
// }) {
//   return (
//     <div className="rounded-1xl bg-white p-4 shadow-sm">
//       <label className="mb-3 flex items-start gap-3">
//         <input
//           type="checkbox"
//           checked={enabled}
//           onChange={onToggle}
//           aria-label={field.label}
//           className="mt-1 h-4 w-4"
//         />
//         <div>
//           <h3 className="text-sm font-semibold text-slate-900">{field.label}</h3>
//           <p className="text-xs text-slate-500">
//             {field.type === "percent" ? "Percentage" : "Amount"}
//           </p>
//         </div>
//       </label>

//       {enabled && (
//         <>
//           <div className="grid grid-cols-2 gap-1">
//             <div>
//               <label htmlFor={`${field.key}-current`} className="mb-1 block text-[11px] text-slate-500">
//                 Current
//               </label>
//               <input
//                 id={`${field.key}-current`}
//                 type="number"
//                 value={currentInput}
//                 onChange={(e) => onChange(field.key, "current", e.target.value)}
//                 placeholder={field.type === "percent" ? "%" : "Amount"}
//                 className="w-full rounded-1xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
//               />
//             </div>

//             <div>
//               <label htmlFor={`${field.key}-offer`} className="mb-1 block text-[11px] text-slate-500">
//                 Offer
//               </label>
//               <input
//                 id={`${field.key}-offer`}
//                 type="number"
//                 value={offerInput}
//                 onChange={(e) => onChange(field.key, "offer", e.target.value)}
//                 placeholder={field.type === "percent" ? "%" : "Amount"}
//                 className="w-full rounded-1xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
//               />
//             </div>
//           </div>

//           <div className="mt-2 grid grid-cols-2 gap-1">
//             <div className="rounded-1xl bg-slate-50 p-3">
//               <p className="text-[11px] text-slate-500">Current</p>
//               <p className="text-sm font-semibold text-[#014FB7]">
//                 {currentValue.toLocaleString()}
//               </p>
//             </div>
//             <div className="rounded-1xl bg-slate-50 p-3">
//               <p className="text-[11px] text-slate-500">Offer</p>
//               <p className="text-sm font-semibold text-[#ea2626]">
//                 {offerValue.toLocaleString()}
//               </p>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// export default FinancialOffer;

"use client";
import React, { useMemo, useState } from "react";

type ValuePair = {
  current: string;
  offer: string;
};

type Field = {
  key: string;
  label: string;
  type?: "amount" | "percent";
  section: "basic" | "allowance" | "variable" | "benefits";
  dependsOn?: string;
};

const fields: Field[] = [
  { key: "basicSalary", label: "Basic Salary", type: "amount", section: "basic" },
  { key: "houseRent", label: "House Rent %", type: "percent", section: "basic", dependsOn: "basicSalary" },
  { key: "utilities", label: "Utilities %", type: "percent", section: "basic", dependsOn: "basicSalary" },
  { key: "medical", label: "Medical %", type: "percent", section: "basic", dependsOn: "basicSalary" },
  { key: "lfa", label: "LFA %", type: "percent", section: "basic", dependsOn: "basicSalary" },
  { key: "fuel", label: "Fuel Adj.", type: "amount", section: "basic" },
  { key: "retention", label: "Other Amount", type: "amount", section: "basic" },

  { key: "secondCar", label: "Second Car", section: "allowance" },
  { key: "disturbance", label: "Disturbance", section: "allowance" },
  { key: "marketPremium", label: "Market Premium", section: "allowance" },
  { key: "driverSalary", label: "Driver Salary", section: "allowance" },
  { key: "servant", label: "Servant", section: "allowance" },

  { key: "variableBonus", label: "Variable Bonus", section: "variable" },
  { key: "specialMilestone", label: "Special Milestone", section: "variable" },

  { key: "car", label: "Car", section: "benefits" },
  { key: "carFuel", label: "Car Fuel", section: "benefits" },
  { key: "carInsurance", label: "Car Insurance", section: "benefits" },
  { key: "medicalOpd", label: "Medical OPD", section: "benefits" },
  { key: "pf", label: "PF", section: "benefits" },
  { key: "gratuity", label: "Gratuity", section: "benefits" },
];

const initialValues: Record<string, ValuePair> = Object.fromEntries(
  fields.map((field) => [field.key, { current: "", offer: "" }])
);

const toNumber = (value: string) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

const formatNumber = (value: number) =>
  Number.isFinite(value) ? value.toLocaleString() : "0";

const sectionLabels: Record<Field["section"], string> = {
  basic: "Basic",
  allowance: "Allowance",
  variable: "Variable",
  benefits: "Benefits",
};

const FinancialOffer = () => {
  const [activeSection, setActiveSection] = useState<Field["section"]>("basic");
  const [values, setValues] = useState(initialValues);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    basicSalary: true,
  });
  const [error, setError] = useState("");

  const sectionFields = fields.filter((field) => field.section === activeSection);

  const handleToggle = (field: Field) => {
    if (field.dependsOn && !enabled[field.dependsOn]) {
      setError(
        `Please enable ${
          fields.find((f) => f.key === field.dependsOn)?.label
        } first.`
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

  const handleChange = (
    key: string,
    side: "current" | "offer",
    value: string
  ) => {
    setValues((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [side]: value,
      },
    }));
  };

  const getValue = (field: Field, side: "current" | "offer") => {
    const raw = toNumber(values[field.key]?.[side] || "");

    if (field.type === "percent") {
      const basic = toNumber(values.basicSalary?.[side] || "");
      return basic ? Math.round((raw / 100) * basic) : 0;
    }

    return raw;
  };

  const getSectionTotal = (
    section: Field["section"],
    side: "current" | "offer"
  ) => {
    return fields
      .filter((field) => field.section === section)
      .reduce((sum, field) => {
        if (!enabled[field.key]) return sum;
        if (field.key === "basicSalary") {
          return sum + toNumber(values.basicSalary?.[side] || "");
        }
        return sum + getValue(field, side);
      }, 0);
  };

  const monthlyCurrent = useMemo(
    () =>
      getSectionTotal("basic", "current") +
      getSectionTotal("allowance", "current") +
      getSectionTotal("variable", "current") +
      getSectionTotal("benefits", "current"),
    [values, enabled]
  );

  const monthlyOffer = useMemo(
    () =>
      getSectionTotal("basic", "offer") +
      getSectionTotal("allowance", "offer") +
      getSectionTotal("variable", "offer") +
      getSectionTotal("benefits", "offer"),
    [values, enabled]
  );

  const annualCurrent = monthlyCurrent * 12;
  const annualOffer = monthlyOffer * 12;
  const diff = monthlyOffer - monthlyCurrent;

  return (
    <section className="bg-slate-100 px-3 py-4 mt-24 text-slate-800">
      <div className="mx-auto max-w-6xl bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-medium text-slate-800">
              Offer Calculator
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-2 text-right text-xs">
            <MiniTotal label="Current" value={monthlyCurrent} />
            <MiniTotal label="Offer" value={monthlyOffer} />
            <MiniTotal label="Diff" value={diff} highlight />
          </div>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          {(["basic", "allowance", "variable", "benefits"] as Field["section"][]).map(
            (section) => (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                className={`px-3 py-2 text-left transition ${
                  activeSection === section
                    ? "bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {sectionLabels[section]}
              </button>
            )
          )}
        </div>

        {error ? (
          <div className="mb-3 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-[42px] px-3 py-2 font-medium">Use</th>
                <th className="px-3 py-2 font-medium">Head</th>
                <th className="px-3 py-2 font-medium">Current Input</th>
                <th className="px-3 py-2 font-medium">Offer Input</th>
                <th className="px-3 py-2 text-right font-medium">Current</th>
                <th className="px-3 py-2 text-right font-medium">Offer</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {sectionFields.map((field) => (
                <CalculatorRow
                  key={field.key}
                  field={field}
                  enabled={!!enabled[field.key]}
                  currentInput={values[field.key]?.current || ""}
                  offerInput={values[field.key]?.offer || ""}
                  currentValue={getValue(field, "current")}
                  offerValue={getValue(field, "offer")}
                  onToggle={() => handleToggle(field)}
                  onChange={handleChange}
                />
              ))}
            </tbody>

            <tfoot className="bg-slate-50 text-sm">
              <tr>
                <td colSpan={4} className="px-3 py-3 text-slate-500">
                  {sectionLabels[activeSection]} Total
                </td>
                <td className="px-3 py-3 text-right font-medium text-slate-800">
                  {formatNumber(getSectionTotal(activeSection, "current"))}
                </td>
                <td className="px-3 py-3 text-right font-medium text-slate-800">
                  {formatNumber(getSectionTotal(activeSection, "offer"))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <FinalTotal label="Monthly Current" value={monthlyCurrent} />
          <FinalTotal label="Monthly Offer" value={monthlyOffer} />
          <FinalTotal label="Monthly Difference" value={diff} highlight />

          <FinalTotal label="Annual Current" value={annualCurrent} />
          <FinalTotal label="Annual Offer" value={annualOffer} />
          <FinalTotal label="Annual Difference" value={annualOffer - annualCurrent} highlight />
        </div>
      </div>
    </section>
  );
};

function MiniTotal({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={highlight ? "text-blue-700" : "text-slate-600"}>
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="font-medium">{formatNumber(value)}</p>
    </div>
  );
}

function FinalTotal({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-1 text-base font-medium ${
          highlight
            ? value >= 0
              ? "text-emerald-700"
              : "text-rose-700"
            : "text-slate-800"
        }`}
      >
        {formatNumber(value)}
      </p>
    </div>
  );
}

function CalculatorRow({
  field,
  enabled,
  currentInput,
  offerInput,
  currentValue,
  offerValue,
  onToggle,
  onChange,
}: {
  field: Field;
  enabled: boolean;
  currentInput: string;
  offerInput: string;
  currentValue: number;
  offerValue: number;
  onToggle: () => void;
  onChange: (key: string, side: "current" | "offer", value: string) => void;
}) {
  return (
    <tr className={enabled ? "bg-white hover:bg-slate-50" : "bg-white opacity-50"}>
      <td className="px-3 py-2 align-middle">
        <input
          type="checkbox"
          checked={enabled}
          onChange={onToggle}
          aria-label={field.label}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
      </td>

      <td className="px-3 py-2 align-middle">
        <div>
          <p className="text-sm text-slate-700">{field.label}</p>
          <p className="text-[11px] text-slate-400">
            {field.type === "percent" ? "Percentage" : "Amount"}
          </p>
        </div>
      </td>

      <td className="px-3 py-2 align-middle">
        <input
          type="number"
          value={currentInput}
          disabled={!enabled}
          onChange={(e) => onChange(field.key, "current", e.target.value)}
          placeholder={field.type === "percent" ? "%" : "0"}
          className="h-9 w-full bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed"
        />
      </td>

      <td className="px-3 py-2 align-middle">
        <input
          type="number"
          value={offerInput}
          disabled={!enabled}
          onChange={(e) => onChange(field.key, "offer", e.target.value)}
          placeholder={field.type === "percent" ? "%" : "0"}
          className="h-9 w-full bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed"
        />
      </td>

      <td className="px-3 py-2 text-right align-middle text-sm text-slate-700">
        {formatNumber(currentValue)}
      </td>

      <td className="px-3 py-2 text-right align-middle text-sm text-slate-700">
        {formatNumber(offerValue)}
      </td>
    </tr>
  );
}

export default FinancialOffer;