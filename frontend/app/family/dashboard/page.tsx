'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { familyApi, getFamilyId, getFamilyToken, clearFamilySession } from '@/lib/familyApi';
import {
  LayoutDashboard, Users, DollarSign, Calendar, CheckCircle,
  LogOut, Church, Mail, Phone, MapPin, TrendingUp, Heart, Clock, ChevronDown
} from 'lucide-react';

const eventTypeColors: Record<string, string> = {
  service: 'bg-indigo-100 text-indigo-700', fellowship: 'bg-green-100 text-green-700',
  youth: 'bg-pink-100 text-pink-700', choir: 'bg-purple-100 text-purple-700',
  outreach: 'bg-amber-100 text-amber-700', bible_study: 'bg-blue-100 text-blue-700',
  other: 'bg-gray-100 text-gray-700',
};

const NAV = [
  { id: 'overview',   label: 'Overview',   icon: LayoutDashboard },
  { id: 'members',    label: 'Members',    icon: Users },
  { id: 'donations',  label: 'Donations',  icon: DollarSign },
  { id: 'attendance', label: 'Attendance', icon: CheckCircle },
  { id: 'events',     label: 'Events',     icon: Calendar },
];

export default function FamilyDashboard() {
  const [data,            setData]            = useState<any>(null);
  const [loading,         setLoading]         = useState(true);
  const [tab,             setTab]             = useState('overview');
  const [activeMemberId,  setActiveMemberId]  = useState<number | null>(null); // null = whole family view
  const [memberDetail,    setMemberDetail]    = useState<any>(null);
  const [memberLoading,   setMemberLoading]   = useState(false);
  const [switcherOpen,    setSwitcherOpen]    = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!getFamilyToken()) { router.push('/login'); return; }
    const id = getFamilyId();
    if (!id) { router.push('/login'); return; }
    familyApi.get(`/families/${id}/dashboard/`)
      .then(r => setData(r.data))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, []);

  // When activeMemberId changes, fetch that member's individual detail
  useEffect(() => {
    if (!activeMemberId) { setMemberDetail(null); return; }
    const familyId = getFamilyId();
    if (!familyId) return;
    setMemberLoading(true);
    familyApi.get(`/families/${familyId}/member-detail/${activeMemberId}/`)
      .then(r => setMemberDetail(r.data))
      .catch(() => setMemberDetail(null))
      .finally(() => setMemberLoading(false));
  }, [activeMemberId]);

  const handleLogout = () => { clearFamilySession(); router.push('/login'); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full animate-spin" style={{ borderWidth: 3, borderStyle: 'solid', borderColor: '#e0e7ff', borderTopColor: '#4f46e5' }} />
        <p className="text-sm text-gray-400">Loading your family dashboard...</p>
      </div>
    </div>
  );

  if (!data) return null;
  const { family, members, stats, recent_donations, recent_attendance, upcoming_events, giving_trend } = data;

  // Determine which dataset to show — whole family or one switched member
  const viewingMember   = activeMemberId ? members.find((m: any) => m.id === activeMemberId) : null;
  const displayStats    = activeMemberId && memberDetail ? memberDetail.stats : stats;
  const displayDonations= activeMemberId && memberDetail ? memberDetail.recent_donations : recent_donations;
  const displayAttendance = activeMemberId && memberDetail ? memberDetail.recent_attendance : recent_attendance;
  const displayTrend    = activeMemberId && memberDetail ? memberDetail.giving_trend : giving_trend;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-48 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0 z-30">
        <div className="p-4 border-b border-gray-700">
          <h1 className="font-bold text-base text-white">Grace Church</h1>
          <p className="text-gray-400 text-xs mt-0.5">Family Portal</p>
        </div>
        <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/60">
          <p className="text-xs text-gray-500 mb-1">Family</p>
          <p className="text-sm font-semibold text-white truncate">{family.name}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-600 text-white rounded text-xs font-bold tracking-widest font-mono">
            {family.family_id}
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map(item => {
            const Icon = item.icon;
            const isActive = tab === item.id;
            return (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors text-left ${
                  isActive ? 'text-white bg-indigo-600' : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}>
                <Icon size={14} />
                {item.label}
                {item.id === 'members' && <span className="ml-auto text-xs opacity-60">{members.length}</span>}
              </button>
            );
          })}
        </nav>
        <button onClick={handleLogout}
          className="flex items-center gap-2.5 px-4 py-3 text-xs text-gray-400 hover:text-white hover:bg-gray-800 border-t border-gray-700 transition-colors">
          <LogOut size={14} /> Logout
        </button>
      </div>

      <div className="ml-48">
        {/* Header with member switcher */}
        <header className="fixed top-0 left-48 right-0 h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20">
          <div>
            <h2 className="font-semibold text-sm text-gray-800">
              {NAV.find(n => n.id === tab)?.label}
              {viewingMember && <span className="text-indigo-500"> — {viewingMember.name}</span>}
            </h2>
            <p className="text-xs text-gray-500">{family.name} · {family.family_id}</p>
          </div>

          {/* Member switcher dropdown */}
          <div className="relative">
            <button
              onClick={() => setSwitcherOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {viewingMember ? viewingMember.name[0] : 'F'}
              </div>
              <span className="text-gray-700">{viewingMember ? viewingMember.name : 'Whole Family'}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {switcherOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-30">
                <button
                  onClick={() => { setActiveMemberId(null); setSwitcherOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${!activeMemberId ? 'bg-indigo-50' : ''}`}
                >
                  <div className="w-7 h-7 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold"><Users size={12} /></div>
                  <span className="font-medium text-gray-800">Whole Family</span>
                </button>
                <div className="border-t border-gray-100" />
                {members.map((m: any) => (
                  <button
                    key={m.id}
                    onClick={() => { setActiveMemberId(m.id); setSwitcherOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${activeMemberId === m.id ? 'bg-indigo-50' : ''}`}
                  >
                    <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{m.name[0]}</div>
                    <div>
                      <p className="font-medium text-gray-800">{m.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{m.status}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <main className="pt-16 p-6">

          {memberLoading && (
            <div className="flex items-center gap-2 text-gray-400 mb-4">
              <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
              <span className="text-sm">Loading {viewingMember?.name}'s details...</span>
            </div>
          )}

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {viewingMember ? `${viewingMember.name}'s Overview` : `Welcome, ${family.name}!`}
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                    {viewingMember ? 'Individual member statistics' : 'Your family overview for Grace Church'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {family.email && <span className="flex items-center gap-1"><Mail size={13} />{family.email}</span>}
                  {family.phone && <span className="flex items-center gap-1"><Phone size={13} />{family.phone}</span>}
                </div>
              </div>

              <div className={`grid ${activeMemberId ? 'grid-cols-4' : 'grid-cols-5'} gap-4 mb-6`}>
                {!activeMemberId && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-500">Total Members</p>
                      <Users size={18} className="text-indigo-600" />
                    </div>
                    <p className="text-3xl font-bold text-indigo-600">{stats.total_members}</p>
                  </div>
                )}
                {[
                  { label: 'This Month',     value: `₹${Number(displayStats.monthly_giving).toLocaleString('en-IN')}`, icon: Heart,      color: 'text-green-600' },
                  { label: 'Total Given',    value: `₹${Number(displayStats.total_giving).toLocaleString('en-IN')}`,   icon: DollarSign, color: 'text-blue-600'  },
                  { label: 'Donations',      value: displayStats.total_donations,                                       icon: TrendingUp, color: 'text-purple-600'},
                  { label: 'Attended',       value: displayStats.events_attended,                                       icon: Calendar,   color: 'text-amber-600' },
                ].map(card => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-500">{card.label}</p>
                        <Icon size={18} className={card.color} />
                      </div>
                      <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-800 mb-4">Giving Trend (6 months)</h3>
                  {displayTrend?.length > 0 ? (
                    <div className="flex items-end gap-1.5 h-28">
                      {displayTrend.map((t: any, i: number) => {
                        const max = Math.max(...displayTrend.map((x: any) => x.amount), 1);
                        const h = Math.max(4, (t.amount / max) * 100);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-gray-400" style={{ fontSize: 9 }}>{t.amount > 0 ? `₹${(t.amount / 1000).toFixed(0)}k` : ''}</span>
                            <div className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors" style={{ height: `${h}%`, minHeight: 4 }} />
                            <span className="text-gray-400" style={{ fontSize: 9 }}>{t.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : <p className="text-gray-400 text-sm text-center py-8">No giving data yet</p>}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-800 mb-4">Upcoming Services & Events</h3>
                  {upcoming_events?.length === 0
                    ? <p className="text-gray-400 text-sm">No upcoming events</p>
                    : (
                      <div className="space-y-3">
                        {upcoming_events?.slice(0, 5).map((ev: any) => (
                          <div key={ev.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${eventTypeColors[ev.type] || 'bg-gray-100 text-gray-600'}`}>
                                {ev.type?.replace('_', ' ')}
                              </span>
                              <span className="text-sm text-gray-700">{ev.title}</span>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}, {ev.time}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </>
          )}

          {/* MEMBERS */}
          {tab === 'members' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Family Members</h1>
                <p className="text-gray-500 text-sm mt-1">Click a member to view their individual details</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {members.map((m: any) => (
                  <button
                    key={m.id}
                    onClick={() => { setActiveMemberId(m.id); setTab('overview'); }}
                    className={`bg-white rounded-xl border p-5 text-left hover:shadow-sm transition-all ${
                      activeMemberId === m.id ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-lg font-bold">{m.name[0]}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{m.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {m.status}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm text-gray-600">
                      {m.email && <div className="flex items-center gap-2"><Mail size={13} className="text-gray-400" />{m.email}</div>}
                      {m.phone && <div className="flex items-center gap-2"><Phone size={13} className="text-gray-400" />{m.phone}</div>}
                      {m.membership_date && <div className="flex items-center gap-2"><Calendar size={13} className="text-gray-400" />Since {m.membership_date}</div>}
                    </div>
                    <p className="text-xs text-indigo-600 font-medium mt-3">View individual details →</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* DONATIONS */}
          {tab === 'donations' && (
            <>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {viewingMember ? `${viewingMember.name}'s Donations` : 'Family Donations'}
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">{displayDonations?.length || 0} records</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-right">
                  <p className="text-xs text-gray-500">Total Given</p>
                  <p className="text-xl font-bold text-green-600">₹{Number(displayStats.total_giving).toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {displayDonations?.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {(activeMemberId ? ['Fund', 'Amount', 'Date', 'Method'] : ['Member', 'Fund', 'Amount', 'Date', 'Method']).map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {displayDonations.map((d: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {!activeMemberId && <td className="px-4 py-3 text-sm font-medium text-gray-800">{d.member}</td>}
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

          {/* ATTENDANCE */}
          {tab === 'attendance' && (
            <>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {viewingMember ? `${viewingMember.name}'s Attendance` : 'Family Attendance'}
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">{displayStats.events_attended} events attended</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {displayAttendance?.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {(activeMemberId ? ['Event', 'Date'] : ['Event', 'Member', 'Date']).map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {displayAttendance.map((a: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3"><div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /><span className="text-sm font-medium text-gray-800">{a.event}</span></div></td>
                          {!activeMemberId && <td className="px-4 py-3 text-sm text-gray-600">{a.member}</td>}
                          <td className="px-4 py-3 text-sm text-gray-600">{a.date}</td>
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
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Upcoming Events</h1>
                <p className="text-gray-500 text-sm mt-1">{upcoming_events?.length || 0} upcoming events</p>
              </div>
              {upcoming_events?.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20 text-gray-400">
                  <Calendar size={32} className="text-gray-200 mb-2" />
                  <p className="font-medium text-gray-500">No upcoming events scheduled</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcoming_events.map((ev: any) => (
                    <div key={ev.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-indigo-50 rounded-xl flex flex-col items-center justify-center shrink-0">
                          <span className="text-xl font-bold text-indigo-600 leading-none">{ev.date?.split('-')[2]}</span>
                          <span className="text-xs text-indigo-400">{new Date(ev.date + 'T00:00:00').toLocaleString('default', { month: 'short' })}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{ev.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize shrink-0 ${eventTypeColors[ev.type] || 'bg-gray-100 text-gray-600'}`}>{ev.type?.replace('_', ' ')}</span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-500">
                            <div className="flex items-center gap-1.5"><Clock size={13} />{ev.time}</div>
                            {ev.location && <div className="flex items-center gap-1.5"><MapPin size={13} />{ev.location}</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </main>
      </div>
    </div>
  );
}
