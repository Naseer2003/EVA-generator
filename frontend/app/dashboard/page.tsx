'use client';

import { useEffect, useState } from 'react';
import { 
  Activity, 
  Database, 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight, 
  Plus,
  Clock,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { evaApi, datasetsApi } from '@/lib/api';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';

export default function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRuns: 0,
    totalDatasets: 0,
    activeAssets: 0,
    criticalFindings: 0
  });
  const [recentRuns, setRecentRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [runsRes, datasetsRes] = await Promise.all([
          evaApi.getMyRuns(),
          datasetsApi.getAll()
        ]);
        
        setRecentRuns(runsRes.data.slice(0, 5));
        setStats({
          totalRuns: runsRes.data.length,
          totalDatasets: datasetsRes.data.length,
          activeAssets: 0, // Placeholder
          criticalFindings: runsRes.data.filter((r: any) => r.adPassed === false).length
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, <span className="text-blue-600 font-semibold">{user?.firstName}</span>.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/analysis" className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Analysis
          </Link>
          <Link href="/dashboard/datasets" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Upload Data
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total EVA Runs', value: stats.totalRuns, icon: Activity, color: 'blue', trend: '+12%' },
          { label: 'Datasets Indexed', value: stats.totalDatasets, icon: Database, color: 'indigo', trend: '+5%' },
          { label: 'Asset Reliability', value: '94.2%', icon: ShieldCheck, color: 'sky', trend: '+1.4%' },
          { label: 'Critical Anomalies', value: stats.criticalFindings, icon: AlertCircle, color: 'red', trend: '-2' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-gray-200 p-5 rounded-lg flex items-center gap-4">
            <div className={`p-2.5 rounded-md bg-gray-50 border border-gray-100`}>
              <stat.icon className={`w-5 h-5 text-gray-600`} />
            </div>
            <div>
              <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{stat.value}</h3>
                <span className={`text-[10px] font-bold text-${stat.color === 'red' ? 'red' : 'emerald'}-600`}>
                  {stat.trend}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Recent Activity
            </h2>
            <Link href="/dashboard/analysis" className="text-sm text-blue-600 font-medium hover:underline transition-colors">
              View all
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <div className="w-1/3 h-4 bg-gray-100 rounded" />
                    <div className="w-1/4 h-3 bg-gray-50 rounded" />
                  </div>
                </div>
              ))
            ) : recentRuns.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-2">
                <p className="text-gray-400 text-sm">No analysis runs found yet.</p>
                <Link href="/dashboard/datasets" className="text-blue-600 text-sm font-semibold hover:underline">
                  Upload a dataset to start
                </Link>
              </div>
            ) : (
              recentRuns.map((run: any) => (
                <div key={run.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center border ${run.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                      {run.status === 'COMPLETED' ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-gray-900 font-semibold text-sm">{run.dataset?.name || 'Manual Entry'}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gumbel</span>
                        <span className="text-xs text-gray-400">{new Date(run.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/dashboard/analysis/${run.id}`} className="p-2 rounded-md hover:bg-gray-100 text-gray-400 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Insights */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight px-1">Resources</h2>
          <div className="bg-blue-600 rounded-lg p-6 text-white relative overflow-hidden">
            <h3 className="text-lg font-bold tracking-tight mb-2">Platform Power</h3>
            <p className="text-sm text-blue-100 mb-6 leading-relaxed">Access MLE and Bootstrap analysis with enterprise-grade stability.</p>
            <button className="bg-white text-blue-600 px-4 py-2 rounded-md text-xs font-bold hover:bg-blue-50 transition-colors">
              Documentation
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-gray-900 font-bold tracking-tight mb-4 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Database className="w-4 h-4 text-blue-600" />
              Latest Datasets
            </h3>
            <div className="space-y-2">
              {isLoading ? (
                [1, 2].map(i => <div key={i} className="h-10 bg-gray-50 rounded-md" />)
              ) : (
                [1, 2].map(i => (
                  <div key={i} className="border border-gray-100 p-2.5 rounded-md flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                       <FileSpreadsheet className="w-4 h-4 text-gray-400" />
                       <span className="text-xs font-medium text-gray-700">Inspection_V{i}.csv</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}
