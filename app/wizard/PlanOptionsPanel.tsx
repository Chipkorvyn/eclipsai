// app/wizard/PlanOptionsPanel.tsx
'use client';

import React, { useEffect, useState } from 'react';

export default function PlanOptionsPanel({ userInputs }) {
  const [planList, setPlanList] = useState([]);
  const [currentMonthly, setCurrentMonthly] = useState<number | null>(null);

  // We check if location + bracket + franchise are set
  const hasMandatory = Boolean(
    userInputs.altersklasse &&
    userInputs.canton &&
    userInputs.region &&
    (
      userInputs.altersklasse === 'AKL-KIN'
        ? userInputs.franchise >= 0  // kids can have 0..600
        : userInputs.franchise >= 300 // adults => 300..2500
    )
  );

  useEffect(() => {
    // If the user hasn't chosen bracket+location+franchise => no data
    if (!hasMandatory) {
      setPlanList([]);
      setCurrentMonthly(null);
      return;
    }

    // 1) Construct the query for /api/premiums
    const params = new URLSearchParams({
      altersklasse: userInputs.altersklasse,
      franchise: String(userInputs.franchise),
      canton: userInputs.canton,
      region: userInputs.region,
      unfalleinschluss: userInputs.unfalleinschluss || 'MIT-UNF'
    });
    const url = `/api/premiums?${params.toString()}`;

    // 2) Fetch plan data
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        // Convert each row
        const mapped = data.map((row: any) => ({
          id: row.id,
          insurer: row.insurer_name || '',
          tarif: row.tarif,  // code
          planLabel: row.plan_label || row.tarifbezeichnung || row.tarif,
          monthlyPremium: parseFloat(row.praemie),
        }));
        // Sort ascending
        mapped.sort((a: any, b: any) => a.monthlyPremium - b.monthlyPremium);

        setPlanList(mapped);

        // 3) Check if user has a current plan => find row
        let foundCurrent = null;
        if (
          userInputs.currentInsurer !== 'I have no insurer' &&
          userInputs.currentPlan
        ) {
          foundCurrent = mapped.find(
            (p: any) =>
              p.insurer === userInputs.currentInsurer &&
              p.tarif === userInputs.currentPlan
          );
        }
        setCurrentMonthly(foundCurrent ? foundCurrent.monthlyPremium : null);
      })
      .catch((err) => {
        console.error('PlanOptionsPanel fetch error:', err);
        setPlanList([]);
        setCurrentMonthly(null);
      });
  }, [
    // We combine the dependencies:
    hasMandatory,
    userInputs.altersklasse,
    userInputs.franchise,
    userInputs.canton,
    userInputs.region,
    userInputs.unfalleinschluss,

    // Also track plan + insurer in case user picks a new plan => re-run 
    // (That means we DO re-fetch if plan changes. If you DON’T want that, remove these.)
    userInputs.currentPlan,
    userInputs.currentInsurer,
  ]);

  // ============== RENDER UI ==============
  if (!hasMandatory) {
    return <p>Please pick location, bracket, and a valid franchise.</p>;
  }
  if (!planList.length) {
    return <p>No plans found for these filters.</p>;
  }

  const showSavings = currentMonthly !== null;
  let currentPlanBox = null;
  if (showSavings) {
    currentPlanBox = (
      <div style={{ background: '#f5f5f5', padding: '0.5rem', marginBottom: '1rem' }}>
        <h4>Your Current Plan</h4>
        <p><strong>Insurer:</strong> {userInputs.currentInsurer}</p>
        <p><strong>Plan Code:</strong> {userInputs.currentPlan}</p>
        <p><strong>Monthly Premium:</strong> {currentMonthly?.toFixed(2)}</p>
      </div>
    );
  }

  return (
    <div>
      {currentPlanBox}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc' }}>
            <th style={{ textAlign: 'left', padding: '6px' }}>Insurer</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>Plan</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>Monthly Premium</th>
            {showSavings && <th style={{ textAlign: 'left', padding: '6px' }}>Savings</th>}
          </tr>
        </thead>
        <tbody>
          {planList.map((p: any) => {
            let diffStr = '';
            if (showSavings && currentMonthly != null) {
              const diff = p.monthlyPremium - currentMonthly;
              diffStr = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
            }
            return (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '6px' }}>{p.insurer}</td>
                <td style={{ padding: '6px' }}>{p.planLabel}</td>
                <td style={{ padding: '6px' }}>
                  {p.monthlyPremium.toFixed(2)}
                </td>
                {showSavings && (
                  <td style={{ padding: '6px', color: diffStr.startsWith('-') ? 'green' : 'red' }}>
                    {diffStr}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
