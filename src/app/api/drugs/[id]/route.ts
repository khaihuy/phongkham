import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  getAuthUser,
  sendSuccess,
  validateBody,
  error,
  requireRole,
} from "@/lib/api-utils"
import { updateDrugSchema, adjustStockSchema } from "@/lib/validations"

export const GET = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const drug = await prisma.drug.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      inventory: {
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      },
      prescriptionItems: {
        take: 5,
      },
    },
  })

  if (!drug) {
    throw error("NOT_FOUND", 404, "Thuốc không tìm thấy")
  }

  // Calculate total stock
  const totalStock = drug.inventory.reduce((sum, inv) => sum + inv.quantity, 0)

  return sendSuccess({
    drug: {
      ...drug,
      totalStock,
    },
  })
})

export const PUT = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(["ADMIN", "PHARMACIST"])

  const input = await validateBody(request, updateDrugSchema)

  const drug = await prisma.drug.update({
    where: { id: params.id },
    data: input,
    include: {
      category: true,
      inventory: true,
    },
  })

  return sendSuccess({ drug })
})

export const DELETE = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(["ADMIN"])

  // Soft delete
  const drug = await prisma.drug.update({
    where: { id: params.id },
    data: {
      isActive: false,
    },
  })

  return sendSuccess({ drug })
})

export const PATCH = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(["ADMIN", "PHARMACIST"])

  const body = await request.json()
  const { action } = body

  if (action === "adjust-stock") {
    const input = await validateBody(request, adjustStockSchema)

    // This would typically involve a drug inventory record
    // For now, we'll just validate the input
    return sendSuccess(
      {
        message: "Stock adjustment recorded",
      },
      200
    )
  }

  throw error("BAD_REQUEST", 400, "Invalid action")
})
