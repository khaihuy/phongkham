import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/db/prisma"
import { apiHandler, requireRole, sendSuccess, error } from "@/lib/api-utils"

const createSchema = z.object({
  title: z.string().min(1),
  icon: z.string().default("Tag"),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  items: z.array(z.object({
    label: z.string().min(1),
    href: z.string().min(1),
    sortOrder: z.coerce.number().int().default(0),
    isActive: z.boolean().default(true),
  })).default([]),
})

export const GET = apiHandler(async () => {
  const categories = await prisma.navCategory.findMany({
    include: { items: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  })
  return sendSuccess(categories)
})

export const POST = apiHandler(async (request: NextRequest) => {
  await requireRole(["ADMIN"])
  const body = await request.json()
  const input = createSchema.parse(body)
  const { items, ...catData } = input
  const category = await prisma.navCategory.create({
    data: {
      ...catData,
      items: { create: items },
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  })
  return sendSuccess(category, 201)
})
