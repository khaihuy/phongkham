import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess } from "@/lib/api-utils"
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns"

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const today = new Date()
  const todayStart = startOfDay(today)
  const todayEnd = endOfDay(today)

  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  // Get today's appointments
  const todayAppointments = await prisma.appointment.findMany({
    where: {
      scheduledDate: {
        gte: todayStart,
        lte: todayEnd,
      },
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
      appointmentCode: true,
    },
  })

  const completedToday = todayAppointments.filter((a) => a.status === "COMPLETED").length
  const pendingToday = todayAppointments.filter((a) => a.status === "PENDING").length
  const inProgressToday = todayAppointments.filter((a) => a.status === "IN_PROGRESS").length

  // Get total patients
  const totalPatients = await prisma.patient.count({
    where: { isActive: true },
  })

  // Get new patients this month
  const newPatientsThisMonth = await prisma.patient.count({
    where: {
      isActive: true,
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  })

  // Get revenue this month
  const monthRevenue = await prisma.invoice.aggregate({
    where: {
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
      status: {
        in: ["PAID", "PARTIAL"],
      },
    },
    _sum: {
      totalAmount: true,
    },
  })

  const totalRevenue = monthRevenue._sum.totalAmount || 0

  // Get unpaid invoices
  const unpaidInvoices = await prisma.invoice.findMany({
    where: {
      status: {
        in: ["UNPAID", "OVERDUE"],
      },
    },
    select: {
      id: true,
      invoiceCode: true,
      totalAmount: true,
    },
    take: 5,
  })

  const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0n)

  // Get active doctors
  const activeDoctors = await prisma.doctor.count({
    where: { isActive: true },
  })

  // Get appointments this month
  const appointmentsThisMonth = await prisma.appointment.count({
    where: {
      scheduledDate: {
        gte: monthStart,
        lte: monthEnd,
      },
      status: {
        in: ["COMPLETED", "IN_PROGRESS"],
      },
    },
  })

  // Get recent appointments
  const recentAppointments = await prisma.appointment.findMany({
    where: {
      deletedAt: null,
    },
    take: 10,
    orderBy: { scheduledDate: "desc" },
    include: {
      patient: { select: { id: true, fullName: true, patientCode: true } },
      doctor: { select: { id: true, user: { select: { fullName: true } } } },
    },
  })

  return sendSuccess({
    stats: {
      todayAppointmentsTotal: todayAppointments.length,
      todayAppointmentsCompleted: completedToday,
      todayAppointmentsPending: pendingToday,
      todayAppointmentsInProgress: inProgressToday,
      totalPatients,
      newPatientsThisMonth,
      monthRevenue: totalRevenue.toString(),
      unpaidInvoicesCount: unpaidInvoices.length,
      totalUnpaid: totalUnpaid.toString(),
      activeDoctors,
      appointmentsThisMonth,
    },
    recentAppointments,
    unpaidInvoices: unpaidInvoices.map((inv) => ({
      ...inv,
      totalAmount: inv.totalAmount.toString(),
    })),
  })
})
