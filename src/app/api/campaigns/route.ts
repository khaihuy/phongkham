import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/db/prisma"
import {
  apiHandler,
  getAuthUser,
  getPaginationParams,
  sendSuccess,
  createMeta,
  error,
} from "@/lib/api-utils"

const createCampaignSchema = z.object({
  name: z.string().min(1, "Tên chiến dịch không được trống"),
  description: z.string().optional(),
  channel: z.enum(["SMS", "EMAIL", "ZALO"]),
  message: z.string().min(1, "Nội dung tin nhắn không được trống"),
  scheduledAt: z.string().optional().nullable(),
})

export const GET = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const { searchParams } = request.nextUrl
  const status = searchParams.get("status")
  const channel = searchParams.get("channel")
  const { page, pageSize, skip } = getPaginationParams({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
  })

  const where: any = {}
  if (status) where.status = status
  if (channel) where.channel = channel

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { logs: true } },
      },
    }),
    prisma.campaign.count({ where }),
  ])

  const meta = createMeta(page, pageSize, total)
  return sendSuccess(campaigns, 200, meta)
})

export const POST = apiHandler(async (request: NextRequest) => {
  await getAuthUser()

  const body = await request.json()
  const input = createCampaignSchema.parse(body)

  const campaign = await prisma.campaign.create({
    data: {
      name: input.name,
      type: "BROADCAST",
      channel: input.channel,
      message: input.message,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      status: input.scheduledAt ? "SCHEDULED" : "DRAFT",
    },
  })

  return sendSuccess(campaign, 201)
})
