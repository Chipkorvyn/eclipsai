'use client';

import React, { useState } from 'react';

export default function CompareModal({
  show,
  onClose,
  compareList
}: {
  show: boolean;
  onClose: () => void;
  compareList: any[];
}) {
  const [reportVisible, setReportVisible] = useState(false);

  if (!show) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  };

  const modalStyle: React.CSSProperties = {
    background: '#fff',
    padding: '1rem 2rem',
    width: '90%',
    maxWidth: '1000px',
    maxHeight: '80vh',
    overflowY: 'auto',
    borderRadius: '6px',
    fontFamily: "'Open Sans', sans-serif"
  };

  function handleGenerateSummary() {
    setReportVisible(true);
  }
  function handleCloseSummary() {
    setReportVisible(false);
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            float: 'right',
            background: '#aaa',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '0.4rem 0.8rem',
            cursor: 'pointer'
          }}
        >
          Close
        </button>

        <h2 style={{ marginTop: 0 }}>Plan Comparison Table (Transposed for Readability)</h2>
        <p>You have selected {compareList.length} plans (demo data below).</p>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '1.5rem'
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc', background: '#fafafa' }}>
              <th style={tableHead}>Plan</th>
              <th style={tableHead}>SLKK Grundversicherung</th>
              <th style={tableHead}>Vivao Sympany FlexHelp 24</th>
              <th style={tableHead}>Helsana BeneFit PLUS Telmed</th>
              <th style={tableHead}>CSS Gesundheitspraxis (HMO)</th>
              <th style={tableHead}>Vivao Sympany Casamed HMO</th>
            </tr>
          </thead>
          <tbody>
            <TableRow
              label="Model Type"
              col1="Free doctor choice"
              col2="Hybrid Telmed + HMO"
              col3="Telemedicine-first"
              col4="HMO (Assigned Practice)"
              col5="HMO (Assigned Practice)"
            />
            <TableRow
              label="First Contact for Medical Care"
              col1="Any doctor/hospital"
              col2="Medgate (Phone) or HMO Clinic"
              col3="Always call Medi24 first"
              col4="Assigned HMO Practice"
              col5="Assigned HMO Practice"
            />
            <TableRow
              label="Specialist Access"
              col1="Direct"
              col2="Referral required"
              col3="Referral required"
              col4="Referral required"
              col5="Referral required"
            />
            <TableRow
              label="Premium Discount"
              col1="None (standard)"
              col2="10–15% cheaper"
              col3="~15% cheaper"
              col4="~13% cheaper"
              col5="10–17% cheaper"
            />
            <TableRow
              label="Pros"
              col1="Full doctor choice"
              col2="Flexibility, lower premiums"
              col3="24/7 doctor access"
              col4="One-stop care, cost savings"
              col5="High savings, Sympany service"
            />
            <TableRow
              label="Cons"
              col1="Fewer digital tools, strict cost reviews"
              col2="Must follow rules, partner clinics full"
              col3="Must call every time, no direct specialist"
              col4="Limited choice, switching HMO difficult"
              col5="No flexibility outside HMO"
            />
            <TableRow
              label="Best For"
              col1="Unrestricted choice"
              col2="Flexibility + savings"
              col3="Phone-first comfort"
              col4="One main medical center"
              col5="Budget & coordinated care"
            />
          </tbody>
        </table>

        <button
          onClick={handleGenerateSummary}
          style={{
            background: '#2F62F4',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
        >
          Generate Summary
        </button>
        <button
          onClick={onClose}
          style={{
            background: '#aaa',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '0.4rem 0.8rem',
            cursor: 'pointer'
          }}
        >
          Close
        </button>

        {reportVisible && (
          <div style={{ marginTop: '1.5rem', background: '#f9f9f9', padding: '1rem' }}>
            <h2>Summary Report: Cost Savings from Sanitas Grundversicherung</h2>
            <h3>Current Plan &amp; Costs</h3>
            <ul>
              <li>You are currently paying <strong>CHF 5,192</strong> per year for Sanitas Grundversicherung (Franchise: 2,500).</li>
              <li>By switching to a more cost-effective plan, you could <strong>save up to CHF 1,050</strong> per year.</li>
            </ul>

            <h3>Savings Overview</h3>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '1.5rem'
              }}
            >
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #ccc' }}>
                  <th style={tableHead}>Plan</th>
                  <th style={tableHead}>Annual Cost</th>
                  <th style={tableHead}>Savings vs. Sanitas</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tableCell}><strong>SLKK Grundversicherung</strong></td>
                  <td style={tableCell}>CHF 4,942</td>
                  <td style={tableCell}>CHF 250</td>
                </tr>
                <tr>
                  <td style={tableCell}><strong>Vivao Sympany FlexHelp 24</strong></td>
                  <td style={tableCell}>CHF 4,142</td>
                  <td style={tableCell}><strong>CHF 1,050</strong></td>
                </tr>
                <tr>
                  <td style={tableCell}><strong>Helsana BeneFit PLUS Telmed</strong></td>
                  <td style={tableCell}>CHF 4,289</td>
                  <td style={tableCell}>CHF 903</td>
                </tr>
                <tr>
                  <td style={tableCell}><strong>CSS Gesundheitspraxis (HMO)</strong></td>
                  <td style={tableCell}>CHF 4,500</td>
                  <td style={tableCell}>CHF 692</td>
                </tr>
                <tr>
                  <td style={tableCell}><strong>Vivao Sympany Casamed HMO</strong></td>
                  <td style={tableCell}>CHF 4,176</td>
                  <td style={tableCell}>CHF 1,016</td>
                </tr>
              </tbody>
            </table>

            <h4>Best Choices for Maximum Savings</h4>
            <ul>
              <li>
                🔹 <strong>Vivao Sympany FlexHelp 24</strong> – Biggest savings (<strong>CHF 1,050</strong>) with a flexible approach.
              </li>
              <li>
                🔹 <strong>Vivao Sympany Casamed HMO</strong> – <strong>CHF 1,016</strong> saved with a structured HMO approach.
              </li>
            </ul>

            <h4>Best for Flexibility &amp; Savings</h4>
            <p>
              - If you <strong>want freedom</strong> to choose phone or clinic, <strong>FlexHelp 24</strong> is best.
              <br />
              - If you <strong>prefer an HMO practice</strong> and the rules, <strong>Casamed HMO</strong> is cost-effective.
            </p>

            <h4>Final Recommendation</h4>
            <p>
              For <strong>maximum savings</strong> while keeping practical healthcare access, 
              <strong>Vivao Sympany FlexHelp 24 (CHF 4,142)</strong> or <strong>Casamed HMO (CHF 4,176)</strong> are better than your current Sanitas plan.
            </p>

            <button
              onClick={handleCloseSummary}
              style={{
                background: '#aaa',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.4rem 0.8rem',
                cursor: 'pointer'
              }}
            >
              Hide Summary
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TableRow({
  label,
  col1,
  col2,
  col3,
  col4,
  col5
}: {
  label: string;
  col1: string;
  col2: string;
  col3: string;
  col4: string;
  col5: string;
}) {
  return (
    <tr style={{ borderBottom: '1px solid #eee' }}>
      <td style={tableCell}><strong>{label}</strong></td>
      <td style={tableCell}>{col1}</td>
      <td style={tableCell}>{col2}</td>
      <td style={tableCell}>{col3}</td>
      <td style={tableCell}>{col4}</td>
      <td style={tableCell}>{col5}</td>
    </tr>
  );
}

const tableHead: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.5rem',
  fontWeight: 'bold'
};

const tableCell: React.CSSProperties = {
  padding: '0.5rem',
  verticalAlign: 'top'
};
