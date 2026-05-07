import { auth } from "@/lib/auth"
import { appointmentService } from "@/lib/services/appointment.service"
import { apiError, apiSuccess } from "@/lib/utils"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return apiError("Unauthorized", "UNAUTHORIZED", 401)

  const { searchParams } = new URL(req.url)
  const doctorId = searchParams.get("doctorId")
  const date = searchParams.get("date")

  if (!doctorId || !date) {
    return apiError("Thiếu doctorId hoặc date", "BAD_REQUEST", 400)
  }

  const slots = await appointmentService.getAvailableSlots(doctorId, date)
  return apiSuccess(slots)
}
