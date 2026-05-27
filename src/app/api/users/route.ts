import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import bcrypt from "bcryptjs"
import { apiHandler, getAuthUser, requireRole, sendSuccess, getPaginationParams, createMeta, error } from "@/lib/api-utils"
import { z } from "zod"

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "DOCTOR", "RECEPTIONIST", "PHARMACIST", "ACCOUNTANT"]),
})

export const GET = apiHandler(async (request: NextRequest) => {
  await requireRole(["ADMIN"])
  const { searchParams } = request.nextUrl
  const roleFilter = searchParams.get("role")
  const { page, pageSize, skip } = getPaginationParams({ page: searchParams.get("page"), pageSize: searchParams.get("pageSize") })
  const where: any = { deletedAt: null }
  if (roleFilter) where.role = roleFilter
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip, take: pageSize,
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, username: true, fullName: true, phone: true, role: true, isActive: true, createdAt: true, lastLoginAt: true },
    }),
    prisma.user.count({ where }),
  ])
  return sendSuccess(users, 200, createMeta(page, pageSize, total))
})

export const POST = apiHandler(async (request: NextRequest) => {
  await requireRole(["ADMIN"])
  const body = await request.json()
  const input = createUserSchema.parse(body)
  const exists = await prisma.user.findFirst({ where: { OR: [{ email: input.email }, { username: input.username }] } })
  if (exists) throw error("CONFLICT", 409, "Email hoặc username đã tồn tại")
  const passwordHash = await bcrypt.hash(input.password, 10)
  const user = await prisma.user.create({
    data: { ...input, passwordHash, password: undefined } as any,
    select: { id: true, email: true, username: true, fullName: true, phone: true, role: true, isActive: true, createdAt: true },
  })
  return sendSuccess(user, 201)
})
