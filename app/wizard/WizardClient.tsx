"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import InputPanel, { UserInputs } from "./InputPanel";
import PlanOptionsPanel from "./PlanOptionsPanel";

/** A single plan row from /api/premiums. */
interface PlanOption {
  id: number;
  tarif: string;
  tariftyp: string | null;
  tarifbezeichnung: string | null;
  franchise: string;
  unfalleinschluss: string;
  altersklasse: string;
  praemie: string;
  insurer_name: string;
  plan_label: string;
}

type PlansByType = Record<string, PlanOption[]>;

const TYPE_ORDER = ["TAR-BASE", "TAR-HAM", "TAR-HMO", "TAR-DIV"] as const;
const TYPE_LABELS: Record<string, string> = {
  "TAR-BASE": "Standard",
  "TAR-HAM": "Family doctor",
  "TAR-HMO": "HMO",
  "TAR-DIV": "Other plan types",
};

/** Convert monthly premium => e.g. "120 CHF/month". */
function formatMonthly(val: number): string {
  return `${Math.round(val)} CHF/month`;
}

/**
 * ± sign for cost difference:
 * - cheaper => “-xxx CHF/year”
 * - more expensive => “+xxx CHF/year”
 * - zero => hide
 */
function formatCostDiff(diff: number) {
  const absVal = Math.abs(Math.round(diff));
  if (absVal === 0) return { text: "", show: false };

  const sign = diff > 0 ? "-" : "+";
  const text = `${sign}${absVal} CHF/year`;
  return { text, show: true };
}

/** Return the plan type or fallback 'TAR-DIV'. */
function getPlanType(row: PlanOption): string {
  return row.tariftyp || "TAR-DIV";
}

/** Helper: last working day before a date. */
function lastWorkingDayBefore(year: number, monthIndex: number, day: number) {
  const d = new Date(year, monthIndex, day);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

/**
 * Calculate how many days remain until last working day for:
 * - model => end of this month
 * - midYear => end of March 31
 * - annual => end of Nov 30
 * Also return the date label => "Days until <date>".
 */
function calcDaysAndDeadline(type: "model" | "midYear" | "annual"): {
  days: number;
  deadlineLabel: string;
} {
  const today = new Date();
  let target: Date;

  if (type === "model") {
    const y = today.getFullYear();
    const m = today.getMonth();
    const lastDay = new Date(y, m + 1, 0).getDate();
    target = lastWorkingDayBefore(y, m, lastDay);
  } else if (type === "midYear") {
    const y = today.getFullYear();
    const candidate = lastWorkingDayBefore(y, 2, 31);
    if (candidate < today) {
      target = lastWorkingDayBefore(y + 1, 2, 31);
    } else {
      target = candidate;
    }
  } else {
    // type="annual"
    const y = today.getFullYear();
    const candidate = lastWorkingDayBefore(y, 10, 30);
    if (candidate < today) {
      target = lastWorkingDayBefore(y + 1, 10, 30);
    } else {
      target = candidate;
    }
  }

  const days = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const deadlineLabel = target.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
  });
  return { days, deadlineLabel };
}

/**
 * A shared function to style the 3 boxes: 
 * "Insurance Model Change", "Mid-Year Change", "Annual Change"
 * with big day number left-aligned, text underneath, and a smaller color-coded box.
 */
function BoxDesign({
  title,
  subtitle,
  active,
  daysRemaining,
  deadlineLabel,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  daysRemaining: number;
  deadlineLabel: string;
}) {
  let colorClass = "";
  let smallBoxClass = "";
  let message = "";

  if (!active) {
    // For Annual Change, make days & message dark grey
    if (title === "Annual Change") {
      colorClass = "text-gray-800";
      smallBoxClass = "bg-gray-100 border border-gray-800 text-gray-800";
      message =
        "Savings locked: new premiums will be available beginning of October.";
    } else {
      colorClass = "text-black";
      smallBoxClass = "bg-gray-300 border border-gray-600 text-black";
      message =
        "Savings locked: new premiums will be available beginning of October.";
    }
  } else {
    const isShortDeadline = daysRemaining <= 5;
    if (isShortDeadline) {
      colorClass = "text-red-700";
      smallBoxClass = "bg-red-100 border border-red-700 text-red-700";
      message = `Savings unlocked: Less than ${daysRemaining} days remaining. Consider express mail or calling the insurance company.`;
    } else {
      colorClass = "text-green-700";
      smallBoxClass = "bg-green-100 border border-green-700 text-green-700";
      message = "Savings unlocked: Act to change the insurance plan.";
    }
  }

  return (
    <div className="bg-white shadow rounded p-4 mb-4">
      {/* Title & subtitle => bigger text */}
      <div className={`font-bold text-xl mb-1 ${colorClass}`}>{title}</div>
      <div className="text-lg mb-2">{subtitle}</div>

      {/* Big day number => left-aligned */}
      <div className={`text-4xl font-bold mb-1 ${colorClass} text-left`}>
        {daysRemaining}
      </div>
      <div className="text-left text-sm italic mb-2">{`Days until ${deadlineLabel}`}</div>

      {/* smaller color-coded box */}
      <div className={`rounded p-2 text-sm ${smallBoxClass} text-left`}>
        {message}
      </div>
    </div>
  );
}

