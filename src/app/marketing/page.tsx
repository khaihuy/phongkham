'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import { Plus, Edit2, PlayCircle, XCircle, FileText, Loader, AlertCircle, Megaphone, Info, BellRing } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────

type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
type NotificationChannel = 'SMS' | 'EMAIL' | 'ZALO';

interface Campaign {
  id: string;
  name: string;
  channel: NotificationChannel;
  status: CampaignStatus;
  message: string;
  scheduledAt: string | null;
  totalSent: number;
  totalFailed: number;
  sentAt: string | null;
  createdAt: string;
  _count?: { logs: number };
}

interface ApiMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

// ─── Helpers ─────────────────────────────────────────────

function getStatusColor(status: CampaignStatus) {
  switch (status) {
    case 'DRAFT':     return 'bg-gray-100 text-gray-600';
    case 'SCHEDULED': return 'bg-blue-100 text-blue-700';
    case 'RUNNING':   return 'bg-green-100 text-green-700';
    case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
    case 'CANCELLED': return 'bg-red-100 text-red-600';
    default:          return 'bg-gray-100 text-gray-600';
  }
}

function getStatusLabel(status: CampaignStatus) {
  const labels: Record<CampaignStatus, string> = {
    DRAFT: 'Nháp',
    SCHEDULED: 'Đã lên lịch',
    RUNNING: 'Đang chạy',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };
  return labels[status] ?? status;
}

function getChannelLabel(channel: NotificationChannel) {
  const labels: Record<NotificationChannel, string> = {
    SMS: 'SMS',
    EMAIL: 'Email',
    ZALO: 'Zalo',
  };
  return labels[channel] ?? channel;
}

function getChannelColor(channel: NotificationChannel) {
  switch (channel) {
    case 'SMS':   return 'bg-orange-100 text-orange-700';
    case 'EMAIL': return 'bg-sky-100 text-sky-700';
    case 'ZALO':  return 'bg-blue-100 text-blue-800';
    default:      return 'bg-gray-100 text-gray-600';
  }
}

function formatDateTime(dt: string | null) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── API Hooks ────────────────────────────────────────────

function useCampaigns(page: number, statusFilter: string, channelFilter: string) {
  return useQuery<ApiResponse<Campaign[]>>({
    queryKey: ['campaigns', page, statusFilter, channelFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '10' });
      if (statusFilter) params.set('status', statusFilter);
      if (channelFilter) params.set('channel', channelFilter);
      const res = await fetch(`/api/campaigns?${params}`);
      if (!res.ok) throw new Error('Lỗi tải dữ liệu');
      return res.json();
    },
  });
}

function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Tạo chiến dịch thất bại');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

