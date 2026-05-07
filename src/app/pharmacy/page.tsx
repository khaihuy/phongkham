'use client';

import { useState } from 'react';
import { useDrugs, useCreateDrug } from '@/hooks/use-drugs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import { Plus, Search, AlertCircle, Loader, Package, ArrowDownToLine, ClipboardList, CheckCheck, User, Clock } from 'lucide-react';

const fmt = (n: any) => new Intl.NumberFormat('vi-VN').format(Number(n));
const fmtTime = (d: any) => d ? new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—';

const PRESC_STATUS_LABELS: Record<string, string> = { PENDING: 'Chờ phát', DISPENSED: 'Đã phát', CANCELLED: 'Đã hủy' };
const PRESC_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  DISPENSED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};
import { toast } from 'sonner';

function useDrugCategories() {
  return useQuery({
    queryKey: ['drug-categories'],
    queryFn: async () => {
      const r = await fetch('/api/drug-categories');
      const j = await r.json();
      return j.data as { id: string; name: string; code: string }[];
    },
  });
}

const UNITS = ['TABLET', 'CAPSULE', 'BOTTLE', 'AMPOULE', 'TUBE', 'SACHET', 'VIAL', 'BOX'];
const UNIT_LABELS: Record<string, string> = {
  TABLET: 'Viên', CAPSULE: 'Nang', BOTTLE: 'Chai', AMPOULE: 'Ống tiêm',
  TUBE: 'Tuýp', SACHET: 'Gói', VIAL: 'Lọ', BOX: 'Hộp',
};

const emptyForm = {
  name: '', genericName: '', code: '', unit: 'TABLET', strength: '',
  manufacturer: '', requirePrescription: false, minStock: 50, categoryId: '',
};

const emptyStockForm = {
  drugId: '',
  quantity: 1,
  unitCost: 0,
  supplierName: '',
  batchNumber: '',
  expiryDate: '',
  notes: '',
};

function useImportStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ drugId, data }: { drugId: string; data: Omit<typeof emptyStockForm, 'drugId'> }) => {
      const r = await fetch(`/api/drugs/${drugId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, type: 'IMPORT', quantity: Number(data.quantity), unitCost: Number(data.unitCost) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Lỗi nhập kho');
      return j.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drugs'] }),
  });
}

export default function PharmacyPage() {
  const [tab, setTab] = useState<'inventory' | 'dispense'>('dispense');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [form, setForm] = useState(typeof emptyForm === 'object' ? { ...emptyForm } : emptyForm);
  const [stockForm, setStockForm] = useState({ ...emptyStockForm });
  const [dispensingId, setDispensingId] = useState<string | null>(null);

  const qc = useQueryClient();
  const { data: drugsData, isLoading, error } = useDrugs(page, 10, search || undefined);
  const { data: categories = [] } = useDrugCategories();
  const createDrug = useCreateDrug();
  const importStock = useImportStock();

  const { data: prescData, isLoading: prescLoading, refetch: refetchPrescs } = useQuery({
    queryKey: ['prescriptions', 'PENDING'],
    queryFn: async () => {
      const r = await fetch('/api/prescriptions?status=PENDING&pageSize=50');
      return (await r.json()).data ?? [];
    },
    refetchInterval: 15000,
    enabled: tab === 'dispense',
  });
  const pendingPrescriptions: any[] = prescData ?? [];

  async function handleDispense(prescId: string) {
    if (!confirm('Xác nhận phát thuốc cho đơn này?')) return;
    setDispensingId(prescId);
    try {
      const r = await fetch(`/api/prescriptions/${prescId}/dispense`, { method: 'POST' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Lỗi phát thuốc');
      toast.success('Đã phát thuốc thành công');
      refetchPrescs();
      qc.invalidateQueries({ queryKey: ['drugs'] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDispensingId(null);
    }
  }

  const drugs: any[] = drugsData?.data ?? [];
  const meta = drugsData?.meta;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createDrug.mutateAsync({ ...form, minStock: Number(form.minStock) } as any);
      toast.success('Thêm thuốc thành công');
      setCreateModal(false);
      setForm({ ...emptyForm });
    } catch {
      toast.error('Thêm thuốc thất bại');
    }
  }

  async function handleImportStock(e: React.FormEvent) {
    e.preventDefault();
    if (!stockForm.drugId) {
      toast.error('Vui lòng chọn thuốc');
      return;
    }
    try {
      const { drugId, ...rest } = stockForm;
      await importStock.mutateAsync({ drugId, data: rest });
      toast.success('Nhập kho thành công');
      setImportModal(false);
      setStockForm({ ...emptyStockForm });
    } catch (err: any) {
      toast.error(err.message ?? 'Nhập kho thất bại');
    }
  }

  if (error) return (
    <div className="flex items-center justify-center h-64 text-red-600">
      <AlertCircle className="w-8 h-8 mr-2" /> Lỗi khi tải dữ liệu
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dược phẩm</h1>
        {tab === 'inventory' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setStockForm({ ...emptyStockForm }); setImportModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
            >
              <ArrowDownToLine className="w-5 h-5" /> Nhập kho
            </button>
            <button
              onClick={() => setCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" /> Thêm thuốc
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'dispense', label: 'Phát thuốc', icon: ClipboardList, badge: pendingPrescriptions.length },
          { key: 'inventory', label: 'Kho dược', icon: Package },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key ? 'border-sky-600 text-sky-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-4 h-4" />
              {t.label}
              {'badge' in t && (t as any).badge > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full font-bold">{(t as any).badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dispense Tab */}
      {tab === 'dispense' && (
        <div className="space-y-4">
          {prescLoading ? (
            <div className="flex items-center justify-center h-48"><Loader className="w-8 h-8 animate-spin text-sky-600" /></div>
          ) : pendingPrescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2 bg-white rounded-xl border border-gray-100 shadow-sm">
              <CheckCheck className="w-12 h-12 text-green-400" />
              <p className="font-medium">Không có đơn thuốc chờ phát</p>
              <p className="text-sm">Tất cả đơn thuốc đã được xử lý</p>
            </div>
          ) : (
            pendingPrescriptions.map((presc: any) => {
              const patient = presc.medicalRecord?.patient;
              const doctor = presc.medicalRecord?.doctor?.user;
              const totalItems = presc.items?.length ?? 0;
              const isDispensing = dispensingId === presc.id;

              return (
                <div key={presc.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3 bg-amber-50 border-b border-amber-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{patient?.fullName ?? '—'}</p>
                        <p className="text-xs text-gray-500">{patient?.patientCode} • BS: {doctor?.fullName ?? '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 font-mono">{presc.prescriptionCode}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" /> {fmtTime(presc.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDispense(presc.id)}
                        disabled={isDispensing}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <CheckCheck className="w-4 h-4" />
                        {isDispensing ? 'Đang xử lý...' : 'Xuất thuốc'}
                      </button>
                    </div>
                  </div>

                  {/* Drug items */}
                  <div className="divide-y divide-gray-50">
                    {presc.items?.map((item: any, i: number) => {
                      const stock = item.drug?.inventory?.reduce((s: number, inv: any) => s + inv.quantity, 0) ?? 0;
                      const insufficient = stock < item.quantity;
                      return (
                        <div key={i} className={`flex items-center justify-between px-5 py-3 text-sm ${insufficient ? 'bg-red-50' : ''}`}>
                          <div className="flex-1">
                            <p className={`font-medium ${insufficient ? 'text-red-700' : 'text-gray-800'}`}>
                              {item.drug?.name ?? '—'}
                              {item.drug?.strength && <span className="text-gray-400 font-normal ml-1">{item.drug.strength}</span>}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.dosage} • {item.frequency} • {item.duration}
                            </p>
                          </div>
                          <div className="text-right ml-4 flex-shrink-0">
                            <p className={`font-semibold ${insufficient ? 'text-red-600' : 'text-gray-900'}`}>
                              SL: {item.quantity} {item.drug?.unit ? `(${item.drug.unit.toLowerCase()})` : ''}
                            </p>
                            <p className={`text-xs ${insufficient ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                              Tồn: {stock} {insufficient && '⚠ Không đủ'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-5 py-2 bg-gray-50 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                    <span>{totalItems} loại thuốc</span>
                    {presc.notes && <span className="italic">{presc.notes}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Inventory Tab */}
      {tab === 'inventory' && (<>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
        <input type="text" placeholder="Tìm theo tên, mã thuốc..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader className="w-8 h-8 animate-spin text-sky-600" />
          </div>
        ) : drugs.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Mã</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Tên thuốc</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Hoạt chất</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Hàm lượng</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Đơn vị</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Tồn kho</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Kê đơn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {drugs.map((drug: any) => {
                    const totalStock = drug.inventory?.reduce((s: number, inv: any) => s + inv.quantity, 0) ?? 0;
                    const isLow = totalStock <= (drug.minStock ?? 50);
                    return (
                      <tr key={drug.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{drug.code}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{drug.name}</td>
                        <td className="px-4 py-3 text-gray-500">{drug.genericName ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{drug.strength ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{UNIT_LABELS[drug.unit] ?? drug.unit}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            <Package className="w-3 h-3" /> {totalStock}
                            {isLow && ' ⚠'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {drug.requirePrescription
                            ? <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">Có</span>
                            : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Không</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
                <span className="text-gray-500">Trang {meta.page}/{meta.totalPages} ({meta.total} thuốc)</span>
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
          <div className="flex items-center justify-center h-48 text-gray-400">Không có thuốc</div>
        )}
      </div>

      {/* Import Stock Modal */}
      {importModal && (
        <Modal title="Nhập kho thuốc" open={true} onClose={() => setImportModal(false)}>
          <form onSubmit={handleImportStock} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Chọn thuốc *</label>
              <select
                value={stockForm.drugId}
                onChange={e => setStockForm(f => ({ ...f, drugId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                required
              >
                <option value="">— Chọn thuốc —</option>
                {drugs.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Số lượng nhập *</label>
                <input
                  type="number" min={1} value={stockForm.quantity} required
                  onChange={e => setStockForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Giá nhập (VNĐ)</label>
                <input
                  type="number" min={0} step={1000} value={stockForm.unitCost}
                  onChange={e => setStockForm(f => ({ ...f, unitCost: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                <input
                  type="text" value={stockForm.supplierName} placeholder="Tên nhà cung cấp"
                  onChange={e => setStockForm(f => ({ ...f, supplierName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Số lô</label>
                <input
                  type="text" value={stockForm.batchNumber} placeholder="Số lô sản xuất"
                  onChange={e => setStockForm(f => ({ ...f, batchNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ngày hết hạn</label>
                <input
                  type="date" value={stockForm.expiryDate}
                  onChange={e => setStockForm(f => ({ ...f, expiryDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú</label>
                <input
                  type="text" value={stockForm.notes} placeholder="Ghi chú thêm"
                  onChange={e => setStockForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={importStock.isPending}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm">
                {importStock.isPending ? 'Đang nhập...' : 'Nhập kho'}
              </button>
              <button type="button" onClick={() => setImportModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Hủy</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Modal */}
      {createModal && (
        <Modal title="Thêm thuốc mới" open={true} onClose={() => setCreateModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tên thuốc *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                  required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hoạt chất</label>
                <input type="text" value={form.genericName} onChange={e => setForm(f => ({ ...f, genericName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mã thuốc *</label>
                <input type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                  required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hàm lượng</label>
                <input type="text" value={form.strength} placeholder="VD: 500mg"
                  onChange={e => setForm(f => ({ ...f, strength: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Đơn vị *</label>
                <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm">
                  {UNITS.map(u => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nhà sản xuất</label>
                <input type="text" value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Nhóm thuốc *</label>
                <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                  required>
                  <option value="">Chọn nhóm thuốc</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="rx" checked={form.requirePrescription}
                onChange={e => setForm(f => ({ ...f, requirePrescription: e.target.checked }))} />
              <label htmlFor="rx" className="text-sm text-gray-700">Yêu cầu đơn thuốc</label>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={createDrug.isPending}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm">
                {createDrug.isPending ? 'Đang lưu...' : 'Thêm thuốc'}
              </button>
              <button type="button" onClick={() => setCreateModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Hủy</button>
            </div>
          </form>
        </Modal>
      )}
      </>)}
    </div>
  );
}
