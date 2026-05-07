'use client';

import { useState } from 'react';
import { useAppointments, useCreateAppointment, useUpdateAppointmentStatus } from '@/hooks/use-appointments';
import { useDoctors } from '@/hooks/use-doctors';
import { usePatients } from '@/hooks/use-patients';
import Modal from '@/components/ui/Modal';
import { AppointmentStatusBadge } from '@/components/ui/Badge';
import { Plus, Search, AlertCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';

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
};

type FormData = typeof emptyForm;

export default function AppointmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalMode, setModalMode] = useState<'add' | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const { data: appointmentsData, isLoading, error } = useAppointments(page, 10, {
    status: statusFilter || undefined,
  });
  const { data: patientsData } = usePatients(1, 100);
  const { data: doctorsData } = useDoctors(1, 100);
  const createAppointment = useCreateAppointment();
  const updateStatus = useUpdateAppointmentStatus(selectedAppointment?.id || '');

  const appointments = appointmentsData?.data || [];
  const meta = appointmentsData?.meta;
  const patients = patientsData?.data || [];
  const doctors = doctorsData?.data || [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await createAppointment.mutateAsync({
        ...form,
        scheduledDate: new Date(form.scheduledDate).toISOString(),
        duration: form.duration,
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
      await updateStatus.mutateAsync({
        status: newStatus,
      });
      toast.success('Cập nhật trạng thái thành công');
    } catch (err) {
      toast.error('Có lỗi xảy ra');
    }
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
                      <td className="px-6 py-4 flex items-center justify-center">
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
              onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            >
              <option value="">Chọn bác sĩ</option>
              {doctors.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.user.fullName}
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
