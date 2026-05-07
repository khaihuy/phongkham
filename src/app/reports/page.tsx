'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboard } from '@/hooks/use-dashboard';
import { TrendingUp, FileText, Download, Loader, AlertCircle } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfDay, subMonths } from 'date-fns';
import * as XLSX from 'xlsx';

function formatCurrency(v: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(v);
}

function formatFull(v: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
}

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd');
}

function firstOfMonthStr() {
  return format(startOfMonth(new Date()), 'yyyy-MM-dd');
}

function firstOfLastMonthStr() {
  return format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');
}

function lastOfLastMonthStr() {
  return format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');
}

export default function ReportsPage() {
  const { data: dashboard, isLoading, error } = useDashboard();
  const [tab, setTab] = useState<'revenue' | 'appointments'>('revenue');

  // Date range state
  const [dateFrom, setDateFrom] = useState(firstOfMonthStr());
  const [dateTo, setDateTo] = useState(todayStr());
  // Applied range (triggers refetch)
  const [appliedFrom, setAppliedFrom] = useState(firstOfMonthStr());
  const [appliedTo, setAppliedTo] = useState(todayStr());

  function applyRange() {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
  }

  function setPreset(from: string, to: string) {
    setDateFrom(from);
    setDateTo(to);
    setAppliedFrom(from);
    setAppliedTo(to);
  }

  // Revenue query
  const { data: revenueResult, isLoading: loadingRevenue } = useQuery({
    queryKey: ['reports-revenue', appliedFrom, appliedTo],
    queryFn: async () => {
      const res = await fetch(`/api/reports/revenue?dateFrom=${appliedFrom}&dateTo=${appliedTo}`);
      const json = await res.json();
      return json;
    },
    enabled: !!appliedFrom && !!appliedTo,
  });

  const rawRevenueData: any[] = revenueResult?.data?.data ?? [];
  const summary = revenueResult?.data?.summary ?? null;

  const revenueChartData = rawRevenueData.map((d: any) => ({
    date: d.date.slice(5), // MM-DD
    'Đã thu': Number(d.paid),
    'Chờ thu': Number(d.pending),
    _raw: d,
  }));

  function exportExcel() {
    if (!rawRevenueData.length) return;

    const rows = rawRevenueData.map((d: any) => ({
      'Ngày': d.date,
      'Tổng tiền': Number(d.total ?? (Number(d.paid) + Number(d.pending))),
      'Đã thu': Number(d.paid),
      'Chờ thu': Number(d.pending),
      'Số hóa đơn': Number(d.invoiceCount ?? 0),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Doanh thu');
    XLSX.writeFile(wb, `bao-cao-doanh-thu-${appliedFrom}-${appliedTo}.xlsx`);
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader className="w-8 h-8 animate-spin text-sky-600" />
    </div>
  );

  if (error || !dashboard) return (
    <div className="flex items-center justify-center h-64 text-red-600">
      <AlertCircle className="w-8 h-8 mr-2" /> Lỗi tải dữ liệu
    </div>
  );

  const stats = dashboard.stats;
  const apptData = [
    { name: 'Hoàn thành', value: stats.todayAppointmentsCompleted, fill: '#22c55e' },
    { name: 'Chờ khám', value: stats.todayAppointmentsPending, fill: '#f59e0b' },
    { name: 'Đang khám', value: stats.todayAppointmentsInProgress, fill: '#3b82f6' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Báo cáo</h1>
        {revenueChartData.length > 0 && (
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 font-medium"
          >
            <Download className="w-4 h-4" /> Xuất Excel
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Doanh thu tháng</p>
          <p className="text-lg font-bold text-green-600">{formatFull(Number(stats.monthRevenue))}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Chờ thanh toán</p>
          <p className="text-lg font-bold text-amber-600">{formatFull(Number(stats.totalUnpaid))}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Lịch hẹn tháng</p>
          <p className="text-lg font-bold text-blue-600">{stats.appointmentsThisMonth}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Bệnh nhân mới</p>
          <p className="text-lg font-bold text-purple-600">{stats.newPatientsThisMonth}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setTab('revenue')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'revenue' ? 'border-sky-600 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Doanh thu
        </button>
        <button onClick={() => setTab('appointments')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'appointments' ? 'border-sky-600 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Lịch hẹn hôm nay
        </button>
      </div>

      {tab === 'revenue' && (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm space-y-4">
          {/* Date range picker */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Từ ngày</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Đến ngày</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>
            <button
              onClick={applyRange}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Áp dụng
            </button>
            {/* Presets */}
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setPreset(todayStr(), todayStr())}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
              >
                Hôm nay
              </button>
              <button
                onClick={() => setPreset(format(subDays(new Date(), 6), 'yyyy-MM-dd'), todayStr())}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
              >
                7 ngày
              </button>
              <button
                onClick={() => setPreset(firstOfMonthStr(), todayStr())}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
              >
                Tháng này
              </button>
              <button
                onClick={() => setPreset(firstOfLastMonthStr(), lastOfLastMonthStr())}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
              >
                Tháng trước
              </button>
            </div>
          </div>

          {/* Chart header */}
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              Doanh thu {appliedFrom} — {appliedTo}
            </h2>
            {summary && (
              <div className="text-sm text-gray-500">
                Tổng: <strong className="text-green-600">{formatFull(Number(summary.totalRevenue))}</strong>
                {' | '}{summary.totalInvoices} hóa đơn
              </div>
            )}
          </div>

          {loadingRevenue ? (
            <div className="flex items-center justify-center h-48">
              <Loader className="w-6 h-6 animate-spin text-sky-600" />
            </div>
          ) : revenueChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v: any) => formatFull(v)} />
                  <Bar dataKey="Đã thu" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Chờ thu" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              {/* Revenue table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Ngày</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">Tổng tiền</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">Đã thu</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">Chờ thu</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">Số hóa đơn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rawRevenueData.map((d: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-800">{d.date}</td>
                        <td className="px-4 py-2 text-right text-gray-800">
                          {formatFull(Number(d.total ?? (Number(d.paid) + Number(d.pending))))}
                        </td>
                        <td className="px-4 py-2 text-right text-green-600">{formatFull(Number(d.paid))}</td>
                        <td className="px-4 py-2 text-right text-amber-600">{formatFull(Number(d.pending))}</td>
                        <td className="px-4 py-2 text-right text-gray-600">{d.invoiceCount ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">Chưa có dữ liệu doanh thu</div>
          )}
        </div>
      )}

      {tab === 'appointments' && (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-600" /> Lịch hẹn hôm nay — {stats.todayAppointmentsTotal} tổng
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {apptData.map(a => (
              <div key={a.name} className="text-center p-4 rounded-xl" style={{ background: a.fill + '15' }}>
                <p className="text-3xl font-bold" style={{ color: a.fill }}>{a.value}</p>
                <p className="text-sm text-gray-600 mt-1">{a.name}</p>
              </div>
            ))}
          </div>

          {/* Recent appointments table */}
          <h3 className="text-sm font-medium text-gray-700 mb-3">Lịch hẹn gần đây</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Bệnh nhân</th>
                  <th className="pb-2 font-medium">Bác sĩ</th>
                  <th className="pb-2 font-medium">Ngày</th>
                  <th className="pb-2 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dashboard.recentAppointments.slice(0, 8).map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="py-2">{a.patient?.fullName}</td>
                    <td className="py-2 text-gray-500">{a.doctor?.user?.fullName}</td>
                    <td className="py-2 text-gray-500">{new Date(a.scheduledDate).toLocaleDateString('vi-VN')} {a.scheduledTime}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        a.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        a.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        a.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {a.status === 'COMPLETED' ? 'Hoàn thành' : a.status === 'PENDING' ? 'Chờ khám' :
                         a.status === 'IN_PROGRESS' ? 'Đang khám' : a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
