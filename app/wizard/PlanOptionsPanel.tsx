// app/wizard/PlanOptionsPanel.tsx
'use client';

import React, { useEffect, useState } from 'react';

interface PlanOptionsPanelProps {
  userInputs: any;
  onSelectPlan: (plan: any) => void;
}

// Convert `tariftyp` to a friendly label
function getPlanTypeLabel(typ: string) {
  switch (typ) {
    case 'TAR-BASE': return 'Standard';
    case 'TAR-HAM':  return 'Family doctor';
    case 'TAR-HMO':  return 'HMO';
    default:
      return 'Other plan types';
  }
}

// Short descriptive text for each type
function getPlanTypeDescription(typ: string) {
  switch (typ) {
    case 'TAR-BASE':
      return 'A simple mandatory coverage with free doctor choice.';
    case 'TAR-HAM':
      return 'Requires you to see your family doctor first.';
    case 'TAR-HMO':
      return 'Coordinates care via an HMO network.';
    default:
      return 'Alternative coverage beyond standard, family, or HMO.';
  }
}

export default function PlanOptionsPanel({
  userInputs,
  onSelectPlan
}: PlanOptionsPanelProps) {
  const [planList, setPlanList] = useState<any[]>([]);
  const [currentMonthly, setCurrentMonthly] = useState<number | null>(null);

  // Track expansion states for “Show more/less”
  const [expanded, setExpanded] = useState<{
    [key: string]: boolean;
  }>({
    'TAR-BASE': false,
    'TAR-HAM':  false,
    'TAR-HMO':  false,
    'TAR-DIV':  false,
  });

  // Must have location + bracket + franchise
  const hasMandatory = Boolean(
    userInputs.altersklasse &&
    userInputs.canton &&
    userInputs.region &&
    (
      userInputs.altersklasse === 'AKL-KIN'
        ? userInputs.franchise >= 0
        : userInputs.franchise >= 300
    )
  );

  useEffect(() => {
    if (!hasMandatory) {
      setPlanList([]);
      setCurrentMonthly(null);
      return;
    }

    const qs = new URLSearchParams({
      altersklasse: userInputs.altersklasse,
      canton: userInputs.canton,
      region: userInputs.region,
      franchise: String(userInputs.franchise),
      unfalleinschluss: userInputs.unfalleinschluss || 'MIT-UNF'
    });
    const url = `/api/premiums?${qs.toString()}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const mapped = data.map((row: any) => ({
          id: row.id,
          tariftyp: row.tariftyp || 'TAR-DIV',
          insurer: row.insurer_name || '',
          tarif: row.tarif,
          planLabel: row.plan_label || row.tarifbezeichnung || row.tarif,
          monthlyPremium: parseFloat(row.praemie),
        }));
        mapped.sort((a: any, b: any) => a.monthlyPremium - b.monthlyPremium);

        // If the user has a recognized plan => store currentMonthly
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
    userInputs.currentInsurer,
    userInputs.currentPlan
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

  // separate by type
  const standardArr = planList.filter((p) => p.tariftyp === 'TAR-BASE');
  const familyArr   = planList.filter((p) => p.tariftyp === 'TAR-HAM');
  const hmoArr      = planList.filter((p) => p.tariftyp === 'TAR-HMO');
  const otherArr    = planList.filter((p) => p.tariftyp === 'TAR-DIV');

  return (
    <div>
      {currentPlanBox}

      {renderTypeBlock('TAR-BASE', standardArr)}
      {renderTypeBlock('TAR-HAM',  familyArr)}
      {renderTypeBlock('TAR-HMO',  hmoArr)}
      {renderTypeBlock('TAR-DIV',  otherArr)}
    </div>
  );

  function renderTypeBlock(typ: string, subList: any[]) {
    if (!subList.length) return null;

    const label = getPlanTypeLabel(typ);
    const desc  = getPlanTypeDescription(typ);

    let maxSavingsLine = null;
    if (showSavings) {
      const cheapest = subList[0].monthlyPremium;
      const diffAnnual = (cheapest - currentMonthly!) * 12;
      if (diffAnnual < 0) {
        maxSavingsLine = (
          <p style={{ fontWeight: 'bold', marginTop: '0' }}>
            Maximum savings: {Math.abs(diffAnnual).toFixed(2)} CHF
          </p>
        );
      } else {
        maxSavingsLine = (
          <p style={{ fontWeight: 'bold', marginTop: '0' }}>
            Maximum savings: 0 CHF
          </p>
        );
      }
    }

    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.2rem' }}>{label}</h3>
        <p style={{ marginTop: '0', fontStyle: 'italic' }}>{desc}</p>
        {maxSavingsLine}
        {renderPlanTable(typ, subList)}
      </div>
    );
  }

  function renderPlanTable(typ: string, subList: any[]) {
    const isExpanded = expanded[typ];
    const displayedRows = isExpanded ? subList : subList.slice(0, 5);

    return (
      <>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ textAlign: 'left', padding: '6px' }}>Insurer</th>
              <th style={{ textAlign: 'left', padding: '6px' }}>Plan</th>
              <th style={{ textAlign: 'left', padding: '6px' }}>Monthly Premium</th>
              {showSavings && (
                <th style={{ textAlign: 'left', padding: '6px' }}>Annual Savings</th>
              )}
              <th style={{ textAlign: 'left', padding: '6px' }}>View Plan</th>
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((p: any) => {
              let diffStr = '';
              if (showSavings && currentMonthly !== null) {
                const diffAnnual = (p.monthlyPremium - currentMonthly) * 12;
                diffStr = diffAnnual > 0
                  ? `+${diffAnnual.toFixed(2)}`
                  : diffAnnual.toFixed(2);
              }

              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px' }}>{p.insurer}</td>
                  <td style={{ padding: '6px' }}>
                    <button
                      style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
                      onClick={() => onSelectPlan(p)}
                    >
                      {p.planLabel}
                    </button>
                  </td>
                  <td style={{ padding: '6px' }}>
                    {p.monthlyPremium.toFixed(2)}
                  </td>
                  {showSavings && (
                    <td
                      style={{
                        padding: '6px',
                        color: diffStr.startsWith('-') ? 'green' : 'red'
                      }}
                    >
                      {diffStr}
                    </td>
                  )}
                  <td style={{ padding: '6px' }}>
                    <button
                      style={{ background: '#ddd', border: 'none', padding: '4px', cursor: 'pointer' }}
                      onClick={() => {
                        // does nothing for now
                      }}
                    >
                      View Plan
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Show more or Show less if subList>5 */}
        {subList.length > 5 && (
          <div style={{ marginTop: '0.5rem' }}>
            {isExpanded ? (
              <button
                style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => handleCollapse(typ)}
              >
                Show less
              </button>
            ) : (
              <button
                style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => handleExpand(typ)}
              >
                Show more
              </button>
            )}
          </div>
        )}
      </>
    );
  }

  function handleExpand(typ: string) {
    setExpanded((prev) => ({
      ...prev,
      [typ]: true
    }));
  }

  function handleCollapse(typ: string) {
    setExpanded((prev) => ({
      ...prev,
      [typ]: false
    }));
  }
}
