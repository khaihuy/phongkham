'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useDashboard } from '@/hooks/use-dashboard';
import { TrendingUp, FileText, Download, Loader, AlertCircle } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

function formatCurrency(v: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(v);
}

function formatFull(v: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
}

export default function ReportsPage() {
  const { data: dashboard, isLoading, error } = useDashboard();
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [tab, setTab] = useState<'revenue' | 'appointments'>('revenue');
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  useEffect(() => {
    async function fetchRevenue() {
      setLoadingRevenue(true);
      const dateFrom = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const dateTo = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      try {
        const res = await fetch(`/api/reports/revenue?dateFrom=${dateFrom}&dateTo=${dateTo}`);
        const json = await res.json();
        const rd = json.data?.data ?? [];
        setRevenueData(rd.map((d: any) => ({
          date: d.date.slice(5), // MM-DD
          'Đã thu': Number(d.paid),
          'Chờ thu': Number(d.pending),
        })));
        setSummary(json.data?.summary);
      } catch {
        // ignore
      } finally {
        setLoadingRevenue(false);
      }
    }
    fetchRevenue();
  }, []);

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
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          <Download className="w-4 h-4" /> Xuất Excel
        </button>
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
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-600" /> Doanh thu tháng {new Date().getMonth() + 1}
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
          ) : revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v: any) => formatFull(v)} />
                <Bar dataKey="Đã thu" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Chờ thu" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
