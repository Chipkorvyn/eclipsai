'use client';

import React, { useEffect, useState } from 'react';
import plansData from '../../data/plans.json';
import doctorsData from '../../data/doctors.json';

export default function PlanOptionsPanel({
  userInputs,
  onSelectPlan,
  onOpenCompare
}: {
  userInputs: {
    franchise: number;
    unrestrictedAccess: boolean;
    wantsTelePharm: boolean;
    wantsFamilyDocModel: boolean;
    wantsHmoModel: boolean;
    hasPreferredDoctor: boolean;
    preferredDoctorName: string;
    currentInsurer: string;
    currentPlan: string;
  };
  onSelectPlan: (plan: any) => void;
  onOpenCompare: (compareList: any[]) => void;
}) {
  const [filteredPlans, setFilteredPlans] = useState<any[]>([]);
  const [comparePlans, setComparePlans] = useState<any[]>([]);
  const [currentPremium, setCurrentPremium] = useState<number | null>(null);

  useEffect(() => {
    // Filter by franchise
    let results = (plansData as any[]).filter(
      (p) => Number(p.franchise) === userInputs.franchise
    );

    // find current plan in results
    let foundCurrent = null;
    if (userInputs.currentInsurer !== 'I have no insurer' && userInputs.currentPlan !== '') {
      foundCurrent = results.find(
        (p) =>
          p.insurer === userInputs.currentInsurer &&
          p.planName === userInputs.currentPlan &&
          Number(p.franchise) === userInputs.franchise
      );
    }
    setCurrentPremium(foundCurrent ? foundCurrent.annualPremium : null);

    // if unrestricted => only TAR-BASE
    if (userInputs.unrestrictedAccess) {
      results = results.filter((p) => p.planType === 'TAR-BASE');
    } else {
      // restricted
      const allowed: string[] = [];
      if (userInputs.wantsTelePharm) allowed.push('TAR-DIV');
      if (userInputs.wantsFamilyDocModel) allowed.push('TAR-HAM');
      if (userInputs.wantsHmoModel) allowed.push('TAR-HMO');

      if (allowed.length === 0) {
        results = [];
      } else {
        results = results.filter((p) => allowed.includes(p.planType));
      }

      // doc check
      if (userInputs.wantsFamilyDocModel && userInputs.hasPreferredDoctor) {
        const docName = userInputs.preferredDoctorName.trim().toLowerCase();
        if (docName) {
          const docObj = (doctorsData as any[]).find(
            (d) => d.doctorName.toLowerCase() === docName
          );
          if (!docObj) {
            results = [];
          } else {
            results = results.filter((p) => docObj.associatedPlanIds.includes(p.id));
          }
        }
      }
    }

    results.sort((a, b) => a.annualPremium - b.annualPremium);
    setFilteredPlans(results);
  }, [userInputs]);

  function toggleCompare(plan: any) {
    setComparePlans((prev) => {
      const idx = prev.findIndex((x) => x.id === plan.id);
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      return [...prev, plan];
    });
  }

  function handleOpenCompare() {
    onOpenCompare(comparePlans);
  }

  // current plan box
  let currentPlanBox = null;
  if (currentPremium !== null) {
    currentPlanBox = (
      <div style={currentPlanStyle}>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Your Current Plan</h3>
        <p style={{ margin: 0 }}>
          <strong>Provider:</strong> {userInputs.currentInsurer}
        </p>
        <p style={{ margin: 0 }}>
          <strong>Plan:</strong> {userInputs.currentPlan}
        </p>
        <p style={{ margin: 0 }}>
          <strong>Annual Premium:</strong> {Math.round(currentPremium)} CHF
        </p>
      </div>
    );
  }

  const showSavings = currentPremium !== null;

  return (
    <div style={{ fontFamily: "'Open Sans', sans-serif" }}>
      <h2 style={{ marginBottom: '0.5rem' }}>Plan Choices</h2>

      {currentPlanBox}

      <button
        style={compareBtnStyle}
        onClick={handleOpenCompare}
        disabled={comparePlans.length === 0}
      >
        Compare Selected Plans ({comparePlans.length})
      </button>

      <p style={{ marginTop: '1rem' }}>
        Found <strong>{filteredPlans.length}</strong> matching plans
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc', background: '#fafafa' }}>
            <th style={thStyle}>Compare</th>
            <th style={thStyle}>Provider</th>
            <th style={thStyle}>Plan</th>
            <th style={thStyle}>Annual Premium (CHF)</th>
            {showSavings && <th style={thStyle}>Savings</th>}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredPlans.map((p) => {
            const isSelected = comparePlans.some((c) => c.id === p.id);

            let diffStr = '';
            if (showSavings && currentPremium !== null) {
              const diff = p.annualPremium - currentPremium;
              if (diff > 0) diffStr = `+${Math.round(diff)}`;
              else if (diff < 0) diffStr = `${Math.round(diff)}`;
            }

            return (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCompare(p)}
                  />
                </td>
                <td style={tdStyle}>{p.insurer}</td>
                <td style={tdStyle}>{p.planName}</td>
                <td style={tdStyle}>{Math.round(p.annualPremium)}</td>
                {showSavings && (
                  <td style={{ color: diffStr.startsWith('-') ? 'green' : 'red', ...tdStyle }}>
                    {diffStr}
                  </td>
                )}
                <td style={tdStyle}>
                  <button style={selectBtnStyle} onClick={() => onSelectPlan(p)}>
                    Select Plan
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const currentPlanStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ccc',
  borderRadius: '4px',
  padding: '0.5rem',
  marginBottom: '1rem'
};

const compareBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: '#2F62F4',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.5rem',
  fontWeight: 'bold'
};

const tdStyle: React.CSSProperties = {
  padding: '0.5rem'
};

const selectBtnStyle: React.CSSProperties = {
  padding: '0.4rem 0.8rem',
  background: '#28a745',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};
