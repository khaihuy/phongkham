import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess, error } from "@/lib/api-utils"

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const { searchParams } = request.nextUrl
  const dateFrom = searchParams.get("dateFrom")
  const dateTo = searchParams.get("dateTo")

  if (!dateFrom || !dateTo) {
    throw error("BAD_REQUEST", 400, "dateFrom and dateTo are required")
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      createdAt: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      },
      status: {
        in: ["PAID", "ISSUED"],
      },
    },
    include: {
      payments: true,
      patient: { select: { id: true, fullName: true } },
    },
  })

  // Group by date
  const revenueByDate: Record<string, { date: string; total: number; paid: number; pending: number; count: number }> = {}

  invoices.forEach((invoice) => {
    const date = invoice.createdAt.toISOString().split("T")[0]
    if (!revenueByDate[date]) {
      revenueByDate[date] = {
        date,
        total: 0,
        paid: 0,
        pending: 0,
        count: 0,
      }
    }
    const amount = Number(invoice.totalAmount)
    revenueByDate[date].total += amount
    if (invoice.status === "PAID") {
      revenueByDate[date].paid += amount
    } else {
      revenueByDate[date].pending += amount
    }
    revenueByDate[date].count += 1
  })

  const data = Object.values(revenueByDate).map((item) => ({
    date: item.date,
    total: item.total.toString(),
    paid: item.paid.toString(),
    pending: item.pending.toString(),
    count: item.count,
  }))

  const totalRevenue = data.reduce((sum, item) => sum + Number(item.total), 0)
  const totalPaid = data.reduce((sum, item) => sum + Number(item.paid), 0)

  return sendSuccess({
    data: data.sort((a, b) => a.date.localeCompare(b.date)),
    summary: {
      totalRevenue: totalRevenue.toString(),
      totalPaid: totalPaid.toString(),
      totalInvoices: invoices.length,
    },
  })
})
