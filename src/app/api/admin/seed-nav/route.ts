import { apiHandler, requireRole, sendSuccess } from "@/lib/api-utils"
import { seedNavMenu } from "@/../prisma/seed-nav"

export const POST = apiHandler(async () => {
  await requireRole(["ADMIN"])
  await seedNavMenu()
  return sendSuccess({ seeded: true })
})
