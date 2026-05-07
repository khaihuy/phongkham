import { auth } from "@/lib/auth"
import { appointmentService } from "@/lib/services/appointment.service"
import { appointmentSchema } from "@/lib/validations/appointment.schema"
import { apiError, apiSuccess } from "@/lib/utils"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return apiError("Unauthorized", "UNAUTHORIZED", 401)

  const { searchParams } = new URL(req.url)
  const result = await appointmentService.list({
    search: searchParams.get("search") ?? "",
    status: searchParams.get("status") ?? undefined,
    doctorId: searchParams.get("doctorId") ?? undefined,
    date: searchParams.get("date") ?? undefined,
    page: Number(searchParams.get("page") ?? 1),
    limit: Number(searchParams.get("limit") ?? 20),
  })

  return apiSuccess(result.data, result.meta)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return apiError("Unauthorized", "UNAUTHORIZED", 401)

  const body = await req.json()
  const parsed = appointmentSchema.safeParse(body)

  if (!parsed.success) {
    return apiError("Dữ liệu không hợp lệ", "VALIDATION_ERROR", 422)
  }

  const appointment = await appointmentService.create(parsed.data)
  return apiSuccess(appointment)
}
