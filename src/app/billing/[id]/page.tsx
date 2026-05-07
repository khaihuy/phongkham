'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useAddPayment, useIssueInvoice } from '@/hooks/use-invoices';
import { ArrowLeft, CreditCard, Printer, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const printStyles = `
@media print {
  body * { visibility: hidden; }
  #print-area, #print-area * { visibility: visible; }
  #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
  .print-hide { display: none !important; }
  .print-show { display: block !important; }
  .print-show-flex { display: flex !important; }
  table { border-collapse: collapse; width: 100%; margin-top: 8px; }
  th { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  th, td { border: 1px solid #ddd; padding: 6px 10px; font-size: 12px; text-align: left; }
  td.text-right, th.text-right { text-align: right; }
  .invoice-totals { margin-top: 12px; }
  .invoice-totals div { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; border-bottom: 1px solid #eee; }
  .invoice-totals .total-row { font-weight: bold; font-size: 15px; border-top: 2px solid #333; margin-top: 4px; padding-top: 4px; }
  .paid-stamp { border: 3px solid #16a34a; color: #16a34a; padding: 4px 16px; border-radius: 4px; font-weight: bold; font-size: 16px; text-transform: uppercase; display: inline-block; transform: rotate(-15deg); margin-top: 8px; }
}
`;

function fmtCur(v: any) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v) || 0); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('vi-VN'); }

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Nháp', cls: 'bg-gray-100 text-gray-600' },
  ISSUED: { label: 'Chưa thanh toán', cls: 'bg-blue-100 text-blue-700' },
  PAID: { label: 'Đã thanh toán', cls: 'bg-green-100 text-green-700' },
  OVERDUE: { label: 'Quá hạn', cls: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-gray-100 text-gray-400' },
};
const METHODS: Record<string, string> = { CASH: 'Tiền mặt', BANK_TRANSFER: 'Chuyển khoản', CARD: 'Thẻ', MOMO: 'MoMo', ZALOPAY: 'ZaloPay', VNPAY: 'VNPay', INSURANCE: 'BHYT' };
const PAY_METHODS = ['CASH', 'BANK_TRANSFER', 'CARD', 'MOMO', 'ZALOPAY', 'VNPAY'];

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', method: 'CASH', notes: '' });

  const { data: clinic } = useQuery({
    queryKey: ['clinic'],
    queryFn: async () => (await fetch('/api/clinic')).json().then((r: any) => r.data),
  });

  const { data: invoice, isLoading, error, refetch } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const r = await fetch(`/api/invoices/${id}`);
      if (!r.ok) throw new Error('Not found');
      return (await r.json()).data;
    },
  });

  const addPayment = useAddPayment(id);
  const issueInvoice = useIssueInvoice(id);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (invoice.status === 'DRAFT') await issueInvoice.mutateAsync();
      await addPayment.mutateAsync({ amount: payForm.amount || String(invoice.remainingAmount ?? Number(invoice.totalAmount)), method: payForm.method as any, notes: payForm.notes });
      toast.success('Thanh toán thành công');
      setPayModal(false);
      refetch();
    } catch { toast.error('Thanh toán thất bại'); }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader className="w-8 h-8 animate-spin text-sky-600" /></div>;
  if (error || !invoice) return <div className="flex items-center justify-center h-64 text-red-600"><AlertCircle className="w-8 h-8 mr-2" />Không tìm thấy hóa đơn</div>;

  const status = STATUS_MAP[invoice.status] ?? { label: invoice.status, cls: 'bg-gray-100 text-gray-600' };
  const canPay = invoice.status !== 'PAID' && invoice.status !== 'CANCELLED';
  const remaining = invoice.remainingAmount ?? (Number(invoice.totalAmount) - (invoice.paidAmount ?? 0));

  return (
    <div className="space-y-6 max-w-3xl mx-auto" id="print-area">
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />

      {/* Print-only invoice */}
      <div className="print-show hidden">
        {/* Clinic header */}
        <div style={{ borderBottom: '2px solid #1e3a5f', paddingBottom: '12px', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {clinic?.name ?? 'PHÒNG KHÁM'}
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: '#444' }}>
              {[clinic?.address, clinic?.phone && `ĐT: ${clinic.phone}`, clinic?.email].filter(Boolean).join('  |  ')}
            </div>
            {clinic?.licenseNo && (
              <div style={{ fontSize: '11px', color: '#666' }}>Giấy phép hành nghề: {clinic.licenseNo}</div>
            )}
          </div>
        </div>

        {/* Invoice title */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Hóa đơn dịch vụ y tế
          </div>
          <div style={{ fontSize: '13px', marginTop: '6px', display: 'flex', justifyContent: 'center', gap: '32px' }}>
            <span>Số HD: <strong>{invoice?.invoiceCode}</strong></span>
            <span>Ngày: <strong>{invoice?.issuedAt ? fmtDate(invoice.issuedAt) : fmtDate(invoice?.createdAt)}</strong></span>
          </div>
        </div>

        {/* Patient info */}
        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 12px', marginBottom: '12px', fontSize: '13px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <div><span style={{ color: '#666' }}>Bệnh nhân: </span><strong>{invoice?.patient?.fullName}</strong></div>
            <div><span style={{ color: '#666' }}>Mã BN: </span><strong>{invoice?.patient?.patientCode}</strong></div>
            <div><span style={{ color: '#666' }}>Người lập: </span><span>{invoice?.createdBy?.fullName}</span></div>
            <div><span style={{ color: '#666' }}>Ngày lập: </span><span>{fmtDate(invoice?.createdAt)}</span></div>
          </div>
        </div>

        {/* Paid stamp for paid invoices */}
        {invoice?.status === 'PAID' && (
          <div style={{ textAlign: 'right', marginBottom: '8px' }}>
            <span className="paid-stamp">Đã thanh toán</span>
          </div>
        )}
      </div>

      <div className="print-hide flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Hóa đơn {invoice.invoiceCode}</h1>
          <p className="text-sm text-gray-500">{invoice.patient?.fullName} · {fmtDate(invoice.createdAt)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.cls}`}>{status.label}</span>
      </div>

      {/* Invoice details */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Bệnh nhân:</span> <strong>{invoice.patient?.fullName}</strong></div>
          <div><span className="text-gray-500">Ngày tạo:</span> <strong>{fmtDate(invoice.createdAt)}</strong></div>
          <div><span className="text-gray-500">Tạo bởi:</span> <strong>{invoice.createdBy?.fullName}</strong></div>
          {invoice.issuedAt && <div><span className="text-gray-500">Ngày phát hành:</span> <strong>{fmtDate(invoice.issuedAt)}</strong></div>}
        </div>

        {/* Items */}
        <div>
          <h3 className="font-semibold text-gray-700 text-sm mb-2">Chi tiết dịch vụ</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Dịch vụ / Thuốc</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">SL</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Đơn giá</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Giảm</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoice.items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">{fmtCur(item.unitPrice)}</td>
                  <td className="px-3 py-2 text-right text-gray-400">{item.discount > 0 ? fmtCur(item.discount) : '—'}</td>
                  <td className="px-3 py-2 text-right font-medium">{fmtCur(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t pt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Tạm tính</span><span>{fmtCur(invoice.subtotal)}</span></div>
          {Number(invoice.discount) > 0 && <div className="flex justify-between"><span className="text-gray-500">Giảm giá</span><span className="text-red-600">- {fmtCur(invoice.discount)}</span></div>}
          {Number(invoice.taxAmount) > 0 && <div className="flex justify-between"><span className="text-gray-500">Thuế</span><span>{fmtCur(invoice.taxAmount)}</span></div>}
          <div className="flex justify-between font-bold text-base border-t pt-2"><span>Tổng cộng</span><span>{fmtCur(invoice.totalAmount)}</span></div>
          {invoice.paidAmount > 0 && <div className="flex justify-between text-green-600"><span>Đã thanh toán</span><span>{fmtCur(invoice.paidAmount)}</span></div>}
          {remaining > 0 && <div className="flex justify-between font-semibold text-red-600"><span>Còn lại</span><span>{fmtCur(remaining)}</span></div>}
        </div>
      </div>

      {/* Payment history */}
      {invoice.payments?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">Lịch sử thanh toán</h3>
          <div className="space-y-2">
            {invoice.payments.map((p: any) => (
              <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{METHODS[p.method] ?? p.method}</span>
                  {p.notes && <span className="text-gray-400">· {p.notes}</span>}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-700">{fmtCur(p.amount)}</p>
                  <p className="text-xs text-gray-400">{fmtDate(p.paidAt ?? p.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="print-hide flex gap-3">
        {canPay && (
          <button onClick={() => { setPayModal(true); setPayForm({ amount: String(remaining), method: 'CASH', notes: '' }); }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
            <CreditCard className="w-4 h-4" /> Thanh toán
          </button>
        )}
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm">
          <Printer className="w-4 h-4" /> In / Xuất PDF
        </button>
      </div>

      {/* Pay Modal */}
      {payModal && (
        <div className="print-hide">
        <Modal title="Thanh toán hóa đơn" open={true} onClose={() => setPayModal(false)}>
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
                {PAY_METHODS.map(m => <option key={m} value={m}>{METHODS[m]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <input type="text" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={addPayment.isPending}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:bg-gray-400">
                {addPayment.isPending ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
              <button type="button" onClick={() => setPayModal(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
            </div>
          </form>
        </Modal>
        </div>
      )}
    </div>
  );
}
