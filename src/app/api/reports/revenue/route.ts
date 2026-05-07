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
        in: ["PAID", "PARTIAL", "ISSUED"],
      },
    },
    include: {
      payments: true,
      patient: { select: { id: true, fullName: true } },
    },
  })

  // Group by date
  const revenueByDate: Record<string, any> = {}

  invoices.forEach((invoice) => {
    const date = invoice.createdAt.toISOString().split("T")[0]
    if (!revenueByDate[date]) {
      revenueByDate[date] = {
        date,
        total: 0n,
        paid: 0n,
        partial: 0n,
        count: 0,
      }
    }
    revenueByDate[date].total += invoice.totalAmount
    if (invoice.status === "PAID") {
      revenueByDate[date].paid += invoice.totalAmount
    } else if (invoice.status === "PARTIAL") {
      revenueByDate[date].partial += invoice.totalAmount
    }
    revenueByDate[date].count += 1
  })

  const data = Object.values(revenueByDate).map((item: any) => ({
    date: item.date,
    total: item.total.toString(),
    paid: item.paid.toString(),
    partial: item.partial.toString(),
    count: item.count,
  }))

  const totalRevenue = data.reduce((sum, item) => sum + BigInt(item.total), 0n)
  const totalPaid = data.reduce((sum, item) => sum + BigInt(item.paid), 0n)

  return sendSuccess({
    data: data.sort((a, b) => a.date.localeCompare(b.date)),
    summary: {
      totalRevenue: totalRevenue.toString(),
      totalPaid: totalPaid.toString(),
      totalInvoices: invoices.length,
    },
  })
})
