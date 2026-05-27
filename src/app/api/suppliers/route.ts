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
      { contact: { contains: search, mode: "insensitive" as any } },
      { phone: { contains: search } },
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
  const { name, phone, contact, email, address, taxCode } = body

  if (!name) {
    throw error("VALIDATION_ERROR", 400, "Tên nhà cung cấp là bắt buộc")
  }
  if (!phone) {
    throw error("VALIDATION_ERROR", 400, "Số điện thoại là bắt buộc")
  }

  const supplier = await prisma.supplier.create({
    data: {
      name,
      phone,
      contact: contact ?? null,
      email: email ?? null,
      address: address ?? null,
      taxCode: taxCode ?? null,
    },
  })

  return sendSuccess(supplier, 201)
})
