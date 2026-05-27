import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import type { Viewport } from 'next';
import PWARegister from '@/components/PWARegister';

export const metadata = {
  title: 'Phòng Khám An Khang — Chăm sóc sức khỏe toàn diện',
  description: 'Phòng khám đa khoa An Khang — đặt lịch khám, mua thuốc & TPCN, tư vấn online. Đội ngũ bác sĩ chuyên môn cao, dịch vụ chu đáo.',
  manifest: '/manifest.json',
  applicationName: 'Phòng Khám An Khang',
  appleWebApp: {
    capable: true,
    title: 'An Khang',
    statusBarStyle: 'default' as const,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#1250DC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        <SessionProvider>{children}</SessionProvider>
        <PWARegister />
      </body>
    </html>
  );
}
