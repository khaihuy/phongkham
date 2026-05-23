import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess, error } from "@/lib/api-utils"
import { nextCode } from "@/lib/utils"

export const POST = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser()

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      service: true,  // consultation service
      invoice: { include: { items: true } },
      medicalRecord: {
        include: {
          labOrders: { include: { service: true } },
          imageOrders: { include: { service: true } },
          prescriptions: {
            include: {
              items: { include: { drug: true } }
            }
          }
        }
      }
    }
  })

  if (!appointment) throw error("NOT_FOUND", 404, "Lịch hẹn không tồn tại")

  // Build invoice items
  const invoiceItems: any[] = []

  // 1. Consultation fee
  if (appointment.service) {
    invoiceItems.push({
      type: "SERVICE",
      serviceId: appointment.service.id,
      name: appointment.service.name,
      quantity: 1,
      unitPrice: Number(appointment.service.price),
      discount: 0,
      totalPrice: Number(appointment.service.price),
    })
  } else {
    // Default consultation fee 150,000 if no service selected
    invoiceItems.push({
      type: "SERVICE",
      name: "Phí khám bệnh",
      quantity: 1,
      unitPrice: 150000,
      discount: 0,
      totalPrice: 150000,
    })
  }

  // 2. Lab orders
  if (appointment.medicalRecord) {
    for (const lab of appointment.medicalRecord.labOrders) {
      if (lab.service) {
        invoiceItems.push({
          type: "SERVICE",
          serviceId: lab.service.id,
          name: lab.service.name,
          quantity: 1,
          unitPrice: Number(lab.service.price),
          discount: 0,
          totalPrice: Number(lab.service.price),
        })
      }
    }

    // 3. Image orders
    for (const img of appointment.medicalRecord.imageOrders) {
      if (img.service) {
        invoiceItems.push({
          type: "SERVICE",
          serviceId: img.service.id,
          name: img.service.name,
          quantity: 1,
          unitPrice: Number(img.service.price),
          discount: 0,
          totalPrice: Number(img.service.price),
        })
      }
    }

    // 4. Prescription drugs
    for (const presc of appointment.medicalRecord.prescriptions) {
      for (const item of presc.items) {
        if (item.unitPrice && Number(item.unitPrice) > 0) {
          invoiceItems.push({
            type: "DRUG",
            drugId: item.drugId,
            name: item.drug.name,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            discount: 0,
            totalPrice: Number(item.unitPrice) * item.quantity,
          })
        }
      }
    }
  }

  const subtotal = invoiceItems.reduce((sum, i) => sum + i.totalPrice, 0)

  // Update appointment status
  await prisma.appointment.update({
    where: { id: params.id },
    data: { status: "COMPLETED" }
  })

  // Create or update invoice
  let invoice
  if (appointment.invoice) {
    // Delete old items and recreate
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: appointment.invoice.id } })
    invoice = await prisma.invoice.update({
      where: { id: appointment.invoice.id },
      data: {
        subtotal,
        totalAmount: subtotal,
        patientPays: subtotal,
        items: { create: invoiceItems }
      },
      include: { items: true }
    })
  } else {
    // Sinh mã hóa đơn (HD0001, ...)
    const allCodes = await prisma.invoice.findMany({ select: { invoiceCode: true } })
    const invoiceCode = nextCode(allCodes.map((c) => c.invoiceCode), "HD")

    invoice = await prisma.invoice.create({
      data: {
        invoiceCode,
        patientId: appointment.patientId,
        appointmentId: appointment.id,
        createdById: user.id,
        status: "DRAFT",
        subtotal,
        discount: 0,
        taxAmount: 0,
        totalAmount: subtotal,
        insuranceCover: 0,
        patientPays: subtotal,
        items: { create: invoiceItems }
      },
      include: { items: true }
    })
  }

  return sendSuccess({ invoice, itemCount: invoiceItems.length })
})
