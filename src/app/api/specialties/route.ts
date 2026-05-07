import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess } from "@/lib/api-utils"

export const GET = apiHandler(async () => {
  await getAuthUser()
  const specialties = await prisma.specialty.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  return sendSuccess(specialties)
})
