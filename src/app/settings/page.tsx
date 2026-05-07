'use client';

import { useSession, signOut } from 'next-auth/react';
import { LogOut, User, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900">Cài đặt</h1>

      {/* Profile Section */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-sky-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{session?.user?.name}</h2>
            <p className="text-gray-600">{session?.user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Shield className="w-4 h-4 text-sky-600" />
              <span className="text-sm font-medium text-sky-600">
                {session?.user?.role === 'ADMIN' && 'Quản trị viên'}
                {session?.user?.role === 'DOCTOR' && 'Bác sĩ'}
                {session?.user?.role === 'RECEPTIONIST' && 'Lễ tân'}
                {session?.user?.role === 'PHARMACIST' && 'Dược sĩ'}
                {session?.user?.role === 'ACCOUNTANT' && 'Kế toán'}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Thông tin tài khoản</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tên đăng nhập:</span>
              <span className="font-medium text-gray-900">{session?.user?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-900">{session?.user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vai trò:</span>
              <span className="font-medium text-gray-900">
                {session?.user?.role === 'ADMIN' && 'Quản trị viên'}
                {session?.user?.role === 'DOCTOR' && 'Bác sĩ'}
                {session?.user?.role === 'RECEPTIONIST' && 'Lễ tân'}
                {session?.user?.role === 'PHARMACIST' && 'Dược sĩ'}
                {session?.user?.role === 'ACCOUNTANT' && 'Kế toán'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Section */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
