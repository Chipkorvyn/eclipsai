"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  computeAltersklasse,
  getFranchiseOptions,
  CURRENT_REF_YEAR,
} from "@/lib/insuranceHelpers";

// Define a type for the postal records
interface PostalRecord {
  id: number;
  plz: string;
  gemeinde: string;
  ort_localite: string;
  kanton: string;
  region_int: string;
}

// For Insurer + Plans
interface Insurer {
  id: number;
  bag_code: string;
  name: string;
}

interface InsurerPlan {
  distinctTarif: string;
  distinctLabel: string;
  tariftyp: string;
}

/** Plan type grouping labels, same as second page */
const planTypeOrder = ["TAR-BASE", "TAR-HAM", "TAR-HMO", "TAR-DIV"] as const;
const planTypeLabels: Record<string, string> = {
  "TAR-BASE": "Standard",
  "TAR-HAM": "Family doctor",
  "TAR-HMO": "HMO",
  "TAR-DIV": "Other plan types",
};

/** Group plans by tariftyp, so we can do <optgroup> */
function groupPlansByType(plans: InsurerPlan[]) {
  const grouped: Record<string, InsurerPlan[]> = {
    "TAR-BASE": [],
    "TAR-HAM": [],
    "TAR-HMO": [],
    "TAR-DIV": [],
  };
  for (const p of plans) {
    const typ = p.tariftyp || "TAR-DIV";
    grouped[typ].push(p);
  }
  return grouped;
}

