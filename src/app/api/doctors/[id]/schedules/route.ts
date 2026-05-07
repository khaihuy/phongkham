import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess, validateBody, error } from "@/lib/api-utils"
import { z } from "zod"

const createScheduleSchema = z.object({
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Định dạng giờ không hợp lệ"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Định dạng giờ không hợp lệ"),
  maxSlots: z.number().int().min(1).default(20),
  isActive: z.boolean().default(true),
})

export const POST = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  await getAuthUser()

  const doctor = await prisma.doctor.findUnique({ where: { id: params.id } })
  if (!doctor) {
    throw error("NOT_FOUND", 404, "Bác sĩ không tìm thấy")
  }

  const input = await validateBody(request, createScheduleSchema)

  const schedule = await prisma.doctorSchedule.create({
    data: {
      doctorId: params.id,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      maxSlots: input.maxSlots,
      isActive: input.isActive,
    },
  })

  return sendSuccess(schedule, 201)
})
