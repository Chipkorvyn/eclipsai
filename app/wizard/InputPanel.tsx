// ----------------------------------------
// app/wizard/InputPanel.tsx
// (Lines 1 - 535, fully intact)
// ----------------------------------------
'use client';

import React, { useState, useEffect } from 'react';

// ===========================
// Helpers for age bracket
// ===========================
function computeAltersklasse(yob: number) {
  if (!yob || yob <= 0) return '';
  const age = 2025 - yob;
  if (age <= 18) return 'AKL-KIN';
  if (age <= 25) return 'AKL-JUG';
  return 'AKL-ERW';
}

// kids => [0,100,200,300,400,500,600], else => [300,500,1000,1500,2000,2500]
function getFranchiseOptions(altersklasse: string) {
  if (altersklasse === 'AKL-KIN') {
    return [0,100,200,300,400,500,600];
  }
  return [300,500,1000,1500,2000,2500];
}

// We'll maintain a fixed plan type order: Standard => Family doctor => HMO => Other plan types
const planTypeOrder = ['TAR-BASE','TAR-HAM','TAR-HMO','TAR-DIV'] as const;
const planTypeLabels: Record<string,string> = {
  'TAR-BASE': 'Standard',
  'TAR-HAM':  'Family doctor',
  'TAR-HMO':  'HMO',
  'TAR-DIV':  'Other plan types',
};

function groupPlansByType(plans: any[]) {
  // Initialize each group so we keep the correct order
  const grouped: Record<string, any[]> = {
    'TAR-BASE': [],
    'TAR-HAM':  [],
    'TAR-HMO':  [],
    'TAR-DIV':  [],
  };
  for (const p of plans) {
    const typ = p.tariftyp || 'TAR-DIV';
    if (!grouped[typ]) grouped[typ] = [];
    grouped[typ].push(p);
  }
  return grouped;
}

function buildPlansQuery(bagCode: string, inputs: any) {
  const qs = new URLSearchParams({
    bag_code: bagCode,
    canton: inputs.canton || '',
    region: inputs.region || '',
    altersklasse: inputs.altersklasse || '',
    franchise: String(inputs.franchise || 0),
    unfalleinschluss: inputs.unfalleinschluss || 'MIT-UNF'
  });
  return '/api/insurerPlans?' + qs.toString();
}

interface InputPanelProps {
  userInputs: any;
  onUserInputsChange: (vals: any) => void;
  initialPlz?: string;
}

