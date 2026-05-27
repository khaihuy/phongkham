'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import { FlaskConical, ScanSearch, Loader, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

type OrderStatus = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ',
  IN_PROGRESS: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Hủy',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
];

// ─── Lab Orders hooks ───────────────────────────────────────────────────────

function useLabOrders(status: OrderStatus, page: number) {
  return useQuery({
    queryKey: ['lab-orders', status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '15' });
      if (status !== 'ALL') params.set('status', status);
      const r = await fetch(`/api/lab-orders?${params}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Lỗi tải dữ liệu');
      return j;
    },
  });
}

function useUpdateLabOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const r = await fetch(`/api/lab-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Lỗi cập nhật');
      return j.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab-orders'] }),
  });
}

// ─── Image Orders hooks ──────────────────────────────────────────────────────

function useImageOrders(status: OrderStatus, page: number) {
  return useQuery({
    queryKey: ['image-orders', status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '15' });
      if (status !== 'ALL') params.set('status', status);
      const r = await fetch(`/api/image-orders?${params}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Lỗi tải dữ liệu');
      return j;
    },
  });
}

function useUpdateImageOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const r = await fetch(`/api/image-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Lỗi cập nhật');
      return j.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['image-orders'] }),
  });
}

// ─── Status filter bar ───────────────────────────────────────────────────────

