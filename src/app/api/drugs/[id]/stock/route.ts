import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  getAuthUser,
  sendSuccess,
  error,
} from "@/lib/api-utils"
import { z } from "zod"

const importStockSchema = z.object({
  quantity: z.number().int().min(1, "Số lượng phải lớn hơn 0"),
  type: z.enum(["IMPORT", "EXPORT", "ADJUSTMENT", "RETURN", "EXPIRED"]).default("IMPORT"),
  unitCost: z.number().min(0).optional(),
  supplierName: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
})

export const POST = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const drug = await prisma.drug.findUnique({ where: { id: params.id } })
  if (!drug) {
    throw error("NOT_FOUND", 404, "Thuốc không tìm thấy")
  }

  const body = await request.json()
  const input = importStockSchema.parse(body)

  const batchNo = input.batchNumber || `BATCH-${Date.now()}`
  const expiryDate = input.expiryDate ? new Date(input.expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  const unitPrice = input.unitCost ?? 0
  const totalAmount = unitPrice * input.quantity

  // For IMPORT: upsert DrugInventory by (drugId, batchNo), create transaction
  let inventory: any

  if (input.type === "IMPORT") {
    const existing = await prisma.drugInventory.findUnique({
      where: { drugId_batchNo: { drugId: params.id, batchNo } },
    })

    if (existing) {
      inventory = await prisma.drugInventory.update({
        where: { id: existing.id },
        data: {
          quantity: { increment: input.quantity },
          updatedAt: new Date(),
        },
      })
    } else {
      inventory = await prisma.drugInventory.create({
        data: {
          drugId: params.id,
          batchNo,
          expiryDate,
          quantity: input.quantity,
          importPrice: unitPrice,
          sellPrice: unitPrice,
          notes: input.notes,
        },
      })
    }
  } else {
    // EXPORT / ADJUSTMENT / RETURN / EXPIRED: find most recent batch for this drug
    const existing = await prisma.drugInventory.findFirst({
      where: { drugId: params.id, batchNo },
    })

    if (!existing) {
      throw error("NOT_FOUND", 404, "Không tìm thấy lô hàng")
    }

    if (input.type === "EXPORT" && existing.quantity < input.quantity) {
      throw error("BAD_REQUEST", 400, "Số lượng xuất vượt quá tồn kho")
    }

    const delta = input.type === "EXPORT" || input.type === "EXPIRED" ? -input.quantity : input.quantity
    inventory = await prisma.drugInventory.update({
      where: { id: existing.id },
      data: {
        quantity: { increment: delta },
        updatedAt: new Date(),
      },
    })
  }

  // Create transaction record
  const transaction = await prisma.drugTransaction.create({
    data: {
      inventoryId: inventory.id,
      type: input.type as any,
      quantity: input.quantity,
      unitPrice,
      totalAmount,
      reference: input.supplierName,
      notes: input.notes,
    },
  })

  return sendSuccess({ inventory, transaction }, 201)
})
