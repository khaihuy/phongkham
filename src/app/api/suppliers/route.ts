import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  getAuthUser,
  getPaginationParams,
  sendSuccess,
  createMeta,
  error,
} from "@/lib/api-utils"

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const { searchParams } = request.nextUrl
  const search = searchParams.get("search") || ""
  const { page, pageSize, skip } = getPaginationParams({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  })

  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" as any } },
      { code: { contains: search, mode: "insensitive" as any } },
      { contactName: { contains: search, mode: "insensitive" as any } },
    ]
  }

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: "asc" },
    }),
    prisma.supplier.count({ where }),
  ])

  const meta = createMeta(page, pageSize, total)
  return sendSuccess(suppliers, 200, meta)
})

export const POST = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const body = await request.json()
  const { name, code, contactName, phone, email, address, taxCode, notes } = body

  if (!name) {
    throw error("VALIDATION_ERROR", 400, "Tên nhà cung cấp là bắt buộc")
  }
  if (!code) {
    throw error("VALIDATION_ERROR", 400, "Mã nhà cung cấp là bắt buộc")
  }

  const existing = await prisma.supplier.findUnique({ where: { code } })
  if (existing) {
    throw error("CONFLICT", 409, "Mã nhà cung cấp đã tồn tại")
  }

  const supplier = await prisma.supplier.create({
    data: {
      name,
      code,
      contactName: contactName ?? null,
      phone: phone ?? null,
      email: email ?? null,
      address: address ?? null,
      taxCode: taxCode ?? null,
      notes: notes ?? null,
    },
  })

  return sendSuccess(supplier, 201)
})
