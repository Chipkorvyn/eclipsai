'use client';

import React, { useEffect, useState } from 'react';
import plansData from '../../data/plans.json';
import doctorsData from '../../data/doctors.json';

export default function PlanOptionsPanel({
  userInputs,
  onSelectPlan
}: {
  userInputs: {
    franchise: number;
    currentInsurer: string;
    currentPlan: string;
    unrestrictedAccess: boolean;

    wantsTelePharm: boolean;     // => include TAR-DIV
    wantsFamilyDocModel: boolean;// => include TAR-HAM
    wantsHmoModel: boolean;      // => include TAR-HMO

    hasPreferredDoctor: boolean;
    preferredDoctorName: string;
  };
  onSelectPlan: (plan: any) => void;
}) {
  const [filteredPlans, setFilteredPlans] = useState<any[]>([]);
  const [currentPremium, setCurrentPremium] = useState<number>(0);

  useEffect(() => {
    // 1) Find user's current plan premium
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

    // 2) Filter logic
    const results = (plansData as any[]).filter((plan) => {
      // Must match franchise
      if (Number(plan.franchise) !== userInputs.franchise) return false;

      // If unrestricted => only TAR-BASE
      if (userInputs.unrestrictedAccess) {
        if (plan.planType !== 'TAR-BASE') return false;
      } else {
        // restricted scenario
        // user might pick multiple toggles: telePharm, familyDocModel, hmo

        // if user picks NO toggles => no plan => we check each
        let planTypeOk = false;

        if (userInputs.wantsTelePharm && plan.planType === 'TAR-DIV') {
          planTypeOk = true;
        }
        if (userInputs.wantsFamilyDocModel && plan.planType === 'TAR-HAM') {
          planTypeOk = true;
        }
        if (userInputs.wantsHmoModel && plan.planType === 'TAR-HMO') {
          planTypeOk = true;
        }

        // If none toggles are on => planTypeOk remains false => exclude
        if (!planTypeOk) return false;

        // Now doc preference only if user selects familyDocModel 
        if (userInputs.wantsFamilyDocModel) {
          if (userInputs.hasPreferredDoctor) {
            const docName = userInputs.preferredDoctorName.trim().toLowerCase();
            if (docName !== '') {
              // find doc in doctorsData
              const docObj = (doctorsData as any[]).find(
                (d) => d.doctorName.toLowerCase() === docName
              );
              if (!docObj) return false;  // doc not found => exclude
              if (!docObj.associatedPlanIds.includes(plan.id)) {
                return false;
              }
            }
          }
        }
      }

      return true;
    });

    // 3) sort ascending by annualPremium
    const sorted = results.sort((a, b) => a.annualPremium - b.annualPremium);
    setFilteredPlans(sorted);
  }, [userInputs]);

  // Show "Savings" column if user has old plan
  const showSavings =
    userInputs.currentInsurer !== 'I have no insurer' &&
    userInputs.currentPlan !== '';

  // If user has a current plan row, display it
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

  function formatNumber(num: number) {
    return Math.round(num).toString();
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Plan Options</h2>

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
          {filteredPlans.map((plan) => {
            let difference = 0;
            if (showSavings) {
              difference = plan.annualPremium - currentPremium;
            }
            const planPremiumStr = formatNumber(plan.annualPremium);
            const diffStr =
              difference === 0
                ? ''
                : difference > 0
                ? `+${Math.round(difference)}`
                : Math.round(difference).toString();

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
