'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Database, 
  BarChart3, 
  FileText, 
  Settings, 
  Activity, 
  LogOut,
  ChevronRight,
  PlusCircle,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: Database, label: 'Datasets', href: '/dashboard/datasets' },
  { icon: BarChart3, label: 'EVA Analysis', href: '/dashboard/analysis' },
  { icon: ShieldCheck, label: 'AD Testing', href: '/dashboard/ad-testing' },
  { icon: FileText, label: 'Reports', href: '/dashboard/reports' },
];

const secondaryItems = [
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-tr from-teal-600 to-teal-500 rounded-lg flex items-center justify-center shadow-md shadow-teal-600/10 group-hover:scale-105 transition-transform duration-200">
            <Activity className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">EVA <span className="text-teal-600">Portal</span></span>
        </Link>
      </div>

      <div className="flex-1 px-3 py-2 space-y-6 overflow-y-auto custom-scrollbar">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">Main Menu</p>
          <nav className="space-y-0.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-150 group/item",
                    isActive 
                      ? "bg-teal-50 text-teal-700" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-4 h-4 transition-colors duration-200", isActive ? "text-teal-600" : "text-gray-400 group-hover/item:text-gray-600")} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">Configuration</p>
          <nav className="space-y-0.5">
            {secondaryItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-2.5 rounded-lg transition-all duration-150 group/item",
                    isActive 
                      ? "bg-teal-50 text-teal-700" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn("w-4 h-4 mr-3 transition-colors duration-200", isActive ? "text-teal-600" : "text-gray-400 group-hover/item:text-gray-600")} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-600 ml-auto" />}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50/30">
        <div className="flex items-center gap-3 px-2.5 mb-4">
          <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-bold text-xs uppercase shadow-sm">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate leading-snug">{user?.firstName} {user?.lastName}</p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{user?.role}</p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>

  );
}
