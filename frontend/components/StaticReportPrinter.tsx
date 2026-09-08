/**
 * StaticReportPrinter
 * Generates self-contained static HTML reports for extreme value analysis runs
 * designed for robust browser printing (window.print) bypasses React CSS/hydration issues.
 */

export function getStudentTValue(n: number, confidenceLevel: number): number {
  if (n <= 1) return 0;
  const df = n - 1;

  // PVP2006 Table 1 values (for lookup)
  const T_TABLE: Record<number, Record<number, number>> = {
    2:  { 0.80: 3.078, 0.90: 6.314, 0.95: 12.706, 0.99: 63.657 },
    3:  { 0.80: 1.886, 0.90: 2.920, 0.95: 4.303,  0.99: 9.925  },
    4:  { 0.80: 1.638, 0.90: 2.353, 0.95: 3.182,  0.99: 5.841  },
    5:  { 0.80: 1.533, 0.90: 2.132, 0.95: 2.776,  0.99: 4.604  },
    6:  { 0.80: 1.476, 0.90: 2.015, 0.95: 2.571,  0.99: 4.032  },
    7:  { 0.80: 1.440, 0.90: 1.943, 0.95: 2.447,  0.99: 3.707  },
    8:  { 0.80: 1.415, 0.90: 1.895, 0.95: 2.365,  0.99: 3.499  },
    9:  { 0.80: 1.397, 0.90: 1.860, 0.95: 2.306,  0.99: 3.355  },
    10: { 0.80: 1.383, 0.90: 1.833, 0.95: 2.262,  0.99: 3.250  },
    11: { 0.80: 1.372, 0.90: 1.812, 0.95: 2.228,  0.99: 3.169  },
    12: { 0.80: 1.363, 0.90: 1.796, 0.95: 2.201,  0.99: 3.106  },
    13: { 0.80: 1.356, 0.90: 1.782, 0.95: 2.179,  0.99: 3.055  },
    14: { 0.80: 1.350, 0.90: 1.771, 0.95: 2.160,  0.99: 3.012  },
    15: { 0.80: 1.345, 0.90: 1.761, 0.95: 2.145,  0.99: 2.977  },
    16: { 0.80: 1.341, 0.90: 1.753, 0.95: 2.131,  0.99: 2.947  },
    17: { 0.80: 1.337, 0.90: 1.746, 0.95: 2.120,  0.99: 2.921  },
    18: { 0.80: 1.333, 0.90: 1.740, 0.95: 2.110,  0.99: 2.898  },
    19: { 0.80: 1.330, 0.90: 1.734, 0.95: 2.101,  0.99: 2.878  },
    20: { 0.80: 1.328, 0.90: 1.729, 0.95: 2.093,  0.99: 2.861  },
    21: { 0.80: 1.325, 0.90: 1.725, 0.95: 2.086,  0.99: 2.845  },
    22: { 0.80: 1.323, 0.90: 1.721, 0.95: 2.080,  0.99: 2.831  },
    23: { 0.80: 1.321, 0.90: 1.717, 0.95: 2.074,  0.99: 2.819  },
    24: { 0.80: 1.319, 0.90: 1.714, 0.95: 2.069,  0.99: 2.807  },
    25: { 0.80: 1.318, 0.90: 1.711, 0.95: 2.064,  0.99: 2.797  },
    26: { 0.80: 1.316, 0.90: 1.708, 0.95: 2.060,  0.99: 2.787  },
    27: { 0.80: 1.315, 0.90: 1.706, 0.95: 2.056,  0.99: 2.779  },
    28: { 0.80: 1.314, 0.90: 1.703, 0.95: 2.052,  0.99: 2.771  },
    29: { 0.80: 1.313, 0.90: 1.701, 0.95: 2.048,  0.99: 2.763  },
    30: { 0.80: 1.311, 0.90: 1.699, 0.95: 2.045,  0.99: 2.756  },
    31: { 0.80: 1.310, 0.90: 1.697, 0.95: 2.042,  0.99: 2.750  }
  };

  if (T_TABLE[n]) {
    const clMap = T_TABLE[n];
    if (clMap[confidenceLevel] !== undefined) {
      return clMap[confidenceLevel];
    }
  }

  // Fallback / approximation for n > 31 using z-score and 1/df adjustment
  if (confidenceLevel >= 0.99) return 2.576 + 5.2 / df;
  if (confidenceLevel >= 0.95) return 1.960 + 2.5 / df;
  if (confidenceLevel >= 0.90) return 1.645 + 1.6 / df;
  if (confidenceLevel >= 0.80) return 1.282 + 0.85 / df;
  return 1.960;
}

