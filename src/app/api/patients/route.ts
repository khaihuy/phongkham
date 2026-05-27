import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  getAuthUser,
  getPaginationParams,
  sendSuccess,
  sendError,
  validateBody,
  createMeta,
  error,
} from "@/lib/api-utils"
import { createPatientSchema, CreatePatientInput } from "@/lib/validations"
import { patientService } from "@/lib/services/patient.service"

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const { searchParams } = request.nextUrl
  const searchTerm = searchParams.get("search") || ""
  const { page, pageSize, skip } = getPaginationParams({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  })

  // Build where clause for search
  const where = searchTerm
    ? {
        OR: [
          { fullName: { contains: searchTerm, mode: "insensitive" as any } },
          { phone: { contains: searchTerm } },
          { patientCode: { contains: searchTerm } },
          { email: { contains: searchTerm, mode: "insensitive" as any } },
        ],
      }
    : {}

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where: { ...where, isActive: true },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        allergies: true,
        vitals: {
          orderBy: { recordedAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.patient.count({ where: { ...where, isActive: true } }),
  ])

  const meta = createMeta(page, pageSize, total)
  return sendSuccess(patients, 200, meta)
})

export const POST = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const input = await validateBody<CreatePatientInput>(request, createPatientSchema)

  const patient = await patientService.create(input as any)

  // Re-fetch với include để giữ shape response giống cũ (FE cần allergies + vitals)
  const full = await prisma.patient.findUnique({
    where: { id: patient.id },
    include: { allergies: true, vitals: true },
  })

  return sendSuccess(full, 201)
})
