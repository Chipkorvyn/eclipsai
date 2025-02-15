// app/wizard/InputPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';

function computeAltersklasse(yob: number): string {
  if (!yob || yob <= 0) return '';
  const age = 2025 - yob;
  if (age <= 18) return 'AKL-KIN';
  if (age <= 25) return 'AKL-JUG';
  return 'AKL-ERW';
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

export default function InputPanel({ userInputs, onUserInputsChange }) {
  const [yearOfBirth, setYearOfBirth] = useState(userInputs.yearOfBirth || 0);
  const [franchise, setFranchise] = useState(userInputs.franchise || 300);
  const [unfalleinschluss, setUnfalleinschluss] = useState(userInputs.unfalleinschluss || 'MIT-UNF');

  const [plzInput, setPlzInput] = useState('');
  const [postalMatches, setPostalMatches] = useState([]);
  const [selectedPostal, setSelectedPostal] = useState(null);

  const [insurerList, setInsurerList] = useState([]);
  const [currentInsurerBagCode, setCurrentInsurerBagCode] = useState(
    userInputs.currentInsurerBagCode || ''
  );
  const [currentInsurer, setCurrentInsurer] = useState(
    userInputs.currentInsurer || 'I have no insurer'
  );

  // Plans for "Current Plan" dropdown
  const [planList, setPlanList] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(userInputs.currentPlan || '');

  // Toggles
  const [unrestrictedAccess, setUnrestrictedAccess] = useState(userInputs.unrestrictedAccess || false);
  const [wantsTelePharm, setWantsTelePharm] = useState(userInputs.wantsTelePharm || false);
  const [wantsFamilyDocModel, setWantsFamilyDocModel] = useState(userInputs.wantsFamilyDocModel || false);
  const [wantsHmoModel, setWantsHmoModel] = useState(userInputs.wantsHmoModel || false);
  const [preferredDoctorName, setPreferredDoctorName] = useState(userInputs.preferredDoctorName || '');
  const [hasPreferredDoctor, setHasPreferredDoctor] = useState(userInputs.hasPreferredDoctor || false);

  // ============== A) Fetch insurers
  useEffect(() => {
    fetch('/api/insurers')
      .then((r) => r.json())
      .then((data) => setInsurerList(data))
      .catch((err) => console.error('fetchInsurers error:', err));
  }, []);

  // ============== B) PLZ Autocomplete
  useEffect(() => {
    if (!plzInput) {
      setPostalMatches([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/postal?search=${encodeURIComponent(plzInput)}`)
        .then((r) => r.json())
        .then((data) => setPostalMatches(data))
        .catch(() => setPostalMatches([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [plzInput]);

  function handleSelectPostal(row: any) {
    setSelectedPostal(row);
    setPlzInput(row.plz);
    setPostalMatches([]);
  }

  // ============== C) Re-Fetch plan list if insurer+location+age
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
      unfalleinschluss,
    };
    const url = buildPlansQuery(currentInsurerBagCode, partial);

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then((arr) => {
        // arr => [{ distinctTarif, distinctLabel }]
        setPlanList(arr);
      })
      .catch(() => setPlanList([]));
  }, [
    currentInsurerBagCode,
    yearOfBirth,
    franchise,
    unfalleinschluss,
    selectedPostal
  ]);

  // ============== D) Pass everything up to parent
  useEffect(() => {
    const ak = computeAltersklasse(yearOfBirth);
    const updated = {
      yearOfBirth,
      franchise,
      unfalleinschluss,
      canton: selectedPostal ? selectedPostal.kanton : '',
      region: selectedPostal ? `PR-REG CH${selectedPostal.region_int}` : '',
      altersklasse: ak,
      unrestrictedAccess,
      wantsTelePharm,
      wantsFamilyDocModel,
      wantsHmoModel,
      hasPreferredDoctor,
      preferredDoctorName,
      currentInsurerBagCode,
      currentInsurer,
      currentPlan,
    };
    // Avoid infinite loop => do not include onUserInputsChange in deps
    onUserInputsChange(updated);
  }, [
    yearOfBirth,
    franchise,
    unfalleinschluss,
    selectedPostal,
    unrestrictedAccess,
    wantsTelePharm,
    wantsFamilyDocModel,
    wantsHmoModel,
    hasPreferredDoctor,
    preferredDoctorName,
    currentInsurerBagCode,
    currentInsurer,
    currentPlan
  ]);

  return (
    <div style={{ padding: '1rem' }}>
      <h3>Input Panel</h3>
      <div>
        <label>Year of Birth: </label>
        <input
          type="number"
          value={yearOfBirth || ''}
          onChange={(e) => setYearOfBirth(Number(e.target.value))}
        />
      </div>
      <div>
        <label>Accident Coverage: </label>
        <select
          value={unfalleinschluss}
          onChange={(e) => setUnfalleinschluss(e.target.value)}
        >
          <option value="MIT-UNF">With Accident</option>
          <option value="OHN-UNF">Without Accident</option>
        </select>
      </div>
      <div>
        <label>Franchise: </label>
        <input
          type="number"
          value={franchise}
          onChange={(e) => setFranchise(Number(e.target.value))}
        />
      </div>

      <div>
        <label>PLZ: </label>
        <input
          type="text"
          value={plzInput}
          onChange={(e) => {
            setPlzInput(e.target.value);
            setSelectedPostal(null);
          }}
        />
        {postalMatches.length > 0 && !selectedPostal && (
          <ul style={{ border: '1px solid #ccc', margin: 0, padding: 0 }}>
            {postalMatches.map((row: any) => (
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
      </div>
      {selectedPostal && (
        <div style={{ background: '#f5f5f5', padding: '0.5rem', marginTop: '0.5rem' }}>
          <p>Selected: {selectedPostal.plz} - {selectedPostal.ort_localite}</p>
          <p>Canton: {selectedPostal.kanton}, Region: PR-REG CH{selectedPostal.region_int}</p>
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <label>
          <input
            type="checkbox"
            checked={unrestrictedAccess}
            onChange={(e) => setUnrestrictedAccess(e.target.checked)}
          />
          Unrestricted Access
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={wantsTelePharm}
            onChange={(e) => setWantsTelePharm(e.target.checked)}
          />
          TelePharm
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={wantsFamilyDocModel}
            onChange={(e) => setWantsFamilyDocModel(e.target.checked)}
          />
          Family Doctor
        </label>
        {wantsFamilyDocModel && (
          <div style={{ marginTop: '0.5rem' }}>
            <label>Preferred Doctor: </label>
            <input
              type="text"
              value={preferredDoctorName}
              onChange={(e) => {
                setPreferredDoctorName(e.target.value);
                setHasPreferredDoctor(!!e.target.value.trim());
              }}
            />
          </div>
        )}
        <br />
        <label>
          <input
            type="checkbox"
            checked={wantsHmoModel}
            onChange={(e) => setWantsHmoModel(e.target.checked)}
          />
          HMO Model
        </label>
      </div>

      {/* Current Insurer */}
      <div style={{ marginTop: '1rem' }}>
        <label>Current Insurer: </label>
        <select
          value={currentInsurerBagCode}
          onChange={(e) => {
            const val = e.target.value;
            setCurrentInsurerBagCode(val);
            if (!val) {
              setCurrentInsurer('I have no insurer');
            } else {
              const found = insurerList.find((ins: any) => ins.bag_code === val);
              if (found) setCurrentInsurer(found.name);
            }
          }}
        >
          <option value="">I have no insurer</option>
          {insurerList.map((ins: any) => (
            <option key={ins.id} value={ins.bag_code}>
              {ins.name}
            </option>
          ))}
        </select>
      </div>

      {/* Current Plan dropdown from planList */}
      {currentInsurerBagCode && (
        <div style={{ marginTop: '0.5rem' }}>
          <label>Current Plan: </label>
          <select
            value={currentPlan}
            onChange={(e) => setCurrentPlan(e.target.value)}
          >
            <option value="">(None)</option>
            {planList.map((p: any) => (
              <option key={p.distinctTarif} value={p.distinctTarif}>
                {p.distinctLabel}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
