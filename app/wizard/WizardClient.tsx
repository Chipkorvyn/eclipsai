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
  "TAR-DIV": "Other plans",
};

function roundFranc(num: number) {
  return Math.round(num);
}
function formatMonthly(val: number): string {
  return `${roundFranc(val)} CHF/month`;
}
function formatAnnualSavings(diff: number): string {
  return diff > 0 ? `${Math.round(diff)} CHF/year` : "";
}
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

  // fetch data when userInputs changes
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
        annualSavings: "",
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
            annualSavings: "",
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
          annualSavings: "",
        };
      });
    }

    // else => user has a current plan
    let currentRow: PlanOption | null = null;
    let currentTyp = "TAR-DIV";
    // find userInputs.currentPlan in the groupedByType array
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
      // fallback
      return TYPE_ORDER.map((typ, idx) => ({
        headerLine1: idx === 0 ? "Current plan" : "Cheapest option",
        headerLine2: TYPE_LABELS[typ],
        headerColor: idx === 0 ? "#666" : "#007BFF",
        planType: TYPE_LABELS[typ],
        insurer: "(no data)",
        planName: "",
        monthly: "",
        annualSavings: "",
      }));
    }

    const cm = parseFloat(currentRow.praemie);
    // Box #1 => current plan
    const box1 = {
      headerLine1: "Current plan",
      headerLine2: TYPE_LABELS[currentTyp],
      headerColor: "#666",
      planType: TYPE_LABELS[currentTyp],
      insurer: currentRow.insurer_name || "(??)",
      planName: currentRow.plan_label || currentRow.tarif || "",
      monthly: formatMonthly(cm),
      annualSavings: "",
    };

    // Box #2 => cheapest in same type
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
        annualSavings: "",
      };
    } else {
      const c2m = parseFloat(cheapestSame.praemie);
      const diff2 = (cm - c2m) * 12;
      box2 = {
        headerLine1: "Cheapest option",
        headerLine2: TYPE_LABELS[currentTyp],
        headerColor: "#007BFF",
        planType: TYPE_LABELS[currentTyp],
        insurer: cheapestSame.insurer_name || "(??)",
        planName: cheapestSame.plan_label || cheapestSame.tarif || "",
        monthly: formatMonthly(c2m),
        annualSavings: formatAnnualSavings(diff2),
      };
    }

    // Boxes #3 & #4 => cheapest from other categories
    const otherTypes = TYPE_ORDER.filter((t) => t !== currentTyp);
    const arrOthers: { row: PlanOption; cost: number }[] = [];
    for (const ot of otherTypes) {
      const arr2 = groupedByType[ot] || [];
      if (arr2.length > 0) {
        arrOthers.push({
          row: arr2[0],
          cost: parseFloat(arr2[0].praemie),
        });
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
        annualSavings: "",
      };
      box4 = { ...box3 };
    } else if (arrOthers.length === 1) {
      const first = arrOthers[0];
      const diff3 = (cm - first.cost) * 12;
      box3 = {
        headerLine1: "Cheapest option",
        headerLine2: TYPE_LABELS[getPlanType(first.row)],
        headerColor: "#007BFF",
        planType: TYPE_LABELS[getPlanType(first.row)],
        insurer: first.row.insurer_name || "(??)",
        planName: first.row.plan_label || first.row.tarif || "",
        monthly: formatMonthly(first.cost),
        annualSavings: formatAnnualSavings(diff3),
      };
      box4 = {
        headerLine1: "Cheapest option",
        headerLine2: "",
        headerColor: "#007BFF",
        planType: "",
        insurer: "",
        planName: "",
        monthly: "",
        annualSavings: "",
      };
    } else {
      // we have at least 2
      const first = arrOthers[0];
      const second = arrOthers[1];
      const diff3 = (cm - first.cost) * 12;
      box3 = {
        headerLine1: "Cheapest option",
        headerLine2: TYPE_LABELS[getPlanType(first.row)],
        headerColor: "#007BFF",
        planType: TYPE_LABELS[getPlanType(first.row)],
        insurer: first.row.insurer_name || "(??)",
        planName: first.row.plan_label || first.row.tarif || "",
        monthly: formatMonthly(first.cost),
        annualSavings: formatAnnualSavings(diff3),
      };
      if (!second) {
        box4 = {
          headerLine1: "Cheapest option",
          headerLine2: "",
          headerColor: "#007BFF",
          planType: "",
          insurer: "",
          planName: "",
          monthly: "",
          annualSavings: "",
        };
      } else {
        const diff4 = (cm - second.cost) * 12;
        box4 = {
          headerLine1: "Cheapest option",
          headerLine2: TYPE_LABELS[getPlanType(second.row)],
          headerColor: "#007BFF",
          planType: TYPE_LABELS[getPlanType(second.row)],
          insurer: second.row.insurer_name || "(??)",
          planName: second.row.plan_label || second.row.tarif || "",
          monthly: formatMonthly(second.cost),
          annualSavings: formatAnnualSavings(diff4),
        };
      }
    }

    return [box1, box2, box3, box4];
  }

  const topBoxes = buildBoxes();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* top nav */}
      <div
        style={{
          background: "#fff",
          height: "50px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          onClick={() => {
            window.location.href = "/";
          }}
          style={{ marginLeft: "1rem", cursor: "pointer", fontWeight: "bold", fontSize: "1.3rem" }}
        >
          Eclipsai
        </div>
      </div>

      <div style={{ background: "#f0f0f0", flex: 1, padding: "1rem 0" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", gap: "0.5rem" }}>
          {/* Left => InputPanel */}
          <div style={{ width: "25%", minWidth: "280px" }}>
            <InputPanel userInputs={userInputs} onUserInputsChange={handleUserInputsChange} />
          </div>

          {/* Right => top boxes => PlanOptionsPanel */}
          <div style={{ flex: 1 }}>
            {/* 4 top boxes */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              {topBoxes.map((box, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    background: "#fff",
                    borderRadius: "6px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      background: box.headerColor,
                      color: "#fff",
                      padding: "0.5rem",
                      fontWeight: "bold",
                      fontSize: "0.95rem",
                      textAlign: "center",
                      lineHeight: "1.3",
                    }}
                  >
                    <div>{box.headerLine1}</div>
                    <div>{box.headerLine2}</div>
                  </div>

                  <div style={{ padding: "0.75rem", flex: 1 }}>
                    <div style={{ fontSize: "1.2rem", marginBottom: "0.6rem" }}>
                      {box.planType}
                    </div>
                    <div
                      style={{
                        fontSize: "1.4rem",
                        fontWeight: "bold",
                        marginBottom: "0.6rem",
                      }}
                    >
                      {box.insurer}
                    </div>
                    <div style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
                      {box.planName}
                    </div>
                    <div style={{ fontSize: "1.6rem", marginBottom: "0.3rem" }}>
                      {box.monthly}
                    </div>
                    {box.annualSavings && (
                      <div style={{ fontSize: "1.2rem", color: "green", marginBottom: "1rem" }}>
                        {box.annualSavings}
                      </div>
                    )}
                    <div style={{ marginTop: "0.5rem" }}>
                      <button
                        style={{
                          padding: "0.5rem 1rem",
                          borderRadius: "4px",
                          background: "#007BFF",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "1.1rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        View plan
                      </button>
                      <div
                        style={{
                          marginTop: "0.5rem",
                          fontSize: "1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Compare</span>
                        <input
                          type="checkbox"
                          style={{ marginLeft: "1rem", transform: "scale(1.2)" }}
                        />
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
