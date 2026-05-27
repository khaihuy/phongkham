import { prisma } from "@/db/prisma"
import { apiHandler, sendSuccess } from "@/lib/api-utils"

export const GET = apiHandler(async () => {
  const [clinic, branches] = await Promise.all([
    prisma.clinic.findFirst({
      select: {
        name: true,
        phone: true,
        email: true,
        address: true,
        licenseNo: true,
        pharmacyName: true,
        pharmacyAddress: true,
        pharmacyPhone: true,
      },
    }),
    prisma.branch.findMany({
      orderBy: [{ isMain: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        isMain: true,
      },
    }),
  ])
  return sendSuccess({ clinic, branches })
})
