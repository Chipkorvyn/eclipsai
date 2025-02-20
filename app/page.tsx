// File: app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Import your shared logic
import {
  computeAltersklasse,
  getFranchiseOptions,
  CURRENT_REF_YEAR
} from '@/lib/insuranceHelpers';

export default function HomePage() {
  const router = useRouter();

  // ---- States for the four mandatory fields ----
  const [yobInput, setYobInput] = useState('');            // Year of Birth (string)
  const [franchise, setFranchise] = useState<number | ''>(''); 
  const [accidentCoverage, setAccidentCoverage] = useState('MIT-UNF'); 

  // ---- States for postal code selection ----
  const [plzInput, setPlzInput] = useState('');            // typed text in the box
  const [postalMatches, setPostalMatches] = useState<any[]>([]); 
  const [selectedPostal, setSelectedPostal] = useState<any | null>(null);

  // ---- Additional states ----
  const [franchiseOptions, setFranchiseOptions] = useState<number[]>([]);
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  // Whenever YOB changes, recalc franchise options
  useEffect(() => {
    const parsedYob = parseInt(yobInput, 10);
    const ak = computeAltersklasse(parsedYob);
    const opts = getFranchiseOptions(ak);

    setFranchiseOptions(opts);
    // If the chosen franchise is not in the new array => reset
    if (!opts.includes(Number(franchise))) {
      setFranchise('');
    }
  }, [yobInput]);

  // POSTAL CODE Autocomplete => fetch matching rows
  useEffect(() => {
    if (!plzInput) {
      setPostalMatches([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/postal?search=${encodeURIComponent(plzInput)}`)
        .then((r) => r.json())
        .then((data) => {
          // data is array of { id, plz, gemeinde, ort_localite, kanton, region_int }
          setPostalMatches(data);
        })
        .catch(() => setPostalMatches([]));
    }, 300);
    return () => clearTimeout(t);
  }, [plzInput]);

  function handleSelectPostal(row: any) {
    // user picked from the list => finalize selection
    setSelectedPostal(row);
    setPlzInput(row.plz);
    setPostalMatches([]);
  }

  // Enable button only if all 4 fields are valid
  const isDisabled = !yobInput 
                     || !franchise
                     || !accidentCoverage
                     || !selectedPostal; // must confirm the postal row

  function handleButtonClick() {
    if (isDisabled) return;

    // Validate YOB
    const parsedYob = parseInt(yobInput, 10);
    if (
      Number.isNaN(parsedYob)
      || parsedYob < 1900
      || parsedYob > CURRENT_REF_YEAR
    ) {
      alert(`Please enter a valid Year of Birth (1900 - ${CURRENT_REF_YEAR}).`);
      return;
    }

    // Navigate to wizard with the chosen data:
    router.push(
      `/wizard?yob=${parsedYob}`
      + `&franchise=${franchise}`
      + `&accident=${accidentCoverage}`
      + `&postalId=${selectedPostal?.id || ''}`
    );
  }

  // ---------------------- STYLES ----------------------
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#007BFF',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '3rem',
    textAlign: 'center',
    marginBottom: '1.2rem',
    lineHeight: 1.2,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '1.4rem',
    textAlign: 'center',
    marginBottom: '2rem',
  };

  const highlightNumberStyle: React.CSSProperties = {
    color: '#000',
    backgroundColor: '#fff',
    padding: '0 0.3rem',
    borderRadius: '3px',
  };

  const boxStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '10px',
    color: '#000',
    width: '300px',
    padding: '1.5rem',
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };

  const labelStyle: React.CSSProperties = {
    fontWeight: 500,
    marginBottom: '0.2rem',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '5px',
    border: '1px solid #ccc',
  };

  const buttonStyle: React.CSSProperties = {
    width: '300px',
    padding: '0.75rem',
    borderRadius: '10px',
    border: 'none',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    backgroundColor: isButtonPressed ? '#28a745' : '#003b8e',
    color: '#fff',
    textAlign: 'center',
  };
  // ----------------------------------------------------

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Overpaying for Swiss Insurance?</h1>
      <p style={subtitleStyle}>
        Health insurance costs rose by 8.7% in 2024 and will continue to rise.
        <br />
        Our users saved on average <span style={highlightNumberStyle}>768</span> CHF
      </p>

      <div style={boxStyle}>
        {/* Year of Birth */}
        <div>
          <div style={labelStyle}>Year of Birth</div>
          <input
            type="text"
            style={inputStyle}
            value={yobInput}
            onChange={(e) => setYobInput(e.target.value)}
          />
        </div>

        {/* Postal Code => just like wizard */}
        <div>
          <div style={labelStyle}>Postal Code</div>
          <input
            type="text"
            style={inputStyle}
            value={plzInput}
            onChange={(e) => {
              setPlzInput(e.target.value);
              setSelectedPostal(null);
            }}
          />
          {postalMatches.length > 0 && !selectedPostal && (
            <ul style={{ border: '1px solid #ccc', margin: 0, padding: 0 }}>
              {postalMatches.map((row) => (
                <li
                  key={row.id}
                  style={{
                    listStyle: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSelectPostal(row)}
                >
                  {row.plz} {row.ort_localite} ({row.gemeinde})
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Own Risk (Franchise) */}
        <div>
          <div style={labelStyle}>Own risk</div>
          <select
            style={inputStyle}
            value={franchise}
            onChange={(e) => setFranchise(Number(e.target.value))}
          >
            <option value="">(Select)</option>
            {franchiseOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Accident Coverage */}
        <div>
          <div style={labelStyle}>Accident coverage</div>
          <select
            style={inputStyle}
            value={accidentCoverage}
            onChange={(e) => setAccidentCoverage(e.target.value)}
          >
            <option value="MIT-UNF">With Accident</option>
            <option value="OHN-UNF">Without Accident</option>
          </select>
        </div>
      </div>

      <button
        style={buttonStyle}
        disabled={isDisabled}
        onMouseDown={() => setIsButtonPressed(true)}
        onMouseUp={() => setIsButtonPressed(false)}
        onMouseLeave={() => setIsButtonPressed(false)}
        onClick={handleButtonClick}
      >
        Save on health insurance
      </button>
    </div>
  );
}
