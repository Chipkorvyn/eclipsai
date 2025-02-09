'use client';

import React, { useState } from 'react';
import planDetails from '../../data/planDetails.json';
import SignUpStepsModal from './SignUpStepsModal';

export default function PlanDetailsPanel({ plan }: { plan: any }) {
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  if (!plan) return <div style={{ padding: '1rem' }}>No plan selected</div>;

  const detailEntry = (planDetails as any[]).find((d) => d.id === plan.id);
  const extendedText = detailEntry?.extendedDescription || 'No extended description found.';

  function handleSignUpClick() {
    setShowSignUpModal(true);
  }
  function handleCloseModal() {
    setShowSignUpModal(false);
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Plan Details</h2>
      <p><strong>Insurer:</strong> {plan.insurer}</p>
      <p><strong>Plan Name:</strong> {plan.planName}</p>
      <p><strong>Franchise:</strong> {plan.franchise}</p>
      <p><strong>Plan Type:</strong> {plan.planType}</p>
      <p><strong>Annual Premium:</strong> {Math.round(plan.annualPremium)}</p>

      <h3>More About This Plan</h3>
      <div dangerouslySetInnerHTML={{ __html: extendedText }} />

      <button
        onClick={handleSignUpClick}
        style={{
          marginTop: '1rem',
          background: '#2F62F4',
          color: '#fff',
          padding: '0.5rem 1rem',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Switch to This Plan
      </button>

      {showSignUpModal && (
        <SignUpStepsModal onClose={handleCloseModal} plan={plan} />
      )}
    </div>
  );
}
