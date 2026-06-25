'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { donationsApi, membersApi } from '@/lib/api';

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [memberStats, setMemberStats] = useState<any>(null);

  useEffect(() => {
    donationsApi.summary().then(r => setSummary(r.data)).catch(console.error);
    membersApi.stats().then(r => setMemberStats(r.data)).catch(console.error);
  }, []);

  const fmt = (n: number) => "₹" + (n || 0).toLocaleString('en-IN');

  return (
    <DashboardLayout title="Reports & Analytics" subtitle="Financial and membership reports">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports & Analytics</h1>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Financial summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Financial Summary</h3>
          {summary && (
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2"><span className="text-gray-600 text-sm">This Month</span><span className="font-semibold text-green-600">{fmt(summary.total_this_month)}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-600 text-sm">This Year</span><span className="font-semibold text-green-600">{fmt(summary.total_this_year)}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-600 text-sm">All Time</span><span className="font-semibold text-green-600">{fmt(summary.total_all_time)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 text-sm">Donations This Month</span><span className="font-semibold text-gray-800">{summary.count_this_month}</span></div>
            </div>
          )}
        </div>

        {/* Member stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Membership Stats</h3>
          {memberStats && (
            <div className="space-y-2">
              {memberStats.by_status?.map((s: any) => (
                <div key={s.status} className="flex justify-between border-b pb-2">
                  <span className="text-gray-600 text-sm capitalize">{s.status || 'Unknown'}</span>
                  <span className="font-semibold text-gray-800">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly trend */}
      {summary?.monthly_trend && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Monthly Giving Trend (12 months)</h3>
          <div className="flex items-end gap-1 h-32">
            {summary.monthly_trend.map((m: any, i: number) => {
              const max = Math.max(...summary.monthly_trend.map((x: any) => x.amount), 1);
              const h = Math.max(4, (m.amount / max) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors cursor-pointer" style={{ height: h + '%' }} title={fmt(m.amount)} />
                  <span className="text-xs text-gray-400 rotate-45 origin-left" style={{ fontSize: '9px' }}>{m.month.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}