function StatusFilter({ value, onChange }: { value: OrderStatus; onChange: (v: OrderStatus) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {STATUSES.map(s => (
        <button
          key={s.value}
          onClick={() => onChange(s.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            value === s.value
              ? 'bg-sky-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

// ─── Update result modal ─────────────────────────────────────────────────────

interface UpdateResultModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  currentResult: string;
  type: 'lab' | 'image';
}

function UpdateResultModal({ open, onClose, orderId, currentResult, type }: UpdateResultModalProps) {
  const [result, setResult] = useState(currentResult ?? '');
  const [fileUrl, setFileUrl] = useState('');
  const updateLab = useUpdateLabOrder();
  const updateImage = useUpdateImageOrder();

  const isPending = updateLab.isPending || updateImage.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (type === 'lab') {
        await updateLab.mutateAsync({
          id: orderId,
          data: {
            result,
            status: 'COMPLETED',
            resultDate: new Date().toISOString(),
          },
        });
      } else {
        await updateImage.mutateAsync({
          id: orderId,
          data: {
            findings: result,
            status: 'COMPLETED',
            ...(fileUrl && { imageUrl: fileUrl }),
          },
        });
      }
      toast.success('Cập nhật kết quả thành công');
      onClose();
    } catch {
      toast.error('Cập nhật thất bại');
    }
  }

  return (
    <Modal title="Cập nhật kết quả" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {type === 'lab' ? 'Kết quả xét nghiệm' : 'Kết quả / Nhận xét'} *
          </label>
          <textarea
            value={result}
            onChange={e => setResult(e.target.value)}
            rows={4}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            placeholder="Nhập kết quả..."
          />
        </div>
        {type === 'image' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">URL hình ảnh</label>
            <input
              type="text"
              value={fileUrl}
              onChange={e => setFileUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              placeholder="https://..."
            />
          </div>
        )}
        <p className="text-xs text-gray-500">
          Trạng thái sẽ được chuyển thành <strong>Hoàn thành</strong>.
        </p>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm"
          >
            {isPending ? 'Đang lưu...' : 'Lưu kết quả'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            Hủy
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Orders table ─────────────────────────────────────────────────────────────

interface OrdersTableProps {
  type: 'lab' | 'image';
  status: OrderStatus;
  page: number;
  onPageChange: (p: number) => void;
  onUpdateResult: (id: string, currentResult: string) => void;
}

function OrdersTable({ type, status, page, onPageChange, onUpdateResult }: OrdersTableProps) {
  const labQuery = useLabOrders(status, page);
  const imageQuery = useImageOrders(status, page);

  const query = type === 'lab' ? labQuery : imageQuery;
  const orders: any[] = query.data?.data ?? [];
  const meta = query.data?.meta;

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (query.error) {
    return (
      <div className="flex items-center justify-center h-48 text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" /> Lỗi khi tải dữ liệu
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Mã HS</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Bệnh nhân</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                {type === 'lab' ? 'Tên xét nghiệm' : 'Loại CĐHA'}
              </th>
              {type === 'image' && (
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Vị trí</th>
              )}
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Trạng thái</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Ngày chỉ định</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Kết quả</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={type === 'image' ? 8 : 7} className="px-4 py-12 text-center text-gray-400">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              orders.map((order: any) => {
                const patient = order.medicalRecord?.patient;
                const displayName = type === 'lab' ? order.testName : order.imagingType;
                const resultText = type === 'lab' ? order.result : order.findings;
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {patient?.patientCode ?? order.medicalRecordId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {patient?.fullName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div>{displayName}</div>
                      {type === 'lab' && order.testCode && (
                        <div className="text-xs text-gray-400">{order.testCode}</div>
                      )}
                    </td>
                    {type === 'image' && (
                      <td className="px-4 py-3 text-gray-500">{order.bodyPart ?? '—'}</td>
                    )}
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[160px]">
                      <span className="truncate block">{resultText ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                        <button
                          onClick={() => onUpdateResult(order.id, resultText ?? '')}
                          className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium"
                        >
                          Cập nhật kết quả
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
          <span className="text-gray-500">
            Trang {meta.page}/{meta.totalPages} ({meta.total} bản ghi)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
            >
              Trước
            </button>
            <button
              onClick={() => onPageChange(Math.min(meta.totalPages, page + 1))}
              disabled={page === meta.totalPages}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type Tab = 'lab' | 'image';

export default function LabOrdersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('lab');
  const [labStatus, setLabStatus] = useState<OrderStatus>('ALL');
  const [imageStatus, setImageStatus] = useState<OrderStatus>('ALL');
  const [labPage, setLabPage] = useState(1);
  const [imagePage, setImagePage] = useState(1);

  const [resultModal, setResultModal] = useState<{
    open: boolean;
    orderId: string;
    currentResult: string;
    type: 'lab' | 'image';
  }>({ open: false, orderId: '', currentResult: '', type: 'lab' });

  function openUpdateModal(id: string, currentResult: string, type: 'lab' | 'image') {
    setResultModal({ open: true, orderId: id, currentResult, type });
  }

  function closeUpdateModal() {
    setResultModal(m => ({ ...m, open: false }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FlaskConical className="w-8 h-8 text-sky-600" />
        <h1 className="text-3xl font-bold text-gray-900">Xét nghiệm & CĐHA</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('lab')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'lab'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          Xét nghiệm
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'image'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ScanSearch className="w-4 h-4" />
          Chẩn đoán hình ảnh
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'lab' && (
        <div className="space-y-4">
          <StatusFilter
            value={labStatus}
            onChange={v => { setLabStatus(v); setLabPage(1); }}
          />
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <OrdersTable
              type="lab"
              status={labStatus}
              page={labPage}
              onPageChange={setLabPage}
              onUpdateResult={(id, result) => openUpdateModal(id, result, 'lab')}
            />
          </div>
        </div>
      )}

      {activeTab === 'image' && (
        <div className="space-y-4">
          <StatusFilter
            value={imageStatus}
            onChange={v => { setImageStatus(v); setImagePage(1); }}
          />
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <OrdersTable
              type="image"
              status={imageStatus}
              page={imagePage}
              onPageChange={setImagePage}
              onUpdateResult={(id, result) => openUpdateModal(id, result, 'image')}
            />
          </div>
        </div>
      )}

      {/* Update Result Modal */}
      {resultModal.open && (
        <UpdateResultModal
          open={resultModal.open}
          onClose={closeUpdateModal}
          orderId={resultModal.orderId}
          currentResult={resultModal.currentResult}
          type={resultModal.type}
        />
      )}
    </div>
  );
}
