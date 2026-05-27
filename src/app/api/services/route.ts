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
import { z } from "zod"

const createServiceSchema = z.object({
  name: z.string().min(1, "Tên dịch vụ là bắt buộc"),
  code: z.string().min(1, "Mã dịch vụ là bắt buộc"),
  description: z.string().optional(),
  price: z.number().min(0, "Giá phải lớn hơn hoặc bằng 0"),
  unit: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const { searchParams } = request.nextUrl
  const searchTerm = searchParams.get("search") || ""
  const isActiveParam = searchParams.get("isActive")
  const { page, pageSize, skip } = getPaginationParams({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  })

  const where: any = {}

  if (isActiveParam !== null && isActiveParam !== "") {
    where.isActive = isActiveParam === "true"
  }

  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" as any } },
      { code: { contains: searchTerm, mode: "insensitive" as any } },
    ]
  }

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        clinic: { select: { id: true, name: true } },
      },
    }),
    prisma.service.count({ where }),
  ])

  const meta = createMeta(page, pageSize, total)
  return sendSuccess(services, 200, meta)
})

export const POST = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const input = await validateBody(request, createServiceSchema)

  // Check if service code already exists
  const existingService = await prisma.service.findUnique({
    where: { code: input.code },
  })

  if (existingService) {
    throw error("CONFLICT", 409, "Mã dịch vụ đã tồn tại")
  }

  // Get clinicId from first clinic
  const clinic = await prisma.clinic.findFirst()
  if (!clinic) {
    throw error("NOT_FOUND", 404, "Không tìm thấy phòng khám")
  }

  const service = await prisma.service.create({
    data: {
      name: input.name,
      code: input.code,
      description: input.description,
      price: input.price,
      unit: input.unit ?? "lần",
      isActive: input.isActive ?? true,
      clinicId: clinic.id,
    },
    include: {
      clinic: { select: { id: true, name: true } },
    },
  })

  return sendSuccess(service, 201)
})
