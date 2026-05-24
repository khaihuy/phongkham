'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Save, MessageSquare, Mail, Phone, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'clinic_reminder_settings';

interface ReminderSettings {
  enabled: boolean;
  timings: string[];
  channels: string[];
  messageTemplate: string;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  timings: ['1h'],
  channels: ['SMS'],
  messageTemplate:
    'Xin chào {patient_name}, bạn có lịch hẹn với {doctor_name} vào lúc {time} ngày {date}. Vui lòng đến đúng giờ.',
};

const TIMING_OPTIONS = [
  { value: '1h', label: 'Nhắc trước 1 giờ' },
  { value: '2h', label: 'Nhắc trước 2 giờ' },
  { value: '1d', label: 'Nhắc trước 1 ngày' },
  { value: '2d', label: 'Nhắc trước 2 ngày' },
];

const CHANNEL_OPTIONS = [
  { value: 'SMS', label: 'SMS', icon: Phone },
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'ZALO', label: 'Zalo', icon: MessageSquare },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ gửi', color: 'bg-yellow-100 text-yellow-700' },
  SENT: { label: 'Đã gửi', color: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Thất bại', color: 'bg-red-100 text-red-700' },
};

const CHANNEL_LABELS: Record<string, string> = {
  SMS: 'SMS',
  EMAIL: 'Email',
  ZALO: 'Zalo',
};

function formatDatetime(dt: string) {
  return new Date(dt).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RemindersSettingsPage() {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const { data: remindersData, isLoading: remindersLoading } = useQuery({
    queryKey: ['reminders-recent'],
    queryFn: async () => {
      const r = await fetch('/api/reminders/recent');
      if (!r.ok) throw new Error('Không thể tải danh sách nhắc lịch');
      return (await r.json()).data as any[];
    },
  });

  const toggleTiming = (value: string) => {
    setSettings((prev) => ({
      ...prev,
      timings: prev.timings.includes(value)
        ? prev.timings.filter((t) => t !== value)
        : [...prev.timings, value],
    }));
  };

  const toggleChannel = (value: string) => {
    setSettings((prev) => ({
      ...prev,
      channels: prev.channels.includes(value)
        ? prev.channels.filter((c) => c !== value)
        : [...prev.channels, value],
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast.success('Đã lưu cài đặt nhắc lịch');
    } catch {
      toast.error('Không thể lưu cài đặt');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
          <Bell className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt nhắc lịch</h1>
          <p className="text-sm text-gray-500">Cấu hình tự động nhắc lịch hẹn cho bệnh nhân</p>
        </div>
      </div>

      {/* Config card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Bật nhắc lịch tự động</p>
            <p className="text-sm text-gray-500 mt-0.5">Tự động gửi thông báo trước lịch hẹn</p>
          </div>
          <button
            onClick={() => setSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              settings.enabled ? 'bg-sky-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <hr className="border-gray-100" />

        {/* Timing options */}
        <div>
          <p className="font-medium text-gray-900 mb-3">Thời điểm nhắc</p>
          <div className="grid grid-cols-2 gap-2">
            {TIMING_OPTIONS.map((opt) => {
              const checked = settings.timings.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    checked
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTiming(opt.value)}
                    className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                  />
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Channel options */}
        <div>
          <p className="font-medium text-gray-900 mb-3">Kênh gửi thông báo</p>
          <div className="flex gap-3">
            {CHANNEL_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const checked = settings.channels.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                    checked
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleChannel(opt.value)}
                    className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                  />
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Message template */}
        <div>
          <p className="font-medium text-gray-900 mb-1">Mẫu tin nhắn</p>
          <p className="text-xs text-gray-500 mb-3">
            Biến có thể dùng:{' '}
            {['{patient_name}', '{doctor_name}', '{date}', '{time}'].map((v) => (
              <code
                key={v}
                className="bg-gray-100 text-gray-700 px-1 py-0.5 rounded text-xs mr-1"
              >
                {v}
              </code>
            ))}
          </p>
          <textarea
            value={settings.messageTemplate}
            onChange={(e) => setSettings((prev) => ({ ...prev, messageTemplate: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none"
            placeholder="Xin chào {patient_name}..."
          />
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          Lưu cài đặt
        </button>
      </div>

      {/* Recent reminders table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Nhắc lịch gần đây</h2>
          <p className="text-xs text-gray-500 mt-0.5">20 nhắc lịch mới nhất</p>
        </div>

        {remindersLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !remindersData || remindersData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p className="text-sm">Chưa có nhắc lịch nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Bệnh nhân</th>
                  <th className="px-5 py-3 text-left">Lịch hẹn</th>
                  <th className="px-5 py-3 text-left">Kênh</th>
                  <th className="px-5 py-3 text-left">Thời gian gửi</th>
                  <th className="px-5 py-3 text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {remindersData.map((r: any) => {
                  const status = STATUS_LABELS[r.status] ?? { label: r.status, color: 'bg-gray-100 text-gray-700' };
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {r.appointment?.patient?.fullName ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {r.appointment
                          ? formatDatetime(r.appointment.scheduledDate)
                          : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full text-xs font-medium">
                          {CHANNEL_LABELS[r.channel] ?? r.channel}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {formatDatetime(r.scheduledAt)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {r.status === 'SENT' && <CheckCircle2 className="w-3 h-3" />}
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
