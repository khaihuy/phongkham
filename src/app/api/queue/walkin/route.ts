import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess } from "@/lib/api-utils"

// POST — tiếp nhận bệnh nhân vãng lai (không có lịch hẹn trước)
export const POST = apiHandler(async (request: NextRequest) => {
  await getAuthUser()
  const body = await request.json()
  const { patientId, doctorId, roomId, chiefComplaint, notes } = body as {
    patientId: string
    doctorId: string
    roomId?: string
    chiefComplaint?: string
    notes?: string
  }

  if (!patientId || !doctorId) {
    throw new Error("patientId và doctorId là bắt buộc")
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Lấy số thứ tự tiếp theo trong ngày
  const todayCount = await prisma.appointment.count({
    where: {
      scheduledDate: { gte: today, lt: tomorrow },
      status: { not: "CANCELLED" },
    },
  })
  const queueNumber = todayCount + 1

  // Lấy branchId từ bác sĩ
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { branchId: true },
  })
  if (!doctor) throw new Error("Không tìm thấy bác sĩ")

  const now = new Date()
  const vnFormatter = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  const scheduledTime = vnFormatter.format(now).replace("lúc ", "").trim()
  const vnDateStr = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(now) // "yyyy-MM-dd"
  const appointmentCode = `VL${String(queueNumber).padStart(3, "0")}-${vnDateStr.replace(/-/g, "")}`

  const appointment = await prisma.appointment.create({
    data: {
      appointmentCode,
      patientId,
      doctorId,
      branchId: doctor.branchId,
      roomId: roomId ?? null,
      type: "GENERAL",
      status: "CONFIRMED",
      scheduledDate: now,
      scheduledTime,
      queueNumber,
      chiefComplaint: chiefComplaint ?? null,
      notes: notes ?? null,
      duration: 30,
    },
    include: {
      patient: { select: { id: true, fullName: true, patientCode: true, dateOfBirth: true, phone: true } },
      doctor: { select: { id: true, title: true, user: { select: { fullName: true } } } },
      room: { select: { id: true, name: true, code: true } },
    },
  })

  return sendSuccess(appointment)
})
