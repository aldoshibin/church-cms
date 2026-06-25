'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, api } from '@/lib/api';
import { setTokens, saveUser } from '@/lib/auth';
import { Church, Eye, EyeOff, Shield, Home } from 'lucide-react';

export default function LoginPage() {
  const [tab, setTab] = useState<'admin' | 'family'>('admin');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState(''); // Family ID or email
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      setTokens(data.access, data.refresh);
      saveUser(data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const handleFamilyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
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
      setError(err.response?.data?.error || 'Invalid Family ID or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#4f46e5 100%)' }}>

      {/* Background circles */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl flex rounded-2xl overflow-hidden shadow-2xl">

        {/* Left panel */}
        <div className="hidden md:flex w-80 shrink-0 bg-gray-900 flex-col justify-between p-10">
          <div>
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
              <Church size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Grace Church</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Church Management System — manage members, finance, events and family portals.
            </p>
          </div>
          <div className="space-y-3 text-sm text-gray-500">
            {['Member & Family Management', 'Donations & Finance Tracking', 'Events & Attendance', 'Family Portal Access'].map(f => (
              <div key={f} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 bg-white p-10 flex flex-col justify-center">

          {/* Tab switcher */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-8">
            <button type="button" onClick={() => { setTab('admin'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === 'admin' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Shield size={15} />
              Admin / Staff
            </button>
            <button type="button" onClick={() => { setTab('family'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === 'family' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Home size={15} />
              Family Portal
            </button>
          </div>

          {/* Admin Login */}
          {tab === 'admin' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Admin Login</h2>
              <p className="text-gray-400 text-sm mb-6">Sign in to the church management dashboard</p>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email Address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="admin@church.com"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-300 pr-12" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</> : 'Sign In to Dashboard'}
                </button>
              </form>
              <div className="mt-4 p-3 bg-indigo-50 rounded-xl text-xs text-indigo-600">
                Demo: admin@church.com / admin123
              </div>
            </>
          )}

          {/* Family Portal Login */}
          {tab === 'family' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Family Portal</h2>
              <p className="text-gray-400 text-sm mb-6">Sign in using your Family ID or registered email</p>
              <form onSubmit={handleFamilyLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    Family ID or Email
                  </label>
                  <input type="text" required value={identifier} onChange={e => setIdentifier(e.target.value.toUpperCase().startsWith('FAM') ? e.target.value.toUpperCase() : e.target.value)}
                    placeholder="FAM-001  or  family@email.com"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-300 font-mono" />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Your Family ID was sent to your email when your family was registered (e.g. FAM-001)
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-300 pr-12" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</> : 'Sign In to Family Portal'}
                </button>
              </form>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                Your Family ID and password were emailed when your family was added. Contact the church office if you need help.
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}