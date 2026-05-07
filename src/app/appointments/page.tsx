'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppointments, useCreateAppointment, useUpdateAppointmentStatus } from '@/hooks/use-appointments';
import { useDoctors } from '@/hooks/use-doctors';
import { usePatients } from '@/hooks/use-patients';
import Modal from '@/components/ui/Modal';
import { AppointmentStatusBadge } from '@/components/ui/Badge';
import { Plus, Search, AlertCircle, Loader, List, Calendar, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, parseISO, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function formatDateTime(dateStr: string, timeStr: string): string {
  return `${formatDate(dateStr)} ${timeStr}`;
}

const emptyForm = {
  patientId: '',
  doctorId: '',
  branchId: '',
  type: 'GENERAL' as const,
  scheduledDate: '',
  scheduledTime: '',
  duration: 30,
  chiefComplaint: '',
  notes: '',
  serviceId: '',
};

type FormData = typeof emptyForm;

// Status color maps
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PENDING:     { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-300' },
  CONFIRMED:   { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300' },
  IN_PROGRESS: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  COMPLETED:   { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300' },
  CANCELLED:   { bg: 'bg-gray-100',   text: 'text-gray-500',   border: 'border-gray-300' },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ khám',
  CONFIRMED: 'Xác nhận',
  IN_PROGRESS: 'Đang khám',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Hủy',
};

// Generate time slots 07:00–18:00 every 30 min
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 7; h <= 17; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 18) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  slots.push('18:00');
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function slotMatchesAppointment(slotTime: string, aptTime: string, duration: number): boolean {
  const slotMin = timeToMinutes(slotTime);
  const aptMin = timeToMinutes(aptTime);
  return aptMin >= slotMin && aptMin < slotMin + 30;
}

interface PopoverProps {
  apt: any;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement>;
}

function AppointmentPopover({ apt, onClose, anchorRef }: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose, anchorRef]);

  const colors = STATUS_COLORS[apt.status] ?? STATUS_COLORS.PENDING;

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 left-0 top-full mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-3 text-xs space-y-1"
    >
      <p className="font-semibold text-gray-900 text-sm">{apt.patient?.fullName || 'N/A'}</p>
      <p className="text-gray-600">Bác sĩ: {apt.doctor?.user?.fullName || 'N/A'}</p>
      <p className="text-gray-600">Thời gian: {apt.scheduledTime} — {formatDate(apt.scheduledDate)}</p>
      <p className="text-gray-600">
        Trạng thái:{' '}
        <span className={`px-1.5 py-0.5 rounded font-medium ${colors.bg} ${colors.text}`}>
          {STATUS_LABELS[apt.status] ?? apt.status}
        </span>
      </p>
      {apt.chiefComplaint && (
        <p className="text-gray-600">Lý do: {apt.chiefComplaint}</p>
      )}
      <button onClick={onClose} className="mt-1 text-gray-400 hover:text-gray-600 text-xs underline">Đóng</button>
    </div>
  );
}

function CalendarAppointmentCard({ apt }: { apt: any }) {
  const [showPopover, setShowPopover] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const colors = STATUS_COLORS[apt.status] ?? STATUS_COLORS.PENDING;
  const patientName = apt.patient?.fullName || 'N/A';
  const doctorName = apt.doctor?.user?.fullName?.split(' ').slice(-1)[0] || 'N/A';

  return (
    <div ref={cardRef} className="relative">
      <div
        onClick={() => setShowPopover(v => !v)}
        className={`cursor-pointer rounded px-1 py-0.5 text-xs border leading-tight ${colors.bg} ${colors.text} ${colors.border}`}
      >
        <div className="font-medium truncate">{patientName}</div>
        <div className="opacity-75 truncate">BS. {doctorName}</div>
      </div>
      {showPopover && (
        <AppointmentPopover apt={apt} onClose={() => setShowPopover(false)} anchorRef={cardRef as React.RefObject<HTMLDivElement>} />
      )}
    </div>
  );
}

interface WeekViewProps {
  weekStart: Date;
  appointments: any[];
}

