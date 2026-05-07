import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  getAuthUser,
  sendSuccess,
  error,
} from "@/lib/api-utils"

export const GET = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const imageOrder = await prisma.imageOrder.findUnique({
    where: { id: params.id },
    include: {
      medicalRecord: {
        include: {
          patient: {
            select: { id: true, fullName: true, code: true },
          },
        },
      },
    },
  })

  if (!imageOrder) {
    throw error("NOT_FOUND", 404, "Không tìm thấy chẩn đoán hình ảnh")
  }

  return sendSuccess(imageOrder)
})

export const PUT = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const imageOrder = await prisma.imageOrder.findUnique({ where: { id: params.id } })
  if (!imageOrder) {
    throw error("NOT_FOUND", 404, "Không tìm thấy chẩn đoán hình ảnh")
  }

  const body = await request.json()
  const { result, status, completedAt, imageUrl, notes } = body

  const updated = await prisma.imageOrder.update({
    where: { id: params.id },
    data: {
      ...(result !== undefined && { result }),
      ...(status !== undefined && { status }),
      ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt) : null }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(notes !== undefined && { notes }),
    },
    include: {
      medicalRecord: {
        include: {
          patient: {
            select: { id: true, fullName: true, code: true },
          },
        },
      },
    },
  })

  return sendSuccess(updated)
})
