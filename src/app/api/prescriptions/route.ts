import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, getPaginationParams, sendSuccess, createMeta } from "@/lib/api-utils"

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()
  const { searchParams } = request.nextUrl
  const status = searchParams.get("status")
  const { page, pageSize, skip } = getPaginationParams({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  })

  const where: any = {}
  if (status) where.status = status

  const [prescriptions, total] = await Promise.all([
    prisma.prescription.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        medicalRecord: {
          include: {
            patient: { select: { id: true, patientCode: true, fullName: true, phone: true } },
            doctor: { select: { id: true, user: { select: { fullName: true } } } },
          },
        },
        items: {
          include: {
            drug: {
              include: {
                inventory: { orderBy: { expiryDate: "asc" } },
              },
            },
          },
        },
      },
    }),
    prisma.prescription.count({ where }),
  ])

  return sendSuccess(prescriptions, 200, createMeta(page, pageSize, total))
})
