import { NextRequest } from "next/server"
import { apiHandler, requireRole, sendSuccess } from "@/lib/api-utils"
import { seedReferenceData } from "../../../../../prisma/seed-reference"

export const POST = apiHandler(async (_request: NextRequest) => {
  await requireRole(["ADMIN"])
  const result = await seedReferenceData()
  return sendSuccess(result, 200)
})
