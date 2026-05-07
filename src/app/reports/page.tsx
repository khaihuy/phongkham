'use client';

import { useState } from 'react';
import { AlertCircle, Loader, BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900">Báo cáo</h1>

      {/* Coming Soon */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-8">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Báo cáo sẽ sớm khả dụng</h2>
          <p className="text-gray-600 mb-6">Chúng tôi đang phát triển các tính năng báo cáo nâng cao</p>
          <div className="space-y-3 text-left max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-sky-600 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Báo cáo doanh thu</p>
                <p className="text-sm text-gray-600">Phân tích doanh thu theo ngày, tháng, năm</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-sky-600 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Báo cáo lịch hẹn</p>
                <p className="text-sm text-gray-600">Phân tích lịch hẹn theo bác sĩ, trạng thái</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-sky-600 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Báo cáo bệnh nhân</p>
                <p className="text-sm text-gray-600">Phân tích số lượng bệnh nhân mới, quay lại</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-sky-600 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Xuất Excel/PDF</p>
                <p className="text-sm text-gray-600">Xuất dữ liệu để phân tích chuyên sâu</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
