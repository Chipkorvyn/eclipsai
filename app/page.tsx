// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** 
 * Helper: given a YOB, return child or adult franchise array.
 */
function getFranchiseOptions(yob: number): number[] {
  // If YOB is invalid => treat them as adult
  if (yob < 1900 || yob > 2025) {
    return [300, 500, 1000, 1500, 2000, 2500];
  }
  const ageIn2025 = 2025 - yob;
  if (ageIn2025 <= 18) {
    // child
    return [0, 100, 200, 300, 400, 500, 600];
  }
  // adult
  return [300, 500, 1000, 1500, 2000, 2500];
}

export default function HomePage() {
  const router = useRouter();

  // Keep YOB as a string so user can type partial digits
  const [yobInput, setYobInput] = useState('');
  const [franchise, setFranchise] = useState<number | ''>('');

  const [franchiseOptions, setFranchiseOptions] = useState<number[]>([]);
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  useEffect(() => {
    // parse YOB from string
    const parsed = parseInt(yobInput, 10);
    const validYOB = !Number.isNaN(parsed) ? parsed : 0;
    const newOptions = getFranchiseOptions(validYOB);

    setFranchiseOptions(newOptions);

    // If user’s chosen franchise not in new array => reset
    if (!newOptions.includes(Number(franchise))) {
      setFranchise('');
    }
  }, [yobInput]);

  // Button enabled if we have both YOB & franchise
  const isDisabled = !yobInput || !franchise;

  function handleButtonClick() {
    if (isDisabled) return;

    const parsedYob = parseInt(yobInput, 10);
    // Validate
    if (Number.isNaN(parsedYob) || parsedYob < 1900 || parsedYob > 2025) {
      alert('Please enter a valid Year of Birth (1900–2025).');
      return;
    }
    router.push(`/wizard?yob=${parsedYob}&franchise=${franchise}`);
  }

  // ------------------------- STYLES -------------------------
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#007BFF', // Blue background
    color: '#fff',              // White text
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2.5rem',
    textAlign: 'center',
    marginBottom: '1rem',
    lineHeight: 1.2
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '1.2rem',
    textAlign: 'center',
    marginBottom: '2rem'
  };

  const highlightNumberStyle: React.CSSProperties = {
    color: '#000',
    backgroundColor: '#fff',
    padding: '0 0.3rem',
    borderRadius: '3px'
  };

  const boxStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '10px',
    color: '#000',
    width: '300px',
    padding: '1rem',
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  };

  const labelStyle: React.CSSProperties = {
    fontWeight: 500,
    marginBottom: '0.2rem'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '5px',
    border: '1px solid #ccc'
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
    textAlign: 'center'
  };
  // ----------------------------------------------------------

  return (
    <div style={containerStyle}>
      {/* Title */}
      <h1 style={titleStyle}>
        Overpaying for mandatory <br />
        Swiss health insurance
      </h1>

      {/* Subtitle (768 in black on white) */}
      <p style={subtitleStyle}>
        Health insurance costs rose by 8.7% in 2024 and will continue to rise.
        <br />
        Our users saved on average <span style={highlightNumberStyle}>768</span> CHF
      </p>

      {/* Box with Year of Birth & Own Risk */}
      <div style={boxStyle}>
        {/* Year of Birth */}
        <div>
          <div style={labelStyle}>Year of Birth</div>
          <input
            type="text"
            style={inputStyle}
            value={yobInput}
            onChange={(e) => {
              // Optionally filter out non-digits
              // if (!/^\d*$/.test(e.target.value)) return;
              setYobInput(e.target.value);
            }}
          />
        </div>

        {/* Franchise => child or adult => from franchiseOptions */}
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
      </div>

      {/* Button */}
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
