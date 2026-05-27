// CRUD Post — quản lý bài viết Cẩm nang
import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  getAuthUser,
  getPaginationParams,
  sendSuccess,
  createMeta,
  error,
  requireRole,
} from "@/lib/api-utils"

const createPostSchema = z.object({
  slug: z.string().min(2, "Slug ít nhất 2 ký tự").regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số, dấu gạch nối"),
  title: z.string().min(2, "Tiêu đề ít nhất 2 ký tự"),
  excerpt: z.string().optional(),
  content: z.string().min(1, "Nội dung không được trống"),
  coverImageUrl: z.string().url("URL ảnh không hợp lệ").optional().or(z.literal("")),
  tag: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
})

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const { searchParams } = request.nextUrl
  const status = searchParams.get("status")
  const tag = searchParams.get("tag")
  const searchTerm = searchParams.get("search") ?? ""
  const { page, pageSize, skip } = getPaginationParams({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  })

  const where: any = { deletedAt: null }
  if (status) where.status = status
  if (tag) where.tag = tag
  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm, mode: "insensitive" as any } },
      { slug: { contains: searchTerm } },
    ]
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
      include: { author: { select: { id: true, fullName: true } } },
    }),
    prisma.post.count({ where }),
  ])

  return sendSuccess(posts, 200, createMeta(page, pageSize, total))
})

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireRole(["ADMIN", "DOCTOR"])

  const body = await request.json()
  const input = createPostSchema.parse(body)

  // Slug unique check
  const existing = await prisma.post.findUnique({ where: { slug: input.slug } })
  if (existing) throw error("CONFLICT", 409, "Slug đã tồn tại")

  const post = await prisma.post.create({
    data: {
      ...input,
      coverImageUrl: input.coverImageUrl || null,
      authorId: user.id,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
    },
    include: { author: { select: { id: true, fullName: true } } },
  })

  return sendSuccess(post, 201)
})
