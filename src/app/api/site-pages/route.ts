// CRUD SitePage — quản lý trang nội dung tĩnh hiển thị ở footer website
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

const createSitePageSchema = z.object({
  slug: z.string().min(2, "Slug ít nhất 2 ký tự").regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số, dấu gạch nối"),
  title: z.string().min(2, "Tiêu đề ít nhất 2 ký tự"),
  content: z.string().min(1, "Nội dung không được trống"),
  excerpt: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
  footerGroup: z.enum(["SUPPORT", "ABOUT", "LEGAL"]).nullable().optional(),
  footerLabel: z.string().optional(),
  linkUrl: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
})

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const { searchParams } = request.nextUrl
  const status = searchParams.get("status")
  const footerGroup = searchParams.get("footerGroup")
  const searchTerm = searchParams.get("search") ?? ""
  const { page, pageSize, skip } = getPaginationParams({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  })

  const where: any = { deletedAt: null }
  if (status) where.status = status
  if (footerGroup) where.footerGroup = footerGroup
  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm, mode: "insensitive" as any } },
      { slug: { contains: searchTerm } },
    ]
  }

  const [pages, total] = await Promise.all([
    prisma.sitePage.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ footerGroup: "asc" }, { sortOrder: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.sitePage.count({ where }),
  ])

  return sendSuccess(pages, 200, createMeta(page, pageSize, total))
})

export const POST = apiHandler(async (request: NextRequest) => {
  await requireRole(["ADMIN", "DOCTOR"])

  const body = await request.json()
  const input = createSitePageSchema.parse(body)

  const existing = await prisma.sitePage.findUnique({ where: { slug: input.slug } })
  if (existing) throw error("CONFLICT", 409, "Slug đã tồn tại")

  const pageRecord = await prisma.sitePage.create({
    data: {
      ...input,
      footerGroup: input.footerGroup ?? null,
      footerLabel: input.footerLabel || null,
      linkUrl: input.linkUrl || null,
    },
  })

  return sendSuccess(pageRecord, 201)
})
