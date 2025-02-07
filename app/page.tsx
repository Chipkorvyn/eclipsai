'use client';

import React, { useState, useEffect } from 'react';
import plansData from '../data/plans.json';

//
// 1) Define the Plan interface
//
interface Plan {
  id: number;
  insurer: string;
  planType: string;
  franchise: number;
  annualPremium: number;
  planName: string;
}

//
// 2) Define the props for each step
//
type WizardProps = {
  formData: {
    name: string;
    postalCode: string;
    yearOfBirth: string;
    franchise: number;
    currentInsurer: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      postalCode: string;
      yearOfBirth: string;
      franchise: number;
      currentInsurer: string;
    }>
  >;
  handleNext?: () => void;
  handleBack?: () => void;
  filteredPlans?: Plan[];
  setFilteredPlans?: React.Dispatch<React.SetStateAction<Plan[]>>;
};

//
// 3) Main Wizard Component (no return-type annotation)
//
export default function WizardPage() {
  const [step, setStep] = useState<number>(1);

  const [formData, setFormData] = useState({
    name: '',
    postalCode: '',
    yearOfBirth: '',
    franchise: 300,
    currentInsurer: ''
  });

  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([]);

  function handleNext() {
    setStep((prev) => prev + 1);
  }

  function handleBack() {
    setStep((prev) => prev - 1);
  }

  return (
    <div style={{ margin: '2rem' }}>
      <h1>Insurance Wizard</h1>

      {step === 1 && (
        <StepOne
          formData={formData}
          setFormData={setFormData}
          handleNext={handleNext}
        />
      )}

      {step === 2 && (
        <StepTwo
          formData={formData}
          setFormData={setFormData}
          handleNext={handleNext}
          handleBack={handleBack}
        />
      )}

      {step === 3 && (
        <ResultsStep
          formData={formData}
          setFormData={setFormData}   // ADD THIS LINE
          filteredPlans={filteredPlans}
          setFilteredPlans={setFilteredPlans}
          handleBack={handleBack}
        />
      )}
    </div>
  );
}

//
// 4) Sub-Components: Remove any ": JSX.Element" return types
//

function StepOne({ formData, setFormData, handleNext }: WizardProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <div>
      <h2>Step 1: Personal Info</h2>
      <div>
        <label>Name:</label>
        <input name="name" value={formData.name} onChange={handleChange} />
      </div>

      <div>
        <label>Postal Code:</label>
        <input name="postalCode" value={formData.postalCode} onChange={handleChange} />
      </div>

      <div>
        <label>Year of Birth:</label>
        <input name="yearOfBirth" value={formData.yearOfBirth} onChange={handleChange} />
      </div>

      <button onClick={handleNext}>Next</button>
    </div>
  );
}

function StepTwo({ formData, setFormData, handleNext, handleBack }: WizardProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    // if name=franchise, convert it to number
    setFormData((prev) => ({ ...prev, [name]: name === 'franchise' ? Number(value) : value }));
  }

  return (
    <div>
      <h2>Step 2: Insurance Details</h2>
      <div>
        <label>Franchise:</label>
        <select name="franchise" value={formData.franchise} onChange={handleChange}>
          <option value="300">300</option>
          <option value="500">500</option>
          <option value="1000">1000</option>
          <option value="1500">1500</option>
          <option value="2000">2000</option>
          <option value="2500">2500</option>
        </select>
      </div>

      <div>
        <label>Current Insurer:</label>
        <input
          name="currentInsurer"
          value={formData.currentInsurer}
          onChange={handleChange}
        />
      </div>

      <button onClick={handleBack}>Back</button>
      <button onClick={handleNext}>Next</button>
    </div>
  );
}

function ResultsStep({
  formData,
  filteredPlans = [],
  setFilteredPlans,
  handleBack
}: WizardProps) {
  useEffect(() => {
    if (!setFilteredPlans) return;

    const newPlans = (plansData as Plan[]).filter(
      (plan) => plan.franchise === formData.franchise
    );
    setFilteredPlans(newPlans);
  }, [formData.franchise, setFilteredPlans]);

  return (
    <div>
      <h2>Step 3: Plan Results</h2>
      <p>Franchise selected: {formData.franchise}</p>
      <p>Total results: {filteredPlans.length}</p>

      {filteredPlans.map((plan) => (
        <div
          key={plan.id}
          style={{ border: '1px solid #ccc', margin: '1rem 0', padding: '1rem' }}
        >
          <h3>Insurer: {plan.insurer}</h3>
          <p>Plan Type: {plan.planType}</p>
          <p>Plan Name: {plan.planName}</p>
          <p>Annual Premium: {plan.annualPremium}</p>
        </div>
      ))}

      <button onClick={handleBack}>Back</button>
    </div>
  );
}
