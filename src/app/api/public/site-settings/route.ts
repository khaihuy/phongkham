import { prisma } from "@/db/prisma"
import { apiHandler, sendSuccess } from "@/lib/api-utils"

export const GET = apiHandler(async () => {
  let s = await prisma.siteSettings.findUnique({ where: { id: "singleton" } })
  if (!s) {
    s = await prisma.siteSettings.create({ data: { id: "singleton" } })
  }
  return sendSuccess(s)
})
