'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Loader2, Bell, Search, HelpCircle } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Loading session...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 selection:bg-teal-100">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header - Glassmorphism & Refined */}
        <header className="h-16 border-b border-gray-200/60 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search datasets, analyses..."
                className="w-full pl-9 pr-4 py-1.5 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10 transition-all placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all cursor-pointer">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all relative cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-teal-600 rounded-full border-2 border-white" />
            </button>
            <div className="h-6 w-[1px] bg-gray-200 mx-1" />
            <div className="flex items-center gap-2.5 pl-2">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-600 to-teal-500 flex items-center justify-center text-white font-bold text-[10px] uppercase shadow-sm shadow-teal-600/20">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-gray-900 leading-none">{user?.firstName} {user?.lastName}</p>
                <p className="text-[9px] text-teal-600 font-bold uppercase tracking-wider mt-1">Enterprise</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>

  );
}
