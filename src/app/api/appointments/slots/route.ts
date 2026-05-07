import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess, error } from "@/lib/api-utils"
import { format, parse, startOfDay, endOfDay } from "date-fns"

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const { searchParams } = request.nextUrl
  const doctorId = searchParams.get("doctorId")
  const appointmentDate = searchParams.get("date")

  if (!doctorId || !appointmentDate) {
    throw error("BAD_REQUEST", 400, "doctorId and date are required")
  }

  // Get doctor
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { schedules: true },
  })

  if (!doctor) {
    throw error("NOT_FOUND", 404, "Bác sĩ không tìm thấy")
  }

  // Get day of week for the appointment date
  const dateObj = new Date(appointmentDate)
  const dayOfWeek = format(dateObj, "EEEE").toUpperCase()

  // Find schedule for this day
  const schedule = doctor.schedules.find((s) => s.dayOfWeek === dayOfWeek && s.isActive)

  if (!schedule) {
    return sendSuccess({ slots: [] })
  }

  // Parse start and end times
  const [startHour, startMin] = schedule.startTime.split(":").map(Number)
  const [endHour, endMin] = schedule.endTime.split(":").map(Number)

  // Get existing appointments for this date
  const dateStart = startOfDay(dateObj)
  const dateEnd = endOfDay(dateObj)

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledDate: {
        gte: dateStart,
        lte: dateEnd,
      },
      status: {
        not: "CANCELLED",
      },
    },
    select: {
      scheduledTime: true,
      duration: true,
    },
  })

  // Generate available slots
  const slots: string[] = []
  let currentHour = startHour
  let currentMin = startMin

  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const timeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`

    // Check if slot is available
    const isBooked = existingAppointments.some((apt) => {
      const aptHour = parseInt(apt.scheduledTime.split(":")[0])
      const aptMin = parseInt(apt.scheduledTime.split(":")[1])
      const aptEnd = new Date()
      aptEnd.setHours(aptHour, aptMin + apt.duration)

      const slotEnd = new Date()
      slotEnd.setHours(currentHour, currentMin + schedule.slotMinutes)

      return (
        currentHour === aptHour && currentMin === aptMin
      )
    })

    if (!isBooked) {
      slots.push(timeStr)
    }

    // Add slot minutes
    currentMin += schedule.slotMinutes
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60)
      currentMin = currentMin % 60
    }
  }

  return sendSuccess({
    slots: slots.slice(0, schedule.maxSlots),
  })
})