function useUpdateCampaign(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Cập nhật thất bại');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

function usePatchCampaign(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (action: 'launch' | 'cancel') => {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Thao tác thất bại');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

// ─── Campaign Form Modal ──────────────────────────────────

interface CampaignFormProps {
  open: boolean;
  onClose: () => void;
  campaign?: Campaign | null;
}

function CampaignFormModal({ open, onClose, campaign }: CampaignFormProps) {
  const isEdit = !!campaign;
  const [form, setForm] = useState({
    name: campaign?.name ?? '',
    description: '',
    channel: (campaign?.channel ?? 'SMS') as NotificationChannel,
    message: campaign?.message ?? '',
    scheduledAt: campaign?.scheduledAt
      ? new Date(campaign.scheduledAt).toISOString().slice(0, 16)
      : '',
  });

  const createMutation = useCreateCampaign();
  const updateMutation = useUpdateCampaign(campaign?.id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        channel: form.channel,
        message: form.message,
        scheduledAt: form.scheduledAt || null,
      };
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        toast.success('Cập nhật chiến dịch thành công');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Tạo chiến dịch thành công');
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Có lỗi xảy ra');
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa chiến dịch' : 'Tạo chiến dịch mới'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên chiến dịch *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className={inputCls}
            placeholder="VD: Khuyến mãi tháng 6"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
          <input
            type="text"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className={inputCls}
            placeholder="Mô tả ngắn về chiến dịch (không bắt buộc)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kênh gửi *</label>
          <select
            value={form.channel}
            onChange={e => setForm(f => ({ ...f, channel: e.target.value as NotificationChannel }))}
            className={inputCls}
            disabled={isEdit}
          >
            <option value="SMS">SMS</option>
            <option value="EMAIL">Email</option>
            <option value="ZALO">Zalo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung tin nhắn *</label>
          <textarea
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            className={inputCls}
            rows={4}
            placeholder="Nhập nội dung tin nhắn..."
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Hỗ trợ biến: <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> (tên bệnh nhân),{' '}
            <code className="bg-gray-100 px-1 rounded">{'{date}'}</code> (ngày hẹn)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ngày lên lịch</label>
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-gray-500">Để trống nếu muốn lưu nháp</p>
        </div>

        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Tính năng gửi tự động cần cấu hình Zalo OA / SMS gateway</span>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {isPending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo chiến dịch'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Log Modal ────────────────────────────────────────────

function CampaignLogModal({ open, onClose, campaign }: { open: boolean; onClose: () => void; campaign: Campaign | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ['campaign-detail', campaign?.id],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaign!.id}`);
      if (!res.ok) throw new Error('Lỗi tải logs');
      return res.json();
    },
    enabled: open && !!campaign?.id,
  });

  const logs: any[] = data?.data?.logs ?? [];

  return (
    <Modal open={open} onClose={onClose} title={`Logs — ${campaign?.name ?? ''}`} size="xl">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-sky-600" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-gray-400">Chưa có log nào</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Người nhận</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Kênh</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Trạng thái</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Thời gian gửi</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Lỗi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{log.recipient}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getChannelColor(log.channel)}`}>
                      {getChannelLabel(log.channel)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      log.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-500">{formatDateTime(log.sentAt)}</td>
                  <td className="px-3 py-2 text-red-500 text-xs">{log.errorMsg ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

// ─── Action Buttons Row ───────────────────────────────────

function ActionButtons({ campaign, onEdit, onViewLogs }: {
  campaign: Campaign;
  onEdit: (c: Campaign) => void;
  onViewLogs: (c: Campaign) => void;
}) {
  const patch = usePatchCampaign(campaign.id);

  async function handleAction(action: 'launch' | 'cancel') {
    const label = action === 'launch' ? 'Khởi chạy' : 'Hủy';
    try {
      await patch.mutateAsync(action);
      toast.success(`${label} chiến dịch thành công`);
    } catch (err: any) {
      toast.error(err.message ?? `${label} thất bại`);
    }
  }

  const canEdit   = campaign.status === 'DRAFT';
  const canLaunch = campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED';
  const canCancel = !['COMPLETED', 'CANCELLED'].includes(campaign.status);

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      {canEdit && (
        <button
          onClick={() => onEdit(campaign)}
          className="flex items-center gap-1 px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded text-xs font-medium transition-colors"
          title="Chỉnh sửa"
        >
          <Edit2 className="w-3 h-3" /> Sửa
        </button>
      )}
      {canLaunch && (
        <button
          onClick={() => handleAction('launch')}
          disabled={patch.isPending}
          className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors"
          title="Khởi chạy"
        >
          <PlayCircle className="w-3 h-3" /> Chạy
        </button>
      )}
      {canCancel && (
        <button
          onClick={() => handleAction('cancel')}
          disabled={patch.isPending}
          className="flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-xs font-medium transition-colors"
          title="Hủy chiến dịch"
        >
          <XCircle className="w-3 h-3" /> Hủy
        </button>
      )}
      <button
        onClick={() => onViewLogs(campaign)}
        className="flex items-center gap-1 px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded text-xs font-medium transition-colors"
        title="Xem logs"
      >
        <FileText className="w-3 h-3" /> Logs
      </button>
    </div>
  );
}

// ─── Run Reminders Button ─────────────────────────────────

function RunRemindersButton() {
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/reminders/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'SMS', windowHours: 24 }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Gửi nhắc lịch thất bại');
      }
      return res.json();
    },
  });

  async function handleClick() {
    try {
      const { data } = await mutation.mutateAsync();
      toast.success(
        `Đã gửi ${data.totalSent}/${data.totalAttempted} nhắc lịch` +
        (data.totalFailed > 0 ? ` (${data.totalFailed} lỗi)` : '') +
        (data.totalSkipped > 0 ? `, ${data.totalSkipped} bỏ qua (thiếu SĐT)` : '')
      );
    } catch (err: any) {
      toast.error(err.message ?? 'Có lỗi xảy ra');
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={mutation.isPending}
      className="flex items-center gap-2 px-4 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 disabled:bg-gray-100 text-amber-800 rounded-lg font-medium transition-colors"
      title="Gửi nhắc cho mọi lịch hẹn trong 24h tới"
    >
      {mutation.isPending ? <Loader className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
      Gửi nhắc lịch (24h)
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function MarketingPage() {
  const [page, setPage]               = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [formModal, setFormModal]     = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [logCampaign, setLogCampaign] = useState<Campaign | null>(null);

  const { data, isLoading, error: fetchError } = useCampaigns(page, statusFilter, channelFilter);
  const campaigns: Campaign[] = data?.data ?? [];
  const meta = data?.meta;

  const stats = {
    total:   meta?.total ?? 0,
    running: campaigns.filter(c => c.status === 'RUNNING').length,
    sent:    campaigns.reduce((s, c) => s + c.totalSent, 0),
  };

  function openEdit(c: Campaign) {
    setEditCampaign(c);
    setFormModal(true);
  }

  function closeForm() {
    setFormModal(false);
    setEditCampaign(null);
  }

  if (fetchError) return (
    <div className="flex items-center justify-center h-64 text-red-600">
      <AlertCircle className="w-8 h-8 mr-2" /> Lỗi khi tải dữ liệu
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Marketing &amp; Chiến dịch</h1>
        <div className="flex gap-2">
          <RunRemindersButton />
          <button
            onClick={() => { setEditCampaign(null); setFormModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" /> Tạo chiến dịch
          </button>
        </div>
      </div>

      {/* Provider notice */}
      <div className="flex items-start gap-2 p-3 bg-sky-50 border border-sky-200 rounded-lg text-sm text-sky-800">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>
          Đang chạy ở chế độ <strong>mock provider</strong> — tin nhắn được ghi log nhưng không gửi thật.
          Cấu hình <code className="bg-white px-1 rounded">ZALO_OA_ID</code>,{' '}
          <code className="bg-white px-1 rounded">SMS_API_KEY</code> trong env để bật provider thật.
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-500">Tổng chiến dịch</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <PlayCircle className="w-4 h-4 text-green-500" />
            <p className="text-sm text-gray-500">Đang chạy</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.running}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-sky-500" />
            <p className="text-sm text-gray-500">Đã gửi</p>
          </div>
          <p className="text-2xl font-bold text-sky-600">{stats.sent.toLocaleString('vi-VN')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Nháp</option>
          <option value="SCHEDULED">Đã lên lịch</option>
          <option value="RUNNING">Đang chạy</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
        <select
          value={channelFilter}
          onChange={e => { setChannelFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Tất cả kênh</option>
          <option value="SMS">SMS</option>
          <option value="EMAIL">Email</option>
          <option value="ZALO">Zalo</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader className="w-8 h-8 animate-spin text-sky-600" />
          </div>
        ) : campaigns.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Tên</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Kênh</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Ngày lên lịch</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Đã gửi / Tổng</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaigns.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getChannelColor(c.channel)}`}>
                          {getChannelLabel(c.channel)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(c.status)}`}>
                          {getStatusLabel(c.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDateTime(c.scheduledAt)}</td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {c.totalSent.toLocaleString('vi-VN')} / {(c._count?.logs ?? 0).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3">
                        <ActionButtons campaign={c} onEdit={openEdit} onViewLogs={c => setLogCampaign(c)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm">
                <span className="text-gray-500">Trang {meta.page}/{meta.totalPages} ({meta.total} chiến dịch)</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                    disabled={page === meta.totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <Megaphone className="w-10 h-10 opacity-30" />
            <p>Chưa có chiến dịch nào</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <CampaignFormModal
        open={formModal}
        onClose={closeForm}
        campaign={editCampaign}
      />

      <CampaignLogModal
        open={!!logCampaign}
        onClose={() => setLogCampaign(null)}
        campaign={logCampaign}
      />
    </div>
  );
}
