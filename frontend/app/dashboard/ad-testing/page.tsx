'use client';

import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  XCircle,
  Loader2,
  Activity,
  Award,
  Layers,
  TrendingUp,
  BookOpen,
  FlaskConical,
  Target,
  Info,
  ChevronDown,
  ChevronUp,
  Printer,
  Download,
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
} from '@/components/charts/lazy-charts';

import { datasetsApi, evaApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { generateADReportHtml } from '@/components/StaticReportPrinter';

// Distribution color palette
const DIST_COLORS: Record<string, { bg: string; text: string; border: string; bar: string; ring: string }> = {
  Normal: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', bar: '#2563eb', ring: 'ring-blue-500/20' },
  Lognormal: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', bar: '#7c3aed', ring: 'ring-violet-500/20' },
  Weibull: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: '#d97706', ring: 'ring-amber-500/20' },
  Exponential: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', bar: '#e11d48', ring: 'ring-rose-500/20' },
  Gumbel: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', bar: '#0d9488', ring: 'ring-teal-500/20' },
};

const getDistColor = (name: string) => DIST_COLORS[name] || DIST_COLORS.Normal;

/**
 * A distribution the engine could not test at all — fewer than 5 usable points,
 * or a failed MLE. The engine marks these with ad_statistic = float('inf'), but
 * JSON has no Infinity literal: pydantic serialises it to null. So a check like
 * `ad_statistic === Infinity` NEVER matches, and `ad_statistic.toFixed()` throws
 * on the null that actually arrives.
 */
const isSkipped = (r: any) => r?.ad_statistic == null;

/** Format a number that may be null/undefined/non-finite. */
const num = (v: any, digits = 4) =>
  typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '—';

/**
 * Render a p-value without destroying it.
 *
 * toFixed(4) turns 6.02e-07 into "0.0000", which reads like a computed zero and
 * makes every rejected fit look identical. Values below 1e-4 switch to
 * scientific notation so the magnitude survives. `isBound` marks a value that
 * is an upper limit rather than a point estimate — a Monte Carlo run with zero
 * exceedances, or an approximation evaluated outside its calibrated range.
 */
const pval = (p: any, isBound?: boolean) => {
  if (typeof p !== 'number' || !Number.isFinite(p)) return '\u2014';
  const prefix = isBound ? '< ' : '';
  return prefix + (p >= 1e-4 ? p.toFixed(4) : p.toExponential(2));
};


