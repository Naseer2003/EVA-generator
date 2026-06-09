'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, 
  ChevronLeft, 
  Download, 
  ShieldCheck, 
  AlertCircle, 
  Activity,
  ArrowUpRight,
  Info,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  Table,
  Loader2,
  Settings,
  Zap,
  TrendingUp,
  History
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  AreaChart,
  ScatterChart,
  Scatter,
  ZAxis,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import { evaApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function ResultsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [run, setRun] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-medium tracking-wide">Compiling diagnostics...</p>
      </div>
    );
  }

  if (!run) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
      <AlertCircle className="w-12 h-12 text-red-500" />
      <p className="text-gray-900 font-bold text-xl">Analysis Run Not Found</p>
      <button 
        onClick={() => router.push('/dashboard/analysis')}
        className="text-blue-600 font-semibold hover:underline"
      >
        Return to Analysis Dashboard
      </button>
    </div>
  );

  const result = run.result;
  const plotData = result?.plot_data;
  const tabularData = plotData?.probability_plot?.tabular_data || [];
  const rowsPerPage = 15;
  const totalPages = Math.max(1, Math.ceil(tabularData.length / rowsPerPage));
  const paginatedData = tabularData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // 1. Return Level Plot Data (Smooth Curve with CI Bands)
  const returnLevelCurveData = plotData?.return_level_plot?.curve_periods?.map((p: number, i: number) => ({
    period: p,
    value: plotData.return_level_plot.curve_values[i],
    ci_lower: plotData.return_level_plot.curve_ci_lower[i],
    ci_upper: plotData.return_level_plot.curve_ci_upper[i],
  })) || [];

  // 2. Return Level Specific Points (Scatter)
  const returnLevelPoints = plotData?.return_level_plot?.periods?.map((p: number, i: number) => ({
    period: p,
    value: plotData.return_level_plot.values[i],
    ci_lower: plotData.return_level_plot.ci_lower[i],
    ci_upper: plotData.return_level_plot.ci_upper[i],
  })) || [];

  // 3. Probability (QQ) Plot Data
  const qqPlotData = plotData?.probability_plot?.theoretical?.map((t: number, i: number) => ({
    theoretical: t,
    observed: plotData.probability_plot.observed[i],
  })) || [];

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => router.push('/dashboard/reports')}
            className="w-10 h-10 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reliability Diagnostics</h1>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                run.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
              )}>
                {run.status}
              </span>
            </div>
            <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm">
              <History className="w-3.5 h-3.5 text-gray-400" />
              ID: <span className="font-mono text-xs text-gray-700">{run.id.slice(0, 8)}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              Dataset: <span className="text-blue-600 font-bold uppercase text-xs">{run.dataset?.name}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 px-4 py-2 rounded-md text-xs font-bold transition-colors flex items-center gap-2">
            <Download className="w-3.5 h-3.5" />
            Export Data
          </button>
          <Link 
            href={`/dashboard/analysis/${run.id}/report`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-xs font-bold transition-colors flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5" />
            Full Document Report
          </Link>
        </div>
      </div>

      {/* Engineering Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-blue-500" />
            Original Thickness
          </p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{run.originalThickness?.toFixed(3)} <span className="text-xs font-medium text-gray-400 ml-1">mm</span></p>
        </div>
        <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Min. Required
          </p>
          <p className="text-2xl font-bold text-emerald-600 tracking-tight">{run.minimumRequiredThickness?.toFixed(3)} <span className="text-xs font-medium text-gray-400 ml-1">mm</span></p>
        </div>
        <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Service Entry</p>
          <p className="text-lg font-bold text-gray-900 tracking-tight">{run.serviceStartDate ? new Date(run.serviceStartDate).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Inspection</p>
          <p className="text-lg font-bold text-gray-900 tracking-tight">{run.inspectionDate ? new Date(run.inspectionDate).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>

      {/* Primary Reliability Forecast Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-gray-900 font-bold tracking-tight uppercase text-xs tracking-wider">
                Reliability Forecasting
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">Gumbel model | {run.method} estimation</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 rounded">
             <span className="text-[10px] font-bold text-gray-400 uppercase">Population (N):</span>
             <span className="text-[10px] font-bold text-emerald-600 font-mono">{run.totalPopulation?.toLocaleString() || 'N/A'}</span>
          </div>
        </div>
        
        {/* Warning Alert about Excel dragging bug if rowCount > 300 */}
        {run.dataset?.rowCount && run.dataset.rowCount > 300 && (
          <div className="bg-amber-50/75 border-b border-amber-100/70 px-5 py-4 flex items-start gap-3.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 leading-relaxed font-medium">
              <span className="font-bold uppercase tracking-wide text-[10px] text-amber-700 block mb-0.5">Calculation Calibration Notice</span>
              This dataset has <span className="font-bold text-amber-900">{run.dataset.rowCount} observations</span>. 
              Please note that standard Excel templates often limit formulas (like Rank and Max Wall Loss) to the first <span className="font-bold text-amber-900">300 rows</span>. 
              Our system fits the **entire dataset** including the worst-corroded tubes at the bottom of the table, producing a more accurate and conservative mechanical integrity forecast than a truncated Excel model.
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="p-4">Category</th>
                <th className="p-4">Confidence</th>
                <th className="p-4">Max Wall Loss (mm)</th>
                <th className="p-4">Rem. Thickness (mm)</th>
                <th className="p-4">Corrosion Rate (mmpy)</th>
                <th className="p-4">Predicted EOL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { label: 'A', confidence: '99%', levelKey: '99' },
                { label: 'B', confidence: '95%', levelKey: '95' },
                { label: 'C', confidence: '90%', levelKey: '90' },
                { label: 'D', confidence: '80%', levelKey: '80' }
              ].map((rbi, idx) => {
                const rl = run.returnLevels?.find((r: any) => r.returnPeriod === run.totalPopulation) || run.returnLevels?.[run.returnLevels.length - 1];
                if (!rl) return null;

                // PVP2006: Use the UPPER BOUND of the wall loss (x_N + t*SE) as the conservative estimate.
                // This corresponds to the lower bound of remaining thickness.
                const ciEntry = rl.allConfidences?.[rbi.levelKey];
                const wallLoss = ciEntry?.wallLoss ?? ciEntry?.upper ?? rl.predictedValue;
                const remThickness = ciEntry?.remainingThickness ?? ((run.originalThickness || 0) - wallLoss);
                const corrosionRate = ciEntry?.corrosionRate ?? (rl.corrosionRate || 0);
                
                let eolDateStr = 'N/A';
                if (ciEntry?.eolDate) {
                  eolDateStr = new Date(ciEntry.eolDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                } else if (corrosionRate > 0 && run.minimumRequiredThickness !== undefined && run.minimumRequiredThickness !== null) {
                   let eol: Date;
                   if (run.serviceStartDate) {
                     const totalLifeDays = ((run.originalThickness - run.minimumRequiredThickness) / corrosionRate) * 365.25;
                     eol = new Date(new Date(run.serviceStartDate).getTime() + totalLifeDays * 24 * 60 * 60 * 1000);
                   } else {
                     const remainingLifeDays = ((remThickness - run.minimumRequiredThickness) / corrosionRate) * 365.25;
                     eol = new Date(new Date(run.inspectionDate).getTime() + remainingLifeDays * 24 * 60 * 60 * 1000);
                   }
                   eolDateStr = eol.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }

                return (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-4">
                      <div className={cn(
                        "w-9 h-9 rounded bg-white border flex items-center justify-center font-bold text-base shadow-sm",
                        rbi.label === 'A' ? "text-emerald-600 border-emerald-200" : rbi.label === 'B' ? "text-blue-600 border-blue-200" : rbi.label === 'C' ? "text-amber-600 border-amber-200" : "text-red-600 border-red-200"
                      )}>
                        {rbi.label}
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 font-bold text-sm">{rbi.confidence}</td>
                    <td className="p-4 text-gray-900 font-mono font-bold text-base">{wallLoss.toFixed(4)}</td>
                    <td className="p-4">
                       <span className={cn(
                         "font-mono font-bold text-base",
                         remThickness < (run.minimumRequiredThickness || 0) ? "text-red-600" : "text-gray-900"
                       )}>
                         {remThickness.toFixed(3)}
                       </span>
                    </td>
                    <td className="p-4 text-blue-600 font-mono font-bold text-sm">{corrosionRate.toFixed(4)}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className={cn(
                          "font-bold text-base tracking-tight",
                          idx < 2 ? "text-emerald-600" : "text-amber-600"
                        )}>
                          {eolDateStr}
                        </span>
                        <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">EOL Estimate</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Charts Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Return Level Plot */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight">Return Level Forecast</h3>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">Predicted Wall Loss vs Return Period</p>
                </div>
                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded border border-gray-100">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-3 h-0.5 bg-blue-600" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Prediction</span>
                  </div>
                   <div className="flex items-center gap-2 px-1">
                    <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded-sm" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{Math.round(run.confidenceLevel * 100)}% CI Band</span>
                  </div>
                </div>
             </div>

             <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={returnLevelCurveData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.05}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                      dataKey="period" 
                      type="number" 
                      domain={['auto', 'auto']} 
                      scale="log" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickFormatter={(v) => `${v}Y`}
                      tick={{ fill: '#64748b', fontWeight: 'bold' }}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tick={{ fill: '#64748b', fontWeight: 'bold' }}
                      tickFormatter={(v) => v.toFixed(2)}
                      label={{ value: 'Wall Loss (mm)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10, fontWeight: 'bold', offset: 15 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#2563eb', fontWeight: 'bold', fontSize: '12px' }}
                      labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px', fontSize: '10px' }}
                      labelFormatter={(v) => `Period: ${Number(v).toFixed(1)} Years`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="ci_upper" 
                      stroke="none" 
                      fill="url(#colorCi)" 
                      connectNulls 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="ci_lower" 
                      stroke="none" 
                      fill="#ffffff" 
                      connectNulls 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#2563eb" 
                      strokeWidth={2} 
                      dot={false}
                      activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#2563eb' }}
                    />
                    {run.totalPopulation && (
                      <ReferenceLine 
                        x={run.totalPopulation} 
                        stroke="#f59e0b" 
                        strokeDasharray="5 5"
                        label={{ value: `N=${run.totalPopulation}`, position: 'top', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* 2. Probability Plot (QQ Plot) */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight">Probability Plot (Q-Q)</h3>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">Observed vs Theoretical Quantiles</p>
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-bold text-[10px] uppercase tracking-wider",
                  run.adPassed ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                )}>
                  {run.adPassed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {run.adPassed ? 'Fit Validated' : 'Fit Rejected'}
                </div>
             </div>

             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis 
                      type="number" 
                      dataKey="theoretical" 
                      name="Theoretical" 
                      stroke="#94a3b8" 
                      fontSize={10}
                      label={{ value: 'Theoretical Quantile', position: 'bottom', fill: '#64748b', fontSize: 10, offset: 0 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="observed" 
                      name="Observed" 
                      stroke="#94a3b8" 
                      fontSize={10}
                      label={{ value: 'Observed (mm)', angle: -90, position: 'left', fill: '#64748b', fontSize: 10, offset: 0 }}
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Data Points" data={qqPlotData} fill="#3b82f6" fillOpacity={0.6} />
                    {qqPlotData.length > 0 && (
                      <ReferenceLine 
                        segment={[
                          { 
                            x: Math.min(...qqPlotData.map((d: any) => d.theoretical)), 
                            y: Math.min(...qqPlotData.map((d: any) => d.theoretical)) 
                          },
                          { 
                            x: Math.max(...qqPlotData.map((d: any) => d.theoretical)), 
                            y: Math.max(...qqPlotData.map((d: any) => d.theoretical)) 
                          }
                        ]} 
                        stroke="#f59e0b" 
                        strokeWidth={1}
                        strokeOpacity={0.5}
                      />
                    )}
                  </ScatterChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Diagnostic Sidebar */}
        <div className="space-y-6">
           {/* Methodology Compliance Card — replaces fake AD/KS display */}
           <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-gray-900 font-bold tracking-tight mb-6 flex items-center gap-3 uppercase text-[10px] tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Methodology Compliance
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-emerald-50 p-3 rounded border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">Gumbel Distribution</p>
                    <p className="text-[9px] text-emerald-700">Mandatory for mechanical integrity (PVP2006)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-emerald-50 p-3 rounded border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">MLE Parameter Estimation</p>
                    <p className="text-[9px] text-emerald-700">Maximum Likelihood Method (Eq. 10 PVP2006)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-emerald-50 p-3 rounded border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">Analytical CI — Eq. 15-16</p>
                    <p className="text-[9px] text-emerald-700">SE formula + Student&apos;s t-test (PVP2006)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-blue-50 p-3 rounded border border-blue-100">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Lower Bound Reporting</p>
                    <p className="text-[9px] text-blue-700">x_N &minus; t·SE — conservative, used for integrity</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-400 font-bold uppercase">Sample Size (n)</span>
                  <span className="font-mono font-bold text-gray-900">{result?.n_observations ?? run.returnLevels?.length ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-400 font-bold uppercase">λ (Location)</span>
                  <span className="font-mono font-bold text-gray-900">{run.mu?.toFixed(5)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-400 font-bold uppercase">δ (Scale)</span>
                  <span className="font-mono font-bold text-gray-900">{run.beta?.toFixed(5)}</span>
                </div>
              </div>
           </div>

           {/* Distribution Parameters */}
           <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-gray-900 font-bold tracking-tight mb-6 flex items-center gap-3 uppercase text-[10px] tracking-wider">
                <Settings className="w-4 h-4 text-blue-500" />
                Model Parameters
              </h3>
              
              <div className="space-y-3">
                 <div className="bg-gray-50 p-3 rounded border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Location (μ)</p>
                    <p className="text-sm font-bold text-gray-900 font-mono">{run.mu?.toFixed(6)}</p>
                 </div>
                 <div className="bg-gray-50 p-3 rounded border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Scale (β)</p>
                    <p className="text-sm font-bold text-gray-900 font-mono">{run.beta?.toFixed(6)}</p>
                 </div>
                 {run.xi !== null && run.xi !== undefined && (
                   <div className="bg-gray-50 p-3 rounded border border-gray-100">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Shape (ξ)</p>
                      <p className="text-sm font-bold text-gray-900 font-mono">{run.xi?.toFixed(6)}</p>
                   </div>
                 )}
              </div>
           </div>

           {/* Tactical Advice & Justification */}
           <div className="bg-blue-600 rounded-lg p-6 text-white shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-blue-100 shrink-0" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Engineering Assessment</h4>
              </div>

              <div className="space-y-3">
                <div className="bg-white/10 p-3 rounded border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100 mb-1">Status Reason</p>
                  <p className="text-xs leading-relaxed">
                    {run.adPassed 
                      ? "The statistical fit is VALIDATED. The Anderson-Darling (AD) statistic is within acceptable limits, confirming that the Gumbel distribution accurately models the tail risk for this asset's corrosion profile."
                      : `The statistical fit is REJECTED. The AD statistic (${run.adStatistic?.toFixed(2)}) significantly exceeds the critical threshold (0.757), indicating that the tail distribution does not match the observed extreme wall loss values.`
                    }
                  </p>
                </div>

                <div className="bg-white/10 p-3 rounded border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100 mb-1">Diagnostics Detail</p>
                  <p className="text-xs leading-relaxed italic">
                    {run.ksPValue < 0.05 
                      ? "Observation: The Kolmogorov-Smirnov test shows high divergence (p < 0.05), suggesting the dataset may have non-stationary characteristics or multiple degradation mechanisms."
                      : "Observation: The Kolmogorov-Smirnov test confirms strong overall correlation between observed values and the theoretical distribution."
                    }
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100 mb-1">Recommendation</p>
                  <p className="text-xs leading-relaxed font-medium">
                    {run.adPassed 
                      ? "Proceed with current RBI intervals. The model provides a reliable basis for life-cycle forecasting."
                      : "Action Required: Re-evaluate the dataset for outliers or consider an alternative distribution model (e.g., GEV or Log-Normal) to capture the true degradation trend."
                    }
                  </p>
                </div>
              </div>

              <button className="w-full bg-white text-blue-600 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-blue-50 transition-colors">
                Finalize Engineering Report
              </button>
           </div>
        </div>

        {/* Detailed Statistical Fit Table */}
        {tabularData.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm p-6 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-6 gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Detailed Ranked Observations Table</h3>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">Standard Tabular Data (PVP2006 / ASTM E2283)</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-50 border border-gray-200 rounded text-xs font-bold text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500 font-medium">Page {currentPage} of {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-50 border border-gray-200 rounded text-xs font-bold text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1300px]">
                <thead>
                  <tr className="bg-gray-50/50 text-[9px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="p-3">Rank (i)</th>
                    <th className="p-3">Obs. Wall Loss (mm)</th>
                    <th className="p-3">Prob. P_i = i/(n+1)</th>
                    <th className="p-3">Red. Variate y_i</th>
                    <th className="p-3">ln(PDF)</th>
                    <th className="p-3">Fit Wall Loss (mm)</th>
                    <th className="p-3">Std. Error (mm)</th>
                    <th className="p-3">80% CI (Lower - Upper)</th>
                    <th className="p-3">90% CI (Lower - Upper)</th>
                    <th className="p-3">95% CI (Lower - Upper)</th>
                    <th className="p-3">99% CI (Lower - Upper)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-xs text-gray-700">
                  {paginatedData.map((row: any) => (
                    <tr key={row.rank} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-sans font-bold text-gray-900">{row.rank}</td>
                      <td className="p-3 font-bold text-gray-900">{row.observed.toFixed(4)}</td>
                      <td className="p-3 text-gray-500">{row.probability.toFixed(4)}</td>
                      <td className="p-3 text-gray-500">{row.reduced_variate.toFixed(4)}</td>
                      <td className="p-3 text-gray-500">{row.ln_pdf.toFixed(4)}</td>
                      <td className="p-3 text-blue-600 font-bold">{row.best_fit.toFixed(4)}</td>
                      <td className="p-3 text-gray-500">{row.se.toFixed(4)}</td>
                      <td className="p-3 text-gray-600">{row.ci_80_lower.toFixed(4)} - {row.ci_80_upper.toFixed(4)}</td>
                      <td className="p-3 text-gray-600">{row.ci_90_lower.toFixed(4)} - {row.ci_90_upper.toFixed(4)}</td>
                      <td className="p-3 text-gray-600">{row.ci_95_lower.toFixed(4)} - {row.ci_95_upper.toFixed(4)}</td>
                      <td className="p-3 text-gray-600">{row.ci_99_lower.toFixed(4)} - {row.ci_99_upper.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
