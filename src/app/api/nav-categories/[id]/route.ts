import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/db/prisma"
import { apiHandler, requireRole, sendSuccess, error } from "@/lib/api-utils"

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  icon: z.string().optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
  items: z.array(z.object({
    id: z.string().optional(),
    label: z.string().min(1),
    href: z.string().min(1),
    sortOrder: z.coerce.number().int().default(0),
    isActive: z.boolean().default(true),
  })).optional(),
})

export const GET = apiHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(["ADMIN"])
  const cat = await prisma.navCategory.findUnique({
    where: { id: params.id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  })
  if (!cat) throw error("NOT_FOUND", 404, "Không tìm thấy danh mục")
  return sendSuccess(cat)
})

export const PUT = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(["ADMIN"])
  const existing = await prisma.navCategory.findUnique({ where: { id: params.id } })
  if (!existing) throw error("NOT_FOUND", 404, "Không tìm thấy danh mục")

  const body = await request.json()
  const { items, ...catData } = updateSchema.parse(body)

  if (items !== undefined) {
    // Replace all items
    await prisma.navItem.deleteMany({ where: { categoryId: params.id } })
    await prisma.navItem.createMany({
      data: items.map((item) => ({ ...item, id: undefined, categoryId: params.id })),
    })
  }

  const updated = await prisma.navCategory.update({
    where: { id: params.id },
    data: catData,
    include: { items: { orderBy: { sortOrder: "asc" } } },
  })
  return sendSuccess(updated)
})

export const DELETE = apiHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(["ADMIN"])
  const existing = await prisma.navCategory.findUnique({ where: { id: params.id } })
  if (!existing) throw error("NOT_FOUND", 404, "Không tìm thấy danh mục")
  await prisma.navCategory.delete({ where: { id: params.id } })
  return sendSuccess({ deleted: true })
})
