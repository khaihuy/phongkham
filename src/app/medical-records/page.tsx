'use client';

import { useState } from 'react';
import { useMedicalRecords } from '@/hooks/use-medical-records';
import { AlertCircle, Loader, Eye } from 'lucide-react';
import Link from 'next/link';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export default function MedicalRecordsPage() {
  const [page, setPage] = useState(1);

  const { data: recordsData, isLoading, error } = useMedicalRecords(page, 10);

  const records = recordsData?.data || [];
  const meta = recordsData?.meta;

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
      <h1 className="text-3xl font-bold text-gray-900">Hồ sơ bệnh án</h1>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-sky-600" />
          </div>
        ) : records.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Mã hồ sơ</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Bệnh nhân</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Bác sĩ</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Ngày khám</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Chẩn đoán</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((record: any) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{record.recordCode}</td>
                      <td className="px-6 py-4 text-gray-600">{record.patient?.fullName}</td>
                      <td className="px-6 py-4 text-gray-600">{record.doctor?.user?.fullName}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(record.visitDate)}</td>
                      <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{record.diagnosis || 'N/A'}</td>
                      <td className="px-6 py-4 flex items-center justify-center gap-2">
                        <Link href={`/medical-records/${record.id}`}>
                          <button className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">
                  Trang {meta.page} / {meta.totalPages} ({meta.total} hồ sơ)
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
          <div className="flex items-center justify-center h-64 text-gray-500">Không có hồ sơ bệnh án</div>
        )}
      </div>
    </div>
  );
}
