'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Invoice, InvoiceItem, PaymentStatus, PaymentMethod } from '@/types';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import { PaymentStatusBadge } from '@/components/ui/Badge';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

const PAYMENT_METHODS: PaymentMethod[] = ['tiền mặt', 'chuyển khoản', 'thẻ', 'bảo hiểm'];

const emptyItem = (): InvoiceItem => ({
  id: generateId(),
  description: '',
  category: 'khám bệnh',
  quantity: 1,
  unitPrice: 0,
  total: 0,
});

const emptyForm = {
  patientId: '',
  doctorName: '',
  invoiceDate: '',
  dueDate: '',
  items: [] as InvoiceItem[],
  discount: 0,
  tax: 0,
  paidAmount: 0,
  paymentStatus: 'chưa thanh toán' as PaymentStatus,
  paymentMethod: '' as PaymentMethod | '',
  paymentDate: '',
  notes: '',
};

type FormData = typeof emptyForm;

export default function BillingPage() {
  const { invoices, patients, doctors, addInvoice, updateInvoice, deleteInvoice } = useStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<Invoice | null>(null);
  const PAGE_SIZE = 10;

  const todayStr = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const totalRevenue = invoices.reduce((s, i) => s + i.paidAmount, 0);
    const unpaidAmount = invoices
      .filter((i) => i.paymentStatus !== 'đã thanh toán')
      .reduce((s, i) => s + (i.total - i.paidAmount), 0);
    const paidCount = invoices.filter((i) => i.paymentStatus === 'đã thanh toán').length;
    const unpaidCount = invoices.filter((i) => i.paymentStatus === 'chưa thanh toán').length;
    return { totalRevenue, unpaidAmount, paidCount, unpaidCount, total: invoices.length };
  }, [invoices]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoices
      .filter((i) => {
        const matchSearch =
          i.patientName.toLowerCase().includes(q) ||
          i.code.toLowerCase().includes(q) ||
          i.doctorName.toLowerCase().includes(q);
        const matchStatus = filterStatus === 'all' || i.paymentStatus === filterStatus;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [invoices, search, filterStatus]);

  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const subtotal = useMemo(() => form.items.reduce((s, i) => s + i.total, 0), [form.items]);
  const total = useMemo(() => subtotal - form.discount + form.tax, [subtotal, form.discount, form.tax]);

  function openAdd() {
    setForm({ ...emptyForm, invoiceDate: todayStr, items: [emptyItem()] });
    setSelectedInvoice(null);
    setModalMode('add');
  }

  function openEdit(inv: Invoice) {
    setSelectedInvoice(inv);
    setForm({
      patientId: inv.patientId,
      doctorName: inv.doctorName,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate || '',
      items: inv.items,
      discount: inv.discount,
      tax: inv.tax,
      paidAmount: inv.paidAmount,
      paymentStatus: inv.paymentStatus,
      paymentMethod: inv.paymentMethod || '',
      paymentDate: inv.paymentDate || '',
      notes: inv.notes || '',
    });
    setModalMode('edit');
  }

  function openView(inv: Invoice) {
    setSelectedInvoice(inv);
    setModalMode('view');
  }

  function closeModal() {
    setModalMode(null);
    setSelectedInvoice(null);
    setForm(emptyForm);
  }

  function handleSubmit() {
    if (!form.patientId || form.items.length === 0) return;
    const patient = patients.find((p) => p.id === form.patientId);
    if (!patient) return;

    const finalTotal = subtotal - form.discount + form.tax;
    const data = {
      patientId: form.patientId,
      patientName: patient.fullName,
      doctorName: form.doctorName,
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate || undefined,
      items: form.items,
      subtotal,
      discount: form.discount,
      tax: form.tax,
      total: finalTotal,
      paidAmount: form.paidAmount,
      paymentStatus: form.paymentStatus,
      paymentMethod: (form.paymentMethod || undefined) as PaymentMethod | undefined,
      paymentDate: form.paymentDate || undefined,
      notes: form.notes || undefined,
    };

    if (modalMode === 'add') {
      addInvoice(data);
    } else if (modalMode === 'edit' && selectedInvoice) {
      updateInvoice(selectedInvoice.id, data);
    }
    closeModal();
  }

  function addItem() {
    setForm({ ...form, items: [...form.items, emptyItem()] });
  }

  function removeItem(idx: number) {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  }

  function updateItem(idx: number, field: keyof InvoiceItem, value: string | number) {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      items[idx].total = (items[idx].quantity || 0) * (items[idx].unitPrice || 0);
    }
    setForm({ ...form, items });
  }

  const columns = [
    {
      key: 'code',
      header: 'Mã HĐ',
      render: (i: Invoice) => (
        <span className="font-mono text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{i.code}</span>
      ),
    },
    {
      key: 'date',
      header: 'Ngày',
      render: (i: Invoice) => <span className="text-sm">{formatDate(i.invoiceDate)}</span>,
    },
    {
      key: 'patient',
      header: 'Bệnh nhân',
      render: (i: Invoice) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-700 font-bold text-xs">{i.patientName.split(' ').pop()?.charAt(0)}</span>
          </div>
          <span className="font-medium text-gray-800 text-sm">{i.patientName}</span>
        </div>
      ),
    },
    {
      key: 'doctor',
      header: 'Bác sĩ',
      render: (i: Invoice) => <span className="text-sm text-gray-600 max-w-[160px] block truncate">{i.doctorName}</span>,
    },
    {
      key: 'items',
      header: 'Dịch vụ',
      render: (i: Invoice) => (
        <span className="text-xs text-gray-500">{i.items.length} mục</span>
      ),
    },
    {
      key: 'total',
      header: 'Tổng tiền',
      render: (i: Invoice) => (
        <span className="font-semibold text-gray-800">{formatCurrency(i.total)}</span>
      ),
    },
    {
      key: 'paid',
      header: 'Đã thanh toán',
      render: (i: Invoice) => (
        <span className={`font-medium ${i.paidAmount >= i.total ? 'text-emerald-600' : 'text-amber-600'}`}>
          {formatCurrency(i.paidAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (i: Invoice) => <PaymentStatusBadge status={i.paymentStatus} />,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (i: Invoice) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openView(i)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => openEdit(i)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteConfirm(i)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Revenue Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Tổng doanh thu</p>
              <p className="text-sm font-bold text-gray-800 truncate">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Còn nợ</p>
              <p className="text-sm font-bold text-red-600 truncate">{formatCurrency(stats.unpaidAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Đã thanh toán</p>
              <p className="text-sm font-bold text-gray-800">{stats.paidCount} hóa đơn</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Chưa thanh toán</p>
              <p className="text-sm font-bold text-gray-800">{stats.unpaidCount} hóa đơn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm hóa đơn, bệnh nhân..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm w-60 focus:ring-2 focus:ring-primary-300 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as PaymentStatus | 'all'); setPage(1); }}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none"
          >
            <option value="all">Tất cả</option>
            <option value="đã thanh toán">Đã thanh toán</option>
            <option value="chưa thanh toán">Chưa thanh toán</option>
            <option value="một phần">Một phần</option>
          </select>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tạo hóa đơn
        </button>
      </div>

      <Table
        columns={columns}
        data={paged}
        keyExtractor={(i) => i.id}
        emptyMessage="Không tìm thấy hóa đơn nào"
        pagination={{ page, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage }}
      />

      {/* Add/Edit Modal */}
      <Modal
        open={modalMode === 'add' || modalMode === 'edit'}
        onClose={closeModal}
        title={modalMode === 'add' ? 'Tạo hóa đơn mới' : 'Chỉnh sửa hóa đơn'}
        size="xl"
        footer={
          <>
            <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors">Hủy</button>
            <button onClick={handleSubmit} className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors">
              {modalMode === 'add' ? 'Tạo hóa đơn' : 'Lưu thay đổi'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bệnh nhân <span className="text-red-500">*</span></label>
              <select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none bg-white">
                <option value="">-- Chọn bệnh nhân --</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.code} - {p.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bác sĩ phụ trách</label>
              <select value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none bg-white">
                <option value="">-- Chọn bác sĩ --</option>
                {doctors.map((d) => <option key={d.id} value={d.fullName}>{d.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ngày xuất HĐ</label>
              <input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hạn thanh toán</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none" />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700">Danh mục dịch vụ</h4>
              <button onClick={addItem} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Thêm mục
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-2 py-2 font-semibold text-gray-500 rounded-tl-lg min-w-[160px]">Mô tả</th>
                    <th className="px-2 py-2 font-semibold text-gray-500 min-w-[110px]">Loại</th>
                    <th className="px-2 py-2 font-semibold text-gray-500 w-16">SL</th>
                    <th className="px-2 py-2 font-semibold text-gray-500 w-28">Đơn giá</th>
                    <th className="px-2 py-2 font-semibold text-gray-500 w-28">Thành tiền</th>
                    <th className="px-2 py-2 rounded-tr-lg w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {form.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="px-1 py-1.5">
                        <input type="text" value={item.description}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          placeholder="Mô tả dịch vụ..."
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-300 outline-none" />
                      </td>
                      <td className="px-1 py-1.5">
                        <select value={item.category} onChange={(e) => updateItem(idx, 'category', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-300 outline-none bg-white">
                          <option value="khám bệnh">Khám bệnh</option>
                          <option value="thuốc">Thuốc</option>
                          <option value="xét nghiệm">Xét nghiệm</option>
                          <option value="thủ thuật">Thủ thuật</option>
                          <option value="khác">Khác</option>
                        </select>
                      </td>
                      <td className="px-1 py-1.5">
                        <input type="number" min={1} value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-300 outline-none text-right" />
                      </td>
                      <td className="px-1 py-1.5">
                        <input type="number" min={0} step={1000} value={item.unitPrice}
                          onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-300 outline-none text-right" />
                      </td>
                      <td className="px-2 py-1.5 font-semibold text-gray-700 text-right">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="px-1 py-1.5">
                        <button onClick={() => removeItem(idx)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {form.items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-xs text-gray-400">
                        Chưa có mục nào. Nhấn &quot;Thêm mục&quot; để thêm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Thanh toán</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Giảm giá (VND)</label>
                  <input type="number" min={0} value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Đã thanh toán (VND)</label>
                  <input type="number" min={0} value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Trạng thái</label>
                  <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as PaymentStatus })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none bg-white">
                    <option value="chưa thanh toán">Chưa thanh toán</option>
                    <option value="một phần">Một phần</option>
                    <option value="đã thanh toán">Đã thanh toán</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hình thức TT</label>
                  <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod | '' })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none bg-white">
                    <option value="">-- Chọn --</option>
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none resize-none"
                  placeholder="Ghi chú hóa đơn..." />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Tổng kết</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tạm tính:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Giảm giá:</span>
                <span className="font-medium text-red-600">- {formatCurrency(form.discount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Thuế:</span>
                <span className="font-medium">{formatCurrency(form.tax)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-800">Tổng cộng:</span>
                  <span className="font-bold text-lg text-primary-600">{formatCurrency(total)}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Đã thanh toán:</span>
                <span className="font-medium text-emerald-600">{formatCurrency(form.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Còn lại:</span>
                <span className={`font-semibold ${(total - form.paidAmount) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatCurrency(Math.max(0, total - form.paidAmount))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={modalMode === 'view'}
        onClose={closeModal}
        title="Chi tiết hóa đơn"
        size="xl"
        footer={
          <>
            <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors">Đóng</button>
            <button onClick={() => { if (selectedInvoice) { closeModal(); setTimeout(() => openEdit(selectedInvoice), 100); } }}
              className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors">Chỉnh sửa</button>
          </>
        }
      >
        {selectedInvoice && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between p-4 bg-gradient-to-r from-emerald-50 to-primary-50 rounded-xl">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-bold text-emerald-700">{selectedInvoice.code}</span>
                  <PaymentStatusBadge status={selectedInvoice.paymentStatus} />
                </div>
                <h3 className="font-bold text-gray-800 text-lg">{selectedInvoice.patientName}</h3>
                <p className="text-sm text-gray-500">{selectedInvoice.doctorName}</p>
                <p className="text-xs text-gray-400 mt-1">Ngày: {formatDate(selectedInvoice.invoiceDate)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Tổng cộng</p>
                <p className="text-2xl font-bold text-primary-600">{formatCurrency(selectedInvoice.total)}</p>
                <p className="text-xs text-emerald-600 font-medium">Đã TT: {formatCurrency(selectedInvoice.paidAmount)}</p>
                {selectedInvoice.paymentMethod && (
                  <p className="text-xs text-gray-400 capitalize">{selectedInvoice.paymentMethod}</p>
                )}
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Chi tiết dịch vụ</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs">
                      <th className="px-3 py-2 font-semibold text-gray-500 rounded-tl-lg">Mô tả</th>
                      <th className="px-3 py-2 font-semibold text-gray-500">Loại</th>
                      <th className="px-3 py-2 font-semibold text-gray-500 text-right">SL</th>
                      <th className="px-3 py-2 font-semibold text-gray-500 text-right">Đơn giá</th>
                      <th className="px-3 py-2 font-semibold text-gray-500 text-right rounded-tr-lg">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedInvoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2.5 font-medium text-gray-800">{item.description}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{item.category}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-800">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tạm tính:</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Giảm giá:</span>
                    <span className="text-red-600">- {formatCurrency(selectedInvoice.discount)}</span>
                  </div>
                )}
                <div className="border-t pt-1.5">
                  <div className="flex justify-between font-bold">
                    <span>Tổng cộng:</span>
                    <span className="text-primary-600">{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Đã thanh toán:</span>
                  <span className="font-medium">{formatCurrency(selectedInvoice.paidAmount)}</span>
                </div>
                {(selectedInvoice.total - selectedInvoice.paidAmount) > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Còn nợ:</span>
                    <span className="font-semibold">{formatCurrency(selectedInvoice.total - selectedInvoice.paidAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {selectedInvoice.notes && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs font-medium text-amber-700 mb-1">Ghi chú</p>
                <p className="text-sm text-amber-800">{selectedInvoice.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Xác nhận xóa"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors">Hủy</button>
            <button onClick={() => { if (deleteConfirm) { deleteInvoice(deleteConfirm.id); setDeleteConfirm(null); } }}
              className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">Xóa</button>
          </>
        }
      >
        <div className="text-center py-2">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-gray-700 text-sm">Xóa hóa đơn <span className="font-bold">{deleteConfirm?.code}</span>?</p>
        </div>
      </Modal>
    </div>
  );
}
