'use client';

import React from 'react';

export default function SignUpStepsModal({
  onClose,
  plan
}: {
  onClose: () => void;
  plan: any;
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
        <h2>Next Steps for Switching from Sanitas to {plan?.insurer}</h2>        
        <p><strong>Finalize Your Switch</strong></p>
        <ul>
          <li>✅ Send the Sanitas cancellation letter via registered mail. <button>Send Now</button></li>
          <li>✅ Send the {plan?.insurer} registration form via registered mail. <button>Send Now</button></li>
          <li>📩 You will receive confirmation from both insurers.</li>
        </ul>

        <hr />
        <p><strong>Key Rules Under {plan?.insurer}</strong></p>
        <ol>
          <li>Always contact Medgate first for medical issues, etc.</li>
          <li>Direct Access Without Referral: Eye, Gyn, Peds, Emergencies</li>
          <li>Follow the Treatment Plan Strictly or risk losing discount</li>
          <li>Switching model only once per year (notice by Nov 30)</li>
        </ol>

        <hr />
        <p><strong>Immediate Next Steps</strong></p>
        <ul>
          <li>🔹 Track your confirmation</li>
          <li>🔹 Install the Medgate app</li>
        </ul>
        <p>This ensures a smooth transition to {plan?.insurer} starting 01.01.2026. 🚀</p>

        <div style={{ marginTop: '1rem' }}>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
