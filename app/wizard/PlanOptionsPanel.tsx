'use client';

import React, { useEffect, useState } from 'react';
import plansData from '../../data/plans.json';
import doctorsData from '../../data/doctors.json';  // new file for doctor associations

export default function PlanOptionsPanel({
  userInputs,
  onSelectPlan
}: {
  userInputs: {
    franchise: number;
    currentInsurer: string;
    currentPlan: string;
    unrestrictedAccess: boolean;
    hasPreferredDoctor: boolean;
    preferredDoctorName: string;
  };
  onSelectPlan: (plan: any) => void;
}) {
  const [filteredPlans, setFilteredPlans] = useState<any[]>([]);
  const [currentPremium, setCurrentPremium] = useState<number>(0);

  useEffect(() => {
    // 1) Determine the user's current plan premium if they selected insurer+plan+franchise
    let premium = 0;
    if (
      userInputs.currentInsurer !== 'I have no insurer' &&
      userInputs.currentPlan !== ''
    ) {
      const found = (plansData as any[]).find(
        (p) =>
          p.insurer === userInputs.currentInsurer &&
          p.planName === userInputs.currentPlan &&
          Number(p.franchise) === userInputs.franchise
      );
      premium = found ? found.annualPremium : 0;
    }
    setCurrentPremium(premium);

    // 2) Filter new plans
    const results = (plansData as any[]).filter((plan) => {
      // Must match user’s chosen franchise
      if (Number(plan.franchise) !== userInputs.franchise) return false;

      // If userInputs.unrestrictedAccess => only planType='TAR-BASE'
      if (userInputs.unrestrictedAccess) {
        if (plan.planType !== 'TAR-BASE') return false;
      } else {
        // If restricted => check doctor preference
        if (userInputs.hasPreferredDoctor) {
          // If doc name is blank, no filter => user sees all
          if (userInputs.preferredDoctorName.trim() !== '') {
            // find doctor in doctorsData
            const docObj = (doctorsData as any[]).find(
              (d) =>
                d.doctorName.toLowerCase() === userInputs.preferredDoctorName.trim().toLowerCase()
            );
            // if doc not found => no plan
            if (!docObj) return false;
            // if plan.id not in docObj.associatedPlanIds => exclude
            if (!docObj.associatedPlanIds.includes(plan.id)) return false;
          }
        }
      }

      return true;
    });

    // 3) Sort ascending by annualPremium
    const sorted = results.sort((a, b) => a.annualPremium - b.annualPremium);
    setFilteredPlans(sorted);
  }, [userInputs]);

  // Only show "Savings" if user has a valid old plan
  const showSavings =
    userInputs.currentInsurer !== 'I have no insurer' &&
    userInputs.currentPlan !== '';

  // If user has a valid current plan, display it at the top
  const hasCurrentPlan = showSavings && currentPremium > 0;
  let currentPlanObj: any = null;
  if (hasCurrentPlan) {
    currentPlanObj = (plansData as any[]).find(
      (p) =>
        p.insurer === userInputs.currentInsurer &&
        p.planName === userInputs.currentPlan &&
        Number(p.franchise) === userInputs.franchise
    );
  }

  // Round any numeric to integer for display
  function formatNumber(num: number): string {
    return Math.round(num).toString();
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Plan Options</h2>

      {/* Show the user's current plan at the top if found */}
      {hasCurrentPlan && currentPlanObj && (
        <div style={{ marginBottom: '1rem', border: '1px solid #555', padding: '0.5rem' }}>
          <h3>Current Plan</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Insurer</th>
                <th>Plan Name</th>
                <th>Annual Premium</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{currentPlanObj.insurer}</td>
                <td>{currentPlanObj.planName}</td>
                <td>{formatNumber(currentPlanObj.annualPremium)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <p>Found {filteredPlans.length} matching plans</p>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc' }}>
            <th>Insurer</th>
            <th>Plan Name</th>
            <th>Annual Premium</th>
            {showSavings && <th>Savings</th>}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredPlans.map((p) => {
            let difference = 0;
            if (showSavings) {
              difference = p.annualPremium - currentPremium;
            }

            const planPremiumStr = formatNumber(p.annualPremium);
            const diffStr =
              difference === 0
                ? ''
                : difference > 0
                ? `+${Math.round(difference)}`
                : Math.round(difference).toString();

            return (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{p.insurer}</td>
                <td>{p.planName}</td>
                <td>{planPremiumStr}</td>
                {showSavings && (
                  <td style={{ color: difference < 0 ? 'green' : 'red' }}>
                    {diffStr}
                  </td>
                )}
                <td>
                  <button onClick={() => onSelectPlan(p)}>Select</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
