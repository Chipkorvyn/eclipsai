"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  MouseEvent,
} from "react";
import {
  computeAltersklasse,
  getFranchiseOptions,
} from "@/lib/insuranceHelpers";

/** Basic shape for user inputs used by the wizard. */
export interface UserInputs {
  yearOfBirth: number;
  franchise: number;
  unfalleinschluss: string;
  canton: string;
  region: string;
  altersklasse: string;
  currentInsurerBagCode: string;
  currentInsurer: string;
  currentPlan: string;
  currentPlanRow: unknown; // or more specific if you want
  postalId: number;
}

/** Single row from `/api/postal`, used in postalMatches. */
interface PostalRow {
  id: number;
  plz: string;
  ort_localite: string;
  gemeinde: string;
  kanton: string;
  region_int: number | null;
}

/** Single row from `/api/insurers`. */
interface Insurer {
  id: number;
  bag_code: string;
  name: string;
}

/** Single plan row from `/api/insurerPlans`. */
interface PlanListItem {
  distinctTarif: string;
  distinctLabel: string;
  tariftyp: string;
}

/** Single row from `/api/profiles`. */
interface ProfileRecord {
  id: number;
  profile_name: string;

  postal_id: number;
  postal_plz: string;
  postal_ort_localite: string;
  postal_gemeinde: string;
  postal_kanton: string;
  postal_region_int: number | null;

  year_of_birth: number;
  canton: string;
  region: string;
  franchise: number;
  current_plan: string;
  unfalleinschluss: string;
  current_insurer_bag_code: string;
}

/** Props for InputPanel */
interface InputPanelProps {
  userInputs: UserInputs;
  onUserInputsChange: (vals: Partial<UserInputs>) => void;
  initialPlz?: string;
}

const planTypeOrder = ["TAR-BASE", "TAR-HAM", "TAR-HMO", "TAR-DIV"] as const;
const planTypeLabels: Record<string, string> = {
  "TAR-BASE": "Standard",
  "TAR-HAM": "Family doctor",
  "TAR-HMO": "HMO",
  "TAR-DIV": "Other plan types",
};

