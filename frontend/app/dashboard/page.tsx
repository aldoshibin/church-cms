'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { dashboardApi } from '@/lib/api';
import { Users, Home, TrendingUp, Calendar, RefreshCw } from 'lucide-react';

interface Stats {
  total_members: number;
  new_members_this_month: number;
  total_families: number;
  new_families_this_month: number;
  monthly_giving: number;
  giving_growth_percent: number;
  avg_attendance: number;
  upcoming_events: any[];
  funds: any[];
}

export default function DashboardPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await dashboardApi.stats();
      setStats(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  const formatCurrency = (n: number) => {
    if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
    if (n >= 1000)   return '₹' + (n / 1000).toFixed(1) + 'K';
    return '₹' + n;
  };

  const cards = [
    { label: 'Total Members',  value: stats?.total_members ?? 0,     sub: `+${stats?.new_members_this_month ?? 0} this month`,   color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Users      },
    { label: 'Families',       value: stats?.total_families ?? 0,     sub: `+${stats?.new_families_this_month ?? 0} new families`, color: 'text-green-600',  bg: 'bg-green-50',  icon: Home       },
    { label: 'Monthly Giving', value: formatCurrency(stats?.monthly_giving ?? 0), sub: `+${stats?.giving_growth_percent ?? 0}% growth`, color: 'text-blue-600', bg: 'bg-blue-50', icon: TrendingUp },
    { label: 'Avg Attendance', value: stats?.avg_attendance ?? 0,     sub: 'Last Sunday',                                          color: 'text-amber-600',  bg: 'bg-amber-50',  icon: Calendar   },
  ];

  return (
    <DashboardLayout title="Dashboard" subtitle="General overview of church activities and performance.">

      {/* Page header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5 hidden sm:block">General overview of church activities and performance.</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 md:px-4 rounded-lg text-sm hover:bg-indigo-700 transition-colors shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stats cards — 2 col on mobile, 4 col on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs md:text-sm text-gray-500 leading-tight">{card.label}</p>
                <div className={`w-7 h-7 md:w-8 md:h-8 ${card.bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <Icon size={14} className={card.color} />
                </div>
              </div>
              <p className={`text-2xl md:text-3xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-400 mt-1 truncate">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Bottom section — stacked on mobile, 2-col on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

        {/* Upcoming events */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm md:text-base">Upcoming Services & Events</h3>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : !stats?.upcoming_events?.length ? (
            <p className="text-gray-400 text-sm text-center py-6">No upcoming events</p>
          ) : (
            <div className="space-y-2">
              {stats.upcoming_events.map((event: any) => (
                <div key={event.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 gap-2">
                  <span className="text-sm text-gray-700 truncate flex-1">{event.title}</span>
                  <span className="text-xs text-gray-500 shrink-0">
                    {new Date(event.start_datetime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Giving analytics */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm md:text-base">Giving Analytics</h3>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : !stats?.funds?.length ? (
            <p className="text-gray-400 text-sm text-center py-6">No fund data</p>
          ) : (
            <div className="space-y-3">
              {stats.funds.map((fund: any) => (
                <div key={fund.name}>
                  <div className="flex justify-between text-xs md:text-sm mb-1 gap-2">
                    <span className="text-gray-600 truncate flex-1">{fund.name}</span>
                    {fund.target > 0 && (
                      <span className="text-gray-400 shrink-0">
                        ₹{(fund.current / 1000).toFixed(0)}K / ₹{(fund.target / 1000).toFixed(0)}K
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full transition-all"
                      style={{ width: fund.target > 0 ? Math.min(100, (fund.current / fund.target) * 100) + '%' : '60%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
