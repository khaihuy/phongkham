import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/db/prisma";
import { ArrowLeft, Phone } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await prisma.sitePage.findUnique({
    where: { slug: params.slug },
    select: { title: true, excerpt: true, seoTitle: true, seoDescription: true, status: true, deletedAt: true },
  });
  if (!page || page.status !== "PUBLISHED" || page.deletedAt) return {};
  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? page.excerpt ?? undefined,
  };
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function SitePageView({ params }: { params: { slug: string } }) {
  const [page, settings] = await Promise.all([
    prisma.sitePage.findUnique({ where: { slug: params.slug } }),
    prisma.siteSettings.findUnique({ where: { id: "singleton" }, select: { hotline: true } }),
  ]);

  if (!page || page.status !== "PUBLISHED" || page.deletedAt) notFound();

  const hotline = settings?.hotline;

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Trang chủ
      </Link>

      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{page.title}</h1>

      <p className="text-sm text-gray-400 mt-3 pb-4 border-b border-gray-200">
        Cập nhật: {fmtDate(page.updatedAt)}
      </p>

      {page.excerpt && <p className="text-lg text-gray-600 italic mt-6">{page.excerpt}</p>}

      <div
        className="prose prose-lg max-w-none mt-6 prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-brand-700"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />

      {hotline && (
        <div className="mt-12 p-6 bg-brand-50 rounded-xl text-center">
          <Phone className="w-8 h-8 text-brand-700 mx-auto mb-2" />
          <p className="font-semibold text-gray-900 mb-1">Cần hỗ trợ thêm?</p>
          <p className="text-sm text-gray-600 mb-3">Gọi hotline để được tư vấn trực tiếp</p>
          <a
            href={`tel:${hotline}`}
            className="inline-block px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium text-sm"
          >
            {hotline}
          </a>
        </div>
      )}
    </article>
  );
}
