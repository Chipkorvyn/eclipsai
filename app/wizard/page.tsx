// app/wizard/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import InputPanel from './InputPanel';
import PlanOptionsPanel from './PlanOptionsPanel';

// The 4 plan types we care about
const TYPE_ORDER: Array<'TAR-BASE'|'TAR-HAM'|'TAR-HMO'|'TAR-DIV'> = [
  'TAR-BASE','TAR-HAM','TAR-HMO','TAR-DIV'
];
const TYPE_LABELS: Record<string,string> = {
  'TAR-BASE': 'Standard',
  'TAR-HAM':  'Family doctor',
  'TAR-HMO':  'HMO',
  'TAR-DIV':  'Other plans',
};

export default function WizardPage() {
  const searchParams = useSearchParams();
  const queryYob = parseInt(searchParams.get('yob') || '0', 10);
  const queryFranchise = parseInt(searchParams.get('franchise') || '0', 10);

  // ========== Wizard State ==========
  const [userInputs, setUserInputs] = useState({
    yearOfBirth: 0,
    franchise: 0,
    unfalleinschluss: 'MIT-UNF',  // with/without accident
    canton: '',
    region: '',
    altersklasse: '',
    currentInsurerBagCode: '',
    currentInsurer: 'I have no insurer',
    currentPlan: '',
  });

  // ========== Real plan data from DB =============
  // We'll store the cheapest (and possibly second cheapest) plan for each type
  // after we fetch from /api/premiums
  const [cheapestByType, setCheapestByType] = useState<Record<string, any>>({});
  const [secondCheapestByType, setSecondCheapestByType] = useState<Record<string, any>>({});

  // On mount, if the query param is valid => set userInputs
  useEffect(() => {
    const updates: any = {};
    if (queryYob > 0) updates.yearOfBirth = queryYob;
    if (queryFranchise > 0) updates.franchise = queryFranchise;
    if (Object.keys(updates).length > 0) {
      setUserInputs((prev) => ({ ...prev, ...updates }));
    }
  }, [queryYob, queryFranchise]);

  // Called by InputPanel to update wizard state
  const handleUserInputsChange = useCallback((updated: any) => {
    setUserInputs(updated);
  }, []);

  function handleSelectPlan(plan: any) {
    console.log('Selected plan in page:', plan);
  }

  // ========== Determine plan type from a row's `tariftyp` ==========
  // E.g. "TAR-BASE", "TAR-HAM", ...
  function getTypeLabel(tariftyp: string): string {
    return TYPE_LABELS[tariftyp] || 'Other plans';
  }

  // ========== 1) Compute altersklasse if needed ==========
  function computeAltersklasse(yob: number) {
    if (!yob || yob <= 0) return '';
    const age = 2025 - yob; // or current year logic
    if (age <= 18) return 'AKL-KIN';
    if (age <= 25) return 'AKL-JUG';
    return 'AKL-ERW';
  }

  // ========== 2) Whenever userInputs changes, fetch real premiums ==========
  useEffect(() => {
    // We only fetch if we have enough data (non-empty canton, region, valid franchise)
    if (!userInputs.canton || !userInputs.region) return;
    if (userInputs.franchise <= 0) return;

    const ak = computeAltersklasse(userInputs.yearOfBirth);
    if (!ak) return;

    const qs = new URLSearchParams({
      canton: userInputs.canton,
      region: userInputs.region,
      altersklasse: ak,
      franchise: String(userInputs.franchise),
      unfalleinschluss: userInputs.unfalleinschluss,
    });

    fetch(`/api/premiums?${qs.toString()}`)
      .then((r) => r.json())
      .then((data: any[]) => {
        // data is an array of rows { praemie, tariftyp, bag_code, etc. }
        // We'll group by 'tariftyp', then find cheapest & second cheapest in each group.
        const groups: Record<string, any[]> = {
          'TAR-BASE': [],
          'TAR-HAM':  [],
          'TAR-HMO':  [],
          'TAR-DIV':  [],
        };
        data.forEach((row) => {
          const typ = row.tariftyp || 'TAR-DIV';
          if (!groups[typ]) groups[typ] = [];
          groups[typ].push(row);
        });
        // Now for each typ, sort by monthly premium ascending
        // We'll store the top 2 in cheapestByType, secondCheapestByType
        const cbt: Record<string, any> = {};
        const sbt: Record<string, any> = {};
        Object.keys(groups).forEach((typ) => {
          groups[typ].sort((a,b) => parseFloat(a.praemie) - parseFloat(b.praemie));
          if (groups[typ].length > 0) {
            cbt[typ] = groups[typ][0];
          }
          if (groups[typ].length > 1) {
            sbt[typ] = groups[typ][1];
          }
        });
        setCheapestByType(cbt);
        setSecondCheapestByType(sbt);
      })
      .catch((err) => {
        console.error('Error fetching real premiums:', err);
        setCheapestByType({});
        setSecondCheapestByType({});
      });

  }, [
    userInputs.canton,
    userInputs.region,
    userInputs.franchise,
    userInputs.unfalleinschluss,
    userInputs.yearOfBirth
  ]);

  // ========== 3) Build the 4 boxes from real data instead of placeholders ==========
  function buildBoxes() {
    const hasCurrentPlan = Boolean(userInputs.currentPlan);

    // Helper: from a plan row => produce the needed info
    function rowToBoxData(row: any, headerLine1: string, headerLine2: string, headerColor: string, showSavings: boolean) {
      const monthlyFloat = parseFloat(row?.praemie || '0');
      const monthlyStr   = `${monthlyFloat.toFixed(2)} CHF/month`; 
      let annualSavings  = '';
      if (showSavings) {
        // We can compare this row's monthly with the user’s "current plan" monthly if we have it
        // or just do a placeholder. 
        // If we have a row for the user's current plan, we can do:
        //   savings = (currentMonthly - monthlyFloat)*12
        // For now, do a placeholder "600 CHF/year" or compute if you like:
        annualSavings = 'Savings: ??? CHF/year';
      }
      return {
        headerLine1,
        headerLine2,
        headerColor,
        planType: getTypeLabel(row.tariftyp || 'TAR-DIV'),
        insurer:  row.insurer_name || '(unknown insurer)',
        planName: row.plan_label  || row.tarif || '',
        monthly:  monthlyStr,
        annualSavings
      };
    }

    if (!hasCurrentPlan) {
      // CASE 1: no current plan => 4 boxes in the order: TAR-BASE, TAR-HAM, TAR-HMO, TAR-DIV
      return TYPE_ORDER.map((typ) => {
        const row = cheapestByType[typ];
        if (!row) {
          // If no data => show empty placeholders
          return {
            headerLine1: 'Cheapest option',
            headerLine2: TYPE_LABELS[typ],
            headerColor: '#007BFF',
            planType: TYPE_LABELS[typ],
            insurer:  '(no data)',
            planName: '',
            monthly:  '',
            annualSavings: ''
          };
        }
        return rowToBoxData(
          row,
          'Cheapest option',
          TYPE_LABELS[typ],
          '#007BFF',
          true // show "Savings"
        );
      });

    } else {
      // CASE 2: We have a current plan => 
      //  - #1 => current plan row (dark grey)
      //  - #2 => cheapest in that same type
      //  - #3 and #4 => the cheapest among the three other types

      // We'll guess userInputs.currentPlan => we can search in the fetched data if we want an exact row.
      // For demonstration, let's just do a "semi-match" in the entire premium list if we have it
      // Or if not found, we do placeholders

      // Step A: find the row from "cheapest" or "secondCheapest" that might match userInputs.currentPlan
      // This is approximate. In real usage, you'd find the row from PlanOptionsPanel or a full data array.

      let currentRow: any = null;
      // We'll do a naive approach: check each type's cheapest. 
      Object.values(cheapestByType).forEach((r) => {
        if (r && r.tarif === userInputs.currentPlan) {
          currentRow = r;
        }
      });
      // If not found, we skip searching secondCheapest. This is just an example.

      // If we never found it => placeholder
      if (!currentRow) {
        currentRow = {
          tariftyp: 'TAR-BASE',
          insurer_name: userInputs.currentInsurer || 'My Insurer',
          plan_label:   userInputs.currentPlan     || 'My Plan Name',
          praemie: '350', // placeholder
        };
      }

      // Box #1 => current plan
      const box1 = rowToBoxData(
        currentRow,
        'Current plan',
        getTypeLabel(currentRow.tariftyp),
        '#666', // dark grey
        false   // no "savings" for current plan
      );

      const currentTyp = currentRow.tariftyp || 'TAR-BASE';

      // Box #2 => cheapest in that same type
      const row2 = cheapestByType[currentTyp];
      let box2;
      if (!row2) {
        box2 = {
          headerLine1: 'Cheapest option',
          headerLine2: getTypeLabel(currentTyp),
          headerColor: '#007BFF',
          planType: getTypeLabel(currentTyp),
          insurer:  '(no data)',
          planName: '',
          monthly:  '',
          annualSavings: ''
        };
      } else {
        box2 = rowToBoxData(
          row2,
          'Cheapest option',
          getTypeLabel(currentTyp),
          '#007BFF',
          true
        );
      }

      // Next, gather other 3 types
      const otherTyps = TYPE_ORDER.filter((t) => t !== currentTyp);

      // We want the cheapest among these 3 => that’s #3
      // Then second cheapest => #4
      // We'll do it by comparing parseFloat(cheapestByType[t].praemie)
      // If there's no data for that type => skip or do placeholders

      type RowOrNull = { typ: string; row: any } | null;
      const arr: RowOrNull[] = otherTyps.map((typ) => {
        const rowx = cheapestByType[typ];
        if (!rowx) return null;
        return { typ, row: rowx };
      }).filter(Boolean) as { typ: string; row: any}[];

      // Sort by praemie ascending
      arr.sort((a,b) => parseFloat(a.row.praemie) - parseFloat(b.row.praemie));

      let box3: any = null;
      let box4: any = null;
      if (arr.length > 0) {
        const t3 = arr[0];
        box3 = rowToBoxData(
          t3.row,
          'Cheapest option',
          getTypeLabel(t3.row.tariftyp),
          '#007BFF',
          true
        );
      } else {
        // fallback
        box3 = {
          headerLine1: 'Cheapest option',
          headerLine2: '',
          headerColor: '#007BFF',
          planType: '',
          insurer:  '(no data)',
          planName: '',
          monthly:  '',
          annualSavings: ''
        };
      }
      if (arr.length > 1) {
        const t4 = arr[1];
        box4 = rowToBoxData(
          t4.row,
          'Cheapest option',
          getTypeLabel(t4.row.tariftyp),
          '#007BFF',
          true
        );
      } else {
        box4 = {
          headerLine1: 'Cheapest option',
          headerLine2: '',
          headerColor: '#007BFF',
          planType: '',
          insurer:  '(no data)',
          monthly:  '',
          planName: '',
          annualSavings: ''
        };
      }

      return [box1, box2, box3, box4];
    }
  }

  // Build the 4 top boxes from real data
  const topBoxes = buildBoxes();

  // ======== Render the layout ========
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* White band at top */}
      <div style={{ background: '#fff', height: '50px', flexShrink: 0 }}>
        {/* Logo/menu placeholder */}
      </div>

      {/* Light grey background */}
      <div style={{ background: '#f0f0f0', flex: 1, padding: '1rem 0' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            gap: '0.5rem',
          }}
        >
          {/* Left => InputPanel */}
          <div style={{ width: '25%', minWidth: '280px' }}>
            <InputPanel
              userInputs={userInputs}
              onUserInputsChange={handleUserInputsChange}
            />
          </div>

          {/* Right => middle panel */}
          <div style={{ flex: 1 }}>
            {/* 4 boxes at top */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {topBoxes.map((box, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    background: '#fff',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Two-line header, centered */}
                  <div
                    style={{
                      background: box.headerColor,
                      color: '#fff',
                      padding: '0.5rem',
                      fontWeight: 'bold',
                      fontSize: '0.95rem',
                      textAlign: 'center',
                      lineHeight: '1.3',
                    }}
                  >
                    <div>{box.headerLine1}</div>
                    <div>{box.headerLine2}</div>
                  </div>

                  {/* Content => same styling */}
                  <div style={{ padding: '0.75rem', flex: 1 }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '0.6rem' }}>
                      {box.planType}
                    </div>
                    <div style={{
                      fontSize: '1.4rem',
                      fontWeight: 'bold',
                      marginBottom: '0.6rem'
                    }}>
                      {box.insurer}
                    </div>
                    <div style={{
                      fontSize: '1.2rem',
                      marginBottom: '1rem'
                    }}>
                      {box.planName}
                    </div>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>
                      {box.monthly}
                    </div>
                    {box.annualSavings && (
                      <div style={{
                        fontSize: '1.2rem',
                        color: 'green',
                        marginBottom: '1rem'
                      }}>
                        {box.annualSavings}
                      </div>
                    )}
                    <div style={{ marginTop: '0.5rem' }}>
                      <button
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          background: '#007BFF',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1.1rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        View plan
                      </button>
                      <div
                        style={{
                          marginTop: '0.5rem',
                          fontSize: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>Compare</span>
                        <input
                          type="checkbox"
                          style={{ marginLeft: '1rem', transform: 'scale(1.2)' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* PlanOptionsPanel => existing wizard table */}
            <PlanOptionsPanel
              userInputs={userInputs}
              onSelectPlan={handleSelectPlan}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
