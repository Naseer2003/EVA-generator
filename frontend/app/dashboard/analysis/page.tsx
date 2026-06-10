'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Play,
  Settings,
  Database,
  BarChart3,
  CheckCircle2,
  Loader2,
  Zap,
  Info,
  ChevronRight,
  Plus,
  Table,
  FileSpreadsheet,
  ClipboardPaste,
  X
} from 'lucide-react';
import { datasetsApi, evaApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function AnalysisPage() {
  const router = useRouter();
  const [datasets, setDatasets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [method, setMethod] = useState('mle');
  const [nBootstrap, setNBootstrap] = useState(1000);
  // totalPopulation auto-fills from the selected dataset's row count
  const [totalPopulation, setTotalPopulation] = useState<number | ''>('');

  // Engineering Parameters
  const [originalThickness, setOriginalThickness] = useState(2.41);
  const [serviceStartDate, setServiceStartDate] = useState('2015-10-01');
  const [inspectionDate, setInspectionDate] = useState('2017-10-01');
  const [minimumRequiredThickness, setMinimumRequiredThickness] = useState(0.5);
  const [isSmartPasteActive, setIsSmartPasteActive] = useState(false);

  useEffect(() => {
    async function fetchDatasets() {
      try {
        const res = await datasetsApi.getAll();
        setDatasets(res.data);
        if (res.data.length > 0) {
          const firstDb = res.data[0];
          setSelectedDataset(firstDb.id);
          setTotalPopulation(firstDb.rowCount || '');
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

  const parseSmartPaste = (text: string) => {
    const lines = text.split('\n');
    let foundSomething = false;

    lines.forEach(line => {
      const lowerLine = line.toLowerCase();

      // Original Thickness
      if (lowerLine.includes('thickness') && (lowerLine.includes('service start') || lowerLine.includes('original'))) {
        const match = line.match(/(\d+\.?\d*)/);
        if (match) {
          setOriginalThickness(parseFloat(match[0]));
          foundSomething = true;
        }
      }

      // Total Population / Tubes
      if (lowerLine.includes('total number') || lowerLine.includes('tubes') || lowerLine.includes('population')) {
        const match = line.match(/(\d+)/);
        if (match) {
          setTotalPopulation(parseInt(match[0]));
          foundSomething = true;
        }
      }

      // Min Required Thickness
      if (lowerLine.includes('min') && lowerLine.includes('required')) {
        const match = line.match(/(\d+\.?\d*)/);
        if (match) {
          setMinimumRequiredThickness(parseFloat(match[0]));
          foundSomething = true;
        }
      }

      // Dates (Basic YYYY-MM-DD or DD/MM/YYYY)
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

  const handleRun = async () => {
    if (!selectedDataset) return;
    setIsSubmitting(true);
    try {
      const res = await evaApi.run({
        datasetId: selectedDataset,
        method,
        nBootstrap,
        totalPopulation: totalPopulation || undefined,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New EVA Analysis</h1>
          <p className="text-gray-500 text-sm mt-1">Configure parameters for Extreme Value Analysis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Engineering Inputs Section */}
          <section className="bg-white border border-gray-200 p-6 rounded-lg space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded flex items-center justify-center text-blue-600">
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
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors border",
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none text-gray-900 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Min. Required Thickness (mm)</label>
                <input
                  type="number" step="0.001" value={minimumRequiredThickness}
                  onChange={(e) => setMinimumRequiredThickness(parseFloat(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none text-gray-900 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Service Start Date</label>
                <input
                  type="date" value={serviceStartDate}
                  onChange={(e) => setServiceStartDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none text-gray-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Inspection Date</label>
                <input
                  type="date" value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none text-gray-900"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
              <p className="text-[10px] text-blue-600 uppercase tracking-wider font-bold mb-0.5">Auto-Conversion Active</p>
              <p className="text-[11px] text-gray-500">
                Wall Loss will be calculated as: <code>{originalThickness}mm - Remaining Thickness</code>.
              </p>
            </div>
          </section>

          {/* Step 1: Dataset Selection */}
          <section className="bg-white border border-gray-200 p-6 rounded-lg space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded flex items-center justify-center text-emerald-600">
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
                  <button onClick={() => router.push('/dashboard/datasets')} className="text-emerald-600 font-bold text-xs uppercase tracking-wider hover:underline">Go to Datasets</button>
                </div>
              ) : (
                datasets.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDataset(d.id);
                      setTotalPopulation(d.rowCount || '');
                    }}
                    className={cn(
                      "p-3 rounded-md border text-left transition-colors",
                      selectedDataset === d.id
                        ? "bg-emerald-50 border-emerald-500"
                        : "bg-white border-gray-100 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={cn(
                        "w-7 h-7 rounded flex items-center justify-center",
                        selectedDataset === d.id ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-400"
                      )}>
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </div>
                      {selectedDataset === d.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{d.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Uploaded {new Date(d.uploadedAt).toLocaleDateString()}</p>
                      {d.rowCount && (
                        <span className="text-[10px] font-bold text-emerald-600 font-mono">{d.rowCount} rows</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          {/* Step 2: Statistical Parameters */}
          <section className="bg-white border border-gray-200 p-6 rounded-lg space-y-8 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded flex items-center justify-center text-indigo-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Step 2: Analytical Engine</h2>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">ASME PVP2006 / API 581 Standardized</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Distribution - Fixed to Gumbel per Document */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Statistical Distribution</label>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-indigo-900">Gumbel (Extreme Value Type I)</p>
                    <p className="text-[10px] text-indigo-600 font-semibold uppercase">Mandatory for Mechanical Integrity</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                </div>
              </div>

              {/* Estimation Method */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Confidence Calculation</label>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-emerald-900">Analytical (PVP2006)</p>
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase">Standardized SE & Student's T</p>
                  </div>
                  <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Population (N)</label>
                <input
                  type="number"
                  value={totalPopulation}
                  onChange={(e) => setTotalPopulation(parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-500 text-gray-900 font-mono"
                  placeholder="Auto-filled from dataset row count"
                />
                <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-tight">Total tubes in the bundle — auto-filled from selected dataset. All 4 confidence intervals (80 / 90 / 95 / 99%) are always computed.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24 shadow-sm">
            <h3 className="text-gray-900 font-bold tracking-tight mb-6 flex items-center gap-2 uppercase text-[10px] tracking-widest border-b border-gray-50 pb-4">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Analysis Specs
            </h3>

            <div className="space-y-4 mb-8">
              {[
                { label: 'Dataset', value: datasets.find(d => d.id === selectedDataset)?.name || 'None', color: 'gray' },
                { label: 'Distribution', value: 'Gumbel (EVT I)', color: 'indigo' },
                { label: 'Calculation', value: 'Analytical', color: 'emerald' },
                { label: 'Confidence Levels', value: '80 / 90 / 95 / 99%', color: 'indigo' },
                { label: 'Target Pop.', value: totalPopulation ? Number(totalPopulation).toLocaleString() : '—', color: 'gray' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-start text-[11px]">
                  <span className="text-gray-400 font-bold uppercase tracking-tighter">{item.label}</span>
                  <span className={cn("font-bold text-right leading-tight max-w-[120px]", item.color === 'indigo' ? 'text-indigo-600' : item.color === 'emerald' ? 'text-emerald-600' : 'text-gray-900')}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleRun}
              disabled={!selectedDataset || isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-md transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
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

            <div className="mt-8 flex items-start gap-3 bg-indigo-50/50 p-4 rounded-md border border-indigo-100">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] text-indigo-900 uppercase tracking-tight font-bold">PVP2006 Compliance</p>
                <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                  This engine utilizes analytical Standard Error and Student's T-test formulas for rigorous mechanical integrity assurance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
