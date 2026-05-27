'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import { Plus, Search, Loader, AlertCircle, Building2, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Supplier {
  id: string;
  name: string;
  contact: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  taxCode: string | null;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = {
  name: '',
  phone: '',
  contact: '',
  email: '',
  address: '',
  taxCode: '',
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useSuppliers(search: string, page: number) {
  return useQuery({
    queryKey: ['suppliers', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '15' });
      if (search) params.set('search', search);
      const r = await fetch(`/api/suppliers?${params}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Lỗi tải dữ liệu');
      return j;
    },
  });
}

function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const r = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Lỗi tạo nhà cung cấp');
      return j.data as Supplier;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof emptyForm & { isActive: boolean }> }) => {
      const r = await fetch(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Lỗi cập nhật');
      return j.data as Supplier;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

// ─── Supplier Form Modal ─────────────────────────────────────────────────────

interface SupplierModalProps {
  open: boolean;
  onClose: () => void;
  editing: Supplier | null;
}

function SupplierModal({ open, onClose, editing }: SupplierModalProps) {
  const [form, setForm] = useState<typeof emptyForm>(
    editing
      ? {
          name: editing.name,
          phone: editing.phone,
          contact: editing.contact ?? '',
          email: editing.email ?? '',
          address: editing.address ?? '',
          taxCode: editing.taxCode ?? '',
        }
      : { ...emptyForm }
  );

  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const isPending = createSupplier.isPending || updateSupplier.isPending;

  function setField(field: keyof typeof emptyForm, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await updateSupplier.mutateAsync({ id: editing.id, data: form });
        toast.success('Cập nhật nhà cung cấp thành công');
      } else {
        await createSupplier.mutateAsync(form);
        toast.success('Thêm nhà cung cấp thành công');
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Thao tác thất bại');
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm';
  const labelCls = 'block text-xs font-medium text-gray-700 mb-1';

  return (
    <Modal
      title={editing ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
      open={open}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Tên nhà cung cấp *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Số điện thoại *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setField('phone', e.target.value)}
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Người liên hệ</label>
            <input
              type="text"
              value={form.contact}
              onChange={e => setField('contact', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setField('email', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Mã số thuế</label>
            <input
              type="text"
              value={form.taxCode}
              onChange={e => setField('taxCode', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Địa chỉ</label>
            <input
              type="text"
              value={form.address}
              onChange={e => setField('address', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm"
          >
            {isPending ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm nhà cung cấp'}
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const { data, isLoading, error } = useSuppliers(search, page);
  const updateSupplier = useUpdateSupplier();

  const suppliers: Supplier[] = data?.data ?? [];
  const meta = data?.meta;

  function openCreate() {
    setEditingSupplier(null);
    setModalOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingSupplier(null);
  }

  async function handleToggleActive(supplier: Supplier) {
    try {
      await updateSupplier.mutateAsync({
        id: supplier.id,
        data: { isActive: !supplier.isActive },
      });
      toast.success(supplier.isActive ? 'Đã ngừng hoạt động' : 'Đã kích hoạt');
    } catch {
      toast.error('Thao tác thất bại');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-sky-600" />
          <h1 className="text-3xl font-bold text-gray-900">Nhà cung cấp</h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm nhà cung cấp
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm theo tên, người liên hệ, SĐT..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader className="w-8 h-8 animate-spin text-sky-600" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-red-600">
            <AlertCircle className="w-6 h-6 mr-2" /> Lỗi khi tải dữ liệu
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Tên nhà cung cấp</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Liên hệ</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">SĐT</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Mã số thuế</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Trạng thái</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                        Không có nhà cung cấp nào
                      </td>
                    </tr>
                  ) : (
                    suppliers.map(supplier => (
                      <tr key={supplier.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div>{supplier.name}</div>
                          {supplier.address && (
                            <div className="text-xs text-gray-400 truncate max-w-[200px]">{supplier.address}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{supplier.contact ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{supplier.phone}</td>
                        <td className="px-4 py-3 text-gray-600">{supplier.email ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{supplier.taxCode ?? '—'}</td>
                        <td className="px-4 py-3 text-center">
                          {supplier.isActive ? (
                            <span className="inline-flex px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs font-medium">
                              Ngừng
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEdit(supplier)}
                              title="Chỉnh sửa"
                              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-sky-600 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(supplier)}
                              title={supplier.isActive ? 'Ngừng hoạt động' : 'Kích hoạt'}
                              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-amber-600 transition-colors"
                            >
                              {supplier.isActive
                                ? <ToggleRight className="w-4 h-4 text-green-600" />
                                : <ToggleLeft className="w-4 h-4 text-gray-400" />
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
                <span className="text-gray-500">
                  Trang {meta.page}/{meta.totalPages} ({meta.total} nhà cung cấp)
                </span>
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
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <SupplierModal
          open={modalOpen}
          onClose={closeModal}
          editing={editingSupplier}
        />
      )}
    </div>
  );
}
