'use client';

import React, { useState } from 'react';
import InputPanel from './InputPanel';
import PlanOptionsPanel from './PlanOptionsPanel';
import PlanDetailsPanel from './PlanDetailsPanel';
import CompareModal from './CompareModal';
import ChatBox from './ChatBox';

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

  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareList, setCompareList] = useState<any[]>([]);

  function handleOpenCompare(list: any[]) {
    setCompareList(list);
    setShowCompareModal(true);
  }

  function handleCloseCompare() {
    setShowCompareModal(false);
  }

  return (
    <div style={{ fontFamily: "'Open Sans', sans-serif", minHeight: '100vh', margin: 0 }}>
      {/* Blue banner header */}
      <div style={{
        background: '#2F62F4',
        color: '#fff',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>
          Overpaying for Mandatory Swiss Health Insurance?
        </h1>
      </div>

      {/* Main 3-column layout */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '1rem',
        padding: '1rem'
      }}>
        {/* LEFT PANEL: split vertically between input (top) & chat (bottom) */}
        <div
          style={{
            flex: 1,
            background: '#fff',
            borderRadius: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',

            /* Key part: use flex column so top can scroll, bottom is fixed. */
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Scrollable top area for inputs */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem'
            }}
          >
            <InputPanel userInputs={userInputs} setUserInputs={setUserInputs} />
          </div>

          {/* Bottom chat area: fixed 180px height */}
          <div
            style={{
              flexShrink: 0,
              height: '180px',
              borderTop: '1px solid #ccc',
              position: 'relative'
            }}
          >
            <ChatBox />
          </div>
        </div>

        {/* MIDDLE PANEL: Plan Options */}
        <div
          style={{
            flex: 1,
            background: '#fff',
            borderRadius: '6px',
            padding: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        >
          <PlanOptionsPanel
            userInputs={userInputs}
            onSelectPlan={(plan) => setActivePlan(plan)}
            onOpenCompare={handleOpenCompare}
          />
        </div>

        {/* RIGHT PANEL: Plan Details */}
        <div
          style={{
            flex: 1,
            background: '#fff',
            borderRadius: '6px',
            padding: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        >
          <PlanDetailsPanel plan={activePlan} />
        </div>
      </div>

      <CompareModal
        show={showCompareModal}
        onClose={handleCloseCompare}
        compareList={compareList}
      />
    </div>
  );
}
