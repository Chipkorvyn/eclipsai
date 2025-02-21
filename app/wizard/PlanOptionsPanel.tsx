// File: app/wizard/PlanOptionsPanel.tsx

"use client";

import React, { useEffect, useState } from "react";

/** 
 * Define an interface for each premium row from /api/premiums 
 * after we map them to include monthlyPremium, etc.
 */
interface PremiumRow {
  id: number;
  tariftyp: string;       // e.g. "TAR-BASE" | "TAR-HAM" | "TAR-HMO" | "TAR-DIV"
  insurer_name: string;
  praemie: string;        // original string from DB
  tarif: string;
  plan_label: string;     // user-friendly label
  monthlyPremium: number; // numeric version of praemie
}

/** 
 * The props your PlanOptionsPanel needs:
 *   - userInputs with fields for location, bracket, currentPlan, etc.
 *   - userInputs is typed loosely here since you have a broader wizard usage,
 *     but define what's needed at minimum.
 */
interface PlanOptionsPanelProps {
  userInputs: {
    altersklasse: string;
    canton: string;
    region: string;
    franchise: number;
    unfalleinschluss: string;
    currentInsurer: string;
    currentPlan: string;
  };
}

/**
 * If the difference is > 0 => cheaper => show “-xxx CHF/year” (green)
 * If < 0 => more expensive => show “+xxx CHF/year” (red)
 * If zero => hide
 */
function formatCostDiff(diff: number) {
  const absVal = Math.abs(Math.round(diff));
  if (absVal === 0) return { text: "", colorClass: "", show: false };

  // diff>0 => cheaper => minus sign => green
  // diff<0 => more expensive => plus sign => red
  const sign = diff > 0 ? "-" : "+";
  const colorClass = diff > 0 ? "text-green-600" : "text-red-600";
  const text = `${sign}${absVal} CHF/year`;
  return { text, colorClass, show: true };
}

function getPlanTypeLabel(typ: string) {
  switch (typ) {
    case "TAR-BASE":
      return "Standard";
    case "TAR-HAM":
      return "Family doctor";
    case "TAR-HMO":
      return "HMO";
    default:
      // i.e. "TAR-DIV"
      return "Other plan types";
  }
}

function getPlanTypeDescription(typ: string) {
  switch (typ) {
    case "TAR-BASE":
      return "A simple mandatory coverage with free doctor choice.";
    case "TAR-HAM":
      return "Requires you to see your family doctor first.";
    case "TAR-HMO":
      return "Coordinates care via an HMO network.";
    default:
      return "Alternative coverage beyond standard, family, or HMO.";
  }
}

