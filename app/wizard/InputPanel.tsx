'use client';

import React from 'react';
import plansData from '../../data/plans.json';

/** Return unique insurer names from plans.json */
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
    hasPreferredDoctor: boolean;
    preferredDoctorName: string;
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
      hasPreferredDoctor: boolean;
      preferredDoctorName: string;
    }>
  >;
}) {
  // Insurers for the dropdown
  const insurers = getUniqueInsurers();
  // Plans relevant to whichever insurer is chosen
  const relevantPlans = getPlansForInsurer(userInputs.currentInsurer);

  /**
   * handleChange: handles text inputs, selects, checkboxes (except for the doctor radio).
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
      // It's a <select>
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

  /**
   * handleDoctorRadioChange: toggles hasPreferredDoctor. 
   * If user picks “no,” we clear the preferredDoctorName.
   */
  function handleDoctorRadioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const isYes = e.target.value === 'yes';
    setUserInputs((prev) => ({
      ...prev,
      hasPreferredDoctor: isYes,
      preferredDoctorName: isYes ? prev.preferredDoctorName : '' // clear name if “no”
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

      {/* If user checks -> only planType='TAR-BASE' in PlanOptionsPanel */}
      <label>
        <input
          type="checkbox"
          name="unrestrictedAccess"
          checked={userInputs.unrestrictedAccess}
          onChange={handleChange}
        />
        Unrestricted Access (TAR-BASE only)
      </label>
      <br />

      {/* Family doctor preference only relevant if unrestrictedAccess = false */}
      {!userInputs.unrestrictedAccess && (
        <div style={{ marginTop: '1rem' }}>
          <p>Do you have a preferred family doctor?</p>
          <label>
            <input
              type="radio"
              name="hasPreferredDoctor"
              value="no"
              checked={!userInputs.hasPreferredDoctor}
              onChange={handleDoctorRadioChange}
            />
            I'm open to any provider
          </label>
          <br />
          <label>
            <input
              type="radio"
              name="hasPreferredDoctor"
              value="yes"
              checked={userInputs.hasPreferredDoctor}
              onChange={handleDoctorRadioChange}
            />
            I have a preferred doctor
          </label>

          {userInputs.hasPreferredDoctor && (
            <div>
              <label>Please enter your doctor's name:</label>
              <input
                name="preferredDoctorName"
                value={userInputs.preferredDoctorName}
                onChange={handleChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
