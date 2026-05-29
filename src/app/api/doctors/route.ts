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
import { createDoctorSchema, type CreateDoctorInput } from "@/lib/validations"

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const { searchParams } = request.nextUrl
  const specialtyId = searchParams.get("specialtyId")
  const branchId = searchParams.get("branchId")
  const searchTerm = searchParams.get("search") || ""
  const { page, pageSize, skip } = getPaginationParams({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  })

  const where: any = {
    isActive: true,
    ...(specialtyId && { specialtyId }),
    ...(branchId && { branchId }),
  }

  if (searchTerm) {
    where.OR = [
      { user: { fullName: { contains: searchTerm, mode: "insensitive" } } },
      { employeeCode: { contains: searchTerm } },
      { user: { email: { contains: searchTerm, mode: "insensitive" } } },
    ]
  }

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
        specialty: true,
        schedules: true,
      },
    }),
    prisma.doctor.count({ where }),
  ])

  const meta = createMeta(page, pageSize, total)
  return sendSuccess(doctors, 200, meta)
})

export const POST = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const input = await validateBody<CreateDoctorInput>(request, createDoctorSchema)

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
  })

  if (!user) {
    throw error("NOT_FOUND", 404, "User không tìm thấy")
  }

  // Check if doctor already exists for this user
  const existingDoctor = await prisma.doctor.findUnique({
    where: { userId: input.userId },
  })

  if (existingDoctor) {
    throw error("CONFLICT", 409, "User này đã là bác sĩ")
  }

  const doctor = await prisma.doctor.create({
    data: {
      ...input,
      consultFee: parseFloat(input.consultFee),
    },
    include: {
      user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
      specialty: true,
      schedules: true,
    },
  })

  return sendSuccess(doctor, 201)
})
