'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  UserRound,
  FileText,
  CreditCard,
  Stethoscope,
  X,
  Pill,
  BarChart3,
  Settings,
  UserCog,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/patients', label: 'Bệnh nhân', icon: Users },
  { href: '/appointments', label: 'Lịch hẹn', icon: CalendarDays },
  { href: '/doctors', label: 'Bác sĩ', icon: UserRound },
  { href: '/medical-records', label: 'Hồ sơ bệnh án', icon: FileText },
  { href: '/pharmacy', label: 'Dược phẩm', icon: Pill },
  { href: '/billing', label: 'Thanh toán', icon: CreditCard },
  { href: '/reports', label: 'Báo cáo', icon: BarChart3 },
  { href: '/settings/users', label: 'Người dùng', icon: UserCog },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 sidebar-gradient z-30 flex flex-col transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Phòng Khám</p>
              <p className="text-primary-200 text-xs">Đa Khoa An Khang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/settings'
              ? pathname === '/settings'
              : item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-white text-primary-700 shadow-md'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-primary-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              A
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">Quản trị viên</p>
              <p className="text-primary-200 text-xs truncate">admin@phongkham.vn</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
