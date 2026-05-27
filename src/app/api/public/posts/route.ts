import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getPaginationParams, sendSuccess, createMeta } from "@/lib/api-utils"

export const GET = apiHandler(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl
  const tag = searchParams.get("tag")
  const { page, pageSize, skip } = getPaginationParams({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  })

  const where: any = { status: "PUBLISHED", deletedAt: null }
  if (tag) where.tag = tag

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { publishedAt: "desc" },
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
    }),
    prisma.post.count({ where }),
  ])

  return sendSuccess(posts, 200, createMeta(page, pageSize, total))
})
