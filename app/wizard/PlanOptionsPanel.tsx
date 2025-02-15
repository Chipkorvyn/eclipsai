// app/wizard/PlanOptionsPanel.tsx
'use client';

import React, { useEffect, useState } from 'react';

interface PlanOptionsPanelProps {
  userInputs: any;
  onSelectPlan: (plan: any) => void; // add this so TS doesn't complain
}

export default function PlanOptionsPanel({
  userInputs,
  onSelectPlan
}: PlanOptionsPanelProps) {
  const [planList, setPlanList] = useState<any[]>([]);
  const [currentMonthly, setCurrentMonthly] = useState<number | null>(null);

  // Must have location + bracket + valid franchise
  const hasMandatory = Boolean(
    userInputs.altersklasse &&
    userInputs.canton &&
    userInputs.region &&
    (
      userInputs.altersklasse === 'AKL-KIN'
        ? userInputs.franchise >= 0 // child can be 0..600
        : userInputs.franchise >= 300 // adult => 300..2500
    )
  );

  useEffect(() => {
    if (!hasMandatory) {
      setPlanList([]);
      setCurrentMonthly(null);
      return;
    }

    // 1) Build /api/premiums query
    const qs = new URLSearchParams({
      altersklasse: userInputs.altersklasse,
      canton: userInputs.canton,
      region: userInputs.region,
      franchise: String(userInputs.franchise),
      unfalleinschluss: userInputs.unfalleinschluss || 'MIT-UNF'
    });
    const url = `/api/premiums?${qs.toString()}`;

    // 2) fetch data
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const mapped = data.map((row: any) => ({
          id: row.id,
          insurer: row.insurer_name || '',
          tarif: row.tarif, // plan code
          planLabel: row.plan_label || row.tarifbezeichnung || row.tarif,
          monthlyPremium: parseFloat(row.praemie),
        }));
        mapped.sort((a: any, b: any) => a.monthlyPremium - b.monthlyPremium);

        // 3) find a row matching currentInsurer + currentPlan
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

        setPlanList(mapped);
        setCurrentMonthly(foundCurrent ? foundCurrent.monthlyPremium : null);
      })
      .catch((err) => {
        console.error('PlanOptionsPanel fetch error:', err);
        setPlanList([]);
        setCurrentMonthly(null);
      });
  }, [
    hasMandatory,
    userInputs.altersklasse,
    userInputs.canton,
    userInputs.region,
    userInputs.franchise,
    userInputs.unfalleinschluss,
    // also add if you want to re-fetch on plan changes:
    userInputs.currentPlan,
    userInputs.currentInsurer
  ]);

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
      <div style={{ background: '#eef', padding: '0.5rem', marginBottom: '1rem' }}>
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
          {planList.map((p) => {
            let diffStr = '';
            if (showSavings && currentMonthly != null) {
              const diff = p.monthlyPremium - currentMonthly;
              diffStr = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
            }

            return (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '6px' }}>{p.insurer}</td>
                <td style={{ padding: '6px' }}>
                  {/* Example usage of onSelectPlan */}
                  <button
                    style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
                    onClick={() => onSelectPlan(p)}
                  >
                    {p.planLabel}
                  </button>
                </td>
                <td style={{ padding: '6px' }}>{p.monthlyPremium.toFixed(2)}</td>
                {showSavings && (
                  <td
                    style={{
                      padding: '6px',
                      color: diffStr.startsWith('-') ? 'green' : 'red',
                    }}
                  >
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
