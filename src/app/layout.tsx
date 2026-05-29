import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { prisma } from '@/db/prisma';
import PWARegister from '@/components/PWARegister';

// Metadata động — đọc tên phòng khám + SEO từ cấu hình admin (Clinic / SiteSettings)
// để tiêu đề tab, manifest, PWA luôn khớp với tên đã đặt trong Cài đặt.
export async function generateMetadata(): Promise<Metadata> {
  let clinicName = 'Phòng Khám';
  let seoTitle: string | undefined;
  let seoDescription: string | undefined;

  try {
    const [clinic, settings] = await Promise.all([
      prisma.clinic.findFirst({ select: { name: true } }),
      prisma.siteSettings.findUnique({
        where: { id: 'singleton' },
        select: { seoTitle: true, seoDescription: true },
      }),
    ]);
    if (clinic?.name) clinicName = clinic.name;
    seoTitle = settings?.seoTitle ?? undefined;
    seoDescription = settings?.seoDescription ?? undefined;
  } catch {
    // DB chưa sẵn sàng (vd lúc build) — dùng giá trị mặc định
  }

  const shortName = clinicName.replace(/^Phòng Khám\s*(Đa Khoa\s*)?/i, '').trim() || clinicName;

  return {
    title: seoTitle || `${clinicName} — Chăm sóc sức khỏe toàn diện`,
    description:
      seoDescription ||
      `${clinicName} — đặt lịch khám, mua thuốc & TPCN, tư vấn online. Đội ngũ bác sĩ chuyên môn cao, dịch vụ chu đáo.`,
    manifest: '/manifest.json',
    applicationName: clinicName,
    appleWebApp: {
      capable: true,
      title: shortName,
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
}

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
