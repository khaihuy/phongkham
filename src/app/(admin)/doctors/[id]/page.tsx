'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Loader, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Thứ 2',
  TUESDAY: 'Thứ 3',
  WEDNESDAY: 'Thứ 4',
  THURSDAY: 'Thứ 5',
  FRIDAY: 'Thứ 6',
  SATURDAY: 'Thứ 7',
  SUNDAY: 'Chủ nhật',
};

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const emptyScheduleForm = {
  dayOfWeek: 'MONDAY',
  startTime: '08:00',
  endTime: '17:00',
  maxSlots: 20,
  isActive: true,
};

function fmtCur(v: any) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v) || 0);
}

export default function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [addModal, setAddModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ ...emptyScheduleForm });

  const { data: doctor, isLoading, error } = useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const r = await fetch(`/api/doctors/${id}`);
      if (!r.ok) throw new Error('Không tìm thấy bác sĩ');
      return (await r.json()).data;
    },
    enabled: !!id,
  });

  const createSchedule = useMutation({
    mutationFn: async (data: typeof scheduleForm) => {
      const r = await fetch(`/api/doctors/${id}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.error || 'Lỗi tạo lịch');
      }
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', id] });
      toast.success('Thêm ca làm việc thành công');
      setAddModal(false);
      setScheduleForm({ ...emptyScheduleForm });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleSchedule = useMutation({
    mutationFn: async ({ scheduleId, isActive }: { scheduleId: string; isActive: boolean }) => {
      const r = await fetch(`/api/doctors/${id}/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!r.ok) throw new Error('Lỗi cập nhật');
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', id] });
      toast.success('Cập nhật trạng thái thành công');
    },
    onError: () => toast.error('Cập nhật thất bại'),
  });

  const deleteSchedule = useMutation({
    mutationFn: async (scheduleId: string) => {
      const r = await fetch(`/api/doctors/${id}/schedules/${scheduleId}`, {
        method: 'DELETE',
      });
      if (!r.ok) throw new Error('Lỗi xóa');
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', id] });
      toast.success('Đã xóa ca làm việc');
    },
    onError: () => toast.error('Xóa thất bại'),
  });

  function handleAddSchedule(e: React.FormEvent) {
    e.preventDefault();
    createSchedule.mutate({ ...scheduleForm, maxSlots: Number(scheduleForm.maxSlots) });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <AlertCircle className="w-8 h-8 mr-2" />
        Không tìm thấy bác sĩ
      </div>
    );
  }

  const schedules: any[] = doctor.schedules ?? [];
  // Sort by day order
  const sortedSchedules = [...schedules].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Chi tiết bác sĩ</h1>
      </div>

      {/* Doctor info card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-bold text-xl flex-shrink-0">
            {doctor.user?.fullName?.charAt(0) ?? 'B'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {doctor.title && <span className="text-sky-600 mr-1">{doctor.title}</span>}
              {doctor.user?.fullName}
            </h2>
            <p className="text-gray-500">{doctor.specialty?.name}</p>
            {doctor.branch?.name && (
              <p className="text-sm text-gray-400">{doctor.branch.name}</p>
            )}
          </div>
          <span className="text-xs bg-sky-50 text-sky-700 px-2 py-1 rounded font-mono">
            {doctor.employeeCode}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Số giấy phép</p>
            <p className="font-medium text-gray-900">{doctor.licenseNo}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Kinh nghiệm</p>
            <p className="font-medium text-gray-900">{doctor.yearsOfExp} năm</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Giá khám</p>
            <p className="font-medium text-green-700">{fmtCur(doctor.consultFee)}</p>
          </div>
          {doctor.user?.email && (
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Email</p>
              <p className="font-medium text-gray-900">{doctor.user.email}</p>
            </div>
          )}
          {doctor.user?.phone && (
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Điện thoại</p>
              <p className="font-medium text-gray-900">{doctor.user.phone}</p>
            </div>
          )}
        </div>

        {doctor.bio && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-xs mb-1">Tiểu sử</p>
            <p className="text-sm text-gray-700">{doctor.bio}</p>
          </div>
        )}
      </div>

      {/* Schedule section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Lịch làm việc</h3>
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm ca làm việc
          </button>
        </div>

        {sortedSchedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <p>Chưa có lịch làm việc</p>
            <button
              onClick={() => setAddModal(true)}
              className="text-sky-600 hover:underline text-sm"
            >
              Thêm ca đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Ngày</th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-600">Giờ bắt đầu</th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-600">Giờ kết thúc</th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-600">Số slot tối đa</th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-600">Trạng thái</th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-600">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedSchedules.map((sched: any) => (
                  <tr key={sched.id} className={`transition-colors ${sched.isActive ? 'hover:bg-gray-50' : 'bg-gray-50 opacity-60'}`}>
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {DAY_LABELS[sched.dayOfWeek] ?? sched.dayOfWeek}
                    </td>
                    <td className="px-5 py-3 text-center font-mono text-gray-700">{sched.startTime}</td>
                    <td className="px-5 py-3 text-center font-mono text-gray-700">{sched.endTime}</td>
                    <td className="px-5 py-3 text-center text-gray-700">{sched.maxSlots}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => toggleSchedule.mutate({ scheduleId: sched.id, isActive: !sched.isActive })}
                        disabled={toggleSchedule.isPending}
                        className="flex items-center gap-1.5 mx-auto text-sm disabled:opacity-50"
                      >
                        {sched.isActive ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-green-600" />
                            <span className="text-green-700 font-medium">Hoạt động</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-500">Tắt</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm('Xóa ca làm việc này?')) {
                            deleteSchedule.mutate(sched.id);
                          }
                        }}
                        disabled={deleteSchedule.isPending}
                        className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Schedule Modal */}
      {addModal && (
        <Modal title="Thêm ca làm việc" open={true} onClose={() => setAddModal(false)}>
          <form onSubmit={handleAddSchedule} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày trong tuần <span className="text-red-500">*</span>
              </label>
              <select
                value={scheduleForm.dayOfWeek}
                onChange={(e) => setScheduleForm((f) => ({ ...f, dayOfWeek: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              >
                {DAY_ORDER.map((day) => (
                  <option key={day} value={day}>{DAY_LABELS[day]}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giờ bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={scheduleForm.startTime}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, startTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giờ kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={scheduleForm.endTime}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, endTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số slot tối đa</label>
              <input
                type="number"
                value={scheduleForm.maxSlots}
                onChange={(e) => setScheduleForm((f) => ({ ...f, maxSlots: parseInt(e.target.value) || 20 }))}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={scheduleForm.isActive}
                onChange={(e) => setScheduleForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Kích hoạt ngay
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={createSchedule.isPending}
                className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium disabled:bg-gray-400 transition-colors"
              >
                {createSchedule.isPending ? 'Đang lưu...' : 'Thêm ca làm việc'}
              </button>
              <button
                type="button"
                onClick={() => setAddModal(false)}
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
