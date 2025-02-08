'use client';

import React, { useEffect, useState } from 'react';
import plansData from '../../data/plans.json';

/**
 * Plan structure assumption:
 * {
 *   "id": 1,
 *   "insurer": "Insurer A",
 *   "planName": "Model A 300",
 *   "franchise": 300,
 *   "annualPremium": 4200,
 *   "planType": "TAR-BASE" // or TAR-DIV, TAR-HAM, TAR-HMO
 * }
 */

export default function PlanOptionsPanel({
  userInputs,
  onSelectPlan
}: {
  userInputs: {
    franchise: number;
    currentInsurer: string;
    currentPlan: string;
    unrestrictedAccess: boolean;
  };
  onSelectPlan: (plan: any) => void;
}) {
  const [filteredPlans, setFilteredPlans] = useState<any[]>([]);
  const [currentPremium, setCurrentPremium] = useState<number>(0);

  useEffect(() => {
    // 1) Calculate current premium if user chose a plan
    let premium = 0;
    if (userInputs.currentInsurer !== 'I have no insurer' && userInputs.currentPlan) {
      const found = (plansData as any[]).find(
        (p) =>
          p.insurer === userInputs.currentInsurer &&
          p.planName === userInputs.currentPlan
      );
      premium = found ? found.annualPremium : 0;
    }
    setCurrentPremium(premium);

    // 2) Filter logic
    const results = (plansData as any[]).filter((plan) => {
      // Must match the user's selected franchise
      if (Number(plan.franchise) !== userInputs.franchise) return false;

      // If 'unrestrictedAccess' is true => only show planType='TAR-BASE'
      if (userInputs.unrestrictedAccess) {
        if (plan.planType !== 'TAR-BASE') return false;
      }
      // else show all plan types (TAR-DIV, TAR-HAM, TAR-HMO, TAR-BASE, etc.)

      return true;
    });

    // 3) Sort ascending by annualPremium
    const sorted = results.sort((a, b) => a.annualPremium - b.annualPremium);

    setFilteredPlans(sorted);
  }, [userInputs]);

  // Show the "Savings" column only if user selected an actual plan
  const showSavings =
    userInputs.currentInsurer !== 'I have no insurer' && userInputs.currentPlan !== '';

  // Round any numeric to integer for display
  function formatNumber(num: number): string {
    return Math.round(num).toString();
  }

  // If user selected a plan, we'll show it at the top
  const hasCurrentPlan = showSavings && currentPremium > 0;
  let currentPlanObj: any = null;
  if (hasCurrentPlan) {
    currentPlanObj = (plansData as any[]).find(
      (p) =>
        p.insurer === userInputs.currentInsurer &&
        p.planName === userInputs.currentPlan
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Plan Options</h2>

      {/* 1) If there's a 'current plan' chosen, show it in a single-row table */}
      {hasCurrentPlan && currentPlanObj && (
        <div style={{ marginBottom: '1rem', border: '1px solid #555', padding: '0.5rem' }}>
          <h3>Current Plan</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Insurer</th>
                <th style={{ textAlign: 'left' }}>Plan Name</th>
                <th style={{ textAlign: 'left' }}>Annual Premium</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{currentPlanObj.insurer}</td>
                <td>{currentPlanObj.planName}</td>
                {/* round the premium */}
                <td>{formatNumber(currentPlanObj.annualPremium)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 2) Show how many plans found */}
      <p>Found {filteredPlans.length} matching plans</p>

      {/* 3) Table of plan options */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc' }}>
            <th style={{ textAlign: 'left' }}>Insurer</th>
            <th style={{ textAlign: 'left' }}>Plan Name</th>
            <th style={{ textAlign: 'left' }}>Annual Premium</th>
            {showSavings && <th style={{ textAlign: 'left' }}>Savings</th>}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredPlans.map((plan) => {
            // difference = plan.annualPremium - currentPremium
            let difference = 0;
            if (showSavings) {
              difference = plan.annualPremium - currentPremium;
            }

            // Round plan's premium
            const planPremiumStr = formatNumber(plan.annualPremium);

            // Round the difference too
            const diffStr =
              difference === 0 ? '' : difference > 0 ? `+${Math.round(difference)}` : Math.round(difference).toString();

            return (
              <tr key={plan.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{plan.insurer}</td>
                <td>{plan.planName}</td>
                <td>{planPremiumStr}</td>
                {showSavings && (
                  <td style={{ color: difference < 0 ? 'green' : 'red' }}>
                    {diffStr}
                  </td>
                )}
                <td>
                  <button onClick={() => onSelectPlan(plan)}>Select</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
