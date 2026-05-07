import { z } from "zod"

// Auth
export const loginSchema = z.object({
  username: z.string().min(1, "Tên đăng nhập không được để trống"),
  password: z.string().min(1, "Mật khẩu không được để trống"),
})

// Patients
export const createPatientSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  dateOfBirth: z.string().refine((d) => !isNaN(Date.parse(d)), "Ngày sinh không hợp lệ"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  phone: z.string().regex(/^0\d{9}$/, "Số điện thoại không hợp lệ"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  address: z.string().optional(),
  ward: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  idCardNo: z.string().optional(),
  insuranceNo: z.string().optional(),
  bloodType: z
    .enum([
      "A_POSITIVE",
      "A_NEGATIVE",
      "B_POSITIVE",
      "B_NEGATIVE",
      "AB_POSITIVE",
      "AB_NEGATIVE",
      "O_POSITIVE",
      "O_NEGATIVE",
      "UNKNOWN",
    ])
    .default("UNKNOWN"),
  occupation: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRel: z.string().optional(),
  notes: z.string().optional(),
})

export const updatePatientSchema = createPatientSchema.partial()

// Appointments
export const createAppointmentSchema = z.object({
  patientId: z.string().min(1, "Bệnh nhân không được để trống"),
  doctorId: z.string().min(1, "Bác sĩ không được để trống"),
  branchId: z.string().min(1, "Chi nhánh không được để trống"),
  roomId: z.string().optional(),
  specialtyId: z.string().optional(),
  type: z.enum(["GENERAL", "SPECIALIST", "FOLLOW_UP", "EMERGENCY", "TELEMEDICINE"]).default("GENERAL"),
  scheduledDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Ngày hẹn không hợp lệ"),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, "Định dạng giờ không hợp lệ"),
  duration: z.number().int().positive().default(30),
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
  serviceId: z.string().optional(),
})

export const updateAppointmentSchema = createAppointmentSchema.partial()

export const appointmentStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  cancelReason: z.string().optional(),
  vitalSigns: z.object({
    systolic: z.number().optional(),
    diastolic: z.number().optional(),
    heartRate: z.number().optional(),
    temperature: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
    spo2: z.number().optional(),
    notes: z.string().optional(),
  }).optional(),
})

// Doctors
export const createDoctorSchema = z.object({
  userId: z.string().min(1, "User không được để trống"),
  branchId: z.string().min(1, "Chi nhánh không được để trống"),
  employeeCode: z.string().min(1, "Mã nhân viên không được để trống"),
  specialtyId: z.string().min(1, "Chuyên khoa không được để trống"),
  title: z.string().optional(),
  bio: z.string().optional(),
  licenseNo: z.string().min(1, "Số giấy phép không được để trống"),
  yearsOfExp: z.number().int().nonnegative().default(0),
  consultFee: z.string().refine((v) => !isNaN(parseFloat(v)), "Giá khám không hợp lệ"),
})

export const updateDoctorSchema = createDoctorSchema.partial()

// Medical Records
export const createMedicalRecordSchema = z.object({
  appointmentId: z.string().min(1, "Cuộc hẹn không được để trống"),
  patientId: z.string().min(1, "Bệnh nhân không được để trống"),
  doctorId: z.string().min(1, "Bác sĩ không được để trống"),
  visitDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Ngày khám không hợp lệ"),
  chiefComplaint: z.string().optional(),
  clinicalNotes: z.string().optional(),
  physicalExam: z.string().optional(),
  diagnosis: z.string().optional(),
  icdCode: z.string().optional(),
  treatment: z.string().optional(),
  followUpDate: z.string().optional(),
  followUpNotes: z.string().optional(),
  isConfidential: z.boolean().default(false),
})

export const updateMedicalRecordSchema = createMedicalRecordSchema.partial()

