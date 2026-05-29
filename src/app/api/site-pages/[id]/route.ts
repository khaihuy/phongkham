import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/db/prisma"
import { apiHandler, requireRole, sendSuccess, error } from "@/lib/api-utils"

const updateSitePageSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(2).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  footerGroup: z.enum(["SUPPORT", "ABOUT", "LEGAL"]).nullable().optional(),
  footerLabel: z.string().nullable().optional(),
  linkUrl: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
})

export const GET = apiHandler(async (_request: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(["ADMIN", "DOCTOR"])
  const page = await prisma.sitePage.findUnique({ where: { id: params.id } })
  if (!page) throw error("NOT_FOUND", 404, "Không tìm thấy trang")
  return sendSuccess(page)
})

export const PUT = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(["ADMIN", "DOCTOR"])

  const existing = await prisma.sitePage.findUnique({ where: { id: params.id } })
  if (!existing) throw error("NOT_FOUND", 404, "Không tìm thấy trang")

  const body = await request.json()
  const input = updateSitePageSchema.parse(body)

  if (input.slug && input.slug !== existing.slug) {
    const conflict = await prisma.sitePage.findUnique({ where: { slug: input.slug } })
    if (conflict) throw error("CONFLICT", 409, "Slug đã được dùng bởi trang khác")
  }

  const updated = await prisma.sitePage.update({
    where: { id: params.id },
    data: {
      ...input,
      footerLabel: input.footerLabel === "" ? null : input.footerLabel,
      linkUrl: input.linkUrl === "" ? null : input.linkUrl,
    },
  })
  return sendSuccess(updated)
})

export const DELETE = apiHandler(async (_request: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(["ADMIN"])
  const existing = await prisma.sitePage.findUnique({ where: { id: params.id } })
  if (!existing) throw error("NOT_FOUND", 404, "Không tìm thấy trang")
  await prisma.sitePage.update({ where: { id: params.id }, data: { deletedAt: new Date() } })
  return sendSuccess({ deleted: true })
})
