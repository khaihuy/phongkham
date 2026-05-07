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
import { updateInvoiceSchema, paymentSchema } from "@/lib/validations"

export const GET = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      appointment: true,
      createdBy: { select: { id: true, fullName: true, email: true } },
      items: {
        include: {
          service: true,
          drug: true,
        },
      },
      payments: true,
    },
  })

  if (!invoice) {
    throw error("NOT_FOUND", 404, "Hóa đơn không tìm thấy")
  }

  // Calculate totals
  const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
  const remainingAmount = parseFloat(invoice.totalAmount.toString()) - parseFloat(paidAmount.toString())

  return sendSuccess({
    invoice: {
      ...invoice,
      paidAmount,
      remainingAmount,
    },
  })
})

export const PUT = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const input = await validateBody(request, updateInvoiceSchema)

  // Only allow updating draft invoices
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
  })

  if (!invoice) {
    throw error("NOT_FOUND", 404, "Hóa đơn không tìm thấy")
  }

  if (invoice.status !== "DRAFT") {
    throw error("BAD_REQUEST", 400, "Chỉ có thể cập nhật hóa đơn nháp")
  }

  const updated = await prisma.invoice.update({
    where: { id: params.id },
    data: {
      ...(input.items && {
        items: {
          deleteMany: {},
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
      }),
      ...(input.discount !== undefined && { discount: parseFloat(input.discount) }),
      ...(input.discountType && { discountType: input.discountType }),
      ...(input.taxAmount !== undefined && { taxAmount: parseFloat(input.taxAmount) }),
      ...(input.totalAmount && { totalAmount: parseFloat(input.totalAmount) }),
      ...(input.notes !== undefined && { notes: input.notes }),
    },
    include: {
      patient: { select: { id: true, patientCode: true, fullName: true } },
      createdBy: { select: { id: true, fullName: true } },
      items: true,
      payments: true,
    },
  })

  return sendSuccess({ invoice: updated })
})

export const DELETE = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await requireRole(["ADMIN", "ACCOUNTANT"])

  const invoice = await prisma.invoice.update({
    where: { id: params.id },
    data: {
      status: "CANCELLED",
      deletedAt: new Date(),
    },
  })

  return sendSuccess({ invoice })
})

export const PATCH = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const body = await request.json()
  const { action } = body

  if (action === "issue") {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    })

    if (!invoice) {
      throw error("NOT_FOUND", 404, "Hóa đơn không tìm thấy")
    }

    if (invoice.status !== "DRAFT") {
      throw error("BAD_REQUEST", 400, "Chỉ có thể phát hành hóa đơn nháp")
    }

    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: "ISSUED",
        issuedAt: new Date(),
      },
      include: {
        patient: { select: { id: true, fullName: true } },
        items: true,
        payments: true,
      },
    })

    return sendSuccess({ invoice: updated })
  }

  if (action === "add-payment") {
    const input = await validateBody(request, paymentSchema)

    const payment = await prisma.payment.create({
      data: {
        invoiceId: params.id,
        amount: parseFloat(input.amount),
        method: input.method,
        status: "PAID",
        transactionId: input.transactionId,
        reference: input.reference,
        notes: input.notes,
      },
    })

    // Update invoice status if fully paid
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { payments: true },
    })

    if (invoice) {
      const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
      if (parseFloat(totalPaid.toString()) >= parseFloat(invoice.totalAmount.toString())) {
        await prisma.invoice.update({
          where: { id: params.id },
          data: { status: "PAID" },
        })
      } else if (parseFloat(totalPaid.toString()) > 0) {
        await prisma.invoice.update({
          where: { id: params.id },
          data: { status: "PARTIAL" },
        })
      }
    }

    return sendSuccess({ payment }, 201)
  }

  throw error("BAD_REQUEST", 400, "Invalid action")
})
