// app/wizard/PlanOptionsPanel.tsx
'use client';

import React, { useEffect, useState } from 'react';

interface PlanOptionsPanelProps {
  userInputs: any;
}

function getPlanTypeLabel(typ: string) {
  switch (typ) {
    case 'TAR-BASE': return 'Standard';
    case 'TAR-HAM':  return 'Family doctor';
    case 'TAR-HMO':  return 'HMO';
    default: return 'Other plan types';
  }
}

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

export default function PlanOptionsPanel({ userInputs }: PlanOptionsPanelProps) {
  const [planList, setPlanList] = useState<any[]>([]);
  const [currentMonthly, setCurrentMonthly] = useState<number | null>(null);

  const [expanded, setExpanded] = useState<{
    [key: string]: boolean;
  }>({
    'TAR-BASE': false,
    'TAR-HAM':  false,
    'TAR-HMO':  false,
    'TAR-DIV':  false,
  });

  // Must have location + bracket
  const isChild = (userInputs.altersklasse === 'AKL-KIN');
  const hasMandatory = Boolean(
    userInputs.altersklasse &&
    userInputs.canton &&
    userInputs.region &&
    ( isChild ? userInputs.franchise >= 0 : userInputs.franchise >= 300 )
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
          insurer_name: row.insurer_name || '',
          praemie: row.praemie || '0',
          tarif: row.tarif,
          plan_label: row.plan_label || row.tarifbezeichnung || row.tarif,
          monthlyPremium: parseFloat(row.praemie)
        }));
        mapped.sort((a: any, b: any) => a.monthlyPremium - b.monthlyPremium);

        // If user has a recognized plan => store monthly cost
        let foundCurrent = null;
        if (
          userInputs.currentInsurer !== 'I have no insurer' &&
          userInputs.currentPlan
        ) {
          foundCurrent = mapped.find(
            (p: any) =>
              p.insurer_name === userInputs.currentInsurer &&
              p.tarif === userInputs.currentPlan
          );
        }
        setPlanList(mapped);
        setCurrentMonthly(foundCurrent ? foundCurrent.monthlyPremium : null);
      })
      .catch(() => {
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

  // No "Your current plan" box => removed per request
  // We simply show each type block in a white box with a blue header

  const showSavings = currentMonthly !== null;

  // separate by type
  const standardArr = planList.filter((p) => p.tariftyp === 'TAR-BASE');
  const familyArr   = planList.filter((p) => p.tariftyp === 'TAR-HAM');
  const hmoArr      = planList.filter((p) => p.tariftyp === 'TAR-HMO');
  const otherArr    = planList.filter((p) => p.tariftyp === 'TAR-DIV');

  return (
    <div>
      {renderTypeBlock('TAR-BASE', standardArr)}
      {renderTypeBlock('TAR-HAM',  familyArr)}
      {renderTypeBlock('TAR-HMO',  hmoArr)}
      {renderTypeBlock('TAR-DIV',  otherArr)}
    </div>
  );

  function renderTypeBlock(typ: string, subList: any[]) {
    if (!subList.length) return null;

    const label = getPlanTypeLabel(typ);

    // Wrap table in a white box with a blue header => "label"
    return (
      <div
        key={typ}
        style={{
          background: '#fff',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          overflow: 'hidden'
        }}
      >
        {/* Blue header */}
        <div style={{
          background: '#007BFF',
          color: '#fff',
          padding: '0.75rem',
          fontWeight: 'bold',
          fontSize: '1rem'
        }}>
          {label}
        </div>

        {/* The descriptive text, if you want => e.g. "Family doctor => 'Requires family doc first' */}
        <div style={{ padding: '0.75rem', fontStyle: 'italic' }}>
          {getPlanTypeDescription(typ)}
        </div>

        {/* Table => container => expands as needed */}
        <div style={{ padding: '0.75rem' }}>
          {renderPlanTable(typ, subList)}
        </div>
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
                  <td style={{ padding: '6px' }}>{p.insurer_name}</td>
                  <td style={{ padding: '6px' }}>
                    {/* read-only plan label */}
                    {p.plan_label}
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
                        // does nothing
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
    setExpanded((prev) => ({ ...prev, [typ]: true }));
  }
  function handleCollapse(typ: string) {
    setExpanded((prev) => ({ ...prev, [typ]: false }));
  }
}
