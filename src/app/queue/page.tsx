'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Loader, AlertCircle, RefreshCw, Users, Clock, Activity, CheckCircle, Heart, Thermometer, Weight, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-sky-100 text-sky-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  NO_SHOW: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ khám',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang khám',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Không đến',
};

const EMPTY_VITALS = {
  systolic: '',
  diastolic: '',
  heartRate: '',
  temperature: '',
  weight: '',
  height: '',
  spo2: '',
  notes: '',
};

function getTodayStr() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function formatTodayDisplay() {
  return new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatVitalSigns(vs: any) {
  if (!vs || !vs.systolic) return '—';
  const parts: string[] = [];
  if (vs.systolic && vs.diastolic) parts.push(`HA: ${vs.systolic}/${vs.diastolic}`);
  if (vs.heartRate) parts.push(`♥ ${vs.heartRate}`);
  return parts.join(' • ') || '—';
}

export default function QueuePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const today = getTodayStr();

  const [vitalModal, setVitalModal] = useState<any>(null);
  const [vitals, setVitals] = useState(EMPTY_VITALS);

  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['queue', today],
    queryFn: async () => {
      const params = new URLSearchParams({
        dateFrom: today,
        dateTo: today,
        pageSize: '100',
      });
      const r = await fetch(`/api/appointments?${params}`);
      if (!r.ok) throw new Error('Không thể tải danh sách');
      return (await r.json()) as { data: any[]; meta: any };
    },
    refetchInterval: 30000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const r = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error('Cập nhật thất bại');
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queue', today] });
      toast.success('Cập nhật trạng thái thành công');
    },
    onError: () => toast.error('Cập nhật thất bại'),
  });

  const saveVitalsAndCall = useMutation({
    mutationFn: async ({ id, vitalSigns }: { id: string; vitalSigns: Record<string, any> }) => {
      const r = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS', vitalSigns }),
      });
      if (!r.ok) throw new Error('Cập nhật thất bại');
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queue', today] });
      toast.success('Đã lưu sinh hiệu và gọi bệnh nhân vào');
      setVitalModal(null);
      setVitals(EMPTY_VITALS);
    },
    onError: () => toast.error('Cập nhật thất bại'),
  });

  function openVitalModal(apt: any) {
    setVitalModal(apt);
    setVitals(EMPTY_VITALS);
  }

  function closeVitalModal() {
    setVitalModal(null);
    setVitals(EMPTY_VITALS);
  }

  function handleSkipVitals() {
    if (!vitalModal) return;
    updateStatus.mutate({ id: vitalModal.id, status: 'IN_PROGRESS' });
    setVitalModal(null);
    setVitals(EMPTY_VITALS);
  }

  function handleSaveVitals() {
    if (!vitalModal) return;
    const vitalSigns: Record<string, any> = {};
    if (vitals.systolic) vitalSigns.systolic = Number(vitals.systolic);
    if (vitals.diastolic) vitalSigns.diastolic = Number(vitals.diastolic);
    if (vitals.heartRate) vitalSigns.heartRate = Number(vitals.heartRate);
    if (vitals.temperature) vitalSigns.temperature = Number(vitals.temperature);
    if (vitals.weight) vitalSigns.weight = Number(vitals.weight);
    if (vitals.height) vitalSigns.height = Number(vitals.height);
    if (vitals.spo2) vitalSigns.spo2 = Number(vitals.spo2);
    if (vitals.notes) vitalSigns.notes = vitals.notes;
    saveVitalsAndCall.mutate({ id: vitalModal.id, vitalSigns });
  }

  const appointments: any[] = data?.data ?? [];

  const sorted = [...appointments].sort((a, b) =>
    (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '')
  );

  const stats = {
    total: sorted.length,
    waiting: sorted.filter((a) => a.status === 'PENDING' || a.status === 'CONFIRMED').length,
    inProgress: sorted.filter((a) => a.status === 'IN_PROGRESS').length,
    completed: sorted.filter((a) => a.status === 'COMPLETED').length,
  };

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('vi-VN')
    : null;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <AlertCircle className="w-8 h-8 mr-2" />
        Lỗi tải dữ liệu hàng đợi
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Phòng chờ hôm nay</h1>
          <p className="text-gray-500 mt-1 capitalize">{formatTodayDisplay()}</p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Cập nhật lúc {lastUpdated} (tự động mỗi 30 giây)
            </p>
          )}
        </div>
        <Link
          href="/appointments"
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm lịch hẹn
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Users className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Tổng hôm nay</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Đang chờ</p>
            <p className="text-2xl font-bold text-amber-600">{stats.waiting}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-sky-100 rounded-lg">
            <Activity className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Đang khám</p>
            <p className="text-2xl font-bold text-sky-600">{stats.inProgress}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Hoàn thành</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
        </div>
      </div>

      {/* Queue list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-sky-600" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
            <Users className="w-12 h-12" />
            <p>Không có lịch hẹn nào hôm nay</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 w-12">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Bệnh nhân</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Bác sĩ</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Giờ hẹn</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Sinh hiệu</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Trạng thái</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((apt, index) => {
                  const isCompleted =
                    apt.status === 'COMPLETED' ||
                    apt.status === 'CANCELLED' ||
                    apt.status === 'NO_SHOW';
                  const isPending = apt.status === 'PENDING';
                  const isConfirmed = apt.status === 'CONFIRMED';
                  const isInProgress = apt.status === 'IN_PROGRESS';

                  const medRecordHref = apt.medicalRecordId
                    ? `/medical-records/${apt.medicalRecordId}`
                    : `/medical-records?appointmentId=${apt.id}`;

                  return (
                    <tr
                      key={apt.id}
                      className={`transition-colors ${isCompleted ? 'bg-gray-50 opacity-60' : 'hover:bg-sky-50'}`}
                    >
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            isCompleted ? 'bg-gray-200 text-gray-500' : 'bg-sky-100 text-sky-700'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`font-medium ${isCompleted ? 'text-gray-500' : 'text-gray-900'}`}>
                          {apt.patient?.fullName ?? 'N/A'}
                        </p>
                        {apt.patient?.patientCode && (
                          <p className="text-xs text-gray-400">{apt.patient.patientCode}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {apt.doctor?.user?.fullName ?? 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-gray-700">
                        {apt.scheduledTime ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500 font-mono">
                        {formatVitalSigns(apt.vitalSigns)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            STATUS_COLORS[apt.status] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {STATUS_LABELS[apt.status] ?? apt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {/* PENDING actions */}
                          {isPending && (
                            <>
                              <button
                                onClick={() =>
                                  updateStatus.mutate({ id: apt.id, status: 'CONFIRMED' })
                                }
                                disabled={updateStatus.isPending}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-medium disabled:opacity-50 transition-colors"
                              >
                                Xác nhận đến
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Đánh dấu bệnh nhân không đến?')) {
                                    updateStatus.mutate({ id: apt.id, status: 'NO_SHOW' });
                                  }
                                }}
                                disabled={updateStatus.isPending}
                                className="px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-xs rounded-lg font-medium disabled:opacity-50 transition-colors"
                              >
                                Không đến
                              </button>
                            </>
                          )}

                          {/* CONFIRMED actions */}
                          {isConfirmed && (
                            <>
                              <button
                                onClick={() => openVitalModal(apt)}
                                disabled={updateStatus.isPending || saveVitalsAndCall.isPending}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs rounded-lg font-medium disabled:opacity-50 transition-colors"
                              >
                                Gọi vào + Sinh hiệu
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Đánh dấu bệnh nhân không đến?')) {
                                    updateStatus.mutate({ id: apt.id, status: 'NO_SHOW' });
                                  }
                                }}
                                disabled={updateStatus.isPending}
                                className="px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-xs rounded-lg font-medium disabled:opacity-50 transition-colors"
                              >
                                Không đến
                              </button>
                            </>
                          )}

                          {/* IN_PROGRESS actions */}
                          {isInProgress && (
                            <>
                              <Link
                                href={medRecordHref}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg font-medium transition-colors"
                              >
                                Mở hồ sơ khám
                              </Link>
                              <button
                                onClick={() =>
                                  updateStatus.mutate({ id: apt.id, status: 'COMPLETED' })
                                }
                                disabled={updateStatus.isPending}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium disabled:opacity-50 transition-colors"
                              >
                                Hoàn thành
                              </button>
                            </>
                          )}

                          {/* COMPLETED / CANCELLED / NO_SHOW — billing link */}
                          {isCompleted && apt.invoice?.id && (
                            <Link
                              href={`/billing/${apt.invoice.id}`}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg font-medium transition-colors"
                            >
                              Xem hóa đơn
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vital Signs Modal */}
      <Modal
        open={!!vitalModal}
        onClose={closeVitalModal}
        title={`Sinh hiệu — ${vitalModal?.patient?.fullName ?? ''}`}
        size="lg"
        footer={
          <>
            <button
              onClick={handleSkipVitals}
              disabled={updateStatus.isPending || saveVitalsAndCall.isPending}
              className="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              Bỏ qua, gọi vào ngay
            </button>
            <button
              onClick={handleSaveVitals}
              disabled={updateStatus.isPending || saveVitalsAndCall.isPending}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              Lưu &amp; Gọi vào
            </button>
          </>
        }
      >
        <div className="grid grid-cols-3 gap-4">
          {/* Huyết áp tâm thu */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Huyết áp tâm thu (mmHg)
            </label>
            <input
              type="number"
              value={vitals.systolic}
              onChange={(e) => setVitals((v) => ({ ...v, systolic: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="120"
            />
          </div>

          {/* Huyết áp tâm trương */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Huyết áp tâm trương (mmHg)
            </label>
            <input
              type="number"
              value={vitals.diastolic}
              onChange={(e) => setVitals((v) => ({ ...v, diastolic: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="80"
            />
          </div>

          {/* Nhịp tim */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nhịp tim (bpm)
            </label>
            <input
              type="number"
              value={vitals.heartRate}
              onChange={(e) => setVitals((v) => ({ ...v, heartRate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="80"
            />
          </div>

          {/* Nhiệt độ */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nhiệt độ (°C)
            </label>
            <input
              type="number"
              step="0.1"
              value={vitals.temperature}
              onChange={(e) => setVitals((v) => ({ ...v, temperature: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="36.5"
            />
          </div>

          {/* Cân nặng */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Cân nặng (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={vitals.weight}
              onChange={(e) => setVitals((v) => ({ ...v, weight: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="60"
            />
          </div>

          {/* Chiều cao */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Chiều cao (cm)
            </label>
            <input
              type="number"
              value={vitals.height}
              onChange={(e) => setVitals((v) => ({ ...v, height: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="165"
            />
          </div>

          {/* SpO2 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              SpO₂ (%)
            </label>
            <input
              type="number"
              value={vitals.spo2}
              onChange={(e) => setVitals((v) => ({ ...v, spo2: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="98"
            />
          </div>

          {/* Ghi chú — span full row */}
          <div className="col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Ghi chú
            </label>
            <input
              type="text"
              value={vitals.notes}
              onChange={(e) => setVitals((v) => ({ ...v, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Ghi chú thêm về sinh hiệu..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
