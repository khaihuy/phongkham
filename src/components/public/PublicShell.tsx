"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import PublicHeader from "./Header";
import PublicFooter from "./Footer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, gcTime: 5 * 60_000 },
  },
});

export interface FooterLink {
  group: "SUPPORT" | "ABOUT" | "LEGAL";
  label: string;
  url: string;
}

export interface SiteContext {
  clinic: {
    name?: string;
    phone?: string;
    email?: string | null;
    address?: string;
    licenseNo?: string | null;
  } | null;
  settings: {
    hotline?: string;
    promoBannerText?: string | null;
    promoBannerUrl?: string | null;
    facebookUrl?: string | null;
    youtubeUrl?: string | null;
    zaloUrl?: string | null;
  } | null;
  footerLinks?: FooterLink[];
}

export default function PublicShell({ children, site }: { children: ReactNode; site: SiteContext }) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <PublicHeader site={site} />
        <main className="flex-1">{children}</main>
        <PublicFooter site={site} />
      </div>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
