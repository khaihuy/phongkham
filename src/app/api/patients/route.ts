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
  return sendSuccess({ patients }, 200, meta)
})

export const POST = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const input = await validateBody<CreatePatientInput>(request, createPatientSchema)

  // Generate patient code (e.g., PKC001)
  const lastPatient = await prisma.patient.findFirst({
    orderBy: { patientCode: "desc" },
    select: { patientCode: true },
  })

  let nextCode = "PKC001"
  if (lastPatient) {
    const lastNum = parseInt(lastPatient.patientCode.replace("PKC", ""))
    nextCode = `PKC${String(lastNum + 1).padStart(3, "0")}`
  }

  const patient = await prisma.patient.create({
    data: {
      ...input,
      patientCode: nextCode,
      dateOfBirth: new Date(input.dateOfBirth),
    },
    include: {
      allergies: true,
      vitals: true,
    },
  })

  return sendSuccess({ patient }, 201)
})
