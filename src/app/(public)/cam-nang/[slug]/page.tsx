import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/db/prisma";
import { ArrowLeft, BookOpen, Eye, Calendar } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    select: { title: true, excerpt: true, seoTitle: true, seoDescription: true, status: true },
  });
  if (!post || post.status !== "PUBLISHED") return {};
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
  };
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function PostDetailPage({ params }: { params: { slug: string } }) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    include: { author: { select: { fullName: true } } },
  });

  if (!post || post.status !== "PUBLISHED" || post.deletedAt) notFound();

  // Increment view count (fire-and-forget)
  prisma.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/cam-nang" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Cẩm nang
      </Link>

      {post.tag && (
        <span className="inline-block px-2 py-0.5 bg-brand-50 text-brand-700 text-xs rounded">
          {post.tag}
        </span>
      )}

      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 leading-tight">
        {post.title}
      </h1>

      <div className="flex items-center gap-4 text-sm text-gray-500 mt-4 pb-4 border-b border-gray-200">
        {post.author && <span>Bởi <strong className="text-gray-700">{post.author.fullName}</strong></span>}
        {post.publishedAt && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> {fmtDate(post.publishedAt)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" /> {post.viewCount + 1} lượt xem
        </span>
      </div>

      {post.coverImageUrl && (
        <img src={post.coverImageUrl} alt={post.title} className="w-full h-auto rounded-xl mt-6 object-cover" />
      )}

      {post.excerpt && (
        <p className="text-lg text-gray-600 italic mt-6">{post.excerpt}</p>
      )}

      <div
        className="prose prose-lg max-w-none mt-6 prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-brand-700"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <div className="mt-12 p-6 bg-brand-50 rounded-xl text-center">
        <BookOpen className="w-8 h-8 text-brand-700 mx-auto mb-2" />
        <p className="font-semibold text-gray-900 mb-1">Cần tư vấn thêm?</p>
        <p className="text-sm text-gray-600 mb-3">Đặt lịch khám với bác sĩ chuyên khoa của An Khang</p>
        <Link
          href="/dat-lich"
          className="inline-block px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium text-sm"
        >
          Đặt lịch ngay
        </Link>
      </div>
    </article>
  );
}
