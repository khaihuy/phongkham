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

  const labOrder = await prisma.labOrder.findUnique({
    where: { id: params.id },
    include: {
      medicalRecord: {
        include: {
          patient: {
            select: { id: true, fullName: true, patientCode: true },
          },
        },
      },
    },
  })

  if (!labOrder) {
    throw error("NOT_FOUND", 404, "Không tìm thấy xét nghiệm")
  }

  return sendSuccess(labOrder)
})

export const PUT = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const labOrder = await prisma.labOrder.findUnique({ where: { id: params.id } })
  if (!labOrder) {
    throw error("NOT_FOUND", 404, "Không tìm thấy xét nghiệm")
  }

  const body = await request.json()
  const { result, status, resultDate, instructions } = body

  const updated = await prisma.labOrder.update({
    where: { id: params.id },
    data: {
      ...(result !== undefined && { result }),
      ...(status !== undefined && { status }),
      ...(resultDate !== undefined && { resultDate: resultDate ? new Date(resultDate) : null }),
      ...(instructions !== undefined && { instructions }),
    },
    include: {
      medicalRecord: {
        include: {
          patient: {
            select: { id: true, fullName: true, patientCode: true },
          },
        },
      },
    },
  })

  return sendSuccess(updated)
})
