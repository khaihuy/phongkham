import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess } from "@/lib/api-utils"

// GET — unreviewed completed lab/image orders
export const GET = apiHandler(async (_request: NextRequest) => {
  const user = await getAuthUser()

  // For doctors, filter by their own patients; for others, show all
  const doctorFilter: any = {}
  if (user.role === "DOCTOR") {
    const doctor = await prisma.doctor.findFirst({ where: { userId: user.id } })
    if (doctor) doctorFilter.doctorId = doctor.id
  }

  const [labOrders, imageOrders] = await Promise.all([
    prisma.labOrder.findMany({
      where: {
        status: "COMPLETED",
        reviewedAt: null,
        medicalRecord: doctorFilter.doctorId
          ? { doctorId: doctorFilter.doctorId }
          : undefined,
      },
      include: {
        medicalRecord: {
          include: {
            patient: { select: { id: true, fullName: true, patientCode: true } },
          },
        },
      },
      orderBy: { resultDate: "desc" },
      take: 20,
    }),
    prisma.imageOrder.findMany({
      where: {
        status: "COMPLETED",
        reviewedAt: null,
        medicalRecord: doctorFilter.doctorId
          ? { doctorId: doctorFilter.doctorId }
          : undefined,
      },
      include: {
        medicalRecord: {
          include: {
            patient: { select: { id: true, fullName: true, patientCode: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  const notifications = [
    ...labOrders.map(o => ({
      id: o.id,
      type: "LAB" as const,
      name: o.testName,
      result: o.result,
      patientName: o.medicalRecord?.patient?.fullName ?? "—",
      patientCode: o.medicalRecord?.patient?.patientCode ?? "—",
      medicalRecordId: o.medicalRecordId,
      resultDate: o.resultDate ?? o.createdAt,
    })),
    ...imageOrders.map(o => ({
      id: o.id,
      type: "IMAGE" as const,
      name: o.imagingType,
      result: o.findings,
      patientName: o.medicalRecord?.patient?.fullName ?? "—",
      patientCode: o.medicalRecord?.patient?.patientCode ?? "—",
      medicalRecordId: o.medicalRecordId,
      resultDate: o.createdAt,
    })),
  ].sort((a, b) => new Date(b.resultDate).getTime() - new Date(a.resultDate).getTime())

  return sendSuccess({ notifications, count: notifications.length })
})

// POST — mark specific orders as reviewed
export const POST = apiHandler(async (request: NextRequest) => {
  await getAuthUser()
  const body = await request.json()
  const { labIds = [], imageIds = [] } = body as { labIds?: string[]; imageIds?: string[] }

  const now = new Date()
  await Promise.all([
    labIds.length > 0
      ? prisma.labOrder.updateMany({ where: { id: { in: labIds } }, data: { reviewedAt: now } })
      : Promise.resolve(),
    imageIds.length > 0
      ? prisma.imageOrder.updateMany({ where: { id: { in: imageIds } }, data: { reviewedAt: now } })
      : Promise.resolve(),
  ])

  return sendSuccess({ marked: labIds.length + imageIds.length })
})
