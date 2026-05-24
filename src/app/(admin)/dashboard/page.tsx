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
  PlayCircle,
  CheckCircle2,
  Users2,
  Banknote,
  UserPlus,
  FlaskConical,
  Pill,
  ReceiptText,
  BarChart3,
  MonitorPlay,
  PackagePlus,
  FilePlus2,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

// ─── Doctor: today's appointments section ───────────────────────────────────

function DoctorTodaySection() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-today-appointments'],
    queryFn: async () => {
      const r = await fetch('/api/appointments/my-today');
      if (!r.ok) throw new Error('Failed');
      return (await r.json()).data as any[];
    },
    refetchInterval: 30000,
  });

  const handleAction = async (id: string, status: 'IN_PROGRESS' | 'COMPLETED') => {
    await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    // Invalidation would require queryClient — simple reload for now
    window.location.reload();
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-sky-50 to-white">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-sky-600" />
          <h3 className="font-semibold text-gray-900">Bệnh nhân của tôi hôm nay</h3>
          {data && (
            <span className="ml-1 px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
              {data.length}
            </span>
          )}
        </div>
        <Link href="/appointments" className="text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1">
          Xem tất cả <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-24">
          <div className="h-5 w-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="px-5 py-8 text-center text-gray-500 text-sm">
          Không có lịch hẹn nào hôm nay
        </div>
      ) : (
        <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
          {data.map((apt: any) => (
            <div key={apt.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{apt.patient.fullName}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-500">
                      {new Date(apt.scheduledDate).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {apt.room && (
                      <span className="text-xs text-gray-400">{apt.room.name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <AppointmentStatusBadge status={apt.status} />
                  {apt.status === 'PENDING' || apt.status === 'CONFIRMED' ? (
                    <button
                      onClick={() => handleAction(apt.id, 'IN_PROGRESS')}
                      className="flex items-center gap-1 px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium transition-colors"
                      title="Bắt đầu khám"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Bắt đầu
                    </button>
                  ) : apt.status === 'IN_PROGRESS' ? (
                    <button
                      onClick={() => handleAction(apt.id, 'COMPLETED')}
                      className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                      title="Hoàn thành"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Xong
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Receptionist: waiting room panel ───────────────────────────────────────

function ReceptionistWaitingPanel() {
  const { data } = useQuery({
    queryKey: ['waiting-room-count'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const [pendingRes, confirmedRes] = await Promise.all([
        fetch(`/api/appointments?status=PENDING&dateFrom=${today}&dateTo=${today}&pageSize=1`),
        fetch(`/api/appointments?status=CONFIRMED&dateFrom=${today}&dateTo=${today}&pageSize=1`),
      ]);
      const pending = await pendingRes.json();
      const confirmed = await confirmedRes.json();
      return (pending.meta?.total ?? 0) + (confirmed.meta?.total ?? 0);
    },
    refetchInterval: 30000,
  });

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Users2 className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Phòng chờ</h3>
          <p className="text-xs text-gray-500">Bệnh nhân đang chờ hôm nay</p>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-4xl font-bold text-gray-900">{data ?? '—'}</p>
        <Link
          href="/queue"
          className="flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700 font-medium"
        >
          Xem hàng đợi <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// ─── Accountant: today's collected panel ────────────────────────────────────

function AccountantTodayPanel() {
  const { data } = useQuery({
    queryKey: ['today-collected'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const r = await fetch(`/api/invoices?status=PAID&dateFrom=${today}&dateTo=${today}&pageSize=100`);
      if (!r.ok) return 0;
      const result = await r.json();
      const invoices: any[] = result.data ?? [];
      return invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.patientPays ?? inv.totalAmount ?? 0), 0);
    },
    refetchInterval: 30000,
  });

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Banknote className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Thu hôm nay</h3>
          <p className="text-xs text-gray-500">Tổng đã thu trong ngày</p>
        </div>
      </div>
      <p className="text-2xl font-bold text-emerald-700">
        {data !== undefined ? formatCurrency(data).replace('₫', 'đ') : '—'}
      </p>
    </div>
  );
}

// ─── Quick actions ───────────────────────────────────────────────────────────

type ShortcutItem = {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string; // tailwind bg + text class pair
};

const SHORTCUTS_BY_ROLE: Record<string, ShortcutItem[]> = {
  RECEPTIONIST: [
    { label: 'Đặt lịch hẹn', description: 'Tạo lịch mới cho bệnh nhân', href: '/appointments', icon: CalendarDays, color: 'bg-sky-100 text-sky-600' },
    { label: 'Thêm bệnh nhân', description: 'Đăng ký bệnh nhân mới', href: '/patients', icon: UserPlus, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Hàng đợi', description: 'Quản lý phòng chờ hôm nay', href: '/queue', icon: Users2, color: 'bg-amber-100 text-amber-600' },
    { label: 'Màn hình TV', description: 'Bảng gọi số bệnh nhân', href: '/queue/display', icon: MonitorPlay, color: 'bg-violet-100 text-violet-600' },
    { label: 'Tìm bệnh nhân', description: 'Tra cứu hồ sơ nhanh', href: '/patients', icon: Search, color: 'bg-gray-100 text-gray-600' },
    { label: 'Hóa đơn', description: 'Xem hóa đơn chưa thanh toán', href: '/billing', icon: ReceiptText, color: 'bg-red-100 text-red-600' },
  ],
  DOCTOR: [
    { label: 'Lịch hẹn hôm nay', description: 'Xem danh sách bệnh nhân', href: '/appointments', icon: CalendarDays, color: 'bg-sky-100 text-sky-600' },
    { label: 'Hồ sơ bệnh án', description: 'Mở hồ sơ và kê đơn', href: '/medical-records', icon: FilePlus2, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Kết quả XN', description: 'Xem kết quả xét nghiệm mới', href: '/medical-records', icon: FlaskConical, color: 'bg-amber-100 text-amber-600' },
    { label: 'Tìm bệnh nhân', description: 'Tra cứu lịch sử điều trị', href: '/patients', icon: Search, color: 'bg-gray-100 text-gray-600' },
  ],
  PHARMACIST: [
    { label: 'Phát thuốc', description: 'Xử lý đơn thuốc chờ', href: '/pharmacy', icon: Pill, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Nhập kho', description: 'Nhập lô thuốc mới', href: '/pharmacy', icon: PackagePlus, color: 'bg-sky-100 text-sky-600' },
    { label: 'Kiểm kho', description: 'Xem tồn kho & sắp hết hạn', href: '/pharmacy', icon: FlaskConical, color: 'bg-amber-100 text-amber-600' },
    { label: 'Đơn thuốc', description: 'Xem tất cả đơn thuốc', href: '/pharmacy', icon: ReceiptText, color: 'bg-violet-100 text-violet-600' },
  ],
  ACCOUNTANT: [
    { label: 'Tạo hóa đơn', description: 'Lập hóa đơn thanh toán', href: '/billing', icon: ReceiptText, color: 'bg-sky-100 text-sky-600' },
    { label: 'Công nợ', description: 'Hóa đơn chưa thanh toán', href: '/billing', icon: DollarSign, color: 'bg-red-100 text-red-600' },
    { label: 'Báo cáo', description: 'Thống kê doanh thu', href: '/reports', icon: BarChart3, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Bệnh nhân', description: 'Tra cứu hồ sơ', href: '/patients', icon: Users, color: 'bg-gray-100 text-gray-600' },
  ],
  ADMIN: [
    { label: 'Đặt lịch hẹn', description: 'Tạo lịch mới', href: '/appointments', icon: CalendarDays, color: 'bg-sky-100 text-sky-600' },
    { label: 'Thêm bệnh nhân', description: 'Đăng ký bệnh nhân mới', href: '/patients', icon: UserPlus, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Hàng đợi', description: 'Quản lý phòng chờ', href: '/queue', icon: Users2, color: 'bg-amber-100 text-amber-600' },
    { label: 'Hóa đơn', description: 'Quản lý thanh toán', href: '/billing', icon: ReceiptText, color: 'bg-red-100 text-red-600' },
    { label: 'Nhà thuốc', description: 'Kho & phát thuốc', href: '/pharmacy', icon: Pill, color: 'bg-violet-100 text-violet-600' },
    { label: 'Báo cáo', description: 'Thống kê tổng hợp', href: '/reports', icon: BarChart3, color: 'bg-gray-100 text-gray-600' },
  ],
};

function QuickActions({ role }: { role?: string }) {
  const shortcuts = SHORTCUTS_BY_ROLE[role ?? ''] ?? SHORTCUTS_BY_ROLE.ADMIN;
  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {shortcuts.map((s) => (
          <Link
            key={s.href + s.label}
            href={s.href}
            className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-sky-200 hover:shadow-sm transition-all text-center"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color} group-hover:scale-110 transition-transform`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 leading-tight">{s.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight hidden sm:block">{s.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Main dashboard ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: dashboardData, isLoading, error } = useDashboard();
  const { data: session } = useSession();
  const role = session?.user?.role as string | undefined;

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
      {/* ── Role-specific top sections ─────────────────────────────────── */}

      {role === 'DOCTOR' && (
        <DoctorTodaySection />
      )}

      {role === 'RECEPTIONIST' && (
        <ReceptionistWaitingPanel />
      )}

      {role === 'ACCOUNTANT' && (
        <AccountantTodayPanel />
      )}

      {/* ── Welcome ────────────────────────────────────────────────────── */}
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

      {/* ── Quick Actions ──────────────────────────────────────────────── */}
      <QuickActions role={role} />

      {/* ── Stats Grid ─────────────────────────────────────────────────── */}
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

      {/* ── Second row stats ───────────────────────────────────────────── */}
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

      {/* ── Today's Appointments + Unpaid Invoices ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