export default function HomePage() {
  const router = useRouter();

  // Mandatory fields
  const [yobInput, setYobInput] = useState("");
  const [franchise, setFranchise] = useState<number | "">("");
  const [accidentCoverage, setAccidentCoverage] = useState("MIT-UNF");

  // Postal code logic
  const [plzInput, setPlzInput] = useState("");
  const [postalMatches, setPostalMatches] = useState<PostalRecord[]>([]);
  const [selectedPostal, setSelectedPostal] = useState<PostalRecord | null>(
    null
  );

  // Franchise array
  const [franchiseOptions, setFranchiseOptions] = useState<number[]>([]);
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  // ---------- Insurer + Plan logic -----------
  const [insurerBagCode, setInsurerBagCode] = useState("");
  const [planChoice, setPlanChoice] = useState("");

  const [insurerList, setInsurerList] = useState<Insurer[]>([]);
  const [planList, setPlanList] = useState<InsurerPlan[]>([]);

  // Fetch insurer list once
  useEffect(() => {
    fetch("/api/insurers")
      .then((res) => res.json())
      .then((data: Insurer[]) => {
        setInsurerList(data);
      })
      .catch(() => {
        // ignore error
      });
  }, []);

  // If insurer is selected => fetch plan list
  useEffect(() => {
    if (!insurerBagCode) {
      setPlanList([]);
      setPlanChoice("");
      return;
    }

    const url = `/api/insurerPlans?bag_code=${insurerBagCode}`;
    fetch(url)
      .then((res) => res.json())
      .then((data: InsurerPlan[]) => {
        setPlanList(data);
      })
      .catch(() => {
        setPlanList([]);
      });
  }, [insurerBagCode]);

  // Group the plan list by plan type
  const groupedPlans = groupPlansByType(planList);

  // Update franchise options whenever YOB changes
  useEffect(() => {
    const parsedYob = parseInt(yobInput, 10);
    const ak = computeAltersklasse(parsedYob);
    const opts = getFranchiseOptions(ak);

    setFranchiseOptions(opts);
    if (!opts.includes(Number(franchise))) {
      setFranchise("");
    }
  }, [yobInput, franchise]);

  // Postal code autocomplete
  useEffect(() => {
    if (!plzInput) {
      setPostalMatches([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/postal?search=${encodeURIComponent(plzInput)}`)
        .then((r) => r.json())
        .then((data: PostalRecord[]) => setPostalMatches(data))
        .catch(() => setPostalMatches([]));
    }, 300);
    return () => clearTimeout(t);
  }, [plzInput]);

  function handleSelectPostal(row: PostalRecord) {
    setSelectedPostal(row);
    setPlzInput(row.plz);
    setPostalMatches([]);
  }

  // Only enabled if all mandatory fields are valid
  const isDisabled =
    !yobInput || !franchise || !accidentCoverage || !selectedPostal;

  function handleButtonClick() {
    if (isDisabled) return;

    const parsedYob = parseInt(yobInput, 10);
    if (
      Number.isNaN(parsedYob) ||
      parsedYob < 1900 ||
      parsedYob > CURRENT_REF_YEAR
    ) {
      alert(`Please enter a valid Year of Birth (1900 - ${CURRENT_REF_YEAR}).`);
      return;
    }

    // Build the query string
    const params = new URLSearchParams({
      yob: String(parsedYob),
      franchise: String(franchise),
      accident: accidentCoverage,
      postalId: String(selectedPostal?.id || ""),
      insurerBagCode: insurerBagCode,
      plan: planChoice,
    });

    router.push(`/wizard?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-blue-600 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl text-center mb-5 leading-tight">
        Don&#39;t Wait Until November !
      </h1>

      <p className="text-2xl text-center mb-8">
        Most health insurance savings happen in November, <br />
        but some plans can be changed monthly or mid-year.
        <br />
        <br />
        <em>Alpha version focused on savings.</em>
        <br />
        <em>Accounts, saved data, and automations coming soon.</em>
      </p>

      <div className="bg-white text-black w-72 p-6 mb-4 rounded-lg flex flex-col gap-4">
        {/* Year of Birth */}
        <div>
          <label className="font-medium mb-1 block">Year of Birth</label>
          <input
            type="text"
            className="w-full p-2 rounded border border-gray-300"
            value={yobInput}
            onChange={(e) => setYobInput(e.target.value)}
          />
        </div>

        {/* Postal Code */}
        <div>
          <label className="font-medium mb-1 block">Postal Code</label>
          <input
            type="text"
            className="w-full p-2 rounded border border-gray-300"
            value={plzInput}
            onChange={(e) => {
              setPlzInput(e.target.value);
              setSelectedPostal(null);
            }}
          />
          {postalMatches.length > 0 && !selectedPostal && (
            <ul className="border border-gray-300 mt-1 max-h-40 overflow-y-auto m-0 p-0">
              {postalMatches.map((row) => (
                <li
                  key={row.id}
                  className="list-none p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSelectPostal(row)}
                >
                  {row.plz} {row.ort_localite} ({row.gemeinde})
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Own risk (deductible) */}
        <div>
          <label className="font-medium mb-1 block">
            Own risk (deductible)
          </label>
          <select
            className="w-full p-2 rounded border border-gray-300"
            value={franchise === "" ? "" : franchise}
            onChange={(e) => setFranchise(Number(e.target.value))}
          >
            <option value="">(Select)</option>
            {franchiseOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Accident coverage */}
        <div>
          <label className="font-medium mb-1 block">Accident coverage</label>
          <select
            className="w-full p-2 rounded border border-gray-300"
            value={accidentCoverage}
            onChange={(e) => setAccidentCoverage(e.target.value)}
          >
            <option value="MIT-UNF">With Accident</option>
            <option value="OHN-UNF">Without Accident</option>
          </select>
        </div>

        {/* Insurer Name */}
        <div>
          <label className="font-medium mb-1 block">Current Insurer</label>
          <select
            className="w-full p-2 rounded border border-gray-300"
            value={insurerBagCode}
            onChange={(e) => setInsurerBagCode(e.target.value)}
          >
            <option value="">I have no insurer</option>
            {insurerList.map((ins) => (
              <option key={ins.id} value={ins.bag_code}>
                {ins.name}
              </option>
            ))}
          </select>
        </div>

        {/* Plan selection => grouped by plan type */}
        <div>
          <label className="font-medium mb-1 block">Current Plan</label>
          <select
            className="w-full p-2 rounded border border-gray-300"
            value={planChoice}
            onChange={(e) => setPlanChoice(e.target.value)}
            disabled={!insurerBagCode}
          >
            <option value="">None</option>
            {planTypeOrder.map((typ) => {
              const groupArr = groupedPlans[typ] || [];
              if (!groupArr.length) return null;
              const label = planTypeLabels[typ];
              return (
                <optgroup key={typ} label={label}>
                  {groupArr.map((p) => (
                    <option key={p.distinctTarif} value={p.distinctTarif}>
                      {p.distinctLabel}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>
      </div>

      <button
        className={`
          w-72 py-3 rounded-lg border-none 
          font-semibold text-base text-white
          ${
            isDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : isButtonPressed
              ? "bg-green-600"
              : "bg-blue-900 hover:bg-blue-800"
          }
        `}
        disabled={isDisabled}
        onMouseDown={() => setIsButtonPressed(true)}
        onMouseUp={() => setIsButtonPressed(false)}
        onMouseLeave={() => setIsButtonPressed(false)}
        onClick={handleButtonClick}
      >
        Save on health insurance
      </button>
    </div>
  );
}
