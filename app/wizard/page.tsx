'use client';

import React, { useState } from 'react';
import InputPanel from './InputPanel';
import PlanOptionsPanel from './PlanOptionsPanel';

function PlanDetailsPanel({ plan }: { plan: any }) {
  if (!plan) return <div style={{ padding: '1rem' }}>No plan selected</div>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Plan Details Panel</h2>
      <p>Plan Name: {plan.planName}</p>
    </div>
  );
}

export default function DemoPage() {
  const [activePlan, setActivePlan] = useState(null);

  const [userInputs, setUserInputs] = useState({
    name: '',
    postalCode: '',
    yearOfBirth: '',
    franchise: 300,
    currentInsurer: 'I have no insurer',  // default
    currentPlan: '',
    unrestrictedAccess: false, // or false
    telemedicinePreference: false,
    pharmacyModel: false
    // add any other fields from your original idea
  });

  // 1) Check if basic info is filled
  const infoComplete =
    userInputs.name.trim() !== '' &&
    userInputs.postalCode.trim() !== '' &&
    userInputs.yearOfBirth.trim() !== '';

  return (
    <div style={{ display: 'flex' }}>
      {/* LEFT PANEL: Input */}
      <InputPanel userInputs={userInputs} setUserInputs={setUserInputs} />

      {/* MIDDLE PANEL: Plan Options (only shows if infoComplete) */}
      {infoComplete ? (
        <PlanOptionsPanel
          userInputs={userInputs}
          onSelectPlan={(plan) => setActivePlan(plan)}
        />
      ) : (
        <div style={{ padding: '1rem' }}>
          Please fill out name, postal code, and YOB
        </div>
      )}

      {/* RIGHT PANEL: Plan Details */}
      <PlanDetailsPanel plan={activePlan} />
    </div>
  );
}
