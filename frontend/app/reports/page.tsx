'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { donationsApi, membersApi, expensesApi } from '@/lib/api';
import {
  TrendingUp, Users, DollarSign, Calendar,
  Filter, RefreshCw, BarChart2, PieChart
} from 'lucide-react';

const fmt = (n: number) => '₹' + (n || 0).toLocaleString('en-IN');
const fmtK = (n: number) => n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : fmt(n);

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

const STATUS_COLORS: Record<string, string> = {
  active:      'bg-green-500',
  inactive:    'bg-gray-400',
  visitor:     'bg-amber-500',
  transferred: 'bg-blue-500',
  deceased:    'bg-red-400',
};

export default function ReportsPage() {
  // Filters
  const [filterType, setFilterType] = useState<'all' | 'month' | 'year'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear]   = useState(CURRENT_YEAR);

  // Data
  const [summary,     setSummary]     = useState<any>(null);
  const [memberStats, setMemberStats] = useState<any>(null);
  const [expStats,    setExpStats]    = useState<any>(null);
  const [loading,     setLoading]     = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterType === 'month') {
        const y = selectedYear;
        const m = selectedMonth;
        const lastDay = new Date(y, m, 0).getDate();
        params.date__gte = `${y}-${String(m).padStart(2,'0')}-01`;
        params.date__lte = `${y}-${String(m).padStart(2,'0')}-${lastDay}`;
      } else if (filterType === 'year') {
        params.date__gte = `${selectedYear}-01-01`;
        params.date__lte = `${selectedYear}-12-31`;
      }

      const [sumRes, memRes, expRes] = await Promise.all([
        donationsApi.summary(),
        membersApi.stats(),
        expensesApi.stats(params),
      ]);
      setSummary(sumRes.data);
      setMemberStats(memRes.data);
      setExpStats(expRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterType, selectedMonth, selectedYear]);

  // Filtered donation totals from summary
  const getFilteredTotal = () => {
    if (!summary) return 0;
    if (filterType === 'all') return summary.total_all_time;
    if (filterType === 'year') return summary.total_this_year;
    return summary.total_this_month;
  };

  const getFilteredLabel = () => {
    if (filterType === 'month') return `${MONTHS[selectedMonth - 1]} ${selectedYear}`;
    if (filterType === 'year') return `Year ${selectedYear}`;
    return 'All Time';
  };

  // Chart data — filter monthly_trend based on selection
  const getChartData = () => {
    if (!summary?.monthly_trend) return [];
    if (filterType === 'year') {
      return summary.monthly_trend.filter((m: any) => m.month.includes(String(selectedYear)));
    }
    return summary.monthly_trend;
  };

  const chartData = getChartData();
  const chartMax = Math.max(...chartData.map((m: any) => m.amount), 1);
  const hasChartData = chartData.some((m: any) => m.amount > 0);

  // Member totals
  const totalMembers = memberStats?.by_status?.reduce((a: number, s: any) => a + s.count, 0) || 0;

  return (
    <DashboardLayout title="Reports & Analytics" subtitle="Financial and membership reports">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Financial overview and membership statistics</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <Filter size={14} /> View by:
        </div>
        <div className="flex gap-2">
          {(['all', 'month', 'year'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                filterType === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === 'all' ? 'All Time' : t === 'month' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>

        {(filterType === 'month' || filterType === 'year') && (
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}

        {filterType === 'month' && (
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        )}

        <span className="ml-auto text-sm text-gray-400 italic">
          Showing: <span className="font-semibold text-gray-600">{getFilteredLabel()}</span>
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 sm:grid-cols-2 gap-4 mb-6">
        {[
          {
            label: 'Total Donations',
            value: fmt(getFilteredTotal()),
            sub: `${filterType === 'all' ? summary?.count_this_month || 0 : '—'} this month`,
            icon: DollarSign,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: 'Total Expenses',
            value: fmt(expStats?.all_time_total || 0),
            sub: `${expStats?.count || 0} records`,
            icon: TrendingUp,
            color: 'text-red-500',
            bg: 'bg-red-50',
          },
          {
            label: 'Total Members',
            value: totalMembers,
            sub: `${memberStats?.by_status?.find((s: any) => s.status === 'active')?.count || 0} active`,
            icon: Users,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
          },
          {
            label: 'Net Giving',
            value: fmt((getFilteredTotal()) - (expStats?.all_time_total || 0)),
            sub: 'Donations minus expenses',
            icon: BarChart2,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">{card.label}</p>
                <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center`}>
                  <Icon size={16} className={card.color} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Chart + Membership side by side */}
      <div className="grid grid-cols-3 sm:grid-cols-1  gap-5 mb-6">

        {/* Giving Trend Chart — takes 2/3 width */}
        <div className="col-span-2  bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-800">
              Giving Trend
              <span className="text-gray-400 font-normal text-sm ml-2">({getFilteredLabel()})</span>
            </h3>
            <BarChart2 size={16} className="text-gray-300" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center" style={{ height: 160 }}>
              <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : !hasChartData ? (
            <div className="flex flex-col items-center justify-center text-gray-400" style={{ height: 160 }}>
              <BarChart2 size={28} className="text-gray-200 mb-2" />
              <p className="text-sm">No donation data for this period</p>
            </div>
          ) : (
            <div className="flex items-end gap-1.5" style={{ height: 160 }}>
              {chartData.map((m: any, i: number) => {
                const barH = Math.max(6, Math.round((m.amount / chartMax) * 130));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                    {m.amount > 0 && (
                      <span className="text-gray-400 text-center w-full truncate" style={{ fontSize: '7px' }}>
                        {fmtK(m.amount)}
                      </span>
                    )}
                    <div
                      className={`w-full rounded-t transition-all ${
                        m.amount > 0 ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gray-100'
                      }`}
                      style={{ height: `${barH}px` }}
                      title={`${m.month}: ${fmt(m.amount)}`}
                    />
                    <span className="text-gray-400 text-center w-full truncate" style={{ fontSize: '7px' }}>
                      {m.month.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Membership Stats — takes 1/3 width */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-800">Membership</h3>
            <PieChart size={16} className="text-gray-300" />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : memberStats?.by_status?.length > 0 ? (
            <div className="space-y-3">
              {memberStats.by_status.map((s: any) => {
                const pct = totalMembers > 0 ? Math.round((s.count / totalMembers) * 100) : 0;
                return (
                  <div key={s.status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 capitalize">{s.status || 'Unknown'}</span>
                      <span className="font-semibold text-gray-800">{s.count} <span className="text-gray-400 font-normal text-xs">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${STATUS_COLORS[s.status] || 'bg-gray-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-gray-100 flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-gray-800">{totalMembers}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No member data</p>
          )}
        </div>
      </div>

      {/* Financial Detail */}
      <div className="grid grid-cols-2 sm:grid-cols-1 gap-5">

        {/* Donation Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Donation Summary</h3>
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : summary ? (
            <div className="space-y-3">
              {[
                { label: 'This Month',        value: fmt(summary.total_this_month),  color: 'text-green-600' },
                { label: 'This Year',         value: fmt(summary.total_this_year),   color: 'text-green-600' },
                { label: 'All Time',          value: fmt(summary.total_all_time),    color: 'text-green-700' },
                { label: 'Donations (Month)', value: summary.count_this_month,       color: 'text-gray-800'  },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="text-sm text-gray-500">{row.label}</span>
                  <span className={`font-semibold text-sm ${row.color}`}>{row.value}</span>
                </div>
              ))}

              {/* By payment method */}
              {summary.by_method?.length > 0 && (
                <>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-2">By Method</p>
                  {summary.by_method.map((m: any) => (
                    <div key={m.payment_method} className="flex justify-between items-center border-b border-gray-50 pb-2">
                      <span className="text-sm text-gray-500 capitalize">{m.payment_method || 'Unknown'}</span>
                      <div className="text-right">
                        <span className="font-semibold text-sm text-green-600">{fmt(m.total)}</span>
                        <span className="text-xs text-gray-400 ml-1">({m.count})</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No data available</p>
          )}
        </div>

        {/* Expense Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Expense Summary</h3>
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : expStats ? (
            <div className="space-y-3">
              {[
                { label: 'This Month',   value: fmt(expStats.this_month_total), color: 'text-red-500'  },
                { label: 'Selected Period', value: fmt(expStats.all_time_total),  color: 'text-red-500'  },
                { label: 'Total Records',   value: expStats.count,                color: 'text-gray-800' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="text-sm text-gray-500">{row.label}</span>
                  <span className={`font-semibold text-sm ${row.color}`}>{row.value}</span>
                </div>
              ))}

              {/* Net */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Net (Donations − Expenses)</span>
                  <span className={`font-bold text-sm ${
                    getFilteredTotal() - (expStats.all_time_total || 0) >= 0
                      ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {fmt(getFilteredTotal() - (expStats.all_time_total || 0))}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No data available</p>
          )}
        </div>
      </div>

    </DashboardLayout>
  );
}
