'use client';

import React, { useState } from 'react';
import InputPanel from './InputPanel';
import PlanOptionsPanel from './PlanOptionsPanel';
import PlanDetailsPanel from './PlanDetailsPanel';
import CompareModal from './CompareModal';

export default function DemoPage() {
  // userInputs as before
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

  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareList, setCompareList] = useState<any[]>([]);

  // only show plan options if user filled name, postal, YOB
  const infoComplete =
    userInputs.name.trim() !== '' &&
    userInputs.postalCode.trim() !== '' &&
    userInputs.yearOfBirth.trim() !== '';

  function handleOpenCompare(comparePlans: any[]) {
    // store the array
    setCompareList(comparePlans);
    // open modal
    setShowCompareModal(true);
  }

  function handleCloseCompare() {
    setShowCompareModal(false);
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
        <div style={{ flex: '1', borderRight: '1px solid #ccc' }}>
          <InputPanel userInputs={userInputs} setUserInputs={setUserInputs} />
        </div>

        <div style={{ flex: '1', borderRight: '1px solid #ccc' }}>
          {infoComplete ? (
            <PlanOptionsPanel
              userInputs={userInputs}
              onSelectPlan={(plan) => setActivePlan(plan)}
              onOpenCompare={handleOpenCompare} // pass callback
            />
          ) : (
            <div style={{ padding: '1rem' }}>
              <h2>No Plan Options Yet</h2>
              <p>Please fill out Name, Postal Code, and Year of Birth.</p>
            </div>
          )}
        </div>

        <div style={{ flex: '1' }}>
          <PlanDetailsPanel plan={activePlan} />
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
