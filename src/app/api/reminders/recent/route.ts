import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess } from "@/lib/api-utils"

export const GET = apiHandler(async () => {
  await getAuthUser()

  const reminders = await prisma.appointmentReminder.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
  })

  // Manually enrich with appointment + patient data
  const appointmentIds = [...new Set(reminders.map((r) => r.appointmentId))]
  const appointments = await prisma.appointment.findMany({
    where: { id: { in: appointmentIds } },
    include: {
      patient: { select: { fullName: true } },
    },
  })

  const appointmentMap = new Map(appointments.map((a) => [a.id, a]))

  const enriched = reminders.map((reminder) => ({
    ...reminder,
    appointment: appointmentMap.get(reminder.appointmentId) ?? null,
  }))

  return sendSuccess(enriched)
})
