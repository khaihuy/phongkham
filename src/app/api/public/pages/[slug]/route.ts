import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, sendSuccess, error } from "@/lib/api-utils"

export const GET = apiHandler(async (_request: NextRequest, { params }: { params: { slug: string } }) => {
  const page = await prisma.sitePage.findUnique({ where: { slug: params.slug } })

  if (!page || page.status !== "PUBLISHED" || page.deletedAt) {
    throw error("NOT_FOUND", 404, "Không tìm thấy trang")
  }

  return sendSuccess(page)
})
