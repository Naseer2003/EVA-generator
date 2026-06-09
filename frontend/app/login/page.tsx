'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Validation
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 selection:bg-blue-100">
      {/* Logo & Branding */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center mb-4">
          <Activity className="text-white w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">EVA Engineering Portal</h1>
        <p className="text-gray-500 text-sm mt-0.5">Asset Integrity Analysis</p>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Sign In</h2>
            <p className="text-gray-500 text-sm">Access your reliability dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white text-gray-900 pl-10 pr-4 py-2.5 rounded-md outline-none transition-colors placeholder:text-gray-400 text-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Password</label>
                <Link href="#" className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-tight">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white text-gray-900 pl-10 pr-10 py-2.5 rounded-md outline-none transition-colors placeholder:text-gray-400 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-xs">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 font-bold hover:underline ml-1">
                Register
              </Link>
            </p>
          </div>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-4 opacity-40">
           <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure Portal
           </div>
        </div>
      </div>
    </div>

  );
}
