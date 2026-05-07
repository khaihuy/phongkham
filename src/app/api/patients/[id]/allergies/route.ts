import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess } from "@/lib/api-utils"

export const POST = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()
  const { allergen, reaction, severity, notes } = await request.json()
  const allergy = await prisma.allergy.create({
    data: { patientId: params.id, allergen, reaction, severity, notes },
  })
  return sendSuccess(allergy, 201)
})
