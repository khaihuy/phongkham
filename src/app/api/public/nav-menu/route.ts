import { prisma } from "@/db/prisma"
import { apiHandler, sendSuccess } from "@/lib/api-utils"

export const GET = apiHandler(async () => {
  const categories = await prisma.navCategory.findMany({
    where: { isActive: true },
    include: {
      items: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  })
  return sendSuccess(categories)
})
