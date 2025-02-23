// File: app/wizard/WizardClient.tsx

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
 * Show ± sign for cost difference:
 * - cheaper => “-xxx CHF/year” in green
 * - more expensive => “+xxx CHF/year” in red
 * - zero => hide
 */
function formatCostDiff(diff: number) {
  const absVal = Math.abs(Math.round(diff));
  if (absVal === 0) return { text: "", colorClass: "", show: false };

  const sign = diff > 0 ? "-" : "+";
  const colorClass = diff > 0 ? "text-green-600" : "text-red-600";
  const text = `${sign}${absVal} CHF/year`;
  return { text, colorClass, show: true };
}

/** Return the plan type or fallback to 'TAR-DIV'. */
function getPlanType(row: PlanOption): string {
  return row.tariftyp || "TAR-DIV";
}

/** Helper: last working day before a certain date. */
function lastWorkingDayBefore(year: number, monthIndex: number, day: number) {
  const d = new Date(year, monthIndex, day);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

/** calcDaysRemaining for model, midYear, or annual. */
function calcDaysRemaining(type: "model" | "midYear" | "annual") {
  const today = new Date();
  let target: Date;
  let deadlineLabel = "";

  if (type === "model") {
    // last working day of this month
    const y = today.getFullYear();
    const m = today.getMonth();
    const lastDay = new Date(y, m + 1, 0).getDate();
    target = lastWorkingDayBefore(y, m, lastDay);
    deadlineLabel = `Days until ${target.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
    })}`;
  } else if (type === "midYear") {
    // last working day before March 31
    const y = today.getFullYear();
    const candidate = lastWorkingDayBefore(y, 2, 31);
    if (candidate < today) {
      target = lastWorkingDayBefore(y + 1, 2, 31);
    } else {
      target = candidate;
    }
    deadlineLabel = `Days until ${target.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
    })}`;
  } else {
    // annual => last working day before Nov 30
    const y = today.getFullYear();
    const candidate = lastWorkingDayBefore(y, 10, 30);
    if (candidate < today) {
      target = lastWorkingDayBefore(y + 1, 10, 30);
    } else {
      target = candidate;
    }
    deadlineLabel = `Days until ${target.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
    })}`;
  }

  const diffMs = target.getTime() - today.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return { daysRemaining: days, deadlineLabel };
}

/** If days < 5 => show urgent. */
function UrgentWarning() {
  return (
    <div className="bg-red-100 text-red-700 p-2 rounded mt-2 text-sm">
      <strong>Urgent:</strong> Less than 5 days remaining. Consider express mail or calling the insurance company.
    </div>
  );
}

/** The 3 new box components. */
function ModelChangeBox() {
  const { daysRemaining, deadlineLabel } = calcDaysRemaining("model");

  return (
    <div className="bg-white rounded p-3 shadow flex flex-col md:flex-row gap-2 items-start mb-3">
      <div className="flex-grow">
        <div className="text-lg font-bold text-purple-700">
          Insurance Model Change
        </div>
        {/* updated text per request */}
        <div className="text-gray-600 text-sm mb-2">
          Switch to family doctor, HMO or telemedicine (same insurer)
        </div>
      </div>
      <div className="text-right">
        <div
          className={`text-4xl font-bold ${
            daysRemaining <= 5 ? "text-red-600" : "text-purple-600"
          }`}
        >
          {daysRemaining}
        </div>
        <div className="text-sm text-gray-600">{deadlineLabel}</div>
        {daysRemaining <= 5 && <UrgentWarning />}
      </div>
    </div>
  );
}

function MidYearChangeBox() {
  const { daysRemaining, deadlineLabel } = calcDaysRemaining("midYear");

  return (
    <div className="bg-white rounded p-3 shadow flex flex-col md:flex-row gap-2 items-start mb-3">
      <div className="flex-grow">
        <div className="text-lg font-bold text-green-700">Mid-Year Change</div>
        <div className="text-gray-600 text-sm mb-2">
          Switch provider with new policy starting July 1
        </div>
      </div>
      <div className="text-right">
        <div
          className={`text-4xl font-bold ${
            daysRemaining <= 5 ? "text-red-600" : "text-green-600"
          }`}
        >
          {daysRemaining}
        </div>
        <div className="text-sm text-gray-600">{deadlineLabel}</div>
        {daysRemaining <= 5 && <UrgentWarning />}
      </div>
    </div>
  );
}

function AnnualChangeBox() {
  const { daysRemaining, deadlineLabel } = calcDaysRemaining("annual");

  return (
    <div className="bg-white rounded p-3 shadow flex flex-col md:flex-row gap-2 items-start mb-3">
      <div className="flex-grow">
        <div className="text-lg font-bold text-blue-700">Annual Change</div>
        <div className="text-gray-600 text-sm mb-2">
          Switch provider for next year <br />
          <span className="text-xs text-gray-500">
            (Current prices are for reference; new rates by Oct 1)
          </span>
        </div>
      </div>
      <div className="text-right">
        <div
          className={`text-4xl font-bold ${
            daysRemaining <= 5 ? "text-red-600" : "text-blue-600"
          }`}
        >
          {daysRemaining}
        </div>
        <div className="text-sm text-gray-600">{deadlineLabel}</div>
        {daysRemaining <= 5 && <UrgentWarning />}
      </div>
    </div>
  );
}

/** 
 * "Downgrade" plan boxes => 
 * 1) First is current plan => grey header
 * 2) Then each “family doctor (TAR-HAM)”, “HMO (TAR-HMO)”,
 *    “Other plan types (TAR-DIV)” in that order, sorted by monthly cost ascending
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

  // Prepare a function to label plan types: "Family doctor", "HMO", "Other plan types"
  function planTypeLabel(t: string) {
    if (t === "TAR-HAM") return "Family doctor";
    if (t === "TAR-HMO") return "HMO";
    return "Other plan types";
  }

  // 1) The first box => current plan => grey header
  // No savings
  const firstBox = {
    planType: "Current plan",
    planTypeClass: "bg-gray-400 text-white",
    label: currentPlanRow.plan_label || currentPlanRow.tarif || "",
    monthly: `${Math.round(currentCost)} CHF/month`,
    diffText: "",
    diffClass: "",
  };

  // 2) Gather the insurer's other plan rows => TAR-HAM, TAR-HMO, TAR-DIV
  const grouped = {
    "TAR-HAM": [] as PlanOption[],
    "TAR-HMO": [] as PlanOption[],
    "TAR-DIV": [] as PlanOption[],
  };
  for (const p of allPlansForInsurer) {
    const typ = p.tariftyp || "TAR-DIV";
    if (["TAR-HAM", "TAR-HMO", "TAR-DIV"].includes(typ)) {
      grouped[typ as "TAR-HAM" | "TAR-HMO" | "TAR-DIV"].push(p);
    }
  }

  // sort each group by monthly premium ascending
  for (const cat of ["TAR-HAM", "TAR-HMO", "TAR-DIV"] as const) {
    grouped[cat].sort(
      (a, b) => parseFloat(a.praemie) - parseFloat(b.praemie)
    );
  }

  // We'll place them in [TAR-HAM, TAR-HMO, TAR-DIV] order
  const sortedPlanBoxes: {
    planType: string; // "Family doctor" / "HMO" / "Other plan types"
    planTypeClass: string; // for the header color
    label: string;
    monthly: string;
    diffText: string;
    diffClass: string;
  }[] = [];

  function createBoxRow(p: PlanOption) {
    const cost = parseFloat(p.praemie);
    const diff = (currentCost - cost) * 12;
    const { text, colorClass, show } = formatCostDiff(diff);
    return {
      planType: planTypeLabel(p.tariftyp || "TAR-DIV"),
      planTypeClass: "bg-blue-600 text-white", // or different color if wanted
      label: p.plan_label || p.tarif || "",
      monthly: `${Math.round(cost)} CHF/month`,
      diffText: show ? text : "",
      diffClass: colorClass,
    };
  }

  for (const cat of ["TAR-HAM", "TAR-HMO", "TAR-DIV"] as const) {
    grouped[cat].forEach((p) => {
      sortedPlanBoxes.push(createBoxRow(p));
    });
  }

  // final array => first box (current plan), then these
  const finalBoxes = [firstBox, ...sortedPlanBoxes];

  // We'll show them in a 4-col grid
  return (
    <div className="mb-3">
      <div className="text-base font-semibold mb-2">
        {`Other plan models from ${currentInsurer}:`}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {finalBoxes.map((bx, idx) => (
          <div
            key={idx}
            className="bg-white rounded shadow flex flex-col h-full"
          >
            {/* The header row => color depends on planTypeClass */}
            <div className={`p-2 font-bold ${bx.planTypeClass}`}>
              {bx.planType}
            </div>
            <div className="p-2 flex-1 flex flex-col">
              <div className="text-sm font-bold mb-1">{bx.label}</div>
              <div className="text-sm text-blue-600 mb-1">{bx.monthly}</div>
              {bx.diffText && (
                <div className={`text-sm font-semibold ${bx.diffClass} mb-2`}>
                  {bx.diffText}
                </div>
              )}
              <div className="mt-auto" />
              <button className="bg-blue-600 text-white rounded px-2 py-1 text-sm">
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   The main WizardClient
------------------------------------------------------------------ */
export default function WizardClient() {
  const searchParams = useSearchParams();

  // parse query params
  const queryYob = parseInt(searchParams.get("yob") || "0", 10);
  const queryFranchise = parseInt(searchParams.get("franchise") || "0", 10);
  const queryAccident = searchParams.get("accident") || "";
  const queryPostalId = parseInt(searchParams.get("postalId") || "0", 10);

  // Single source of truth for user inputs
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

  // Build the 4 top boxes
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
        if (!arr || !arr.length) {
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

    // cheapest in same type => box2
    const arrSame = groupedByType[currentTyp] || [];
    const cheapestSame = arrSame.find(
      (p) =>
        !(p.insurer_name === userInputs.currentInsurer && p.tarif === userInputs.currentPlan)
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
      const d2 = formatCostDiff(diff2);
      box2 = {
        headerLine1: "Cheapest option",
        headerLine2: TYPE_LABELS[currentTyp],
        headerColor: "#007BFF",
        planType: TYPE_LABELS[currentTyp],
        insurer: cheapestSame.insurer_name || "(??)",
        planName: cheapestSame.plan_label || cheapestSame.tarif || "",
        monthly: formatMonthly(c2m),
        costDiffText: d2.show ? d2.text : "",
        costDiffClass: d2.colorClass,
      };
    }

    // box3, box4 => cheapest from other categories
    const otherTypes = TYPE_ORDER.filter((t) => t !== currentTyp);
    const arrOthers: { row: PlanOption; cost: number }[] = [];
    for (const ot of otherTypes) {
      const arr2 = groupedByType[ot];
      if (arr2 && arr2.length) {
        arrOthers.push({ row: arr2[0], cost: parseFloat(arr2[0].praemie) });
      }
    }
    arrOthers.sort((a, b) => a.cost - b.cost);

    let box3, box4;
    if (arrOthers.length === 0) {
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
      const d3 = formatCostDiff(diff3);
      box3 = {
        headerLine1: "Cheapest option",
        headerLine2: TYPE_LABELS[getPlanType(first.row)],
        headerColor: "#007BFF",
        planType: TYPE_LABELS[getPlanType(first.row)],
        insurer: first.row.insurer_name || "(??)",
        planName: first.row.plan_label || first.row.tarif || "",
        monthly: formatMonthly(first.cost),
        costDiffText: d3.show ? d3.text : "",
        costDiffClass: d3.colorClass,
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
      const diff4 = (cm - second.cost) * 12;
      const d3 = formatCostDiff(diff3);
      const d4 = formatCostDiff(diff4);

      box3 = {
        headerLine1: "Cheapest option",
        headerLine2: TYPE_LABELS[getPlanType(first.row)],
        headerColor: "#007BFF",
        planType: TYPE_LABELS[getPlanType(first.row)],
        insurer: first.row.insurer_name || "(??)",
        planName: first.row.plan_label || first.row.tarif || "",
        monthly: formatMonthly(first.cost),
        costDiffText: d3.show ? d3.text : "",
        costDiffClass: d3.colorClass,
      };
      box4 = {
        headerLine1: "Cheapest option",
        headerLine2: TYPE_LABELS[getPlanType(second.row)],
        headerColor: "#007BFF",
        planType: TYPE_LABELS[getPlanType(second.row)],
        insurer: second.row.insurer_name || "(??)",
        planName: second.row.plan_label || second.row.tarif || "",
        monthly: formatMonthly(second.cost),
        costDiffText: d4.show ? d4.text : "",
        costDiffClass: d4.colorClass,
      };
    }

    return [box1, box2, box3, box4];
  }

  /** Decide which boxes to show => model, midYear, annual + optional "downgrade" plans. */
  function decideNewBoxesToShow(): React.ReactNode[] {
    const result: React.ReactNode[] = [];
    if (
      userInputs.currentInsurer !== "I have no insurer" &&
      userInputs.currentPlan
    ) {
      const isChild = userInputs.altersklasse === "AKL-KIN";
      const isLowestDed =
        (isChild && userInputs.franchise === 0) ||
        (!isChild && userInputs.franchise === 300);

      // figure out if plan is TAR-BASE
      let currentPlanRow: PlanOption | null = null;
      let planType = "TAR-DIV";

      if (groupedByType["TAR-BASE"]?.length) {
        const f = groupedByType["TAR-BASE"].find(
          (p) =>
            p.insurer_name === userInputs.currentInsurer &&
            p.tarif === userInputs.currentPlan
        );
        if (f) {
          currentPlanRow = f;
          planType = "TAR-BASE";
        }
      }
      // if still not found => check other
      if (!currentPlanRow) {
        for (const cat of ["TAR-HAM", "TAR-HMO", "TAR-DIV"] as const) {
          const arr = groupedByType[cat];
          if (arr?.length) {
            const found = arr.find(
              (p) =>
                p.insurer_name === userInputs.currentInsurer &&
                p.tarif === userInputs.currentPlan
            );
            if (found) {
              currentPlanRow = found;
              planType = cat;
              break;
            }
          }
        }
      }

      if (planType === "TAR-BASE") {
        // standard => show ModelChangeBox
        result.push(<ModelChangeBox key="box-model" />);

        // gather same-insurer => hamper/hmo/div => show as "downgrade"
        if (currentPlanRow) {
          const sameInsurerPlans: PlanOption[] = [];
          ["TAR-HAM", "TAR-HMO", "TAR-DIV"].forEach((cat) => {
            if (groupedByType[cat]?.length) {
              groupedByType[cat].forEach((p) => {
                if (p.insurer_name === currentPlanRow?.insurer_name) {
                  sameInsurerPlans.push(p);
                }
              });
            }
          });
          result.push(
            <DowngradePlansBoxes
              key="downgrade"
              currentPlanRow={currentPlanRow}
              allPlansForInsurer={sameInsurerPlans}
            />
          );
        }
        // if lowest => midYear, else annual
        if (isLowestDed) {
          result.push(<MidYearChangeBox key="box-midYear" />);
        } else {
          result.push(<AnnualChangeBox key="box-annual" />);
        }
      } else {
        // any other => annual only
        result.push(<AnnualChangeBox key="box-annual" />);
      }
    }
    return result;
  }

  const topBoxes = buildBoxes();
  const newBoxes = decideNewBoxesToShow();

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

      <div className="bg-gray-100 flex-grow py-4">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row gap-2 px-2">
          {/* Left => InputPanel */}
          <div className="w-full md:w-1/4 min-w-[280px]">
            <InputPanel
              userInputs={userInputs}
              onUserInputsChange={handleUserInputsChange}
            />
          </div>

          {/* Right => new boxes + 4 top boxes + PlanOptionsPanel */}
          <div className="flex-1">
            {/* 1) The new boxes (model, midYear, annual, plus optional "downgrade" boxes) */}
            {newBoxes}

            {/* 2) The 4 comparison boxes => unchanged logic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
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
                      <div
                        className={`text-xl font-semibold ${box.costDiffClass} mb-2`}
                      >
                        {box.costDiffText}
                      </div>
                    )}

                    <div className="flex-grow" />
                    <div>
                      <button className="px-4 py-2 rounded bg-blue-600 text-white cursor-pointer text-base whitespace-nowrap">
                        View plan
                      </button>

                      <div className="mt-2 text-sm flex items-center justify-between">
                        <span>Compare</span>
                        <input type="checkbox" className="ml-4 scale-125" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* PlanOptionsPanel => read-only table of plan options */}
            <PlanOptionsPanel userInputs={userInputs} />
          </div>
        </div>
      </div>
    </div>
  );
}
