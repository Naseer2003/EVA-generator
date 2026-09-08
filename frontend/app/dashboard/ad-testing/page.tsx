'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  XCircle,
  Loader2,
  Activity,
  ChevronRight,
  Award,
  Sparkles,
  Layers,
  TrendingUp,
  ArrowRight,
  BookOpen,
  FlaskConical,
  Target,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
// Lazy-loaded recharts — excluded from initial bundle (downloaded on demand)
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from '@/components/charts/lazy-charts';

import { datasetsApi, evaApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// Distribution color palette
const DIST_COLORS: Record<string, { bg: string; text: string; border: string; bar: string; ring: string }> = {
  Normal: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', bar: '#2563eb', ring: 'ring-blue-500/20' },
  Lognormal: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', bar: '#7c3aed', ring: 'ring-violet-500/20' },
  Weibull: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: '#d97706', ring: 'ring-amber-500/20' },
  Exponential: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', bar: '#e11d48', ring: 'ring-rose-500/20' },
  Gumbel: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', bar: '#0d9488', ring: 'ring-teal-500/20' },
};

const getDistColor = (name: string) => DIST_COLORS[name] || DIST_COLORS.Normal;

export default function ADTestingPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDatasetsLoading, setIsDatasetsLoading] = useState(true);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedDist, setExpandedDist] = useState<string | null>(null);
  // N_total — user editable override; auto-filled from API response
  const [totalPopulation, setTotalPopulation] = useState<string>('');

  // Load datasets
  useEffect(() => {
    async function loadDatasets() {
      try {
        const res = await datasetsApi.getAll();
        setDatasets(res.data || []);
      } catch (err) {
        console.error('Failed to load datasets', err);
      } finally {
        setIsDatasetsLoading(false);
      }
    }
    loadDatasets();
  }, []);

  const runADTest = async () => {
    if (!selectedDataset) return;
    setIsLoading(true);
    setError(null);
    setResults(null);
    try {
      const nTotal = totalPopulation ? parseInt(totalPopulation, 10) : undefined;
      const res = await evaApi.runADTest(selectedDataset, nTotal ? { totalPopulation: nTotal } : undefined);
      setResults(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'AD test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const distResults = results?.results || [];
  const recommended = results?.recommended;
  const nTested = results?.nTested ?? results?.n_observations;
  // N_total comes ONLY from the user's manual input — never auto-detected
  const nTotal = totalPopulation ? parseInt(totalPopulation, 10) : null;
  const reportName = results?.reportName;
  const nominalThickness = results?.nominalThickness;

  // Chart data
  const chartData = distResults.map((r: any) => ({
    name: r.distribution,
    ad: r.ad_statistic === Infinity ? 0 : r.ad_statistic,
    cv: r.critical_value,
    passed: r.passed,
    pValue: r.p_value,
  }));

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="pb-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold flex items-center gap-1 text-teal-600 uppercase tracking-wider">
            <FlaskConical className="w-3.5 h-3.5" /> Statistical Diagnostics
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-teal-600" />
          Anderson-Darling Multi-Distribution GoF Testing
        </h1>
        <p className="text-sm text-gray-500 mt-1.5 max-w-3xl leading-relaxed">
          Test your dataset against <span className="font-semibold text-gray-900">5 candidate distributions</span> (Normal, Lognormal, Weibull, Exponential, Gumbel) to determine which distribution best fits your data — <span className="font-semibold text-gray-900">before</span> running EVA analysis.
        </p>
      </div>

      {/* Dataset Selection + Run */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-teal-600" />
          Select Dataset &amp; Run Tests
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Dataset
              </label>
              {isDatasetsLoading ? (
                <div className="flex items-center gap-2 text-sm h-11 px-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" /> Loading datasets...
                </div>
              ) : (
                <select
                  value={selectedDataset}
                  onChange={(e) => { setSelectedDataset(e.target.value); setResults(null); setError(null); setTotalPopulation(''); }}
                  className="w-full h-11 px-4 rounded-lg text-sm font-medium bg-gray-50 border border-gray-200 text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                >
                  <option value="">— Select a dataset —</option>
                  {datasets.map((ds: any) => (
                    <option key={ds.id} value={ds.id}>
                      {ds.name} ({ds.rowCount ?? '?'} rows)
                    </option>
                  ))}
                </select>
              )}
            </div>
            {/* N_total override */}
            <div className="sm:w-56">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Total Population N <span className="font-normal normal-case text-gray-400">(optional override)</span>
              </label>
              <input
                type="number"
                min="1"
                value={totalPopulation}
                onChange={(e) => setTotalPopulation(e.target.value)}
                placeholder="e.g. 1140"
                className="w-full h-11 px-4 rounded-lg text-sm font-medium bg-gray-50 border border-gray-200 text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none font-mono"
              />
            </div>
            <button
              onClick={runADTest}
              disabled={!selectedDataset || isLoading}
              className="h-11 px-8 rounded-lg text-sm font-bold tracking-wide flex items-center justify-center gap-2 whitespace-nowrap bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-md shadow-teal-600/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testing 5 Distributions...
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4" />
                  Run AD Tests
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-700">n (inspected)</span> = data points tested by AD (auto-detected from file).{' '}
            <span className="font-semibold text-teal-700">N (total population)</span> = total tubes in the exchanger — used for EVA extrapolation.
            Leave blank to auto-detect from report metadata.
          </p>
        </div>
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <>
          {/* Recommendation Hero */}
          <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-r from-teal-700 via-teal-600 to-teal-800 text-white shadow-md">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-teal-200" />
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-100">
                    Recommended Distribution {distResults.filter((r: any) => r.passed).length === 0 && "(Best Relative Fit)"}
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-white">{recommended}</h2>
                <p className="text-sm mt-1.5 max-w-lg leading-relaxed text-teal-100/90">
                  Based on Anderson-Darling testing across {distResults.length} distributions with {nTested} observations
                  at α = {results.significance_level}. The <span className="font-semibold text-white underline decoration-teal-300">{recommended}</span> distribution
                  shows the best fit for your data.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {(() => {
                  const best = distResults.find((r: any) => r.distribution === recommended);
                  if (!best) return null;
                  return (
                    <div className="rounded-lg p-4 min-w-[200px] bg-white/10 backdrop-blur-sm border border-white/20">
                      <div className="text-xs font-bold uppercase tracking-wider mb-1 text-teal-100">Best AD Statistic</div>
                      <div className="text-2xl font-black font-mono text-white">
                        {best.ad_statistic === Infinity ? '∞' : best.ad_statistic.toFixed(4)}
                      </div>
                      {best.p_value != null && (
                        <div className="text-xs mt-1 text-teal-100/80">
                          p-value: <span className="font-bold text-white">{best.p_value.toFixed(4)}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Discretization / Ties Note Banner */}
          {(distResults.filter((r: any) => r.passed).length === 0 || results.is_discretized) && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900 shadow-sm">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-amber-950 text-sm block mb-0.5">Field Measurement Resolution Notice</span>
                {results.discretization_note || (
                  <>
                    Inspection readings exhibit discrete step resolution ({results.n_unique ? `${results.n_unique} unique values` : 'repeated values'} across {nTested} observations).
                    Heavy measurement ties elevate continuous AD test statistics. <span className="font-bold text-amber-950">{recommended}</span> is selected as the best fit based on having the lowest relative AD statistic ({distResults[0]?.ad_statistic?.toFixed(4)}).
                  </>
                )}
              </div>
            </div>
          )}

          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Distributions Tested', value: distResults.length, icon: Layers, accent: 'text-gray-900', border: 'border-gray-200' },
              { label: 'Passed', value: distResults.filter((r: any) => r.passed).length, icon: CheckCircle2, accent: 'text-emerald-600', border: 'border-emerald-200' },
              { label: 'Rejected', value: distResults.filter((r: any) => !r.passed).length, icon: XCircle, accent: 'text-red-600', border: 'border-red-200' },
            ].map((s, i) => (
              <div key={i} className={`p-4 rounded-xl bg-white border ${s.border} shadow-sm`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</span>
                  <s.icon className={`w-3.5 h-3.5 ${s.accent}`} />
                </div>
                <p className={`text-xl font-black ${s.accent}`}>{s.value}</p>
              </div>
            ))}
            {/* n tested */}
            <div className="p-4 rounded-xl bg-white border border-teal-200 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">n Tested</span>
                <Activity className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <p className="text-xl font-black text-gray-900">{nTested ?? '—'} <span className="text-xs font-normal text-gray-500">tubes</span></p>
              <p className="text-[10px] mt-0.5 text-gray-400">Data points in AD test</p>
            </div>
            {/* N total */}
            <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">N Total</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  value={totalPopulation}
                  onChange={(e) => setTotalPopulation(e.target.value)}
                  placeholder={nTotal ? String(nTotal) : '—'}
                  className="w-full text-xl font-black text-amber-600 bg-amber-50/50 border border-amber-200 rounded px-2 py-0.5 outline-none focus:border-amber-400"
                />
              </div>
              <p className="text-[10px] mt-0.5 text-gray-400">Total tubes in exchanger</p>
            </div>
          </div>

          {/* Report Info Bar */}
          {(reportName || nominalThickness) && (
            <div className="bg-slate-900 rounded-xl p-4 flex flex-wrap gap-6 items-center shadow-sm">
              {reportName && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Report / Exchanger</p>
                  <p className="text-lg font-black text-white tracking-wide">{reportName}</p>
                </div>
              )}
              {nominalThickness && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nominal Thickness</p>
                  <p className="text-lg font-black text-white">{nominalThickness.toFixed(2)} <span className="text-sm font-normal text-slate-300">mm</span></p>
                </div>
              )}
              {nTested && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">n Tested (AD input)</p>
                  <p className="text-lg font-black text-white">{nTested} <span className="text-sm font-normal text-slate-300">tubes</span></p>
                </div>
              )}
              {(nTotal || totalPopulation) && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">N Total Population</p>
                  <p className="text-lg font-black text-amber-400">{nTotal ?? totalPopulation} <span className="text-sm font-normal text-slate-300">tubes</span></p>
                </div>
              )}
            </div>
          )}

          {/* Chart: AD Statistic Comparison */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              AD Statistic Comparison
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Lower AD statistic indicates better fit. Bars with solid color passed critical value thresholds.
            </p>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    label={{ value: 'AD Statistic (A²)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-gray-900 text-white p-3 rounded-lg text-xs space-y-1 shadow-lg">
                            <p className="font-bold text-teal-400 text-sm">{d.name}</p>
                            <p className="text-[10px] text-gray-300">H₀: Data follows {d.name} distribution</p>
                            <p>AD Statistic: <span className="font-mono font-bold">{d.ad.toFixed(4)}</span></p>
                            <p>Critical Value: <span className="font-mono">{d.cv.toFixed(4)}</span></p>
                            {d.pValue != null && <p>p-value: <span className="font-mono">{d.pValue.toFixed(4)}</span></p>}
                            <p className={d.passed ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                              {d.passed ? '✓ FAIL TO REJECT H₀ (No reason to reject)' : '✗ REJECT H₀ (Fit is rejected)'}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="ad" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {chartData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getDistColor(entry.name).bar}
                        opacity={entry.passed ? 1 : 0.4}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rankings Table */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              Distribution Ranking Table
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Distributions ranked by AD statistic (lowest = best fit). Passing distributions are ranked first.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Distribution</th>
                    <th className="py-3 px-4">AD Statistic (A²)</th>
                    <th className="py-3 px-4">AD* Modified</th>
                    <th className="py-3 px-4">Critical Value</th>
                    <th className="py-3 px-4">p-Value / OSL</th>
                    <th className="py-3 px-4">Parameters</th>
                    <th className="py-3 px-4 text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-gray-100">
                  {distResults.map((r: any) => {
                    const color = getDistColor(r.distribution);
                    const isRecommended = r.distribution === recommended;
                    return (
                      <tr
                        key={r.distribution}
                        className={cn(
                          "transition-colors hover:bg-gray-50/80",
                          isRecommended && "bg-teal-50/40"
                        )}
                      >
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black",
                              r.rank === 1 ? "bg-teal-100 text-teal-800" : "bg-gray-100 text-gray-600"
                            )}
                          >
                            {r.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: color.bar }} />
                            <span className="font-bold text-gray-900">{r.distribution}</span>
                            {isRecommended && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-teal-100 text-teal-700 border border-teal-200">
                                <Award className="w-2.5 h-2.5" /> Best
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-gray-900">
                          {r.ad_statistic === Infinity ? '∞' : r.ad_statistic.toFixed(4)}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600">
                          {r.ad_modified != null ? r.ad_modified.toFixed(4) : '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600">
                          {r.critical_value ? r.critical_value.toFixed(4) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          {r.p_value != null ? (
                            <span className={cn(
                              "font-mono font-bold",
                              r.p_value >= 0.15 ? "text-emerald-700" :
                                r.p_value >= 0.05 ? "text-amber-700" : "text-red-600"
                            )}>
                              {r.p_value.toFixed(4)}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-gray-500">
                          {r.parameters && Object.entries(r.parameters).map(([k, v]: [string, any]) => (
                            <span key={k} className="mr-2">{k}={typeof v === 'number' ? v.toFixed(3) : v}</span>
                          ))}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                              r.passed
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : isRecommended && distResults.filter((x: any) => x.passed).length === 0
                                  ? "bg-amber-50 text-amber-800 border-amber-300"
                                  : "bg-red-50 text-red-700 border-red-200"
                            )}>
                              {r.passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {r.passed ? 'Fail to Reject H₀' : isRecommended && distResults.filter((x: any) => x.passed).length === 0 ? 'Reject H₀ (Best Fit)' : 'Reject H₀'}
                            </span>
                            <span className="text-[9px] text-gray-400 mt-0.5 font-medium">
                              {r.passed
                                ? 'No reason to reject fit (p ≥ 0.05)'
                                : isRecommended && distResults.filter((x: any) => x.passed).length === 0
                                  ? 'Lowest relative AD statistic (Best fit)'
                                  : 'Fit is rejected (p < 0.05)'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-Distribution Detail Cards */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              Detailed Per-Distribution Analysis
            </h3>
            {distResults.map((r: any) => {
              const color = getDistColor(r.distribution);
              const isExpanded = expandedDist === r.distribution;
              const isRecommended = r.distribution === recommended;
              return (
                <div
                  key={r.distribution}
                  className={cn(
                    "bg-white border rounded-xl transition-all duration-200 overflow-hidden shadow-sm",
                    isRecommended ? "border-teal-300 ring-1 ring-teal-300/50" : "border-gray-200"
                  )}
                >
                  <button
                    onClick={() => setExpandedDist(isExpanded ? null : r.distribution)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/80 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black",
                          r.rank === 1 ? "bg-teal-100 text-teal-800" : "bg-gray-100 text-gray-600"
                        )}
                      >
                        #{r.rank}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{r.distribution} Distribution</span>
                          {isRecommended && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-teal-100 text-teal-700 border border-teal-200">
                              <Award className="w-2.5 h-2.5" /> Recommended
                            </span>
                          )}
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                            r.passed
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          )}>
                            {r.passed ? 'Fail to Reject H₀' : 'Reject H₀'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          A² = {r.ad_statistic === Infinity ? '∞' : r.ad_statistic.toFixed(4)}
                          {r.p_value != null && ` · p = ${r.p_value.toFixed(4)}`}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Statistics */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2.5">
                          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Test Statistics</h4>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">AD Statistic (A²)</span>
                              <span className="font-mono font-bold text-gray-900">{r.ad_statistic === Infinity ? '∞' : r.ad_statistic.toFixed(6)}</span>
                            </div>
                            {r.ad_modified != null && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">AD* Modified</span>
                                <span className="font-mono font-bold text-gray-900">{r.ad_modified.toFixed(6)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-500">Critical Value (α=0.05)</span>
                              <span className="font-mono font-bold text-gray-900">{r.critical_value ? r.critical_value.toFixed(6) : '—'}</span>
                            </div>
                            {r.p_value != null && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">p-Value</span>
                                <span className={cn(
                                  "font-mono font-bold",
                                  r.p_value >= 0.15 ? "text-emerald-700" :
                                    r.p_value >= 0.05 ? "text-amber-700" : "text-red-600"
                                )}>
                                  {r.p_value.toFixed(6)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Engineering Parameters */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2.5">
                          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Engineering Parameters</h4>
                          <div className="space-y-1.5 text-xs">
                            {(r.engineering_parameters && Object.keys(r.engineering_parameters).length > 0) ? (
                              Object.entries(r.engineering_parameters).map(([k, v]: [string, any]) => (
                                <div key={k} className="flex justify-between">
                                  <span className="text-gray-500">{k}</span>
                                  <span className="font-mono font-bold text-gray-900">
                                    {typeof v === 'number' ? v.toFixed(4) : String(v)}
                                  </span>
                                </div>
                              ))
                            ) : r.parameters && Object.entries(r.parameters).length > 0 ? (
                              Object.entries(r.parameters).map(([k, v]: [string, any]) => (
                                <div key={k} className="flex justify-between">
                                  <span className="text-gray-500">{k}</span>
                                  <span className="font-mono font-bold text-gray-900">
                                    {typeof v === 'number' ? v.toFixed(6) : String(v)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-400 italic">No parameters estimated</p>
                            )}
                          </div>
                        </div>

                        {/* Formula */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2.5">
                          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Formula &amp; Decision Rule</h4>
                          <div className="space-y-1.5 text-xs text-gray-600 leading-relaxed">
                            {r.formula && (
                              <p className="font-mono text-[10px] bg-white px-2 py-1 rounded border border-gray-200 break-all text-gray-800">{r.formula}</p>
                            )}
                            {r.cv_formula && (
                              <p className="font-mono text-[10px] bg-white px-2 py-1 rounded border border-gray-200 break-all text-gray-800">{r.cv_formula}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Interpretation */}
                      <div className="mt-4 p-4 rounded-lg bg-teal-50/60 border border-teal-100">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                          <p className="text-xs leading-relaxed font-medium text-teal-900">{r.interpretation}</p>
                        </div>
                      </div>

                      {/* Gumbel-specific */}
                      {r.critical_values_all && (
                        <div className="mt-4">
                          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                            Gumbel Multi-Level Critical Values (Shin et al., 2012)
                          </h4>
                          <div className="grid grid-cols-5 gap-2">
                            {Object.entries(r.critical_values_all).map(([alpha, cv]: [string, any]) => {
                              const passAt = r.ad_statistic < cv;
                              return (
                                <div key={alpha} className={cn(
                                  "text-center p-2.5 rounded-lg border text-xs",
                                  passAt ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                                )}>
                                  <p className="font-bold text-gray-900">α = {alpha}</p>
                                  <p className="font-mono text-gray-600 mt-0.5">CV = {cv.toFixed(4)}</p>
                                  <p className={cn("font-bold mt-0.5", passAt ? "text-emerald-700" : "text-red-600")}>
                                    {passAt ? 'PASS' : 'FAIL'}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Methodology Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-teal-600" />
              Methodology &amp; References
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Normal & Lognormal AD Test', body: 'Uses the Stephens (1986) modified AD formula: AD* = AD·(1+0.75/n+2.25/n²). For Lognormal, data is log-transformed first.', ref: 'Ref: Romeu, J.L. (2003). START 2003-5, RAC.' },
                { title: 'Weibull & Exponential AD Test', body: 'Uses the MIL-HDBK-17 formulation with Z_i = (x_i/α)^β. Modified statistic AD* = (1+0.2/√n)·AD. p-value via OSL formula.', ref: 'Ref: MIL-HDBK-17(1E), MIL-HDBK-5G.' },
                { title: 'Gumbel (EV Type I) AD Test', body: 'Sample-size-dependent critical values from Shin et al. (2012) Table 1. p-value via Monte Carlo (5,000 simulations with MLE re-estimation).', ref: 'Ref: Zainal Abidin et al. (2012). MATEMATIKA, 28(1), 35–48.' },
                { title: 'Ranking Methodology', body: 'Distributions that pass the AD test (A² < CV) are ranked first, sorted by lowest AD statistic. Failed distributions are ranked after, also by AD statistic ascending.', ref: 'Ref: Anderson & Darling (1954). JASA, 49, 765–769.' },
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
                  <p className="text-xs font-bold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.body}</p>
                  <p className="text-[10px] text-teal-600 font-medium">{item.ref}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!results && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-4">
            <FlaskConical className="w-8 h-8 text-teal-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No AD Test Results Yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md">
            Select a dataset above and click &quot;Run AD Tests&quot; to compare all 5 candidate distributions and find the best fit for your data.
          </p>
        </div>
      )}
    </div>
  );
}
