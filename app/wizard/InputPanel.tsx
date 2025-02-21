"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
} from "react";
import {
  computeAltersklasse,
  getFranchiseOptions,
} from "@/lib/insuranceHelpers";

// ---------------------- TYPES ----------------------

/** A single row from /api/postal or /api/postalById */
interface PostalRecord {
  id: number;
  plz: string;
  gemeinde: string;
  ort_localite: string;
  kanton: string;
  region_int: string;
}

/** The user inputs object shared across the wizard. */
export interface UserInputs {
  yearOfBirth: number;
  franchise: number;
  unfalleinschluss: string; // "MIT-UNF" or "OHN-UNF"
  canton: string;
  region: string;
  altersklasse: string; // "AKL-KIN" | "AKL-JUG" | "AKL-ERW" or empty
  currentInsurerBagCode: string;
  currentInsurer: string;
  currentPlan: string;
  currentPlanRow?: unknown;
  postalId: number;
}

/** For /api/insurers => e.g. { id, bag_code, name } */
interface Insurer {
  id: number;
  bag_code: string;
  name: string;
}

/** For /api/insurerPlans => distinctTarif, distinctLabel, tariftyp */
interface InsurerPlan {
  distinctTarif: string;
  distinctLabel: string;
  tariftyp: string;
}

/** The shape of a saved profile in /api/profiles */
interface ProfileRecord {
  id: number;
  profile_name: string;
  postal_id: number | null;
  postal_plz: string;
  postal_ort_localite: string;
  postal_gemeinde: string;
  postal_kanton: string;
  postal_region_int: string;
  year_of_birth: number;
  canton: string;
  region: string;
  franchise: number;
  current_plan: string;
  unfalleinschluss: string;
  current_insurer_bag_code: string;
  last_updated: string;
}

/** The props to InputPanel */
interface InputPanelProps {
  userInputs: UserInputs;
  onUserInputsChange: (vals: Partial<UserInputs>) => void;
  initialPlz?: string;
}

