"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import PublicHeader from "@/components/public/Header";
import PublicFooter from "@/components/public/Footer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, gcTime: 5 * 60_000 },
  },
});

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <PublicHeader />
        <main className="flex-1">{children}</main>
        <PublicFooter />
      </div>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
