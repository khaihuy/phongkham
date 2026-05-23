import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import type { Viewport } from 'next';
import LayoutClient from './layout-client';
import PWARegister from '@/components/PWARegister';

export const metadata = {
  title: 'Phòng Khám CRM',
  description: 'Hệ thống quản lý phòng khám tư',
  manifest: '/manifest.json',
  applicationName: 'Phòng Khám CRM',
  appleWebApp: {
    capable: true,
    title: 'PhongKham',
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
  themeColor: '#0284c7',
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <SessionProvider>
          <LayoutClient>{children}</LayoutClient>
        </SessionProvider>
        <PWARegister />
      </body>
    </html>
  );
}
