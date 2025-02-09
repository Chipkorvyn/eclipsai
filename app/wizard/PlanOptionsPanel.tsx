'use client';

import React, { useEffect, useState } from 'react';
import plansData from '../../data/plans.json';
import doctorsData from '../../data/doctors.json';
import planDetails from '../../data/planDetails.json'; // NEW import for extended info

export default function PlanOptionsPanel({
  userInputs,
  onSelectPlan,
  onOpenCompare // callback to open compare modal
}: {
  userInputs: {
    franchise: number;
    currentInsurer: string;
    currentPlan: string;
    unrestrictedAccess: boolean;
    wantsTelePharm: boolean;
    wantsFamilyDocModel: boolean;
    wantsHmoModel: boolean;
    hasPreferredDoctor: boolean;
    preferredDoctorName: string;
  };
  onSelectPlan: (plan: any) => void;
  onOpenCompare: (compareList: any[]) => void; // pass selected plans upwards
}) {
  const [filteredPlans, setFilteredPlans] = useState<any[]>([]);
  const [currentPremium, setCurrentPremium] = useState<number>(0);

  // This state tracks which plans are toggled for comparison
  const [comparePlans, setComparePlans] = useState<any[]>([]);

  useEffect(() => {
    // 1) find user’s current plan premium
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

    // 2) filter logic
    const results = (plansData as any[]).filter((plan) => {
      if (Number(plan.franchise) !== userInputs.franchise) return false;

      if (userInputs.unrestrictedAccess) {
        if (plan.planType !== 'TAR-BASE') return false;
      } else {
        // restricted
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
        if (!planTypeOk) return false;

        // doc preference
        if (userInputs.wantsFamilyDocModel) {
          if (userInputs.hasPreferredDoctor) {
            const docName = userInputs.preferredDoctorName.trim().toLowerCase();
            if (docName !== '') {
              const docObj = (doctorsData as any[]).find(
                (d) => d.doctorName.toLowerCase() === docName
              );
              if (!docObj) return false;
              if (!docObj.associatedPlanIds.includes(plan.id)) return false;
            }
          }
        }
      }

      return true;
    });

    const sorted = results.sort((a, b) => a.annualPremium - b.annualPremium);
    setFilteredPlans(sorted);
  }, [userInputs]);

  // show savings?
  const showSavings =
    userInputs.currentInsurer !== 'I have no insurer' &&
    userInputs.currentPlan !== '';

  // current plan row
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

  // handle compare toggles
  function toggleCompare(plan: any) {
    setComparePlans((prev) => {
      const exists = prev.findIndex((p) => p.id === plan.id);
      if (exists >= 0) {
        // remove it
        return prev.filter((p, idx) => idx !== exists);
      } else {
        // add it
        return [...prev, plan];
      }
    });
  }

  // open the compare modal, pass the selected plans
  function handleOpenCompare() {
    onOpenCompare(comparePlans);
  }

  function formatNumber(num: number) {
    return Math.round(num).toString();
  }

  // to retrieve extended details if needed:
  function getExtendedDescription(planId: number) {
    const detailEntry = (planDetails as any[]).find((d) => d.id === planId);
    if (!detailEntry) return '';
    return detailEntry.extendedDescription;
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Plan Options</h2>
      {/* Link to open compare: show count of selected plans */}
      <button onClick={handleOpenCompare} disabled={comparePlans.length === 0}>
        Compare {comparePlans.length} Plans
      </button>

      {hasCurrentPlan && currentPlanObj && (
        <div style={{ marginBottom: '1rem', border: '1px solid #555', padding: '0.5rem' }}>
          <h3>Current Plan</h3>
          <p>Insurer: {currentPlanObj.insurer}, Name: {currentPlanObj.planName}, Premium: {formatNumber(currentPlanObj.annualPremium)}</p>
        </div>
      )}

      <p>Found {filteredPlans.length} matching plans</p>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc' }}>
            <th>Compare</th>
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
            const diffStr =
              difference === 0
                ? ''
                : difference > 0
                ? `+${Math.round(difference)}`
                : Math.round(difference).toString();

            // check if plan is in compare array
            const isSelected = comparePlans.some((cp) => cp.id === p.id);

            return (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCompare(p)}
                  />
                </td>
                <td>{p.insurer}</td>
                <td>{p.planName}</td>
                <td>{formatNumber(p.annualPremium)}</td>
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
