'use client';

import React from 'react';
import plansData from '../../data/plans.json';

/** Extract unique insurer names from plans.json */
function getUniqueInsurers(): string[] {
  const s = new Set<string>();
  (plansData as any[]).forEach((p) => {
    s.add(p.insurer);
  });
  return Array.from(s);
}

/** Return plan names for a given insurer */
function getPlansForInsurer(insurer: string): string[] {
  if (insurer === 'I have no insurer') return [];
  const setOfPlans = new Set<string>();
  (plansData as any[]).forEach((plan) => {
    if (plan.insurer === insurer) {
      setOfPlans.add(plan.planName);
    }
  });
  return Array.from(setOfPlans);
}

export default function InputPanel({
  userInputs,
  setUserInputs
}: {
  userInputs: {
    name: string;
    postalCode: string;
    yearOfBirth: string;
    franchise: number;
    currentInsurer: string;
    currentPlan: string;
    unrestrictedAccess: boolean;
  };
  setUserInputs: React.Dispatch<
    React.SetStateAction<{
      name: string;
      postalCode: string;
      yearOfBirth: string;
      franchise: number;
      currentInsurer: string;
      currentPlan: string;
      unrestrictedAccess: boolean;
    }>
  >;
}) {
  // Gather dropdown data
  const insurers = getUniqueInsurers();
  const relevantPlans = getPlansForInsurer(userInputs.currentInsurer);

  /** 
   * We do a type-narrow to handle 'checked' for checkboxes vs. 'value' for selects/inputs.
   */
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name } = e.target;
    let newValue: string | number | boolean;

    if (e.target instanceof HTMLInputElement) {
      if (e.target.type === 'checkbox') {
        newValue = e.target.checked;
      } else if (name === 'franchise') {
        newValue = Number(e.target.value);
      } else {
        newValue = e.target.value;
      }
    } else {
      // it's a <select>
      if (name === 'franchise') {
        newValue = Number(e.target.value);
      } else {
        newValue = e.target.value;
      }
    }

    setUserInputs((prev) => ({
      ...prev,
      [name]: newValue
    }));
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Input Panel</h2>

      <label>Name:</label>
      <input
        name="name"
        value={userInputs.name}
        onChange={handleChange}
      />
      <br />

      <label>Postal Code:</label>
      <input
        name="postalCode"
        value={userInputs.postalCode}
        onChange={handleChange}
      />
      <br />

      <label>Year of Birth:</label>
      <input
        name="yearOfBirth"
        value={userInputs.yearOfBirth}
        onChange={handleChange}
      />
      <br />

      <label>Franchise:</label>
      <select
        name="franchise"
        value={userInputs.franchise}
        onChange={handleChange}
      >
        <option value="300">300</option>
        <option value="500">500</option>
        <option value="1000">1000</option>
        <option value="1500">1500</option>
        <option value="2000">2000</option>
        <option value="2500">2500</option>
      </select>
      <br />

      <label>Current Insurer:</label>
      <select
        name="currentInsurer"
        value={userInputs.currentInsurer}
        onChange={handleChange}
      >
        <option value="I have no insurer">I have no insurer</option>
        {insurers.map((ins) => (
          <option key={ins} value={ins}>{ins}</option>
        ))}
      </select>
      <br />

      <label>Current Plan:</label>
      <select
        name="currentPlan"
        value={userInputs.currentPlan}
        onChange={handleChange}
        disabled={userInputs.currentInsurer === 'I have no insurer'}
      >
        <option value="">No plan selected</option>
        {relevantPlans.map((pn) => (
          <option key={pn} value={pn}>{pn}</option>
        ))}
      </select>
      <br />

      {/* Toggle for 'unrestrictedAccess' => if true => only 'TAR-BASE' in plan options */}
      <label>
        <input
          type="checkbox"
          name="unrestrictedAccess"
          checked={userInputs.unrestrictedAccess}
          onChange={handleChange}
        />
        Unrestricted Access (Only TAR-BASE)
      </label>
    </div>
  );
}
