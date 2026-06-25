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
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await dashboardApi.stats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const formatCurrency = (n: number) => {
    if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
    if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
    return "₹" + n;
  };

  return (
    <DashboardLayout title="Dashboard" subtitle="General overview of church activities and performance.">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">General overview of church activities and performance.</p>
        </div>
        <button onClick={fetchStats} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Members", value: stats?.total_members ?? 0, sub: `+${stats?.new_members_this_month ?? 0} this month`, color: "text-indigo-600", icon: Users },
          { label: "Families", value: stats?.total_families ?? 0, sub: `+${stats?.new_families_this_month ?? 0} new families`, color: "text-green-600", icon: Home },
          { label: "Monthly Giving", value: formatCurrency(stats?.monthly_giving ?? 0), sub: `+${stats?.giving_growth_percent ?? 0}% growth`, color: "text-blue-600", icon: TrendingUp },
          { label: "Avg Attendance", value: stats?.avg_attendance ?? 0, sub: "Last Sunday", color: "text-amber-600", icon: Calendar },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">{card.label}</p>
                <Icon size={18} className={card.color} />
              </div>
              <p className={"text-3xl font-bold " + card.color}>{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Upcoming events */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Upcoming Services & Events</h3>
          {stats?.upcoming_events?.length === 0 && <p className="text-gray-400 text-sm">No upcoming events</p>}
          <div className="space-y-3">
            {stats?.upcoming_events?.map((event: any) => (
              <div key={event.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">{event.title}</span>
                <span className="text-xs text-gray-500">
                  {new Date(event.start_datetime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })},&nbsp;
                  {new Date(event.start_datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Giving analytics */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Giving Analytics</h3>
          <div className="space-y-4">
            {stats?.funds?.map((fund: any) => (
              <div key={fund.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{fund.name}</span>
                  {fund.target > 0 && (
                    <span className="text-gray-500">₹{(fund.current/100).toFixed(0)}K / ₹{(fund.target/100).toFixed(0)}K</span>
                  )}
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: fund.target > 0 ? Math.min(100, (fund.current / fund.target) * 100) + "%" : "60%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}