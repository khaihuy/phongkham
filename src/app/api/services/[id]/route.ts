import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  getAuthUser,
  sendSuccess,
  validateBody,
  error,
} from "@/lib/api-utils"
import { z } from "zod"

const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.number().min(0).optional(),
  unit: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const GET = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const service = await prisma.service.findUnique({
    where: { id: params.id },
    include: {
      clinic: { select: { id: true, name: true } },
    },
  })

  if (!service) {
    throw error("NOT_FOUND", 404, "Dịch vụ không tìm thấy")
  }

  return sendSuccess(service)
})

export const PUT = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const service = await prisma.service.findUnique({ where: { id: params.id } })
  if (!service) {
    throw error("NOT_FOUND", 404, "Dịch vụ không tìm thấy")
  }

  const input = await validateBody(request, updateServiceSchema)

  const updated = await prisma.service.update({
    where: { id: params.id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.unit !== undefined && { unit: input.unit }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
    include: {
      clinic: { select: { id: true, name: true } },
    },
  })

  return sendSuccess(updated)
})

export const DELETE = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const service = await prisma.service.findUnique({ where: { id: params.id } })
  if (!service) {
    throw error("NOT_FOUND", 404, "Dịch vụ không tìm thấy")
  }

  // Soft delete — set isActive to false
  const updated = await prisma.service.update({
    where: { id: params.id },
    data: { isActive: false },
  })

  return sendSuccess(updated)
})
