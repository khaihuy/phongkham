'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, User, Shield, Building2, Phone, Mail, MapPin, Globe, FileText, Hash, Save, Loader, DatabaseZap, Plug, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  DOCTOR: 'Bác sĩ',
  RECEPTIONIST: 'Lễ tân',
  PHARMACIST: 'Dược sĩ',
  ACCOUNTANT: 'Kế toán',
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'clinic' | 'integrations' | 'account'>('clinic');

  const { data: clinicData, isLoading: clinicLoading } = useQuery({
    queryKey: ['clinic'],
    queryFn: async () => {
      const r = await fetch('/api/clinic');
      return (await r.json()).data;
    },
  });

  const [clinicForm, setClinicForm] = useState({
    name: '', taxCode: '', phone: '', email: '',
    address: '', website: '', licenseNo: '',
  });

  useEffect(() => {
    if (clinicData) {
      setClinicForm({
        name: clinicData.name ?? '',
        taxCode: clinicData.taxCode ?? '',
        phone: clinicData.phone ?? '',
        email: clinicData.email ?? '',
        address: clinicData.address ?? '',
        website: clinicData.website ?? '',
        licenseNo: clinicData.licenseNo ?? '',
      });
    }
  }, [clinicData]);

  const [seedLoading, setSeedLoading] = useState(false);

  async function handleSeedReference() {
    if (!confirm('Nạp dữ liệu mẫu (thuốc, dịch vụ, xét nghiệm)? Dữ liệu hiện có sẽ không bị xoá (upsert).')) return;
    setSeedLoading(true);
    try {
      const r = await fetch('/api/admin/seed-reference', { method: 'POST' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Lỗi');
      toast.success(`Đã nạp: ${j.data?.drugs ?? 0} thuốc, ${j.data?.services ?? 0} dịch vụ`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSeedLoading(false);
    }
  }

  const updateClinic = useMutation({
    mutationFn: async (data: typeof clinicForm) => {
      const r = await fetch('/api/clinic', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error ?? 'Lỗi'); }
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clinic'] }); toast.success('Đã lưu thông tin phòng khám'); },
    onError: (e: any) => toast.error(e.message),
  });

  const f = (field: keyof typeof clinicForm, val: string) =>
    setClinicForm(prev => ({ ...prev, [field]: val }));

  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900">Cài đặt</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'clinic', label: 'Thông tin phòng khám', icon: Building2 },
          { key: 'integrations', label: 'Tích hợp', icon: Plug },
          { key: 'account', label: 'Tài khoản', icon: User },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Clinic Tab */}
      {tab === 'clinic' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Thông tin phòng khám</h2>
              <p className="text-xs text-gray-500">Thông tin hiển thị trên hóa đơn và báo cáo</p>
            </div>
          </div>

          {clinicLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="w-6 h-6 animate-spin text-sky-600" />
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); updateClinic.mutate(clinicForm); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên phòng khám <span className="text-red-500">*</span>
                  </label>
                  <input value={clinicForm.name} onChange={e => f('name', e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Phòng Khám Đa Khoa An Khang" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế</label>
                  <input value={clinicForm.taxCode} onChange={e => f('taxCode', e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="0123456789" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số giấy phép hành nghề</label>
                  <input value={clinicForm.licenseNo} onChange={e => f('licenseNo', e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="GP-12345" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input value={clinicForm.phone} onChange={e => f('phone', e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="028 1234 5678" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={clinicForm.email} onChange={e => f('email', e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="info@phongkham.vn" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ <span className="text-red-500">*</span>
                  </label>
                  <input value={clinicForm.address} onChange={e => f('address', e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="123 Đường ABC, Quận 1, TP. Hồ Chí Minh" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input value={clinicForm.website} onChange={e => f('website', e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="https://phongkham.vn" />
                </div>
              </div>

              {isAdmin ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <button type="submit" disabled={updateClinic.isPending}
                    className="flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors">
                    <Save className="w-4 h-4" />
                    {updateClinic.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button type="button" onClick={handleSeedReference} disabled={seedLoading}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors">
                    <DatabaseZap className="w-4 h-4" />
                    {seedLoading ? 'Đang nạp...' : 'Nạp dữ liệu mẫu'}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Chỉ quản trị viên mới có thể chỉnh sửa thông tin phòng khám.</p>
              )}
            </form>
          )}
        </div>
      )}

      {/* Integrations Tab */}
      {tab === 'integrations' && <IntegrationsTab isAdmin={isAdmin} />}

      {/* Account Tab */}
      {tab === 'account' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 bg-sky-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{session?.user?.name}</h2>
                <p className="text-gray-500 text-sm">{session?.user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Shield className="w-3.5 h-3.5 text-sky-600" />
                  <span className="text-sm font-medium text-sky-600">
                    {ROLE_LABELS[session?.user?.role ?? ''] ?? session?.user?.role}
                  </span>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-3 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Tên đăng nhập</span>
                <span className="font-medium text-gray-900">{session?.user?.username}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-900">{session?.user?.email}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Vai trò</span>
                <span className="font-medium text-gray-900">
                  {ROLE_LABELS[session?.user?.role ?? ''] ?? session?.user?.role}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <button onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
              <LogOut className="w-5 h-5" /> Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Integrations Tab ─────────────────────────────────────

function IntegrationsTab({ isAdmin }: { isAdmin: boolean }) {
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['kiotviet-status'],
    queryFn: async () => {
      const r = await fetch('/api/integrations/kiotviet/status');
      return (await r.json()).data;
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/integrations/kiotviet/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error ?? 'Sync thất bại'); }
      return (await r.json()).data;
    },
  });

  async function handleSync() {
    try {
      const result = await syncMutation.mutateAsync();
      toast.success(
        `Sync xong: ${result.inserted} mới, ${result.updated} cập nhật` +
        (result.skipped > 0 ? `, ${result.skipped} bỏ qua` : '') +
        ` (${result.durationMs}ms)`
      );
    } catch (e: any) {
      toast.error(e.message ?? 'Sync thất bại');
    }
  }

  const isMock = status?.mode === 'mock';

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Plug className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">KiotViet — Đồng bộ kho thuốc</h2>
            <p className="text-xs text-gray-500">Pull sản phẩm + tồn kho từ KiotViet về DB local (1 chiều)</p>
          </div>
          {isLoading ? (
            <Loader className="w-5 h-5 animate-spin text-gray-400" />
          ) : status?.ok ? (
            <span className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Kết nối OK
            </span>
          ) : (
            <span className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
              <XCircle className="w-3.5 h-3.5" /> Lỗi
            </span>
          )}
        </div>

        {status && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Chế độ</p>
              <p className="font-medium text-gray-900">
                {isMock ? (
                  <span className="text-amber-600">Mock (dữ liệu giả lập)</span>
                ) : (
                  <span className="text-green-600">Production</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Retailer</p>
              <p className="font-medium text-gray-900">{status.retailer ?? '—'}</p>
            </div>
          </div>
        )}

        {isMock && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <Plug className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Đang chạy mock. Cấu hình{' '}
              <code className="bg-white px-1 rounded">KIOTVIET_RETAILER</code>,{' '}
              <code className="bg-white px-1 rounded">KIOTVIET_CLIENT_ID</code>,{' '}
              <code className="bg-white px-1 rounded">KIOTVIET_CLIENT_SECRET</code>{' '}
              trong env để kết nối tài khoản KiotViet thật. Đăng ký tại{' '}
              <a className="underline" href="https://developer.kiotviet.vn" target="_blank" rel="noreferrer">
                developer.kiotviet.vn
              </a>.
            </span>
          </div>
        )}

        {isAdmin && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {syncMutation.isPending ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Đồng bộ ngay
            </button>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Kiểm tra kết nối
            </button>
          </div>
        )}
      </div>

      {/* Placeholder cho integrations tương lai */}
      <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
        <p>Sắp có: Drugbank.vn (tra cứu thuốc), Đơn thuốc Quốc gia (TT 04/2022), SMTP email</p>
      </div>
    </div>
  );
}
