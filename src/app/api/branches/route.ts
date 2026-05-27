import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess } from "@/lib/api-utils"

export const GET = apiHandler(async () => {
  await getAuthUser()
  const branches = await prisma.branch.findMany({ orderBy: { isMain: "desc" } })
  return sendSuccess(branches)
})
