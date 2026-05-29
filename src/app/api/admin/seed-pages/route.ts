import { NextRequest } from "next/server"
import { apiHandler, requireRole, sendSuccess } from "@/lib/api-utils"
import { seedSitePages } from "../../../../../prisma/seed-pages"

// Tạo/đảm bảo các trang nội dung footer mặc định trên DB hiện có (idempotent).
export const POST = apiHandler(async (_request: NextRequest) => {
  await requireRole(["ADMIN"])
  const result = await seedSitePages()
  return sendSuccess(result, 200)
})
