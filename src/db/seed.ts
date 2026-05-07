import { PrismaClient, Role, Gender, BloodType, AppointmentStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Bắt đầu seed dữ liệu...")

  // Clinic
  const clinic = await prisma.clinic.upsert({
    where: { id: "clinic-01" },
    update: {},
    create: {
      id: "clinic-01",
      name: "Phòng Khám Đa Khoa Hoàng Gia",
      phone: "028 3456 7890",
      email: "info@hoanggia.vn",
      address: "123 Nguyễn Huệ, Quận 1, TP. HCM",
      taxCode: "0312345678",
      licenseNo: "01-GP/BYT",
    },
  })

  // Branch
  const branch = await prisma.branch.upsert({
    where: { id: "branch-01" },
    update: {},
    create: {
      id: "branch-01",
      clinicId: clinic.id,
      name: "Chi Nhánh Quận 1",
      address: "123 Nguyễn Huệ, Quận 1, TP. HCM",
      phone: "028 3456 7890",
      isMain: true,
    },
  })

  // Rooms
  await prisma.room.createMany({
    skipDuplicates: true,
    data: [
      { id: "room-01", branchId: branch.id, name: "Phòng Khám 1", code: "PK01", floor: 1 },
      { id: "room-02", branchId: branch.id, name: "Phòng Khám 2", code: "PK02", floor: 1 },
      { id: "room-03", branchId: branch.id, name: "Phòng Siêu Âm", code: "SA01", floor: 2 },
    ],
  })

  // Specialties
  const specialties = await Promise.all([
    prisma.specialty.upsert({ where: { code: "DK" }, update: {}, create: { id: "spec-01", name: "Đa Khoa", code: "DK" } }),
    prisma.specialty.upsert({ where: { code: "TM" }, update: {}, create: { id: "spec-02", name: "Tim Mạch", code: "TM" } }),
    prisma.specialty.upsert({ where: { code: "NK" }, update: {}, create: { id: "spec-03", name: "Nhi Khoa", code: "NK" } }),
    prisma.specialty.upsert({ where: { code: "SK" }, update: {}, create: { id: "spec-04", name: "Sản Khoa", code: "SK" } }),
    prisma.specialty.upsert({ where: { code: "TK" }, update: {}, create: { id: "spec-05", name: "Thần Kinh", code: "TK" } }),
  ])

  const hash = await bcrypt.hash("Admin@123", 12)

  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      id: "user-admin",
      email: "admin@hoanggia.vn",
      username: "admin",
      passwordHash: hash,
      fullName: "Quản Trị Viên",
      role: Role.ADMIN,
    },
  })

  // Doctor users
  const doctorHash = await bcrypt.hash("Doctor@123", 12)
  const doctorUsers = await Promise.all([
    prisma.user.upsert({
      where: { username: "bs.minh" },
      update: {},
      create: {
        id: "user-doc-01",
        email: "bs.minh@hoanggia.vn",
        username: "bs.minh",
        passwordHash: doctorHash,
        fullName: "TS.BS. Nguyễn Văn Minh",
        role: Role.DOCTOR,
        phone: "0901234567",
      },
    }),
    prisma.user.upsert({
      where: { username: "bs.lan" },
      update: {},
      create: {
        id: "user-doc-02",
        email: "bs.lan@hoanggia.vn",
        username: "bs.lan",
        passwordHash: doctorHash,
        fullName: "ThS.BS. Trần Thị Lan",
        role: Role.DOCTOR,
        phone: "0912345678",
      },
    }),
    prisma.user.upsert({
      where: { username: "bs.hung" },
      update: {},
      create: {
        id: "user-doc-03",
        email: "bs.hung@hoanggia.vn",
        username: "bs.hung",
        passwordHash: doctorHash,
        fullName: "BS.CKI. Lê Văn Hùng",
        role: Role.DOCTOR,
        phone: "0923456789",
      },
    }),
  ])

  // Receptionist
  await prisma.user.upsert({
    where: { username: "letan.mai" },
    update: {},
    create: {
      id: "user-rec-01",
      email: "letan.mai@hoanggia.vn",
      username: "letan.mai",
      passwordHash: await bcrypt.hash("Staff@123", 12),
      fullName: "Phạm Thị Mai",
      role: Role.RECEPTIONIST,
      phone: "0934567890",
    },
  })

  // Doctors
  const doctors = await Promise.all([
    prisma.doctor.upsert({
      where: { userId: "user-doc-01" },
      update: {},
      create: {
        id: "doc-01",
        userId: "user-doc-01",
        branchId: branch.id,
        employeeCode: "BS001",
        specialtyId: specialties[0].id,
        title: "Tiến sĩ - Bác sĩ",
        licenseNo: "BV-001-2020",
        yearsOfExp: 15,
        consultFee: 200000,
      },
    }),
    prisma.doctor.upsert({
      where: { userId: "user-doc-02" },
      update: {},
      create: {
        id: "doc-02",
        userId: "user-doc-02",
        branchId: branch.id,
        employeeCode: "BS002",
        specialtyId: specialties[1].id,
        title: "Thạc sĩ - Bác sĩ",
        licenseNo: "BV-002-2021",
        yearsOfExp: 10,
        consultFee: 300000,
      },
    }),
    prisma.doctor.upsert({
      where: { userId: "user-doc-03" },
      update: {},
      create: {
        id: "doc-03",
        userId: "user-doc-03",
        branchId: branch.id,
        employeeCode: "BS003",
        specialtyId: specialties[2].id,
        title: "Bác sĩ Chuyên khoa I",
        licenseNo: "BV-003-2019",
        yearsOfExp: 8,
        consultFee: 150000,
      },
    }),
  ])

  // Patients
  const patients = await Promise.all([
    prisma.patient.upsert({
      where: { patientCode: "BN001" },
      update: {},
      create: {
        id: "pat-01",
        patientCode: "BN001",
        fullName: "Nguyễn Thị Hoa",
        dateOfBirth: new Date("1985-03-15"),
        gender: Gender.FEMALE,
        phone: "0901111111",
        email: "hoa.nguyen@gmail.com",
        address: "45 Lê Lợi, Quận 1",
        district: "Quận 1",
        province: "TP. HCM",
        bloodType: BloodType.A_POSITIVE,
        insuranceNo: "DN4012345678",
      },
    }),
    prisma.patient.upsert({
      where: { patientCode: "BN002" },
      update: {},
      create: {
        id: "pat-02",
        patientCode: "BN002",
        fullName: "Trần Văn An",
        dateOfBirth: new Date("1978-07-22"),
        gender: Gender.MALE,
        phone: "0902222222",
        address: "78 Trần Hưng Đạo, Quận 5",
        district: "Quận 5",
        province: "TP. HCM",
        bloodType: BloodType.O_POSITIVE,
      },
    }),
    prisma.patient.upsert({
      where: { patientCode: "BN003" },
      update: {},
      create: {
        id: "pat-03",
        patientCode: "BN003",
        fullName: "Lê Thị Bích Ngọc",
        dateOfBirth: new Date("1992-11-08"),
        gender: Gender.FEMALE,
        phone: "0903333333",
        address: "12 Cách Mạng Tháng 8, Quận 3",
        district: "Quận 3",
        province: "TP. HCM",
        bloodType: BloodType.B_POSITIVE,
        insuranceNo: "DN4087654321",
      },
    }),
    prisma.patient.upsert({
      where: { patientCode: "BN004" },
      update: {},
      create: {
        id: "pat-04",
        patientCode: "BN004",
        fullName: "Phạm Minh Tuấn",
        dateOfBirth: new Date("1965-04-30"),
        gender: Gender.MALE,
        phone: "0904444444",
        address: "99 Nguyễn Trãi, Quận 5",
        district: "Quận 5",
        province: "TP. HCM",
        bloodType: BloodType.AB_POSITIVE,
      },
    }),
    prisma.patient.upsert({
      where: { patientCode: "BN005" },
      update: {},
      create: {
        id: "pat-05",
        patientCode: "BN005",
        fullName: "Hoàng Thị Kim Oanh",
        dateOfBirth: new Date("2001-09-12"),
        gender: Gender.FEMALE,
        phone: "0905555555",
        address: "34 Đinh Tiên Hoàng, Bình Thạnh",
        district: "Bình Thạnh",
        province: "TP. HCM",
        bloodType: BloodType.O_NEGATIVE,
      },
    }),
  ])

  // Appointments
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]

  await prisma.appointment.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "appt-01",
        appointmentCode: "LH001",
        patientId: patients[0].id,
        doctorId: doctors[0].id,
        branchId: branch.id,
        roomId: "room-01",
        status: AppointmentStatus.CONFIRMED,
        scheduledDate: new Date(`${todayStr}T08:00:00`),
        scheduledTime: "08:00",
        duration: 30,
        chiefComplaint: "Đau đầu, chóng mặt",
      },
      {
        id: "appt-02",
        appointmentCode: "LH002",
        patientId: patients[1].id,
        doctorId: doctors[1].id,
        branchId: branch.id,
        roomId: "room-02",
        status: AppointmentStatus.IN_PROGRESS,
        scheduledDate: new Date(`${todayStr}T09:00:00`),
        scheduledTime: "09:00",
        duration: 30,
        chiefComplaint: "Đau ngực, khó thở",
      },
      {
        id: "appt-03",
        appointmentCode: "LH003",
        patientId: patients[2].id,
        doctorId: doctors[0].id,
        branchId: branch.id,
        status: AppointmentStatus.COMPLETED,
        scheduledDate: new Date(`${todayStr}T10:00:00`),
        scheduledTime: "10:00",
        duration: 30,
        chiefComplaint: "Khám thai định kỳ",
      },
      {
        id: "appt-04",
        appointmentCode: "LH004",
        patientId: patients[3].id,
        doctorId: doctors[2].id,
        branchId: branch.id,
        status: AppointmentStatus.PENDING,
        scheduledDate: new Date(`${todayStr}T14:00:00`),
        scheduledTime: "14:00",
        duration: 30,
        chiefComplaint: "Tái khám tiểu đường",
      },
      {
        id: "appt-05",
        appointmentCode: "LH005",
        patientId: patients[4].id,
        doctorId: doctors[1].id,
        branchId: branch.id,
        status: AppointmentStatus.CANCELLED,
        scheduledDate: new Date(`${todayStr}T15:00:00`),
        scheduledTime: "15:00",
        duration: 30,
        cancelReason: "Bệnh nhân bận việc đột xuất",
      },
    ],
  })

  // Drug categories
  const drugCat = await prisma.drugCategory.upsert({
    where: { code: "THUOC-KHANG-SINH" },
    update: {},
    create: { id: "dcat-01", name: "Thuốc Kháng Sinh", code: "THUOC-KHANG-SINH" },
  })
  const drugCat2 = await prisma.drugCategory.upsert({
    where: { code: "THUOC-HA-SOT" },
    update: {},
    create: { id: "dcat-02", name: "Thuốc Hạ Sốt - Giảm Đau", code: "THUOC-HA-SOT" },
  })

  // Drugs
  await prisma.drug.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "drug-01",
        categoryId: drugCat.id,
        name: "Amoxicillin 500mg",
        genericName: "Amoxicillin",
        code: "AMX500",
        unit: "TABLET" as any,
        strength: "500mg",
        form: "Viên nén",
        manufacturer: "Imexpharm",
        requirePrescription: true,
        minStock: 100,
      },
      {
        id: "drug-02",
        categoryId: drugCat2.id,
        name: "Paracetamol 500mg",
        genericName: "Paracetamol",
        code: "PCT500",
        unit: "TABLET" as any,
        strength: "500mg",
        form: "Viên nén",
        manufacturer: "Hậu Giang",
        requirePrescription: false,
        minStock: 200,
      },
      {
        id: "drug-03",
        categoryId: drugCat2.id,
        name: "Ibuprofen 400mg",
        genericName: "Ibuprofen",
        code: "IBU400",
        unit: "TABLET" as any,
        strength: "400mg",
        form: "Viên nén",
        manufacturer: "DHG Pharma",
        requirePrescription: false,
        minStock: 100,
      },
    ],
  })

  // Service
  await prisma.service.createMany({
    skipDuplicates: true,
    data: [
      { id: "svc-01", clinicId: clinic.id, name: "Khám Đa Khoa", code: "KDK", price: 200000 },
      { id: "svc-02", clinicId: clinic.id, name: "Khám Tim Mạch", code: "KTM", price: 300000 },
      { id: "svc-03", clinicId: clinic.id, name: "Xét Nghiệm Máu", code: "XNM", price: 150000 },
      { id: "svc-04", clinicId: clinic.id, name: "Siêu Âm Bụng", code: "SAB", price: 250000 },
      { id: "svc-05", clinicId: clinic.id, name: "Chụp X-Quang", code: "XQ", price: 200000 },
    ],
  })

  console.log("✅ Seed dữ liệu hoàn thành!")
  console.log("")
  console.log("Tài khoản mặc định:")
  console.log("  admin / Admin@123     (Quản trị viên)")
  console.log("  bs.minh / Doctor@123  (Bác sĩ)")
  console.log("  letan.mai / Staff@123 (Lễ tân)")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
