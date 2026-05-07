import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  getAuthUser,
  sendSuccess,
  sendError,
  validateBody,
  error,
} from "@/lib/api-utils"
import { updatePatientSchema } from "@/lib/validations"

export const GET = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      allergies: true,
      vitals: {
        orderBy: { recordedAt: "desc" },
      },
      appointments: {
        where: { status: { not: "CANCELLED" } },
        orderBy: { scheduledDate: "desc" },
        take: 10,
      },
      medicalRecords: {
        orderBy: { visitDate: "desc" },
        take: 5,
      },
    },
  })

  if (!patient) {
    throw error("NOT_FOUND", 404, "Bệnh nhân không tìm thấy")
  }

  return sendSuccess(patient)
})

export const PUT = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const input = await validateBody(request, updatePatientSchema)

  const patient = await prisma.patient.update({
    where: { id: params.id },
    data: {
      ...input,
      ...(input.dateOfBirth && { dateOfBirth: new Date(input.dateOfBirth) }),
    },
    include: {
      allergies: true,
      vitals: true,
    },
  })

  return sendSuccess(patient)
})

export const DELETE = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  // Soft delete
  const patient = await prisma.patient.update({
    where: { id: params.id },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  })

  return sendSuccess(patient)
})
