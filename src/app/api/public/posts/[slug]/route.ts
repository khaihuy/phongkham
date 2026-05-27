import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, sendSuccess, error } from "@/lib/api-utils"

export const GET = apiHandler(async (_request: NextRequest, { params }: { params: { slug: string } }) => {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    include: { author: { select: { fullName: true } } },
  })

  if (!post || post.status !== "PUBLISHED" || post.deletedAt) {
    throw error("NOT_FOUND", 404, "Không tìm thấy bài viết")
  }

  // Tăng view count (fire-and-forget không await để response nhanh)
  prisma.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => { /* ignore */ })

  return sendSuccess(post)
})
