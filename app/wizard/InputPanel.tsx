'use client';

import React from 'react';
import plansData from '../../data/plans.json';
import ChatBox from './ChatBox';

/**
 * Optional utility if you want to build insurer/plan name dropdowns:
 * getUniqueInsurers, getPlansForInsurer
 */
function getUniqueInsurers(): string[] {
  const s = new Set<string>();
  (plansData as any[]).forEach((p) => {
    s.add(p.insurer);
  });
  return Array.from(s);
}

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

/**
 * Props:
 * userInputs: an object with:
 *   name, postalCode, yearOfBirth, franchise, currentInsurer, currentPlan,
 *   unrestrictedAccess (checkbox => if true => only TAR-BASE),
 *   wantsTelePharm, wantsFamilyDocModel, wantsHmoModel (for restricted scenario toggles),
 *   hasPreferredDoctor, preferredDoctorName
 * setUserInputs: a function to update userInputs state
 */
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
    unrestrictedAccess: boolean; // if true => only TAR-BASE
    wantsTelePharm: boolean;     // if true => include TAR-DIV
    wantsFamilyDocModel: boolean;// if true => include TAR-HAM
    wantsHmoModel: boolean;      // if true => include TAR-HMO
    hasPreferredDoctor: boolean;
    preferredDoctorName: string;
  };
  setUserInputs: React.Dispatch<React.SetStateAction<any>>;
}) {
  // Example usage for insurer + planName dropdowns
  const insurers = getUniqueInsurers();
  const relevantPlans = getPlansForInsurer(userInputs.currentInsurer);

  /**
   * Generic field handler for text, select, checkbox (except doc radio).
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

    setUserInputs((prev: any) => ({
      ...prev,
      [name]: newValue
    }));
  }

  /**
   * Toggle for the "I have a preferred doctor" radio.
   */
  function handleDoctorRadioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const isYes = e.target.value === 'yes';
    setUserInputs((prev: any) => ({
      ...prev,
      hasPreferredDoctor: isYes,
      preferredDoctorName: isYes ? prev.preferredDoctorName : ''
    }));
  }

  return (
    /**
     * We wrap everything in a container that allows the ChatBox
     * to be pinned at the bottom with position:absolute.
     */
    <div style={{
      position: 'relative',
      minHeight: '500px',
      paddingBottom: '150px', // space for chat
      border: '1px solid #ccc'
    }}>
      <div style={{ padding: '1rem' }}>
        <h2>Input Panel</h2>

        {/* Basic user fields */}
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

        {/* Current Insurer + Plan (for user's old plan) */}
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

        {/* If this is true => only show TAR-BASE in plan options */}
        <label>
          <input
            type="checkbox"
            name="unrestrictedAccess"
            checked={userInputs.unrestrictedAccess}
            onChange={handleChange}
          />
          Unrestricted Access (TAR-BASE)
        </label>
        <br />

        {/* If not unrestricted => show 3 toggles: telePharm => TAR-DIV, 
            familyDoc => TAR-HAM, hmo => TAR-HMO */}
        {!userInputs.unrestrictedAccess && (
          <div style={{ marginTop: '1rem' }}>
            <p>Restricted scenario: choose plan types to include:</p>

            <label>
              <input
                type="checkbox"
                name="wantsTelePharm"
                checked={userInputs.wantsTelePharm}
                onChange={handleChange}
              />
              Telemedicine/Pharmacy (TAR-DIV)
            </label>
            <br />

            <label>
              <input
                type="checkbox"
                name="wantsFamilyDocModel"
                checked={userInputs.wantsFamilyDocModel}
                onChange={handleChange}
              />
              Family doctor model (TAR-HAM)
            </label>

            {/* If user selects the family doc model => ask if they have a 
                specific doc or open to any doc in the network */}
            {userInputs.wantsFamilyDocModel && (
              <div style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                <p>Preferred Doctor?</p>
                <label>
                  <input
                    type="radio"
                    name="hasPreferredDoctor"
                    value="no"
                    checked={!userInputs.hasPreferredDoctor}
                    onChange={handleDoctorRadioChange}
                  />
                  I'm open to any family doctor
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
                  I have a specific preferred doctor
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
            <br />

            <label>
              <input
                type="checkbox"
                name="wantsHmoModel"
                checked={userInputs.wantsHmoModel}
                onChange={handleChange}
              />
              HMO model (TAR-HMO)
            </label>
          </div>
        )}
      </div>

      {/* ChatBox pinned at the bottom inside this container */}
      <ChatBox />
    </div>
  );
}
