// Public catalog API — không yêu cầu auth, chỉ trả các field công khai
import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getPaginationParams, sendSuccess, createMeta } from "@/lib/api-utils"

export const GET = apiHandler(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl
  const productType = searchParams.get("productType")
  const categoryId = searchParams.get("categoryId")
  const searchTerm = searchParams.get("search") || ""
  const { page, pageSize, skip } = getPaginationParams({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  })

  const where: any = {
    isActive: true,
    ...(categoryId && { categoryId }),
    ...(productType === "DRUG" || productType === "SUPPLEMENT" ? { productType } : {}),
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
      select: {
        id: true,
        code: true,
        name: true,
        genericName: true,
        brandName: true,
        unit: true,
        strength: true,
        form: true,
        manufacturer: true,
        requirePrescription: true,
        productType: true,
        category: { select: { name: true, code: true } },
        inventory: {
          select: { quantity: true, sellPrice: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.drug.count({ where }),
  ])

  // Flatten inventory cho dễ dùng ở client
  const data = drugs.map((d) => ({
    ...d,
    price: d.inventory[0]?.sellPrice ? Number(d.inventory[0].sellPrice) : null,
    inStock: (d.inventory[0]?.quantity ?? 0) > 0,
    inventory: undefined,
  }))

  return sendSuccess(data, 200, createMeta(page, pageSize, total))
})
