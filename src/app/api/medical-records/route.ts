import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  getAuthUser,
  getPaginationParams,
  sendSuccess,
  validateBody,
  createMeta,
  error,
} from "@/lib/api-utils"
import { createMedicalRecordSchema, CreateMedicalRecordInput } from "@/lib/validations"
import { nextCode } from "@/lib/utils"

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const { searchParams } = request.nextUrl
  const patientId = searchParams.get("patientId")
  const doctorId = searchParams.get("doctorId")
  const { page, pageSize, skip } = getPaginationParams({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  })

  const where: any = {}
  if (patientId) where.patientId = patientId
  if (doctorId) where.doctorId = doctorId

  const [records, total] = await Promise.all([
    prisma.medicalRecord.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { visitDate: "desc" },
      include: {
        appointment: true,
        patient: { select: { id: true, patientCode: true, fullName: true } },
        doctor: { select: { id: true, user: { select: { fullName: true } } } },
        diagnoses: true,
        prescriptions: { include: { items: true } },
        labOrders: true,
        imageOrders: true,
      },
    }),
    prisma.medicalRecord.count({ where }),
  ])

  const meta = createMeta(page, pageSize, total)
  return sendSuccess(records, 200, meta)
})

export const POST = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const input = await validateBody<CreateMedicalRecordInput>(request, createMedicalRecordSchema)

  // Sinh mã hồ sơ (HS0001, HS0016, ...)
  const allCodes = await prisma.medicalRecord.findMany({ select: { recordCode: true } })
  const recordCode = nextCode(allCodes.map((c) => c.recordCode), "HS")

  // appointmentId + prescriptions là tùy chọn
  const { appointmentId, prescriptions, ...rest } = input

  // Sinh prescriptionCode cho từng đơn (nếu có)
  let prescriptionCreates: any[] = []
  if (prescriptions && prescriptions.length > 0) {
    const allPrescCodes = await prisma.prescription.findMany({ select: { prescriptionCode: true } })
    const baseMax = (() => {
      const codes = allPrescCodes.map((c) => c.prescriptionCode)
      // dùng helper nextCode để lấy số kế tiếp nhưng cần sinh cho nhiều đơn
      const re = /\d+/
      let max = 0
      for (const c of codes) {
        const m = c.match(re)
        if (m) { const n = parseInt(m[0], 10); if (!Number.isNaN(n) && n > max) max = n }
      }
      return max
    })()

    prescriptionCreates = prescriptions.map((p, idx) => ({
      prescriptionCode: `DT${String(baseMax + idx + 1).padStart(4, "0")}`,
      items: {
        create: p.items.map((it) => ({
          drugId: it.drugId,
          quantity: it.quantity,
          dosage: it.dosage,
          frequency: it.frequency,
          duration: it.duration,
          route: it.route,
          unitPrice: it.unitPrice,
          instructions: it.instructions,
        })),
      },
    }))
  }

  const record = await prisma.medicalRecord.create({
    data: {
      ...rest,
      ...(appointmentId ? { appointmentId } : {}),
      recordCode,
      visitDate: new Date(input.visitDate),
      ...(input.followUpDate && { followUpDate: new Date(input.followUpDate) }),
      ...(prescriptionCreates.length > 0 && {
        prescriptions: { create: prescriptionCreates },
      }),
    },
    include: {
      appointment: true,
      patient: { select: { id: true, patientCode: true, fullName: true } },
      doctor: { select: { id: true, user: { select: { fullName: true } } } },
      diagnoses: true,
      prescriptions: { include: { items: true } },
      labOrders: true,
      imageOrders: true,
    },
  })

  return sendSuccess(record, 201)
})
