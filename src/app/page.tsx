'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import StatsCard from '@/components/ui/StatsCard';
import { AppointmentStatusBadge } from '@/components/ui/Badge';
import {
  Users,
  CalendarDays,
  DollarSign,
  CheckCircle,
  Clock,
  UserRound,
  Plus,
  ArrowRight,
  TrendingUp,
  Stethoscope,
} from 'lucide-react';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export default function DashboardPage() {
  const { patients, appointments, invoices, doctors } = useStore();

  const todayStr = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const todayAppointments = appointments.filter((a) => a.date === todayStr);
    const completed = todayAppointments.filter((a) => a.status === 'hoàn thành').length;
    const pending = todayAppointments.filter((a) => a.status === 'chờ khám').length;
    const inProgress = todayAppointments.filter((a) => a.status === 'đang khám').length;

    const monthRevenue = invoices
      .filter((i) => i.paymentStatus === 'đã thanh toán' || i.paymentStatus === 'một phần')
      .reduce((sum, i) => sum + i.paidAmount, 0);

    const activeDoctors = doctors.filter((d) => d.status === 'active').length;

    return {
      totalPatients: patients.length,
      todayTotal: todayAppointments.length,
      completed,
      pending,
      inProgress,
      monthRevenue,
      activeDoctors,
    };
  }, [patients, appointments, invoices, doctors, todayStr]);

  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.date === todayStr).sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, todayStr]
  );

  const recentInvoices = useMemo(
    () => [...invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [invoices]
  );

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Chào mừng trở lại! 👋</h2>
            <p className="text-primary-200 text-sm mt-1">
              Hôm nay có <span className="font-semibold text-white">{stats.todayTotal} lịch hẹn</span> —{' '}
              {stats.completed} hoàn thành, {stats.inProgress} đang khám, {stats.pending} chờ khám
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
          trend={{ value: '12%', positive: true }}
        />
        <StatsCard
          title="Lịch hẹn hôm nay"
          value={stats.todayTotal}
          subtitle={`${stats.completed} hoàn thành`}
          icon={CalendarDays}
          color="green"
          trend={{ value: '8%', positive: true }}
        />
        <StatsCard
          title="Doanh thu tháng"
          value={formatCurrency(stats.monthRevenue).replace('₫', 'đ')}
          subtitle="Đã thu"
          icon={DollarSign}
          color="yellow"
          trend={{ value: '15%', positive: true }}
        />
        <StatsCard
          title="Bác sĩ hoạt động"
          value={stats.activeDoctors}
          subtitle={`/ ${doctors.length} bác sĩ`}
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
            <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
            <p className="text-sm text-gray-500">Chờ khám</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats.inProgress}</p>
            <p className="text-sm text-gray-500">Đang khám</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats.completed}</p>
            <p className="text-sm text-gray-500">Hoàn thành</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary-500" />
              Lịch hẹn hôm nay
            </h3>
            <Link
              href="/appointments"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {todayAppointments.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                Không có lịch hẹn nào hôm nay
              </div>
            ) : (
              todayAppointments.slice(0, 6).map((appt) => (
                <div key={appt.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 font-bold text-sm">{appt.time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{appt.patientName}</p>
                    <p className="text-xs text-gray-500 truncate">{appt.doctorName} · {appt.room}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <AppointmentStatusBadge status={appt.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions & Recent Invoices */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-3">Thao tác nhanh</h3>
            <div className="space-y-2">
              <Link
                href="/patients"
                className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors group"
              >
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-primary-700">Thêm bệnh nhân mới</span>
              </Link>
              <Link
                href="/appointments"
                className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group"
              >
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-emerald-700">Đặt lịch hẹn</span>
              </Link>
              <Link
                href="/medical-records"
                className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors group"
              >
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-purple-700">Tạo hồ sơ bệnh án</span>
              </Link>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm">Hóa đơn gần đây</h3>
              <Link href="/billing" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                Xem thêm
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-700 truncate">{inv.patientName}</p>
                    <p className="text-xs text-gray-400">{inv.code}</p>
                  </div>
                  <div className="ml-2 text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {formatCurrency(inv.total).replace('₫', 'đ')}
                    </p>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        inv.paymentStatus === 'đã thanh toán'
                          ? 'bg-emerald-100 text-emerald-700'
                          : inv.paymentStatus === 'một phần'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {inv.paymentStatus === 'đã thanh toán' ? 'Đã TT' : inv.paymentStatus === 'một phần' ? '1 phần' : 'Chưa TT'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
