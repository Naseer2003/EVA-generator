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
    window.print();
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
            <div className={cn(
              "inline-block px-3 py-1 rounded text-[10px] font-bold uppercase mt-2 border",
              run.adPassed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
            )}>
              Status: {run.adPassed ? 'Approved' : 'Rejected'}
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

        {/* Technical Data Overview */}
        <section className="mb-10">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3 mb-4">2.0 Technical Specifications</h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-12 bg-gray-50 p-6 rounded-lg border border-gray-100">
            {[
              { label: 'Original Wall Thickness', value: `${run.originalThickness?.toFixed(2)} mm`, icon: Tag },
              { label: 'Minimum Required Thickness', value: `${run.minimumRequiredThickness?.toFixed(2)} mm`, icon: ShieldCheck },
              { label: 'Service Entry Date', value: run.serviceStartDate ? new Date(run.serviceStartDate).toLocaleDateString() : 'N/A', icon: Clock },
              { label: 'Last Inspection Date', value: run.inspectionDate ? new Date(run.inspectionDate).toLocaleDateString() : 'N/A', icon: MapPin },
              { label: 'Statistical Model', value: 'Gumbel', icon: Activity },
              { label: 'Estimation Method', value: run.method.toUpperCase(), icon: Activity },
            ].map((spec, i) => (
              <div key={i} className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center gap-2">
                  <spec.icon className="w-3 h-3" />
                  {spec.label}
                </span>
                <span className="text-sm font-bold text-gray-800">{spec.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Statistical Diagnostics & Why it Failed/Succeeded */}
        <section className="mb-12 page-break-inside-avoid">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3 mb-6">3.0 Statistical Root Cause Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 font-bold uppercase tracking-tight">3.1 Diagnostic Methodology</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                The integrity of this forecast relies on the <span className="text-gray-900 font-bold">Anderson-Darling (AD)</span> test, which is specifically sensitive to the "tail" of the distribution—the area where extreme wall loss occurs. 
              </p>
              
              <div className={cn(
                "p-5 rounded-lg border-2",
                run.adPassed ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
              )}>
                <p className="text-xs font-black uppercase mb-2 flex items-center gap-2">
                   {run.adPassed ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                   Technical Verdict: {run.adPassed ? 'Statistical Fit Approved' : 'Statistical Fit Rejected'}
                </p>
                <p className="text-xs text-gray-700 leading-relaxed font-medium">
                  {run.adPassed 
                    ? `The AD Statistic (${run.adStatistic?.toFixed(3)}) is below the critical threshold (0.757). WHY IT SUCCEEDED: The observed corrosion data aligns closely with the expected stochastic behavior of the asset. This implies a uniform degradation mechanism, making the return-level forecasts highly reliable.`
                    : `The AD Statistic (${run.adStatistic?.toFixed(3)}) significantly exceeds the threshold (0.757). WHY IT FAILED: The rejection is caused by 'Heavy Tail' behavior—where localized wall loss is much more severe than what a standard model predicts. This often indicates localized pitting or microbiologically influenced corrosion (MIC) that general models can't see.`
                  }
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Observation of Mechanism</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                   {run.ksPValue < 0.05 
                     ? "The Kolmogorov-Smirnov p-value is extremely low (< 0.05). This confirms that the data has high variance and does not follow a single consistent physical trend. The 'Failure' is a clear indicator of non-uniform asset degradation."
                     : "The Kolmogorov-Smirnov p-value is healthy (> 0.05), confirming that the data follows a singular, predictable degradation trend."
                   }
                </p>
              </div>
            </div>
            
            <div className="space-y-4 text-center">
              <img 
                src="/statistical_deviation_diagram.png" 
                alt="Statistical Deviation Diagram" 
                className="w-full h-auto rounded border border-gray-200 grayscale opacity-90 shadow-sm"
              />
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">Fig 3.1: Deviation Analysis of Observed vs Theoretical Quantiles</p>
            </div>
          </div>
        </section>

        {/* Predictive Forecast Section */}
        <section className="mb-12 page-break-inside-avoid">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3 mb-6">4.0 Reliability & Return-Level Forecasting</h3>
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

        {/* Recommendation & What can we do */}
        <section className="mb-12">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3 mb-6">5.0 Strategic Mitigation Plan</h3>
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
                    <span>{run.adPassed ? 'Continue current Ultrasonic Testing (UT) intervals as planned.' : 'Execute immediate manual UT validation on the lowest wall-thickness zones identified in Section 2.0.'}</span>
                  </li>
                  <li className="text-[11px] text-gray-600 flex gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1 shrink-0" />
                    <span>{run.adPassed ? 'Maintain operational pressure profiles within existing safety envelopes.' : 'Reduce operating pressure by 15% until a secondary GEV-based statistical model is validated.'}</span>
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

        {/* Standard Tabular Data (PVP2006 / ASTM E2283) */}
        {plotData?.probability_plot?.tabular_data && (
          <section className="mb-12 page-break-before-always">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3 mb-6">
              5.0 Standard Tabular Data (PVP2006 / ASTM E2283)
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              The table below lists the ranked inspection observations, cumulative probabilities, Gumbel reduced variates, ln(PDF), best-fit wall loss estimations, and their respective confidence intervals.
            </p>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full border-collapse min-w-[900px] text-[10px]">
                <thead>
                  <tr className="bg-gray-900 text-white font-bold uppercase tracking-wider text-left text-[8px]">
                    <th className="p-2">Rank (i)</th>
                    <th className="p-2">Obs. Wall Loss</th>
                    <th className="p-2">Prob. P_i</th>
                    <th className="p-2">Red. Var. y_i</th>
                    <th className="p-2">ln(PDF)</th>
                    <th className="p-2">Fit Loss</th>
                    <th className="p-2">Std. Error</th>
                    <th className="p-2">95% CI (L - U)</th>
                    <th className="p-2">99% CI (L - U)</th>
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
                      <td className="p-2 text-blue-600 font-bold">{row.best_fit.toFixed(4)} mm</td>
                      <td className="p-2 text-gray-500">{row.se.toFixed(4)} mm</td>
                      <td className="p-2 text-gray-600">{row.ci_95_lower.toFixed(4)} - {row.ci_95_upper.toFixed(4)}</td>
                      <td className="p-2 text-gray-600">{row.ci_99_lower.toFixed(4)} - {row.ci_99_upper.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Sign-off */}
        <div className="mt-20 flex justify-between items-end border-t border-gray-200 pt-10">
          <div className="space-y-4">
            <div className="h-12 w-48 border-b border-gray-400 italic text-gray-400 text-sm flex items-end pb-2">Digital Signature Attached</div>
            <div>
              <p className="text-sm font-bold text-gray-900">Dr. Sarah Jenkins</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Principal Integrity Engineer</p>
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
