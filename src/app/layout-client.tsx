'use client';

import { useState, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { StoreProvider } from '@/lib/store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

const pageTitles: Record<string, string> = {
  '/dashboard': 'Tổng quan',
  '/patients': 'Bệnh nhân',
  '/appointments': 'Lịch hẹn',
  '/doctors': 'Bác sĩ',
  '/medical-records': 'Hồ sơ bệnh án',
  '/billing': 'Thanh toán',
  '/pharmacy': 'Dược sĩ',
  '/reports': 'Báo cáo',
  '/settings': 'Cài đặt',
};

function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();
  const title = pageTitles[pathname] || 'Phòng Khám CRM';

  // Redirect to login if not authenticated and not on login page
  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/login') {
      router.push('/login');
    }
  }, [status, pathname, router]);

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Show login page or redirect
  if (!session && pathname !== '/login') {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function LayoutClientWrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <AppLayout>{children}</AppLayout>
        <Toaster position="top-right" />
      </StoreProvider>
    </QueryClientProvider>
  );
}
