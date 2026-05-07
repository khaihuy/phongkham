import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess, validateBody, error } from "@/lib/api-utils"
import { z } from "zod"

const patchScheduleSchema = z.object({
  isActive: z.boolean(),
})

export const PATCH = apiHandler(async (request: NextRequest, { params }: { params: { id: string; scheduleId: string } }) => {
  await getAuthUser()

  const schedule = await prisma.doctorSchedule.findUnique({
    where: { id: params.scheduleId },
  })

  if (!schedule || schedule.doctorId !== params.id) {
    throw error("NOT_FOUND", 404, "Lịch làm việc không tìm thấy")
  }

  const input = await validateBody(request, patchScheduleSchema)

  const updated = await prisma.doctorSchedule.update({
    where: { id: params.scheduleId },
    data: { isActive: input.isActive },
  })

  return sendSuccess(updated)
})

export const DELETE = apiHandler(async (request: NextRequest, { params }: { params: { id: string; scheduleId: string } }) => {
  await getAuthUser()

  const schedule = await prisma.doctorSchedule.findUnique({
    where: { id: params.scheduleId },
  })

  if (!schedule || schedule.doctorId !== params.id) {
    throw error("NOT_FOUND", 404, "Lịch làm việc không tìm thấy")
  }

  await prisma.doctorSchedule.delete({
    where: { id: params.scheduleId },
  })

  return sendSuccess({ success: true })
})
