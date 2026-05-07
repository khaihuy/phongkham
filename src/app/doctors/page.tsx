'use client';

import { useState } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { Plus, Search, Pencil, Trash2, AlertCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DoctorsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data: doctorsData, isLoading, error } = useDoctors(page, 10, { search });

  const doctors = doctorsData?.data || [];
  const meta = doctorsData?.meta;

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
        <h1 className="text-3xl font-bold text-gray-900">Bác sĩ</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors">
          <Plus className="w-5 h-5" />
          Thêm bác sĩ
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm bác sĩ..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-sky-600" />
          </div>
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
                <tbody className="divide-y divide-gray-200">
                  {doctors.map((doctor: any) => (
                    <tr key={doctor.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{doctor.user.fullName}</td>
                      <td className="px-6 py-4 text-gray-600">{doctor.specialty.name}</td>
                      <td className="px-6 py-4 text-gray-600">{doctor.licenseNo}</td>
                      <td className="px-6 py-4 text-gray-600">{doctor.yearsOfExp} năm</td>
                      <td className="px-6 py-4 text-gray-600">
                        {Number(doctor.consultFee).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-6 py-4 flex items-center justify-center gap-2">
                        <Link href={`/doctors/${doctor.id}`}>
                          <button className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </Link>
                        <button className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                  Trang {meta.page} / {meta.totalPages} ({meta.total} bác sĩ)
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
          <div className="flex items-center justify-center h-64 text-gray-500">Không có bác sĩ</div>
        )}
      </div>
    </div>
  );
}
