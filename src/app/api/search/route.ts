import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess } from "@/lib/api-utils"

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()
  const q = request.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) return sendSuccess({ patients: [], invoices: [], appointments: [] })

  const [patients, invoices, appointments] = await Promise.all([
    prisma.patient.findMany({
      where: {
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { patientCode: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
        deletedAt: null,
      },
      select: { id: true, patientCode: true, fullName: true, phone: true, dateOfBirth: true },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: {
        OR: [
          { invoiceCode: { contains: q, mode: "insensitive" } },
          { patient: { fullName: { contains: q, mode: "insensitive" } } },
        ],
        deletedAt: null,
      },
      select: {
        id: true, invoiceCode: true, status: true, totalAmount: true, createdAt: true,
        patient: { select: { fullName: true } },
      },
      take: 5,
    }),
    prisma.appointment.findMany({
      where: {
        OR: [
          { appointmentCode: { contains: q, mode: "insensitive" } },
          { patient: { fullName: { contains: q, mode: "insensitive" } } },
        ],
        deletedAt: null,
      },
      select: {
        id: true, appointmentCode: true, status: true, scheduledDate: true, scheduledTime: true,
        patient: { select: { fullName: true } },
        doctor: { select: { user: { select: { fullName: true } } } },
      },
      take: 5,
      orderBy: { scheduledDate: "desc" },
    }),
  ])

  return sendSuccess({ patients, invoices, appointments })
})
