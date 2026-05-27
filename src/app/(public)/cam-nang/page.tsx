import Link from "next/link";
import { prisma } from "@/db/prisma";
import { BookOpen, ArrowRight } from "lucide-react";
import { blogCoverByTag } from "@/lib/public-images";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("vi-VN");
}

export default async function CamNangPage() {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: { publishedAt: "desc" },
    take: 20,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImageUrl: true,
      tag: true,
      publishedAt: true,
      viewCount: true,
      author: { select: { fullName: true } },
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-brand-700" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cẩm nang sức khỏe</h1>
          <p className="text-sm text-gray-500">Bài viết & lời khuyên từ bác sĩ chuyên khoa</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-16 h-16 mx-auto opacity-30 mb-3" />
          <p>Chưa có bài viết nào</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/cam-nang/${post.slug}`}
              className="bg-white rounded-xl shadow-product hover:shadow-card transition overflow-hidden group"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={post.coverImageUrl ?? blogCoverByTag(post.tag)}
                  alt={post.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-4">
                {post.tag && (
                  <span className="inline-block px-2 py-0.5 bg-brand-50 text-brand-700 text-xs rounded">
                    {post.tag}
                  </span>
                )}
                <h2 className="font-bold text-gray-900 mt-2 line-clamp-2 min-h-[3rem] group-hover:text-brand-700">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{post.excerpt}</p>
                )}
                <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                  <span>{fmtDate(post.publishedAt!)}</span>
                  <span className="flex items-center gap-1">
                    {post.viewCount} lượt xem <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
