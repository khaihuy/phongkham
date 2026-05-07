import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess } from "@/lib/api-utils"

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()
  const { searchParams } = request.nextUrl
  const dateFrom = searchParams.get("dateFrom")
  const dateTo = searchParams.get("dateTo")

  const whereDate: any = {}
  if (dateFrom) whereDate.gte = new Date(dateFrom)
  if (dateTo) {
    const end = new Date(dateTo)
    end.setHours(23, 59, 59, 999)
    whereDate.lte = end
  }

  const doctors = await prisma.doctor.findMany({
    include: {
      user: { select: { fullName: true } },
      specialty: { select: { name: true } },
      appointments: {
        where: Object.keys(whereDate).length > 0 ? { scheduledDate: whereDate } : {},
        include: {
          invoice: { select: { totalAmount: true, status: true } },
        },
      },
    },
  })

  const stats = doctors.map(doc => {
    const apts = doc.appointments
    const completed = apts.filter(a => a.status === 'COMPLETED').length
    const revenue = apts
      .filter(a => a.invoice?.status === 'PAID')
      .reduce((sum, a) => sum + Number(a.invoice?.totalAmount ?? 0), 0)
    return {
      id: doc.id,
      name: doc.user.fullName,
      specialty: doc.specialty?.name ?? '—',
      totalAppointments: apts.length,
      completed,
      revenue,
    }
  }).sort((a, b) => b.totalAppointments - a.totalAppointments)

  return sendSuccess(stats)
})
