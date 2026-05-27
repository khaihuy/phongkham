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
  const { name, phone, contact, email, address, taxCode, isActive } = body

  const updated = await prisma.supplier.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(contact !== undefined && { contact }),
      ...(email !== undefined && { email }),
      ...(address !== undefined && { address }),
      ...(taxCode !== undefined && { taxCode }),
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
