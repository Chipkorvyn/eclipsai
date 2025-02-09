'use client';

import React, { useEffect, useState } from 'react';
import plansData from '../../data/plans.json';

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
    wantsTelePharm: boolean;
    wantsFamilyDocModel: boolean;
    wantsHmoModel: boolean;
    hasPreferredDoctor: boolean;
    preferredDoctorName: string;
  };
  setUserInputs: React.Dispatch<React.SetStateAction<any>>;
}) {
  const [insurers, setInsurers] = useState<string[]>([]);
  const [plansForInsurer, setPlansForInsurer] = useState<string[]>([]);

  useEffect(() => {
    // gather unique insurer names
    const setOfIns = new Set<string>();
    (plansData as any[]).forEach((p) => {
      setOfIns.add(p.insurer);
    });
    setInsurers(Array.from(setOfIns));
  }, []);

  useEffect(() => {
    // gather plan names for the chosen insurer
    if (userInputs.currentInsurer === 'I have no insurer') {
      setPlansForInsurer([]);
      return;
    }
    const setOfPlans = new Set<string>();
    (plansData as any[]).forEach((p) => {
      if (p.insurer === userInputs.currentInsurer) {
        setOfPlans.add(p.planName);
      }
    });
    setPlansForInsurer(Array.from(setOfPlans));
  }, [userInputs.currentInsurer]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, type, value } = e.target;
    let newVal: string | number | boolean = value;

    if (type === 'checkbox') {
      newVal = (e.target as HTMLInputElement).checked;
    }
    if (name === 'franchise') {
      newVal = Number(value);
    }

    setUserInputs((prev) => ({
      ...prev,
      [name]: newVal
    }));
  }

  return (
    <div style={{ position: 'relative' }}>
      <h3>Your Personal Info</h3>
      <label style={labelStyle}>Name</label>
      <input
        name="name"
        value={userInputs.name}
        onChange={handleChange}
        style={inputStyle}
      />

      <label style={labelStyle}>Postal Code</label>
      <input
        name="postalCode"
        value={userInputs.postalCode}
        onChange={handleChange}
        style={inputStyle}
      />

      <label style={labelStyle}>Year of Birth</label>
      <input
        name="yearOfBirth"
        value={userInputs.yearOfBirth}
        onChange={handleChange}
        style={inputStyle}
      />

      <h3>Franchise (Deductible)</h3>
      <input
        type="range"
        name="franchise"
        min={300}
        max={2500}
        step={200}
        value={userInputs.franchise}
        onChange={handleChange}
        style={{ width: '100%' }}
      />
      <div style={{ marginTop: '0.5rem' }}>
        Current Deductible: <strong>{userInputs.franchise} CHF</strong>
      </div>

      <h3>Your Current Service</h3>

      <label style={labelStyle}>Current Insurer</label>
      <select
        name="currentInsurer"
        value={userInputs.currentInsurer}
        onChange={handleChange}
        style={inputStyle}
      >
        <option value="I have no insurer">I have no insurer</option>
        {insurers.map((ins) => (
          <option key={ins} value={ins}>
            {ins}
          </option>
        ))}
      </select>

      <label style={labelStyle}>Current Plan</label>
      <select
        name="currentPlan"
        value={userInputs.currentPlan}
        onChange={handleChange}
        disabled={userInputs.currentInsurer === 'I have no insurer'}
        style={inputStyle}
      >
        <option value="">No plan selected</option>
        {plansForInsurer.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <h3>Provider Choice</h3>
      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        <input
          type="checkbox"
          name="unrestrictedAccess"
          checked={userInputs.unrestrictedAccess}
          onChange={handleChange}
        />{' '}
        Freedom to choose any provider (most expensive)
      </label>

      {!userInputs.unrestrictedAccess && (
        <div style={{ marginLeft: '0rem' }}>
          <h4>Managed Care Options (10–25% cheaper)</h4>

          <label style={{ display: 'block', marginBottom: '0.3rem', marginLeft: '1rem' }}>
            <input
              type="checkbox"
              name="wantsTelePharm"
              checked={userInputs.wantsTelePharm}
              onChange={handleChange}
            />{' '}
            Telemedicine / Pharmacy-first Model
          </label>

          <label style={{ display: 'block', marginBottom: '0.3rem', marginLeft: '1rem' }}>
            <input
              type="checkbox"
              name="wantsFamilyDocModel"
              checked={userInputs.wantsFamilyDocModel}
              onChange={handleChange}
            />{' '}
            Family Doctor Model
          </label>

          {userInputs.wantsFamilyDocModel && (
            <div style={{ marginLeft: '2rem', marginTop: '0.3rem' }}>
              <label>
                <input
                  type="checkbox"
                  name="hasPreferredDoctor"
                  checked={userInputs.hasPreferredDoctor}
                  onChange={handleChange}
                />{' '}
                I have a preferred doctor
              </label>

              {userInputs.hasPreferredDoctor && (
                <div>
                  <label style={labelStyle}>Doctor Name</label>
                  <input
                    name="preferredDoctorName"
                    value={userInputs.preferredDoctorName}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
              )}
            </div>
          )}

          <label style={{ display: 'block', marginBottom: '0.3rem', marginLeft: '1rem' }}>
            <input
              type="checkbox"
              name="wantsHmoModel"
              checked={userInputs.wantsHmoModel}
              onChange={handleChange}
            />{' '}
            HMO Model (Assigned Clinic)
          </label>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontWeight: 600,
  marginTop: '0.5rem',
  display: 'block'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.4rem',
  marginBottom: '0.5rem',
  borderRadius: '4px',
  border: '1px solid #ccc'
};
