import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess } from "@/lib/api-utils"

export const POST = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()
  const body = await request.json()
  const vital = await prisma.patientVital.create({
    data: {
      patientId: params.id,
      weight: body.weight,
      height: body.height,
      bmi: body.bmi,
      bloodPressureSystolic: body.bloodPressureSystolic,
      bloodPressureDiastolic: body.bloodPressureDiastolic,
      heartRate: body.heartRate,
      temperature: body.temperature,
      oxygenSat: body.oxygenSat,
      notes: body.notes,
    },
  })
  return sendSuccess(vital, 201)
})
