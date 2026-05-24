'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import { Plus, Search, Pencil, Loader, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

function formatCurrency(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
}

const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm';

const emptyForm = {
  name: '',
  code: '',
  description: '',
  price: 0,
  unit: 'lần',
  isActive: true,
};

function useServices(page: number, search: string, isActive: string) {
  return useQuery({
    queryKey: ['services', page, search, isActive],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '10',
        ...(search && { search }),
        ...(isActive !== '' && { isActive }),
      });
      const r = await fetch(`/api/services?${params}`);
      const j = await r.json();
      return j as { data: any[]; meta: any };
    },
  });
}

function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: typeof emptyForm) => {
      const r = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, price: Number(body.price) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Lỗi tạo dịch vụ');
      return j.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof emptyForm> }) => {
      const r = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, ...(data.price !== undefined && { price: Number(data.price) }) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Lỗi cập nhật dịch vụ');
      return j.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

export default function ServicesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [editService, setEditService] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data, isLoading, error } = useServices(page, search, isActiveFilter);
  const createService = useCreateService();
  const updateService = useUpdateService();

  const services: any[] = data?.data ?? [];
  const meta = data?.meta;

  function openAdd() {
    setForm({ ...emptyForm });
    setAddModal(true);
  }

  function openEdit(svc: any) {
    setForm({
      name: svc.name,
      code: svc.code,
      description: svc.description ?? '',
      price: parseFloat(svc.price),
      unit: svc.unit ?? 'lần',
      isActive: svc.isActive,
    });
    setEditService(svc);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createService.mutateAsync(form);
      toast.success('Thêm dịch vụ thành công');
      setAddModal(false);
    } catch (err: any) {
      toast.error(err.message ?? 'Thêm dịch vụ thất bại');
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editService) return;
    try {
      await updateService.mutateAsync({ id: editService.id, data: form });
      toast.success('Cập nhật dịch vụ thành công');
      setEditService(null);
    } catch (err: any) {
      toast.error(err.message ?? 'Cập nhật dịch vụ thất bại');
    }
  }

  async function handleToggleActive(svc: any) {
    try {
      await updateService.mutateAsync({ id: svc.id, data: { isActive: !svc.isActive } });
      toast.success(svc.isActive ? 'Đã tắt dịch vụ' : 'Đã bật dịch vụ');
    } catch {
      toast.error('Thao tác thất bại');
    }
  }

  if (error) return (
    <div className="flex items-center justify-center h-64 text-red-600">
      <AlertCircle className="w-8 h-8 mr-2" /> Lỗi khi tải dữ liệu
    </div>
  );

  const modalForm = (onSubmit: (e: React.FormEvent) => Promise<void>, isPending: boolean, submitLabel: string, isEdit = false) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tên dịch vụ *</label>
          <input type="text" value={form.name} required
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className={INPUT_CLASS} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Mã dịch vụ *</label>
          <input type="text" value={form.code} required disabled={isEdit}
            onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
            className={INPUT_CLASS + (isEdit ? ' bg-gray-50 cursor-not-allowed' : '')} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Giá (VNĐ)</label>
          <input type="number" value={form.price} min={0} step={10000}
            onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
            className={INPUT_CLASS} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Đơn vị</label>
          <input type="text" value={form.unit} placeholder="lần"
            onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
            className={INPUT_CLASS} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Mô tả</label>
          <textarea value={form.description} rows={2}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className={INPUT_CLASS + ' resize-none'} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="svc-active" checked={form.isActive}
          onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
        <label htmlFor="svc-active" className="text-sm text-gray-700">Đang hoạt động</label>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={isPending}
          className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm">
          {isPending ? 'Đang lưu...' : submitLabel}
        </button>
        <button type="button"
          onClick={() => { setAddModal(false); setEditService(null); }}
          className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
          Hủy
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dịch vụ &amp; Bảng giá</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" /> Thêm dịch vụ
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã dịch vụ..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <select
          value={isActiveFilter}
          onChange={e => { setIsActiveFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Ngừng hoạt động</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader className="w-8 h-8 animate-spin text-sky-600" />
          </div>
        ) : services.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Mã DV</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Tên dịch vụ</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Đơn vị</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Giá</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Trạng thái</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {services.map((svc: any) => (
                    <tr key={svc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{svc.code}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {svc.name}
                        {svc.description && (
                          <p className="text-xs text-gray-400 font-normal mt-0.5">{svc.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{svc.unit ?? 'lần'}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(svc.price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {svc.isActive
                          ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Hoạt động</span>
                          : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs font-medium">Ngừng</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(svc)}
                            title="Chỉnh sửa"
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(svc)}
                            title={svc.isActive ? 'Tắt dịch vụ' : 'Bật dịch vụ'}
                            className={`p-1.5 rounded-lg transition-colors ${svc.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                          >
                            {svc.isActive
                              ? <ToggleRight className="w-5 h-5" />
                              : <ToggleLeft className="w-5 h-5" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
                <span className="text-gray-500">Trang {meta.page}/{meta.totalPages} ({meta.total} dịch vụ)</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100">Trước</button>
                  <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100">Sau</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-400">Không có dịch vụ nào</div>
        )}
      </div>

      {/* Add Modal */}
      {addModal && (
        <Modal title="Thêm dịch vụ mới" open={true} onClose={() => setAddModal(false)}>
          {modalForm(handleAdd, createService.isPending, 'Thêm dịch vụ')}
        </Modal>
      )}

      {/* Edit Modal */}
      {editService && (
        <Modal title="Chỉnh sửa dịch vụ" open={true} onClose={() => setEditService(null)}>
          {modalForm(handleEdit, updateService.isPending, 'Lưu thay đổi', true)}
        </Modal>
      )}
    </div>
  );
}
