'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function QueueDisplayPage() {
  const today = getTodayStr();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data, dataUpdatedAt } = useQuery({
    queryKey: ['queue-display', today],
    queryFn: async () => {
      const r = await fetch(
        `/api/appointments?dateFrom=${today}&dateTo=${today}&pageSize=100`
      );
      if (!r.ok) return { data: [] };
      return r.json();
    },
    refetchInterval: 5000,
  });

  const appointments: any[] = data?.data ?? [];
  const inProgress = appointments.filter((a) => a.status === 'IN_PROGRESS');
  const waiting = appointments
    .filter((a) => a.status === 'PENDING' || a.status === 'CONFIRMED')
    .sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? ''));
  const completed = appointments.filter((a) => a.status === 'COMPLETED').length;

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('vi-VN')
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 text-white overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-white tracking-wide">
          Phòng Chờ Khám
        </h1>
        <div className="text-right">
          <p className="text-4xl font-mono text-emerald-400 font-bold">
            {now.toLocaleTimeString('vi-VN')}
          </p>
          <p className="text-gray-400 text-base capitalize mt-1">
            {now.toLocaleDateString('vi-VN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-700 rounded-2xl p-6 text-center">
          <p className="text-gray-300 text-lg font-medium mb-2">Tổng hôm nay</p>
          <p className="text-5xl font-bold text-white">{appointments.length}</p>
        </div>
        <div className="bg-amber-700 rounded-2xl p-6 text-center">
          <p className="text-amber-200 text-lg font-medium mb-2">Đang chờ</p>
          <p className="text-5xl font-bold text-white">{waiting.length}</p>
        </div>
        <div className="bg-emerald-700 rounded-2xl p-6 text-center">
          <p className="text-emerald-200 text-lg font-medium mb-2">Hoàn thành</p>
          <p className="text-5xl font-bold text-white">{completed}</p>
        </div>
      </div>

      {/* IN PROGRESS Section */}
      <div className="bg-gray-800 rounded-2xl p-6">
        <h2 className="text-3xl font-bold text-emerald-400 mb-4 flex items-center gap-3">
          <span className="inline-block w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          ĐANG KHÁM
        </h2>
        {inProgress.length === 0 ? (
          <p className="text-2xl text-gray-500 text-center py-8">
            Chưa có bệnh nhân đang khám
          </p>
        ) : (
          <div className="space-y-3">
            {inProgress.map((apt) => (
              <div
                key={apt.id}
                className="bg-emerald-800 rounded-2xl p-6 flex items-center justify-between"
              >
                <div>
                  <p className="text-4xl font-bold text-white">
                    {apt.patient?.fullName ?? 'N/A'}
                  </p>
                  {apt.patient?.patientCode && (
                    <p className="text-xl text-emerald-300 mt-1">
                      {apt.patient.patientCode}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl text-emerald-300 font-medium">
                    BS. {apt.doctor?.user?.fullName ?? 'N/A'}
                  </p>
                  {apt.scheduledTime && (
                    <p className="text-xl text-emerald-400 font-mono mt-1">
                      {apt.scheduledTime}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WAITING LIST Section */}
      <div className="bg-gray-800 rounded-2xl p-6">
        <h2 className="text-3xl font-bold text-amber-400 mb-4">HÀNG CHỜ</h2>
        {waiting.length === 0 ? (
          <p className="text-2xl text-gray-500 text-center py-8">
            Không có bệnh nhân nào đang chờ
          </p>
        ) : (
          <div className="space-y-2">
            {waiting.slice(0, 8).map((apt, index) => (
              <div
                key={apt.id}
                className={`rounded-xl p-4 flex items-center gap-4 ${
                  index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-800 border border-gray-700'
                }`}
              >
                {/* Queue number badge */}
                <div className="w-12 h-12 rounded-full bg-amber-500 text-black font-bold text-2xl flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </div>
                {/* Patient name */}
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-semibold text-white truncate">
                    {apt.patient?.fullName ?? 'N/A'}
                  </p>
                </div>
                {/* Scheduled time */}
                <div className="text-xl text-amber-400 font-mono flex-shrink-0">
                  {apt.scheduledTime ?? '—'}
                </div>
                {/* Doctor */}
                <div className="text-xl text-gray-400 flex-shrink-0 max-w-[240px] truncate">
                  BS. {apt.doctor?.user?.fullName ?? 'N/A'}
                </div>
              </div>
            ))}
            {waiting.length > 8 && (
              <p className="text-center text-gray-500 text-lg pt-2">
                ... và {waiting.length - 8} bệnh nhân khác đang chờ
              </p>
            )}
          </div>
        )}
      </div>

      {/* Empty state (shown only when no appointments at all) */}
      {appointments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <p className="text-3xl font-medium">Hiện chưa có lịch hẹn nào hôm nay</p>
        </div>
      )}

      {/* Bottom bar */}
      <div className="bg-gray-800 rounded-2xl p-4 flex items-center justify-between text-gray-400">
        <p className="text-lg font-medium text-gray-300">
          Phòng Khám — Vui lòng chờ đến lượt
        </p>
        <div className="flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
          <span>
            {lastUpdated ? `Cập nhật lúc ${lastUpdated}` : 'Đang tải...'}
            {' · '}Tự động làm mới mỗi 5 giây
          </span>
        </div>
      </div>
    </div>
  );
}