function WeekView({ weekStart, appointments }: WeekViewProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Build lookup: dateStr -> time -> apt[]
  const aptMap: Record<string, Record<string, any[]>> = {};
  for (const apt of appointments) {
    const dateKey = apt.scheduledDate?.slice(0, 10) ?? '';
    if (!aptMap[dateKey]) aptMap[dateKey] = {};
    const slot = apt.scheduledTime?.slice(0, 5) ?? '';
    // find which 30-min bucket this falls into
    for (const ts of TIME_SLOTS) {
      if (slotMatchesAppointment(ts, slot, apt.duration ?? 30)) {
        if (!aptMap[dateKey][ts]) aptMap[dateKey][ts] = [];
        aptMap[dateKey][ts].push(apt);
        break;
      }
    }
  }

  const DAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div className="overflow-auto">
      <table className="w-full text-xs border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-gray-50">
            <th className="w-16 px-2 py-2 border border-gray-200 text-gray-500 font-medium text-right">Giờ</th>
            {days.map((d, i) => {
              const isToday = isSameDay(d, new Date());
              return (
                <th key={i} className={`px-2 py-2 border border-gray-200 font-medium text-center ${isToday ? 'bg-sky-50 text-sky-700' : 'text-gray-700'}`}>
                  <div>{DAY_NAMES[i]}</div>
                  <div className={`text-lg font-bold ${isToday ? 'text-sky-600' : 'text-gray-900'}`}>
                    {format(d, 'd')}
                  </div>
                  <div className="text-gray-400 font-normal">{format(d, 'MM/yyyy')}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((slot) => (
            <tr key={slot} className="hover:bg-gray-50/50">
              <td className="px-2 py-1 border border-gray-100 text-gray-400 text-right align-top whitespace-nowrap">{slot}</td>
              {days.map((d, i) => {
                const dateKey = format(d, 'yyyy-MM-dd');
                const slotApts = aptMap[dateKey]?.[slot] ?? [];
                const isToday = isSameDay(d, new Date());
                return (
                  <td key={i} className={`px-1 py-1 border border-gray-100 align-top min-h-[36px] w-[calc(100%/7)] ${isToday ? 'bg-sky-50/30' : ''}`}>
                    <div className="space-y-0.5">
                      {slotApts.map((apt: any) => (
                        <CalendarAppointmentCard key={apt.id} apt={apt} />
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AppointmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalMode, setModalMode] = useState<'add' | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const dateFrom = format(currentWeekStart, 'yyyy-MM-dd');
  const dateTo = format(weekEnd, 'yyyy-MM-dd');

  const { data: appointmentsData, isLoading, error } = useAppointments(page, 10, {
    status: statusFilter || undefined,
  });

  // For calendar view: fetch all appointments for the week (no pagination limit needed — use large pageSize)
  const { data: calendarData, isLoading: calendarLoading } = useAppointments(1, 200, {
    dateFrom,
    dateTo,
  });

  const { data: patientsData } = usePatients(1, 100);
  const { data: doctorsData } = useDoctors(1, 100);
  const { data: kbServices } = useQuery({
    queryKey: ['services-kb'],
    queryFn: async () => {
      const r = await fetch('/api/services?pageSize=100');
      const j = await r.json();
      return (j.data ?? []).filter((s: any) => s.code?.startsWith('KB'));
    },
    staleTime: 5 * 60 * 1000,
  });
  const createAppointment = useCreateAppointment();
  const updateStatus = useUpdateAppointmentStatus(selectedAppointment?.id || '');

  const appointments = appointmentsData?.data || [];
  const meta = appointmentsData?.meta;
  const calendarAppointments = calendarData?.data || [];
  const patients = patientsData?.data || [];
  const doctors = doctorsData?.data || [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createAppointment.mutateAsync({
        ...form,
        scheduledDate: new Date(form.scheduledDate).toISOString(),
        duration: form.duration,
        serviceId: form.serviceId || undefined,
      } as any);
      toast.success('Thêm lịch hẹn thành công');
      setModalMode(null);
      setForm(emptyForm);
    } catch (err) {
      toast.error('Có lỗi xảy ra');
    }
  }

  function openAdd() {
    setForm(emptyForm);
    setSelectedAppointment(null);
    setModalMode('add');
  }

  async function handleStatusChange(appointmentId: string, newStatus: string) {
    try {
      setSelectedAppointment({ id: appointmentId });
      await updateStatus.mutateAsync({ status: newStatus });
      toast.success('Cập nhật trạng thái thành công');
    } catch (err) {
      toast.error('Có lỗi xảy ra');
    }
  }

  function goToday() {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>Lỗi khi tải dữ liệu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Lịch hẹn</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm lịch hẹn
        </button>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-sky-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <List className="w-4 h-4" />
            Danh sách
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
              viewMode === 'calendar'
                ? 'bg-sky-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Lịch tuần
          </button>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm lịch hẹn..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ khám</option>
              <option value="CONFIRMED">Xác nhận</option>
              <option value="IN_PROGRESS">Đang khám</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Hủy</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8 animate-spin text-sky-600" />
              </div>
            ) : appointments.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Mã</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Bệnh nhân</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Bác sĩ</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Ngày/Giờ</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Loại</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Trạng thái</th>
                        <th className="px-6 py-3 text-center font-semibold text-gray-700">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {appointments.map((apt: any) => (
                        <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{apt.appointmentCode}</td>
                          <td className="px-6 py-4 text-gray-900">{apt.patient?.fullName || 'N/A'}</td>
                          <td className="px-6 py-4 text-gray-600">{apt.doctor?.user?.fullName || 'N/A'}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {formatDateTime(apt.scheduledDate, apt.scheduledTime)}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {apt.type === 'GENERAL' && 'Khám tổng quát'}
                            {apt.type === 'SPECIALIST' && 'Khám chuyên khoa'}
                            {apt.type === 'FOLLOW_UP' && 'Tái khám'}
                            {apt.type === 'EMERGENCY' && 'Cấp cứu'}
                            {apt.type === 'TELEMEDICINE' && 'Khám online'}
                          </td>
                          <td className="px-6 py-4">
                            <AppointmentStatusBadge status={apt.status} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <select
                                value={apt.status}
                                onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                                className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                              >
                                <option value="PENDING">Chờ khám</option>
                                <option value="CONFIRMED">Xác nhận</option>
                                <option value="IN_PROGRESS">Đang khám</option>
                                <option value="COMPLETED">Hoàn thành</option>
                                <option value="CANCELLED">Hủy</option>
                              </select>
                              <Link
                                href={`/medical-records/new?appointmentId=${apt.id}&patientId=${apt.patientId}`}
                                title="Tạo hồ sơ khám"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {meta && meta.totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-sm text-gray-600">
                      Trang {meta.page} / {meta.totalPages} ({meta.total} lịch hẹn)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100"
                      >
                        Trước
                      </button>
                      <button
                        onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                        disabled={page === meta.totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">Không có lịch hẹn</div>
            )}
          </div>
        </>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
          {/* Week navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentWeekStart(w => subWeeks(w, 1))}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentWeekStart(w => addWeeks(w, 1))}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={goToday}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
              >
                Hôm nay
              </button>
            </div>
            <div className="text-sm font-medium text-gray-700">
              {format(currentWeekStart, 'd MMM', { locale: vi })} – {format(weekEnd, 'd MMM yyyy', { locale: vi })}
            </div>
            {calendarLoading && <Loader className="w-4 h-4 animate-spin text-sky-600" />}
          </div>

          <WeekView weekStart={currentWeekStart} appointments={calendarAppointments} />
        </div>
      )}

      {/* Add Modal */}
      {modalMode === 'add' && (
        <Modal title="Thêm lịch hẹn" open={true} onClose={() => setModalMode(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            >
              <option value="">Chọn bệnh nhân</option>
              {patients.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </select>
            <select
              value={form.doctorId}
              onChange={(e) => {
                const doc = doctors.find((d: any) => d.id === e.target.value);
                setForm({ ...form, doctorId: e.target.value, branchId: doc?.branchId ?? '' });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            >
              <option value="">Chọn bác sĩ</option>
              {doctors.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.user?.fullName ?? d.user?.username}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={form.scheduledDate}
              onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
            <input
              type="time"
              value={form.scheduledTime}
              onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
            <input
              type="number"
              placeholder="Thời lượng (phút)"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 30 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <textarea
              placeholder="Ghi chú"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              rows={3}
            />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Dịch vụ khám</label>
              <select
                value={form.serviceId}
                onChange={(e) => setForm(f => ({ ...f, serviceId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
              >
                <option value="">— Chọn dịch vụ (tuỳ chọn) —</option>
                {(kbServices ?? []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {new Intl.NumberFormat('vi-VN').format(Number(s.price))}đ
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createAppointment.isPending}
                className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {createAppointment.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
