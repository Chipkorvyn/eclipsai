'use client';

import React from 'react';

export default function PlanDetailsPanel({ plan }: { plan: any }) {
  if (!plan) {
    return <div style={{ padding: '1rem' }}>No plan selected</div>;
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Plan Details</h2>
      <p>Insurer: {plan.insurer}</p>
      <p>Plan Name: {plan.planName}</p>
      <p>Franchise: {plan.franchise}</p>
      <p>Plan Type: {plan.planType}</p>
      <p>Annual Premium: {Math.round(plan.annualPremium)}</p>

      <button onClick={() => alert('Cancelled previous plan')}>
        Cancel previous plan
      </button>
      <button onClick={() => alert('Sign up in progress...')}>
        Sign up for this plan
      </button>
      <button onClick={() => alert('Automated pilot enabled')}>
        Automated pilot
      </button>
    </div>
  );
}
