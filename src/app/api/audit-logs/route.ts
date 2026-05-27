import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  requireRole,
  getPaginationParams,
  sendSuccess,
  createMeta,
} from "@/lib/api-utils"

export const GET = apiHandler(async (request: NextRequest) => {
  await requireRole(["ADMIN"])

  const { searchParams } = request.nextUrl
  const userId = searchParams.get("userId")
  const action = searchParams.get("action")
  const resource = searchParams.get("resource")
  const dateFrom = searchParams.get("dateFrom")
  const dateTo = searchParams.get("dateTo")
  const { page, pageSize, skip } = getPaginationParams({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  })

  const where: any = {}
  if (userId) where.userId = userId
  if (action) where.action = action
  if (resource) where.resource = resource
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) where.createdAt.lte = new Date(dateTo)
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { fullName: true, email: true, role: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  const meta = createMeta(page, pageSize, total)
  return sendSuccess(logs, 200, meta)
})
