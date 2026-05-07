import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess } from "@/lib/api-utils"

export const GET = apiHandler(async (_request: NextRequest) => {
  await getAuthUser()
  const categories = await prisma.drugCategory.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })
  return sendSuccess(categories)
})