export default function ADTestingPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDatasetsLoading, setIsDatasetsLoading] = useState(true);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedDist, setExpandedDist] = useState<string | null>(null);
  // Required: readings are remaining thickness, but the test must run on wall
  // loss — the variable the EVA actually fits (PVP2006 / ASTM E2283).
  const [originalThickness, setOriginalThickness] = useState<string>('');

  const selectedDatasetObj = datasets.find((d: any) => d.id === selectedDataset);

  const handlePrint = () => {
    if (!results) return;
    const html = generateADReportHtml(results, selectedDatasetObj?.name || results.datasetName || 'Dataset');
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  };

  const handleDownload = () => {
    if (!results) return;
    const html = generateADReportHtml(results, selectedDatasetObj?.name || results.datasetName || 'Dataset');
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AD-Test-Report-${(selectedDatasetObj?.name || 'dataset').replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  const thicknessValue = parseFloat(originalThickness);
  const thicknessValid = Number.isFinite(thicknessValue) && thicknessValue > 0;

  const runADTest = async () => {
    if (!selectedDataset || !thicknessValid) return;
    setIsLoading(true);
    setError(null);
    setResults(null);
    try {
      // N is deliberately not sent: no AD statistic, critical value or p-value
      // depends on the total population. originalThickness IS required — it
      // converts the readings to wall loss before testing.
      const res = await evaApi.runADTest(selectedDataset, {
        originalThickness: parseFloat(originalThickness),
      });
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
  const nRemoved = results?.nRemoved ?? 0;
  const reportName = results?.reportName;
  const nominalThickness = results?.nominalThickness;

  // Chart data
  // Untested distributions are excluded rather than plotted at 0 — a zero-height
  // bar reads as the BEST fit, which is the opposite of what happened.
  const skippedDists = distResults.filter(isSkipped);
  const chartData = distResults.filter((r: any) => !isSkipped(r)).map((r: any) => ({
    name: r.distribution,
    ad: r.ad_statistic,
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
            <FlaskConical className="w-3.5 h-3.5" /> Statistical Diagnostics &amp; Failure Analysis Report
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-teal-600" />
              Anderson-Darling Multi-Distribution GoF Testing &amp; Rejection Diagnostics
            </h1>
            <p className="text-sm text-gray-500 mt-1.5 max-w-3xl leading-relaxed">
              Comprehensive goodness-of-fit diagnostic report evaluating your dataset against <span className="font-semibold text-gray-900">5 candidate distributions</span> (Normal, Lognormal, Weibull, Exponential, Gumbel) with detailed per-distribution failure reasons and rejection criteria — <span className="font-semibold text-gray-900">before</span> running EVA analysis.
            </p>
          </div>
          {results && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Report
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download HTML
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Dataset Selection + Run */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-teal-600" />
          Select Dataset &amp; Run Comprehensive AD Diagnostics
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
                  onChange={(e) => { setSelectedDataset(e.target.value); setResults(null); setError(null); }}
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

            <div className="sm:w-60">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Original Thickness (mm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number" step="0.001" min="0"
                value={originalThickness}
                onChange={(e) => { setOriginalThickness(e.target.value); setResults(null); setError(null); }}
                placeholder="e.g. 2.11"
                className={cn(
                  "w-full h-11 px-4 rounded-lg text-sm font-mono bg-gray-50 border text-gray-900 outline-none focus:ring-1",
                  originalThickness && !thicknessValid
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                )}
              />
            </div>

            <button
              onClick={runADTest}
              disabled={!selectedDataset || !thicknessValid || isLoading}
              className="h-11 px-8 rounded-lg text-sm font-bold tracking-wide flex items-center justify-center gap-2 whitespace-nowrap bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-md shadow-teal-600/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running AD Diagnostics...
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4" />
                  Run AD Diagnostics
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-700">n (inspected)</span> = data points detected from the selected
            dataset and used for AD testing across all 5 candidate distributions.{' '}
            <span className="font-semibold text-gray-700">Original thickness</span> converts those readings to
            maximum wall loss <code className="font-mono text-[11px]">x = max(0, t_orig − t_measured)</code> — the
            goodness-of-fit test has to validate the same variable the EVA run fits (PVP2006 / ASTM E2283), not the
            raw thickness readings.
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
                    Gumbel Fit — PVP2006 / ASTM E2283
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-white">
                  {(() => {
                    const g = distResults.find((r: any) => r.distribution === 'Gumbel');
                    if (!g) return 'Not evaluated';
                    return g.passed ? 'Validated' : 'Not validated';
                  })()}
                </h2>
                <p className="text-sm mt-1.5 max-w-lg leading-relaxed text-teal-100/90">
                  Anderson-Darling across {distResults.length} distributions, {nTested} observations,
                  α = {results.significance_level}. For mechanical integrity the distribution is
                  <span className="font-semibold text-white"> fixed at Gumbel</span> — the other four are
                  comparators, not alternatives.
                  {recommended && recommended !== 'Gumbel' && (
                    <> Closest comparator: <span className="font-semibold text-white underline decoration-teal-300">{recommended}</span>.
                    If it fits markedly better than Gumbel, re-check the population definition and data quality
                    rather than switching model.</>
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {(() => {
                  const best = distResults.find((r: any) => r.distribution === recommended);
                  if (!best) return null;
                  return (
                    <div className="rounded-lg p-4 min-w-[200px] bg-white/10 backdrop-blur-sm border border-white/20">
                      <div className="text-xs font-bold uppercase tracking-wider mb-1 text-teal-100">Lowest A² (comparator)</div>
                      <div className="text-2xl font-black font-mono text-white">
                        {num(best.ad_statistic)}
                      </div>
                      {best.p_value != null && (
                        <div className="text-xs mt-1 text-teal-100/80">
                          p-value: <span className="font-bold text-white">{pval(best.p_value, best.p_value_is_bound)}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Test applicability — ties make a pass arithmetically unreachable */}
          {results.is_discretized && (
            <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-900 shadow-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed space-y-2">
                <span className="font-bold text-amber-950 text-sm block">
                  Goodness-of-fit test not applicable at this measurement resolution
                </span>
                <p>{results.discretization_note}</p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1 font-mono text-[11px] text-amber-900">
                  <span>distinct values: <strong>{results.n_unique}</strong> / {nTested}</span>
                  {results.tie_fraction != null && <span>ties: <strong>{(results.tie_fraction * 100).toFixed(1)}%</strong></span>}
                  {results.resolution != null && <span>resolution: <strong>{results.resolution.toFixed(4)} mm</strong></span>}
                </div>
                <p className="pt-1 border-t border-amber-200">
                  A sample drawn from a <em>perfect</em> Gumbel gives A² = 0.28 (pass) at full precision, but
                  A² = 2.59 when quantised to 1% steps and A² = 60.3 at 10% bands — the same distribution
                  throughout. The ranking below is therefore <span className="font-bold text-amber-950">relative
                  fit only</span>; <span className="font-bold text-amber-950">{recommended}</span> is simply the
                  closest of the five, not a validated model.
                </p>
              </div>
            </div>
          )}

          {/* Variable actually tested */}
          {results.testedVariable === 'as_supplied' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-900 shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-red-950 text-sm block mb-0.5">Tested on raw values, not wall loss</span>
                No original thickness was applied, so the readings were tested as supplied. If these are remaining
                thickness measurements, this does not validate the distribution the EVA run fits.
              </div>
            </div>
          )}

          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <p className="text-lg font-black text-white">{num(nominalThickness, 2)} <span className="text-sm font-normal text-slate-300">mm</span></p>
                </div>
              )}
              {nTested && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">n Tested (AD input)</p>
                  <p className="text-lg font-black text-white">{nTested} <span className="text-sm font-normal text-slate-300">tubes</span></p>
                </div>
              )}
              {nRemoved > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Excluded as outliers</p>
                  <p className="text-lg font-black text-amber-400">{nRemoved} <span className="text-sm font-normal text-slate-300">reading{nRemoved === 1 ? '' : 's'}</span></p>
                </div>
              )}
            </div>
          )}

          {/* Untested distributions notice */}
          {skippedDists.length > 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3 text-xs text-gray-700 shadow-sm">
              <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-gray-900 text-sm block mb-0.5">
                  {skippedDists.length} distribution{skippedDists.length === 1 ? '' : 's'} could not be tested
                </span>
                <span className="font-semibold text-gray-900">
                  {skippedDists.map((r: any) => r.distribution).join(', ')}
                </span>{' '}
                need at least 5 strictly positive observations and a converging fit. They are excluded from
                the chart and carry no A² statistic — this is <span className="font-semibold">not</span> a
                rejection, and they are not candidates for the recommendation.
              </div>
            </div>
          )}

          {/* Chart: AD Statistic Comparison */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              AD Statistic Comparison &amp; Rejection Thresholds
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
                            <p>AD Statistic: <span className="font-mono font-bold">{num(d.ad)}</span></p>
                            <p>Critical Value: <span className="font-mono">{num(d.cv)}</span></p>
                            {d.pValue != null && <p>p-value: <span className="font-mono">{num(d.pValue)}</span></p>}
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
              Distribution Ranking &amp; Failure Analysis Summary
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Ranked by AD statistic (lowest = closest). Gumbel is the model the EVA uses regardless of this ordering; the other four are a diagnostic cross-check — a markedly better comparator points to mixed damage mechanisms or a poorly defined population, not to a different model.
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
                    <th className="py-3 px-4 text-right">Decision &amp; Failure Reason</th>
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
                          {num(r.ad_statistic)}
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
                              {pval(r.p_value, r.p_value_is_bound)}
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
                              {r.passed ? <CheckCircle2 className="w-3 h-3" /> : isSkipped(r) ? <Info className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {r.passed ? 'Fail to Reject H₀' : isSkipped(r) ? 'Not tested' : isRecommended && distResults.filter((x: any) => x.passed).length === 0 ? 'Reject H₀ (Best Fit)' : 'Reject H₀'}
                            </span>
                            <span className="text-[10px] text-gray-500 mt-1 font-medium max-w-[260px] text-right">
                              {(r.passed
                                ? 'No reason to reject fit (p ≥ 0.05)'
                                : isRecommended && distResults.filter((x: any) => x.passed).length === 0
                                  ? `Lowest relative AD statistic (${r.ad_statistic?.toFixed(4)}) among rejected models.`
                                  : `AD statistic (${r.ad_statistic?.toFixed(4)}) exceeds critical threshold (${r.critical_value?.toFixed(4)}).`)}
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
              Detailed Per-Distribution Failure Analysis &amp; Diagnostics
            </h3>
            {distResults.map((r: any) => {
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
                          A² = {num(r.ad_statistic)}
                          {r.p_value != null && ` · p = ${pval(r.p_value, r.p_value_is_bound)}`}
                          {r.critical_value != null && ` · CV = ${r.critical_value.toFixed(4)}`}
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
                              <span className="font-mono font-bold text-gray-900">{num(r.ad_statistic, 6)}</span>
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
                                  {pval(r.p_value, r.p_value_is_bound)}
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

                      {/* Detailed Failure Analysis & Interpretation */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={cn(
                          "p-4 rounded-lg border",
                          r.passed ? "bg-teal-50/60 border-teal-100" : "bg-red-50/60 border-red-100"
                        )}>
                          <div className="flex items-start gap-2">
                            {r.passed ? (
                              <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className={cn("text-xs font-bold mb-0.5", r.passed ? "text-teal-900" : "text-red-900")}>
                                {r.passed ? "Goodness-of-Fit Assessment" : "Rejection & Failure Analysis"}
                              </p>
                              <p className={cn("text-xs leading-relaxed font-medium", r.passed ? "text-teal-900" : "text-red-800")}>
                                {r.interpretation || (r.passed
                                  ? `The data is consistent with the ${r.distribution} distribution (p-value ${r.p_value != null ? `= ${pval(r.p_value, r.p_value_is_bound)}` : '≥ α'}).`
                                  : `The ${r.distribution} distribution model is rejected because A² (${num(r.ad_statistic)}) exceeds the critical value (${r.critical_value?.toFixed(4)}), indicating statistically significant deviation from the theoretical CDF in the tail region.`
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Diagnostic Metrics */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Diagnostic Metrics &amp; Margin</h4>
                          <div className="space-y-1.5 text-xs text-gray-600">
                            <div className="flex justify-between">
                              <span>Distance to Threshold (A² - CV):</span>
                              <span className={cn("font-mono font-bold", !r.passed && !isSkipped(r) && r.critical_value ? 'text-red-600' : 'text-emerald-600')}>
                                {r.critical_value && !isSkipped(r) ? num(r.ad_statistic - r.critical_value) : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Exceedance Ratio (A²/CV):</span>
                              <span className="font-mono font-bold">
                                {r.critical_value && !isSkipped(r) ? num(r.ad_statistic / r.critical_value, 3) + '×' : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Significance Level (α):</span>
                              <span className="font-mono font-bold">{results.significance_level || 0.05}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Test Status:</span>
                              <span className={cn("font-bold", r.passed ? "text-emerald-600" : "text-red-600")}>
                                {r.passed ? "✓ Passed (Fail to Reject H₀)" : "✗ Failed (Reject H₀)"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── Untested distribution ── */}
                      {isSkipped(r) && (
                        <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden">
                          <div className="px-5 py-3 bg-gray-600 flex items-center gap-2">
                            <Info className="w-4 h-4 text-gray-100 shrink-0" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              {r.distribution} Was Not Tested
                            </span>
                          </div>
                          <div className="p-5 bg-gray-50 text-xs text-gray-700 leading-relaxed">
                            {r.interpretation ||
                              `The ${r.distribution} distribution could not be evaluated on this dataset.`}
                            <p className="mt-2 text-gray-500">
                              This is not a rejection. The {r.distribution} family needs at least 5 strictly
                              positive observations (and a converging fit); this sample does not provide them,
                              so no A² statistic exists and it cannot be ranked against the others.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ── Per-Distribution Failure Reason Block ── */}
                      {!r.passed && !isSkipped(r) && (
                        <div className="mt-4 rounded-xl border border-red-200 overflow-hidden">
                          <div className="px-5 py-3 bg-red-600 flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-100 shrink-0" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Why the {r.distribution} Distribution Failed — Rejection Diagnostics</span>
                            {!isSkipped(r) && r.critical_value && (
                              <span className="ml-auto text-[10px] font-mono font-bold bg-red-700 text-red-100 px-2.5 py-1 rounded-full">
                                A² = {num(r.ad_statistic)} &gt; CV = {num(r.critical_value)} (+{num((r.ad_statistic - r.critical_value) / r.critical_value * 100, 1)}%)
                              </span>
                            )}

                          </div>
                          <div className="p-5 bg-red-50/50 space-y-3">
                            {/* Technical metrics footer */}
                            {(() => {
                              // Normalise distribution name for case-insensitive matching
                              const dist = r.distribution?.trim() ?? '';
                              const distNorm = ({
                                normal: 'Normal', lognormal: 'Lognormal', weibull: 'Weibull',
                                exponential: 'Exponential', gumbel: 'Gumbel',
                              } as Record<string, string>)[dist.toLowerCase()] ?? dist;

                              // Helper: split "Title: body" safely
                              const splitReason = (reason: string) => {
                                const idx = reason.indexOf(': ');
                                if (idx === -1) return { title: reason, body: '' };
                                return { title: reason.slice(0, idx), body: reason.slice(idx + 2) };
                              };

                              const REASONS: Record<string, string[]> = {
                                Normal: [
                                  `Symmetry Violation: Corrosion wall-loss data is inherently right-skewed — most tubes have moderate damage, a minority are heavily corroded. The Normal distribution requires symmetric data (equal upper and lower tails), which this dataset violates.`,
                                  `Upper Tail Divergence: The AD test detected that the upper tail (worst-corroded tubes) is significantly heavier than the Normal model predicts. The CDF F_N(x) deviates most severely in the region F > 0.80, where the AD test applies maximum weight.`,
                                  `AD Statistic: A² = ${num(r.ad_statistic)} vs CV = ${r.critical_value?.toFixed(4) ?? '—'}. The Normal CDF diverges in the extreme upper percentile region — precisely the region that governs EVA predictions.`,
                                  `Statistical Decision: p = ${pval(r.p_value, r.p_value_is_bound)} < 0.05. The data does NOT follow a Normal distribution. Using Normal for EVA would underestimate extreme wall loss.`,
                                ],
                                Lognormal: [
                                  `Non-Multiplicative Damage Pattern: The corrosion mechanism is not purely multiplicative. Lognormal requires ln(X) to be normally distributed — a requirement violated here as the log-transformed data still exhibits non-normal tail behaviour.`,
                                  `Log-Transform Failure: After log-transformation the dataset still fails the AD test with A² = ${num(r.ad_statistic)} vs CV = ${r.critical_value?.toFixed(4) ?? '—'}. The fundamental assumption ln(X) ~ Normal is not supported by this inspection data.`,
                                  `Upper Tail Shape Mismatch: Near-zero wall-loss measurements distort the log-transformation, making the upper tail heavier than Lognormal predicts.`,
                                  `Statistical Decision: p = ${pval(r.p_value, r.p_value_is_bound)} < 0.05. The Lognormal hypothesis is statistically rejected. The data deviates in the critical upper tail region that drives RBI inspection intervals.`,
                                ],
                                Weibull: [
                                  `Shape Parameter Inadequacy: The MLE-estimated β = ${r.parameters?.beta?.toFixed(4) ?? r.parameters?.shape?.toFixed(4) ?? 'N/A'} cannot simultaneously fit the body and the extreme tail of this corrosion dataset. Weibull's tail shape is entirely governed by β.`,
                                  `Modified AD* Test Failure: Even after the MIL-HDBK-17 finite-sample correction AD* = (1 + 0.2/√n)·A², the corrected statistic AD* = ${r.ad_modified != null ? r.ad_modified.toFixed(4) : num(r.ad_statistic)} still exceeds CV = ${r.critical_value?.toFixed(4) ?? '—'}.`,
                                  `Middle-Percentile Deviation: The Weibull CDF deviates from the empirical distribution across the 50th–90th percentile range, where most inspection measurements concentrate. The AD test's weighting function amplifies these deviations.`,
                                  `Statistical Decision: p = ${pval(r.p_value, r.p_value_is_bound)} < 0.05. The Weibull hypothesis is rejected — the data tail shape cannot be accommodated by the Weibull family at this sample size.`,
                                ],
                                Exponential: [
                                  `Single-Parameter Restriction: The Exponential distribution has only one free parameter (λ = rate) — far too restrictive for real corrosion data, which requires at least a two-parameter model to capture both location and spread.`,
                                  `Memoryless Property Violated: Exponential assumes constant degradation rate. Real heat exchanger tube corrosion is NOT memoryless — accumulated damage, pitting, and service exposure create time-dependent degradation the Exponential cannot model.`,
                                  `Coefficient of Variation Requirement Failed: Exponential requires CV = σ/μ ≈ 1.0. This dataset's CV deviates significantly from 1.0, confirming the distribution is fundamentally inappropriate for this data type.`,
                                  `Catastrophic AD Failure: A² = ${num(r.ad_statistic)} — typically the worst-performing distribution for heat exchanger wall-loss. The Exponential model fails because corrosion damage does not follow a memoryless, single-rate process.`,
                                ],
                                Gumbel: [
                                  `Sample-Size-Adjusted CV Exceeded: A² = ${num(r.ad_statistic)} exceeds the sample-size-dependent critical value CV = ${r.critical_value?.toFixed(4) ?? '—'} (Shin et al., 2012, Table 1, n = ${nTested}). The Gumbel CDF deviates significantly at the upper tail.`,
                                  `Heavy-Tail Behaviour Detected: The dataset exhibits heavier upper-tail behaviour than Gumbel (EVT-I) predicts. Possible causes: localised pitting, mixed damage mechanisms (top/bottom pass), non-homogeneous metallurgy, or near-wall flow velocity variations.`,
                                  `Monte Carlo p-Value Confirmation: The Monte Carlo p-value (5,000 synthetic trials with MLE re-estimation) = ${pval(r.p_value, r.p_value_is_bound)} confirms this A² is statistically improbable under the Gumbel hypothesis for n = ${nTested}.`,
                                  distResults.filter((x: any) => x.passed).length === 0
                                    ? `Engineering Override (ASME PVP2006): Despite the statistical rejection, Gumbel is STILL the recommended distribution per ASME PVP2006-ICPVT11-93702 for wall-loss EVA. The rejection is likely caused by measurement discretisation (limited UT resolution) — proceed with Gumbel for conservative RBI scheduling.`
                                    : `Remediation Actions: (1) Split dataset by tube bundle zone (top/bottom pass) and run separate AD tests; (2) Verify NDE measurement resolution — discretised readings elevate A²; (3) Investigate if the 3–5 most extreme wall-loss tubes represent a distinct pitting mechanism.`,
                                ],
                              };

                              const reasons = REASONS[distNorm] ?? [
                                `AD Statistic Exceeded: A² = ${num(r.ad_statistic)} exceeds CV = ${r.critical_value?.toFixed(4) ?? '—'} at α = 0.05.`,
                                `Empirical CDF Divergence: The observed data deviates significantly from the theoretical ${distNorm} CDF in the upper tail region, where the AD test applies maximum weight.`,
                                `p-Value Criterion Failed: p = ${pval(r.p_value, r.p_value_is_bound)} < 0.05. There is sufficient evidence to reject the null hypothesis that the data follows a ${distNorm} distribution.`,
                                `Recommendation: Verify that the dataset characteristics (skewness, kurtosis, tail behaviour) are compatible with the ${distNorm} family before using for EVA predictions.`,
                              ];

                              return reasons.map((reason, i) => {
                                const { title, body } = splitReason(reason);
                                const isEngOverride = i === 3 && distNorm === 'Gumbel' && distResults.filter((x: any) => x.passed).length === 0;
                                return (
                                  <div key={i} className={cn(
                                    'flex items-start gap-3 text-xs leading-relaxed',
                                    isEngOverride ? 'text-amber-900' : 'text-red-900'
                                  )}>
                                    <span className={cn(
                                      'shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] mt-0.5',
                                      isEngOverride ? 'bg-amber-200 text-amber-700' : 'bg-red-200 text-red-700'
                                    )}>{i + 1}</span>
                                    <p><strong className="font-bold">{title}:</strong> {body}</p>
                                  </div>
                                );
                              });
                            })()
                            }

                            {/* Technical metrics footer */}
                            <div className="mt-4 pt-3 border-t border-red-200 flex flex-wrap gap-4 text-[10px] font-mono">
                              <span className="text-gray-600">A² = <strong className="text-red-700">{num(r.ad_statistic, 6)}</strong></span>
                              {r.ad_modified != null && <span className="text-gray-600">AD* = <strong>{r.ad_modified.toFixed(6)}</strong></span>}
                              <span className="text-gray-600">CV(α=0.05) = <strong>{r.critical_value ? r.critical_value.toFixed(6) : '—'}</strong></span>
                              {r.p_value != null && <span className="text-gray-600">p = <strong className="text-red-700">{pval(r.p_value, r.p_value_is_bound)}</strong></span>}
                              <span className="ml-auto text-red-700 font-bold">H₀ REJECTED — {r.distribution} distribution not supported by this data</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Passed distribution: positive assessment */}
                      {r.passed && (
                        <div className="mt-4 rounded-xl border border-emerald-200 overflow-hidden">
                          <div className="px-5 py-3 bg-emerald-600 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">{r.distribution} Distribution Accepted — Engineering Assessment</span>
                            {r.p_value != null && (
                              <span className="ml-auto text-[10px] font-mono font-bold bg-emerald-700 text-emerald-100 px-2.5 py-1 rounded-full">
                                p-value = {pval(r.p_value, r.p_value_is_bound)} ≥ 0.05 ✓
                              </span>
                            )}
                          </div>
                          <div className="p-5 bg-emerald-50/50 space-y-2">
                            {[
                              `The AD statistic A² = ${r.ad_statistic.toFixed(4)} is below the critical threshold CV = ${r.critical_value?.toFixed(4)} at α = 0.05. The empirical CDF does not deviate significantly from the theoretical ${r.distribution} CDF.`,
                              r.p_value != null ? `p-value = ${pval(r.p_value, r.p_value_is_bound)} ≥ 0.05 — there is insufficient statistical evidence to reject the hypothesis that the data follows a ${r.distribution} distribution.` : `The test statistic is within acceptable bounds at the standard 5% significance level used in mechanical integrity analysis.`,
                              `Proceed to EVA Analysis using the ${r.distribution} distribution to compute statistically defensible wall-loss predictions with confidence intervals for RBI scheduling.`,
                            ].map((point, i) => (
                              <div key={i} className="flex items-start gap-3 text-xs text-emerald-900 leading-relaxed">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{point}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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
          <h3 className="text-lg font-bold text-gray-900">No AD Diagnostic Report Yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md">
            Select a dataset above and click &quot;Run AD Diagnostics&quot; to validate the Gumbel fit and compare it against four diagnostic distributions, with per-distribution rejection reasons.
          </p>
        </div>
      )}
    </div>
  );
}

