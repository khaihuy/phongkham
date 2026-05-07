import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  getAuthUser,
  sendSuccess,
  error,
} from "@/lib/api-utils"

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  message: z.string().min(1).optional(),
  scheduledAt: z.string().optional().nullable(),
})

const patchCampaignSchema = z.object({
  action: z.enum(["launch", "cancel"]),
})

export const GET = apiHandler(async (request: NextRequest, context: any) => {
  await getAuthUser()

  const { id } = context.params
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      logs: { orderBy: { createdAt: "desc" }, take: 50 },
      _count: { select: { logs: true } },
    },
  })

  if (!campaign) throw error("NOT_FOUND", 404, "Không tìm thấy chiến dịch")

  return sendSuccess(campaign)
})

export const PUT = apiHandler(async (request: NextRequest, context: any) => {
  await getAuthUser()

  const { id } = context.params
  const existing = await prisma.campaign.findUnique({ where: { id } })
  if (!existing) throw error("NOT_FOUND", 404, "Không tìm thấy chiến dịch")

  const body = await request.json()
  const input = updateCampaignSchema.parse(body)

  const campaign = await prisma.campaign.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.message !== undefined && { message: input.message }),
      ...(input.scheduledAt !== undefined && {
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        status: input.scheduledAt ? "SCHEDULED" : existing.status,
      }),
    },
  })

  return sendSuccess(campaign)
})

export const PATCH = apiHandler(async (request: NextRequest, context: any) => {
  await getAuthUser()

  const { id } = context.params
  const existing = await prisma.campaign.findUnique({ where: { id } })
  if (!existing) throw error("NOT_FOUND", 404, "Không tìm thấy chiến dịch")

  const body = await request.json()
  const { action } = patchCampaignSchema.parse(body)

  let updateData: any = {}

  if (action === "launch") {
    if (!["DRAFT", "SCHEDULED"].includes(existing.status)) {
      throw error("CONFLICT", 409, "Chỉ có thể khởi chạy chiến dịch ở trạng thái Nháp hoặc Đã lên lịch")
    }
    updateData = { status: "RUNNING", sentAt: new Date() }
  } else if (action === "cancel") {
    if (["COMPLETED", "CANCELLED"].includes(existing.status)) {
      throw error("CONFLICT", 409, "Không thể hủy chiến dịch đã hoàn thành hoặc đã hủy")
    }
    updateData = { status: "CANCELLED" }
  }

  const campaign = await prisma.campaign.update({
    where: { id },
    data: updateData,
  })

  return sendSuccess(campaign)
})
