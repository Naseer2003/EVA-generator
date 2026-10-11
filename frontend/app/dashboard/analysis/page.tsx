'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Database,
  BarChart3,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  Info,
  ChevronRight,
  FileSpreadsheet,
  ClipboardPaste,
  FlaskConical,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { datasetsApi, evaApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ADResult {
  distribution: string;
  ad_statistic: number;
  critical_value: number;
  p_value: number | null;
  p_value_is_bound?: boolean | null;
  passed: boolean;
  rank: number;
  parameters?: Record<string, any>;
}

export default function AnalysisPage() {
  const router = useRouter();
  const [datasets, setDatasets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  // Fixed by PVP2006 / ASTM E2283 for mechanical integrity, and the engine
  // fits Gumbel regardless of what is sent — this is not a user choice.
  const DISTRIBUTION = 'Gumbel';
  const [method] = useState('mle');
  const [nBootstrap] = useState(1000);
  const [totalPopulation, setTotalPopulation] = useState<number | ''>('');

  // Engineering Parameters
  const [originalThickness, setOriginalThickness] = useState(2.41);
  const [serviceStartDate, setServiceStartDate] = useState('2015-10-01');
  const [inspectionDate, setInspectionDate] = useState('2017-10-01');
  const [minimumRequiredThickness, setMinimumRequiredThickness] = useState(0.5);
  const [isSmartPasteActive, setIsSmartPasteActive] = useState(false);

  // Step 2: AD Testing State — NEVER auto-runs on page load or dataset select
  const [hasRunAdTest, setHasRunAdTest] = useState(false);
  const [isAdTesting, setIsAdTesting] = useState(false);
  const [adTestResults, setAdTestResults] = useState<ADResult[]>([]);
  const [recommendedDist, setRecommendedDist] = useState<string | null>(null);
  const [nTested, setNTested] = useState<number | null>(null);
  // Ties make a continuous goodness-of-fit test inapplicable — see adTestMeta.
  const [adTestMeta, setAdTestMeta] = useState<any>(null);
  const [adTestError, setAdTestError] = useState<string | null>(null);

  // ── Population sizing (PVP2006 / ASTM E2283) ────────────────────────────────
  // n = inspected sample size — comes from the selected dataset's row count.
  // N = total population (every unit in the bundle / circuit) — user-supplied.
  // EVA extrapolates the sample fit from n out to N, so N must be >= n;
  // N == n is a 100% inspection and performs no extrapolation at all.
  const nInspected: number | null =
    datasets.find((d) => d.id === selectedDataset)?.rowCount ?? null;

  const populationError: string | null =
    typeof totalPopulation !== 'number' || !Number.isFinite(totalPopulation)
      ? 'Enter the total population N.'
      : totalPopulation < 2
        ? 'N must be at least 2.'
        : nInspected !== null && totalPopulation < nInspected
          ? `N cannot be smaller than n (${nInspected} inspected units).`
          : null;

  const populationWarning: string | null =
    !populationError && nInspected !== null && totalPopulation === nInspected
      ? 'N equals n — this run fits the full population rather than extrapolating from a sample.'
      : null;

  // An untouched N is not an error yet — only a value the user has actually
  // entered (or an attempted run) should surface in red.
  const populationUnset = totalPopulation === '';
  const canRun = Boolean(selectedDataset) && !populationError;
  const blockedReason = !selectedDataset ? 'Select a dataset to continue' : populationError;

  const parseSmartPaste = (text: string) => {
    const lines = text.split('\n');
    let foundSomething = false;

    lines.forEach(line => {
      const lowerLine = line.toLowerCase();

      if (lowerLine.includes('thickness') && (lowerLine.includes('service start') || lowerLine.includes('original'))) {
        const match = line.match(/(\d+\.?\d*)/);
        if (match) {
          setOriginalThickness(parseFloat(match[0]));
          foundSomething = true;
        }
      }

      if (lowerLine.includes('total number') || lowerLine.includes('tubes') || lowerLine.includes('population')) {
        const match = line.match(/(\d+)/);
        if (match) {
          setTotalPopulation(parseInt(match[0]));
          foundSomething = true;
        }
      }

      if (lowerLine.includes('min') && lowerLine.includes('required')) {
        const match = line.match(/(\d+\.?\d*)/);
        if (match) {
          setMinimumRequiredThickness(parseFloat(match[0]));
          foundSomething = true;
        }
      }

      const dateMatch = line.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})|(\d{1,2}[-/]\d{1,2}[-/]\d{4})/);
      if (dateMatch) {
        if (lowerLine.includes('service start')) {
          setServiceStartDate(dateMatch[0]);
          foundSomething = true;
        } else if (lowerLine.includes('inspection')) {
          setInspectionDate(dateMatch[0]);
          foundSomething = true;
        }
      }
    });

    if (foundSomething) {
      setIsSmartPasteActive(true);
      setTimeout(() => setIsSmartPasteActive(false), 2000);
    }
  };

  useEffect(() => {
    async function fetchDatasets() {
      try {
        const res = await datasetsApi.getAll();
        setDatasets(res.data);
        if (res.data.length > 0) {
          const firstDb = res.data[0];
          setSelectedDataset(firstDb.id);
          // N is NOT derived from the row count: the row count is the inspected
          // sample size n. N (total population) must be entered explicitly.
          // NOTE: Do NOT auto-run AD test — user must click "Run AD Test" button
        }
      } catch (err) {
        console.error('Failed to fetch datasets', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDatasets();

    const handlePaste = (e: ClipboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;
      const text = e.clipboardData?.getData('text');
      if (text) parseSmartPaste(text);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Explicitly run AD test ONLY when user clicks the button
  const runADTest = async (datasetId?: string) => {
    const targetDatasetId = datasetId || selectedDataset;
    if (!targetDatasetId) return;
    setIsAdTesting(true);
    setAdTestError(null);
    try {
      // N is not sent: no AD statistic, critical value or p-value depends on it.
      // originalThickness IS sent — the test must run on wall loss, the same
      // variable the EVA fits, not on the raw thickness readings.
      const res = await evaApi.runADTest(targetDatasetId, { originalThickness });
      const results = res.data?.results || [];
      const recommended = res.data?.recommended || 'Gumbel';
      const nObs = res.data?.nTested ?? res.data?.n_observations ?? null;
      setAdTestResults(results);
      setRecommendedDist(recommended);
      setNTested(nObs);
      setAdTestMeta(res.data ?? null);
      setHasRunAdTest(true);
    } catch (err: any) {
      console.error('AD test failed', err);
      setAdTestError('Failed to run AD test on selected dataset.');
    } finally {
      setIsAdTesting(false);
    }
  };


  const handleSelectDataset = (id: string) => {
    setSelectedDataset(id);
    // N is an equipment property, not a file property — leave the user's value intact.
    // Reset AD test results when dataset is changed — wait for user to click button
    setAdTestResults([]);
    setAdTestMeta(null);
    setRecommendedDist(null);
    setNTested(null);
    setHasRunAdTest(false);
  };

  const handleRun = async () => {
    if (!selectedDataset || populationError) return;
    setIsSubmitting(true);
    try {
      const res = await evaApi.run({
        datasetId: selectedDataset,
        distribution: DISTRIBUTION,
        method,
        nBootstrap,
        totalPopulation: totalPopulation as number,
        originalThickness,
        serviceStartDate,
        inspectionDate,
        minimumRequiredThickness
      });
      router.push(`/dashboard/analysis/${res.data.runId}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Analysis failed. Please check your data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New EVA Analysis</h1>
          <p className="text-gray-500 text-sm mt-1">Configure engineering parameters, perform Anderson-Darling distribution fitting, and execute Extreme Value Analysis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Engineering Inputs Section */}
          <section className="bg-white border border-gray-200 p-6 rounded-xl space-y-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-teal-50 border border-teal-100 rounded-lg flex items-center justify-center text-teal-600">
                <Settings className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Engineering Parameters</h2>
              </div>
              <button
                onClick={async () => {
                  const text = await navigator.clipboard.readText();
                  parseSmartPaste(text);
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors border cursor-pointer",
                  isSmartPasteActive
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                )}
              >
                {isSmartPasteActive ? <CheckCircle2 className="w-3 h-3" /> : <ClipboardPaste className="w-3 h-3" />}
                {isSmartPasteActive ? "Extracted!" : "Smart Paste"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Original Thickness (mm)</label>
                <input
                  type="number" step="0.001" value={originalThickness}
                  onChange={(e) => setOriginalThickness(parseFloat(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-teal-500 outline-none text-gray-900 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Min. Required Thickness (mm)</label>
                <input
                  type="number" step="0.001" value={minimumRequiredThickness}
                  onChange={(e) => setMinimumRequiredThickness(parseFloat(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-teal-500 outline-none text-gray-900 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Service Start Date</label>
                <input
                  type="date" value={serviceStartDate}
                  onChange={(e) => setServiceStartDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-teal-500 outline-none text-gray-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Inspection Date</label>
                <input
                  type="date" value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-teal-500 outline-none text-gray-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Total Population N <span className="text-red-500">*</span>
                </label>
                <input
                  type="number" min="2" step="1" value={totalPopulation}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setTotalPopulation(Number.isFinite(v) ? v : '');
                  }}
                  placeholder="e.g. 1140"
                  className={cn(
                    "w-full bg-gray-50 border rounded-md px-3 py-2 text-sm outline-none text-gray-900 font-mono",
                    populationError ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-teal-500"
                  )}
                />
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">All units in the bundle / circuit</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Inspected Sample n</label>
                <div className="w-full bg-gray-100/70 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500 font-mono flex items-center justify-between">
                  <span>{nInspected ?? '—'}</span>
                  {nInspected !== null && typeof totalPopulation === 'number' && totalPopulation >= nInspected && (
                    <span className="text-[10px] font-bold text-teal-600 tracking-tight">
                      n/N = {((nInspected / totalPopulation) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">From selected dataset — read only</p>
              </div>
            </div>

            {populationError && (
              <div className={cn(
                "flex items-start gap-2.5 p-3 border rounded-md",
                populationUnset ? "bg-gray-50 border-gray-200" : "bg-red-50 border-red-200"
              )}>
                {populationUnset
                  ? <Info className="w-4 h-4 text-gray-400 shrink-0 mt-px" />
                  : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-px" />}
                <p className={cn(
                  "text-[11px] font-medium leading-relaxed",
                  populationUnset ? "text-gray-600" : "text-red-700"
                )}>
                  {populationUnset
                    ? 'Enter the total population N — every unit in the bundle or circuit — to enable the analytical run.'
                    : populationError}
                </p>
              </div>
            )}
            {populationWarning && (
              <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-px" />
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">{populationWarning}</p>
              </div>
            )}

            <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-md">
              <p className="text-[10px] text-teal-700 uppercase tracking-wider font-bold mb-0.5">Auto-Conversion Active</p>
              <p className="text-[11px] text-gray-600">
                Wall Loss will be calculated as: <code>{originalThickness}mm - Remaining Thickness</code>.
              </p>
            </div>
          </section>

          {/* Step 1: Select Source Data */}
          <section className="bg-white border border-gray-200 p-6 rounded-xl space-y-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-teal-50 border border-teal-100 rounded-lg flex items-center justify-center text-teal-600">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Step 1: Select Source Data</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {isLoading ? (
                [1, 2].map(i => <div key={i} className="h-20 bg-gray-50 rounded-md animate-pulse" />)
              ) : datasets.length === 0 ? (
                <div className="col-span-2 p-8 border border-dashed border-gray-200 rounded-md text-center">
                  <p className="text-gray-400 text-sm mb-2">No datasets available.</p>
                  <button onClick={() => router.push('/dashboard/datasets')} className="text-teal-600 font-bold text-xs uppercase tracking-wider hover:underline">Go to Datasets</button>
                </div>
              ) : (
                datasets.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelectDataset(d.id)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all cursor-pointer",
                      selectedDataset === d.id
                        ? "bg-teal-50/80 border-teal-500 ring-1 ring-teal-500/20"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={cn(
                        "w-7 h-7 rounded flex items-center justify-center",
                        selectedDataset === d.id ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-400"
                      )}>
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </div>
                      {selectedDataset === d.id && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{d.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Uploaded {new Date(d.uploadedAt).toLocaleDateString()}</p>
                      {d.rowCount && (
                        <span className="text-[10px] font-bold text-teal-600 font-mono">{d.rowCount} rows</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          {/* Step 2: Distribution Goodness-of-Fit */}
          <section className="bg-white border border-gray-200 p-6 rounded-xl space-y-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 border border-teal-100 rounded-lg flex items-center justify-center text-teal-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight">Step 2: Validate the Gumbel Fit</h2>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">ANDERSON-DARLING TEST — GUMBEL, WITH FOUR DIAGNOSTIC COMPARATORS</p>
                </div>
              </div>
              <button
                onClick={() => selectedDataset && runADTest(selectedDataset)}
                disabled={!selectedDataset || isAdTesting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50 shrink-0 cursor-pointer shadow-sm"
              >
                {isAdTesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Testing 5 Models...
                  </>
                ) : (
                  <>
                    <FlaskConical className="w-3.5 h-3.5" />
                    {hasRunAdTest ? "Re-run Tests" : "Run AD Test"}
                  </>
                )}
              </button>
            </div>

            {/* AD Test Status / Recommended Distribution Banner */}
            {isAdTesting ? (
              <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-teal-600 animate-spin shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-900">Running Anderson-Darling tests on 5 candidate distributions...</p>
                  <p className="text-[10px] text-gray-500">Evaluating Weibull, Exponential, Gumbel, Lognormal, and Normal distributions.</p>
                </div>
              </div>
            ) : hasRunAdTest && adTestResults.length > 0 ? (
              <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">GUMBEL FIT — PVP2006 / ASTM E2283</p>
                    <p className="text-xl font-black text-gray-900 tracking-tight">
                      {(() => {
                        const g = adTestResults.find((r) => r.distribution === 'Gumbel');
                        if (!g) return 'Not evaluated';
                        return g.passed ? 'Validated' : 'Not validated';
                      })()}
                    </p>
                    {recommendedDist && recommendedDist !== 'Gumbel' && (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Closest comparator: {recommendedDist} — diagnostic only, the run still uses Gumbel
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">PASSED</p>
                    <p className="text-xl font-black text-emerald-600">{adTestResults.filter(r => r.passed).length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">FAILED</p>
                    <p className="text-xl font-black text-red-600">{adTestResults.filter(r => !r.passed).length}</p>
                  </div>
                </div>
              </div>
            ) : adTestError ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 font-medium">
                {adTestError}
              </div>
            ) : (
              /* Banner prompting user to click "Run AD Test" */
              <div className="p-4 bg-teal-50/40 border border-teal-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Anderson-Darling GoF Test Ready</h4>
                    <p className="text-[11px] text-gray-500">Click &quot;Run AD Test&quot; above to calculate Goodness-of-Fit statistics ($A^2$) across all 5 candidate distributions for your selected dataset.</p>
                  </div>
                </div>
                <button
                  onClick={() => runADTest()}
                  disabled={!selectedDataset}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  Run AD Test
                </button>
              </div>
            )}

            {/* AD Test 5-Distributions Table (Shown after user clicks Run AD Test) */}
            {hasRunAdTest && adTestResults.length > 0 && (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">DISTRIBUTION</th>
                        <th className="py-2.5 px-3">AD STATISTIC</th>
                        <th className="py-2.5 px-3">CRITICAL VALUE</th>
                        <th className="py-2.5 px-3">P-VALUE</th>
                        <th className="py-2.5 px-3">PARAMETERS</th>
                        <th className="py-2.5 px-3 text-right">RESULT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {adTestResults.map((r, idx) => {
                        const isBest = r.rank === 1 || r.distribution === recommendedDist;
                        // Gumbel is the model the EVA actually uses; highlight it
                        // rather than whichever comparator happens to rank first.
                        const isSelected = r.distribution === 'Gumbel';
                        const distColorMap: Record<string, string> = {
                          Weibull: '#d97706',
                          Exponential: '#e11d48',
                          Gumbel: '#0d9488',
                          Lognormal: '#7c3aed',
                          Normal: '#2563eb'
                        };
                        const dotColor = distColorMap[r.distribution] || '#0d9488';

                        return (
                          <tr
                            key={r.distribution}
                            className={cn(
                              "transition-colors",
                              isSelected && "bg-teal-50/60 font-semibold"
                            )}
                          >
                            <td className="py-3 px-3">
                              <span className={cn(
                                "inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold",
                                isBest ? "bg-teal-100 text-teal-800" : "bg-gray-100 text-gray-600"
                              )}>
                                {r.rank || idx + 1}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: dotColor }} />
                                <span className="font-bold text-gray-900">{r.distribution}</span>
                                {r.distribution === 'Gumbel' && (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
                                    USED FOR EVA
                                  </span>
                                )}
                                {isBest && r.distribution !== 'Gumbel' && (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200">
                                    LOWEST A²
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-gray-900">
                              {r.ad_statistic === Infinity ? '∞' : r.ad_statistic.toFixed(4)}
                            </td>
                            <td className="py-3 px-3 font-mono text-gray-600">
                              {r.critical_value ? r.critical_value.toFixed(4) : '—'}
                            </td>
                            <td className="py-3 px-3">
                              {r.p_value != null ? (
                                <span className={cn(
                                  "font-mono font-bold",
                                  r.p_value >= 0.05 ? "text-emerald-600" : "text-red-600"
                                )}>
                                  {r.p_value >= 1e-4
                              ? (r.p_value_is_bound ? '< ' : '') + r.p_value.toFixed(4)
                              : (r.p_value_is_bound ? '< ' : '') + r.p_value.toExponential(2)}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-gray-500">
                              {r.parameters ? (
                                Object.entries(r.parameters).map(([k, v]: [string, any]) => `${k}=${typeof v === 'number' ? v.toFixed(2) : v}`).join(' ')
                              ) : '—'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                                r.passed
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              )}>
                                {r.passed ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-red-600" />}
                                {r.passed ? 'FAIL TO REJECT H₀' : 'REJECT H₀'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-gray-400 font-medium pt-1">
                  {nTested ? `n = ${nTested} observations` : 'Sample observations'} · α = 0.05 ·{' '}
                  {adTestResults.some((r) => r.passed)
                    ? 'Ranked by lowest AD statistic among passing distributions'
                    : 'No candidate passed — ranked by lowest AD statistic (relative fit only)'}
                  {adTestMeta?.testedVariable === 'wall_loss' && ' · tested on wall loss'}
                </p>
              </div>
            )}
          </section>

          {/* Why nothing passed: measurement resolution, not distributional mismatch */}
          {hasRunAdTest && adTestMeta?.is_discretized && (
            <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-900 shadow-sm">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed space-y-2">
                <span className="font-bold text-amber-950 text-sm block">
                  Goodness-of-fit not applicable at this measurement resolution
                </span>
                <p>{adTestMeta.discretization_note}</p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1 font-mono text-[11px]">
                  <span>distinct values: <strong>{adTestMeta.n_unique}</strong> / {nTested}</span>
                  {adTestMeta.tie_fraction != null && (
                    <span>ties: <strong>{(adTestMeta.tie_fraction * 100).toFixed(1)}%</strong></span>
                  )}
                  {adTestMeta.resolution != null && (
                    <span>resolution: <strong>{adTestMeta.resolution.toFixed(4)} mm</strong></span>
                  )}
                </div>
                <p className="pt-1 border-t border-amber-200">
                  Every candidate failing here does <span className="font-bold text-amber-950">not</span> mean none
                  of them describes your corrosion. A sample from a perfect Gumbel scores A² = 0.28 (pass) at full
                  precision but A² = 60.3 once quantised to 10% bands. Treat{' '}
                  <span className="font-bold text-amber-950">{recommendedDist}</span> as the closest of the five and
                  proceed — Gumbel remains the PVP2006 default for mechanical integrity regardless.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Analytical Engine */}
          <section className="bg-white border border-gray-200 p-6 rounded-xl space-y-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Step 3: Analytical Engine</h2>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">ASME PVP2006 / API 581 STANDARDIZED</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Distribution — fixed by the standard, not selectable */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Statistical Distribution</label>
                <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between h-11">
                  <div>
                    <p className="text-xs font-bold text-teal-900">Gumbel — Extreme Value Type I</p>
                    <p className="text-[9px] text-teal-600 font-semibold uppercase">Mandated by PVP2006 / ASTM E2283</p>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                  Not a choice — for mechanical integrity the distribution is fixed. Step 2 validates it.
                </p>
              </div>

              {/* Confidence Calculation Method */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Confidence Calculation Engine</label>
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between h-11">
                  <div>
                    <p className="text-xs font-bold text-emerald-900">Analytical (PVP2006 / API 581)</p>
                    <p className="text-[9px] text-emerald-600 font-semibold uppercase">Standardized SE &amp; Student&apos;s t-test</p>
                  </div>
                  <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Extrapolating</span>
                  <span className="text-sm font-mono font-bold text-gray-900">n = {nInspected ?? '—'}</span>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                  <span className="text-sm font-mono font-bold text-teal-600">
                    N = {typeof totalPopulation === 'number' ? totalPopulation.toLocaleString() : '—'}
                  </span>
                </div>
                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">
                  Set N in Engineering Parameters above
                </span>
              </div>
              <p className="text-[9px] text-gray-400 mt-2 uppercase font-bold tracking-tight">All 4 confidence intervals (80 / 90 / 95 / 99%) are always computed.</p>
            </div>
          </section>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24 shadow-sm">
            <h3 className="text-gray-900 font-bold tracking-tight mb-6 flex items-center gap-2 uppercase text-[10px] tracking-widest border-b border-gray-100 pb-4">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              Analysis Specs
            </h3>

            <div className="space-y-4 mb-8">
              {[
                { label: 'Dataset', value: datasets.find(d => d.id === selectedDataset)?.name || 'None', color: 'gray' },
                { label: 'Distribution', value: 'Gumbel (EVT I)', color: 'teal' },
                { label: 'Calculation', value: 'Analytical', color: 'emerald' },
                { label: 'Confidence Levels', value: '80 / 90 / 95 / 99%', color: 'teal' },
                { label: 'Inspected (n)', value: nInspected !== null ? nInspected.toLocaleString() : '—', color: 'gray' },
                { label: 'Population (N)', value: typeof totalPopulation === 'number' ? totalPopulation.toLocaleString() : '—', color: populationError ? 'gray' : 'teal' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-start text-[11px]">
                  <span className="text-gray-400 font-bold uppercase tracking-tighter">{item.label}</span>
                  <span className={cn("font-bold text-right leading-tight max-w-[130px]", item.color === 'teal' ? 'text-teal-600' : item.color === 'emerald' ? 'text-emerald-600' : 'text-gray-900')}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {!canRun && blockedReason && (
              <p className="text-[10px] text-red-600 font-bold uppercase tracking-tight mb-3 text-center">
                {blockedReason}
              </p>
            )}

            <button
              onClick={handleRun}
              disabled={!canRun || isSubmitting}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  Execute Analytical Run
                </>
              )}
            </button>

            <div className="mt-8 flex items-start gap-3 bg-teal-50/50 p-4 rounded-md border border-teal-100">
              <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] text-teal-900 uppercase tracking-tight font-bold">PVP2006 / API 581 Compliance</p>
                <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                  This engine calculates Standard Error &amp; Student&apos;s t-test confidence intervals based on the selected distribution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
