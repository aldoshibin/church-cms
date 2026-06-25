'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, api } from '@/lib/api';
import { setTokens, saveUser, getToken } from '@/lib/auth';
import { Eye, EyeOff } from 'lucide-react';

type Tab = 'admin' | 'family';

const inp = 'w-full bg-white text-gray-900 text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none transition-all placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

export default function LoginPage() {
  const [tab,        setTab]        = useState<Tab>('admin');
  const [email,      setEmail]      = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (getToken()) { router.replace('/dashboard'); return; }
    if (typeof window !== 'undefined' && localStorage.getItem('family_access_token')) {
      router.replace('/family/dashboard');
    }
  }, []);

  const switchTab = (t: Tab) => { setTab(t); setError(''); setPassword(''); };

  const handleAdmin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      setTokens(data.access, data.refresh);
      saveUser(data.user);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const handleFamily = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await api.post('/family-portal/login/', { identifier, password });
      localStorage.setItem('family_access_token', data.access);
      localStorage.setItem('family_refresh_token', data.refresh);
      localStorage.setItem('family_id',   String(data.family_id));
      localStorage.setItem('family_code', data.family_code || '');
      localStorage.setItem('family_name', data.family_name);
      localStorage.setItem('family_user', JSON.stringify(data.user));
      router.replace('/family/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid Family ID or password');
    } finally { setLoading(false); }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)' }}
    >
      <div className="w-full" style={{ maxWidth: 900 }}>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex" style={{ minHeight: 520 }}>

          {/* Left dark panel */}
          <div className="hidden md:flex flex-col justify-between p-10 text-white shrink-0" style={{ width: 340, background: '#111827' }}>
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                    <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-base leading-tight">Grace Church</p>
                  <p className="text-xs leading-tight" style={{ color: '#9ca3af' }}>Management System</p>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-3 leading-tight">
                {tab === 'admin' ? 'Admin Portal' : 'Family Portal'}
              </h2>
              <p className="text-sm leading-relaxed mb-8" style={{ color: '#9ca3af' }}>
                {tab === 'admin'
                  ? 'Manage church operations, members, finance, attendance, documents, reports, and communication.'
                  : 'View your family details, donations, attendance records, and upcoming church events.'}
              </p>
              {(() => {
                const items = tab === 'admin'
                  ? ['Members and families', 'Donations, pledges, and expenses', 'Events, attendance, and reports']
                  : ['Family member profiles', 'Giving history and donations', 'Attendance and event calendar'];
                return (
                  <ul className="space-y-3">
                    {items.map(item => (
                      <li key={item} className="flex items-center gap-2.5 text-sm" style={{ color: '#d1d5db' }}>
                        <span className="font-bold" style={{ color: '#818cf8' }}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
            <div className="text-xs" style={{ color: '#4b5563' }}>© 2026 Grace Church · All rights reserved</div>
          </div>

          {/* Right form panel */}
          <div className="flex-1 flex flex-col justify-center px-10 py-10">

            {/* Tab switcher — only 2 tabs */}
            <div className="flex mb-8 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              {(['admin', 'family'] as Tab[]).map(t => (
                <button key={t} type="button" onClick={() => switchTab(t)}
                  className={`flex-1 py-3 text-sm font-bold transition-all ${
                    tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-800'
                  }`}>
                  {t === 'admin' ? 'Admin / Staff' : 'Family Portal'}
                </button>
              ))}
            </div>

            {/* Admin form */}
            {tab === 'admin' && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Admin Login</h2>
                <p className="text-gray-400 text-sm mb-6">Login to access admin dashboard.</p>
                <form onSubmit={handleAdmin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Admin Email</label>
                    <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="admin@church.com" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} required value={password}
                        onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                        className={inp + ' pr-10'} />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg">{error}</div>}
                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {loading
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
                      : 'Login as Admin'}
                  </button>
                </form>
                <div className="mt-5 flex items-center gap-2 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-lg px-3 py-2.5 text-xs text-gray-600">
                  <span className="text-indigo-500 font-bold">Demo:</span> admin@church.com / admin123
                </div>
              </>
            )}

            {/* Family form */}
            {tab === 'family' && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Family Portal</h2>
                <p className="text-gray-400 text-sm mb-6">Sign in using your Family ID or email.</p>
                <form onSubmit={handleFamily} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Family ID or Email</label>
                    <input type="text" required autoFocus value={identifier}
                      onChange={e => {
                        const v = e.target.value;
                        setIdentifier(v.toUpperCase().startsWith('FAM') ? v.toUpperCase() : v);
                      }}
                      placeholder="FAM-001  or  family@email.com" className={inp + ' font-mono'} />
                    <p className="text-xs text-gray-400 mt-1.5">Your Family ID was emailed when your family was registered</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} required value={password}
                        onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                        className={inp + ' pr-10'} />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg">{error}</div>}
                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {loading
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
                      : 'Login to Family Portal'}
                  </button>
                </form>
                <div className="mt-5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 text-xs text-amber-700">
                  Anyone in your family can use these credentials. Once logged in, you can switch between family members to view individual details.
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
