import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, sendSuccess } from "@/lib/api-utils"

export const GET = apiHandler(async (_request: NextRequest) => {
  const rooms = await prisma.room.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })
  return sendSuccess(rooms)
})
