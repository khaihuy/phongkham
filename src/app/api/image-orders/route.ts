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

  const [imageOrders, total] = await Promise.all([
    prisma.imageOrder.findMany({
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
    prisma.imageOrder.count({ where }),
  ])

  const meta = createMeta(page, pageSize, total)
  return sendSuccess(imageOrders, 200, meta)
})

export const POST = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const body = await request.json()
  const { medicalRecordId, imagingType, bodyPart, instructions } = body

  if (!medicalRecordId) {
    throw error("VALIDATION_ERROR", 400, "medicalRecordId là bắt buộc")
  }
  if (!imagingType) {
    throw error("VALIDATION_ERROR", 400, "imagingType là bắt buộc")
  }

  const medicalRecord = await prisma.medicalRecord.findUnique({
    where: { id: medicalRecordId },
  })
  if (!medicalRecord) {
    throw error("NOT_FOUND", 404, "Hồ sơ bệnh án không tìm thấy")
  }

  const imageOrder = await prisma.imageOrder.create({
    data: {
      medicalRecordId,
      imagingType,
      bodyPart: bodyPart ?? null,
      instructions: instructions ?? null,
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

  return sendSuccess(imageOrder, 201)
})
