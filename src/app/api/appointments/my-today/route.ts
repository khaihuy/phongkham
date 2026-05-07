import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess } from "@/lib/api-utils"

export const GET = apiHandler(async () => {
  const user = await getAuthUser()

  // Find the doctor record for the logged-in user
  const doctor = await prisma.doctor.findUnique({
    where: { userId: user.id },
  })

  if (!doctor) {
    return sendSuccess([])
  }

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
      scheduledDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    orderBy: { scheduledDate: "asc" },
    include: {
      patient: { select: { id: true, patientCode: true, fullName: true, phone: true } },
      doctor: { select: { id: true, user: { select: { fullName: true } } } },
      room: { select: { id: true, name: true } },
    },
  })

  return sendSuccess(appointments)
})
