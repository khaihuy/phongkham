import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  getAuthUser,
  sendSuccess,
  validateBody,
  error,
} from "@/lib/api-utils"
import { updateMedicalRecordSchema, prescriptionSchema } from "@/lib/validations"
import { nextCode } from "@/lib/utils"

export const GET = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const record = await prisma.medicalRecord.findUnique({
    where: { id: params.id },
    include: {
      appointment: {
        include: { invoice: { select: { id: true, invoiceCode: true, status: true } } },
      },
      patient: true,
      doctor: { include: { user: true } },
      diagnoses: true,
      prescriptions: {
        include: {
          items: { include: { drug: true } },
        },
      },
      labOrders: { include: { service: { select: { id: true, code: true, price: true } } } },
      imageOrders: { include: { service: { select: { id: true, code: true, price: true } } } },
    },
  })

  if (!record) {
    throw error("NOT_FOUND", 404, "Hồ sơ bệnh án không tìm thấy")
  }

  return sendSuccess(record)
})

export const PUT = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const input = await validateBody(request, updateMedicalRecordSchema)

  const record = await prisma.medicalRecord.update({
    where: { id: params.id },
    data: {
      ...input,
      ...(input.visitDate && { visitDate: new Date(input.visitDate) }),
      ...(input.followUpDate && { followUpDate: new Date(input.followUpDate) }),
    },
    include: {
      appointment: true,
      patient: { select: { id: true, fullName: true } },
      doctor: { select: { id: true, user: { select: { fullName: true } } } },
      diagnoses: true,
      prescriptions: { include: { items: true } },
      labOrders: { include: { service: { select: { id: true, code: true, price: true } } } },
      imageOrders: { include: { service: { select: { id: true, code: true, price: true } } } },
    },
  })

  return sendSuccess(record)
})

export const POST = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const body = await request.json()
  const { action } = body

  if (action === "add-prescription") {
    const input = await validateBody(request, prescriptionSchema)

    // Sinh mã đơn thuốc (DT0001, ...)
    const allCodes = await prisma.prescription.findMany({ select: { prescriptionCode: true } })
    const prescriptionCode = nextCode(allCodes.map((c) => c.prescriptionCode), "DT")

    const prescription = await prisma.prescription.create({
      data: {
        medicalRecordId: params.id,
        prescriptionCode,
        items: {
          create: input.items.map((item: any) => ({
            drugId: item.drugId,
            quantity: item.quantity,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            route: item.route,
            instructions: item.instructions,
            unitPrice: parseFloat(item.unitPrice),
          })),
        },
        notes: input.notes,
      },
      include: { items: { include: { drug: true } } },
    })

    return sendSuccess(prescription, 201)
  }

  if (action === "add-lab-order") {
    const { testName, testCode, instructions } = body

    const labOrder = await prisma.labOrder.create({
      data: {
        medicalRecordId: params.id,
        testName,
        testCode,
        instructions,
      },
    })

    return sendSuccess(labOrder, 201)
  }

  if (action === "add-image-order") {
    const { imagingType, bodyPart, instructions } = body

    const imageOrder = await prisma.imageOrder.create({
      data: {
        medicalRecordId: params.id,
        imagingType,
        bodyPart,
        instructions,
      },
    })

    return sendSuccess(imageOrder, 201)
  }

  throw error("BAD_REQUEST", 400, "Invalid action")
})