export const prescriptionSchema = z.object({
  medicalRecordId: z.string().min(1, "Hồ sơ bệnh án không được để trống"),
  items: z.array(
    z.object({
      drugId: z.string().min(1, "Thuốc không được để trống"),
      quantity: z.number().int().positive(),
      dosage: z.string().min(1, "Liều lượng không được để trống"),
      frequency: z.string().min(1, "Tần suất không được để trống"),
      duration: z.string().min(1, "Thời gian không được để trống"),
      route: z.string().optional(),
      instructions: z.string().optional(),
      unitPrice: z.string().refine((v) => !isNaN(parseFloat(v)), "Giá không hợp lệ"),
    })
  ),
  notes: z.string().optional(),
})

// Invoices
export const createInvoiceSchema = z.object({
  patientId: z.string().min(1, "Bệnh nhân không được để trống"),
  appointmentId: z.string().optional(),
  items: z.array(
    z.object({
      type: z.enum(["SERVICE", "DRUG"]),
      serviceId: z.string().optional(),
      drugId: z.string().optional(),
      name: z.string().min(1, "Tên mục không được để trống"),
      quantity: z.number().int().positive(),
      unitPrice: z.string().refine((v) => !isNaN(parseFloat(v)), "Giá không hợp lệ"),
      discount: z.string().refine((v) => !isNaN(parseFloat(v)), "Giảm giá không hợp lệ").default("0"),
      notes: z.string().optional(),
    })
  ),
  subtotal: z.string().refine((v) => !isNaN(parseFloat(v)), "Tiền không hợp lệ"),
  discount: z.string().refine((v) => !isNaN(parseFloat(v)), "Giảm giá không hợp lệ").default("0"),
  discountType: z.enum(["FIXED", "PERCENT"]).optional(),
  taxAmount: z.string().refine((v) => !isNaN(parseFloat(v)), "Thuế không hợp lệ").default("0"),
  totalAmount: z.string().refine((v) => !isNaN(parseFloat(v)), "Tổng tiền không hợp lệ"),
  insuranceCover: z.string().refine((v) => !isNaN(parseFloat(v)), "Bảo hiểm không hợp lệ").default("0"),
  patientPays: z.string().refine((v) => !isNaN(parseFloat(v)), "Tiền thanh toán không hợp lệ"),
  notes: z.string().optional(),
})

export const updateInvoiceSchema = createInvoiceSchema.partial()

export const paymentSchema = z.object({
  amount: z.string().refine((v) => !isNaN(parseFloat(v)), "Số tiền không hợp lệ"),
  method: z.enum(["CASH", "BANK_TRANSFER", "CARD", "MOMO", "ZALOPAY", "VNPAY", "INSURANCE"]),
  transactionId: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

// Drugs
export const createDrugSchema = z.object({
  categoryId: z.string().min(1, "Danh mục không được để trống"),
  name: z.string().min(1, "Tên thuốc không được để trống"),
  genericName: z.string().optional(),
  brandName: z.string().optional(),
  code: z.string().min(1, "Mã thuốc không được để trống"),
  barcode: z.string().optional(),
  unit: z.enum(["TABLET", "CAPSULE", "BOTTLE", "AMPOULE", "TUBE", "SACHET", "VIAL", "BOX"]),
  strength: z.string().optional(),
  form: z.string().optional(),
  manufacturer: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  registrationNo: z.string().optional(),
  requirePrescription: z.boolean().default(false),
  minStock: z.number().int().nonnegative().default(10),
})

export const updateDrugSchema = createDrugSchema.partial()

export const adjustStockSchema = z.object({
  quantity: z.number().int(),
  reason: z.string().optional(),
})

// Types
export type LoginInput = z.infer<typeof loginSchema>
export type CreatePatientInput = z.infer<typeof createPatientSchema>
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
export type AppointmentStatusInput = z.infer<typeof appointmentStatusSchema>
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>
export type CreateMedicalRecordInput = z.infer<typeof createMedicalRecordSchema>
export type UpdateMedicalRecordInput = z.infer<typeof updateMedicalRecordSchema>
export type PrescriptionInput = z.infer<typeof prescriptionSchema>
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
export type PaymentInput = z.infer<typeof paymentSchema>
export type CreateDrugInput = z.infer<typeof createDrugSchema>
export type UpdateDrugInput = z.infer<typeof updateDrugSchema>
export type AdjustStockInput = z.infer<typeof adjustStockSchema>
