'use client';

import React, { useState } from 'react';
import InputPanel from './InputPanel';
import PlanOptionsPanel from './PlanOptionsPanel';
import PlanDetailsPanel from './PlanDetailsPanel';

/**
 * This page orchestrates:
 * - userInputs (including doctor preference)
 * - conditional rendering of PlanOptions if basic info is complete
 * - activePlan for PlanDetails
 */
export default function DemoPage() {
  // The user's input state
  const [userInputs, setUserInputs] = useState({
    name: '',
    postalCode: '',
    yearOfBirth: '',
    franchise: 300,
    currentInsurer: 'I have no insurer',
    currentPlan: '',
    unrestrictedAccess: false,      // if true => only show planType='TAR-BASE'
    hasPreferredDoctor: false,      // radio: false= “any provider,” true= “preferred doc”
    preferredDoctorName: ''         // typed doc name
  });

  // The newly selected plan from the middle column
  const [activePlan, setActivePlan] = useState<any>(null);

  // Only show plan options if name, postal code, and YOB are not blank
  const infoComplete =
    userInputs.name.trim() !== '' &&
    userInputs.postalCode.trim() !== '' &&
    userInputs.yearOfBirth.trim() !== '';

  return (
    <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
      {/* LEFT COLUMN: Input panel */}
      <div style={{ flex: '1', borderRight: '1px solid #ccc' }}>
        <InputPanel userInputs={userInputs} setUserInputs={setUserInputs} />
      </div>

      {/* MIDDLE COLUMN: Plan Options or “fill out info” message */}
      <div style={{ flex: '1', borderRight: '1px solid #ccc' }}>
        {infoComplete ? (
          <PlanOptionsPanel
            userInputs={userInputs}
            onSelectPlan={(plan) => setActivePlan(plan)}
          />
        ) : (
          <div style={{ padding: '1rem' }}>
            <h2>No Plan Options Yet</h2>
            <p>Please fill out Name, Postal Code, and Year of Birth.</p>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Plan Details */}
      <div style={{ flex: '1' }}>
        <PlanDetailsPanel plan={activePlan} />
      </div>
    </div>
  );
}
