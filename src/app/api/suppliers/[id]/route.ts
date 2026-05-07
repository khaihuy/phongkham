import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  getAuthUser,
  sendSuccess,
  error,
} from "@/lib/api-utils"

export const GET = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const supplier = await prisma.supplier.findUnique({
    where: { id: params.id },
  })

  if (!supplier) {
    throw error("NOT_FOUND", 404, "Nhà cung cấp không tìm thấy")
  }

  return sendSuccess(supplier)
})

export const PUT = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const supplier = await prisma.supplier.findUnique({ where: { id: params.id } })
  if (!supplier) {
    throw error("NOT_FOUND", 404, "Nhà cung cấp không tìm thấy")
  }

  const body = await request.json()
  const { name, code, contactName, phone, email, address, taxCode, notes, isActive } = body

  if (code && code !== supplier.code) {
    const existing = await prisma.supplier.findUnique({ where: { code } })
    if (existing) {
      throw error("CONFLICT", 409, "Mã nhà cung cấp đã tồn tại")
    }
  }

  const updated = await prisma.supplier.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(code !== undefined && { code }),
      ...(contactName !== undefined && { contactName }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(address !== undefined && { address }),
      ...(taxCode !== undefined && { taxCode }),
      ...(notes !== undefined && { notes }),
      ...(isActive !== undefined && { isActive }),
    },
  })

  return sendSuccess(updated)
})

export const DELETE = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const supplier = await prisma.supplier.findUnique({ where: { id: params.id } })
  if (!supplier) {
    throw error("NOT_FOUND", 404, "Nhà cung cấp không tìm thấy")
  }

  const updated = await prisma.supplier.update({
    where: { id: params.id },
    data: { isActive: false },
  })

  return sendSuccess(updated)
})
