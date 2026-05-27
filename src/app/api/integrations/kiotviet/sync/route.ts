import { NextRequest } from "next/server"
import { z } from "zod"
import { apiHandler, requireRole, sendSuccess } from "@/lib/api-utils"
import { syncDrugsFromKiotViet } from "@/lib/integrations/kiotviet/sync"

const syncSchema = z.object({
  // Số ngày trở lại để pull (incremental). Mặc định pull all.
  sinceDays: z.number().int().min(1).max(365).optional(),
  maxPages: z.number().int().min(1).max(100).optional(),
})

export const POST = apiHandler(async (request: NextRequest) => {
  await requireRole(["ADMIN", "PHARMACIST"])

  const body = await request.json().catch(() => ({}))
  const { sinceDays, maxPages } = syncSchema.parse(body)

  const since = sinceDays ? new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000) : undefined
  const result = await syncDrugsFromKiotViet({ since, maxPages })

  return sendSuccess(result)
})
