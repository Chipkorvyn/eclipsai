'use client';

import React, { useState } from 'react';
import planDetails from '../../data/planDetails.json';
import SignUpStepsModal from './SignUpStepsModal';

export default function PlanDetailsPanel({ plan }: { plan: any }) {
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  // Automated Pilot states
  const [autoPilot, setAutoPilot] = useState(false);
  const [showAutoPilotModal, setShowAutoPilotModal] = useState(false);

  if (!plan) {
    return <div style={{ padding: '1rem' }}>No plan selected</div>;
  }

  // Find extended description
  const detailEntry = (planDetails as any[]).find((d) => d.id === plan.id);
  const extendedText = detailEntry?.extendedDescription || 'No extended description found.';

  // "Switch to This Plan" signup flow
  function handleSignUpClick() {
    setShowSignUpModal(true);
  }
  function handleCloseSignUp() {
    setShowSignUpModal(false);
  }

  // Toggle for "Automated Pilot"
  function handleAutoPilotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.checked;
    if (newValue) {
      // user is switching ON => show the modal
      setShowAutoPilotModal(true);
    } else {
      // user is switching OFF => just set false
      setAutoPilot(false);
    }
  }

  function handleCloseAutoPilotModal() {
    // user pressed "Close" => revert toggle to OFF
    setAutoPilot(false);
    setShowAutoPilotModal(false);
  }

  function handleConfirmAutoPilot() {
    // user pressed "Confirm" => keep toggle ON
    setAutoPilot(true);
    setShowAutoPilotModal(false);
  }

  return (
    <div style={{ padding: '1rem', position: 'relative' }}>
      {/* Small toggle in top-right corner */}
      <div style={{ position: 'absolute', top: '0.5rem', right: '1rem' }}>
        <label style={{ fontWeight: 600, marginRight: '0.5rem' }}>
          Automated Pilot
        </label>
        <input
          type="checkbox"
          checked={autoPilot}
          onChange={handleAutoPilotChange}
          style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
        />
      </div>

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
        <SignUpStepsModal onClose={handleCloseSignUp} plan={plan} />
      )}

      {/* Automated Pilot modal if user toggles ON */}
      {showAutoPilotModal && (
        <AutoPilotModal
          onClose={handleCloseAutoPilotModal}
          onConfirm={handleConfirmAutoPilot}
        />
      )}
    </div>
  );
}

/** A small modal showing the bullet-point text for Automated Pilot features. */
function AutoPilotModal({
  onClose,
  onConfirm
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  };

  const modalStyle: React.CSSProperties = {
    background: '#fff',
    padding: '1rem',
    width: '600px',
    maxHeight: '80vh',
    overflowY: 'auto',
    borderRadius: '6px'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2>Enable Automated Pilot</h2>
        <ol style={{ lineHeight: '1.6' }}>
          <li>
            Based on your current plan, annually (or semiannually) we compare
            your latest premiums vs. alternatives and send you options to switch and save.
          </li>
          <li>
            We monitor feedback on medical service providers you have access to,
            ensuring you balance price and quality.
          </li>
          <li>
            We help manage the admin for your medical and insurance invoices,
            sending communications to the right places.
          </li>
          <li>
            Keep track of payments and reimbursements so you know your total
            spending for medical services.
          </li>
          <li>
            Based on your medical usage, we advise on the best franchise
            (deductible) for maximum savings.
          </li>
          <li>
            Optionally, we can help with advanced payment of medical services,
            letting you access the cheapest insurance.
          </li>
        </ol>

        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              marginRight: '0.5rem',
              background: '#aaa',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '0.4rem 0.8rem',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: '#2F62F4',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '0.5rem 1rem',
              cursor: 'pointer'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
