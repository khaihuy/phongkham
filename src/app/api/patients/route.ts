import { auth } from "@/lib/auth"
import { patientService } from "@/lib/services/patient.service"
import { patientSchema } from "@/lib/validations/patient.schema"
import { apiError, apiSuccess } from "@/lib/utils"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return apiError("Unauthorized", "UNAUTHORIZED", 401)

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") ?? ""
  const page = Number(searchParams.get("page") ?? 1)
  const limit = Number(searchParams.get("limit") ?? 20)

  const result = await patientService.list({ search, page, limit })
  return apiSuccess(result.data, result.meta)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return apiError("Unauthorized", "UNAUTHORIZED", 401)

  const body = await req.json()
  const parsed = patientSchema.safeParse(body)

  if (!parsed.success) {
    return apiError("Dữ liệu không hợp lệ", "VALIDATION_ERROR", 422)
  }

  const patient = await patientService.create(parsed.data)
  return apiSuccess(patient)
}
