'use client';

import React from 'react';
import plansData from '../../data/plans.json';

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

    wantsTelePharm: boolean;     // if true => TAR-DIV
    wantsFamilyDocModel: boolean;// if true => TAR-HAM
    wantsHmoModel: boolean;      // if true => TAR-HMO

    hasPreferredDoctor: boolean;     // doc logic if familyDocModel
    preferredDoctorName: string;
  };
  setUserInputs: React.Dispatch<React.SetStateAction<any>>;
}) {
  const insurers = getUniqueInsurers();
  const relevantPlans = getPlansForInsurer(userInputs.currentInsurer);

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
   * If user toggles "I have a preferred doc" radio
   */
  function handleDoctorRadioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const isYes = e.target.value === 'yes';
    setUserInputs((prev) => ({
      ...prev,
      hasPreferredDoctor: isYes,
      preferredDoctorName: isYes ? prev.preferredDoctorName : ''
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

      {/* Unrestricted => only TAR-BASE */}
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

      {/* If not unrestricted => show three toggles for telePharm, family, hmo */}
      {!userInputs.unrestrictedAccess && (
        <div style={{ marginTop: '1rem' }}>
          <p>In the restricted model, pick which plan types to include:</p>

          {/* 1) Telemedicine/Pharmacy => TAR-DIV */}
          <label>
            <input
              type="checkbox"
              name="wantsTelePharm"
              checked={userInputs.wantsTelePharm}
              onChange={handleChange}
            />
            Interested in an alternative model (telemedicine, pharmacy) - TAR-DIV
          </label>
          <br />

          {/* 2) Family doctor => TAR-HAM */}
          <label>
            <input
              type="checkbox"
              name="wantsFamilyDocModel"
              checked={userInputs.wantsFamilyDocModel}
              onChange={handleChange}
            />
            Considering a family doctor model (TAR-HAM)
          </label>

          {/* If wantsFamilyDocModel => show doc question */}
          {userInputs.wantsFamilyDocModel && (
            <div style={{ marginLeft: '1rem' }}>
              <p>Do you have a preferred doctor?</p>
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
          <br />

          {/* 3) HMO => TAR-HMO */}
          <label>
            <input
              type="checkbox"
              name="wantsHmoModel"
              checked={userInputs.wantsHmoModel}
              onChange={handleChange}
            />
            Considering an HMO model (TAR-HMO)
          </label>
        </div>
      )}
    </div>
  );
}
