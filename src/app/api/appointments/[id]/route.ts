import { auth } from "@/lib/auth"
import { appointmentService } from "@/lib/services/appointment.service"
import { appointmentUpdateSchema } from "@/lib/validations/appointment.schema"
import { apiError, apiSuccess } from "@/lib/utils"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return apiError("Unauthorized", "UNAUTHORIZED", 401)

  const appointment = await appointmentService.getById(params.id)
  if (!appointment) return apiError("Không tìm thấy lịch hẹn", "NOT_FOUND", 404)

  return apiSuccess(appointment)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return apiError("Unauthorized", "UNAUTHORIZED", 401)

  const body = await req.json()
  const parsed = appointmentUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return apiError("Dữ liệu không hợp lệ", "VALIDATION_ERROR", 422)
  }

  const appointment = await appointmentService.update(params.id, parsed.data)
  return apiSuccess(appointment)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return apiError("Unauthorized", "UNAUTHORIZED", 401)

  await appointmentService.updateStatus(params.id, "CANCELLED")
  return apiSuccess({ message: "Đã hủy lịch hẹn" })
}
