import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess, error } from "@/lib/api-utils"

export const POST = apiHandler(async (_request: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser()

  const presc = await prisma.prescription.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          drug: {
            include: { inventory: { where: { quantity: { gt: 0 } }, orderBy: { expiryDate: "asc" } } },
          },
        },
      },
    },
  })

  if (!presc) throw error("NOT_FOUND", 404, "Đơn thuốc không tồn tại")
  if (presc.status === "DISPENSED") throw error("CONFLICT", 409, "Đơn thuốc đã được phát")
  if (presc.status === "CANCELLED") throw error("CONFLICT", 409, "Đơn thuốc đã bị hủy")

  // Check stock for all items first
  const stockErrors: string[] = []
  for (const item of presc.items) {
    const available = item.drug.inventory.reduce((s, inv) => s + inv.quantity, 0)
    if (available < item.quantity) {
      stockErrors.push(`${item.drug.name}: cần ${item.quantity}, tồn kho ${available}`)
    }
  }
  if (stockErrors.length > 0) {
    throw error("BAD_REQUEST", 400, `Không đủ tồn kho: ${stockErrors.join("; ")}`)
  }

  // Deduct stock FIFO (oldest expiry first) and create EXPORT transactions
  for (const item of presc.items) {
    let remaining = item.quantity
    for (const inv of item.drug.inventory) {
      if (remaining <= 0) break
      const deduct = Math.min(remaining, inv.quantity)
      await prisma.drugInventory.update({
        where: { id: inv.id },
        data: { quantity: { decrement: deduct } },
      })
      await prisma.drugTransaction.create({
        data: {
          inventoryId: inv.id,
          type: "EXPORT",
          quantity: deduct,
          unitPrice: inv.sellPrice,
          totalAmount: Number(inv.sellPrice) * deduct,
          reference: presc.prescriptionCode,
          notes: `Phát thuốc đơn ${presc.prescriptionCode}`,
        },
      })
      remaining -= deduct
    }
  }

  // Mark prescription as DISPENSED
  const updated = await prisma.prescription.update({
    where: { id: params.id },
    data: {
      status: "DISPENSED",
      dispensedAt: new Date(),
      dispensedBy: user.id,
    },
    include: {
      items: { include: { drug: true } },
    },
  })

  return sendSuccess(updated)
})
