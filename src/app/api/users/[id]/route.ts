import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import bcrypt from "bcryptjs"
import { apiHandler, requireRole, sendSuccess, error } from "@/lib/api-utils"
import { z } from "zod"

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "DOCTOR", "RECEPTIONIST", "PHARMACIST", "ACCOUNTANT"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
})

export const PUT = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(["ADMIN"])
  const body = await request.json()
  const input = updateSchema.parse(body)
  const data: any = { ...input }
  if (input.password) {
    data.passwordHash = await bcrypt.hash(input.password, 10)
    delete data.password
  }
  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, email: true, username: true, fullName: true, phone: true, role: true, isActive: true },
  })
  return sendSuccess(user)
})

export const DELETE = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(["ADMIN"])
  const user = await prisma.user.update({
    where: { id: params.id },
    data: { isActive: false, deletedAt: new Date() },
    select: { id: true, isActive: true },
  })
  return sendSuccess(user)
})
