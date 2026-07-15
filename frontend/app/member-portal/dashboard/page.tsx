'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  memberPortalApi, getMemberPortalId, getMemberPortalToken, clearMemberPortalSession
} from '@/lib/memberPortalApi';
import {
  LayoutDashboard, Home, DollarSign, Calendar, CheckCircle,
  LogOut, Mail, Phone, MapPin, TrendingUp, Heart, Clock,
  Users, Wallet, Menu, X
} from 'lucide-react';

const eventTypeColors: Record<string, string> = {
  service:     'bg-indigo-100 text-indigo-700',
  fellowship:  'bg-green-100 text-green-700',
  youth:       'bg-pink-100 text-pink-700',
  choir:       'bg-purple-100 text-purple-700',
  outreach:    'bg-amber-100 text-amber-700',
  bible_study: 'bg-blue-100 text-blue-700',
  other:       'bg-gray-100 text-gray-700',
};

const DAY_LABELS: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
  fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

const NAV = [
  { id: 'overview',   label: 'Overview',   icon: LayoutDashboard },
  { id: 'family',     label: 'My Family',  icon: Home },
  { id: 'donations',  label: 'Donations',  icon: DollarSign },
  { id: 'funds',      label: 'Fund Paid',  icon: Wallet },
  { id: 'attendance', label: 'Attendance', icon: CheckCircle },
  { id: 'events',     label: 'Events',     icon: Calendar },
];

const FUND_COLORS = [
  'bg-indigo-100 text-indigo-700', 'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',   'bg-pink-100 text-pink-700',
  'bg-blue-100 text-blue-700',     'bg-purple-100 text-purple-700',
];

