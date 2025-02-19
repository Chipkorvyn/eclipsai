// app/wizard/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import InputPanel from './InputPanel';
import PlanOptionsPanel from './PlanOptionsPanel';

export default function WizardPage() {
  const searchParams = useSearchParams();
  const queryYob = parseInt(searchParams.get('yob') || '0', 10);
  const queryFranchise = parseInt(searchParams.get('franchise') || '0', 10);

  // This is where we keep the “source of truth.”
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

  // If you want to load the query param for YOB/franchise once on mount:
  useEffect(() => {
    const updates: any = {};
    if (queryYob > 0) {
      updates.yearOfBirth = queryYob;
    }
    if (queryFranchise > 0) {
      updates.franchise = queryFranchise;
    }
    if (Object.keys(updates).length > 0) {
      setUserInputs((prev) => ({ ...prev, ...updates }));
    }
  }, [queryYob, queryFranchise]);

  // ==============================
  // The "magic" => useCallback
  // ==============================
  // Now "onUserInputsChange" is stable across renders, so InputPanel’s effect 
  // won't keep seeing a new function reference each time.
  const handleUserInputsChange = useCallback((updated: any) => {
    setUserInputs(updated);
  }, []);

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

      {/* Right Panel placeholder */}
      <div style={{ width: '300px', borderLeft: '1px solid #ccc' }}>
        <div style={{ padding: '1rem' }}>Right Panel</div>
      </div>
    </div>
  );
}
