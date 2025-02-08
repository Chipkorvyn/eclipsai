'use client';

import React, { useState } from 'react';
import InputPanel from './InputPanel';
import PlanOptionsPanel from './PlanOptionsPanel';
import PlanDetailsPanel from './PlanDetailsPanel';

/**
 * Overall parent component controlling:
 * - userInputs (including unrestricted, wantsAlternativeModel, doc preference)
 * - plan options conditionally if basic info is complete
 * - selected plan displayed in PlanDetails
 */
export default function DemoPage() {
  const [userInputs, setUserInputs] = useState({
    name: '',
    postalCode: '',
    yearOfBirth: '',
    franchise: 300,
    currentInsurer: 'I have no insurer',
    currentPlan: '',
    unrestrictedAccess: false,     // if true => only TAR-BASE
    wantsAlternativeModel: false,  // if true => only TAR-DIV (telemedicine, pharmacy)
    hasPreferredDoctor: false,     // only shown if wantsAlternativeModel = false
    preferredDoctorName: ''        // typed doc name
  });

  // The newly selected plan from PlanOptionsPanel
  const [activePlan, setActivePlan] = useState<any>(null);

  // Show plan options only if name, postalCode, yearOfBirth are filled
  const infoComplete =
    userInputs.name.trim() !== '' &&
    userInputs.postalCode.trim() !== '' &&
    userInputs.yearOfBirth.trim() !== '';

  return (
    <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
      {/* Left Column: Input Panel */}
      <div style={{ flex: '1', borderRight: '1px solid #ccc' }}>
        <InputPanel userInputs={userInputs} setUserInputs={setUserInputs} />
      </div>

      {/* Middle Column: Plan Options or "fill out info" message */}
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

      {/* Right Column: Plan Details */}
      <div style={{ flex: '1' }}>
        <PlanDetailsPanel plan={activePlan} />
      </div>
    </div>
  );
}
