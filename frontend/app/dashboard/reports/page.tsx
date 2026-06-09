'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  BarChart3, 
  Calendar, 
  ChevronRight, 
  Download, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { evaApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchRuns() {
      try {
        const res = await evaApi.getMyRuns();
        setRuns(res.data);
      } catch (err) {
        console.error('Failed to fetch runs:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRuns();
  }, []);

  const filteredRuns = runs.filter(run => 
    run.datasetName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    run.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analysis Reports</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage your previous Extreme Value Analysis runs.</p>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Reports', value: runs.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed', value: runs.filter(r => r.status === 'COMPLETED').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Average Life', value: '12.4 Yrs', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-gray-200 p-4 rounded-lg flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reports List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by dataset or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-md pl-9 pr-4 py-1.5 text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Report Details</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Model</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Analysis Date</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={i}>
                    <td className="p-4"><div className="h-4 bg-gray-100 rounded w-48 animate-pulse" /></td>
                    <td className="p-4"><div className="h-4 bg-gray-100 rounded w-24 animate-pulse" /></td>
                    <td className="p-4"><div className="h-4 bg-gray-100 rounded w-32 animate-pulse" /></td>
                    <td className="p-4"><div className="flex justify-center"><div className="h-6 bg-gray-100 rounded-full w-20 animate-pulse" /></div></td>
                    <td className="p-4 text-right"><div className="h-8 bg-gray-100 rounded w-24 ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-10 h-10 text-gray-200" />
                      <p className="text-gray-400 text-sm font-medium">No reports found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-100 rounded flex items-center justify-center text-gray-500">
                          <BarChart3 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-semibold text-sm">{run.datasetName || 'Unnamed Analysis'}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Run ID: {run.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                        Gumbel
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(run.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        run.status === 'COMPLETED' 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                          : "bg-red-50 text-red-600 border border-red-100"
                      )}>
                        {run.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {run.status || 'COMPLETED'}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Link 
                        href={`/dashboard/analysis/${run.id}`}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      >
                        View Report
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
