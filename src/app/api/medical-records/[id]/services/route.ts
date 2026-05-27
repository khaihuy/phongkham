// CRUD chỉ định dịch vụ cho hồ sơ bệnh án.
// - GET: liệt kê dịch vụ đã chỉ định (sort theo sequence)
// - POST: thêm 1 dịch vụ; sequence tự tăng (max+1)

import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess, error } from "@/lib/api-utils"

const addServiceSchema = z.object({
  serviceId: z.string().min(1, "Vui lòng chọn dịch vụ"),
  quantity: z.number().int().min(1).default(1),
  notes: z.string().optional(),
  // Nếu không truyền sequence, server tự gán max+1
  sequence: z.number().int().min(1).optional(),
})

export const GET = apiHandler(async (_request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const services = await prisma.medicalRecordService.findMany({
    where: { medicalRecordId: params.id },
    orderBy: { sequence: "asc" },
    include: {
      service: { select: { id: true, name: true, code: true, price: true, unit: true } },
      performer: { select: { id: true, fullName: true } },
    },
  })

  return sendSuccess(services)
})

export const POST = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const record = await prisma.medicalRecord.findUnique({ where: { id: params.id } })
  if (!record) throw error("NOT_FOUND", 404, "Hồ sơ bệnh án không tồn tại")

  const body = await request.json()
  const input = addServiceSchema.parse(body)

  const service = await prisma.service.findUnique({ where: { id: input.serviceId } })
  if (!service) throw error("NOT_FOUND", 404, "Dịch vụ không tồn tại")

  // Tự tăng sequence nếu không truyền
  let sequence = input.sequence
  if (sequence === undefined) {
    const last = await prisma.medicalRecordService.findFirst({
      where: { medicalRecordId: params.id },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    })
    sequence = (last?.sequence ?? 0) + 1
  }

  const created = await prisma.medicalRecordService.create({
    data: {
      medicalRecordId: params.id,
      serviceId: input.serviceId,
      sequence,
      quantity: input.quantity,
      unitPrice: service.price,
      notes: input.notes,
    },
    include: {
      service: { select: { id: true, name: true, code: true, price: true, unit: true } },
    },
  })

  return sendSuccess(created, 201)
})
