import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  getAuthUser,
  getPaginationParams,
  sendSuccess,
  validateBody,
  createMeta,
  error,
} from "@/lib/api-utils"
import { createAppointmentSchema } from "@/lib/validations"
import { addDays } from "date-fns"

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const { searchParams } = request.nextUrl
  const status = searchParams.get("status")
  const doctorId = searchParams.get("doctorId")
  const patientId = searchParams.get("patientId")
  const dateFrom = searchParams.get("dateFrom")
  const dateTo = searchParams.get("dateTo")
  const { page, pageSize, skip } = getPaginationParams({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  })

  // Build where clause
  const where: any = {
    isActive: { $ne: true },
  }

  if (status) {
    where.status = status
  }
  if (doctorId) {
    where.doctorId = doctorId
  }
  if (patientId) {
    where.patientId = patientId
  }
  if (dateFrom) {
    where.scheduledDate = { $gte: new Date(dateFrom) }
  }
  if (dateTo) {
    if (!where.scheduledDate) where.scheduledDate = {}
    where.scheduledDate.$lte = new Date(dateTo)
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        ...(status && { status }),
        ...(doctorId && { doctorId }),
        ...(patientId && { patientId }),
        ...(dateFrom && { scheduledDate: { gte: new Date(dateFrom) } }),
        ...(dateTo && {
          scheduledDate: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            lte: new Date(dateTo),
          },
        }),
      },
      skip,
      take: pageSize,
      orderBy: { scheduledDate: "asc" },
      include: {
        patient: { select: { id: true, patientCode: true, fullName: true } },
        doctor: { select: { id: true, user: { select: { fullName: true } } } },
        room: { select: { id: true, name: true } },
      },
    }),
    prisma.appointment.count({
      where: {
        ...(status && { status }),
        ...(doctorId && { doctorId }),
        ...(patientId && { patientId }),
        ...(dateFrom && { scheduledDate: { gte: new Date(dateFrom) } }),
        ...(dateTo && {
          scheduledDate: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            lte: new Date(dateTo),
          },
        }),
      },
    }),
  ])

  const meta = createMeta(page, pageSize, total)
  return sendSuccess({ appointments }, 200, meta)
})

export const POST = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const input = await validateBody(request, createAppointmentSchema)

  // Generate appointment code
  const lastAppointment = await prisma.appointment.findFirst({
    orderBy: { appointmentCode: "desc" },
    select: { appointmentCode: true },
  })

  let nextCode = "APT001"
  if (lastAppointment) {
    const lastNum = parseInt(lastAppointment.appointmentCode.replace("APT", ""))
    nextCode = `APT${String(lastNum + 1).padStart(3, "0")}`
  }

  const appointment = await prisma.appointment.create({
    data: {
      ...input,
      appointmentCode: nextCode,
      scheduledDate: new Date(input.scheduledDate),
    },
    include: {
      patient: { select: { id: true, patientCode: true, fullName: true } },
      doctor: { select: { id: true, user: { select: { fullName: true } } } },
      room: { select: { id: true, name: true } },
    },
  })

  return sendSuccess({ appointment }, 201)
})
