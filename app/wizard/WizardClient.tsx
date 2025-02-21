"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import InputPanel, { UserInputs } from "./InputPanel";
import PlanOptionsPanel from "./PlanOptionsPanel";

/** A single plan row from /api/premiums. */
interface PlanOption {
  id: number;
  tarif: string;
  tariftyp: string;
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
  "TAR-DIV": "Other plan types", // updated label
};

/** Convert a number to e.g. “120 CHF/month” (rounded). */
function formatMonthly(val: number): string {
  return `${Math.round(val)} CHF/month`;
}

/**
 * We show a ± sign for cost difference:
 *  - If cheaper => “-xxx CHF/year” in green
 *  - If more expensive => “+xxx CHF/year” in red
 *  - If zero => hide
 */
function formatCostDiff(diff: number) {
  const absVal = Math.abs(Math.round(diff));
  if (absVal === 0) {
    return { text: "", colorClass: "", show: false };
  }
  // diff>0 => cheaper => minus sign (green)
  // diff<0 => more expensive => plus sign (red)
  const sign = diff > 0 ? "-" : "+";
  const colorClass = diff > 0 ? "text-green-600" : "text-red-600";
  const text = `${sign}${absVal} CHF/year`;
  return { text, colorClass, show: true };
}

/** Return the plan type from row, fallback 'TAR-DIV' if missing. */
function getPlanType(row: PlanOption): string {
  return row.tariftyp || "TAR-DIV";
}

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

  // read from query on mount
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

  // Child calls this => we update userInputs if changed
  const handleUserInputsChange = useCallback((newVals: Partial<UserInputs>) => {
    setUserInputs((prev) => {
      return { ...prev, ...newVals };
    });
  }, []);

  // =========== Premium Data / 4 Boxes logic ===========
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
    // if franchise is too small, skip
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
        // sort by praemie
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

  /** Build top 4 boxes with cost difference. */
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

    // If no currentPlan => show cheapest
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

    // else => user has a current plan
    let currentRow: PlanOption | null = null;
    let currentTyp = "TAR-DIV";
    for (const typ of TYPE_ORDER) {
      const arr = groupedByType[typ];
      if (!arr || !arr.length) continue;
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
    if (!currentRow) {
      // fallback => show “Current plan” in box1 but no data
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

    // #1 => current plan => no difference displayed
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

    // #2 => cheapest in same type
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
      // positive => c2m is cheaper => “-xxx CHF/year”
      const diff2 = (cm - c2m) * 12;
      const { text: diffText, colorClass, show } = formatCostDiff(diff2);
      box2 = {
        headerLine1: "Cheapest option",
        headerLine2: TYPE_LABELS[currentTyp],
        headerColor: "#007BFF",
        planType: TYPE_LABELS[currentTyp],
        insurer: cheapestSame.insurer_name || "(??)",
        planName: cheapestSame.plan_label || cheapestSame.tarif || "",
        monthly: formatMonthly(c2m),
        costDiffText: show ? diffText : "",
        costDiffClass: colorClass,
      };
    }

    // #3 & #4 => cheapest from other categories
    const otherTypes = TYPE_ORDER.filter((t) => t !== currentTyp);
    const arrOthers: { row: PlanOption; cost: number }[] = [];
    for (const ot of otherTypes) {
      const arr2 = groupedByType[ot] || [];
      if (arr2.length > 0) {
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

      <div className="bg-slate-300 flex-grow py-4">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row gap-2 px-2">
          {/* Left => InputPanel */}
          <div className="w-full md:w-1/4 min-w-[280px]">
            <InputPanel
              userInputs={userInputs}
              onUserInputsChange={handleUserInputsChange}
            />
          </div>

          {/* Right => top boxes => PlanOptionsPanel */}
          <div className="flex-1">
            {/* 4 top boxes => updated styling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
              {topBoxes.map((box, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-[6px] overflow-hidden flex flex-col h-full"
                >
                  {/* Header => same size as insurer (text-lg) */}
                  <div
                    style={{ background: box.headerColor }}
                    className="text-white p-2 font-bold text-lg text-center leading-[1.3]"
                  >
                    <div>{box.headerLine1}</div>
                    <div>{box.headerLine2}</div>
                  </div>

                  {/* Content => grow to align bottoms */}
                  <div className="p-3 flex-1 flex flex-col">
                    {/* Plan type => normal text */}
                    <div className="text-base mb-1">{box.planType}</div>
                    {/* Insurer name => text-lg, blue */}
                    <div className="text-lg font-bold mb-1 text-blue-600">
                      {box.insurer}
                    </div>
                    <div className="text-sm mb-2">{box.planName}</div>

                    {/* Premium => same size as insurer name, also blue */}
                    <div className="text-lg text-blue-600 mb-1">
                      {box.monthly}
                    </div>

                    {/* One tick smaller => text-xl */}
                    {box.costDiffText && (
                      <div
                        className={`text-xl font-semibold ${box.costDiffClass} mb-2`}
                      >
                        {box.costDiffText}
                      </div>
                    )}

                    {/* Spacer => push button down */}
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
