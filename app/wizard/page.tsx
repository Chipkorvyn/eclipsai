'use client';

import React, { useState } from 'react';
import InputPanel from './InputPanel';
import PlanOptionsPanel from './PlanOptionsPanel';
import PlanDetailsPanel from './PlanDetailsPanel';
import CompareModal from './CompareModal';

export default function DemoPage() {
  const [userInputs, setUserInputs] = useState({
    name: '',
    postalCode: '',
    yearOfBirth: '',
    franchise: 300,
    currentInsurer: 'I have no insurer',
    currentPlan: '',
    unrestrictedAccess: false,
    wantsTelePharm: false,
    wantsFamilyDocModel: false,
    wantsHmoModel: false,
    hasPreferredDoctor: false,
    preferredDoctorName: ''
  });

  const [activePlan, setActivePlan] = useState<any>(null);

  // For the compare modal
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareList, setCompareList] = useState<any[]>([]);

  // "Automated pilot" toggle in top-right corner
  const [autoPilot, setAutoPilot] = useState(false);

  // Check if basic info is complete
  const infoComplete =
    userInputs.name.trim() !== '' &&
    userInputs.postalCode.trim() !== '' &&
    userInputs.yearOfBirth.trim() !== '';

  function handleOpenCompare(comparePlans: any[]) {
    setCompareList(comparePlans);
    setShowCompareModal(true);
  }

  function handleCloseCompare() {
    setShowCompareModal(false);
  }

  return (
    <>
      {/* A small top-right bar for the automated pilot toggle */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: '#fff',
        border: '1px solid #ccc',
        padding: '0.5rem',
        zIndex: 999
      }}>
        <label style={{ marginRight: '0.5rem' }}>
          Automated Pilot
        </label>
        <input
          type="checkbox"
          checked={autoPilot}
          onChange={(e) => setAutoPilot(e.target.checked)}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
        <div style={{ flex: '1', borderRight: '1px solid #ccc' }}>
          <InputPanel userInputs={userInputs} setUserInputs={setUserInputs} />
        </div>

        <div style={{ flex: '1', borderRight: '1px solid #ccc' }}>
          {infoComplete ? (
            <PlanOptionsPanel
              userInputs={userInputs}
              onSelectPlan={(plan) => setActivePlan(plan)}
              onOpenCompare={handleOpenCompare}
            />
          ) : (
            <div style={{ padding: '1rem' }}>
              <h2>No Plan Options Yet</h2>
              <p>Please fill out Name, Postal Code, and Year of Birth.</p>
            </div>
          )}
        </div>

        <div style={{ flex: '1' }}>
          {/* We pass autoPilot as a prop if we want PlanDetailsPanel to know the current autopilot state */}
          <PlanDetailsPanel plan={activePlan} autoPilot={autoPilot} />
        </div>
      </div>

      <CompareModal
        show={showCompareModal}
        onClose={handleCloseCompare}
        compareList={compareList}
      />
    </>
  );
}