function ModelChangeBox({
  active,
  daysRemaining,
  deadlineLabel,
}: {
  active: boolean;
  daysRemaining: number;
  deadlineLabel: string;
}) {
  return (
    <BoxDesign
      title="Insurance Model Change"
      subtitle="Switch to family doctor, HMO or telemedicine (same insurer)."
      active={active}
      daysRemaining={daysRemaining}
      deadlineLabel={deadlineLabel}
    />
  );
}

function MidYearChangeBox({
  active,
  daysRemaining,
  deadlineLabel,
}: {
  active: boolean;
  daysRemaining: number;
  deadlineLabel: string;
}) {
  return (
    <BoxDesign
      title="Mid-Year Change"
      subtitle="Switch provider with new policy starting July 1"
      active={active}
      daysRemaining={daysRemaining}
      deadlineLabel={deadlineLabel}
    />
  );
}

function AnnualChangeBox({
  active,
  daysRemaining,
  deadlineLabel,
}: {
  active: boolean;
  daysRemaining: number;
  deadlineLabel: string;
}) {
  return (
    <BoxDesign
      title="Annual Change"
      subtitle="Switch provider for next year"
      active={active}
      daysRemaining={daysRemaining}
      deadlineLabel={deadlineLabel}
    />
  );
}

/**
 * If the difference is > 0 => cheaper => show “-xxx CHF/year” (green)
 * If < 0 => more expensive => show “+xxx CHF/year” (red)
 * If zero => hide
 */
