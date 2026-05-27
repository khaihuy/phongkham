import { z } from "zod"

export const patientSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  dateOfBirth: z.string().refine((d) => !isNaN(Date.parse(d)), "Ngày sinh không hợp lệ"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  phone: z
    .string()
    .transform((s) => s.replace(/[\s\-\.()]/g, ""))
    .refine(
      (s) => /^(\+?84|0)\d{9,10}$/.test(s),
      "Số điện thoại không hợp lệ (10-11 số, có thể bắt đầu bằng 0 hoặc +84)"
    ),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  address: z.string().optional(),
  ward: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  idCardNo: z.string().optional(),
  insuranceNo: z.string().optional(),
  bloodType: z.enum(["A_POSITIVE","A_NEGATIVE","B_POSITIVE","B_NEGATIVE","AB_POSITIVE","AB_NEGATIVE","O_POSITIVE","O_NEGATIVE","UNKNOWN"]).default("UNKNOWN"),
  occupation: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRel: z.string().optional(),
  notes: z.string().optional(),
})

export const patientUpdateSchema = patientSchema.partial()

export type PatientInput = z.infer<typeof patientSchema>
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>
