'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Church, Eye, EyeOff, Hash, Mail } from 'lucide-react';

export default function FamilyLoginPage() {
  const [loginMode, setLoginMode] = useState<'familyid' | 'email'>('familyid');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/family-portal/login/', { identifier, password });
      localStorage.setItem('family_access_token', data.access);
      localStorage.setItem('family_refresh_token', data.refresh);
      localStorage.setItem('family_id', String(data.family_id));
      localStorage.setItem('family_code', data.family_code || '');
      localStorage.setItem('family_name', data.family_name);
      localStorage.setItem('family_user', JSON.stringify(data.user));
      router.push('/family/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = (mode: 'familyid' | 'email') => {
    setLoginMode(mode);
    setIdentifier('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #6d28d9 100%)' }}>

      {/* Blurred bg circles */}
      <div className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, white, transparent)' }} />
      <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, white, transparent)' }} />

      <div className="relative w-full max-w-md z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-18 h-18 mx-auto mb-4 relative">
            <div className="w-16 h-16 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
              <Church size={30} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Grace Church</h1>
          <p className="text-indigo-200 text-sm mt-1 font-medium">Family Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Card header */}
          <div className="px-8 pt-8 pb-0">
            <h2 className="text-xl font-bold text-gray-900">Sign In</h2>
            <p className="text-gray-500 text-sm mt-1 mb-5">Access your family account</p>

            {/* Login mode toggle */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
              <button type="button"
                onClick={() => handleModeSwitch('familyid')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  loginMode === 'familyid'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                <Hash size={15} />
                Family ID
              </button>
              <button type="button"
                onClick={() => handleModeSwitch('email')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  loginMode === 'email'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                <Mail size={15} />
                Email
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="px-8 pb-8 space-y-4">

            {/* Family ID or Email input */}
            {loginMode === 'familyid' ? (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Family ID
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Hash size={14} className="text-indigo-600" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value.toUpperCase())}
                    placeholder="FAM-0001"
                    maxLength={8}
                    className="w-full pl-14 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-300 font-mono text-base tracking-widest uppercase"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Your unique Family ID (e.g. FAM-0042) — sent to your registered email/phone
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Mail size={14} className="text-indigo-600" />
                  </div>
                  <input
                    type="email"
                    required
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="family@email.com"
                    className="w-full pl-14 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-300"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-14 pr-12 py-3 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-300"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg mt-2"
              style={{ background: loading ? '#6366f1' : 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : `Sign In with ${loginMode === 'familyid' ? 'Family ID' : 'Email'}`}
            </button>

            {/* Info box */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-700 space-y-1">
              <p className="font-bold text-indigo-800">How to find your credentials?</p>
              <p>Your <strong>Family ID</strong> and password were sent to your registered email and phone when your family was added to the system.</p>
              <p>Contact the church office if you need help.</p>
            </div>
          </form>

          {/* Footer link */}
          <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 text-center">
            <a href="/login" className="text-xs text-gray-400 hover:text-indigo-600 transition-colors font-medium">
              Church Staff? Admin Login →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}