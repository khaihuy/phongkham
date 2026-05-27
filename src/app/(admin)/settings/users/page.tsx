'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import { Plus, Pencil, UserX, UserCheck, Loader, AlertCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PHARMACIST', 'ACCOUNTANT'] as const;
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Quản trị viên', DOCTOR: 'Bác sĩ', RECEPTIONIST: 'Lễ tân',
  PHARMACIST: 'Dược sĩ', ACCOUNTANT: 'Kế toán',
};
const ROLE_PERMS: Record<string, string> = {
  ADMIN: 'Toàn quyền: quản lý người dùng, cài đặt hệ thống, xem mọi báo cáo',
  DOCTOR: 'Khám bệnh, kê đơn, xem hồ sơ bệnh nhân, ghi kết quả xét nghiệm',
  RECEPTIONIST: 'Tiếp nhận bệnh nhân, đặt lịch hẹn, quản lý phòng chờ, thanh toán',
  PHARMACIST: 'Quản lý kho thuốc, xuất nhập dược phẩm, xem đơn thuốc',
  ACCOUNTANT: 'Quản lý hóa đơn, thanh toán, xuất báo cáo tài chính',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700', DOCTOR: 'bg-blue-100 text-blue-700',
  RECEPTIONIST: 'bg-green-100 text-green-700', PHARMACIST: 'bg-amber-100 text-amber-700',
  ACCOUNTANT: 'bg-pink-100 text-pink-700',
};

const emptyForm = { email: '', username: '', password: '', fullName: '', phone: '', role: 'RECEPTIONIST' as string };

export default function UsersPage() {
  const qc = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editForm, setEditForm] = useState({ fullName: '', email: '', phone: '', role: '', isActive: true, password: '' });

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const r = await fetch('/api/users');
      if (!r.ok) throw new Error('Forbidden');
      const j = await r.json();
      return j.data ?? [];
    },
  });

  const createUser = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error ?? 'Failed'); }
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Tạo tài khoản thành công'); setCreateModal(false); setForm({ ...emptyForm }); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const payload: any = {};
      if (data.fullName) payload.fullName = data.fullName;
      if (data.email) payload.email = data.email;
      if (data.phone !== undefined) payload.phone = data.phone;
      if (data.role) payload.role = data.role;
      if (data.password) payload.password = data.password;
      if (data.isActive !== undefined) payload.isActive = data.isActive;
      const r = await fetch(`/api/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Cập nhật thành công'); setEditModal(null); },
    onError: () => toast.error('Cập nhật thất bại'),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const r = await fetch(`/api/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }) });
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Cập nhật trạng thái thành công'); },
    onError: () => toast.error('Thất bại'),
  });

  function openEdit(user: any) {
    setEditModal(user);
    setEditForm({ fullName: user.fullName, email: user.email ?? '', phone: user.phone ?? '', role: user.role, isActive: user.isActive, password: '' });
  }

  if (error) return (
    <div className="flex items-center justify-center h-64 text-red-600">
      <AlertCircle className="w-8 h-8 mr-2" /> Không có quyền truy cập (yêu cầu ADMIN)
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Chỉ Admin mới có quyền quản lý</p>
        </div>
        <button onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium">
          <Plus className="w-5 h-5" /> Thêm người dùng
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader className="w-8 h-8 animate-spin text-sky-600" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Họ tên</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Username</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Vai trò</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Trạng thái</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Đăng nhập cuối</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user: any) => (
                <tr key={user.id} className={`hover:bg-gray-50 ${!user.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">{user.fullName}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{user.username}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {user.isActive ? 'Hoạt động' : 'Khóa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(user)} className="p-1.5 hover:bg-amber-100 text-amber-600 rounded-lg">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive.mutate({ id: user.id, isActive: !user.isActive })}
                        className={`p-1.5 rounded-lg ${user.isActive ? 'hover:bg-red-100 text-red-500' : 'hover:bg-green-100 text-green-600'}`}>
                        {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {createModal && (
        <Modal title="Thêm người dùng" open={true} onClose={() => setCreateModal(false)}>
          <form onSubmit={e => { e.preventDefault(); createUser.mutate(form); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'fullName', label: 'Họ tên *', type: 'text' },
                { key: 'username', label: 'Username *', type: 'text' },
                { key: 'email', label: 'Email *', type: 'email' },
                { key: 'phone', label: 'SĐT', type: 'tel' },
                { key: 'password', label: 'Mật khẩu *', type: 'password' },
              ].map(f => (
                <div key={f.key} className={f.key === 'fullName' || f.key === 'email' ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]}
                    onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required={f.label.includes('*')} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Vai trò *</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={createUser.isPending}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium disabled:bg-gray-400">
                {createUser.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>
              <button type="button" onClick={() => setCreateModal(false)} className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50">Hủy</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editModal && (
        <Modal title={`Chỉnh sửa — ${editModal.fullName}`} open={true} onClose={() => setEditModal(null)}>
          <form onSubmit={e => { e.preventDefault(); updateUser.mutate({ id: editModal.id, data: editForm }); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Họ tên</label>
                <input type="text" value={editForm.fullName} onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="email@phongkham.vn" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">SĐT</label>
                <input type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                <input type="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Để trống = không đổi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-2">Vai trò & Quyền hạn</label>
                <div className="grid grid-cols-1 gap-2">
                  {ROLES.map(r => (
                    <label key={r} className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      editForm.role === r ? 'border-sky-500 bg-sky-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <input type="radio" name="role" value={r} checked={editForm.role === r}
                        onChange={() => setEditForm(f => ({ ...f, role: r }))} className="mt-0.5" />
                      <div>
                        <p className={`text-sm font-medium ${editForm.role === r ? 'text-sky-700' : 'text-gray-800'}`}>
                          {ROLE_LABELS[r]}
                        </p>
                        <p className="text-xs text-gray-500">{ROLE_PERMS[r]}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={updateUser.isPending}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium disabled:bg-gray-400">
                {updateUser.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button type="button" onClick={() => setEditModal(null)} className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50">Hủy</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
