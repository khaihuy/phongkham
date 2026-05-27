import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  getAuthUser,
  sendSuccess,
  validateBody,
  error,
} from "@/lib/api-utils"
import { updateAppointmentSchema, appointmentStatusSchema } from "@/lib/validations"

export const GET = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      doctor: { include: { user: true, specialty: true } },
      room: true,
      medicalRecord: {
        include: {
          diagnoses: true,
          prescriptions: { include: { items: { include: { drug: true } } } },
          labOrders: true,
          imageOrders: true,
        },
      },
      invoice: { include: { items: true } },
    },
  })

  if (!appointment) {
    throw error("NOT_FOUND", 404, "Cuộc hẹn không tìm thấy")
  }

  return sendSuccess(appointment)
})

export const PUT = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const input = await validateBody(request, updateAppointmentSchema)

  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      ...input,
      ...(input.scheduledDate && { scheduledDate: new Date(input.scheduledDate) }),
    },
    include: {
      patient: { select: { id: true, patientCode: true, fullName: true } },
      doctor: { select: { id: true, user: { select: { fullName: true } } } },
    },
  })

  return sendSuccess(appointment)
})

export const DELETE = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      status: "CANCELLED",
      cancelReason: "Hủy cuộc hẹn",
      deletedAt: new Date(),
    },
  })

  return sendSuccess(appointment)
})

export const PATCH = apiHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    await getAuthUser()

    const input = await validateBody(request, appointmentStatusSchema)

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        ...(input.status && { status: input.status }),
        ...(input.cancelReason && { cancelReason: input.cancelReason }),
        ...(input.vitalSigns !== undefined && { vitalSigns: input.vitalSigns }),
      },
      include: {
        patient: { select: { id: true, fullName: true } },
        doctor: { select: { id: true, user: { select: { fullName: true } } } },
      },
    })

    return sendSuccess(appointment)
  }
)
