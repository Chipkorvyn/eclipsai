// app/wizard/page.tsx
'use client';

import React, { useState } from 'react';
import InputPanel from './InputPanel';
import PlanOptionsPanel from './PlanOptionsPanel';

export default function WizardPage() {
  // Start with yearOfBirth=0, franchise=0 => no plan fetch until user picks real values
  const [userInputs, setUserInputs] = useState({
    yearOfBirth: 0,
    franchise: 0,
    unfalleinschluss: 'MIT-UNF',
    canton: '',
    region: '',
    altersklasse: '',
    unrestrictedAccess: false,
    wantsTelePharm: false,
    wantsFamilyDocModel: false,
    wantsHmoModel: false,
    hasPreferredDoctor: false,
    preferredDoctorName: '',
    currentInsurer: 'I have no insurer',
    currentInsurerBagCode: '',
    currentPlan: '',
  });

  function handleUserInputsChange(updated: any) {
    setUserInputs(updated);
  }

  function handleSelectPlan(plan: any) {
    console.log('Selected plan:', plan);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left panel => InputPanel */}
      <div style={{ width: '300px', borderRight: '1px solid #ccc' }}>
        <InputPanel userInputs={userInputs} onUserInputsChange={handleUserInputsChange} />
      </div>

      {/* Middle panel => PlanOptionsPanel */}
      <div style={{ flex: 1, padding: '1rem' }}>
        <PlanOptionsPanel
          userInputs={userInputs}
          onSelectPlan={handleSelectPlan}
        />
      </div>

      {/* Right panel placeholder */}
      <div style={{ width: '300px', borderLeft: '1px solid #ccc' }}>
        <div style={{ padding: '1rem' }}>Right Panel</div>
      </div>
    </div>
  );
}
