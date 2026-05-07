'use client';

import { useState } from 'react';
import { useInvoices } from '@/hooks/use-invoices';
import { Plus, Search, Eye, AlertCircle, Loader, FileText } from 'lucide-react';
import Link from 'next/link';

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-700';
    case 'PARTIAL':
      return 'bg-amber-100 text-amber-700';
    case 'UNPAID':
    case 'OVERDUE':
      return 'bg-red-100 text-red-700';
    case 'DRAFT':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export default function BillingPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: invoicesData, isLoading, error } = useInvoices(page, 10, {
    status: statusFilter || undefined,
  });

  const invoices = invoicesData?.data || [];
  const meta = invoicesData?.meta;

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>Lỗi khi tải dữ liệu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Thanh toán</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors">
          <Plus className="w-5 h-5" />
          Hóa đơn mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-card border border-gray-100">
          <p className="text-sm text-gray-600">Tổng hóa đơn</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{meta?.total || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card border border-gray-100">
          <p className="text-sm text-gray-600">Chưa thanh toán</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {invoices.filter((inv: any) => inv.status === 'UNPAID').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card border border-gray-100">
          <p className="text-sm text-gray-600">Đã thanh toán</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {invoices.filter((inv: any) => inv.status === 'PAID').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm hóa đơn..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Nháp</option>
          <option value="ISSUED">Đã phát hành</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="UNPAID">Chưa thanh toán</option>
          <option value="OVERDUE">Quá hạn</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-sky-600" />
          </div>
        ) : invoices.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Mã hóa đơn</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Bệnh nhân</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Tổng tiền</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Đã thanh toán</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Trạng thái</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.map((invoice: any) => {
                    const paidAmount = invoice.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{invoice.invoiceCode}</td>
                        <td className="px-6 py-4 text-gray-600">{invoice.patient.fullName}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {formatCurrency(invoice.totalAmount)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatCurrency(paidAmount)} / {formatCurrency(invoice.totalAmount)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status === 'PAID' && 'Đã thanh toán'}
                            {invoice.status === 'UNPAID' && 'Chưa thanh toán'}
                            {invoice.status === 'PARTIAL' && 'Thanh toán một phần'}
                            {invoice.status === 'DRAFT' && 'Nháp'}
                            {invoice.status === 'ISSUED' && 'Đã phát hành'}
                            {invoice.status === 'OVERDUE' && 'Quá hạn'}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex items-center justify-center gap-2">
                          <Link href={`/billing/${invoice.id}`}>
                            <button className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <button className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors">
                            <FileText className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">
                  Trang {meta.page} / {meta.totalPages} ({meta.total} hóa đơn)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                    disabled={page === meta.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">Không có hóa đơn</div>
        )}
      </div>
    </div>
  );
}
