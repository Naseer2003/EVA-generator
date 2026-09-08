'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  AlertCircle,
  BarChart3,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Info,
  HelpCircle,
  Activity,
  ArrowUpRight,
  FileText,
  Loader2,
  TrendingUp,
  Award,
  BookOpen,
  Filter,
  Layers,
  Sparkles,
  TableProperties
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart
} from '@/components/charts/lazy-charts';
import { evaApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function DedicatedADTestPage() {
  const { id } = useParams();
  const router = useRouter();
  const [run, setRun] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tablePage, setTablePage] = useState(1);
  const rowsPerPage = 15;

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await evaApi.getResults(id as string);
        setRun(res.data);
      } catch (err) {
        console.error('Failed to fetch analysis run', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchResults();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
        <p className="text-gray-500 font-medium tracking-wide">Loading Anderson-Darling Diagnostic Suite...</p>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-gray-900 font-bold text-xl">Analysis Run Not Found</p>
        <button
          onClick={() => router.push('/dashboard/analysis')}
          className="text-teal-600 font-semibold hover:underline"
        >
          Return to Analysis List
        </button>
      </div>
    );
  }

  const result = run.result;
  const gof = result?.goodness_of_fit || {};
  const params = result?.parameters || {};
  const plotData = result?.plot_data || {};
  const probabilityPlot = plotData?.probability_plot || {};
  const tabularData = probabilityPlot?.tabular_data || [];

  const adStat = gof?.ad_statistic ?? 0;
  const adCv = gof?.ad_critical_value ?? 0;
  const pVal = gof?.ad_p_value;
  const isPassed = run.adPassed ?? gof?.ad_passed ?? false;
  const nSample = gof?.n_sample ?? tabularData.length ?? 0;
  const cvMap = gof?.ad_critical_values || {};

  const totalPages = Math.max(1, Math.ceil(tabularData.length / rowsPerPage));
  const paginatedData = tabularData.slice((tablePage - 1) * rowsPerPage, tablePage * rowsPerPage);

  // Safe accessor helpers
  const getRowVal = (r: any): number => Number(r?.observed ?? r?.value ?? r?.val ?? r?.x ?? 0);
  const getTheoreticalCDF = (r: any): number => {
    if (r?.theoretical_cdf != null) return Number(r.theoretical_cdf);
    const x = getRowVal(r);
    if (!params.mu || !params.beta) return 0;
    const z = (x - params.mu) / params.beta;
    return Math.exp(-Math.exp(-z));
  };
  const getEmpiricalCDF = (r: any): number => Number(r?.probability ?? r?.empirical_cdf ?? 0);

  // Recharts Q-Q Scatter Plot Data
  const qqChartData = tabularData.map((d: any, idx: number) => {
    const val = getRowVal(d);
    const y = Number(d.reduced_variate ?? 0);
    const rank = d.rank ?? (idx + 1);
    const theoreticalWallLoss = d.best_fit ?? ((params.mu || 0) + (params.beta || 0) * y);
    return {
      reducedVariate: y,
      wallLoss: val,
      theoreticalWallLoss,
      rank
    };
  });

  // Recharts CDF Smooth vs Empirical Data
  const cdfChartData = tabularData.map((d: any, idx: number) => {
    const val = getRowVal(d);
    const rank = d.rank ?? (idx + 1);
    const empiricalCdf = getEmpiricalCDF(d);
    const theoreticalCdf = getTheoreticalCDF(d);
    return {
      wallLoss: val,
      empiricalCdf,
      theoreticalCdf,
      rank
    };
  });

  const pColor = pVal == null ? 'bg-gray-100 text-gray-700 border-gray-200'
    : pVal >= 0.15 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : pVal >= 0.05 ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-red-50 text-red-700 border-red-200';

  const alphaLevels = [
    { alpha: '0.20', label: 'α = 0.20 (80% Confidence)', significance: 'Liberal / High Power' },
    { alpha: '0.15', label: 'α = 0.15 (85% Confidence)', significance: 'Moderate Threshold' },
    { alpha: '0.10', label: 'α = 0.10 (90% Confidence)', significance: 'API RBI Level C' },
    { alpha: '0.05', label: 'α = 0.05 (95% Confidence)', significance: 'Standard Industry Benchmark' },
    { alpha: '0.01', label: 'α = 0.01 (99% Confidence)', significance: 'Stringent High-Criticality' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/dashboard/analysis/${id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Analysis Summary
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-medium text-gray-500">Anderson-Darling Diagnostics</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <span>Anderson-Darling (AD) Goodness-of-Fit Diagnostic Suite</span>
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
              isPassed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
            )}>
              {isPassed ? '✓ Gumbel Fit Validated' : '✗ Gumbel Fit Rejected'}
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Dataset: <span className="font-semibold text-gray-800">{run.dataset?.name}</span> • Asset: <span className="font-semibold text-gray-800">{run.dataset?.assetName || 'Heat Exchanger Bundle'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
          >
            <FileText className="w-4 h-4 text-gray-500" />
            Print AD Report
          </button>
        </div>
      </div>

      {/* Hero Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">AD Statistic (A²)</span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 font-mono mt-2">
            {adStat.toFixed(4)}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">Weighted EDF tail deviation sum</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Critical Value (CV₀.₀₅)</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 font-mono mt-2">
            {adCv.toFixed(4)}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">Sample-adjusted threshold for n={nSample}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monte Carlo p-Value</span>
            <Sparkles className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 font-mono mt-2">
            {pVal != null ? (pVal <= 0.0001 ? '< 0.0001' : pVal.toFixed(4)) : 'N/A'}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">Derived from 10,000 synthetic trials</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sample Size (n)</span>
            <Layers className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 font-mono mt-2">
            {nSample} <span className="text-xs font-normal text-gray-500">units</span>
          </p>
          <p className="text-[10px] text-gray-500 mt-1">PVP2006 Recommended: 20–30 units</p>
        </div>
      </div>

      {/* Section 1: Significance Level Multi-Breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Filter className="w-5 h-5 text-teal-600" />
              Multi-Level Significance Breakdown (α = 0.20 to 0.01)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Comparison of observed AD statistic (A² = {adStat.toFixed(4)}) against sample-size-adjusted critical values across 5 significance levels (Shin et al., 2012).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Significance Level (α)</th>
                <th className="py-3 px-4">Level Description</th>
                <th className="py-3 px-4">Critical Value CV(α)</th>
                <th className="py-3 px-4">Observed A²</th>
                <th className="py-3 px-4">Condition (A² &lt; CV)</th>
                <th className="py-3 px-4 text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {alphaLevels.map((lvl) => {
                const cv = cvMap[lvl.alpha] ?? (parseFloat(lvl.alpha) === 0.05 ? adCv : null);
                const passAtLvl = cv != null ? adStat < cv : isPassed;
                return (
                  <tr key={lvl.alpha} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900 font-mono">{lvl.label}</td>
                    <td className="py-3 px-4 text-gray-600 font-medium">{lvl.significance}</td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">{cv != null ? cv.toFixed(4) : 'N/A'}</td>
                    <td className="py-3 px-4 font-mono text-gray-700">{adStat.toFixed(4)}</td>
                    <td className="py-3 px-4 font-mono text-gray-600">
                      {cv != null ? `${adStat.toFixed(4)} ${passAtLvl ? '<' : '≥'} ${cv.toFixed(4)}` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        passAtLvl ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {passAtLvl ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {passAtLvl ? 'Fail to Reject H₀' : 'Reject H₀'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Visual Distribution Diagnostics (Charts Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Q-Q Probability Plot */}
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">Gumbel Q-Q Probability Alignment</h3>
              <p className="text-xs text-gray-500 mt-0.5">Empirical reduced variates vs observed wall loss ($x_i = \mu + \beta y$)</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={qqChartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="reducedVariate"
                  type="number"
                  name="Reduced Variate (y)"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  label={{ value: 'Reduced Variate y = -ln(-ln(P))', position: 'bottom', offset: 0, fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis
                  dataKey="wallLoss"
                  type="number"
                  name="Wall Loss (mm)"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  label={{ value: 'Wall Loss (mm)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-900 text-white p-3 rounded-lg text-xs space-y-1 shadow-lg">
                          <p className="font-bold text-teal-400">Rank #{data.rank}</p>
                          <p>Wall Loss: <span className="font-mono">{data.wallLoss.toFixed(4)} mm</span></p>
                          <p>Reduced Variate (y): <span className="font-mono">{data.reducedVariate.toFixed(4)}</span></p>
                          <p>Theoretical Fit: <span className="font-mono">{data.theoreticalWallLoss.toFixed(4)} mm</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  dataKey="theoreticalWallLoss"
                  stroke="#0d9488"
                  strokeWidth={2}
                  dot={false}
                  name="Fitted Gumbel Line"
                />
                <Scatter
                  dataKey="wallLoss"
                  fill="#0f766e"
                  name="Observed Samples"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: CDF Fit vs Empirical Step Function */}
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">Cumulative CDF Alignment (Empirical vs Theoretical)</h3>
              <p className="text-xs text-gray-500 mt-0.5">Highlighting upper tail region (F &gt; 0.90) weighted by AD test</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cdfChartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="wallLoss"
                  type="number"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  label={{ value: 'Wall Loss (mm)', position: 'bottom', offset: 0, fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis
                  domain={[0, 1]}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  label={{ value: 'Cumulative Probability F(x)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-900 text-white p-3 rounded-lg text-xs space-y-1 shadow-lg">
                          <p className="font-bold text-teal-400 font-mono">Rank #{data.rank}</p>
                          <p>Wall Loss: <span className="font-mono">{data.wallLoss.toFixed(4)} mm</span></p>
                          <p>Empirical CDF (Weibull): <span className="font-mono">{data.empiricalCdf.toFixed(4)}</span></p>
                          <p>Theoretical Gumbel CDF: <span className="font-mono">{data.theoreticalCdf.toFixed(4)}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  dataKey="theoreticalCdf"
                  stroke="#0d9488"
                  strokeWidth={2}
                  dot={false}
                  name="Theoretical Gumbel CDF"
                />
                <Scatter
                  dataKey="empiricalCdf"
                  fill="#0284c7"
                  name="Empirical Points"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 3: Itemized Term-by-Term AD Summation Breakdown Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <TableProperties className="w-4 h-4 text-teal-600" />
              Itemized Term-by-Term Anderson-Darling Summation Table
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Exact calculations for each sorted observation showing theoretical CDF F_i, symmetric tail term 1 - F_(n+1-i), and term contribution (2i-1)[ln(F_i) + ln(1 - F_(n+1-i))].
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <span>Page {tablePage} of {totalPages}</span>
            <button
              disabled={tablePage <= 1}
              onClick={() => setTablePage(p => p - 1)}
              className="px-2.5 py-1 bg-gray-100 rounded text-gray-700 disabled:opacity-40 cursor-pointer"
            >
              Prev
            </button>
            <button
              disabled={tablePage >= totalPages}
              onClick={() => setTablePage(p => p + 1)}
              className="px-2.5 py-1 bg-gray-100 rounded text-gray-700 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Rank (i)</th>
                <th className="py-2.5 px-3">Wall Loss x(i) (mm)</th>
                <th className="py-2.5 px-3">Theoretical CDF F_i</th>
                <th className="py-2.5 px-3">Tail Term 1 - F_(n+1-i)</th>
                <th className="py-2.5 px-3">ln(F_i)</th>
                <th className="py-2.5 px-3">ln(1 - F_(n+1-i))</th>
                <th className="py-2.5 px-3 text-right">Term Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-mono">
              {paginatedData.map((row: any, idx: number) => {
                const rank = row.rank ?? ((tablePage - 1) * rowsPerPage + idx + 1);
                const val = getRowVal(row);
                const f_i = getTheoreticalCDF(row);
                // Reverse rank lookup for symmetrical term
                const revRow = tabularData.find((r: any, rIdx: number) => (r.rank ?? (rIdx + 1)) === (nSample + 1 - rank));
                const f_rev = getTheoreticalCDF(revRow || row);
                const tailTerm = Math.max(1e-10, 1.0 - f_rev);
                const ln_F = Math.log(Math.max(1e-10, f_i));
                const ln_tail = Math.log(tailTerm);
                const termContrib = (2 * rank - 1) * (ln_F + ln_tail);

                return (
                  <tr key={rank} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-gray-900">#{rank}</td>
                    <td className="py-2.5 px-3 text-gray-800 font-bold">{val.toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-teal-700">{f_i.toFixed(5)}</td>
                    <td className="py-2.5 px-3 text-gray-600">{tailTerm.toFixed(5)}</td>
                    <td className="py-2.5 px-3 text-gray-600">{ln_F.toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-gray-600">{ln_tail.toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-900">{termContrib.toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Methodology Compliance & Engineering Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Methodology Notes */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4 lg:col-span-1">
          <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600" />
            Methodology Verification
          </h3>
          <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="font-bold text-gray-900 mb-1">✓ Estimated Parameter Table</p>
              <p>Critical values are interpolated from Shin et al. (2012) Table 1 for Gumbel MLE parameter estimation. As proven by T.W. Anderson (2010), MLE estimation reduces the limiting distribution variance compared to known parameters.</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="font-bold text-gray-900 mb-1">✓ Weibull Factor Exclusion</p>
              <p>The finite-sample correction AD* = (1 + 0.2 / sqrt(n)) * AD is specific to Weibull and Exponential distributions. It is intentionally excluded for Gumbel.</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="font-bold text-gray-900 mb-1">✓ Monte Carlo Calibration</p>
              <p>The exact p-value is derived via 10,000 synthetic Gumbel trials with full MLE re-estimation per trial.</p>
            </div>
          </div>
        </div>

        {/* Actionable Engineering Narrative */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            Engineering Assessment & Maintenance Action Plan
          </h3>
          <div className="p-4 rounded-xl border bg-gray-50/50 space-y-3">
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border",
                isPassed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
              )}>
                {isPassed ? 'Fit Validated' : 'Fit Rejected'}
              </span>
              {pVal != null && (
                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border", pColor)}>
                  Monte Carlo p = {pVal <= 0.0001 ? '< 0.0001' : pVal.toFixed(3)}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-700 leading-relaxed font-medium">
              {gof?.ad_interpretation || (
                isPassed
                  ? `The Anderson-Darling statistic (A² = ${adStat.toFixed(4)}) is below the critical threshold (${adCv.toFixed(4)}) at α = 0.05. The Gumbel Extreme Value Type I distribution provides a statistically defensible model for wall loss forecasting across population N = ${run.totalPopulation?.toLocaleString()}.`
                  : `The Anderson-Darling statistic (A² = ${adStat.toFixed(4)}) exceeds the critical threshold (${adCv.toFixed(4)}) at α = 0.05. The observed data shows tail divergence from a single Gumbel distribution.`
              )}
            </p>

            <div className="border-t border-gray-200/80 pt-3 mt-3">
              <p className="text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-2">Recommended Next Actions:</p>
              <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1.5 font-medium">
                {isPassed ? (
                  <>
                    <li>Proceed with Risk-Based Inspection (RBI) intervals based on 95% Confidence Level B forecasts.</li>
                    <li>Schedule next non-destructive examination (NDE) prior to the predicted End-of-Life date.</li>
                    <li>Document this Anderson-Darling validation in the official equipment mechanical integrity file.</li>
                  </>
                ) : (
                  <>
                    <li>Inspect additional units (increase sample size n from {nSample} to 20–30 units per PVP2006).</li>
                    <li>Check if the equipment dataset contains two distinct damage mechanisms (e.g., top pass vs bottom pass) and segment into homogeneous sub-populations.</li>
                    <li>Re-examine extreme wall loss signal points for NDE measurement artifacts or localized pitting.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
