'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Mail, Lock, User, Building, Loader2, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    tenantName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.tenantName) {
      setError('All fields are required.');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid work email.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    
    try {
      console.log('Sending registration data:', { ...formData, password: '***' });
      await register(formData);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration error details:', err.response?.data || err);
      setError(err.response?.data?.message || 'Registration failed. This email or company name might already be registered.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(''); // Clear error on change
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 selection:bg-blue-100">
      {/* Logo & Branding */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center mb-4">
          <Activity className="text-white w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Create EVA Account</h1>
        <p className="text-gray-500 text-sm mt-0.5">Join the professional reliability network</p>
      </div>

      <div className="w-full max-w-xl">
        <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-sm">
          <div className="mb-6 pb-4 border-b border-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Get Started</h2>
            <p className="text-gray-500 text-sm mt-1">Provide your details to begin analysis</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white text-gray-900 pl-10 pr-4 py-2.5 rounded-md outline-none transition-colors placeholder:text-gray-400 text-sm font-medium"
                    placeholder="John"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white text-gray-900 pl-10 pr-4 py-2.5 rounded-md outline-none transition-colors placeholder:text-gray-400 text-sm font-medium"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">Company Name</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="tenantName"
                  required
                  value={formData.tenantName}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white text-gray-900 pl-10 pr-4 py-2.5 rounded-md outline-none transition-colors placeholder:text-gray-400 text-sm font-medium"
                  placeholder="Acme Global Inc."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white text-gray-900 pl-10 pr-4 py-2.5 rounded-md outline-none transition-colors placeholder:text-gray-400 text-sm font-medium"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">Create Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white text-gray-900 pl-10 pr-10 py-2.5 rounded-md outline-none transition-colors placeholder:text-gray-400 text-sm font-medium"
                  placeholder="Min. 8 characters"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group mt-4"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Register Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-xs">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 font-bold hover:underline ml-1">
                Sign In
              </Link>
            </p>
          </div>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-4 opacity-40">
           <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              Verified Partner
           </div>
        </div>
      </div>
    </div>

  );
}