export default function InputPanel({
  userInputs,
  onUserInputsChange,
  initialPlz = "",
}: InputPanelProps) {
  // -------------- Local states for user editing --------------
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

  // postal code
  const [plzInput, setPlzInput] = useState<string>("");
  const [postalMatches, setPostalMatches] = useState<PostalRecord[]>([]);
  const [selectedPostal, setSelectedPostal] = useState<PostalRecord | null>(null);

  // For the one-time auto-commit
  const [didAutoCommit, setDidAutoCommit] = useState<boolean>(false);

  // profiles saving
  const [profileName, setProfileName] = useState<string>("");
  const [savedProfiles, setSavedProfiles] = useState<ProfileRecord[]>([]);

  // plan dropdown
  const [planList, setPlanList] = useState<InsurerPlan[]>([]);
  const [insurerList, setInsurerList] = useState<Insurer[]>([]);

  // -------------- Sync from userInputs if changed --------------
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
        .then((row: PostalRecord) => {
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
  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch("/api/profiles");
      const data = await res.json();
      if (data.success && data.profiles) {
        setSavedProfiles(data.profiles as ProfileRecord[]);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // postal code autocomplete
  useEffect(() => {
    if (!plzInput) {
      setPostalMatches([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/postal?search=${encodeURIComponent(plzInput)}`)
        .then((r) => r.json())
        .then((rows: PostalRecord[]) => setPostalMatches(rows))
        .catch(() => setPostalMatches([]));
    }, 300);
    return () => clearTimeout(t);
  }, [plzInput]);

  function handleSelectPostal(row: PostalRecord) {
    setSelectedPostal(row);
    setPlzInput(row.plz);
    setPostalMatches([]);

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

  // commitChanges => merges partial => calls onUserInputsChange
  const commitChanges = useCallback(
    (partial: Partial<UserInputs>) => {
      const ak = computeAltersklasse(partial.yearOfBirth || 0);
      const newObj: UserInputs = {
        ...userInputs,
        ...partial,
        altersklasse: ak,
      };
      onUserInputsChange(newObj);
    },
    [onUserInputsChange, userInputs]
  );

  // Once we have the postal row, YOB, franchise, accident => we can auto-commit if all valid
  useEffect(() => {
    if (!didAutoCommit) {
      if (
        localYob > 0 &&
        localFranchise > 0 &&
        selectedPostal &&
        localAccident
      ) {
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

  // re-fetch plan list if localInsurerBagCode => done below
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
      .then((arr: InsurerPlan[]) => setPlanList(arr))
      .catch(() => setPlanList([]));
  }, [
    localInsurerBagCode,
    localYob,
    localFranchise,
    localAccident,
    selectedPostal,
  ]);

  // -------------- handlers --------------
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

  /** Save profile => POST /api/profiles */
  async function handleSaveProfile() {
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
    const row: PostalRecord = {
      id: p.postal_id || 0,
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
  const validFranchises = getFranchiseOptions(ak);

  const boxStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "10px",
    marginBottom: "1rem",
    padding: "1rem",
  };
  const titleStyle: React.CSSProperties = {
    marginTop: 0,
    fontSize: "1.6rem",
    fontWeight: "bold",
    marginBottom: "0.8rem",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "1.1rem",
    marginBottom: "0.3rem",
    fontWeight: 500,
  };
  const inputStyle: React.CSSProperties = {
    fontSize: "1rem",
    padding: "0.6rem",
    width: "100%",
    boxSizing: "border-box",
    marginBottom: "0.8rem",
  };

  return (
    <div>
      {/* Box 1: "Current plan" */}
      <div style={boxStyle}>
        <h4 style={titleStyle}>Current plan</h4>
        <label style={labelStyle}>Current Insurer</label>
        <select
          style={inputStyle}
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
            <label style={labelStyle}>Current Plan</label>
            <select style={inputStyle} value={localPlan} onChange={handlePlanChange}>
              <option value="">None</option>
              {planList.map((p) => (
                <option key={p.distinctTarif} value={p.distinctTarif}>
                  {p.distinctLabel}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Box 2: "Profile name" */}
      <div style={boxStyle}>
        <h4 style={titleStyle}>Profile name</h4>
        <label style={labelStyle}>Profile Name</label>
        <input
          type="text"
          style={inputStyle}
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
        />

        <button
          style={{
            padding: "0.6rem 1rem",
            background: canSaveProfile() ? "#2F62F4" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: canSaveProfile() ? "pointer" : "default",
            fontSize: "1rem",
            marginTop: "0.5rem",
          }}
          onClick={handleSaveProfile}
          disabled={!canSaveProfile()}
        >
          Save Profile
        </button>
      </div>

      {/* Box 3: "Own data" */}
      <div style={boxStyle}>
        <h4 style={titleStyle}>Own data</h4>
        <label style={labelStyle}>Year of Birth</label>
        <input
          type="text"
          inputMode="numeric"
          style={inputStyle}
          value={localYob || ""}
          onChange={handleYearInput}
        />

        <label style={labelStyle}>Postal code</label>
        <input
          type="text"
          style={inputStyle}
          value={plzInput}
          onChange={(e) => {
            setPlzInput(e.target.value);
            setSelectedPostal(null);
          }}
        />
        {postalMatches.length > 0 && !selectedPostal && (
          <ul style={{ border: "1px solid #ccc", margin: 0, padding: 0 }}>
            {postalMatches.map((row) => (
              <li
                key={row.id}
                style={{ listStyle: "none", padding: "4px", cursor: "pointer" }}
                onClick={() => handleSelectPostal(row)}
              >
                {row.plz} {row.ort_localite} ({row.gemeinde})
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Box 4: "Insurance preferences" */}
      <div style={boxStyle}>
        <h4 style={titleStyle}>Insurance preferences</h4>
        <label style={labelStyle}>Own risk</label>
        <select
          style={inputStyle}
          value={localFranchise}
          onChange={handleFranchiseChange}
        >
          <option value={0}>--</option>
          {validFranchises.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Accident coverage</label>
        <select
          style={inputStyle}
          value={localAccident}
          onChange={handleAccidentChange}
        >
          <option value="MIT-UNF">With Accident</option>
          <option value="OHN-UNF">Without Accident</option>
        </select>
      </div>

      {/* Box 5: "Saved profiles" */}
      <div style={boxStyle}>
        <h4 style={titleStyle}>Saved profiles</h4>
        {savedProfiles.length === 0 ? (
          <p>No profiles saved yet.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "1rem",
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "4px" }}>ID</th>
                <th style={{ textAlign: "left", padding: "4px" }}>Profile Name</th>
                <th style={{ textAlign: "left", padding: "4px" }}>Year</th>
                <th style={{ textAlign: "left", padding: "4px" }}>Plan</th>
                <th style={{ textAlign: "left", padding: "4px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {savedProfiles.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: "4px" }}>{p.id}</td>
                  <td style={{ padding: "4px" }}>
                    <span
                      style={{
                        color: "blue",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                      onClick={() => handleLoadProfile(p)}
                    >
                      {p.profile_name}
                    </span>
                  </td>
                  <td style={{ padding: "4px" }}>{p.year_of_birth}</td>
                  <td style={{ padding: "4px" }}>{p.current_plan}</td>
                  <td style={{ padding: "4px" }}>
                    <button
                      style={{
                        background: "red",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                      }}
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
