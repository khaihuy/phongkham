import { ReactNode } from "react";
import { prisma } from "@/db/prisma";
import PublicShell from "@/components/public/PublicShell";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  // SSR — đọc Clinic + SiteSettings 1 lần, pass xuống Header/Footer
  // để Header/Footer luôn đồng bộ với cấu hình admin
  const [clinic, settings, footerPages] = await Promise.all([
    prisma.clinic.findFirst({
      select: {
        name: true,
        phone: true,
        email: true,
        address: true,
        licenseNo: true,
        logoUrl: true,
      },
    }),
    prisma.siteSettings.findUnique({
      where: { id: "singleton" },
      select: {
        hotline: true,
        promoBannerText: true,
        promoBannerUrl: true,
        facebookUrl: true,
        youtubeUrl: true,
        zaloUrl: true,
      },
    }),
    prisma.sitePage.findMany({
      where: { status: "PUBLISHED", deletedAt: null, footerGroup: { not: null } },
      orderBy: [{ footerGroup: "asc" }, { sortOrder: "asc" }],
      select: { slug: true, title: true, footerGroup: true, footerLabel: true, linkUrl: true },
    }),
  ]);

  const footerLinks = footerPages.map((p) => ({
    group: p.footerGroup as "SUPPORT" | "ABOUT" | "LEGAL",
    label: p.footerLabel || p.title,
    url: p.linkUrl || `/${p.slug}`,
  }));

  return <PublicShell site={{ clinic, settings, footerLinks }}>{children}</PublicShell>;
}
