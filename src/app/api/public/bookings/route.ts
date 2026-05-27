// Đặt lịch khách (guest booking) — không yêu cầu auth.
// Tự upsert Patient theo phone, tạo Appointment status=PENDING để
// lễ tân xác nhận lại trên CRM.

import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/db/prisma"
import { apiHandler, sendSuccess, error } from "@/lib/api-utils"
import { nextCode } from "@/lib/utils"

const bookingSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  phone: z
    .string()
    .transform((s) => s.replace(/[\s\-\.()]/g, ""))
    .refine((s) => /^(\+?84|0)\d{9,10}$/.test(s), "Số điện thoại không hợp lệ"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  doctorId: z.string().min(1, "Vui lòng chọn bác sĩ"),
  scheduledDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Ngày khám không hợp lệ"),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, "Giờ không hợp lệ"),
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
})

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json()
  const input = bookingSchema.parse(body)

  const doctor = await prisma.doctor.findUnique({
    where: { id: input.doctorId },
    select: { id: true, branchId: true, specialtyId: true, isActive: true },
  })
  if (!doctor || !doctor.isActive) throw error("NOT_FOUND", 404, "Bác sĩ không tồn tại")

  // Upsert patient by phone — tránh tạo BN trùng cho khách quay lại
  let patient = await prisma.patient.findFirst({
    where: { phone: input.phone, deletedAt: null },
    select: { id: true, fullName: true, patientCode: true },
  })

  if (!patient) {
    const allCodes = await prisma.patient.findMany({ select: { patientCode: true } })
    const patientCode = nextCode(allCodes.map((p) => p.patientCode), "BN")
    patient = await prisma.patient.create({
      data: {
        patientCode,
        fullName: input.fullName,
        phone: input.phone,
        gender: input.gender ?? "OTHER",
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : new Date("2000-01-01"),
        notes: "[Tự đăng ký online]",
      },
      select: { id: true, fullName: true, patientCode: true },
    })
  }

  const allApptCodes = await prisma.appointment.findMany({ select: { appointmentCode: true } })
  const appointmentCode = nextCode(allApptCodes.map((c) => c.appointmentCode), "LH")

  const appointment = await prisma.appointment.create({
    data: {
      appointmentCode,
      patientId: patient.id,
      doctorId: doctor.id,
      branchId: doctor.branchId,
      specialtyId: doctor.specialtyId,
      scheduledDate: new Date(input.scheduledDate),
      scheduledTime: input.scheduledTime,
      status: "PENDING",
      type: "GENERAL",
      source: "ONLINE",
      chiefComplaint: input.chiefComplaint,
      notes: input.notes ?? null,
    },
    select: { id: true, appointmentCode: true, scheduledDate: true, scheduledTime: true },
  })

  return sendSuccess({ appointment, patient }, 201)
})