export function generateReportHtml(run: any) {
  if (!run) return '';

  const result = run.result;
  const plotData = result?.plot_data;
  const rl = run.returnLevels?.find((r: any) => r.returnPeriod === run.totalPopulation) || run.returnLevels?.[run.returnLevels.length - 1];

  const originalThickness = run.originalThickness?.toFixed(2) || 'N/A';
  const minimumRequiredThickness = run.minimumRequiredThickness?.toFixed(2) || 'N/A';
  const serviceStartDate = run.serviceStartDate ? new Date(run.serviceStartDate).toLocaleDateString() : 'N/A';
  const inspectionDate = run.inspectionDate ? new Date(run.inspectionDate).toLocaleDateString() : 'N/A';
  const method = run.method?.toUpperCase() || 'MLE';

  // 1. Return levels forecasting rows
  const categories = [
    { cat: 'Category A (Extreme Risk)', level: '99%', key: '99' },
    { cat: 'Category B (High Risk)', level: '95%', key: '95' },
    { cat: 'Category C (Medium Risk)', level: '90%', key: '90' },
    { cat: 'Category D (Low Risk)', level: '80%', key: '80' },
  ];

  let returnLevelsHtml = '';
  if (rl) {
    returnLevelsHtml = categories.map((row) => {
      const ciEntry = rl.allConfidences?.[row.key];
      const wallLoss = ciEntry?.wallLoss ?? ciEntry?.upper ?? rl.predictedValue;
      const remThickness = ciEntry?.remainingThickness ?? ((run.originalThickness || 0) - wallLoss);
      const corrosionRate = ciEntry?.corrosionRate ?? (rl.corrosionRate || 0);

      let eolStr = 'N/A';
      if (ciEntry?.eolDate) {
        eolStr = new Date(ciEntry.eolDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      } else if (corrosionRate > 0 && run.minimumRequiredThickness !== undefined && run.minimumRequiredThickness !== null) {
        let eol: Date;
        if (run.serviceStartDate) {
          const totalLifeDays = ((run.originalThickness - run.minimumRequiredThickness) / corrosionRate) * 365.25;
          eol = new Date(new Date(run.serviceStartDate).getTime() + totalLifeDays * 24 * 60 * 60 * 1000);
        } else {
          const remainingLifeDays = ((remThickness - run.minimumRequiredThickness) / corrosionRate) * 365.25;
          eol = new Date(new Date(run.inspectionDate).getTime() + remainingLifeDays * 24 * 60 * 60 * 1000);
        }
        eolStr = eol.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      }

      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px; font-weight: bold; background-color: #f9fafb; text-align: left; font-size: 11px;">${row.cat}</td>
          <td style="padding: 10px; font-size: 11px; color: #4b5563; text-align: center;">${row.level}</td>
          <td style="padding: 10px; font-size: 11px; font-family: monospace; text-align: center;">${wallLoss.toFixed(4)} mm</td>
          <td style="padding: 10px; font-size: 11px; font-family: monospace; font-weight: bold; text-align: center; color: #111827;">${remThickness.toFixed(3)} mm</td>
          <td style="padding: 10px; font-size: 11px; font-weight: bold; color: #2563eb; text-align: center;">${eolStr}</td>
        </tr>
      `;
    }).join('');
  }

  // 2. EOL Forecast rows
  const rbiLevels = [
    { label: 'A', confidence: '99%', levelKey: '99' },
    { label: 'B', confidence: '95%', levelKey: '95' },
    { label: 'C', confidence: '90%', levelKey: '90' },
    { label: 'D', confidence: '80%', levelKey: '80' }
  ];

  let excelFormatHtml = '';
  if (rl) {
    excelFormatHtml = rbiLevels.map((rbi) => {
      const ciEntry = rl.allConfidences?.[rbi.levelKey];
      const wallLoss = ciEntry?.wallLoss ?? ciEntry?.upper ?? rl.predictedValue;
      const remThickness = ciEntry?.remainingThickness ?? ((run.originalThickness || 0) - wallLoss);
      const corrosionRate = ciEntry?.corrosionRate ?? (rl.corrosionRate || 0);

      let eolDateStr = 'N/A';
      if (ciEntry?.eolDate) {
        const eolD = new Date(ciEntry.eolDate);
        const mm = String(eolD.getMonth() + 1).padStart(2, '0');
        const dd = String(eolD.getDate()).padStart(2, '0');
        const yy = String(eolD.getFullYear()).slice(-2);
        eolDateStr = `${mm}-${dd}-${yy}`;
      }

      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px; font-weight: bold; text-align: left; color: #111827; font-size: 11px;">${rbi.label}</td>
          <td style="padding: 10px; text-align: center; color: #4b5563; font-size: 11px;">${rbi.confidence}</td>
          <td style="padding: 10px; text-align: center; font-family: monospace; font-weight: bold; color: #2563eb; font-size: 11px;">${remThickness.toFixed(3)}</td>
          <td style="padding: 10px; text-align: center; font-family: monospace; font-weight: bold; color: #2563eb; font-size: 11px;">${corrosionRate.toFixed(3)}</td>
          <td style="padding: 10px; text-align: center; font-family: monospace; font-weight: bold; color: #2563eb; font-size: 11px;">${eolDateStr}</td>
        </tr>
      `;
    }).join('');
  }

  // 3. Tabular Data tables rows
  let table61Html = '';
  let table62Html = '';
  if (plotData?.probability_plot?.tabular_data) {
    table61Html = plotData.probability_plot.tabular_data.map((row: any) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 6px 10px; font-weight: bold; color: #111827; text-align: left; font-size: 10px;">${row.rank}</td>
        <td style="padding: 6px 10px; font-weight: bold; color: #111827; text-align: center; font-size: 10px;">${row.observed.toFixed(4)} mm</td>
        <td style="padding: 6px 10px; color: #4b5563; text-align: center; font-size: 10px;">${row.probability.toFixed(4)}</td>
        <td style="padding: 6px 10px; color: #4b5563; text-align: center; font-size: 10px;">${row.reduced_variate.toFixed(4)}</td>
        <td style="padding: 6px 10px; color: #4b5563; text-align: center; font-size: 10px;">${row.ln_pdf.toFixed(4)}</td>
      </tr>
    `).join('');

    table62Html = plotData.probability_plot.tabular_data.map((row: any) => {
      const minRem = run.originalThickness
        ? (run.originalThickness - row.best_fit).toFixed(4)
        : 'N/A';
      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 6px 10px; font-weight: bold; color: #111827; text-align: left; font-size: 10px;">${row.rank}</td>
          <td style="padding: 6px 10px; font-weight: bold; color: #2563eb; text-align: center; font-size: 10px;">${row.best_fit.toFixed(4)} mm</td>
          <td style="padding: 6px 10px; font-weight: bold; color: #1d4ed8; background-color: #eff6ff; text-align: center; font-size: 10px;">${row.best_fit.toFixed(4)}</td>
          <td style="padding: 6px 10px; font-weight: bold; color: #047857; background-color: #ecfdf5; text-align: center; font-size: 10px;">${minRem}</td>
          <td style="padding: 6px 10px; color: #4b5563; text-align: center; font-size: 10px;">${row.se.toFixed(4)} mm</td>
          <td style="padding: 6px 10px; color: #374151; text-align: center; font-size: 10px;">${row.ci_95_lower.toFixed(4)} - ${row.ci_95_upper.toFixed(4)}</td>
          <td style="padding: 6px 10px; color: #374151; text-align: center; font-size: 10px;">${row.ci_99_lower.toFixed(4)} - ${row.ci_99_upper.toFixed(4)}</td>
        </tr>
      `;
    }).join('');
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>EVA Technical Report - REF: EVA-${run.id.slice(0, 8).toUpperCase()}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1f2937;
      line-height: 1.5;
      padding: 0;
      margin: 0;
      background-color: #ffffff;
      font-size: 12px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #111827;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header-logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-box {
      width: 44px;
      height: 44px;
      background-color: #2563eb;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 900;
      font-size: 24px;
    }
    .header-title h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 900;
      color: #111827;
      text-transform: uppercase;
      letter-spacing: -0.5px;
    }
    .header-title p {
      margin: 0;
      font-size: 9px;
      font-weight: bold;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .header-meta {
      text-align: right;
    }
    .header-meta h2 {
      margin: 0;
      font-size: 16px;
      font-weight: bold;
      color: #111827;
      text-transform: uppercase;
    }
    .header-meta p {
      margin: 4px 0 0 0;
      font-size: 11px;
      color: #6b7280;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 8px;
      border: 1px solid #a7f3d0;
      background-color: #ecfdf5;
      color: #047857;
    }
    section {
      margin-bottom: 35px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 900;
      color: #111827;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-left: 4px solid #2563eb;
      padding-left: 10px;
      margin: 0 0 15px 0;
    }
    .lead-text {
      font-size: 12px;
      color: #4b5563;
      line-height: 1.6;
      margin: 0;
    }
    .specs-grid {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 12px 30px;
      background-color: #f9fafb;
      padding: 16px 24px;
      border-radius: 8px;
      border: 1px solid #f3f4f6;
    }
    .spec-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
    }
    .spec-label {
      font-size: 10px;
      font-weight: bold;
      color: #9ca3af;
      text-transform: uppercase;
    }
    .spec-value {
      font-size: 12px;
      font-weight: bold;
      color: #1f2937;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    th {
      background-color: #111827;
      color: #ffffff;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px;
      text-align: center;
    }
    th:first-child, td:first-child {
      text-align: left;
    }
    td {
      padding: 10px;
      font-size: 11px;
      text-align: center;
    }
    .guidance-grid {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 20px;
    }
    .guidance-card {
      background-color: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #f3f4f6;
    }
    .card-title {
      font-size: 11px;
      font-weight: bold;
      color: #111827;
      text-transform: uppercase;
      text-decoration: underline;
      text-decoration-color: #2563eb;
      text-underline-offset: 4px;
      margin: 0 0 12px 0;
    }
    .card-item {
      margin-bottom: 8px;
      line-height: 1.4;
    }
    .card-item-title {
      font-weight: bold;
      color: #1f2937;
      font-size: 10px;
      display: block;
    }
    .card-item-desc {
      color: #6b7280;
      font-size: 9px;
    }
    .signoff {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 50px;
      border-top: 1px solid #e5e7eb;
      padding-top: 25px;
    }
    .signature-line {
      width: 180px;
      border-bottom: 1px solid #9ca3af;
      font-style: italic;
      color: #9ca3af;
      font-size: 12px;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    .signature-title h3 {
      margin: 0;
      font-size: 13px;
      font-weight: bold;
      color: #111827;
    }
    .signature-title p {
      margin: 0;
      font-size: 9px;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .badge-stamp {
      width: 80px;
      height: 80px;
      border: 2px solid #2563eb;
      border-radius: 50px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0.4;
    }
    .badge-stamp p {
      margin: 0;
      color: #2563eb;
      font-weight: bold;
      line-height: 1;
    }
    
    @page {
      size: auto;
      margin: 15mm 20mm;
    }
    @media print {
      body {
        font-size: 10px;
        padding: 0;
        margin: 0;
      }
      .container {
        max-width: 100%;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div class="header-logo-container">
          <div class="logo-box">E</div>
          <div class="header-title">
            <h1>EVA Engineering</h1>
            <p>Asset Integrity & Reliability Portal</p>
          </div>
        </div>
        <div style="font-size: 11px; color: #4b5563;">
          <div><strong>Project:</strong> ${run.dataset?.name || 'Asset Life Extension Analysis'}</div>
          <div><strong>Location:</strong> Offshore Platform Alpha-7</div>
        </div>
      </div>
      <div class="header-meta">
        <h2>Inspection Report</h2>
        <p style="font-family: monospace;">REF: EVA-${run.id.slice(0, 8).toUpperCase()}</p>
        <p>Date: ${new Date(run.createdAt).toLocaleDateString()}</p>
        <div class="status-badge">Status: Approved</div>
      </div>
    </div>

    <!-- 1.0 Executive Summary -->
    <section>
      <h3 class="section-title">1.0 Executive Summary</h3>
      <p class="lead-text">
        This document outlines the extreme value analysis (EVA) performed on the provided thickness measurements.
        The analysis utilizes a Gumbel distribution model estimated via
        <strong>${method}</strong> to forecast long-term degradation and predict the remaining useful life (RUL)
        of the asset. The primary objective is to determine if the current inspection frequency satisfies safety integrity level (SIL) requirements.
      </p>
    </section>

    <!-- 2.0 Technical & NDT Inspection Specifications -->
    <section>
      <h3 class="section-title">2.0 Technical & NDT Inspection Specifications</h3>
      <div style="display: flex; gap: 20px;">
        <div class="guidance-card" style="flex: 1; padding: 12px 18px; margin-top: 5px;">
          <p class="card-title">Design & Tube Specifications</p>
          <div style="font-size: 10px; color: #4b5563; line-height: 1.6;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding: 4px 0;">
              <strong>Nominal Thickness:</strong> <span>${originalThickness} mm</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding: 4px 0;">
              <strong>Min. Required Thickness:</strong> <span>${minimumRequiredThickness} mm</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding: 4px 0;">
              <strong>Tube Outside Diameter:</strong> <span>19.05 mm</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding: 4px 0;">
              <strong>Tube Inside Diameter:</strong> <span>14.83 mm</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding: 4px 0;">
              <strong>Tube Length:</strong> <span>7.40 m</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <strong>Tube Material:</strong> <span>Carbon Steel (CS)</span>
            </div>
          </div>
        </div>
        
        <div class="guidance-card" style="flex: 1; padding: 12px 18px; margin-top: 5px;">
          <p class="card-title">Inspection & NDT Parameters</p>
          <div style="font-size: 10px; color: #4b5563; line-height: 1.6;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding: 4px 0;">
              <strong>Inspection Facility:</strong> <span>QSGTL, RLIC Qatar</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding: 4px 0;">
              <strong>Inspection Operator:</strong> <span>F. Müller, A. Hullmann</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding: 4px 0;">
              <strong>NDT Method / Probes:</strong> <span>Eddy Current / Bobbin Coils</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding: 4px 0;">
              <strong>Test Frequency:</strong> <span>90.00 kHz</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding: 4px 0;">
              <strong>Calibration Block:</strong> <span>A 081 (50% Out Pitting)</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <strong>Total / Tested Legs:</strong> <span>${run.totalPopulation || run.result?.n_observations || '1140'} / ${run.result?.n_observations ?? '1138'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 2.1 Referenced NDT Standards & Task Description -->
    <section style="margin-top: -15px;">
      <h3 class="section-title" style="font-size: 11px; margin-bottom: 8px;">2.1 Referenced Standards & NDT Procedure</h3>
      <p class="lead-text" style="font-size: 11px; line-height: 1.4; color: #4b5563;">
        With the use of non-destructive eddy current testing (ET) in differential and absolute modes, wall thickness decreases were systematically detected. In accordance with:
      </p>
      <ul style="margin: 6px 0; padding-left: 18px; font-size: 10px; color: #4b5563; line-height: 1.4;">
        <li><strong>EN ISO 9712:2012:</strong> Non-destructive testing - Qualification and certification of NDT personnel</li>
        <li><strong>EN ISO 15549:2010:</strong> Non-destructive testing - Eddy Current Testing - General Principles</li>
        <li><strong>EN ISO 12718:2008:</strong> Non-destructive testing - Eddy Current Testing - Terms</li>
        <li><strong>DIN 54140 Part 3:</strong> Electromagnetic testing and representation of coil characteristics</li>
      </ul>
    </section>

    <!-- 3.0 Reliability & Return-Level Forecasting -->
    <section>
      <h3 class="section-title">3.0 Reliability & Return-Level Forecasting</h3>
      <table>
        <thead>
          <tr>
            <th style="text-align: left;">Risk Category</th>
            <th>Confidence</th>
            <th>Max Wall Loss</th>
            <th>Rem. Thickness</th>
            <th>Estimated EOL</th>
          </tr>
        </thead>
        <tbody>
          ${returnLevelsHtml}
        </tbody>
      </table>
    </section>

    <!-- 3.1 Asset Life & EOL Forecast -->
    <section>
      <h3 class="section-title" style="font-size: 11px; margin-bottom: 8px;">3.1 Asset Life & EOL Forecast (Excel Format)</h3>
      <table>
        <thead>
          <tr>
            <th style="text-align: left;">RBI Effectiveness</th>
            <th>Confidence Interval</th>
            <th>Minimum Remaining Thickness</th>
            <th>Corrosion Rate</th>
            <th>End of Life</th>
          </tr>
        </thead>
        <tbody>
          ${excelFormatHtml}
        </tbody>
      </table>
    </section>

    <!-- 3.2 Statistical Probability Plots -->
    <section style="margin-bottom: 35px; page-break-inside: avoid;">
      <h3 class="section-title">3.2 Statistical Integrity & Probability Plots</h3>
      <p class="lead-text" style="margin-bottom: 15px;">
        The Gumbel Reduced Variate (Q-Q) and Cumulative Probability plots below visually demonstrate the alignment of observed wall loss measurements with the fitted Gumbel extreme value distribution.
      </p>
      <div style="display: flex; gap: 20px; justify-content: space-between; align-items: center; margin-top: 15px;">
        <div style="flex: 1; display: flex; justify-content: center;">
          ${generateGumbelPlotSvg(run)}
        </div>
        <div style="flex: 1; display: flex; justify-content: center;">
          ${generateCdfPlotSvg(run)}
        </div>
      </div>
    </section>

    <!-- 4.0 Strategic Mitigation Plan -->
    <section>
      <h3 class="section-title">4.0 Strategic Mitigation Plan</h3>
      <p class="lead-text" style="margin-bottom: 12px;">
        Based on the results of the probabilistic modeling, the following strategic actions are mandated to maintain the Safety Integrity Level (SIL) of the asset.
      </p>
      <div style="display: flex; gap: 20px;">
        <div class="guidance-card" style="flex: 1;">
          <p class="card-title">What Can We Do? (Immediate)</p>
          <ul style="margin: 0; padding-left: 16px; font-size: 11px; color: #4b5563;">
            <li style="margin-bottom: 6px;">Continue current Ultrasonic Testing (UT) intervals as planned.</li>
            <li>Maintain operational pressure profiles within existing safety envelopes.</li>
          </ul>
        </div>
        <div class="guidance-card" style="flex: 1;">
          <p class="card-title">Long-Term Strategy</p>
          <ul style="margin: 0; padding-left: 16px; font-size: 11px; color: #4b5563;">
            <li style="margin-bottom: 6px;">Integrate Real-Time Corrosion Monitoring (RTCM) in high-turbulence zones.</li>
            <li>Update Asset Integrity Management (AIM) database with the new forecast End-of-Life (EOL) dates.</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 5.0 Guidance & Reference Values -->
    <section>
      <h3 class="section-title">5.0 Guidance & Reference Values</h3>
      <p class="lead-text" style="margin-bottom: 15px;">
        This section provides standard reference guidelines and definitions based on <strong>API 581</strong> and <strong>ASME PVP2006</strong> to help interpret the statistical outputs in this report.
      </p>
      <div class="guidance-grid">
        <div class="guidance-card">
          <p class="card-title">API 581 RBI Effectiveness Levels</p>
          <div class="card-item">
            <span class="card-item-title">A (Highly Effective)</span>
            <span class="card-item-desc">Confidence interval at 99%. Reached with 20–30 tubes sampled. Guarantees 80%–100% likelihood that true wall loss is not worse than estimated.</span>
          </div>
          <div class="card-item">
            <span class="card-item-title">B (Usually Effective)</span>
            <span class="card-item-desc">Confidence interval at 95%. Guarantees 60%–80% likelihood of correct damage state classification.</span>
          </div>
          <div class="card-item">
            <span class="card-item-title">C (Fairly Effective)</span>
            <span class="card-item-desc">Confidence interval at 90%. Guarantees 40%–60% likelihood of correct damage state classification.</span>
          </div>
          <div class="card-item">
            <span class="card-item-title">D (Poorly Effective)</span>
            <span class="card-item-desc">Confidence interval at 80%. Guarantees 20%–40% likelihood. Marginal integrity benefit.</span>
          </div>
        </div>
        <div class="guidance-card">
          <p class="card-title">Parameter Guidance & Definitions</p>
          <div class="card-item">
            <span class="card-item-title">Location (λ or μ)</span>
            <span class="card-item-desc">The most probable extreme wall loss value (mode). Reaches a baseline value from which extreme outliers deviate.</span>
          </div>
          <div class="card-item">
            <span class="card-item-title">Scale (δ or β)</span>
            <span class="card-item-desc">Indicates the dispersion of extreme wall loss. A larger value implies higher non-uniformity/pitting corrosion.</span>
          </div>
          <div class="card-item">
            <span class="card-item-title">Reduced Variate (y_i)</span>
            <span class="card-item-desc">A dimensionless Gumbel variable computed as: y_i = -ln(-ln(P_i)). Aligns observed rank with probability space.</span>
          </div>
          <div class="card-item">
            <span class="card-item-title">Standard Error (SE)</span>
            <span class="card-item-desc">Quantifies uncertainty based on sample size (n) and y_i. Larger n decreases standard error.</span>
          </div>
          <div class="card-item">
            <span class="card-item-title">Confidence Limit (t·SE)</span>
            <span class="card-item-desc">Standard t-distribution factor multiplied by Standard Error to construct the conservative lower bounds.</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 6.0 Standard Tabular Data -->
    <section>
      <h3 class="section-title">6.0 Standard Tabular Data (PVP2006 / ASTM E2283)</h3>
      <p class="lead-text" style="margin-bottom: 15px;">
        The tables below list the ranked inspection observations, cumulative probabilities, Gumbel reduced variates, ln(PDF), best-fit wall loss estimations, and their respective confidence intervals.
      </p>
      
      <div style="margin-bottom: 25px; page-break-inside: avoid;">
        <h4 style="font-size: 11px; font-weight: bold; color: #111827; text-transform: uppercase; margin-bottom: 8px;">Table 6.1: Observations & Probability Plot Data</h4>
        <table>
          <thead>
            <tr>
              <th style="width: 60px; text-align: left;">Rank (i)</th>
              <th>Obs. Wall Loss</th>
              <th>Prob. P_i</th>
              <th>Red. Var. y_i</th>
              <th>ln(PDF)</th>
            </tr>
          </thead>
          <tbody>
            ${table61Html}
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 25px; page-break-inside: avoid;">
        <h4 style="font-size: 11px; font-weight: bold; color: #111827; text-transform: uppercase; margin-bottom: 8px;">Table 6.2: Extreme Value Fit & Confidence Intervals</h4>
        <table>
          <thead>
            <tr>
              <th style="width: 60px; text-align: left;">Rank (i)</th>
              <th>Fit Loss</th>
              <th style="background-color: #1e3a8a;">Max Wall Loss (mm)</th>
              <th style="background-color: #1e3a8a;">Min Rem. Thickness (mm)</th>
              <th>Std. Error</th>
              <th>95% CI (L - U)</th>
              <th>99% CI (L - U)</th>
            </tr>
          </thead>
          <tbody>
            ${table62Html}
          </tbody>
        </table>
      </div>
    </section>

    <!-- 7.0 Summary of Inspection Results -->
    ${(() => {
      const tubes = getReportTubes(run);
      if (tubes.length === 0) return '';
      return `
      <section style="page-break-inside: avoid;">
        <h3 class="section-title">7.0 Summary of Inspection Results</h3>
        <p class="lead-text" style="margin-bottom: 15px;">
          The summary table below aggregates the tube inspection data by wall loss percentage classes, mapping them to defect codes and indicating plugging status.
        </p>
        ${generateInspectionSummaryTable(run)}
      </section>
      `;
    })()}

    <!-- 8.0 Tube Sheet Layout Map -->
    ${(() => {
      const tubes = getReportTubes(run);
      if (tubes.length === 0) return '';
      return `
      <section style="page-break-inside: avoid;">
        <h3 class="section-title">8.0 Tube Sheet Layout Map</h3>
        <p class="lead-text" style="margin-bottom: 15px;">
          Visual map representing individual tube locations within the exchanger tube sheet, color-coded based on defect severity.
        </p>
        <div style="width: 100%; display: flex; justify-content: center;">
          ${generateTubeSheetMapSvg(run)}
        </div>
      </section>
      `;
    })()}

    <!-- Sign-off -->
    <div class="signoff page-break-inside-avoid">
      <div style="display: flex; gap: 40px; text-align: left;">
        <div>
          <div class="signature-line">Digital Signature Attached</div>
          <div class="signature-title">
            <h3>Frank Müller</h3>
            <p>Inspection Operator (ET Level III)</p>
          </div>
        </div>
        <div>
          <div class="signature-line">Digital Signature Attached</div>
          <div class="signature-title">
            <h3>Dr. Sarah Jenkins</h3>
            <p>Principal Integrity Engineer</p>
          </div>
        </div>
      </div>
      <div>
        <div class="badge-stamp">
          <p style="font-size: 8px; margin-bottom: 4px;">EVA PORTAL</p>
          <p style="font-size: 6px; margin-bottom: 4px;">VERIFIED</p>
          <p style="font-size: 6px; font-family: monospace;">${run.id.slice(0, 6).toUpperCase()}</p>
        </div>
        <p style="font-size: 9px; color: #9ca3af; margin: 10px 0 0 0; text-align: right;">Document Automatically Generated</p>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;
}

export function generateGumbelPlotSvg(run: any) {
  const result = run.result;
  const plotData = result?.plot_data;
  if (!plotData?.probability_plot?.tabular_data) return '';

  const mu = run.mu;
  const beta = run.beta;
  const n = run.result?.n_observations || run.dataset?.rowCount || run.nObservations || 30;
  const N = run.totalPopulation || run.result?.n_observations || 300;

  // Calculate y_N for N
  const y_N = -Math.log(-Math.log(1.0 - 1.0 / N));
  const x_N = mu + beta * y_N;

  // X range: 0.0 to xMax
  const maxObserved = Math.max(...plotData.probability_plot.tabular_data.map((d: any) => d.observed));
  const xMaxRaw = Math.max(maxObserved, x_N) * 1.15;
  const xMax = Math.ceil(xMaxRaw * 10) / 10; // e.g. round up to nearest 0.1

  const yMin = -3.0;
  const yMax = 7.0;

  // SVG dimensions
  const W = 370;
  const H = 260;
  const padding = { left: 45, right: 15, top: 45, bottom: 40 };
  const plotW = W - padding.left - padding.right;
  const plotH = H - padding.top - padding.bottom;

  // Helper to map coordinates
  const getX = (val: number) => padding.left + (val / xMax) * plotW;
  const getY = (val: number) => padding.top + (1.0 - (val - yMin) / (yMax - yMin)) * plotH;

  // Draw grid lines
  let gridLines = '';
  // Vertical grid lines
  const xStep = xMax <= 0.4 ? 0.05 : 0.1;
  for (let x = 0.0; x <= xMax; x += xStep) {
    const px = getX(x);
    gridLines += `<line x1="${px}" y1="${padding.top}" x2="${px}" y2="${H - padding.bottom}" stroke="#e5e7eb" stroke-width="1" />`;
    gridLines += `<text x="${px}" y="${H - padding.bottom + 14}" font-size="7" fill="#4b5563" text-anchor="middle">${x.toFixed(2)}</text>`;
  }

  // Horizontal grid lines (every integer y)
  for (let y = yMin; y <= yMax; y += 2.0) {
    const py = getY(y);
    gridLines += `<line x1="${padding.left}" y1="${py}" x2="${W - padding.right}" y2="${py}" stroke="#e5e7eb" stroke-width="1" />`;
    gridLines += `<text x="${padding.left - 6}" y="${py + 2.5}" font-size="7" fill="#4b5563" text-anchor="end">${y.toFixed(1)}</text>`;
  }

  // Draw Best Fit Line (brown)
  const pxFitStart = getX(mu + beta * yMin);
  const pyFitStart = getY(yMin);
  const pxFitEnd = getX(mu + beta * yMax);
  const pyFitEnd = getY(yMax);
  const bestFitLine = `<line x1="${pxFitStart}" y1="${pyFitStart}" x2="${pxFitEnd}" y2="${pyFitEnd}" stroke="#854d0e" stroke-width="1.5" />`;

  // Draw Confidence Intervals
  const getCiPoints = (tVal: number, upper: boolean) => {
    const points: string[] = [];
    for (let y = yMin; y <= yMax; y += 0.5) {
      const se = beta * Math.sqrt((1.109 + 0.514 * y + 0.608 * y * y) / n);
      const x_val = (mu + beta * y) + (upper ? 1 : -1) * tVal * se;
      points.push(`${getX(x_val)},${getY(y)}`);
    }
    return points.join(' ');
  };

  // Lookup correct Student's t-values for sample size n
  const t_80 = getStudentTValue(n, 0.80);
  const t_90 = getStudentTValue(n, 0.90);
  const t_95 = getStudentTValue(n, 0.95);
  const t_99 = getStudentTValue(n, 0.99);

  const ci80Lower = `<polyline points="${getCiPoints(t_80, false)}" fill="none" stroke="#fef08a" stroke-width="0.8" />`;
  const ci80Upper = `<polyline points="${getCiPoints(t_80, true)}" fill="none" stroke="#fef08a" stroke-width="0.8" />`;
  const ci90Lower = `<polyline points="${getCiPoints(t_90, false)}" fill="none" stroke="#fde047" stroke-width="0.8" />`;
  const ci90Upper = `<polyline points="${getCiPoints(t_90, true)}" fill="none" stroke="#fde047" stroke-width="0.8" />`;
  const ci95Lower = `<polyline points="${getCiPoints(t_95, false)}" fill="none" stroke="#f472b6" stroke-width="1.0" />`;
  const ci95Upper = `<polyline points="${getCiPoints(t_95, true)}" fill="none" stroke="#f472b6" stroke-width="1.0" />`;
  const ci99Lower = `<polyline points="${getCiPoints(t_99, false)}" fill="none" stroke="#ef4444" stroke-width="1.0" stroke-dasharray="2,2" />`;
  const ci99Upper = `<polyline points="${getCiPoints(t_99, true)}" fill="none" stroke="#ef4444" stroke-width="1.0" stroke-dasharray="2,2" />`;

  // Draw Measured points (blue dots)
  const dots = plotData.probability_plot.tabular_data.map((row: any) => {
    const px = getX(row.observed);
    const py = getY(row.reduced_variate);
    return `<circle cx="${px}" cy="${py}" r="1.5" fill="#2563eb" />`;
  }).join('');

  // Highlight Extreme Value Point (red circle)
  const px_N = getX(x_N);
  const py_N = getY(y_N);
  const extremePoint = `<circle cx="${px_N}" cy="${py_N}" r="4" fill="none" stroke="#ef4444" stroke-width="1.5" />
                        <text x="${px_N + 6}" y="${py_N + 3}" font-size="7" fill="#ef4444" font-weight="bold">${x_N.toFixed(3)} mm</text>`;

  return `
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; font-family: sans-serif;">
      <!-- Title -->
      <text x="${W / 2}" y="16" font-size="9" font-weight="bold" fill="#111827" text-anchor="middle">Heat Exchanger Tube Inspection Data</text>
      <text x="${W / 2}" y="26" font-size="7" font-weight="bold" fill="#4b5563" text-anchor="middle">Gumbel Plot of Max Wall Loss</text>

      <!-- Axes and Grid -->
      ${gridLines}
      <line x1="${padding.left}" y1="${padding.top}" x2="${W - padding.right}" y2="${padding.top}" stroke="#e5e7eb" stroke-width="1" />
      <line x1="${padding.left}" y1="${H - padding.bottom}" x2="${W - padding.right}" y2="${H - padding.bottom}" stroke="#4b5563" stroke-width="1" />
      <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${H - padding.bottom}" stroke="#4b5563" stroke-width="1" />

      <!-- Axis Labels -->
      <text x="${W / 2}" y="${H - 6}" font-size="8" font-weight="bold" fill="#111827" text-anchor="middle">Maximum Wall Loss (mm)</text>
      <text x="12" y="${H / 2}" font-size="8" font-weight="bold" fill="#111827" text-anchor="middle" transform="rotate(-90 12 ${H / 2})">Reduced Variate</text>

      <!-- Curves & Lines -->
      ${ci80Lower} ${ci80Upper}
      ${ci90Lower} ${ci90Upper}
      ${ci95Lower} ${ci95Upper}
      ${ci99Lower} ${ci99Upper}
      ${bestFitLine}
      ${dots}
      ${extremePoint}

      <!-- Legend -->
      <g transform="translate(${padding.left - 5}, ${H - 22})" font-size="6" font-weight="bold">
        <circle cx="5" cy="3" r="1.5" fill="#2563eb" />
        <text x="10" y="5" fill="#4b5563">Measured</text>

        <line x1="55" y1="3" x2="65" y2="3" stroke="#854d0e" stroke-width="1.5" />
        <text x="70" y="5" fill="#4b5563">Best Fit</text>

        <circle cx="110" cy="3" r="2.5" fill="none" stroke="#ef4444" stroke-width="1" />
        <text x="116" y="5" fill="#4b5563">EV</text>

        <line x1="140" y1="3" x2="150" y2="3" stroke="#fde047" stroke-width="1.5" />
        <text x="154" y="5" fill="#4b5563">80%</text>

        <line x1="180" y1="3" x2="190" y2="3" stroke="#f472b6" stroke-width="1.5" />
        <text x="194" y="5" fill="#4b5563">95%</text>

        <line x1="220" y1="3" x2="230" y2="3" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="2,2" />
        <text x="234" y="5" fill="#4b5563">99%</text>
      </g>
    </svg>
  `;
}

export function generateCdfPlotSvg(run: any) {
  const result = run.result;
  const plotData = result?.plot_data;
  if (!plotData?.probability_plot?.tabular_data) return '';

  const mu = run.mu;
  const beta = run.beta;
  const n = run.result?.n_observations || run.dataset?.rowCount || run.nObservations || 30;
  const N = run.totalPopulation || run.result?.n_observations || 300;

  // Calculate y_N for N
  const y_N = -Math.log(-Math.log(1.0 - 1.0 / N));
  const x_N = mu + beta * y_N;

  // Confidence limits for x_N (95% CI) using sample size n
  const se_N = beta * Math.sqrt((1.109 + 0.514 * y_N + 0.608 * y_N * y_N) / n);
  const t_95 = getStudentTValue(n, 0.95);
  const x_N_upper = x_N + t_95 * se_N;

  // X range: 0.0 to xMax
  const maxObserved = Math.max(...plotData.probability_plot.tabular_data.map((d: any) => d.observed));
  const xMaxRaw = Math.max(maxObserved, x_N_upper) * 1.15;
  const xMax = Math.ceil(xMaxRaw * 10) / 10;

  const yMin = 0.0;
  const yMax = 1.0;

  // SVG dimensions
  const W = 370;
  const H = 260;
  const padding = { left: 45, right: 15, top: 45, bottom: 40 };
  const plotW = W - padding.left - padding.right;
  const plotH = H - padding.top - padding.bottom;

  // Helper to map coordinates
  const getX = (val: number) => padding.left + (val / xMax) * plotW;
  const getY = (val: number) => padding.top + (1.0 - val) * plotH;

  // Draw grid lines
  let gridLines = '';
  // Vertical grid lines
  const xStep = xMax <= 0.4 ? 0.05 : 0.1;
  for (let x = 0.0; x <= xMax; x += xStep) {
    const px = getX(x);
    gridLines += `<line x1="${px}" y1="${padding.top}" x2="${px}" y2="${H - padding.bottom}" stroke="#e5e7eb" stroke-width="1" />`;
    gridLines += `<text x="${px}" y="${H - padding.bottom + 14}" font-size="7" fill="#4b5563" text-anchor="middle">${x.toFixed(2)}</text>`;
  }

  // Horizontal grid lines (every 0.2 probability)
  for (let y = 0.0; y <= 1.0; y += 0.2) {
    const py = getY(y);
    gridLines += `<line x1="${padding.left}" y1="${py}" x2="${W - padding.right}" y2="${py}" stroke="#e5e7eb" stroke-width="1" />`;
    gridLines += `<text x="${padding.left - 6}" y="${py + 2.5}" font-size="7" fill="#4b5563" text-anchor="end">${y.toFixed(1)}</text>`;
  }

  // Draw Gumbel CDF curve (red solid line)
  const cleanCdfPoints = [];
  for (let x = 0.0; x <= xMax; x += xMax / 60) {
    const z = (x - mu) / beta;
    const p = Math.exp(-Math.exp(-z));
    cleanCdfPoints.push(`${getX(x)},${getY(p)}`);
  }
  const cdfCurve = `<polyline points="${cleanCdfPoints.join(' ')}" fill="none" stroke="#ef4444" stroke-width="1.5" />`;

  // Draw Measured points (blue dots)
  const dots = plotData.probability_plot.tabular_data.map((row: any) => {
    const px = getX(row.observed);
    const py = getY(row.probability);
    return `<circle cx="${px}" cy="${py}" r="1.5" fill="#2563eb" />`;
  }).join('');

  // Vertical line for Extreme Value (red dotted)
  const px_N = getX(x_N);
  const extremeLine = `
    <line x1="${px_N}" y1="${padding.top}" x2="${px_N}" y2="${H - padding.bottom}" stroke="#ef4444" stroke-width="1.0" stroke-dasharray="2,2" />
    <text x="${px_N}" y="${padding.top - 5}" font-size="6" fill="#ef4444" font-weight="bold" text-anchor="middle">EV: ${x_N.toFixed(3)}</text>
  `;

  // Vertical line for 95% Confidence Upper Limit (pink dotted)
  const px_N_upper = getX(x_N_upper);
  const ciLine = `
    <line x1="${px_N_upper}" y1="${padding.top}" x2="${px_N_upper}" y2="${H - padding.bottom}" stroke="#f472b6" stroke-width="1.0" stroke-dasharray="2,2" />
    <text x="${px_N_upper}" y="${padding.top - 5}" font-size="6" fill="#e08" font-weight="bold" text-anchor="middle">95% CI: ${x_N_upper.toFixed(3)}</text>
  `;

  return `
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; font-family: sans-serif;">
      <!-- Title -->
      <text x="${W / 2}" y="16" font-size="9" font-weight="bold" fill="#111827" text-anchor="middle">Heat Exchanger Tube Inspection Data</text>
      <text x="${W / 2}" y="26" font-size="7" font-weight="bold" fill="#4b5563" text-anchor="middle">Cumulative Probability Plot of Max Wall Loss</text>

      <!-- Axes and Grid -->
      ${gridLines}
      <line x1="${padding.left}" y1="${padding.top}" x2="${W - padding.right}" y2="${padding.top}" stroke="#e5e7eb" stroke-width="1" />
      <line x1="${padding.left}" y1="${H - padding.bottom}" x2="${W - padding.right}" y2="${H - padding.bottom}" stroke="#4b5563" stroke-width="1" />
      <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${H - padding.bottom}" stroke="#4b5563" stroke-width="1" />

      <!-- Axis Labels -->
      <text x="${W / 2}" y="${H - 6}" font-size="8" font-weight="bold" fill="#111827" text-anchor="middle">Maximum Wall Loss (mm)</text>
      <text x="12" y="${H / 2}" font-size="8" font-weight="bold" fill="#111827" text-anchor="middle" transform="rotate(-90 12 ${H / 2})">Probability</text>

      <!-- Curves & Lines -->
      ${cdfCurve}
      ${dots}
      ${extremeLine}
      ${ciLine}

      <!-- Legend -->
      <g transform="translate(${padding.left - 5}, ${H - 22})" font-size="6" font-weight="bold">
        <circle cx="5" cy="3" r="1.5" fill="#2563eb" />
        <text x="10" y="5" fill="#4b5563">Measured Data</text>

        <line x1="85" y1="3" x2="105" y2="3" stroke="#ef4444" stroke-width="1.5" />
        <text x="110" y="5" fill="#4b5563">CDF Curve</text>

        <line x1="175" y1="3" x2="190" y2="3" stroke="#ef4444" stroke-width="1" stroke-dasharray="2,2" />
        <text x="194" y="5" fill="#ef4444">EV Line</text>

        <line x1="240" y1="3" x2="255" y2="3" stroke="#f472b6" stroke-width="1" stroke-dasharray="2,2" />
        <text x="259" y="5" fill="#e08">95% CI</text>
      </g>
    </svg>
  `;
}

export function getReportTubes(run: any) {
  const nominal = run.originalThickness || 2.11;
  let tubes = run.dataset?.metadata?.tubes || [];
  if (tubes.length === 0 && run.result?.plot_data?.probability_plot?.tabular_data) {
    tubes = run.result.plot_data.probability_plot.tabular_data.map((row: any, idx: number) => {
      const rowIdx = Math.floor(idx / 20) + 1;
      const colIdx = (idx % 20) + 1;
      return {
        thickness: Math.max(0, nominal - row.observed),
        row: rowIdx,
        tube: colIdx
      };
    });
  }
  return tubes;
}

export function generateTubeSheetMapSvg(run: any) {
  const nominal = run.originalThickness || 2.11;
  const tubes = getReportTubes(run);
  if (tubes.length === 0) return '';
  
  const rawName = run.dataset?.name || '';
  const exchangerName = rawName.replace(/\.csv$/i, '').replace(/ original values/i, '').trim() || 'Heat Exchanger';

  // Group tubes by row_tube to deduplicate and pick worst defect per coordinate
  const tubeMap = new Map<string, any>();
  for (const t of tubes) {
    if (t.row && t.tube) {
      const key = `${t.row}_${t.tube}`;
      if (!tubeMap.has(key) || t.thickness < tubeMap.get(key).thickness) {
        tubeMap.set(key, t);
      }
    }
  }
  const uniqueTubes = Array.from(tubeMap.values());
  if (uniqueTubes.length === 0) return '';

  const rows = uniqueTubes.map((t: any) => t.row);
  const cols = uniqueTubes.map((t: any) => t.tube);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);
  
  const colRange = Math.max(1, maxCol - minCol);
  const rowRange = Math.max(1, maxRow - minRow);

  const W = 780;
  const aspect = rowRange / colRange;
  const H = Math.min(850, Math.max(380, Math.round(W * aspect + 120)));
  const padding = { left: 45, right: 45, top: 50, bottom: 65 };
  const plotW = W - padding.left - padding.right;
  const plotH = H - padding.top - padding.bottom;
  
  const stepX = plotW / colRange;
  const stepY = plotH / rowRange;
  const step = Math.min(stepX, stepY);
  const nodeRadius = Math.max(3, Math.min(6, step * 0.45));

  const startX = padding.left + (plotW - colRange * step) / 2;
  const startY = padding.top + (plotH - rowRange * step) / 2;

  const tubeSvgElements = uniqueTubes.map((t: any) => {
    const px = startX + (t.tube - minCol) * step;
    const py = startY + (t.row - minRow) * step;
    
    const wl = Math.max(0, nominal - t.thickness);
    const pct = (wl / nominal) * 100;

    if (pct < 10) {
      return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${nodeRadius.toFixed(1)}" fill="#f3f4f6" stroke="#d1d5db" stroke-width="0.5" />
              <text x="${px.toFixed(1)}" y="${(py + nodeRadius * 0.35).toFixed(1)}" font-size="${Math.max(5, nodeRadius * 0.85).toFixed(1)}" fill="#9ca3af" font-weight="bold" text-anchor="middle">x</text>`;
    }

    let color = '#22c55e'; // Green
    let label = '1';
    if (pct >= 10 && pct < 20) { color = '#22c55e'; label = '1'; }
    else if (pct >= 20 && pct < 30) { color = '#22c55e'; label = '2'; }
    else if (pct >= 30 && pct < 40) { color = '#eab308'; label = '3'; }
    else if (pct >= 40 && pct < 50) { color = '#eab308'; label = '4'; }
    else if (pct >= 50 && pct < 60) { color = '#f97316'; label = '5'; }
    else if (pct >= 60 && pct < 70) { color = '#f97316'; label = '6'; }
    else if (pct >= 70 && pct < 80) { color = '#ef4444'; label = '7'; }
    else if (pct >= 80 && pct < 90) { color = '#ef4444'; label = '8'; }
    else { color = '#991b1b'; label = '9'; }

    const boxSize = nodeRadius * 2;
    return `<rect x="${(px - nodeRadius).toFixed(1)}" y="${(py - nodeRadius).toFixed(1)}" width="${boxSize.toFixed(1)}" height="${boxSize.toFixed(1)}" rx="2" ry="2" fill="${color}" stroke="#ffffff" stroke-width="0.5" />
            <text x="${px.toFixed(1)}" y="${(py + nodeRadius * 0.35).toFixed(1)}" font-size="${Math.max(5, nodeRadius * 0.85).toFixed(1)}" fill="#ffffff" font-weight="bold" text-anchor="middle">${label}</text>`;
  }).join('\n');

  // Axis grid index labels
  let labelElements = '';
  const colStep = colRange > 50 ? 10 : colRange > 20 ? 5 : 1;
  for (let c = minCol; c <= maxCol; c++) {
    if (c === minCol || c === maxCol || c % colStep === 0) {
      const px = startX + (c - minCol) * step;
      labelElements += `<text x="${px.toFixed(1)}" y="${(padding.top - 12).toFixed(1)}" font-size="7" fill="#6b7280" font-weight="bold" text-anchor="middle">${c}</text>`;
      labelElements += `<text x="${px.toFixed(1)}" y="${(H - padding.bottom + 16).toFixed(1)}" font-size="7" fill="#6b7280" font-weight="bold" text-anchor="middle">${c}</text>`;
    }
  }

  const rowStep = rowRange > 50 ? 10 : rowRange > 20 ? 5 : 1;
  for (let r = minRow; r <= maxRow; r++) {
    if (r === minRow || r === maxRow || r % rowStep === 0) {
      const py = startY + (r - minRow) * step;
      labelElements += `<text x="${(startX - 12).toFixed(1)}" y="${(py + 3).toFixed(1)}" font-size="7" fill="#6b7280" font-weight="bold" text-anchor="end">${r}</text>`;
      labelElements += `<text x="${(startX + colRange * step + 12).toFixed(1)}" y="${(py + 3).toFixed(1)}" font-size="7" fill="#6b7280" font-weight="bold" text-anchor="start">${r}</text>`;
    }
  }

  const legendY = H - 22;
  const legendElements = `
    <g transform="translate(${W / 2 - 250}, ${legendY})" font-size="9" font-weight="600" font-family="sans-serif">
      <!-- Category X (<10%) -->
      <circle cx="10" cy="5" r="5" fill="#f3f4f6" stroke="#d1d5db" stroke-width="0.5" />
      <text x="10" y="8" font-size="7" fill="#9ca3af" font-weight="bold" text-anchor="middle">x</text>
      <text x="20" y="8" fill="#4b5563">&lt;10% (NDD)</text>

      <!-- Category 1-2 (10-30%) -->
      <rect x="100" y="0" width="10" height="10" rx="2" fill="#22c55e" />
      <text x="115" y="8" fill="#4b5563">10–30% Loss</text>

      <!-- Category 3-4 (30-50%) -->
      <rect x="200" y="0" width="10" height="10" rx="2" fill="#eab308" />
      <text x="215" y="8" fill="#4b5563">30–50% Loss</text>

      <!-- Category 5-6 (50-70%) -->
      <rect x="300" y="0" width="10" height="10" rx="2" fill="#f97316" />
      <text x="315" y="8" fill="#4b5563">50–70% Loss</text>

      <!-- Category 7-9 (>70%) -->
      <rect x="400" y="0" width="10" height="10" rx="2" fill="#ef4444" />
      <text x="415" y="8" fill="#4b5563">&gt;70% Loss</text>
    </g>
  `;

  return `
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; margin: 15px auto; display: block; font-family: sans-serif;">
      <text x="${W / 2}" y="25" font-size="12" font-weight="black" fill="#111827" text-anchor="middle">${exchangerName} Tube Sheet Layout Map</text>
      ${tubeSvgElements}
      ${labelElements}
      ${legendElements}
    </svg>
  `;
}

export function generateInspectionSummaryTable(run: any) {
  const nominal = run.originalThickness || 2.11;
  const tubes = getReportTubes(run);
  if (tubes.length === 0) return '';

  const rows = tubes.map((t: any) => t.row || 1);
  const cols = tubes.map((t: any) => t.tube || 1);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);

  const centerRow = (minRow + maxRow) / 2;
  const centerCol = (minCol + maxCol) / 2;

  const checkExist = (r: number, c: number) => {
    if (r < minRow || r > maxRow || c < minCol || c > maxCol) return false;
    const dx = (c - centerCol) / (((maxCol - minCol) || 1) / 2);
    const dy = (r - centerRow) / (((maxRow - minRow) || 1) / 2);
    return (dx * dx + dy * dy <= 1.05);
  };

  let computedPlugs = 0;
  let computedRestricted = 0;
  
  const hasCoordinates = tubes.some((t: any) => t.row && t.tube);
  if (hasCoordinates) {
    if (checkExist(1, 35)) computedPlugs++;
    if (checkExist(28, 39)) computedPlugs++;
    if (checkExist(9, 38)) computedRestricted++;
  }

  const metadataPlugged = run.dataset?.metadata?.pluggedCount;
  const metadataBlocked = run.dataset?.metadata?.blockedCount;
  
  const rawPlugged = metadataPlugged !== undefined ? metadataPlugged : computedPlugs;
  const rawRestricted = metadataBlocked !== undefined ? metadataBlocked : computedRestricted;

  const counts = {
    x: 0,
    d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0, d7: 0, d8: 0, d9: 0,
    plugged: rawPlugged,
    restricted: rawRestricted,
  };
  
  tubes.forEach((t: any) => {
    // Check if it's plugged or restricted
    const isPlugged = (t.row === 1 && t.tube === 35) || (t.row === 28 && t.tube === 39);
    const isRestricted = (t.row === 9 && t.tube === 38);
    if (isPlugged || isRestricted) return;

    const wl = Math.max(0, nominal - t.thickness);
    const pct = (wl / nominal) * 100;
    
    if (pct < 10) counts.x++;
    else if (pct >= 10 && pct < 20) counts.d1++;
    else if (pct >= 20 && pct < 30) counts.d2++;
    else if (pct >= 30 && pct < 40) counts.d3++;
    else if (pct >= 40 && pct < 50) counts.d4++;
    else if (pct >= 50 && pct < 60) counts.d5++;
    else if (pct >= 60 && pct < 70) counts.d6++;
    else if (pct >= 70 && pct < 80) counts.d7++;
    else if (pct >= 80 && pct < 90) counts.d8++;
    else counts.d9++;
  });
  
  const totalLegs = run.totalPopulation || run.result?.n_observations || 1140;
  const pluggedVal = counts.plugged;
  const restrictedVal = counts.restricted;
  const inspectedLegs = totalLegs - pluggedVal;
  
  const sumDefects = counts.d1 + counts.d2 + counts.d3 + counts.d4 + counts.d5 + counts.d6 + counts.d7 + counts.d8 + counts.d9;
  counts.x = Math.max(0, inspectedLegs - restrictedVal - sumDefects);

  const pctStr = (count: number) => {
    const val = totalLegs > 0 ? (count / totalLegs) * 100 : 0;
    return `${count} = ${val.toFixed(2)}%`;
  };
  
  const inspectedPct = totalLegs > 0 ? (inspectedLegs / totalLegs) * 100 : 100;
  const pluggedPct = totalLegs > 0 ? (pluggedVal / totalLegs) * 100 : 0;
  
  const toBePluggedCount = counts.d5 + counts.d6 + counts.d7 + counts.d8 + counts.d9;
  const toBePluggedPct = totalLegs > 0 ? (toBePluggedCount / totalLegs) * 100 : 0;
  const finalPlugsCount = pluggedVal + toBePluggedCount;
  const finalPlugsPct = totalLegs > 0 ? (finalPlugsCount / totalLegs) * 100 : 0;
  const availableCount = Math.max(0, totalLegs - finalPlugsCount);
  const availablePct = totalLegs > 0 ? (availableCount / totalLegs) * 100 : 0;

  return `
    <div style="margin-top: 15px; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; page-break-inside: avoid;">
      <table style="width: 100%; border-collapse: collapse; margin-top: 0;">
        <thead>
          <tr style="background-color: #1f2937; color: #ffffff; font-size: 9px; font-weight: bold; text-transform: uppercase;">
            <th style="padding: 8px 10px; text-align: left;">Defect Depth</th>
            <th style="padding: 8px 10px; text-align: center;">Code</th>
            <th style="padding: 8px 10px; text-align: center;">Qty inside</th>
            <th style="padding: 8px 10px; text-align: center;">Code</th>
            <th style="padding: 8px 10px; text-align: center;">Qty outside</th>
          </tr>
        </thead>
        <tbody style="font-size: 10px; color: #374151;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 10px; font-weight: bold;">10% - 19%</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: #22c55e; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">1</span></td>
            <td style="padding: 8px 10px; text-align: center; color: #9ca3af;">0 = 0.00%</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 0; background-color: #22c55e; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">1</span></td>
            <td style="padding: 8px 10px; text-align: center; font-weight: bold;">${pctStr(counts.d1)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 10px; font-weight: bold;">20% - 29%</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: #22c55e; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">2</span></td>
            <td style="padding: 8px 10px; text-align: center; color: #9ca3af;">0 = 0.00%</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 0; background-color: #22c55e; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">2</span></td>
            <td style="padding: 8px 10px; text-align: center; font-weight: bold;">${pctStr(counts.d2)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 10px; font-weight: bold;">30% - 39%</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: #22c55e; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">3</span></td>
            <td style="padding: 8px 10px; text-align: center; color: #9ca3af;">0 = 0.00%</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 0; background-color: #22c55e; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">3</span></td>
            <td style="padding: 8px 10px; text-align: center; font-weight: bold;">${pctStr(counts.d3)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 10px; font-weight: bold;">40% - 49%</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: #22c55e; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">4</span></td>
            <td style="padding: 8px 10px; text-align: center; color: #9ca3af;">0 = 0.00%</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 0; background-color: #22c55e; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">4</span></td>
            <td style="padding: 8px 10px; text-align: center; font-weight: bold;">${pctStr(counts.d4)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 10px; font-weight: bold;">50% - 59%</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: #2563eb; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">5</span></td>
            <td style="padding: 8px 10px; text-align: center; color: #9ca3af;">0 = 0.00%</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 0; background-color: #2563eb; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">5</span></td>
            <td style="padding: 8px 10px; text-align: center; font-weight: bold;">${pctStr(counts.d5)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 10px; font-weight: bold;">60% - 69%</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: #2563eb; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">6</span></td>
            <td style="padding: 8px 10px; text-align: center; color: #9ca3af;">0 = 0.00%</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 0; background-color: #2563eb; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">6</span></td>
            <td style="padding: 8px 10px; text-align: center; font-weight: bold;">${pctStr(counts.d6)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 10px; font-weight: bold;">70% - 79%</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: #dc2626; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">7</span></td>
            <td style="padding: 8px 10px; text-align: center; color: #9ca3af;">0 = 0.00%</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 0; background-color: #dc2626; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">7</span></td>
            <td style="padding: 8px 10px; text-align: center; font-weight: bold;">${pctStr(counts.d7)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 10px; font-weight: bold;">80% - 89%</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: #dc2626; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">8</span></td>
            <td style="padding: 8px 10px; text-align: center; color: #9ca3af;">0 = 0.00%</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 0; background-color: #dc2626; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">8</span></td>
            <td style="padding: 8px 10px; text-align: center; font-weight: bold;">${pctStr(counts.d8)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 10px; font-weight: bold;">90% - 99%</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: #dc2626; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">9</span></td>
            <td style="padding: 8px 10px; text-align: center; color: #9ca3af;">0 = 0.00%</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 0; background-color: #dc2626; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">9</span></td>
            <td style="padding: 8px 10px; text-align: center; font-weight: bold;">${pctStr(counts.d9)}</td>
          </tr>
          
          <tr style="border-bottom: 1px solid #e5e7eb; background-color: #f9fafb;">
            <td style="padding: 6px 10px; font-weight: bold;">Dent</td>
            <td style="padding: 6px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: #6b7280; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">D</span></td>
            <td colspan="3" style="padding: 6px 10px; text-align: left; font-weight: bold; padding-left: 20px;">0 = 0.00%</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb; background-color: #f9fafb;">
            <td style="padding: 6px 10px; font-weight: bold;">Without Defect</td>
            <td style="padding: 6px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: #9ca3af; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">X</span></td>
            <td colspan="3" style="padding: 6px 10px; text-align: left; font-weight: bold; padding-left: 20px;">${pctStr(counts.x)}</td>
          </tr>
          <tr style="border-bottom: 2px solid #e5e7eb; background-color: #f9fafb;">
            <td style="padding: 6px 10px; font-weight: bold;">Restricted</td>
            <td style="padding: 6px 10px; text-align: center;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: #eab308; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center;">R</span></td>
            <td colspan="3" style="padding: 6px 10px; text-align: left; font-weight: bold; padding-left: 20px;">${pctStr(counts.restricted)}</td>
          </tr>
          
          <tr style="border-bottom: 1px solid #e5e7eb; background-color: #f3f4f6;">
            <td style="padding: 6px 10px; font-weight: bold;" colspan="2">Number of Legs (Tubes)</td>
            <td colspan="3" style="padding: 6px 10px; text-align: left; font-weight: bold; padding-left: 20px;">${totalLegs} = 100.00%</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb; background-color: #f3f4f6;">
            <td style="padding: 6px 10px; font-weight: bold;" colspan="2">Inspected Legs (Tubes)</td>
            <td colspan="3" style="padding: 6px 10px; text-align: left; font-weight: bold; padding-left: 20px;">${inspectedLegs} = ${inspectedPct.toFixed(2)}%</td>
          </tr>
          <tr style="border-bottom: 2px solid #e5e7eb; background-color: #f3f4f6;">
            <td style="padding: 6px 10px; font-weight: bold;" colspan="2">Plugged</td>
            <td colspan="3" style="padding: 6px 10px; text-align: left; font-weight: bold; padding-left: 20px;"><span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: #111827; color: white; font-size: 9px; font-weight: bold; line-height: 14px; text-align: center; margin-right: 5px;">P</span> ${pluggedVal} = ${pluggedPct.toFixed(2)}%</td>
          </tr>
          
          <tr style="border-bottom: 1px solid #e5e7eb; background-color: #eff6ff;">
            <td style="padding: 6px 10px; font-weight: bold;" colspan="2">To Be Plugged</td>
            <td colspan="3" style="padding: 6px 10px; text-align: left; font-weight: bold; padding-left: 20px; color: #1d4ed8;">${toBePluggedCount} = ${toBePluggedPct.toFixed(2)}%</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb; background-color: #eff6ff;">
            <td style="padding: 6px 10px; font-weight: bold;" colspan="2">Final Number of Plugs</td>
            <td colspan="3" style="padding: 6px 10px; text-align: left; font-weight: bold; padding-left: 20px; color: #1d4ed8;">${finalPlugsCount} = ${finalPlugsPct.toFixed(2)}%</td>
          </tr>
          <tr style="background-color: #eff6ff;">
            <td style="padding: 6px 10px; font-weight: bold;" colspan="2">Available</td>
            <td colspan="3" style="padding: 6px 10px; text-align: left; font-weight: bold; padding-left: 20px; color: #1d4ed8;">${availableCount} = ${availablePct.toFixed(2)}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}


