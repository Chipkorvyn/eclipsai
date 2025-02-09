'use client';

import React from 'react';
import planDetails from '../../data/planDetails.json';

export default function PlanDetailsPanel({ plan }: { plan: any }) {
  if (!plan) {
    return <div style={{ padding: '1rem' }}>No plan selected</div>;
  }

  // Match extended details by ID
  const detailEntry = (planDetails as any[]).find((d) => d.id === plan.id);
  const extendedText = detailEntry?.extendedDescription || "No extended description found.";

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Plan Details</h2>

      <p><strong>Insurer:</strong> {plan.insurer}</p>
      <p><strong>Plan Name:</strong> {plan.planName}</p>
      <p><strong>Franchise:</strong> {plan.franchise}</p>
      <p><strong>Plan Type:</strong> {plan.planType}</p>
      <p><strong>Annual Premium:</strong> {Math.round(plan.annualPremium)}</p>

      <h3>Extended Description</h3>
      {/* Render HTML content directly */}
      <div dangerouslySetInnerHTML={{ __html: extendedText }} />

      <button onClick={() => alert('Cancelled previous plan')}>
        Cancel previous plan
      </button>
      <button onClick={() => alert('Sign up in progress...')} style={{ marginLeft: '0.5rem' }}>
        Sign up for this plan
      </button>
      <button onClick={() => alert('Automated pilot enabled')} style={{ marginLeft: '0.5rem' }}>
        Automated pilot
      </button>
    </div>
  );
}
