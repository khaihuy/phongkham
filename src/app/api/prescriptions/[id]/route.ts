import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess, error } from "@/lib/api-utils"

export const GET = apiHandler(async (_request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()
  const presc = await prisma.prescription.findUnique({
    where: { id: params.id },
    include: {
      medicalRecord: {
        include: {
          patient: { select: { id: true, patientCode: true, fullName: true } },
          doctor: { select: { id: true, user: { select: { fullName: true } } } },
        },
      },
      items: {
        include: {
          drug: { include: { inventory: { orderBy: { expiryDate: "asc" } } } },
        },
      },
    },
  })
  if (!presc) throw error("NOT_FOUND", 404, "Đơn thuốc không tồn tại")
  return sendSuccess(presc)
})

// POST /api/prescriptions/[id]/dispense is in the sub-route
