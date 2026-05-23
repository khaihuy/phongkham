// Engine nhắc lịch hẹn:
// - Quét tất cả Appointment trong vòng N giờ tới (mặc định 24h)
// - reminderSent = false, status = PENDING/CONFIRMED
// - Gửi qua kênh được chọn (mặc định SMS), tạo AppointmentReminder
// - Đánh dấu appointment.reminderSent = true để khỏi gửi trùng
//
// Trong production nên đặt cron (hoặc Railway scheduled job) gọi
// POST /api/reminders/run mỗi giờ.

import { prisma } from "@/db/prisma"
import { getProvider, renderTemplate } from "./provider"
import type { NotificationChannel } from "@prisma/client"

export interface ReminderRunOptions {
  channel?: NotificationChannel
  windowHours?: number
}

export interface ReminderRunResult {
  totalAttempted: number
  totalSent: number
  totalFailed: number
  totalSkipped: number
  durationMs: number
}

export async function runReminders(opts: ReminderRunOptions = {}): Promise<ReminderRunResult> {
  const start = Date.now()
  const channel = opts.channel ?? "SMS"
  const windowHours = opts.windowHours ?? 24

  const now = new Date()
  const until = new Date(now.getTime() + windowHours * 60 * 60 * 1000)

  const appointments = await prisma.appointment.findMany({
    where: {
      reminderSent: false,
      status: { in: ["PENDING", "CONFIRMED"] },
      scheduledDate: { gte: now, lte: until },
      deletedAt: null,
    },
    include: {
      patient: { select: { id: true, fullName: true, phone: true, email: true } },
      doctor: { include: { user: { select: { fullName: true } } } },
    },
  })

  const provider = getProvider(channel)
  const clinic = await prisma.clinic.findFirst()

  let totalSent = 0
  let totalFailed = 0
  let totalSkipped = 0

  for (const appt of appointments) {
    const contact = channel === "EMAIL" ? appt.patient.email : appt.patient.phone
    if (!contact) {
      totalSkipped++
      continue
    }

    const scheduledDateStr = new Date(appt.scheduledDate).toLocaleDateString("vi-VN")
    const message = renderTemplate(
      "Chào {name}, lịch hẹn khám lúc {time} ngày {date} với BS {doctor} tại {clinic}. Vui lòng đến đúng giờ. Xin cảm ơn!",
      {
        name: appt.patient.fullName,
        time: appt.scheduledTime,
        date: scheduledDateStr,
        doctor: appt.doctor.user.fullName,
        clinic: clinic?.name ?? "Phòng khám",
      }
    )

    const result = await provider.send(contact, message).catch((err) => ({
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }))

    await prisma.appointmentReminder.create({
      data: {
        appointmentId: appt.id,
        channel,
        scheduledAt: appt.scheduledDate,
        sentAt: result.ok ? new Date() : null,
        status: result.ok ? "SENT" : "FAILED",
        message,
      },
    })

    if (result.ok) {
      totalSent++
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminderSent: true },
      })
    } else {
      totalFailed++
    }
  }

  return {
    totalAttempted: appointments.length,
    totalSent,
    totalFailed,
    totalSkipped,
    durationMs: Date.now() - start,
  }
}
