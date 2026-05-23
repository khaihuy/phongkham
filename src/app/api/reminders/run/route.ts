import { NextRequest } from "next/server"
import { z } from "zod"
import { apiHandler, requireRole, sendSuccess } from "@/lib/api-utils"
import { runReminders } from "@/lib/services/marketing/reminder.service"

const runSchema = z.object({
  channel: z.enum(["SMS", "EMAIL", "ZALO"]).optional(),
  windowHours: z.number().int().min(1).max(168).optional(),
})

export const POST = apiHandler(async (request: NextRequest) => {
  await requireRole(["ADMIN", "RECEPTIONIST"])

  const body = await request.json().catch(() => ({}))
  const input = runSchema.parse(body)

  const result = await runReminders(input)
  return sendSuccess(result)
})
