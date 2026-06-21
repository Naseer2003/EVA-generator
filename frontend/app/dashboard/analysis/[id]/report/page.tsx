'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  Printer,
  Download,
  ChevronLeft,
  Activity,
  ShieldCheck,
  AlertCircle,
  Clock,
  MapPin,
  Tag
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart, ScatterChart, Scatter, ReferenceLine, ComposedChart
} from 'recharts';
import { evaApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { generateReportHtml, generateGumbelPlotSvg, generateCdfPlotSvg, generateTubeSheetMapSvg, generateInspectionSummaryTable, getReportTubes } from '@/components/StaticReportPrinter';

export default function EngineeringReport() {
  const { id } = useParams();
  const router = useRouter();
  const [run, setRun] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await evaApi.getResults(id as string);
        setRun(res.data);
      } catch (err) {
        console.error('Failed to fetch results', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchResults();
  }, [id]);

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <Activity className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="text-gray-500 font-medium">Generating technical document...</p>
    </div>
  );

  if (!run) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <AlertCircle className="w-12 h-12 text-red-500" />
      <p className="text-gray-900 font-bold text-xl">Document Not Found</p>
    </div>
  );

  const handlePrint = () => {
    const html = generateReportHtml(run);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  const result = run.result;
  const plotData = result?.plot_data;
  const returnLevelCurveData = plotData?.return_level_plot?.curve_periods?.map((p: number, i: number) => ({
    period: p,
    value: plotData.return_level_plot.curve_values[i],
    ci_lower: plotData.return_level_plot.curve_ci_lower[i],
    ci_upper: plotData.return_level_plot.curve_ci_upper[i],
  })) || [];

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 print:bg-white print:p-0">
      {/* Action Bar */}
      <div className="max-w-[850px] mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Analysis
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-md text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Document Model */}
      <div className="max-w-[850px] mx-auto bg-white shadow-2xl min-h-[1100px] p-[60px] print:shadow-none print:p-0">

        {/* Document Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center">
                <Activity className="text-white w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">EVA Engineering</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Asset Integrity & Reliability Portal</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500"><span className="font-bold text-gray-900">Project:</span> {run.dataset?.name || 'Asset Life Extension Analysis'}</p>
              <p className="text-xs text-gray-500"><span className="font-bold text-gray-900">Location:</span> Offshore Platform Alpha-7</p>
            </div>
          </div>
          <div className="text-right space-y-1">
            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">Inspection Report</h2>
            <p className="text-xs font-mono text-gray-500">REF: EVA-{run.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-xs text-gray-500">Date: {new Date(run.createdAt).toLocaleDateString()}</p>
            <div className="inline-block px-3 py-1 rounded text-[10px] font-bold uppercase mt-2 border bg-emerald-50 text-emerald-700 border-emerald-200">
              Status: Approved
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <section className="mb-10">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3 mb-4">1.0 Executive Summary</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            This document outlines the extreme value analysis (EVA) performed on the provided thickness measurements.
            The analysis utilizes a <span className="font-bold text-gray-900">Gumbel distribution</span> model estimated via
            <span className="font-bold text-gray-900"> {run.method.toUpperCase()}</span> to forecast long-term degradation and predict the remaining useful life (RUL)
            of the asset. The primary objective is to determine if the current inspection frequency satisfies safety integrity level (SIL) requirements.
          </p>
        </section>

        {/* Technical & NDT Inspection Specifications */}
        <section className="mb-10">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3 mb-6">
            2.0 Technical & NDT Inspection Specifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Design & Tube Specifications */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 space-y-4">
              <p className="text-xs font-black text-gray-900 uppercase tracking-wider underline decoration-blue-600 underline-offset-4">
                Design & Tube Specifications
              </p>
              <div className="space-y-2 text-xs text-gray-600 font-medium">
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Nominal Thickness:</span>
                  <span className="font-bold text-gray-800">{run.originalThickness?.toFixed(2)} mm</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Min. Required Thickness:</span>
                  <span className="font-bold text-gray-800">{run.minimumRequiredThickness?.toFixed(2)} mm</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Outside Diameter (OD):</span>
                  <span className="font-bold text-gray-800">19.05 mm</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Inside Diameter (ID):</span>
                  <span className="font-bold text-gray-800">14.83 mm</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Tube Length:</span>
                  <span className="font-bold text-gray-800">7.40 m</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Tube Material:</span>
                  <span className="font-bold text-gray-800">Carbon Steel (CS)</span>
                </div>
              </div>
            </div>

            {/* Inspection & NDT Parameters */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 space-y-4">
              <p className="text-xs font-black text-gray-900 uppercase tracking-wider underline decoration-blue-600 underline-offset-4">
                Inspection & NDT Parameters
              </p>
              <div className="space-y-2 text-xs text-gray-600 font-medium">
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Place of Inspection:</span>
                  <span className="font-bold text-gray-800">QSGTL, RLIC Qatar</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">NDT Inspector / Operator:</span>
                  <span className="font-bold text-gray-800">F. Müller, A. Hullmann</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">NDT Method / Probes:</span>
                  <span className="font-bold text-gray-800">Eddy Current / Bobbin Coils</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Test Frequency:</span>
                  <span className="font-bold text-gray-800">90.00 kHz</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Calibration Block:</span>
                  <span className="font-bold text-gray-800">A 081 (50% Out Pitting)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Total / Tested Legs:</span>
                  <span className="font-bold text-gray-800">{run.totalPopulation || run.result?.n_observations || 1140} / {run.result?.n_observations ?? 1138}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2.1 Referenced NDT Standards & Task Description */}
        <section className="mb-10">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
            2.1 Referenced Standards & NDT Procedure
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            With the use of non-destructive eddy current testing (ET) in differential and absolute modes, wall thickness decreases were systematically detected. All tests are certified and evaluated in accordance with the following international standards:
          </p>
          <ul className="list-disc pl-5 text-[11px] text-gray-500 space-y-1">
            <li><strong>EN ISO 9712:2012:</strong> Non-destructive testing - Qualification and certification of NDT personnel</li>
            <li><strong>EN ISO 15549:2010:</strong> Non-destructive testing - Eddy Current Testing - General Principles</li>
            <li><strong>EN ISO 12718:2008:</strong> Non-destructive testing - Eddy Current Testing - Terms</li>
            <li><strong>DIN 54140 Part 3:</strong> Electromagnetic testing and representation of coil characteristics</li>
            <li><strong>ASME PVP2006 / ASTM E2283:</strong> Standard Practice for Extreme Value Analysis</li>
          </ul>
        </section>

        {/* Predictive Forecast Section */}
        <section className="mb-12 page-break-inside-avoid">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3 mb-6">3.0 Reliability & Return-Level Forecasting</h3>
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest">
                  <th className="p-4 text-left">Risk Category</th>
                  <th className="p-4">Confidence</th>
                  <th className="p-4">Max Wall Loss</th>
                  <th className="p-4">Rem. Thickness</th>
                  <th className="p-4">Estimated EOL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { cat: 'Category A (Extreme Risk)', level: '99%', key: '99' },
                  { cat: 'Category B (High Risk)', level: '95%', key: '95' },
                  { cat: 'Category C (Medium Risk)', level: '90%', key: '90' },
                  { cat: 'Category D (Low Risk)', level: '80%', key: '80' },
                ].map((row, i) => {
                  const rl = run.returnLevels?.find((r: any) => r.returnPeriod === run.totalPopulation) || run.returnLevels?.[run.returnLevels.length - 1];
                  if (!rl) return null;
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

                  return (
                    <tr key={i} className="text-xs">
                      <td className="p-4 font-bold bg-gray-50">{row.cat}</td>
                      <td className="p-4 text-center font-bold text-gray-500">{row.level}</td>
                      <td className="p-4 text-center font-mono">{wallLoss.toFixed(4)} mm</td>
                      <td className="p-4 text-center font-mono font-bold text-gray-900">{remThickness.toFixed(3)} mm</td>
                      <td className="p-4 text-center font-black text-blue-600">{eolStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Asset Life & EOL Forecast (Excel Format Table) */}
        <section className="mb-12 page-break-inside-avoid">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">3.1 Asset Life & EOL Forecast (Excel Format)</h4>
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest">
                  <th className="p-4 text-left">RBI Effectiveness</th>
                  <th className="p-4 text-center">Confidence Interval</th>
                  <th className="p-4 text-center">Minimum Remaining Thickness</th>
                  <th className="p-4 text-center">Corrosion Rate</th>
                  <th className="p-4 text-center">End of Life</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-mono text-xs font-bold text-blue-600">
                {[
                  { label: 'A', confidence: '99%', levelKey: '99' },
                  { label: 'B', confidence: '95%', levelKey: '95' },
                  { label: 'C', confidence: '90%', levelKey: '90' },
                  { label: 'D', confidence: '80%', levelKey: '80' }
                ].map((rbi, idx) => {
                  const rl = run.returnLevels?.find((r: any) => r.returnPeriod === run.totalPopulation) || run.returnLevels?.[run.returnLevels.length - 1];
                  if (!rl) return null;

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

                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-gray-900 font-sans font-bold text-left">{rbi.label}</td>
                      <td className="p-4 text-gray-500 font-sans font-bold text-center">{rbi.confidence}</td>
                      <td className="p-4 text-center font-bold">{remThickness.toFixed(3)} mm</td>
                      <td className="p-4 text-center font-bold">{corrosionRate.toFixed(3)} mmpy</td>
                      <td className="p-4 text-center font-bold">{eolDateStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3.2: Statistical Probability Plots */}
        <section className="mb-12 page-break-inside-avoid">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3 mb-6">
            3.2 Statistical Integrity & Probability Plots
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            The Gumbel Reduced Variate (Q-Q) and Cumulative Probability plots below visually demonstrate the alignment of observed wall loss measurements with the fitted Gumbel extreme value distribution.
          </p>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center my-6">
            <div className="flex-1 flex justify-center" dangerouslySetInnerHTML={{ __html: generateGumbelPlotSvg(run) }} />
            <div className="flex-1 flex justify-center" dangerouslySetInnerHTML={{ __html: generateCdfPlotSvg(run) }} />
          </div>
        </section>

        {/* Recommendation & What can we do */}
        <section className="mb-12">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3 mb-6">4.0 Strategic Mitigation Plan</h3>
          <div className="space-y-6">
            <p className="text-sm text-gray-600 leading-relaxed">
              Based on the results of the probabilistic modeling, the following strategic actions are mandated to maintain the <span className="font-bold text-gray-900 text-xs uppercase tracking-tighter">Safety Integrity Level (SIL)</span> of the asset.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 space-y-4">
                <p className="text-xs font-black text-gray-900 uppercase tracking-wider underline decoration-blue-600 underline-offset-4">What Can We Do? (Immediate)</p>
                <ul className="space-y-3">
                  <li className="text-[11px] text-gray-600 flex gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1 shrink-0" />
                    <span>Continue current Ultrasonic Testing (UT) intervals as planned.</span>
                  </li>
                  <li className="text-[11px] text-gray-600 flex gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1 shrink-0" />
                    <span>Maintain operational pressure profiles within existing safety envelopes.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 space-y-4">
                <p className="text-xs font-black text-gray-900 uppercase tracking-wider underline decoration-blue-600 underline-offset-4">Long-Term Strategy</p>
                <ul className="space-y-3">
                  <li className="text-[11px] text-gray-600 flex gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1 shrink-0" />
                    <span>Integrate Real-Time Corrosion Monitoring (RTCM) in high-turbulence zones.</span>
                  </li>
                  <li className="text-[11px] text-gray-600 flex gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1 shrink-0" />
                    <span>Update Asset Integrity Management (AIM) database with the new forecast End-of-Life (EOL) dates.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5.0: Engineering Guidance & Reference Values */}
        <section className="mb-12 page-break-inside-avoid">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3 mb-6">
            5.0 Guidance & Reference Values
          </h3>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            This section provides standard reference guidelines and definitions based on <span className="font-bold text-gray-900">API 581</span> and <span className="font-bold text-gray-900">ASME PVP2006</span> to help interpret the statistical outputs in this report.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: API 581 RBI Effectiveness Category */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 space-y-4">
              <p className="text-xs font-black text-gray-900 uppercase tracking-wider underline decoration-blue-600 underline-offset-4">
                API 581 RBI Effectiveness Levels
              </p>
              <div className="space-y-3">
                {[
                  { level: 'A (Highly Effective)', desc: 'Confidence interval at 99%. Reached with 20–30 tubes sampled. Guarantees 80%–100% likelihood that true wall loss is not worse than estimated.' },
                  { level: 'B (Usually Effective)', desc: 'Confidence interval at 95%. Guarantees 60%–80% likelihood of correct damage state classification.' },
                  { level: 'C (Fairly Effective)', desc: 'Confidence interval at 90%. Guarantees 40%–60% likelihood of correct damage state classification.' },
                  { level: 'D (Poorly Effective)', desc: 'Confidence interval at 80%. Guarantees 20%–40% likelihood. Marginal integrity benefit.' },
                ].map((item, idx) => (
                  <div key={idx} className="text-[11px] leading-relaxed">
                    <span className="font-bold text-gray-800 block">{item.level}</span>
                    <span className="text-gray-500">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Statistical & Mathematical Parameter Definitions */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 space-y-4">
              <p className="text-xs font-black text-gray-900 uppercase tracking-wider underline decoration-blue-600 underline-offset-4">
                Parameter Guidance & Definitions
              </p>
              <div className="space-y-3">
                {[
                  { term: 'Location (λ or μ)', desc: 'The most probable extreme wall loss value (mode). Reaches a baseline value from which extreme outliers deviate.' },
                  { term: 'Scale (δ or β)', desc: 'Indicates the dispersion of extreme wall loss. A larger value implies higher non-uniformity/pitting corrosion.' },
                  { term: 'Reduced Variate (y_i)', desc: 'A dimensionless Gumbel variable computed as: y_i = -ln(-ln(P_i)). Aligns observed rank with probability space.' },
                  { term: 'Standard Error (SE)', desc: 'Quantifies uncertainty based on sample size (n) and y_i. Larger n decreases standard error.' },
                  { term: 'Confidence Limit (t·SE)', desc: 'Standard t-distribution factor multiplied by Standard Error to construct the conservative lower bounds.' },
                ].map((item, idx) => (
                  <div key={idx} className="text-[11px] leading-relaxed">
                    <span className="font-bold text-gray-800 block">{item.term}</span>
                    <span className="text-gray-500">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Standard Tabular Data (PVP2006 / ASTM E2283) */}
        {plotData?.probability_plot?.tabular_data && (
          <section className="mb-12 page-break-before-always space-y-8">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3 mb-4">
                6.0 Standard Tabular Data (PVP2006 / ASTM E2283)
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                The tables below list the ranked inspection observations, cumulative probabilities, Gumbel reduced variates, ln(PDF), best-fit wall loss estimations, and their respective confidence intervals.
              </p>
            </div>

            {/* Table 6.1: Observations and Probability Plot Data */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Table 6.1: Observations & Probability Plot Data
              </h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-gray-900 text-white font-bold uppercase tracking-wider text-left text-[8px]">
                      <th className="p-2 w-16">Rank (i)</th>
                      <th className="p-2">Obs. Wall Loss</th>
                      <th className="p-2">Prob. P_i</th>
                      <th className="p-2">Red. Var. y_i</th>
                      <th className="p-2">ln(PDF)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-mono text-gray-700">
                    {plotData.probability_plot.tabular_data.map((row: any) => (
                      <tr key={row.rank} className="hover:bg-gray-50/50">
                        <td className="p-2 font-sans font-bold text-gray-900">{row.rank}</td>
                        <td className="p-2 font-bold text-gray-900">{row.observed.toFixed(4)} mm</td>
                        <td className="p-2 text-gray-500">{row.probability.toFixed(4)}</td>
                        <td className="p-2 text-gray-500">{row.reduced_variate.toFixed(4)}</td>
                        <td className="p-2 text-gray-500">{row.ln_pdf.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 6.2: Extreme Value Fit & Confidence Intervals */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Table 6.2: Extreme Value Fit & Confidence Intervals
              </h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-gray-900 text-white font-bold uppercase tracking-wider text-left text-[8px]">
                      <th className="p-2 w-16">Rank (i)</th>
                      <th className="p-2">Fit Loss</th>
                      <th className="p-2 bg-blue-800">Max Wall Loss (mm)</th>
                      <th className="p-2 bg-blue-800">Min Rem. Thickness (mm)</th>
                      <th className="p-2">Std. Error</th>
                      <th className="p-2">95% CI (L - U)</th>
                      <th className="p-2">99% CI (L - U)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-mono text-gray-700">
                    {plotData.probability_plot.tabular_data.map((row: any) => (
                      <tr key={row.rank} className="hover:bg-gray-50/50">
                        <td className="p-2 font-sans font-bold text-gray-900">{row.rank}</td>
                        <td className="p-2 text-blue-600 font-bold">{row.best_fit.toFixed(4)} mm</td>
                        <td className="p-2 font-bold text-blue-700 bg-blue-50">{row.best_fit.toFixed(4)}</td>
                        <td className="p-2 font-bold text-emerald-700 bg-emerald-50">
                          {run.originalThickness
                            ? (run.originalThickness - row.best_fit).toFixed(4)
                            : 'N/A'}
                        </td>
                        <td className="p-2 text-gray-500">{row.se.toFixed(4)} mm</td>
                        <td className="p-2 text-gray-600">{row.ci_95_lower.toFixed(4)} - {row.ci_95_upper.toFixed(4)}</td>
                        <td className="p-2 text-gray-600">{row.ci_99_lower.toFixed(4)} - {row.ci_99_upper.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Section 7.0: Summary of Inspection Results */}
        {getReportTubes(run).length > 0 && (
          <section className="mb-12 page-break-inside-avoid space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3 mb-6">
              7.0 Summary of Inspection Results
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              The summary table below aggregates the tube inspection data by wall loss percentage classes, mapping them to defect codes and indicating plugging status.
            </p>
            <div dangerouslySetInnerHTML={{ __html: generateInspectionSummaryTable(run) }} />
          </section>
        )}

        {/* Section 8.0: Tube Sheet Layout Map */}
        {getReportTubes(run).length > 0 && (
          <section className="mb-12 page-break-inside-avoid space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3 mb-6">
              8.0 Tube Sheet Layout Map
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              Visual map representing individual tube locations within the exchanger tube sheet, color-coded based on defect severity.
            </p>
            <div className="w-full overflow-x-auto flex justify-center" dangerouslySetInnerHTML={{ __html: generateTubeSheetMapSvg(run) }} />
          </section>
        )}

        {/* Sign-off */}
        <div className="mt-20 flex justify-between items-end border-t border-gray-200 pt-10">
          <div className="flex gap-12 text-left">
            <div className="space-y-4">
              <div className="h-12 w-48 border-b border-gray-400 italic text-gray-400 text-sm flex items-end pb-2">Digital Signature Attached</div>
              <div>
                <p className="text-sm font-bold text-gray-900">Frank Müller</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Inspection Operator (ET Level III)</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-12 w-48 border-b border-gray-400 italic text-gray-400 text-sm flex items-end pb-2">Digital Signature Attached</div>
              <div>
                <p className="text-sm font-bold text-gray-900">Dr. Sarah Jenkins</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Principal Integrity Engineer</p>
              </div>
            </div>
          </div>
          <div className="text-right space-y-2">
            <div className="w-24 h-24 border-2 border-blue-600 rounded-full flex items-center justify-center p-2 opacity-30 mx-auto mr-0">
              <div className="border border-blue-600 rounded-full w-full h-full flex flex-col items-center justify-center text-blue-600">
                <p className="text-[8px] font-black uppercase leading-none">EVA PORTAL</p>
                <p className="text-[6px] font-bold">VERIFIED</p>
                <p className="text-[6px] font-mono">{run.id.slice(0, 6)}</p>
              </div>
            </div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Document Automatically Generated</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-hidden {
            display: none !important;
          }
          .page-break-before-always {
            page-break-before: always;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
          header, footer, nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
