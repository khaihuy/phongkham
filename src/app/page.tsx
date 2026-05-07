'use client';

import { useDashboard } from '@/hooks/use-dashboard';
import StatsCard from '@/components/ui/StatsCard';
import { AppointmentStatusBadge } from '@/components/ui/Badge';
import {
  Users,
  CalendarDays,
  DollarSign,
  CheckCircle,
  Clock,
  UserRound,
  ArrowRight,
  Stethoscope,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

export default function DashboardPage() {
  const { data: dashboardData, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>Lỗi khi tải dữ liệu bảng điều khiển</p>
        </div>
      </div>
    );
  }

  const { stats, recentAppointments, unpaidInvoices } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-sky-600 to-sky-800 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Chào mừng trở lại! 👋</h2>
            <p className="text-sky-200 text-sm mt-1">
              Hôm nay có <span className="font-semibold text-white">{stats.todayAppointmentsTotal} lịch hẹn</span> —{' '}
              {stats.todayAppointmentsCompleted} hoàn thành, {stats.todayAppointmentsInProgress} đang khám,{' '}
              {stats.todayAppointmentsPending} chờ khám
            </p>
          </div>
          <div className="hidden sm:flex w-16 h-16 bg-white/10 rounded-2xl items-center justify-center">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Tổng bệnh nhân"
          value={stats.totalPatients}
          subtitle="Đã đăng ký"
          icon={Users}
          color="blue"
          trend={{ value: `+${stats.newPatientsThisMonth}`, positive: true }}
        />
        <StatsCard
          title="Lịch hẹn hôm nay"
          value={stats.todayAppointmentsTotal}
          subtitle={`${stats.todayAppointmentsCompleted} hoàn thành`}
          icon={CalendarDays}
          color="green"
          trend={{ value: `${stats.appointmentsThisMonth}`, positive: true }}
        />
        <StatsCard
          title="Doanh thu tháng"
          value={formatCurrency(stats.monthRevenue).replace('₫', 'đ')}
          subtitle="Đã thu"
          icon={DollarSign}
          color="yellow"
        />
        <StatsCard
          title="Bác sĩ hoạt động"
          value={stats.activeDoctors}
          subtitle="đang làm việc"
          icon={UserRound}
          color="purple"
        />
      </div>

      {/* Second row stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats.todayAppointmentsPending}</p>
            <p className="text-sm text-gray-500">Chờ khám</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats.todayAppointmentsInProgress}</p>
            <p className="text-sm text-gray-500">Đang khám</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats.todayAppointmentsCompleted}</p>
            <p className="text-sm text-gray-500">Hoàn thành</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Lịch hẹn hôm nay</h3>
            <Link href="/appointments" className="text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {recentAppointments.length > 0 ? (
              recentAppointments.slice(0, 8).map((apt) => (
                <div key={apt.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{apt.patient.fullName}</p>
                      <p className="text-sm text-gray-500 truncate">Dr. {apt.doctor.user.fullName}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(apt.scheduledDate).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </p>
                    </div>
                    <AppointmentStatusBadge status={apt.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-gray-500">Không có lịch hẹn hôm nay</div>
            )}
          </div>
        </div>

        {/* Unpaid Invoices */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Hóa đơn chưa thanh toán</h3>
            <Link href="/billing" className="text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1">
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {unpaidInvoices.length > 0 ? (
              unpaidInvoices.map((inv) => (
                <div key={inv.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <p className="font-medium text-gray-900">{inv.invoiceCode}</p>
                    <p className="font-semibold text-red-600">{formatCurrency(inv.totalAmount)}</p>
                  </div>
                  <p className="text-xs text-gray-500">Mã: {inv.id}</p>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-gray-500">Không có hóa đơn chưa thanh toán</div>
            )}
          </div>
          {unpaidInvoices.length > 0 && (
            <div className="px-5 py-3 bg-red-50 border-t border-red-100">
              <p className="text-sm font-medium text-red-700">
                Tổng chưa thanh toán: {formatCurrency(stats.totalUnpaid)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
