'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, AlertCircle, Loader, X } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';

const TITLES = ['BS.', 'ThS.BS.', 'TS.BS.', 'PGS.TS.BS.', 'GS.TS.BS.'];

const emptyForm = {
  userId: '', specialtyId: '', branchId: '', employeeCode: '',
  title: '', licenseNo: '', yearsOfExp: '0', consultFee: '', bio: '',
};

export default function DoctorsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: doctorsData, isLoading, error } = useQuery({
    queryKey: ['doctors', page, search],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page), pageSize: '10' });
      if (search) p.set('search', search);
      const r = await fetch(`/api/doctors?${p}`);
      if (!r.ok) throw new Error('Failed');
      return (await r.json()) as { data: any[]; meta: any };
    },
  });

  const { data: specialties } = useQuery({
    queryKey: ['specialties'],
    queryFn: async () => (await fetch('/api/specialties')).json().then((r: any) => r.data ?? []),
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => (await fetch('/api/branches')).json().then((r: any) => r.data ?? []),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-doctor'],
    queryFn: async () => (await fetch('/api/users?role=DOCTOR')).json().then((r: any) => r.data ?? []),
  });

  const doctors = doctorsData?.data ?? [];
  const meta = doctorsData?.meta;

  const createMut = useMutation({
    mutationFn: async (data: typeof form) => {
      const r = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, yearsOfExp: Number(data.yearsOfExp) }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Lỗi'); }
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctors'] }); toast.success('Thêm bác sĩ thành công'); closeModal(); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async (data: typeof form) => {
      const r = await fetch(`/api/doctors/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, yearsOfExp: Number(data.yearsOfExp) }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Lỗi'); }
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctors'] }); toast.success('Cập nhật thành công'); closeModal(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/doctors/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Lỗi xóa');
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctors'] }); toast.success('Đã xóa bác sĩ'); },
    onError: () => toast.error('Xóa thất bại'),
  });

  function openCreate() { setForm({ ...emptyForm }); setEditId(null); setModal('create'); }
  function openEdit(d: any) {
    setForm({
      userId: d.userId, specialtyId: d.specialtyId, branchId: d.branchId ?? '',
      employeeCode: d.employeeCode, title: d.title ?? '', licenseNo: d.licenseNo,
      yearsOfExp: String(d.yearsOfExp), consultFee: String(d.consultFee), bio: d.bio ?? '',
    });
    setEditId(d.id);
    setModal('edit');
  }
  function closeModal() { setModal(null); setEditId(null); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (modal === 'create') createMut.mutate(form);
    else updateMut.mutate(form);
  }

  const f = (field: keyof typeof form, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Bác sĩ</h1>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors">
          <Plus className="w-5 h-5" /> Thêm bác sĩ
        </button>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
        <input type="text" placeholder="Tìm kiếm bác sĩ..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Loader className="w-8 h-8 animate-spin text-sky-600" /></div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-600"><AlertCircle className="w-6 h-6 mr-2" />Lỗi tải dữ liệu</div>
        ) : doctors.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Tên bác sĩ</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Chuyên khoa</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Giấy phép</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Kinh nghiệm</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Giá khám</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {doctors.map((d: any) => (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {d.title && <span className="text-sky-600 mr-1">{d.title}</span>}
                        {d.user?.fullName}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{d.specialty?.name}</td>
                      <td className="px-6 py-4 text-gray-600">{d.licenseNo}</td>
                      <td className="px-6 py-4 text-gray-600">{d.yearsOfExp} năm</td>
                      <td className="px-6 py-4 text-gray-600">{Number(d.consultFee).toLocaleString('vi-VN')} đ</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(d)}
                            className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => { if (confirm('Xóa bác sĩ này?')) deleteMut.mutate(d.id); }}
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">Trang {meta.page} / {meta.totalPages} ({meta.total} bác sĩ)</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100">Trước</button>
                  <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100">Sau</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">Không có bác sĩ</div>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'Thêm bác sĩ mới' : 'Cập nhật thông tin bác sĩ'} open={true} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-3">
            {modal === 'create' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tài khoản bác sĩ <span className="text-red-500">*</span></label>
                <select value={form.userId} onChange={e => f('userId', e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option value="">-- Chọn tài khoản --</option>
                  {(usersData ?? []).map((u: any) => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chức danh</label>
                <select value={form.title} onChange={e => f('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option value="">Không có</option>
                  {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã nhân viên <span className="text-red-500">*</span></label>
                <input type="text" value={form.employeeCode} onChange={e => f('employeeCode', e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="BS001" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chuyên khoa <span className="text-red-500">*</span></label>
                <select value={form.specialtyId} onChange={e => f('specialtyId', e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option value="">-- Chọn chuyên khoa --</option>
                  {(specialties ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh <span className="text-red-500">*</span></label>
                <select value={form.branchId} onChange={e => f('branchId', e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option value="">-- Chọn chi nhánh --</option>
                  {(branches ?? []).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số giấy phép <span className="text-red-500">*</span></label>
                <input type="text" value={form.licenseNo} onChange={e => f('licenseNo', e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="GP-12345" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kinh nghiệm (năm)</label>
                <input type="number" value={form.yearsOfExp} onChange={e => f('yearsOfExp', e.target.value)} min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá khám (VNĐ) <span className="text-red-500">*</span></label>
              <input type="number" value={form.consultFee} onChange={e => f('consultFee', e.target.value)} required min="0" step="10000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="200000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiểu sử</label>
              <textarea value={form.bio} onChange={e => f('bio', e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Mô tả ngắn về bác sĩ..." />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={isPending}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium disabled:bg-gray-400">
                {isPending ? 'Đang lưu...' : modal === 'create' ? 'Thêm bác sĩ' : 'Cập nhật'}
              </button>
              <button type="button" onClick={closeModal}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
