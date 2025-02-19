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

  // State for the wizard
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

  // Read query params on mount
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

  // Memoize so InputPanel doesn't trigger infinite loops
  const handleUserInputsChange = useCallback((updated: any) => {
    setUserInputs(updated);
  }, []);

  function handleSelectPlan(plan: any) {
    console.log('Selected plan in page:', plan);
  }

  // ------------------------------
  // Layout adjustments:
  // 1) White band at top (50px)
  // 2) Light grey background
  // 3) Slightly smaller left/right blank space => narrower container
  // 4) InputPanel = ~25% width, Middle Panel = ~75%
  // 5) 4 boxes at the top of the middle area
  // ------------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Small white band at the top */}
      <div style={{ background: '#fff', height: '50px', flexShrink: 0 }}>
        {/* Placeholder for logo/menu */}
      </div>

      {/* Light grey background */}
      <div style={{ background: '#f0f0f0', flex: 1, padding: '1rem 0' }}>
        {/* Centered container with narrower maxWidth */}
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            gap: '1rem',
          }}
        >
          {/* Left => narrower input panel (25%) */}
          <div style={{ width: '25%', minWidth: '280px' }}>
            <InputPanel
              userInputs={userInputs}
              onUserInputsChange={handleUserInputsChange}
            />
          </div>

          {/* Right => middle panel (75%) */}
          <div style={{ flex: 1 }}>
            {/* 4 narrow vertical boxes at the top */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              {[1,2,3,4].map((idx) => (
                <div key={idx} style={{
                  flex: 1,
                  background: '#fff',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}>
                  {/* Header with white text on block color */}
                  <div style={{
                    background: '#666',  // or a shade of blue
                    color: '#fff',
                    padding: '0.5rem',
                    fontWeight: 'bold'
                  }}>
                    {`Box #${idx} Title`}
                  </div>

                  {/* Content */}
                  <div style={{ padding: '0.5rem', fontSize: '0.95rem' }}>
                    Some generic content goes here.
                  </div>
                </div>
              ))}
            </div>

            {/* Existing Plan Options Panel below */}
            <PlanOptionsPanel
              userInputs={userInputs}
              onSelectPlan={handleSelectPlan}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