export default function PlanOptionsPanel({ userInputs }: PlanOptionsPanelProps) {
  const [planList, setPlanList] = useState<PremiumRow[]>([]);
  const [currentMonthly, setCurrentMonthly] = useState<number | null>(null);

  // For the expand/collapse toggles on each plan type
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "TAR-BASE": false,
    "TAR-HAM": false,
    "TAR-HMO": false,
    "TAR-DIV": false,
  });

  const isChild = (userInputs.altersklasse === "AKL-KIN");
  const hasMandatory = Boolean(
    userInputs.altersklasse &&
    userInputs.canton &&
    userInputs.region &&
    (isChild ? userInputs.franchise >= 0 : userInputs.franchise >= 300)
  );

  useEffect(() => {
    if (!hasMandatory) {
      setPlanList([]);
      setCurrentMonthly(null);
      return;
    }

    const qs = new URLSearchParams({
      altersklasse: userInputs.altersklasse,
      canton: userInputs.canton,
      region: userInputs.region,
      franchise: String(userInputs.franchise),
      unfalleinschluss: userInputs.unfalleinschluss || "MIT-UNF",
    });
    const url = `/api/premiums?${qs.toString()}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: any[]) => {
        // data from /api/premiums is an array of DB rows
        // We map each to a PremiumRow
        const mapped: PremiumRow[] = data.map((row) => ({
          id: row.id,
          tariftyp: row.tariftyp || "TAR-DIV",
          insurer_name: row.insurer_name || "",
          praemie: row.praemie || "0",
          tarif: row.tarif,
          plan_label:
            row.plan_label || row.tarifbezeichnung || row.tarif || "??",
          monthlyPremium: parseFloat(row.praemie || "0"),
        }));

        mapped.sort((a, b) => a.monthlyPremium - b.monthlyPremium);

        // If user has a recognized plan => store monthly cost
        let foundCurrent: PremiumRow | undefined = undefined;
        if (
          userInputs.currentInsurer !== "I have no insurer" &&
          userInputs.currentPlan
        ) {
          foundCurrent = mapped.find(
            (p) =>
              p.insurer_name === userInputs.currentInsurer &&
              p.tarif === userInputs.currentPlan
          );
        }
        setPlanList(mapped);
        setCurrentMonthly(foundCurrent ? foundCurrent.monthlyPremium : null);
      })
      .catch(() => {
        setPlanList([]);
        setCurrentMonthly(null);
      });
  }, [
    hasMandatory,
    userInputs.altersklasse,
    userInputs.canton,
    userInputs.region,
    userInputs.franchise,
    userInputs.unfalleinschluss,
    userInputs.currentInsurer,
    userInputs.currentPlan,
  ]);

  if (!hasMandatory) {
    return <p>Please pick location, bracket, and a valid franchise.</p>;
  }
  if (planList.length === 0) {
    return <p>No plans found for these filters.</p>;
  }

  // If we recognized a current plan => show difference
  const showDifference = (currentMonthly !== null);

  // Separate by type
  const standardArr = planList.filter((p) => p.tariftyp === "TAR-BASE");
  const familyArr   = planList.filter((p) => p.tariftyp === "TAR-HAM");
  const hmoArr      = planList.filter((p) => p.tariftyp === "TAR-HMO");
  const otherArr    = planList.filter((p) => p.tariftyp === "TAR-DIV");

  function handleExpand(typ: string) {
    setExpanded((prev) => ({ ...prev, [typ]: true }));
  }
  function handleCollapse(typ: string) {
    setExpanded((prev) => ({ ...prev, [typ]: false }));
  }

  return (
    <div>
      {renderTypeBlock("TAR-BASE", standardArr)}
      {renderTypeBlock("TAR-HAM",  familyArr)}
      {renderTypeBlock("TAR-HMO",  hmoArr)}
      {renderTypeBlock("TAR-DIV",  otherArr)}
    </div>
  );

  function renderTypeBlock(typ: string, subList: PremiumRow[]) {
    if (!subList.length) return null;

    const label = getPlanTypeLabel(typ);

    return (
      <div className="bg-white rounded-lg mb-4 overflow-hidden">
        {/* Header => same size as the box header => text-lg font-bold */}
        <div className="bg-blue-600 text-white px-3 py-2 font-bold text-lg">
          {label}
        </div>
        {/* Description */}
        <div className="px-3 py-2 italic text-sm">
          {getPlanTypeDescription(typ)}
        </div>
        {/* Table container */}
        <div className="px-3 pb-3">
          {renderPlanTable(typ, subList)}
        </div>
      </div>
    );
  }

  function renderPlanTable(typ: string, subList: PremiumRow[]) {
    const isExpanded = expanded[typ];
    const displayedRows = isExpanded ? subList : subList.slice(0, 5);

    return (
      <>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              {/* Table header => text-lg font-bold */}
              <th className="text-left p-2 text-lg font-bold">Insurer</th>
              <th className="text-left p-2 text-lg font-bold">Plan</th>
              <th className="text-left p-2 text-lg font-bold">Monthly Premium</th>
              {showDifference && (
                <th className="text-left p-2 text-lg font-bold">Year Diff</th>
              )}
              <th className="text-left p-2 text-lg font-bold">View Plan</th>
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((p) => {
              let diffStr = "";
              let diffClass = "";
              if (showDifference && currentMonthly !== null) {
                // difference => currentMonthly - p.monthlyPremium
                // If positive => minus => cheaper => text-green
                // If negative => plus => more expensive => text-red
                const rawDiff = (currentMonthly - p.monthlyPremium) * 12;
                const { text, colorClass, show } = formatCostDiff(rawDiff);
                diffStr = show ? text : "";
                diffClass = colorClass;
              }

              return (
                <tr key={p.id} className="border-b">
                  <td className="p-2">{p.insurer_name}</td>
                  <td className="p-2">{p.plan_label}</td>
                  <td className="p-2">{p.monthlyPremium.toFixed(2)}</td>
                  {showDifference && (
                    <td className={`p-2 ${diffClass}`}>
                      {diffStr}
                    </td>
                  )}
                  <td className="p-2">
                    <button className="bg-gray-200 px-2 py-1 rounded">
                      View Plan
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {subList.length > 5 && (
          <div className="mt-2">
            {isExpanded ? (
              <button
                className="text-blue-600 underline"
                onClick={() => handleCollapse(typ)}
              >
                Show less
              </button>
            ) : (
              <button
                className="text-blue-600 underline"
                onClick={() => handleExpand(typ)}
              >
                Show more
              </button>
            )}
          </div>
        )}
      </>
    );
  }
}
