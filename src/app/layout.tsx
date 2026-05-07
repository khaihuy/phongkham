import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import LayoutClient from './layout-client';

export const metadata = {
  title: 'Phòng Khám Đa Khoa An Khang - CRM',
  description: 'Hệ thống quản lý phòng khám tư',
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
      </body>
    </html>
  );
}
