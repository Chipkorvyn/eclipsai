'use client';

import React, { useState } from 'react';
import planDetails from '../../data/planDetails.json';

export default function PlanDetailsPanel({
  plan,
  autoPilot
}: {
  plan: any;
  autoPilot?: boolean;
}) {
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  if (!plan) {
    return <div style={{ padding: '1rem' }}>No plan selected</div>;
  }

  // Find the matching extended details by ID
  const detailEntry = (planDetails as any[]).find((d) => d.id === plan.id);
  const extendedText = detailEntry?.extendedDescription || "No extended description found.";

  function handleSignUpClick() {
    setShowSignUpModal(true);
  }

  function handleCloseSignUp() {
    setShowSignUpModal(false);
  }

  return (
    <div style={{ padding: '1rem', position: 'relative' }}>
      <h2>Plan Details</h2>

      <p><strong>Insurer:</strong> {plan.insurer}</p>
      <p><strong>Plan Name:</strong> {plan.planName}</p>
      <p><strong>Franchise:</strong> {plan.franchise}</p>
      <p><strong>Plan Type:</strong> {plan.planType}</p>
      <p><strong>Annual Premium:</strong> {Math.round(plan.annualPremium)}</p>

      <h3>Extended Description</h3>
      <div dangerouslySetInnerHTML={{ __html: extendedText }} />

      {/* We only keep one button -> Sign up for this plan */}
      <button onClick={handleSignUpClick} style={{ marginTop: '1rem' }}>
        Sign up for this plan
      </button>

      {/* SignUpModal -> shows your letter with nice formatting */}
      {showSignUpModal && (
        <SignUpStepsModal onClose={handleCloseSignUp} />
      )}
    </div>
  );
}

/** This is the modal showing the "Next Steps for Switching from Sanitas..." letter. */
function SignUpStepsModal({ onClose }: { onClose: () => void }) {
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  };

  const modalStyle: React.CSSProperties = {
    background: '#fff',
    padding: '1rem',
    width: '600px',
    maxHeight: '80vh',
    overflowY: 'auto'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2>Next Steps for Switching from Sanitas to Vivao Sympany</h2>
        <p>1. Finalizing the Insurance Switch</p>
        <ul>
          <li><strong>✅ Send the Sanitas cancellation letter via registered mail.</strong> – <button>Send</button></li>
          <li><strong>✅ Send the Vivao Sympany registration form via registered mail.</strong> – <button>Send</button></li>
          <li>📩 Wait for confirmation letters from both insurers.</li>
        </ul>

        <hr />
        <p><strong>What to Be Mindful of Under Vivao Sympany’s FlexHelp24 Plan</strong></p>
        <p>📌 <strong>Key Rules for Medical Treatment</strong></p>
        <ol>
          <li>Always contact Medgate first for medical issues.
            <ul>
              <li>You can call +41 844 654 654 or use the Medgate app.</li>
              <li>They coordinate your treatment & provide referrals if needed.</li>
              <li>If you skip this step, Sympany may refuse coverage.</li>
            </ul>
          </li>
          <li>Direct Access Without Referral Allowed for:
            <ul>
              <li>Ophthalmologists (eye doctors)</li>
              <li>Gynecologists (women’s health)</li>
              <li>Pediatricians (for children under 16)</li>
              <li>Emergency departments (urgent care)</li>
            </ul>
            You must inform Medgate after an emergency visit.
          </li>
          <li>Follow the Treatment Plan Strictly.
            <ul>
              <li>If you repeatedly fail to follow the rules, you may lose your premium discount.</li>
            </ul>
          </li>
          <li>Changing Insurance Model:
            <ul>
              <li>You can switch to another model once per year, effective Jan 1, with notice by Nov 30.</li>
            </ul>
          </li>
        </ol>

        <hr />
        <p><strong>Immediate Next Steps</strong></p>
        <ul>
          <li>🔹 Confirm that both letters were received (track registered mail).</li>
          <li>🔹 Install the Medgate app and get familiar with it.</li>
        </ul>
        <p>This ensures a smooth transition to Vivao Sympany starting 01.01.2026. 🚀</p>

        <div style={{ marginTop: '1rem' }}>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