export default function InputPanel({
  userInputs,
  onUserInputsChange,
  initialPlz = ''
}: InputPanelProps) {
  // =========== States for main filtering
  const [yearOfBirth, setYearOfBirth] = useState(userInputs.yearOfBirth || 0);
  const [franchise, setFranchise] = useState(userInputs.franchise || 0);
  const [unfalleinschluss, setUnfalleinschluss] = useState(
    userInputs.unfalleinschluss || 'MIT-UNF'
  );

  // Re-sync from userInputs if changed
  useEffect(() => {
    if (userInputs.yearOfBirth !== yearOfBirth) {
      setYearOfBirth(userInputs.yearOfBirth || 0);
    }
  }, [userInputs.yearOfBirth]);
  useEffect(() => {
    if (userInputs.franchise !== franchise) {
      setFranchise(userInputs.franchise || 0);
    }
  }, [userInputs.franchise]);

  // =========== location
  const [plzInput, setPlzInput] = useState('');
  const [postalMatches, setPostalMatches] = useState<any[]>([]);
  const [selectedPostal, setSelectedPostal] = useState<any | null>(null);

  // =========== insurer
  const [insurerList, setInsurerList] = useState<any[]>([]);
  const [currentInsurerBagCode, setCurrentInsurerBagCode] = useState(
    userInputs.currentInsurerBagCode || ''
  );
  const [currentInsurer, setCurrentInsurer] = useState(
    userInputs.currentInsurer || 'I have no insurer'
  );

  // =========== plan
  const [planList, setPlanList] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState(userInputs.currentPlan || '');

  // =========== saving profiles
  const [profileName, setProfileName] = useState('');
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);

  // If initialPlz is provided, set 'plzInput' on mount
  useEffect(() => {
    if (initialPlz && !plzInput) {
      setPlzInput(initialPlz);
    }
  }, [initialPlz, plzInput]);

  // fetch insurers once
  useEffect(() => {
    fetch('/api/insurers')
      .then((r) => r.json())
      .then((data) => setInsurerList(data))
      .catch((err) => console.error('fetchInsurers error:', err));
  }, []);

  // PLZ autocomplete
  useEffect(() => {
    if (!plzInput) {
      setPostalMatches([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/postal?search=${encodeURIComponent(plzInput)}`)
        .then((r) => r.json())
        .then((data) => setPostalMatches(data))
        .catch(() => setPostalMatches([]));
    }, 300);
    return () => clearTimeout(t);
  }, [plzInput]);

  function handleSelectPostal(row: any) {
    setSelectedPostal(row);
    setPlzInput(row.plz);
    setPostalMatches([]);
  }

  // year => text => parse => no arrow spinners
  function handleYearInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.trim();
    const num = parseInt(val, 10);
    if (Number.isNaN(num)) {
      setYearOfBirth(0);
    } else {
      setYearOfBirth(num);
    }
  }

  // re-fetch plan list if user picks insurer + location + bracket
  useEffect(() => {
    if (!currentInsurerBagCode) {
      setPlanList([]);
      setCurrentPlan('');
      return;
    }
    const ak = computeAltersklasse(yearOfBirth);
    const partial = {
      canton: selectedPostal ? selectedPostal.kanton : '',
      region: selectedPostal ? `PR-REG CH${selectedPostal.region_int}` : '',
      altersklasse: ak,
      franchise,
      unfalleinschluss
    };
    const url = buildPlansQuery(currentInsurerBagCode, partial);

    fetch(url)
      .then((r) => r.json())
      .then((arr) => setPlanList(arr))
      .catch(() => setPlanList([]));
  }, [
    currentInsurerBagCode,
    yearOfBirth,
    franchise,
    unfalleinschluss,
    selectedPostal
  ]);

  // re-sync to parent
  useEffect(() => {
    const ak = computeAltersklasse(yearOfBirth);
    const updated = {
      yearOfBirth,
      franchise,
      unfalleinschluss,
      canton: selectedPostal ? selectedPostal.kanton : '',
      region: selectedPostal ? `PR-REG CH${selectedPostal.region_int}` : '',
      altersklasse: ak,
      currentInsurerBagCode,
      currentInsurer,
      currentPlan
    };
    onUserInputsChange(updated);
  }, [
    yearOfBirth,
    franchise,
    unfalleinschluss,
    selectedPostal,
    currentInsurerBagCode,
    currentInsurer,
    currentPlan,
    onUserInputsChange
  ]);

  // load all profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    try {
      const res = await fetch('/api/profiles');
      const data = await res.json();
      if (data.success) {
        setSavedProfiles(data.profiles);
      }
    } catch (err) {
      console.error('fetchProfiles error:', err);
    }
  }

  // group plan list => fixed order
  function groupPlansByType(planList: any[]) {
    const grouped: Record<string, any[]> = {
      'TAR-BASE': [],
      'TAR-HAM':  [],
      'TAR-HMO':  [],
      'TAR-DIV':  [],
    };
    for (const p of planList) {
      const typ = p.tariftyp || 'TAR-DIV';
      if (!grouped[typ]) grouped[typ] = [];
      grouped[typ].push(p);
    }
    return grouped;
  }
  const grouped = groupPlansByType(planList);
  const ak = computeAltersklasse(yearOfBirth);
  const franchiseOptions = getFranchiseOptions(ak);

  async function handleSaveProfile() {
    if (!selectedPostal) {
      alert('Please select a postal row first.');
      return;
    }
    try {
      const body = {
        profileName,

        // entire selectedPostal
        postalId: selectedPostal.id,
        postalPlz: selectedPostal.plz,
        postalOrtLocalite: selectedPostal.ort_localite,
        postalGemeinde: selectedPostal.gemeinde,
        postalKanton: selectedPostal.kanton,
        postalRegionInt: selectedPostal.region_int,

        yearOfBirth,
        canton: selectedPostal.kanton || '',
        region: `PR-REG CH${selectedPostal.region_int}`,
        franchise,
        currentPlan,
        unfalleinschluss,
        currentInsurerBagCode
      };
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        alert('Profile saved => ' + data.profile.profile_name);
        setProfileName('');
        fetchProfiles();
        resetAllFields(); // after saving
      } else {
        alert('Error saving => ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving');
    }
  }

  function resetAllFields() {
    setYearOfBirth(0);
    setFranchise(0);
    setUnfalleinschluss('MIT-UNF');
    setPlzInput('');
    setSelectedPostal(null);
    setCurrentInsurerBagCode('');
    setCurrentInsurer('I have no insurer');
    setCurrentPlan('');
  }

  async function handleDeleteProfile(id: number) {
    if (!confirm('Delete profile ' + id + '?')) return;
    try {
      const res = await fetch('/api/profiles?id=' + id, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSavedProfiles((prev) => prev.filter((p) => p.id !== data.deletedId));
      } else {
        alert('Delete error => ' + data.error);
      }
    } catch (err) {
      alert('Network error while deleting');
    }
  }

  function handleLoadProfile(p: any) {
    const newPostal = {
      id: p.postal_id,
      plz: p.postal_plz,
      ort_localite: p.postal_ort_localite,
      gemeinde: p.postal_gemeinde,
      kanton: p.postal_kanton,
      region_int: p.postal_region_int,
    };
    setSelectedPostal(newPostal);
    setPlzInput(p.postal_plz || '');

    setYearOfBirth(p.year_of_birth || 0);
    setFranchise(p.franchise || 0);
    setUnfalleinschluss(p.unfalleinschluss || 'MIT-UNF');
    setCurrentPlan(p.current_plan || '');
    setCurrentInsurerBagCode(p.current_insurer_bag_code || '');

    if (p.current_insurer_bag_code) {
      const found = insurerList.find((ins) => ins.bag_code === p.current_insurer_bag_code);
      setCurrentInsurer(found ? found.name : 'Unknown insurer');
    } else {
      setCurrentInsurer('I have no insurer');
    }
    alert('Profile loaded => ' + p.profile_name);
  }

  function canSave() {
    return Boolean(
      yearOfBirth && yearOfBirth !== 0 &&
      selectedPostal &&
      (ak === 'AKL-KIN' ? franchise >= 0 : franchise >= 300) &&
      currentPlan &&
      profileName.trim() !== ''
    );
  }

  // =========================
  // NEW STYLES (BIGGER FONTS)
  // =========================
  const boxStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '10px',
    marginBottom: '1rem',
    padding: '1rem'
  };
  const titleStyle: React.CSSProperties = {
    marginTop: 0,
    fontSize: '1.6rem',
    fontWeight: 'bold',
    marginBottom: '0.8rem',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '1.1rem',
    marginBottom: '0.3rem',
    fontWeight: 500,
  };
  const inputStyle: React.CSSProperties = {
    fontSize: '1rem',
    padding: '0.6rem',
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: '0.8rem',
  };

  return (
    <div>
      {/* Box 1: "Own data" */}
      <div style={boxStyle}>
        <h4 style={titleStyle}>Own data</h4>
        
        {/* Year of Birth */}
        <label style={labelStyle}>Year of Birth</label>
        <input
          type="text"
          inputMode="numeric"
          style={inputStyle}
          value={yearOfBirth || ''}
          onChange={handleYearInput}
        />

        {/* Postal Code */}
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
          <ul style={{ border: '1px solid #ccc', margin: 0, padding: 0 }}>
            {postalMatches.map((row) => (
              <li
                key={row.id}
                style={{ listStyle: 'none', padding: '4px', cursor: 'pointer' }}
                onClick={() => handleSelectPostal(row)}
              >
                {row.plz} {row.ort_localite} ({row.gemeinde})
              </li>
            ))}
          </ul>
        )}
        {/* 
          Removed the old debug box that showed "Selected: 8703 - Erlenbach..."
          as requested 
        */}
      </div>

      {/* Box 2: "Insurance preferences" */}
      <div style={boxStyle}>
        <h4 style={titleStyle}>Insurance preferences</h4>

        {/* Own Risk (Franchise) */}
        <label style={labelStyle}>Own risk</label>
        <select
          style={inputStyle}
          value={franchise}
          onChange={(e) => setFranchise(Number(e.target.value))}
        >
          <option value={0}>--</option>
          {franchiseOptions.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        {/* Accident Coverage */}
        <label style={labelStyle}>Accident coverage</label>
        <select
          style={inputStyle}
          value={unfalleinschluss}
          onChange={(e) => setUnfalleinschluss(e.target.value)}
        >
          <option value="MIT-UNF">With Accident</option>
          <option value="OHN-UNF">Without Accident</option>
        </select>
      </div>

      {/* Box 3: "Current plan" */}
      <div style={boxStyle}>
        <h4 style={titleStyle}>Current plan</h4>

        {/* Current Insurer */}
        <label style={labelStyle}>Current Insurer</label>
        <select
          style={inputStyle}
          value={currentInsurerBagCode}
          onChange={(e) => {
            const val = e.target.value;
            setCurrentInsurerBagCode(val);
            if (!val) {
              setCurrentInsurer('I have no insurer');
            } else {
              const found = insurerList.find((ins) => ins.bag_code === val);
              setCurrentInsurer(found ? found.name : 'Unknown insurer');
            }
          }}
        >
          <option value="">I have no insurer</option>
          {insurerList.map((ins) => (
            <option key={ins.id} value={ins.bag_code}>
              {ins.name}
            </option>
          ))}
        </select>

        {/* Current Plan */}
        {currentInsurerBagCode && (
          <>
            <label style={labelStyle}>Current Plan</label>
            <select
              style={inputStyle}
              value={currentPlan}
              onChange={(e) => setCurrentPlan(e.target.value)}
            >
              <option value="">(None)</option>
              {planTypeOrder.map((typ) => {
                const groupArr = groupPlansByType(planList)[typ] || [];
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
          </>
        )}
      </div>

      {/* Box 4: "Profile name" */}
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
            padding: '0.6rem 1rem',
            background: canSave() ? '#2F62F4' : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: canSave() ? 'pointer' : 'default',
            fontSize: '1rem',
            marginTop: '0.5rem'
          }}
          onClick={handleSaveProfile}
          disabled={!canSave()}
        >
          Save Profile
        </button>
      </div>

      {/* Box 5: "Saved profiles" */}
      <div style={boxStyle}>
        <h4 style={titleStyle}>Saved profiles</h4>
        {savedProfiles.length === 0 ? (
          <p>No profiles saved yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '4px' }}>Profile Name</th>
                <th style={{ textAlign: 'left', padding: '4px' }}>Year</th>
                <th style={{ textAlign: 'left', padding: '4px' }}>Plan</th>
                <th style={{ textAlign: 'left', padding: '4px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {savedProfiles.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: '4px' }}>{p.id}</td>
                  <td style={{ padding: '4px' }}>
                    <span
                      style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => handleLoadProfile(p)}
                    >
                      {p.profile_name}
                    </span>
                  </td>
                  <td style={{ padding: '4px' }}>{p.year_of_birth}</td>
                  <td style={{ padding: '4px' }}>{p.current_plan}</td>
                  <td style={{ padding: '4px' }}>
                    <button
                      style={{ background: 'red', color: '#fff', border: 'none', cursor: 'pointer' }}
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

// ----------------------------------------
// End of file: app/wizard/InputPanel.tsx
// (Lines 1 - 535)
// ----------------------------------------
