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

  if (!show) return null; // don't render if modal not open

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  };

  const modalStyle: React.CSSProperties = {
    background: '#fff',
    padding: '1rem',
    width: '90%',
    maxWidth: '1000px',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  function handleGenerateReport() {
    // Toggle the static summary text visible
    setReportVisible(true);
  }

  function handleCloseReport() {
    setReportVisible(false);
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Title referencing how many we actually selected, purely optional */}
        <h2>Compare {compareList.length} Plans (Static Demo)</h2>
        
        {/* 1) The transposed comparison table (static) */}
        <hr />
        <h3>2) Comparison Table (Transposed for Readability)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
          <thead>
            <tr>
              <th style={headerCellStyle}>&nbsp;</th>
              <th style={headerCellStyle}>SLKK Grundversicherung</th>
              <th style={headerCellStyle}>Vivao Sympany FlexHelp 24</th>
              <th style={headerCellStyle}>Helsana BeneFit PLUS Telmed</th>
              <th style={headerCellStyle}>CSS Gesundheitspraxis (HMO)</th>
              <th style={headerCellStyle}>Vivao Sympany Casamed HMO</th>
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
              col1="Those wanting unrestricted choice"
              col2="Those wanting flexibility + savings"
              col3="Those comfortable w/ phone-first care"
              col4="Those who like one main medical center"
              col5="Budget + coordinated care"
            />
          </tbody>
        </table>

        {/* 2) Generate Report button + optional close */}
        <button onClick={handleGenerateReport}>Generate Report</button>
        <button onClick={onClose} style={{ marginLeft: '1rem' }}>
          Close
        </button>

        {/* 3) The summary report text if user clicked "Generate Report" */}
        {reportVisible && (
          <div style={{ marginTop: '1rem', background: '#fafafa', padding: '0.5rem' }}>
            <SummaryReport />
            <button onClick={handleCloseReport} style={{ marginTop: '1rem' }}>
              Hide Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Just a helper row to keep the table code DRY */
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
  const cellStyle: React.CSSProperties = { borderBottom: '1px solid #eee', padding: '0.5rem' };
  return (
    <tr>
      <td style={cellStyle}><strong>{label}</strong></td>
      <td style={cellStyle}>{col1}</td>
      <td style={cellStyle}>{col2}</td>
      <td style={cellStyle}>{col3}</td>
      <td style={cellStyle}>{col4}</td>
      <td style={cellStyle}>{col5}</td>
    </tr>
  );
}

function SummaryReport() {
  return (
    <div>
      <hr />
      <h3>3) Summary Report: Cost Savings from Sanitas Grundversicherung</h3>
      <p><strong>Current Plan &amp; Costs</strong></p>
      <p>
        - You are currently paying <strong>CHF 5,192</strong> per year for Sanitas Grundversicherung (Franchise: 2,500).
        <br />
        - By switching to a more cost-effective plan, you could <strong>save up to CHF 1,050</strong> per year.
      </p>

      <h4> Savings Overview</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc' }}>
            <th style={headerCellStyle}>Plan</th>
            <th style={headerCellStyle}>Annual Cost</th>
            <th style={headerCellStyle}>Savings vs. Sanitas</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td>SLKK Grundversicherung</td>
            <td>CHF 4,942</td>
            <td>CHF 250</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td>Vivao Sympany FlexHelp 24</td>
            <td>CHF 4,142</td>
            <td><strong>CHF 1,050</strong></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td>Helsana BeneFit PLUS Telmed</td>
            <td>CHF 4,289</td>
            <td>CHF 903</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td>CSS Gesundheitspraxis (HMO)</td>
            <td>CHF 4,500</td>
            <td>CHF 692</td>
          </tr>
          <tr>
            <td>Vivao Sympany Casamed HMO</td>
            <td>CHF 4,176</td>
            <td>CHF 1,016</td>
          </tr>
        </tbody>
      </table>

      <h4> Best Choices for Maximum Savings</h4>
      <p>
        🔹 <strong>Vivao Sympany FlexHelp 24</strong> – Biggest savings (CHF 1,050) with the flexibility to choose
        between telemedicine or an HMO clinic.
        <br />
        🔹 <strong>Vivao Sympany Casamed HMO</strong> – CHF 1,016 saved with a structured, low-cost HMO approach.
      </p>

      <h4> Best for Flexibility &amp; Savings</h4>
      <p>
        - If you <strong>want freedom</strong> to choose between calling a doctor or visiting a clinic,
        <strong>FlexHelp 24</strong> is best.
        <br />
        - If you <strong>prefer a set medical practice</strong> and don’t mind the HMO system,
        <strong>Casamed HMO</strong> is the lowest-cost structured option.
      </p>

      <h4>Final Recommendation</h4>
      <p>
        For <strong>maximum savings</strong> while maintaining practical healthcare, 
        <strong>Vivao Sympany FlexHelp 24</strong> (CHF 4,142) or <strong>Casamed HMO</strong> (CHF 4,176)
        are the best options compared to your current Sanitas plan.
      </p>
    </div>
  );
}

const headerCellStyle: React.CSSProperties = {
  textAlign: 'left',
  borderBottom: '1px solid #ccc',
  padding: '0.5rem'
};
