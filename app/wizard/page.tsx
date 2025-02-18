// app/wizard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import InputPanel from './InputPanel';
import PlanOptionsPanel from './PlanOptionsPanel';

export default function WizardPage() {
  // 1) Read query params
  const searchParams = useSearchParams();
  const queryYob = parseInt(searchParams.get('yob') || '0', 10);
  const queryFranchise = parseInt(searchParams.get('franchise') || '0', 10);

  // 2) Keep them in state
  const [userInputs, setUserInputs] = useState({
    yearOfBirth: 0,
    franchise: 0,
    unfalleinschluss: 'MIT-UNF',
    canton: '',
    region: '',
    altersklasse: '',
    currentInsurerBagCode: '',
    currentInsurer: 'I have no insurer',
    currentPlan: '',
  });

  // 3) On mount, apply the query param values
  useEffect(() => {
    const updates: any = {};
    if (queryYob > 0) {
      updates.yearOfBirth = queryYob;
    }
    if (queryFranchise > 0) {
      updates.franchise = queryFranchise;
    }
    // If we have any updates, apply them
    if (Object.keys(updates).length > 0) {
      setUserInputs((prev) => ({ ...prev, ...updates }));
    }
  }, [queryYob, queryFranchise]);

  // 4) Called by InputPanel when user changes something
  function handleUserInputsChange(updated: any) {
    setUserInputs(updated);
  }

  // 5) Plan selection from PlanOptionsPanel
  function handleSelectPlan(plan: any) {
    console.log('Selected plan in page:', plan);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left Panel => InputPanel */}
      <div style={{ width: '300px', borderRight: '1px solid #ccc' }}>
        <InputPanel
          userInputs={userInputs}
          onUserInputsChange={handleUserInputsChange}
        />
      </div>

      {/* Middle Panel => PlanOptionsPanel */}
      <div style={{ flex: 1, padding: '1rem' }}>
        <PlanOptionsPanel
          userInputs={userInputs}
          onSelectPlan={handleSelectPlan}
        />
      </div>

      {/* Right Panel */}
      <div style={{ width: '300px', borderLeft: '1px solid #ccc' }}>
        <div style={{ padding: '1rem' }}>Right Panel</div>
      </div>
    </div>
  );
}
