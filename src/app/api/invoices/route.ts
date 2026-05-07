import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  getAuthUser,
  getPaginationParams,
  sendSuccess,
  validateBody,
  createMeta,
  error,
} from "@/lib/api-utils"
import { createInvoiceSchema, CreateInvoiceInput } from "@/lib/validations"

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const { searchParams } = request.nextUrl
  const status = searchParams.get("status")
  const patientId = searchParams.get("patientId")
  const dateFrom = searchParams.get("dateFrom")
  const dateTo = searchParams.get("dateTo")
  const { page, pageSize, skip } = getPaginationParams({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  })

  const where: any = {}
  if (status) where.status = status
  if (patientId) where.patientId = patientId
  if (dateFrom) {
    where.createdAt = { gte: new Date(dateFrom) }
  }
  if (dateTo) {
    if (!where.createdAt) where.createdAt = {}
    where.createdAt.lte = new Date(dateTo)
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        patient: { select: { id: true, patientCode: true, fullName: true } },
        createdBy: { select: { id: true, fullName: true } },
        items: true,
        payments: true,
      },
    }),
    prisma.invoice.count({ where }),
  ])

  const meta = createMeta(page, pageSize, total)
  return sendSuccess({ invoices }, 200, meta)
})

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await getAuthUser()

  const input = await validateBody<CreateInvoiceInput>(request, createInvoiceSchema)

  // Generate invoice code
  const lastInvoice = await prisma.invoice.findFirst({
    orderBy: { invoiceCode: "desc" },
    select: { invoiceCode: true },
  })

  let nextCode = "INV001"
  if (lastInvoice) {
    const lastNum = parseInt(lastInvoice.invoiceCode.replace("INV", ""))
    nextCode = `INV${String(lastNum + 1).padStart(3, "0")}`
  }

  const invoice = await prisma.invoice.create({
    data: {
      invoiceCode: nextCode,
      patientId: input.patientId,
      appointmentId: input.appointmentId,
      createdById: user.id,
      status: "DRAFT",
      subtotal: parseFloat(input.subtotal),
      discount: parseFloat(input.discount),
      discountType: input.discountType,
      taxAmount: parseFloat(input.taxAmount),
      totalAmount: parseFloat(input.totalAmount),
      insuranceCover: parseFloat(input.insuranceCover),
      patientPays: parseFloat(input.patientPays),
      notes: input.notes,
      items: {
        create: input.items.map((item) => ({
          type: item.type,
          serviceId: item.serviceId,
          drugId: item.drugId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
          discount: parseFloat(item.discount),
          totalPrice: parseFloat(item.unitPrice) * item.quantity - parseFloat(item.discount),
          notes: item.notes,
        })),
      },
    },
    include: {
      patient: { select: { id: true, patientCode: true, fullName: true } },
      createdBy: { select: { id: true, fullName: true } },
      items: true,
      payments: true,
    },
  })

  return sendSuccess({ invoice }, 201)
})
