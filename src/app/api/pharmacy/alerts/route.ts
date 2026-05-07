import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess } from "@/lib/api-utils"

export const GET = apiHandler(async (_request: NextRequest) => {
  await getAuthUser()

  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const drugs = await prisma.drug.findMany({
    where: { isActive: true },
    include: {
      inventory: {
        where: { quantity: { gt: 0 } },
        orderBy: { expiryDate: "asc" },
      },
    },
  })

  const lowStock: any[] = []
  const expiringSoon: any[] = []

  for (const drug of drugs) {
    const totalStock = drug.inventory.reduce((s, inv) => s + inv.quantity, 0)

    // Low stock alert
    if (totalStock <= drug.minStock) {
      lowStock.push({
        id: drug.id,
        name: drug.name,
        code: drug.code,
        unit: drug.unit,
        totalStock,
        minStock: drug.minStock,
      })
    }

    // Expiring soon alert (batches expiring within 30 days)
    for (const inv of drug.inventory) {
      if (inv.expiryDate <= in30Days && inv.quantity > 0) {
        expiringSoon.push({
          id: drug.id,
          inventoryId: inv.id,
          name: drug.name,
          code: drug.code,
          batchNo: inv.batchNo,
          quantity: inv.quantity,
          expiryDate: inv.expiryDate,
          daysLeft: Math.ceil((inv.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        })
      }
    }
  }

  return sendSuccess({
    lowStock,
    expiringSoon,
    totalAlerts: lowStock.length + expiringSoon.length,
  })
})
