import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  getAuthUser,
  getPaginationParams,
  sendSuccess,
  createMeta,
  error,
} from "@/lib/api-utils"

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const { searchParams } = request.nextUrl
  const status = searchParams.get("status")
  const { page, pageSize, skip } = getPaginationParams({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  })

  const where: any = {}
  if (status && status !== "ALL") {
    where.status = status
  }

  const [labOrders, total] = await Promise.all([
    prisma.labOrder.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        medicalRecord: {
          include: {
            patient: {
              select: {
                id: true,
                fullName: true,
                patientCode: true,
              },
            },
          },
        },
      },
    }),
    prisma.labOrder.count({ where }),
  ])

  const meta = createMeta(page, pageSize, total)
  return sendSuccess(labOrders, 200, meta)
})

export const POST = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const body = await request.json()
  const { medicalRecordId, testName, testCode, instructions, serviceId } = body

  if (!medicalRecordId) {
    throw error("VALIDATION_ERROR", 400, "medicalRecordId là bắt buộc")
  }
  if (!testName) {
    throw error("VALIDATION_ERROR", 400, "testName là bắt buộc")
  }

  const medicalRecord = await prisma.medicalRecord.findUnique({
    where: { id: medicalRecordId },
  })
  if (!medicalRecord) {
    throw error("NOT_FOUND", 404, "Hồ sơ bệnh án không tìm thấy")
  }

  const labOrder = await prisma.labOrder.create({
    data: {
      medicalRecordId,
      testName,
      testCode: testCode ?? null,
      instructions: instructions ?? null,
      serviceId: serviceId ?? null,
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

  return sendSuccess(labOrder, 201)
})
