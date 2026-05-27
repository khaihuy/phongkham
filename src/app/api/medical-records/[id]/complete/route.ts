// Hoàn tất khám từ medical record:
// - Có appointment → đánh dấu appointment COMPLETED và tạo invoice gắn appointmentId
// - Không appointment (walk-in, khám không hẹn) → chỉ tạo invoice gắn vào medical record
//
// Endpoint cũ /api/appointments/[id]/complete vẫn giữ cho backward-compat
// nhưng UI dùng endpoint này (an toàn cho cả 2 trường hợp).

import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess, error } from "@/lib/api-utils"
import { nextCode } from "@/lib/utils"

export const POST = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const user = await getAuthUser()

  const record = await prisma.medicalRecord.findUnique({
    where: { id: params.id },
    include: {
      appointment: { include: { service: true, invoice: { include: { items: true } } } },
      labOrders: { include: { service: true } },
      imageOrders: { include: { service: true } },
      prescriptions: { include: { items: { include: { drug: true } } } },
      services: { include: { service: true }, orderBy: { sequence: "asc" } },
    },
  })

  if (!record) throw error("NOT_FOUND", 404, "Hồ sơ bệnh án không tồn tại")

  const invoiceItems: any[] = []

  // 1. Phí khám (nếu có service từ appointment hoặc default)
  if (record.appointment?.service) {
    invoiceItems.push({
      type: "SERVICE",
      serviceId: record.appointment.service.id,
      name: record.appointment.service.name,
      quantity: 1,
      unitPrice: Number(record.appointment.service.price),
      discount: 0,
      totalPrice: Number(record.appointment.service.price),
    })
  } else {
    invoiceItems.push({
      type: "SERVICE",
      name: "Phí khám bệnh",
      quantity: 1,
      unitPrice: 150000,
      discount: 0,
      totalPrice: 150000,
    })
  }

  // 2. Xét nghiệm
  for (const lab of record.labOrders) {
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

  // 2b. Dịch vụ chỉ định trong hồ sơ (theo thứ tự sequence)
  // Bỏ qua trạng thái SKIPPED
  for (const svc of record.services) {
    if (svc.status === "SKIPPED") continue
    invoiceItems.push({
      type: "SERVICE",
      serviceId: svc.serviceId,
      name: svc.service.name,
      quantity: svc.quantity,
      unitPrice: Number(svc.unitPrice),
      discount: 0,
      totalPrice: Number(svc.unitPrice) * svc.quantity,
    })
  }

  // 3. Chẩn đoán hình ảnh
  for (const img of record.imageOrders) {
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

  // 4. Thuốc kê đơn
  for (const presc of record.prescriptions) {
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

  const subtotal = invoiceItems.reduce((sum, i) => sum + i.totalPrice, 0)

  // Update appointment status nếu có
  if (record.appointmentId) {
    await prisma.appointment.update({
      where: { id: record.appointmentId },
      data: { status: "COMPLETED" },
    })
  }

  // Tạo hoặc cập nhật invoice
  const existingInvoice = record.appointment?.invoice
  let invoice
  if (existingInvoice) {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: existingInvoice.id } })
    invoice = await prisma.invoice.update({
      where: { id: existingInvoice.id },
      data: {
        subtotal,
        totalAmount: subtotal,
        patientPays: subtotal,
        items: { create: invoiceItems },
      },
      include: { items: true },
    })
  } else {
    const allCodes = await prisma.invoice.findMany({ select: { invoiceCode: true } })
    const invoiceCode = nextCode(allCodes.map((c) => c.invoiceCode), "HD")

    invoice = await prisma.invoice.create({
      data: {
        invoiceCode,
        patientId: record.patientId,
        ...(record.appointmentId ? { appointmentId: record.appointmentId } : {}),
        medicalRecordId: record.id,
        createdById: user.id,
        status: "DRAFT",
        subtotal,
        discount: 0,
        taxAmount: 0,
        totalAmount: subtotal,
        insuranceCover: 0,
        patientPays: subtotal,
        items: { create: invoiceItems },
      },
      include: { items: true },
    })
  }

  return sendSuccess({ invoice, itemCount: invoiceItems.length, hasAppointment: !!record.appointmentId })
})
