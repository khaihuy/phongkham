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
  requireRole,
} from "@/lib/api-utils"
import { createDrugSchema, CreateDrugInput } from "@/lib/validations"

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const { searchParams } = request.nextUrl
  const categoryId = searchParams.get("categoryId")
  const searchTerm = searchParams.get("search") || ""
  const { page, pageSize, skip } = getPaginationParams({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  })

  const where: any = {
    isActive: true,
    ...(categoryId && { categoryId }),
  }

  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" as any } },
      { code: { contains: searchTerm } },
      { genericName: { contains: searchTerm, mode: "insensitive" as any } },
      { brandName: { contains: searchTerm, mode: "insensitive" as any } },
    ]
  }

  const [drugs, total] = await Promise.all([
    prisma.drug.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: "asc" },
      include: {
        category: true,
        inventory: {
          select: {
            id: true,
            quantity: true,
            sellPrice: true,
            expiryDate: true,
          },
        },
      },
    }),
    prisma.drug.count({ where }),
  ])

  const meta = createMeta(page, pageSize, total)
  return sendSuccess(drugs, 200, meta)
})

export const POST = apiHandler(async (request: NextRequest) => {
  await requireRole(["ADMIN", "PHARMACIST"])

  const input = await validateBody<CreateDrugInput>(request, createDrugSchema)

  // Check if category exists
  const category = await prisma.drugCategory.findUnique({
    where: { id: input.categoryId },
  })

  if (!category) {
    throw error("NOT_FOUND", 404, "Danh mục thuốc không tìm thấy")
  }

  // Check if drug code already exists
  const existingDrug = await prisma.drug.findUnique({
    where: { code: input.code },
  })

  if (existingDrug) {
    throw error("CONFLICT", 409, "Mã thuốc đã tồn tại")
  }

  const drug = await prisma.drug.create({
    data: {
      ...input,
    },
    include: {
      category: true,
      inventory: true,
    },
  })

  return sendSuccess(drug, 201)
})
