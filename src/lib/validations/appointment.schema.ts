import { z } from "zod"

export const appointmentSchema = z.object({
  patientId: z.string().min(1, "Vui lòng chọn bệnh nhân"),
  doctorId: z.string().min(1, "Vui lòng chọn bác sĩ"),
  branchId: z.string().min(1, "Vui lòng chọn chi nhánh"),
  roomId: z.string().optional(),
  specialtyId: z.string().optional(),
  type: z.enum(["GENERAL","SPECIALIST","FOLLOW_UP","EMERGENCY","TELEMEDICINE"]).default("GENERAL"),
  scheduledDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Ngày không hợp lệ"),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, "Giờ không hợp lệ"),
  duration: z.number().min(15).max(120).default(30),
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
})

export const appointmentUpdateSchema = appointmentSchema.partial().extend({
  status: z.enum(["PENDING","CONFIRMED","IN_PROGRESS","COMPLETED","CANCELLED","NO_SHOW"]).optional(),
  cancelReason: z.string().optional(),
})

export type AppointmentInput = z.infer<typeof appointmentSchema>
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>