export default function MemberPortalDashboard() {
  const [data,       setData]       = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop,  setIsDesktop]  = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!getMemberPortalToken()) { router.push('/login'); return; }
    const id = getMemberPortalId();
    if (!id) { router.push('/login'); return; }
    memberPortalApi.get(`/members/${id}/portal_dashboard/`)
      .then(r => setData(r.data))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));

    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close mobile sidebar when tab changes
  useEffect(() => { setMobileOpen(false); }, [tab]);

  const handleLogout = () => { clearMemberPortalSession(); router.push('/login'); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full animate-spin" style={{ borderWidth: 3, borderStyle: 'solid', borderColor: '#e0e7ff', borderTopColor: '#4f46e5' }} />
        <p className="text-sm text-gray-400">Loading your account...</p>
      </div>
    </div>
  );

  if (!data) return null;
  const { member, family, family_members, stats, recent_donations, fund_totals, recent_attendance, upcoming_events, giving_trend } = data;

  const sidebarW = isDesktop ? 256 : 0;

  /* ── Sidebar content (shared between mobile drawer & desktop) ── */
  const SidebarContent = () => (
    <div className="bg-gray-900 text-white flex flex-col h-full w-64">
      <div className="p-5 border-b border-gray-800">
        <h1 className="font-bold text-lg text-white">Grace Church</h1>
        <p className="text-gray-400 text-xs mt-0.5">Member Portal</p>
      </div>

      <div className="px-5 py-3 border-b border-gray-800 bg-gray-800/40">
        <p className="text-xs text-gray-500 mb-0.5">Logged in as</p>
        <p className="text-sm font-semibold text-white truncate">{member.name}</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map(item => {
          const Icon = item.icon;
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors text-left relative ${
                isActive ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              {isActive && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-orange-500" />}
              <Icon size={16} />
              <span className="flex-1">{item.label}</span>
              {item.id === 'family' && family_members.length > 0 && (
                <span className="text-xs opacity-60">{family_members.length}</span>
              )}
            </button>
          );
        })}
      </nav>

      <button onClick={handleLogout}
        className="flex items-center gap-3 px-5 py-3 text-sm text-gray-400 hover:text-white hover:bg-gray-800/60 border-t border-gray-800 transition-colors">
        <LogOut size={16} /> Logout
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Mobile sidebar drawer ── */}
      <div className={`fixed top-0 left-0 h-full z-50 lg:hidden transition-transform duration-300 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-8 right-0 w-9 h-9 flex items-center justify-center rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors shadow-lg"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Desktop sidebar ── */}
      <div className="hidden lg:block fixed top-0 left-0 h-screen w-64 z-30">
        <SidebarContent />
      </div>

      {/* ── Main content ── */}
      <div style={{ marginLeft: sidebarW, transition: 'margin-left 0.3s' }}>

        {/* Fixed header */}
        <header className="fixed top-0 right-0 z-20 bg-white border-b border-gray-200 flex items-center justify-between px-4"
          style={{ left: sidebarW, height: 56, transition: 'left 0.3s' }}>
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile hamburger */}
            {!isDesktop && (
              <button
                onClick={() => setMobileOpen(o => !o)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors shrink-0"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="font-semibold text-sm text-gray-800 truncate">
                {NAV.find(n => n.id === tab)?.label}
              </h2>
              <p className="text-xs text-gray-500 hidden sm:block truncate">{member.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {member.name?.[0] || 'M'}
            </div>
            <span className="text-sm text-gray-700 hidden sm:block truncate max-w-[100px]">{member.name}</span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ paddingTop: 56 }}>
          <div className="p-4 md:p-6">

            {/* OVERVIEW */}
            {tab === 'overview' && (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-6">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Welcome, {member.name}!</h1>
                    <p className="text-gray-500 text-sm mt-1">Here is your personal overview</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm text-gray-500">
                    {member.email && <span className="flex items-center gap-1"><Mail size={13} />{member.email}</span>}
                    {member.phone && <span className="flex items-center gap-1"><Phone size={13} />{member.phone}</span>}
                  </div>
                </div>

                {/* Stats — 2 col mobile, 4 col desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                  {[
                    { label: 'This Month',      value: `₹${Number(stats.monthly_giving).toLocaleString('en-IN')}`, icon: Heart,      color: 'text-green-600'  },
                    { label: 'Total Given',     value: `₹${Number(stats.total_giving).toLocaleString('en-IN')}`,   icon: DollarSign, color: 'text-blue-600'   },
                    { label: 'Donations',       value: stats.total_donations,                                        icon: TrendingUp, color: 'text-purple-600' },
                    { label: 'Events Attended', value: stats.events_attended,                                        icon: Calendar,   color: 'text-amber-600'  },
                  ].map(card => {
                    const Icon = card.icon;
                    return (
                      <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-500">{card.label}</p>
                          <Icon size={16} className={card.color} />
                        </div>
                        <p className={`text-xl md:text-3xl font-bold ${card.color}`}>{card.value}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Giving trend + Family — stacked on mobile, 2-col on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-800 mb-4">Giving Trend (6 months)</h3>
                    {giving_trend?.length > 0 ? (
                      <div className="flex items-end gap-1.5" style={{ height: 112 }}>
                        {giving_trend.map((t: any, i: number) => {
                          const max = Math.max(...giving_trend.map((x: any) => x.amount), 1);
                          const h = Math.max(4, Math.round((t.amount / max) * 100));
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 justify-end">
                              <span className="text-gray-400" style={{ fontSize: 8 }}>{t.amount > 0 ? `₹${(t.amount/1000).toFixed(0)}k` : ''}</span>
                              <div className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors" style={{ height: `${h}%`, minHeight: 4 }} />
                              <span className="text-gray-400" style={{ fontSize: 8 }}>{t.month}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : <p className="text-gray-400 text-sm text-center py-8">No giving data yet</p>}
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-800 mb-4">My Family</h3>
                    {family ? (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center"><Home size={14} /></div>
                            <span className="text-sm font-semibold text-gray-800 truncate">{family.name}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-gray-900 text-white rounded-lg text-xs font-bold font-mono">{family.family_id}</span>
                        </div>
                        <div className="space-y-2">
                          {family_members.slice(0, 4).map((fm: any) => (
                            <div key={fm.id} className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold">{fm.name[0]}</div>
                              <span className="text-sm text-gray-700 truncate">{fm.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : <p className="text-gray-400 text-sm">Not linked to a family yet</p>}
                  </div>
                </div>
              </>
            )}

            {/* MY FAMILY */}
            {tab === 'family' && (
              <>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">My Family</h1>
                <p className="text-gray-500 text-sm mb-5">Family members added by the church office</p>
                {family ? (
                  <>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0"><Home size={18} /></div>
                        <div>
                          <p className="font-semibold text-gray-900">{family.name}</p>
                          <p className="text-xs text-gray-400">{family_members.length + 1} member(s) total</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-gray-900 text-white rounded-lg text-sm font-bold font-mono tracking-widest">{family.family_id}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {family_members.map((fm: any) => (
                        <div key={fm.id} className="bg-white rounded-xl border border-gray-200 p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold shrink-0">{fm.name[0]}</div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{fm.name}</p>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${fm.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{fm.status}</span>
                            </div>
                          </div>
                          <div className="space-y-1.5 text-sm text-gray-600">
                            {fm.email && <div className="flex items-center gap-2 min-w-0"><Mail size={13} className="text-gray-400 shrink-0" /><span className="truncate">{fm.email}</span></div>}
                            {fm.phone && <div className="flex items-center gap-2"><Phone size={13} className="text-gray-400 shrink-0" />{fm.phone}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-16 text-gray-400">
                    <Home size={28} className="text-gray-200 mb-2" />
                    <p className="font-medium text-gray-500">Not linked to a family yet</p>
                  </div>
                )}
              </>
            )}

            {/* DONATIONS */}
            {tab === 'donations' && (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-6">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">My Donations</h1>
                    <p className="text-gray-500 text-sm mt-1">{recent_donations?.length || 0} records</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-right">
                    <p className="text-xs text-gray-500">Total Given</p>
                    <p className="text-xl font-bold text-green-600">₹{Number(stats.total_giving).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
                  {recent_donations?.length > 0 ? (
                    <table className="w-full min-w-[400px]">
                      <thead className="bg-gray-50">
                        <tr>{['Fund', 'Amount', 'Date', 'Method'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recent_donations.map((d: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">{d.fund}</td>
                            <td className="px-4 py-3 text-sm font-bold text-green-600">₹{Number(d.amount).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{d.date}</td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs capitalize">{d.method}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <div className="text-center py-16 text-gray-400"><DollarSign size={32} className="mx-auto text-gray-200 mb-2" /><p className="font-medium text-gray-500">No donations recorded yet</p></div>}
                </div>
              </>
            )}

            {/* FUND PAID */}
            {tab === 'funds' && (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-6">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Fund Paid</h1>
                    <p className="text-gray-500 text-sm mt-1">How much you've given to each fund</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-right">
                    <p className="text-xs text-gray-500">Total Across All Funds</p>
                    <p className="text-xl font-bold text-green-600">₹{Number(stats.total_giving).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                {fund_totals?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fund_totals.map((f: any, i: number) => {
                      const pct = stats.total_giving > 0 ? Math.round((f.total / stats.total_giving) * 100) : 0;
                      return (
                        <div key={f.fund_id ?? 'general'} className="bg-white rounded-xl border border-gray-200 p-5">
                          <div className="flex items-center justify-between mb-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${FUND_COLORS[i % FUND_COLORS.length]}`}>{f.fund_name}</span>
                            <Wallet size={16} className="text-gray-300" />
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mb-1">₹{f.total.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-gray-400 mb-3">{f.donation_count} donation{f.donation_count !== 1 ? 's' : ''}</p>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-xs text-gray-400 mt-1.5">{pct}% of your total giving</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-16 text-gray-400">
                    <Wallet size={32} className="text-gray-200 mb-2" />
                    <p className="font-medium text-gray-500">No fund donations recorded yet</p>
                  </div>
                )}
              </>
            )}

            {/* ATTENDANCE */}
            {tab === 'attendance' && (
              <>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">My Attendance</h1>
                <p className="text-gray-500 text-sm mb-5">{stats.events_attended} events attended</p>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
                  {recent_attendance?.length > 0 ? (
                    <table className="w-full min-w-[300px]">
                      <thead className="bg-gray-50">
                        <tr>{['Event', 'Date'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recent_attendance.map((a: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3"><div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500 shrink-0" /><span className="text-sm font-medium text-gray-800">{a.event}</span></div></td>
                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{a.date || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <div className="text-center py-16 text-gray-400"><Calendar size={32} className="mx-auto text-gray-200 mb-2" /><p className="font-medium text-gray-500">No attendance records yet</p></div>}
                </div>
              </>
            )}

            {/* EVENTS */}
            {tab === 'events' && (
              <>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">Upcoming Events</h1>
                <p className="text-gray-500 text-sm mb-5">{upcoming_events?.length || 0} upcoming</p>
                {upcoming_events?.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-16 text-gray-400">
                    <Calendar size={32} className="text-gray-200 mb-2" />
                    <p className="font-medium text-gray-500">No upcoming events</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcoming_events.map((ev: any) => {
                      const hasDays = !ev.date && Array.isArray(ev.days_of_week) && ev.days_of_week.length > 0;
                      return (
                        <div key={ev.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start gap-3">
                            {hasDays ? (
                              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex flex-col items-center justify-center shrink-0 gap-0.5 p-1">
                                {ev.days_of_week.map((d: string) => (
                                  <span key={d} className="text-xs font-bold text-indigo-600 leading-none">{DAY_LABELS[d] || d}</span>
                                ))}
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex flex-col items-center justify-center shrink-0">
                                <span className="text-lg font-bold text-indigo-600 leading-none">{ev.date?.split('-')[2]}</span>
                                <span className="text-xs text-indigo-400">{ev.date && new Date(ev.date + 'T00:00:00').toLocaleString('default', { month: 'short' })}</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">{ev.title}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize shrink-0 ${eventTypeColors[ev.type] || 'bg-gray-100 text-gray-600'}`}>{ev.type?.replace('_', ' ')}</span>
                              </div>
                              <div className="space-y-0.5 text-xs text-gray-500">
                                {ev.time && <div className="flex items-center gap-1"><Clock size={11} />{ev.time}</div>}
                                {ev.location && <div className="flex items-center gap-1"><MapPin size={11} />{ev.location}</div>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
