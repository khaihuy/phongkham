import { auth } from "@/lib/auth"
import { patientService } from "@/lib/services/patient.service"
import { patientUpdateSchema } from "@/lib/validations/patient.schema"
import { apiError, apiSuccess } from "@/lib/utils"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return apiError("Unauthorized", "UNAUTHORIZED", 401)

  const patient = await patientService.getById(params.id)
  if (!patient) return apiError("Không tìm thấy bệnh nhân", "NOT_FOUND", 404)

  return apiSuccess(patient)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return apiError("Unauthorized", "UNAUTHORIZED", 401)

  const body = await req.json()
  const parsed = patientUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return apiError("Dữ liệu không hợp lệ", "VALIDATION_ERROR", 422)
  }

  const patient = await patientService.update(params.id, parsed.data)
  return apiSuccess(patient)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return apiError("Unauthorized", "UNAUTHORIZED", 401)

  await patientService.softDelete(params.id)
  return apiSuccess({ message: "Đã xóa bệnh nhân" })
}
