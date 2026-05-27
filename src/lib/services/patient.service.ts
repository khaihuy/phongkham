import { prisma } from "@/db/prisma"
import type { PatientInput, PatientUpdateInput } from "@/lib/validations/patient.schema"
import { generateCode } from "@/lib/utils"

// Lấy số lớn nhất từ list patientCode (xử lý cả BN001, BN0001, PKC123, v.v.)
export function maxPatientNumber(codes: string[]): number {
  let max = 0
  for (const code of codes) {
    const match = code.match(/\d+/)
    if (match) {
      const n = parseInt(match[0], 10)
      if (!Number.isNaN(n) && n > max) max = n
    }
  }
  return max
}

// Sinh code tiếp theo dùng prefix BN + 4 chữ số (BN0001, BN0021...).
async function generateNextPatientCode(): Promise<string> {
  const patients = await prisma.patient.findMany({
    select: { patientCode: true },
  })
  const maxNum = maxPatientNumber(patients.map((p) => p.patientCode))
  return generateCode("BN", maxNum + 1)
}

export const patientService = {
  async list(params: {
    search?: string
    page?: number
    limit?: number
  }) {
    const { search = "", page = 1, limit = 20 } = params
    const skip = (page - 1) * limit

    const where = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search } },
              { patientCode: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    }

    const [data, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { appointments: true } },
        },
      }),
      prisma.patient.count({ where }),
    ])

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  },

  async getById(id: string) {
    return prisma.patient.findFirst({
      where: { id, deletedAt: null },
      include: {
        allergies: true,
        vitals: { orderBy: { recordedAt: "desc" }, take: 5 },
        appointments: {
          orderBy: { scheduledDate: "desc" },
          take: 10,
          include: { doctor: { include: { user: true } } },
        },
      },
    })
  },

  async create(data: PatientInput) {
    const patientCode = await generateNextPatientCode()

    return prisma.patient.create({
      data: {
        ...data,
        patientCode,
        dateOfBirth: new Date(data.dateOfBirth),
        email: data.email || null,
      },
    })
  },

  async update(id: string, data: PatientUpdateInput) {
    return prisma.patient.update({
      where: { id },
      data: {
        ...data,
        ...(data.dateOfBirth ? { dateOfBirth: new Date(data.dateOfBirth) } : {}),
        email: data.email || null,
      },
    })
  },

  async softDelete(id: string) {
    return prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    })
  },

  async getStats() {
    const [total, newThisMonth, activeToday] = await Promise.all([
      prisma.patient.count({ where: { deletedAt: null } }),
      prisma.patient.count({
        where: {
          deletedAt: null,
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
      prisma.appointment.count({
        where: {
          scheduledDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        },
      }),
    ])
    return { total, newThisMonth, activeToday }
  },
}
