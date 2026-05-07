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

  // Generate record code
  const lastRecord = await prisma.medicalRecord.findFirst({
    orderBy: { recordCode: "desc" },
    select: { recordCode: true },
  })

  let nextCode = "MED001"
  if (lastRecord) {
    const lastNum = parseInt(lastRecord.recordCode.replace("MED", ""))
    nextCode = `MED${String(lastNum + 1).padStart(3, "0")}`
  }

  const record = await prisma.medicalRecord.create({
    data: {
      ...input,
      recordCode: nextCode,
      visitDate: new Date(input.visitDate),
      ...(input.followUpDate && { followUpDate: new Date(input.followUpDate) }),
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