function DowngradePlansBoxes({
  currentPlanRow,
  allPlansForInsurer,
}: {
  currentPlanRow: PlanOption;
  allPlansForInsurer: PlanOption[];
}) {
  const currentInsurer = currentPlanRow.insurer_name || "this insurer";
  const currentCost = parseFloat(currentPlanRow.praemie);

  function planTypeLabel(typ: string) {
    if (typ === "TAR-HAM") return "Family doctor";
    if (typ === "TAR-HMO") return "HMO";
    return "Other plan types";
  }

  const rows: {
    planType: string;
    planName: string;
    monthly: string;
    annualSavings: string;
  }[] = [];

  // current plan
  rows.push({
    planType: TYPE_LABELS[currentPlanRow.tariftyp || "TAR-BASE"] || "Standard",
    planName: currentPlanRow.plan_label || currentPlanRow.tarif || "",
    monthly: formatMonthly(currentCost),
    annualSavings: "Current plan",
  });

  const categories = ["TAR-HAM", "TAR-HMO", "TAR-DIV"] as const;
  const grouped: Record<"TAR-HAM" | "TAR-HMO" | "TAR-DIV", PlanOption[]> = {
    "TAR-HAM": [],
    "TAR-HMO": [],
    "TAR-DIV": [],
  };
  for (const p of allPlansForInsurer) {
    const cat = (p.tariftyp || "TAR-DIV") as "TAR-HAM" | "TAR-HMO" | "TAR-DIV";
    if (categories.includes(cat)) {
      grouped[cat].push(p);
    }
  }
  // sort => cheapest first
  for (const cat of categories) {
    grouped[cat].sort((a, b) => parseFloat(a.praemie) - parseFloat(b.praemie));
  }

  for (const cat of categories) {
    for (const p of grouped[cat]) {
      const cost = parseFloat(p.praemie);
      const diff = (currentCost - cost) * 12;
      const { text, show } = formatCostDiff(diff);
      rows.push({
        planType: planTypeLabel(p.tariftyp || "TAR-DIV"),
        planName: p.plan_label || p.tarif || "",
        monthly: formatMonthly(cost),
        annualSavings: show ? text : "",
      });
    }
  }

  return (
    <div className="bg-white rounded p-3 shadow mb-8">
      <h3 className="text-lg font-bold mb-2">
        {`Other plan models from ${currentInsurer}`}
      </h3>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2 font-bold">Plan type</th>
            <th className="text-left p-2 font-bold">Plan name</th>
            <th className="text-left p-2 font-bold">Monthly premium</th>
            <th className="text-left p-2 font-bold">Annual savings</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            let colorClass = "";
            if (r.annualSavings.startsWith("-")) colorClass = "text-green-600";
            else if (r.annualSavings.startsWith("+")) colorClass = "text-red-600";

            return (
              <tr key={idx} className="border-b">
                <td className="p-2">{r.planType}</td>
                <td className="p-2">{r.planName}</td>
                <td className="p-2">{r.monthly}</td>
                <td className={`p-2 ${colorClass}`}>{r.annualSavings}</td>
                <td className="p-2">
                  <a href="#" className="text-blue-600 underline cursor-pointer">
                    View plan
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function WizardClient() {
  const searchParams = useSearchParams();

  // parse query params
  const queryYob = parseInt(searchParams.get("yob") || "0", 10);
  const queryFranchise = parseInt(searchParams.get("franchise") || "0", 10);
  const queryAccident = searchParams.get("accident") || "";
  const queryPostalId = parseInt(searchParams.get("postalId") || "0", 10);

  const [userInputs, setUserInputs] = useState<UserInputs>({
    yearOfBirth: 0,
    franchise: 0,
    unfalleinschluss: "MIT-UNF",
    canton: "",
    region: "",
    altersklasse: "",
    currentInsurerBagCode: "",
    currentInsurer: "I have no insurer",
    currentPlan: "",
    currentPlanRow: null,
    postalId: 0,
  });

  useEffect(() => {
    const updates: Partial<UserInputs> = {};
    if (queryYob > 0) updates.yearOfBirth = queryYob;
    if (queryFranchise > 0) updates.franchise = queryFranchise;
    if (queryAccident === "MIT-UNF" || queryAccident === "OHN-UNF") {
      updates.unfalleinschluss = queryAccident;
    }
    if (queryPostalId > 0) updates.postalId = queryPostalId;

    if (Object.keys(updates).length > 0) {
      setUserInputs((prev) => ({ ...prev, ...updates }));
    }
  }, [queryYob, queryFranchise, queryAccident, queryPostalId]);

  const handleUserInputsChange = useCallback((vals: Partial<UserInputs>) => {
    setUserInputs((prev) => ({ ...prev, ...vals }));
  }, []);

  const [groupedByType, setGroupedByType] = useState<PlansByType>({
    "TAR-BASE": [],
    "TAR-HAM": [],
    "TAR-HMO": [],
    "TAR-DIV": [],
  });

  useEffect(() => {
    if (!userInputs.canton || !userInputs.region || !userInputs.altersklasse) {
      setGroupedByType({
        "TAR-BASE": [],
        "TAR-HAM": [],
        "TAR-HMO": [],
        "TAR-DIV": [],
      });
      return;
    }
    const isChild = userInputs.altersklasse === "AKL-KIN";
    if (
      (!isChild && userInputs.franchise < 300) ||
      (isChild && userInputs.franchise < 0)
    ) {
      setGroupedByType({
        "TAR-BASE": [],
        "TAR-HAM": [],
        "TAR-HMO": [],
        "TAR-DIV": [],
      });
      return;
    }

    const qs = new URLSearchParams({
      canton: userInputs.canton,
      region: userInputs.region,
      altersklasse: userInputs.altersklasse,
      franchise: String(userInputs.franchise),
      unfalleinschluss: userInputs.unfalleinschluss || "MIT-UNF",
    });
    const url = `/api/premiums?${qs.toString()}`;

    fetch(url)
      .then((r) => r.json())
      .then((data: PlanOption[]) => {
        const newGrouped: PlansByType = {
          "TAR-BASE": [],
          "TAR-HAM": [],
          "TAR-HMO": [],
          "TAR-DIV": [],
        };
        data.forEach((row) => {
          const t = row.tariftyp || "TAR-DIV";
          if (!newGrouped[t]) newGrouped[t] = [];
          newGrouped[t].push(row);
        });
        Object.keys(newGrouped).forEach((t) => {
          newGrouped[t].sort(
            (a, b) => parseFloat(a.praemie) - parseFloat(b.praemie)
          );
        });
        setGroupedByType(newGrouped);
      })
      .catch(() => {
        setGroupedByType({
          "TAR-BASE": [],
          "TAR-HAM": [],
          "TAR-HMO": [],
          "TAR-DIV": [],
        });
      });
  }, [
    userInputs.canton,
    userInputs.region,
    userInputs.altersklasse,
    userInputs.franchise,
    userInputs.unfalleinschluss,
  ]);

  function decideNewBoxesToShow(): React.ReactNode[] {
    const result: React.ReactNode[] = [];
    if (
      userInputs.currentInsurer === "I have no insurer" ||
      !userInputs.currentPlan
    ) {
      return result;
    }

    let planType = "TAR-DIV";
    let foundStandardPlan: PlanOption | null = null;
    if (groupedByType["TAR-BASE"]?.length) {
      foundStandardPlan = groupedByType["TAR-BASE"].find(
        (p) =>
          p.insurer_name === userInputs.currentInsurer &&
          p.tarif === userInputs.currentPlan
      );
      if (foundStandardPlan) {
        planType = "TAR-BASE";
      }
    }
    if (!foundStandardPlan) {
      for (const cat of ["TAR-HAM", "TAR-HMO", "TAR-DIV"] as const) {
        const arr = groupedByType[cat];
        if (arr?.length) {
          const f = arr.find(
            (p) =>
              p.insurer_name === userInputs.currentInsurer &&
              p.tarif === userInputs.currentPlan
          );
          if (f) {
            planType = cat;
            break;
          }
        }
      }
    }

    const isChild = userInputs.altersklasse === "AKL-KIN";
    const isLowestDed =
      (isChild && userInputs.franchise === 0) ||
      (!isChild && userInputs.franchise === 300);

    const now = new Date();
    const month = now.getMonth(); // 0-based

    function getModelBox() {
      const { days, deadlineLabel } = calcDaysAndDeadline("model");
      return (
        <ModelChangeBox
          key="box-model"
          active={true}
          daysRemaining={days}
          deadlineLabel={deadlineLabel}
        />
      );
    }
    function getMidYearBox() {
      const { days, deadlineLabel } = calcDaysAndDeadline("midYear");
      return (
        <MidYearChangeBox
          key="box-midYear"
          active={true}
          daysRemaining={days}
          deadlineLabel={deadlineLabel}
        />
      );
    }
    function getAnnualBox(active: boolean) {
      const { days, deadlineLabel } = calcDaysAndDeadline("annual");
      return (
        <AnnualChangeBox
          key="box-annual"
          active={active}
          daysRemaining={days}
          deadlineLabel={deadlineLabel}
        />
      );
    }

    // 1) If planType= TAR-BASE and not November => show model + table
    if (planType === "TAR-BASE" && month !== 10) {
      result.push(getModelBox());
      if (foundStandardPlan) {
        const sameInsurerPlans: PlanOption[] = [];
        ["TAR-HAM", "TAR-HMO", "TAR-DIV"].forEach((cat) => {
          if (groupedByType[cat]?.length) {
            groupedByType[cat].forEach((p) => {
              if (p.insurer_name === foundStandardPlan!.insurer_name) {
                sameInsurerPlans.push(p);
              }
            });
          }
        });
        result.push(
          <DowngradePlansBoxes
            key="downgrade"
            currentPlanRow={foundStandardPlan}
            allPlansForInsurer={sameInsurerPlans}
          />
        );
      }
    }

    // 2) midYear vs annual
    if (planType === "TAR-BASE" && isLowestDed) {
      // january..march => midYear => else annual
      if (month >= 0 && month <= 2) {
        result.push(getMidYearBox());
        return result;
      } else {
        // annual => if month=10 => active => else locked
        if (month === 10) {
          result.push(getAnnualBox(true));
        } else {
          result.push(getAnnualBox(false));
        }
        return result;
      }
    } else {
      // plan not standard-lower => always annual
      if (month === 10) {
        result.push(getAnnualBox(true));
      } else {
        result.push(getAnnualBox(false));
      }
      return result;
    }
  }

  function buildBoxes() {
    const hasNoData = TYPE_ORDER.every((t) => !groupedByType[t].length);
    if (hasNoData) {
      return TYPE_ORDER.map((typ) => ({
        headerLine1: "Cheapest option",
        headerLine2: TYPE_LABELS[typ],
        headerColor: "#007BFF",
        planType: TYPE_LABELS[typ],
        insurer: "(no data)",
        planName: "",
        monthly: "",
        costDiffText: "",
        costDiffClass: "",
      }));
    }
    if (!userInputs.currentPlan) {
      return TYPE_ORDER.map((typ) => {
        const arr = groupedByType[typ];
        if (!arr?.length) {
          return {
            headerLine1: "Cheapest option",
            headerLine2: TYPE_LABELS[typ],
            headerColor: "#007BFF",
            planType: TYPE_LABELS[typ],
            insurer: "(no data)",
            planName: "",
            monthly: "",
            costDiffText: "",
            costDiffClass: "",
          };
        }
        const row = arr[0];
        const cost = parseFloat(row.praemie);
        return {
          headerLine1: "Cheapest option",
          headerLine2: TYPE_LABELS[typ],
          headerColor: "#007BFF",
          planType: TYPE_LABELS[typ],
          insurer: row.insurer_name || "(??)",
          planName: row.plan_label || row.tarif || "",
          monthly: formatMonthly(cost),
          costDiffText: "",
          costDiffClass: "",
        };
      });
    }

    let currentRow: PlanOption | null = null;
    let currentTyp = "TAR-DIV";
    for (const typ of TYPE_ORDER) {
      const arr = groupedByType[typ];
      if (arr && arr.length) {
        const found = arr.find(
          (p) =>
            p.insurer_name === userInputs.currentInsurer &&
            p.tarif === userInputs.currentPlan
        );
        if (found) {
          currentRow = found;
          currentTyp = typ;
          break;
        }
      }
    }
    if (!currentRow) {
      return TYPE_ORDER.map((typ, idx) => ({
        headerLine1: idx === 0 ? "Current plan" : "Cheapest option",
        headerLine2: TYPE_LABELS[typ],
        headerColor: idx === 0 ? "#666" : "#007BFF",
        planType: TYPE_LABELS[typ],
        insurer: "(no data)",
        planName: "",
        monthly: "",
        costDiffText: "",
        costDiffClass: "",
      }));
    }

    const cm = parseFloat(currentRow.praemie);
    const box1 = {
      headerLine1: "Current plan",
      headerLine2: TYPE_LABELS[currentTyp],
      headerColor: "#666",
      planType: TYPE_LABELS[currentTyp],
      insurer: currentRow.insurer_name || "(??)",
      planName: currentRow.plan_label || currentRow.tarif || "",
      monthly: formatMonthly(cm),
      costDiffText: "",
      costDiffClass: "",
    };

    const arrSame = groupedByType[currentTyp] || [];
    const cheapestSame = arrSame.find(
      (p) =>
        !(
          p.insurer_name === userInputs.currentInsurer &&
          p.tarif === userInputs.currentPlan
        )
    );
    let box2;
    if (!cheapestSame) {
      box2 = {
        headerLine1: "Cheapest option",
        headerLine2: TYPE_LABELS[currentTyp],
        headerColor: "#007BFF",
        planType: TYPE_LABELS[currentTyp],
        insurer: "(no data)",
        planName: "",
        monthly: "",
        costDiffText: "",
        costDiffClass: "",
      };
    } else {
      const c2m = parseFloat(cheapestSame.praemie);
      const diff2 = (cm - c2m) * 12;
      const { text: t2, show: s2 } = formatCostDiff(diff2);

      box2 = {
        headerLine1: "Cheapest option",
        headerLine2: TYPE_LABELS[currentTyp],
        headerColor: "#007BFF",
        planType: TYPE_LABELS[currentTyp],
        insurer: cheapestSame.insurer_name || "(??)",
        planName: cheapestSame.plan_label || cheapestSame.tarif || "",
        monthly: formatMonthly(c2m),
        costDiffText: s2 ? t2 : "",
        costDiffClass: "",
      };
    }

    const otherTypes = TYPE_ORDER.filter((t) => t !== currentTyp);
    const arrOthers: { row: PlanOption; cost: number }[] = [];
    for (const ot of otherTypes) {
      const arr2 = groupedByType[ot];
      if (arr2?.length) {
        arrOthers.push({ row: arr2[0], cost: parseFloat(arr2[0].praemie) });
      }
    }
    arrOthers.sort((a, b) => a.cost - b.cost);

    let box3, box4;
    if (!arrOthers.length) {
      box3 = {
        headerLine1: "Cheapest option",
        headerLine2: "",
        headerColor: "#007BFF",
        planType: "",
        insurer: "",
        planName: "",
        monthly: "",
        costDiffText: "",
        costDiffClass: "",
      };
      box4 = { ...box3 };
    } else if (arrOthers.length === 1) {
      const first = arrOthers[0];
      const diff3 = (cm - first.cost) * 12;
      const { text: t3, show: s3 } = formatCostDiff(diff3);

      box3 = {
        headerLine1: "Cheapest option",
        headerLine2: TYPE_LABELS[getPlanType(first.row)],
        headerColor: "#007BFF",
        planType: TYPE_LABELS[getPlanType(first.row)],
        insurer: first.row.insurer_name || "(??)",
        planName: first.row.plan_label || first.row.tarif || "",
        monthly: formatMonthly(first.cost),
        costDiffText: s3 ? t3 : "",
        costDiffClass: "",
      };
      box4 = {
        headerLine1: "Cheapest option",
        headerLine2: "",
        headerColor: "#007BFF",
        planType: "",
        insurer: "",
        planName: "",
        monthly: "",
        costDiffText: "",
        costDiffClass: "",
      };
    } else {
      const first = arrOthers[0];
      const second = arrOthers[1];
      const diff3 = (cm - first.cost) * 12;
      const { text: t3, show: s3 } = formatCostDiff(diff3);

      const diff4 = (cm - second.cost) * 12;
      const { text: t4, show: s4 } = formatCostDiff(diff4);

      box3 = {
        headerLine1: "Cheapest option",
        headerLine2: TYPE_LABELS[getPlanType(first.row)],
        headerColor: "#007BFF",
        planType: TYPE_LABELS[getPlanType(first.row)],
        insurer: first.row.insurer_name || "(??)",
        planName: first.row.plan_label || first.row.tarif || "",
        monthly: formatMonthly(first.cost),
        costDiffText: s3 ? t3 : "",
        costDiffClass: "",
      };
      box4 = {
        headerLine1: "Cheapest option",
        headerLine2: TYPE_LABELS[getPlanType(second.row)],
        headerColor: "#007BFF",
        planType: TYPE_LABELS[getPlanType(second.row)],
        insurer: second.row.insurer_name || "(??)",
        planName: second.row.plan_label || second.row.tarif || "",
        monthly: formatMonthly(second.cost),
        costDiffText: s4 ? t4 : "",
        costDiffClass: "",
      };
    }

    return [box1, box2, box3, box4];
  }

  const newBoxes = decideNewBoxesToShow();
  const topBoxes = buildBoxes();

  return (
    <div className="flex flex-col min-h-screen">
      {/* top nav */}
      <div className="bg-white h-12 flex-shrink-0 flex items-center">
        <div
          onClick={() => {
            window.location.href = "/";
          }}
          className="ml-4 cursor-pointer font-bold text-lg"
        >
          Eclipsai
        </div>
      </div>

      <div className="bg-gray-200 flex-grow py-8">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row gap-4 px-1">
          {/* Left => InputPanel */}
          <div className="w-full md:w-1/4 min-w-[280px]">
            <InputPanel
              userInputs={userInputs}
              onUserInputsChange={handleUserInputsChange}
            />
          </div>

          {/* Right => newBoxes + 4 top boxes => PlanOptionsPanel */}
          <div className="flex-1">
            {/* 1) The 3 monthly logic boxes */}
            {newBoxes}

            {/* 2) The four comparison boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {topBoxes.map((box, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-[6px] overflow-hidden flex flex-col h-full"
                >
                  <div
                    style={{ background: box.headerColor }}
                    className="text-white p-2 font-bold text-lg text-center leading-[1.3]"
                  >
                    <div>{box.headerLine1}</div>
                    <div>{box.headerLine2}</div>
                  </div>

                  <div className="p-3 flex-1 flex flex-col">
                    <div className="text-base mb-1">{box.planType}</div>
                    <div className="text-lg font-bold mb-1 text-blue-600">
                      {box.insurer}
                    </div>
                    <div className="text-sm mb-2">{box.planName}</div>

                    <div className="text-lg text-blue-600 mb-1">
                      {box.monthly}
                    </div>
                    {box.costDiffText && (
                      <div className="text-xl font-semibold mb-2">
                        {box.costDiffText}
                      </div>
                    )}

                    <div className="flex-grow" />
                    <div>
                      <a
                        href="#"
                        className="text-blue-600 underline cursor-pointer text-base"
                      >
                        View plan
                      </a>
                      <div className="mt-2 text-sm flex items-center justify-between">
                        <span>Compare</span>
                        <input type="checkbox" className="ml-4 scale-125" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 3) The final PlanOptionsPanel */}
            <PlanOptionsPanel userInputs={userInputs} />
          </div>
        </div>
      </div>
    </div>
  );
}
