export type Gender = 'Nam' | 'Nữ' | 'Khác';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type PaymentStatus = 'chưa thanh toán' | 'đã thanh toán' | 'một phần';

export type PaymentMethod = 'tiền mặt' | 'chuyển khoản' | 'thẻ' | 'bảo hiểm';

export interface Patient {
  id: string;
  code: string; // BN001, BN002...
  fullName: string;
  dateOfBirth: string; // ISO string
  gender: Gender;
  phone: string;
  email?: string;
  address: string;
  bloodType?: BloodType;
  allergies?: string;
  chronicDiseases?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  insuranceNumber?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Doctor {
  id: string;
  code: string; // BS001...
  fullName: string;
  specialty: string;
  phone: string;
  email: string;
  licenseNumber: string;
  education: string;
  experience: number; // years
  schedule: DoctorSchedule[];
  avatar?: string;
  bio?: string;
  status: 'active' | 'inactive';
  consultationFee: number;
}

export interface DoctorSchedule {
  dayOfWeek: number; // 0=Sunday, 1=Monday...
  startTime: string; // HH:mm
  endTime: string;
}

export interface Appointment {
  id: string;
  code: string; // LH001...
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string; // ISO date string
  time: string; // HH:mm
  reason: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  room?: string;
}

export interface MedicalRecord {
  id: string;
  code: string; // HS001...
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentId?: string;
  visitDate: string;
  chiefComplaint: string; // Lý do khám
  diagnosis: string; // Chẩn đoán
  icdCode?: string;
  symptoms: string; // Triệu chứng
  examination: string; // Kết quả khám
  treatment: string; // Phương án điều trị
  prescriptions: Prescription[];
  labTests?: LabTest[];
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string; // e.g., "3 lần/ngày"
  duration: string; // e.g., "7 ngày"
  instructions: string;
  quantity: number;
  unit: string;
}

export interface LabTest {
  id: string;
  testName: string;
  result: string;
  normalRange?: string;
  unit?: string;
  status: 'bình thường' | 'bất thường' | 'chờ kết quả';
}

export interface Invoice {
  id: string;
  code: string; // HD001...
  patientId: string;
  patientName: string;
  appointmentId?: string;
  medicalRecordId?: string;
  doctorName: string;
  invoiceDate: string;
  dueDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  category: 'khám bệnh' | 'thuốc' | 'xét nghiệm' | 'thủ thuật' | 'khác';
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  monthlyRevenue: number;
  completedAppointments: number;
  pendingAppointments: number;
  totalDoctors: number;
}
