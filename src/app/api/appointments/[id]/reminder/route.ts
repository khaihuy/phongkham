import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess, error } from "@/lib/api-utils"
import { z } from "zod"

const reminderSchema = z.object({
  channel: z.enum(["SMS", "EMAIL", "ZALO"]),
  scheduledFor: z.string().datetime(),
  message: z.string().optional(),
})

export const POST = apiHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    await getAuthUser()

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
    })

    if (!appointment) {
      throw error("NOT_FOUND", 404, "Cuộc hẹn không tìm thấy")
    }

    const body = await request.json()
    const input = reminderSchema.parse(body)

    const reminder = await prisma.appointmentReminder.create({
      data: {
        appointmentId: params.id,
        channel: input.channel,
        scheduledAt: new Date(input.scheduledFor),
        message: input.message ?? "",
        status: "PENDING",
      },
    })

    return sendSuccess(reminder, 201)
  }
)
