import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  getAuthUser,
  sendSuccess,
  validateBody,
  error,
} from "@/lib/api-utils"
import { updateDoctorSchema } from "@/lib/validations"

export const GET = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const doctor = await prisma.doctor.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      specialty: true,
      schedules: true,
      appointments: {
        where: { status: { not: "CANCELLED" } },
        orderBy: { scheduledDate: "desc" },
        take: 10,
      },
      branch: true,
    },
  })

  if (!doctor) {
    throw error("NOT_FOUND", 404, "Bác sĩ không tìm thấy")
  }

  return sendSuccess({ doctor })
})

export const PUT = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const input = await validateBody(request, updateDoctorSchema)

  const doctor = await prisma.doctor.update({
    where: { id: params.id },
    data: {
      ...input,
      ...(input.consultFee && { consultFee: parseFloat(input.consultFee) }),
    },
    include: {
      user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
      specialty: true,
      schedules: true,
    },
  })

  return sendSuccess({ doctor })
})

export const DELETE = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  // Soft delete
  const doctor = await prisma.doctor.update({
    where: { id: params.id },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  })

  return sendSuccess({ doctor })
})
