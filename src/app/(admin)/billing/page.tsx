'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useInvoices, useAddPayment, useCreateInvoice, useIssueInvoice } from '@/hooks/use-invoices';
import { usePatients } from '@/hooks/use-patients';
import Modal from '@/components/ui/Modal';
import { Plus, Search, CreditCard, FileText, CheckCircle, Loader, AlertCircle, Printer, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PAID': return 'bg-green-100 text-green-700';
    case 'ISSUED': return 'bg-blue-100 text-blue-700';
    case 'OVERDUE': return 'bg-red-100 text-red-700';
    case 'DRAFT': return 'bg-gray-100 text-gray-700';
    case 'CANCELLED': return 'bg-gray-100 text-gray-500';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PAID: 'Đã thanh toán', ISSUED: 'Chưa thanh toán', OVERDUE: 'Quá hạn',
    DRAFT: 'Nháp', CANCELLED: 'Đã hủy',
  };
  return labels[status] ?? status;
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
  { value: 'CARD', label: 'Thẻ' },
  { value: 'MOMO', label: 'MoMo' },
  { value: 'ZALOPAY', label: 'ZaloPay' },
  { value: 'VNPAY', label: 'VNPay' },
];

export default function BillingPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [payModal, setPayModal] = useState<any>(null);
  const [paySuccess, setPaySuccess] = useState<any>(null);
  const [createModal, setCreateModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', method: 'CASH', notes: '' });
  const [createForm, setCreateForm] = useState({
    patientId: '', serviceName: 'Khám tổng quát', quantity: 1, unitPrice: '300000', notes: '',
  });

  const { data: debtSummary } = useQuery({
    queryKey: ['billing-debt-summary'],
    queryFn: async () => {
      const [draft, issued] = await Promise.all([
        fetch('/api/invoices?status=DRAFT&pageSize=1').then(r => r.json()),
        fetch('/api/invoices?status=ISSUED&pageSize=1').then(r => r.json()),
      ]);
      return {
        draftCount: draft.meta?.total ?? 0,
        issuedCount: issued.meta?.total ?? 0,
      };
    },
    refetchInterval: 60000,
  });

  const { data: invoicesData, isLoading, error } = useInvoices(page, 10, { status: statusFilter || undefined });
  const { data: patientsData } = usePatients(1, 200);
  const createInvoice = useCreateInvoice();

  const invoices: any[] = invoicesData?.data ?? [];
  const meta = invoicesData?.meta;
  const patients: any[] = patientsData?.data ?? [];

  // Inline hooks for selected invoice
  const addPayment = useAddPayment(payModal?.id ?? '');
  const issueInvoice = useIssueInvoice(payModal?.id ?? '');

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!payModal) return;
    try {
      // Issue first if still DRAFT
      if (payModal.status === 'DRAFT') {
        await issueInvoice.mutateAsync();
      }
      await addPayment.mutateAsync({
        amount: payForm.amount || String(Number(payModal.totalAmount)),
        method: payForm.method as any,
        notes: payForm.notes,
      });
      toast.success('Thanh toán thành công');
      setPaySuccess(payModal);
      setPayModal(null);
      setPayForm({ amount: '', method: 'CASH', notes: '' });
    } catch {
      toast.error('Thanh toán thất bại');
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const total = (parseFloat(createForm.unitPrice) * createForm.quantity).toString();
    try {
      await createInvoice.mutateAsync({
        patientId: createForm.patientId,
        items: [{
          type: 'SERVICE',
          name: createForm.serviceName,
          quantity: createForm.quantity,
          unitPrice: createForm.unitPrice,
          discount: '0',
        }],
        subtotal: total,
        discount: '0',
        taxAmount: '0',
        totalAmount: total,
        insuranceCover: '0',
        patientPays: total,
        notes: createForm.notes,
      } as any);
      toast.success('Tạo hóa đơn thành công');
      setCreateModal(false);
      setCreateForm({ patientId: '', serviceName: 'Khám tổng quát', quantity: 1, unitPrice: '300000', notes: '' });
    } catch {
      toast.error('Tạo hóa đơn thất bại');
    }
  }

  const stats = {
    total: meta?.total ?? 0,
    unpaid: invoices.filter(i => i.status === 'ISSUED' || i.status === 'OVERDUE').length,
    paid: invoices.filter(i => i.status === 'PAID').length,
  };

  if (error) return (
    <div className="flex items-center justify-center h-64 text-red-600">
      <AlertCircle className="w-8 h-8 mr-2" /> Lỗi khi tải dữ liệu
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Thanh toán</h1>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" /> Hóa đơn mới
        </button>
      </div>

      {/* Debt summary */}
      {debtSummary && (debtSummary.draftCount > 0 || debtSummary.issuedCount > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-amber-600 font-medium">Hóa đơn chưa phát</p>
              <p className="text-2xl font-bold text-amber-800">{debtSummary.draftCount}</p>
            </div>
            <button onClick={() => setStatusFilter('DRAFT')} className="ml-auto text-xs text-amber-700 hover:underline">Xem →</button>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-red-600 font-medium">Chưa thanh toán</p>
              <p className="text-2xl font-bold text-red-800">{debtSummary.issuedCount}</p>
            </div>
            <button onClick={() => setStatusFilter('ISSUED')} className="ml-auto text-xs text-red-700 hover:underline">Xem →</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Tổng hóa đơn</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Chưa thanh toán</p>
          <p className="text-2xl font-bold text-amber-600">{stats.unpaid}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Đã thanh toán</p>
          <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input type="text" placeholder="Tìm kiếm..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="">Tất cả</option>
          <option value="DRAFT">Nháp</option>
          <option value="ISSUED">Chưa thanh toán</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="OVERDUE">Quá hạn</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader className="w-8 h-8 animate-spin text-sky-600" />
          </div>
        ) : invoices.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Mã HD</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Bệnh nhân</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Tổng tiền</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Đã trả</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Trạng thái</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv: any) => {
                    const paid = inv.payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) ?? 0;
                    const canPay = inv.status !== 'PAID' && inv.status !== 'CANCELLED';
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{inv.invoiceCode}</td>
                        <td className="px-4 py-3 text-gray-600">{inv.patient?.fullName}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(inv.totalAmount)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(paid)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(inv.status)}`}>
                            {getStatusLabel(inv.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {canPay && (
                              <button
                                onClick={() => {
                                  setPayModal(inv);
                                  setPayForm({ amount: String(Number(inv.totalAmount) - paid), method: 'CASH', notes: '' });
                                }}
                                className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                              >
                                <CreditCard className="w-3 h-3" /> Thanh toán
                              </button>
                            )}
                            {inv.status === 'PAID' && (
                              <Link href={`/billing/${inv.id}`}>
                                <button className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium">
                                  <Printer className="w-3 h-3" /> In hóa đơn
                                </button>
                              </Link>
                            )}
                            <Link href={`/billing/${inv.id}`}>
                              <button className="p-1 hover:bg-gray-100 text-gray-500 rounded" title="Xem chi tiết">
                                <Eye className="w-4 h-4" />
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm">
                <span className="text-gray-500">Trang {meta.page}/{meta.totalPages} ({meta.total} hóa đơn)</span>
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
          <div className="flex items-center justify-center h-48 text-gray-400">Không có hóa đơn</div>
        )}
      </div>

      {/* Payment Modal */}
      {payModal && (
        <Modal title={`Thanh toán — ${payModal.invoiceCode}`} open={true} onClose={() => setPayModal(null)}>
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
            <p><span className="text-gray-500">Bệnh nhân:</span> <strong>{payModal.patient?.fullName}</strong></p>
            <p><span className="text-gray-500">Tổng tiền:</span> <strong>{formatCurrency(payModal.totalAmount)}</strong></p>
            <p><span className="text-gray-500">Đã trả:</span> <strong>{formatCurrency(payModal.payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) ?? 0)}</strong></p>
            <p><span className="text-gray-500">Còn lại:</span> <strong className="text-red-600">{formatCurrency(payForm.amount)}</strong></p>
          </div>
          <form onSubmit={handlePay} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền</label>
              <input type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                min="0" step="1000" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức</label>
              <select value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <input type="text" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Ghi chú (không bắt buộc)" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={addPayment.isPending || issueInvoice.isPending}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium">
                {addPayment.isPending ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </button>
              <button type="button" onClick={() => setPayModal(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment Success Modal */}
      {paySuccess && (
        <Modal title="Thanh toán thành công" open={true} onClose={() => { setPaySuccess(null); }}>
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">Đã nhận thanh toán</p>
              <p className="text-gray-500 text-sm mt-1">{paySuccess.patient?.fullName} — {paySuccess.invoiceCode}</p>
              <p className="text-green-700 font-bold text-xl mt-2">{formatCurrency(paySuccess.totalAmount)}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Link href={`/billing/${paySuccess.id}`} className="flex-1">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                  <Printer className="w-4 h-4" /> In hóa đơn
                </button>
              </Link>
              <button onClick={() => setPaySuccess(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Invoice Modal */}
      {createModal && (
        <Modal title="Tạo hóa đơn mới" open={true} onClose={() => setCreateModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bệnh nhân *</label>
              <select value={createForm.patientId}
                onChange={e => setCreateForm(f => ({ ...f, patientId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                required>
                <option value="">Chọn bệnh nhân</option>
                {patients.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.fullName} — {p.patientCode}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dịch vụ</label>
              <input type="text" value={createForm.serviceName}
                onChange={e => setCreateForm(f => ({ ...f, serviceName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                <input type="number" value={createForm.quantity} min="1"
                  onChange={e => setCreateForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá (VNĐ)</label>
                <input type="number" value={createForm.unitPrice} min="0" step="1000"
                  onChange={e => setCreateForm(f => ({ ...f, unitPrice: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
            </div>
            <div className="p-3 bg-sky-50 rounded-lg text-sm">
              <span className="text-gray-500">Tổng tiền: </span>
              <strong>{formatCurrency(parseFloat(createForm.unitPrice || '0') * createForm.quantity)}</strong>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <textarea value={createForm.notes} onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                rows={2} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={createInvoice.isPending}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white rounded-lg font-medium">
                {createInvoice.isPending ? 'Đang tạo...' : 'Tạo hóa đơn'}
              </button>
              <button type="button" onClick={() => setCreateModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
