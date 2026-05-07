import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess, error } from "@/lib/api-utils"

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const { searchParams } = request.nextUrl
  const dateFrom = searchParams.get("dateFrom")
  const dateTo = searchParams.get("dateTo")

  if (!dateFrom || !dateTo) {
    throw error("BAD_REQUEST", 400, "dateFrom and dateTo are required")
  }

  // Get appointments by status
  const statusCount = await Promise.all([
    prisma.appointment.count({
      where: {
        scheduledDate: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
        status: "COMPLETED",
      },
    }),
    prisma.appointment.count({
      where: {
        scheduledDate: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
        status: "CANCELLED",
      },
    }),
    prisma.appointment.count({
      where: {
        scheduledDate: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
        status: "PENDING",
      },
    }),
  ])

  // Get appointments by doctor
  const appointmentsByDoctor = await prisma.doctor.findMany({
    where: {
      appointments: {
        some: {
          scheduledDate: {
            gte: new Date(dateFrom),
            lte: new Date(dateTo),
          },
        },
      },
    },
    select: {
      id: true,
      user: {
        select: {
          fullName: true,
        },
      },
      _count: {
        select: {
          appointments: {
            where: {
              scheduledDate: {
                gte: new Date(dateFrom),
                lte: new Date(dateTo),
              },
              status: "COMPLETED",
            },
          },
        },
      },
    },
  })

  // Get appointments by type
  const appointmentsByType = await prisma.appointment.groupBy({
    by: ["type"],
    where: {
      scheduledDate: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      },
    },
    _count: true,
  })

  return sendSuccess({
    statusBreakdown: {
      completed: statusCount[0],
      cancelled: statusCount[1],
      pending: statusCount[2],
      total: statusCount[0] + statusCount[1] + statusCount[2],
    },
    appointmentsByDoctor: appointmentsByDoctor.map((doc) => ({
      doctorId: doc.id,
      doctorName: doc.user.fullName,
      appointmentCount: doc._count.appointments,
    })),
    appointmentsByType: appointmentsByType.map((item) => ({
      type: item.type,
      count: item._count,
    })),
  })
})
