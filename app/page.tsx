"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  computeAltersklasse,
  getFranchiseOptions,
  CURRENT_REF_YEAR
} from '@/lib/insuranceHelpers';

// Define a type for the postal records
interface PostalRecord {
  id: number;
  plz: string;
  gemeinde: string;
  ort_localite: string;
  kanton: string;
  region_int: string;
}

export default function HomePage() {
  const router = useRouter();

  // Mandatory fields
  const [yobInput, setYobInput] = useState('');
  const [franchise, setFranchise] = useState<number | ''>('');
  const [accidentCoverage, setAccidentCoverage] = useState('MIT-UNF');

  // Postal code logic
  const [plzInput, setPlzInput] = useState('');
  const [postalMatches, setPostalMatches] = useState<PostalRecord[]>([]);
  const [selectedPostal, setSelectedPostal] = useState<PostalRecord | null>(null);

  // Franchise array
  const [franchiseOptions, setFranchiseOptions] = useState<number[]>([]);
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  // Update franchise options whenever YOB changes
  useEffect(() => {
    const parsedYob = parseInt(yobInput, 10);
    const ak = computeAltersklasse(parsedYob);
    const opts = getFranchiseOptions(ak);

    setFranchiseOptions(opts);
    if (!opts.includes(Number(franchise))) {
      setFranchise('');
    }
  }, [yobInput, franchise]);

  // Postal code autocomplete
  useEffect(() => {
    if (!plzInput) {
      setPostalMatches([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/postal?search=${encodeURIComponent(plzInput)}`)
        .then((r) => r.json())
        .then((data: PostalRecord[]) => setPostalMatches(data))
        .catch(() => setPostalMatches([]));
    }, 300);
    return () => clearTimeout(t);
  }, [plzInput]);

  function handleSelectPostal(row: PostalRecord) {
    setSelectedPostal(row);
    setPlzInput(row.plz);
    setPostalMatches([]);
  }

  // Only enabled if all fields are valid
  const isDisabled = !yobInput || !franchise || !accidentCoverage || !selectedPostal;

  function handleButtonClick() {
    if (isDisabled) return;

    const parsedYob = parseInt(yobInput, 10);
    if (Number.isNaN(parsedYob) || parsedYob < 1900 || parsedYob > CURRENT_REF_YEAR) {
      alert(`Please enter a valid Year of Birth (1900 - ${CURRENT_REF_YEAR}).`);
      return;
    }

    router.push(
      `/wizard?yob=${parsedYob}`
      + `&franchise=${franchise}`
      + `&accident=${accidentCoverage}`
      + `&postalId=${selectedPostal?.id || ''}`
    );
  }

  return (
    <div className="min-h-screen bg-blue-600 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl text-center mb-5 leading-tight">
        Don't Wait Until November !
      </h1>

      <p className="text-2xl text-center mb-8">
        Most health insurance savings happen in November, <br />
        but some plans can be changed monthly or mid-year.
        <br />
        <br />
        <em>Alpha version focused on savings.
        <br />
        Accounts, saved data, and automations coming soon.</em>
      </p>

      <div className="bg-white text-black w-72 p-6 mb-4 rounded-lg flex flex-col gap-4">
        {/* Year of Birth */}
        <div>
          <label className="font-medium mb-1 block">Year of Birth</label>
          <input
            type="text"
            className="w-full p-2 rounded border border-gray-300"
            value={yobInput}
            onChange={(e) => setYobInput(e.target.value)}
          />
        </div>

        {/* Postal Code */}
        <div>
          <label className="font-medium mb-1 block">Postal Code</label>
          <input
            type="text"
            className="w-full p-2 rounded border border-gray-300"
            value={plzInput}
            onChange={(e) => {
              setPlzInput(e.target.value);
              setSelectedPostal(null);
            }}
          />
          {postalMatches.length > 0 && !selectedPostal && (
            <ul className="border border-gray-300 mt-1 max-h-40 overflow-y-auto m-0 p-0">
              {postalMatches.map((row) => (
                <li
                  key={row.id}
                  className="list-none p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSelectPostal(row)}
                >
                  {row.plz} {row.ort_localite} ({row.gemeinde})
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Franchise */}
        <div>
          <label className="font-medium mb-1 block">Own risk</label>
          <select
            className="w-full p-2 rounded border border-gray-300"
            value={franchise === '' ? '' : franchise}
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

        {/* Accident coverage */}
        <div>
          <label className="font-medium mb-1 block">Accident coverage</label>
          <select
            className="w-full p-2 rounded border border-gray-300"
            value={accidentCoverage}
            onChange={(e) => setAccidentCoverage(e.target.value)}
          >
            <option value="MIT-UNF">With Accident</option>
            <option value="OHN-UNF">Without Accident</option>
          </select>
        </div>
      </div>

      <button
        className={`
          w-72 py-3 rounded-lg border-none 
          font-semibold text-base text-white
          ${isDisabled 
            ? 'bg-gray-400 cursor-not-allowed' 
            : isButtonPressed 
              ? 'bg-green-600' 
              : 'bg-blue-900 hover:bg-blue-800'
          }
        `}
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
