'use client';

import React, { useState } from 'react';
import InputPanel from './InputPanel';
import PlanOptionsPanel from './PlanOptionsPanel';
import PlanDetailsPanel from './PlanDetailsPanel';

/**
 * This is the parent layout controlling:
 * - userInputs (including unrestricted, telePharm, familyDoc, hmo)
 * - shows plan options if name/postal/YOB are filled
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
    unrestrictedAccess: false, // if true => show only TAR-BASE

    // For restricted scenario:
    wantsTelePharm: false,     // if true => include TAR-DIV
    wantsFamilyDocModel: false,// if true => include TAR-HAM
    wantsHmoModel: false,      // if true => include TAR-HMO

    // "family doctor" logic:
    hasPreferredDoctor: false,     // if user picks "family doc model" yes
    preferredDoctorName: ''        // typed doc name
  });

  const [activePlan, setActivePlan] = useState<any>(null);

  // Only show plan options if name/postal code/yearOfBirth are non-blank
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

      {/* MIDDLE COLUMN: Plan options or fill-out-info message */}
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

      {/* RIGHT COLUMN: Plan details */}
      <div style={{ flex: '1' }}>
        <PlanDetailsPanel plan={activePlan} />
      </div>
    </div>
  );
}