export default function InputPanel({
  userInputs,
  onUserInputsChange,
  initialPlz = "",
}: InputPanelProps) {
  // ------ Local states for user editing ------
  const [localYob, setLocalYob] = useState<number>(userInputs.yearOfBirth || 0);
  const [localFranchise, setLocalFranchise] = useState<number>(
    userInputs.franchise || 0
  );
  const [localAccident, setLocalAccident] = useState<string>(
    userInputs.unfalleinschluss || "MIT-UNF"
  );
  const [localInsurerBagCode, setLocalInsurerBagCode] = useState<string>(
    userInputs.currentInsurerBagCode || ""
  );
  const [localInsurer, setLocalInsurer] = useState<string>(
    userInputs.currentInsurer || "I have no insurer"
  );
  const [localPlan, setLocalPlan] = useState<string>(userInputs.currentPlan || "");

  // postal code logic
  const [plzInput, setPlzInput] = useState<string>("");
  const [postalMatches, setPostalMatches] = useState<PostalRow[]>([]);
  const [selectedPostal, setSelectedPostal] = useState<PostalRow | null>(null);

  // One-time auto-commit
  const [didAutoCommit, setDidAutoCommit] = useState(false);

  // profiles
  const [profileName, setProfileName] = useState<string>("");
  const [savedProfiles, setSavedProfiles] = useState<ProfileRecord[]>([]);

  // plan dropdown
  const [planList, setPlanList] = useState<PlanListItem[]>([]);
  const [insurerList, setInsurerList] = useState<Insurer[]>([]);

  /**
   * commitChanges => merges partial => calls onUserInputsChange
   */
  const commitChanges = useCallback(
    (partial: Partial<UserInputs>) => {
      const ak = computeAltersklasse(partial.yearOfBirth || 0);
      const newObj: UserInputs = {
        ...userInputs, // old
        ...partial,
        altersklasse: ak,
      };
      onUserInputsChange(newObj);
    },
    [userInputs, onUserInputsChange]
  );

  // ============ Effects ============

  // Sync from userInputs if changed
  useEffect(() => {
    setLocalYob(userInputs.yearOfBirth || 0);
    setLocalFranchise(userInputs.franchise || 0);
    setLocalAccident(userInputs.unfalleinschluss || "MIT-UNF");
    setLocalInsurerBagCode(userInputs.currentInsurerBagCode || "");
    setLocalInsurer(userInputs.currentInsurer || "I have no insurer");
    setLocalPlan(userInputs.currentPlan || "");

    // If userInputs.postalId => fetch that row so we can auto-select
    if (userInputs.postalId && userInputs.postalId > 0) {
      fetch(`/api/postalById?id=${userInputs.postalId}`)
        .then((r) => r.json())
        .then((row: PostalRow) => {
          if (row && row.id) {
            setSelectedPostal(row);
            setPlzInput(row.plz);
          }
        })
        .catch(() => {
          /* ignore */
        });
    }
  }, [userInputs]);

  // If initialPlz is provided
  useEffect(() => {
    if (initialPlz && !plzInput) {
      setPlzInput(initialPlz);
    }
  }, [initialPlz, plzInput]);

  // fetch insurers once
  useEffect(() => {
    fetch("/api/insurers")
      .then((r) => r.json())
      .then((data: Insurer[]) => setInsurerList(data))
      .catch(() => {});
  }, []);

  // fetch profiles once
  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    try {
      const res = await fetch("/api/profiles");
      const data = await res.json();
      if (data.success) {
        setSavedProfiles(data.profiles);
      }
    } catch {
      // ignore
    }
  }

  // postal code autocomplete
  useEffect(() => {
    if (!plzInput) {
      setPostalMatches([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/postal?search=${encodeURIComponent(plzInput)}`)
        .then((r) => r.json())
        .then((rows: PostalRow[]) => setPostalMatches(rows))
        .catch(() => setPostalMatches([]));
    }, 300);
    return () => clearTimeout(t);
  }, [plzInput]);

  // re-fetch plan list if localInsurerBagCode
  useEffect(() => {
    if (!localInsurerBagCode) {
      setPlanList([]);
      return;
    }
    const ak = computeAltersklasse(localYob);
    const canton = selectedPostal?.kanton || "";
    const region = selectedPostal ? `PR-REG CH${selectedPostal.region_int}` : "";

    const qs = new URLSearchParams({
      bag_code: localInsurerBagCode,
      canton,
      region,
      altersklasse: ak,
      franchise: String(localFranchise),
      unfalleinschluss: localAccident,
    });
    const url = `/api/insurerPlans?${qs.toString()}`;

    fetch(url)
      .then((r) => r.json())
      .then((arr: PlanListItem[]) => setPlanList(arr))
      .catch(() => setPlanList([]));
  }, [localInsurerBagCode, localYob, localFranchise, localAccident, selectedPostal]);

  // Once we have the postal row + YOB + franchise + accident => do one commit
  useEffect(() => {
    if (!didAutoCommit) {
      if (localYob > 0 && localFranchise > 0 && selectedPostal && localAccident) {
        commitChanges({
          yearOfBirth: localYob,
          franchise: localFranchise,
          unfalleinschluss: localAccident,
          currentInsurerBagCode: localInsurerBagCode,
          currentInsurer: localInsurer,
          currentPlan: localPlan,
          postalId: selectedPostal.id || 0,
          canton: selectedPostal.kanton || "",
          region: selectedPostal.region_int
            ? `PR-REG CH${selectedPostal.region_int}`
            : "",
        });
        setDidAutoCommit(true);
      }
    }
  }, [
    didAutoCommit,
    localYob,
    localFranchise,
    localAccident,
    localInsurerBagCode,
    localInsurer,
    localPlan,
    selectedPostal,
    commitChanges,
  ]);

  // ============ Handlers ============

  function handleSelectPostal(row: PostalRow) {
    setSelectedPostal(row);
    setPlzInput(row.plz);
    setPostalMatches([]);

    // Immediately commit so wizard knows
    commitChanges({
      yearOfBirth: localYob,
      franchise: localFranchise,
      unfalleinschluss: localAccident,
      currentInsurerBagCode: localInsurerBagCode,
      currentInsurer: localInsurer,
      currentPlan: localPlan,
      postalId: row.id || 0,
      canton: row.kanton || "",
      region: row.region_int ? `PR-REG CH${row.region_int}` : "",
    });
  }

  function handleYearInput(e: ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10) || 0;
    setLocalYob(val);
    commitChanges({
      yearOfBirth: val,
      franchise: localFranchise,
      unfalleinschluss: localAccident,
      currentInsurerBagCode: localInsurerBagCode,
      currentInsurer: localInsurer,
      currentPlan: localPlan,
      postalId: selectedPostal ? selectedPostal.id : 0,
      canton: selectedPostal?.kanton || "",
      region: selectedPostal ? `PR-REG CH${selectedPostal.region_int}` : "",
    });
  }

  function handleFranchiseChange(e: ChangeEvent<HTMLSelectElement>) {
    const val = parseInt(e.target.value, 10) || 0;
    setLocalFranchise(val);
    commitChanges({
      yearOfBirth: localYob,
      franchise: val,
      unfalleinschluss: localAccident,
      currentInsurerBagCode: localInsurerBagCode,
      currentInsurer: localInsurer,
      currentPlan: localPlan,
      postalId: selectedPostal ? selectedPostal.id : 0,
      canton: selectedPostal?.kanton || "",
      region: selectedPostal ? `PR-REG CH${selectedPostal.region_int}` : "",
    });
  }

  function handleAccidentChange(e: ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setLocalAccident(val);
    commitChanges({
      yearOfBirth: localYob,
      franchise: localFranchise,
      unfalleinschluss: val,
      currentInsurerBagCode: localInsurerBagCode,
      currentInsurer: localInsurer,
      currentPlan: localPlan,
      postalId: selectedPostal ? selectedPostal.id : 0,
      canton: selectedPostal?.kanton || "",
      region: selectedPostal ? `PR-REG CH${selectedPostal.region_int}` : "",
    });
  }

  function handleInsurerChange(e: ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setLocalInsurerBagCode(val);
    let newName = "I have no insurer";
    if (val) {
      const found = insurerList.find((ins) => ins.bag_code === val);
      newName = found ? found.name : "Unknown insurer";
    }
    setLocalInsurer(newName);

    commitChanges({
      yearOfBirth: localYob,
      franchise: localFranchise,
      unfalleinschluss: localAccident,
      currentInsurerBagCode: val,
      currentInsurer: newName,
      currentPlan: "", // reset plan if insurer changes
      postalId: selectedPostal ? selectedPostal.id : 0,
      canton: selectedPostal?.kanton || "",
      region: selectedPostal ? `PR-REG CH${selectedPostal.region_int}` : "",
    });
  }

  function handlePlanChange(e: ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setLocalPlan(val);
    commitChanges({
      yearOfBirth: localYob,
      franchise: localFranchise,
      unfalleinschluss: localAccident,
      currentInsurerBagCode: localInsurerBagCode,
      currentInsurer: localInsurer,
      currentPlan: val,
      postalId: selectedPostal ? selectedPostal.id : 0,
      canton: selectedPostal?.kanton || "",
      region: selectedPostal ? `PR-REG CH${selectedPostal.region_int}` : "",
    });
  }

  function groupPlansByType(plans: PlanListItem[]) {
    const grouped: Record<string, PlanListItem[]> = {
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
  const groupedPlans = groupPlansByType(planList);

  async function handleSaveProfile(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    if (!selectedPostal) {
      alert("Please select a postal row first.");
      return;
    }
    if (!localPlan) {
      alert("Please pick a plan first.");
      return;
    }
    if (!profileName.trim()) {
      alert("Please provide a profile name.");
      return;
    }
    const body = {
      profileName,
      postalId: selectedPostal.id,
      postalPlz: selectedPostal.plz,
      postalOrtLocalite: selectedPostal.ort_localite,
      postalGemeinde: selectedPostal.gemeinde,
      postalKanton: selectedPostal.kanton,
      postalRegionInt: selectedPostal.region_int,

      yearOfBirth: localYob,
      canton: selectedPostal.kanton || "",
      region: `PR-REG CH${selectedPostal.region_int}`,
      franchise: localFranchise,
      currentPlan: localPlan,
      unfalleinschluss: localAccident,
      currentInsurerBagCode: localInsurerBagCode,
    };
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        alert("Profile saved => " + data.profile.profile_name);
        setProfileName("");
        fetchProfiles();
        resetAllFields();
      } else {
        alert("Error saving => " + data.error);
      }
    } catch {
      alert("Network error while saving");
    }
  }

  function resetAllFields() {
    setLocalYob(0);
    setLocalFranchise(0);
    setLocalAccident("MIT-UNF");
    setPlzInput("");
    setSelectedPostal(null);
    setLocalInsurerBagCode("");
    setLocalInsurer("I have no insurer");
    setLocalPlan("");
  }

  async function handleDeleteProfile(id: number) {
    if (!confirm("Delete profile " + id + "?")) return;
    try {
      const res = await fetch("/api/profiles?id=" + id, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSavedProfiles((prev) => prev.filter((x) => x.id !== data.deletedId));
      } else {
        alert("Delete error => " + data.error);
      }
    } catch {
      alert("Network error while deleting");
    }
  }

  function handleLoadProfile(p: ProfileRecord) {
    const row: PostalRow = {
      id: p.postal_id,
      plz: p.postal_plz,
      ort_localite: p.postal_ort_localite,
      gemeinde: p.postal_gemeinde,
      kanton: p.postal_kanton,
      region_int: p.postal_region_int,
    };
    setSelectedPostal(row);
    setPlzInput(p.postal_plz || "");
    setLocalYob(p.year_of_birth || 0);
    setLocalFranchise(p.franchise || 0);
    setLocalAccident(p.unfalleinschluss || "MIT-UNF");
    setLocalPlan(p.current_plan || "");
    setLocalInsurerBagCode(p.current_insurer_bag_code || "");

    let name = "I have no insurer";
    if (p.current_insurer_bag_code) {
      const found = insurerList.find(
        (ins) => ins.bag_code === p.current_insurer_bag_code
      );
      name = found ? found.name : "Unknown insurer";
    }
    setLocalInsurer(name);

    // Immediately commit => so wizard sees updated
    commitChanges({
      yearOfBirth: p.year_of_birth || 0,
      franchise: p.franchise || 0,
      unfalleinschluss: p.unfalleinschluss || "MIT-UNF",
      currentInsurerBagCode: p.current_insurer_bag_code || "",
      currentInsurer: name,
      currentPlan: p.current_plan || "",
      postalId: p.postal_id || 0,
      canton: p.postal_kanton || "",
      region: p.postal_region_int ? `PR-REG CH${p.postal_region_int}` : "",
    });
    alert("Profile loaded => " + p.profile_name);
  }

  function canSaveProfile() {
    if (!localYob) return false;
    if (!selectedPostal) return false;
    if (!localPlan) return false;
    if (!profileName.trim()) return false;

    const ak = computeAltersklasse(localYob);
    if (ak === "AKL-KIN") {
      return localFranchise >= 0;
    } else {
      return localFranchise >= 300;
    }
  }

  // ========== RENDER ==========

  const ak = computeAltersklasse(localYob);
  const franchiseOptions = getFranchiseOptions(ak);

  return (
    <div className="flex flex-col">
      {/* Box 1: Select to Compare */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h4 className="text-lg font-semibold mb-2">Select to compare</h4>

        <label className="block font-medium mb-1">Current Insurer</label>
        <select
          className={`w-full p-2 rounded border border-gray-300 mb-4 ${
            !localInsurerBagCode ? "text-red-600" : ""
          }`}
          value={localInsurerBagCode}
          onChange={handleInsurerChange}
        >
          <option value="">I have no insurer</option>
          {insurerList.map((ins) => (
            <option key={ins.id} value={ins.bag_code}>
              {ins.name}
            </option>
          ))}
        </select>

        {localInsurerBagCode && (
          <>
            <label className="block font-medium mb-1">Current Plan</label>
            <select
              className="w-full p-2 rounded border border-gray-300"
              value={localPlan}
              onChange={handlePlanChange}
            >
              <option value="">None</option>
              {planTypeOrder.map((typ) => {
                const groupArr = groupedPlans[typ] || [];
                if (!groupArr.length) return null;
                const label = planTypeLabels[typ];
                return (
                  <optgroup key={typ} label={label}>
                    {groupArr.map((planItem) => (
                      <option
                        key={planItem.distinctTarif}
                        value={planItem.distinctTarif}
                      >
                        {planItem.distinctLabel}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </>
        )}
      </div>

      {/* Box 2: Own data */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h4 className="text-lg font-semibold mb-2">Own data</h4>

        <label className="block font-medium mb-1">Year of Birth</label>
        <input
          type="text"
          inputMode="numeric"
          className="w-full p-2 rounded border border-gray-300 mb-4"
          value={localYob || ""}
          onChange={handleYearInput}
        />

        <label className="block font-medium mb-1">Postal code</label>
        <input
          type="text"
          className="w-full p-2 rounded border border-gray-300"
          value={plzInput}
          onChange={(e) => {
            setPlzInput(e.target.value);
            setSelectedPostal(null);
          }}
        />

        {/* Show postal suggestions */}
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

      {/* Box 3: Insurance preferences */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h4 className="text-lg font-semibold mb-2">Insurance preferences</h4>

        <label className="block font-medium mb-1">Own risk</label>
        <select
          className="w-full p-2 rounded border border-gray-300 mb-4"
          value={localFranchise}
          onChange={handleFranchiseChange}
        >
          <option value={0}>--</option>
          {franchiseOptions.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <label className="block font-medium mb-1">Accident coverage</label>
        <select
          className="w-full p-2 rounded border border-gray-300"
          value={localAccident}
          onChange={handleAccidentChange}
        >
          <option value="MIT-UNF">With Accident</option>
          <option value="OHN-UNF">Without Accident</option>
        </select>
      </div>

      {/* Box 4: Profile name */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h4 className="text-lg font-semibold mb-2">Profile name</h4>

        <label className="block font-medium mb-1">Profile Name</label>
        <input
          type="text"
          className="w-full p-2 rounded border border-gray-300 mb-4"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
        />

        <button
          className={`
            px-4 py-2 rounded font-semibold text-white 
            ${canSaveProfile() ? "bg-blue-600" : "bg-gray-400 cursor-not-allowed"}
          `}
          onClick={handleSaveProfile}
          disabled={!canSaveProfile()}
        >
          Save Profile
        </button>
      </div>

      {/* Box 5: Saved profiles */}
      <div className="bg-white rounded-lg p-4">
        <h4 className="text-lg font-semibold mb-2">Saved profiles</h4>
        {savedProfiles.length === 0 ? (
          <p>No profiles saved yet.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-1">ID</th>
                <th className="text-left p-1">Profile Name</th>
                <th className="text-left p-1">Year</th>
                <th className="text-left p-1">Plan</th>
                <th className="text-left p-1">Action</th>
              </tr>
            </thead>
            <tbody>
              {savedProfiles.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="p-1">{p.id}</td>
                  <td className="p-1">
                    <span
                      className="text-blue-600 underline cursor-pointer"
                      onClick={() => handleLoadProfile(p)}
                    >
                      {p.profile_name}
                    </span>
                  </td>
                  <td className="p-1">{p.year_of_birth}</td>
                  <td className="p-1">{p.current_plan}</td>
                  <td className="p-1">
                    <button
                      className="bg-red-600 text-white px-2 py-1 rounded cursor-pointer"
                      onClick={() => handleDeleteProfile(p.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
