import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/db/prisma"
import { apiHandler, requireRole, sendSuccess, error } from "@/lib/api-utils"

const updatePostSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(2).optional(),
  excerpt: z.string().nullable().optional(),
  content: z.string().min(1).optional(),
  coverImageUrl: z.string().url().nullable().optional().or(z.literal("")),
  tag: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
})

export const GET = apiHandler(async (_request: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(["ADMIN", "DOCTOR"])
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: { author: { select: { id: true, fullName: true } } },
  })
  if (!post) throw error("NOT_FOUND", 404, "Không tìm thấy bài viết")
  return sendSuccess(post)
})

export const PUT = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(["ADMIN", "DOCTOR"])

  const existing = await prisma.post.findUnique({ where: { id: params.id } })
  if (!existing) throw error("NOT_FOUND", 404, "Không tìm thấy bài viết")

  const body = await request.json()
  const input = updatePostSchema.parse(body)

  // Check slug conflict
  if (input.slug && input.slug !== existing.slug) {
    const conflict = await prisma.post.findUnique({ where: { slug: input.slug } })
    if (conflict) throw error("CONFLICT", 409, "Slug đã được dùng bởi bài khác")
  }

  // Auto-set publishedAt khi chuyển từ DRAFT/ARCHIVED → PUBLISHED
  const willPublish = input.status === "PUBLISHED" && existing.status !== "PUBLISHED"

  const updated = await prisma.post.update({
    where: { id: params.id },
    data: {
      ...input,
      coverImageUrl: input.coverImageUrl === "" ? null : input.coverImageUrl,
      ...(willPublish && { publishedAt: new Date() }),
    },
    include: { author: { select: { id: true, fullName: true } } },
  })
  return sendSuccess(updated)
})

export const DELETE = apiHandler(async (_request: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(["ADMIN"])
  const existing = await prisma.post.findUnique({ where: { id: params.id } })
  if (!existing) throw error("NOT_FOUND", 404, "Không tìm thấy bài viết")
  // Soft delete
  await prisma.post.update({ where: { id: params.id }, data: { deletedAt: new Date() } })
  return sendSuccess({ deleted: true })
})
