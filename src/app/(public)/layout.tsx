import { ReactNode } from "react";
import { prisma } from "@/db/prisma";
import PublicShell from "@/components/public/PublicShell";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  // SSR — đọc Clinic + SiteSettings 1 lần, pass xuống Header/Footer
  // để Header/Footer luôn đồng bộ với cấu hình admin
  const [clinic, settings] = await Promise.all([
    prisma.clinic.findFirst({
      select: {
        name: true,
        phone: true,
        email: true,
        address: true,
        licenseNo: true,
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
  ]);

  return <PublicShell site={{ clinic, settings }}>{children}</PublicShell>;
}
