import { prisma } from "@/db/prisma"
import type { AppointmentInput, AppointmentUpdateInput } from "@/lib/validations/appointment.schema"
import { generateCode } from "@/lib/utils"

export const appointmentService = {
  async list(params: {
    search?: string
    status?: string
    doctorId?: string
    date?: string
    page?: number
    limit?: number
  }) {
    const { search = "", status, doctorId, date, page = 1, limit = 20 } = params
    const skip = (page - 1) * limit

    const where: any = { deletedAt: null }

    if (status) where.status = status
    if (doctorId) where.doctorId = doctorId
    if (date) {
      const d = new Date(date)
      where.scheduledDate = {
        gte: new Date(d.setHours(0, 0, 0, 0)),
        lt: new Date(d.setHours(23, 59, 59, 999)),
      }
    }
    if (search) {
      where.OR = [
        { appointmentCode: { contains: search, mode: "insensitive" } },
        { patient: { fullName: { contains: search, mode: "insensitive" } } },
        { patient: { phone: { contains: search } } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ scheduledDate: "asc" }, { scheduledTime: "asc" }],
        include: {
          patient: { select: { id: true, fullName: true, phone: true, patientCode: true } },
          doctor: { include: { user: { select: { fullName: true } }, specialty: true } },
          room: true,
        },
      }),
      prisma.appointment.count({ where }),
    ])

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  },

  async getById(id: string) {
    return prisma.appointment.findFirst({
      where: { id, deletedAt: null },
      include: {
        patient: true,
        doctor: { include: { user: true, specialty: true } },
        room: true,
        medicalRecord: { include: { diagnoses: true, prescriptions: { include: { items: { include: { drug: true } } } } } },
        invoice: true,
      },
    })
  },

  async create(data: AppointmentInput) {
    const count = await prisma.appointment.count()
    const appointmentCode = generateCode("LH", count + 1)

    return prisma.appointment.create({
      data: {
        ...data,
        appointmentCode,
        scheduledDate: new Date(data.scheduledDate),
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    })
  },

  async update(id: string, data: AppointmentUpdateInput) {
    return prisma.appointment.update({
      where: { id },
      data: {
        ...data,
        ...(data.scheduledDate ? { scheduledDate: new Date(data.scheduledDate) } : {}),
      },
    })
  },

  async updateStatus(id: string, status: string, cancelReason?: string) {
    return prisma.appointment.update({
      where: { id },
      data: { status: status as any, ...(cancelReason ? { cancelReason } : {}) },
    })
  },

  async getAvailableSlots(doctorId: string, date: string) {
    const d = new Date(date)
    const dayOfWeek = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"][d.getDay()]

    const [schedule, booked] = await Promise.all([
      prisma.doctorSchedule.findFirst({
        where: { doctorId, dayOfWeek: dayOfWeek as any, isActive: true },
      }),
      prisma.appointment.findMany({
        where: {
          doctorId,
          scheduledDate: {
            gte: new Date(d.setHours(0, 0, 0, 0)),
            lt: new Date(d.setHours(23, 59, 59, 999)),
          },
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
        },
        select: { scheduledTime: true },
      }),
    ])

    if (!schedule) return []

    const bookedTimes = new Set(booked.map((a) => a.scheduledTime))
    const slots: string[] = []
    const [startH, startM] = schedule.startTime.split(":").map(Number)
    const [endH, endM] = schedule.endTime.split(":").map(Number)
    let current = startH * 60 + startM
    const end = endH * 60 + endM

    while (current + schedule.slotMinutes <= end) {
      const h = Math.floor(current / 60).toString().padStart(2, "0")
      const m = (current % 60).toString().padStart(2, "0")
      const time = `${h}:${m}`
      if (!bookedTimes.has(time)) slots.push(time)
      current += schedule.slotMinutes
    }

    return slots
  },

  async getTodayStats() {
    const today = new Date()
    const start = new Date(today.setHours(0, 0, 0, 0))
    const end = new Date(today.setHours(23, 59, 59, 999))
    const where = { scheduledDate: { gte: start, lt: end } }

    const [total, completed, inProgress, pending, cancelled] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.count({ where: { ...where, status: "COMPLETED" } }),
      prisma.appointment.count({ where: { ...where, status: "IN_PROGRESS" } }),
      prisma.appointment.count({ where: { ...where, status: { in: ["PENDING", "CONFIRMED"] } } }),
      prisma.appointment.count({ where: { ...where, status: "CANCELLED" } }),
    ])

    return { total, completed, inProgress, pending, cancelled }
  },
}
