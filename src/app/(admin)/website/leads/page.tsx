'use client';

import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader, Phone, ExternalLink, Check, X, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700' },
  CONFIRMED: { label: 'Đã xác nhận', cls: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'Đang khám', cls: 'bg-purple-100 text-purple-700' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-gray-100 text-gray-500' },
};

function fmtDate(d: string) {
  const x = new Date(d);
  return `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}/${x.getFullYear()}`;
}

export default function LeadsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['online-leads', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ source: 'ONLINE', pageSize: '50' });
      if (statusFilter) params.set('status', statusFilter);
      const r = await fetch(`/api/appointments?${params}`);
      return await r.json();
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const r = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.error ?? 'Cập nhật thất bại');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['online-leads'] });
      toast.success('Đã cập nhật');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const appointments = data?.data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-gray-500">
          <Link href="/website" className="hover:text-gray-700">Quản lý Website</Link> /{' '}
          <span className="text-gray-700">Lead đặt lịch online</span>
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Đặt lịch online qua website</h1>
        <p className="text-sm text-gray-500 mt-1">
          Khách hàng đặt lịch qua trang <Link href="/dat-lich" target="_blank" className="text-sky-700 hover:underline">/dat-lich</Link> ·
          Lễ tân gọi xác nhận
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { val: '', label: 'Tất cả' },
          { val: 'PENDING', label: 'Chờ xác nhận' },
          { val: 'CONFIRMED', label: 'Đã xác nhận' },
          { val: 'COMPLETED', label: 'Hoàn thành' },
          { val: 'CANCELLED', label: 'Đã hủy' },
        ].map((opt) => (
          <button
            key={opt.val}
            onClick={() => setStatusFilter(opt.val)}
            className={`px-3 py-1.5 text-sm rounded-full font-medium border ${
              statusFilter === opt.val
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin text-sky-600" /></div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto opacity-30 mb-2" />
            <p>Chưa có lead nào</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500 font-medium">
                <th className="px-4 py-2">Mã</th>
                <th className="px-4 py-2">Bệnh nhân</th>
                <th className="px-4 py-2">SĐT</th>
                <th className="px-4 py-2">Bác sĩ</th>
                <th className="px-4 py-2">Hẹn lúc</th>
                <th className="px-4 py-2">Lý do</th>
                <th className="px-4 py-2">Trạng thái</th>
                <th className="px-4 py-2 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-sky-700">
                    <Link href={`/appointments`} className="hover:underline">{a.appointmentCode}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{a.patient?.fullName}</p>
                    <p className="text-xs text-gray-400 font-mono">{a.patient?.patientCode}</p>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`tel:${a.patient?.phone}`} className="text-sky-700 hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {a.patient?.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.doctor?.user?.fullName ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {fmtDate(a.scheduledDate)} <strong>{a.scheduledTime}</strong>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{a.chiefComplaint ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[a.status]?.cls}`}>
                      {STATUS_BADGE[a.status]?.label ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {a.status === 'PENDING' && (
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => updateStatus.mutate({ id: a.id, status: 'CONFIRMED' })}
                          className="p-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded"
                          title="Xác nhận"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Hủy lịch hẹn này?')) updateStatus.mutate({ id: a.id, status: 'CANCELLED' });
                          }}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded"
                          title="Hủy"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
