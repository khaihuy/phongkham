import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...');

  // Skip if already seeded
  const existingClinic = await prisma.clinic.findFirst();
  if (existingClinic) {
    console.log('⏭️  Dữ liệu đã tồn tại, bỏ qua seed.');
    return;
  }

  // 1. Create clinic & branches
  const clinic = await prisma.clinic.create({
    data: {
      name: 'Phòng Khám An Khang',
      taxCode: '0123456789',
      phone: '(028) 1234 5678',
      email: 'info@ankhanghc.com',
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      licenseNo: 'QĐ-2024-001',
      website: 'https://ankhanghc.com',
    },
  });

  const mainBranch = await prisma.branch.create({
    data: {
      clinicId: clinic.id,
      name: 'Chi nhánh chính',
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      phone: '(028) 1234 5678',
      isMain: true,
    },
  });

  // 2. Create rooms
  const room1 = await prisma.room.create({
    data: {
      branchId: mainBranch.id,
      name: 'Phòng khám 1',
      code: 'PK001',
      floor: 1,
    },
  });

  const room2 = await prisma.room.create({
    data: {
      branchId: mainBranch.id,
      name: 'Phòng khám 2',
      code: 'PK002',
      floor: 1,
    },
  });

  const room3 = await prisma.room.create({
    data: {
      branchId: mainBranch.id,
      name: 'Phòng khám 3',
      code: 'PK003',
      floor: 2,
    },
  });

  // 3. Create specialties
  const specialties = await Promise.all([
    prisma.specialty.create({
      data: {
        name: 'Nội khoa',
        code: 'NOI',
        description: 'Khám và điều trị bệnh nội khoa',
      },
    }),
    prisma.specialty.create({
      data: {
        name: 'Ngoại khoa',
        code: 'NGOAI',
        description: 'Khám và điều trị bệnh ngoại khoa',
      },
    }),
    prisma.specialty.create({
      data: {
        name: 'Nha khoa',
        code: 'NHA',
        description: 'Khám và điều trị bệnh nha khoa',
      },
    }),
    prisma.specialty.create({
      data: {
        name: 'Mắt',
        code: 'MAT',
        description: 'Khám và điều trị bệnh mắt',
      },
    }),
  ]);

  // 4. Create users (doctors)
  const doctors = await Promise.all([
    prisma.user.create({
      data: {
        email: 'dr.hung@clinic.com',
        username: 'dr.hung',
        passwordHash: await bcrypt.hash('Password123!', 10),
        fullName: 'Trần Văn Hùng',
        phone: '0901234567',
        role: 'DOCTOR',
      },
    }),
    prisma.user.create({
      data: {
        email: 'dr.minh@clinic.com',
        username: 'dr.minh',
        passwordHash: await bcrypt.hash('Password123!', 10),
        fullName: 'Phạm Thị Minh',
        phone: '0902345678',
        role: 'DOCTOR',
      },
    }),
    prisma.user.create({
      data: {
        email: 'dr.hoa@clinic.com',
        username: 'dr.hoa',
        passwordHash: await bcrypt.hash('Password123!', 10),
        fullName: 'Nguyễn Hoa',
        phone: '0903456789',
        role: 'DOCTOR',
      },
    }),
    prisma.user.create({
      data: {
        email: 'dr.linh@clinic.com',
        username: 'dr.linh',
        passwordHash: await bcrypt.hash('Password123!', 10),
        fullName: 'Vũ Thị Linh',
        phone: '0904567890',
        role: 'DOCTOR',
      },
    }),
    prisma.user.create({
      data: {
        email: 'reception@clinic.com',
        username: 'reception',
        passwordHash: await bcrypt.hash('Password123!', 10),
        fullName: 'Lê Thị Thanh Hoa',
        phone: '0905678901',
        role: 'RECEPTIONIST',
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin@clinic.com',
        username: 'admin',
        passwordHash: await bcrypt.hash('Password123!', 10),
        fullName: 'Quản trị viên',
        phone: '0906789012',
        role: 'ADMIN',
      },
    }),
  ]);

  // 5. Link users to doctors
  await Promise.all([
    prisma.doctor.create({
      data: {
        userId: doctors[0].id,
        branchId: mainBranch.id,
        employeeCode: 'BS001',
        specialtyId: specialties[0].id,
        title: 'Bác sĩ',
        licenseNo: 'LIC001',
        yearsOfExp: 15,
        consultFee: 500000,
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctors[1].id,
        branchId: mainBranch.id,
        employeeCode: 'BS002',
        specialtyId: specialties[1].id,
        title: 'Bác sĩ',
        licenseNo: 'LIC002',
        yearsOfExp: 12,
        consultFee: 450000,
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctors[2].id,
        branchId: mainBranch.id,
        employeeCode: 'BS003',
        specialtyId: specialties[2].id,
        title: 'Bác sĩ',
        licenseNo: 'LIC003',
        yearsOfExp: 10,
        consultFee: 400000,
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctors[3].id,
        branchId: mainBranch.id,
        employeeCode: 'BS004',
        specialtyId: specialties[3].id,
        title: 'Bác sĩ chuyên khoa',
        licenseNo: 'LIC004',
        yearsOfExp: 20,
        consultFee: 600000,
      },
    }),
  ]);

  // 6. Create patients
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        patientCode: 'BN001',
        fullName: 'Nguyễn Văn An',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'MALE',
        phone: '0901111111',
        email: 'nvan.an@gmail.com',
        address: '45 Trần Hưng Đạo',
        ward: 'Phường 1',
        district: 'Quận 1',
        province: 'TP.HCM',
        idCardNo: '123456789',
        bloodType: 'O_POSITIVE',
        emergencyName: 'Nguyễn Thị Bình',
        emergencyPhone: '0901111112',
        emergencyRel: 'Vợ',
      },
    }),
    prisma.patient.create({
      data: {
        patientCode: 'BN002',
        fullName: 'Trần Thị Bích',
        dateOfBirth: new Date('1985-08-20'),
        gender: 'FEMALE',
        phone: '0902222222',
        email: 'ttbich@gmail.com',
        address: '78 Nguyễn Thái Học',
        ward: 'Phường 2',
        district: 'Quận 3',
        province: 'TP.HCM',
        idCardNo: '987654321',
        bloodType: 'A_POSITIVE',
      },
    }),
    prisma.patient.create({
      data: {
        patientCode: 'BN003',
        fullName: 'Phạm Văn Dũng',
        dateOfBirth: new Date('1995-12-10'),
        gender: 'MALE',
        phone: '0903333333',
        email: 'pvdung@gmail.com',
        address: '92 Lê Thánh Tông',
        ward: 'Phường 3',
        district: 'Quận 10',
        province: 'TP.HCM',
        bloodType: 'B_POSITIVE',
      },
    }),
    prisma.patient.create({
      data: {
        patientCode: 'BN004',
        fullName: 'Hoàng Thị Ế',
        dateOfBirth: new Date('1980-03-25'),
        gender: 'FEMALE',
        phone: '0904444444',
        email: 'hte@gmail.com',
        address: '156 Cộng Hòa',
        ward: 'Phường 4',
        district: 'Quận 5',
        province: 'TP.HCM',
        bloodType: 'AB_NEGATIVE',
      },
    }),
    prisma.patient.create({
      data: {
        patientCode: 'BN005',
        fullName: 'Võ Văn Giáp',
        dateOfBirth: new Date('1988-06-08'),
        gender: 'MALE',
        phone: '0905555555',
        email: 'vgiap@gmail.com',
        address: '201 Tây Sơn',
        ward: 'Phường 5',
        district: 'Quận 10',
        province: 'TP.HCM',
        bloodType: 'O_NEGATIVE',
      },
    }),
  ]);

  // 7. Create drug categories
  const drugCategories = await Promise.all([
    prisma.drugCategory.create({
      data: {
        name: 'Kháng sinh',
        code: 'KKHOA',
      },
    }),
    prisma.drugCategory.create({
      data: {
        name: 'Giảm đau - Hạ sốt',
        code: 'GDHS',
      },
    }),
    prisma.drugCategory.create({
      data: {
        name: 'Vitamin & Khoáng chất',
        code: 'VTKC',
      },
    }),
  ]);

  // 8. Create drugs
  const drugs = await Promise.all([
    prisma.drug.create({
      data: {
        categoryId: drugCategories[0].id,
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        code: 'AMOX500',
        unit: 'CAPSULE',
        strength: '500mg',
        manufacturer: 'Công ty Dược phẩm ABC',
        requirePrescription: true,
        minStock: 50,
      },
    }),
    prisma.drug.create({
      data: {
        categoryId: drugCategories[1].id,
        name: 'Paracetamol',
        genericName: 'Paracetamol',
        code: 'PARA500',
        unit: 'TABLET',
        strength: '500mg',
        manufacturer: 'Công ty Dược phẩm XYZ',
        minStock: 100,
      },
    }),
    prisma.drug.create({
      data: {
        categoryId: drugCategories[2].id,
        name: 'Vitamin C 1000',
        genericName: 'Vitamin C',
        code: 'VITC1000',
        unit: 'TABLET',
        strength: '1000mg',
        manufacturer: 'Công ty Dược phẩm DEF',
        minStock: 80,
      },
    }),
  ]);

  // 9. Create appointments
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        appointmentCode: 'LH001',
        patientId: patients[0].id,
        doctorId: doctors[0].id,
        branchId: mainBranch.id,
        roomId: room1.id,
        type: 'GENERAL',
        status: 'PENDING',
        scheduledDate: today,
        scheduledTime: '08:00',
        chiefComplaint: 'Đau đầu, sốt cao',
      },
    }),
    prisma.appointment.create({
      data: {
        appointmentCode: 'LH002',
        patientId: patients[1].id,
        doctorId: doctors[1].id,
        branchId: mainBranch.id,
        roomId: room2.id,
        type: 'SPECIALIST',
        status: 'CONFIRMED',
        scheduledDate: today,
        scheduledTime: '09:30',
        chiefComplaint: 'Khám định kỳ',
      },
    }),
    prisma.appointment.create({
      data: {
        appointmentCode: 'LH003',
        patientId: patients[2].id,
        doctorId: doctors[2].id,
        branchId: mainBranch.id,
        roomId: room3.id,
        type: 'GENERAL',
        status: 'COMPLETED',
        scheduledDate: yesterday,
        scheduledTime: '10:00',
        chiefComplaint: 'Khám nha khoa',
      },
    }),
    prisma.appointment.create({
      data: {
        appointmentCode: 'LH004',
        patientId: patients[3].id,
        doctorId: doctors[3].id,
        branchId: mainBranch.id,
        type: 'SPECIALIST',
        status: 'COMPLETED',
        scheduledDate: yesterday,
        scheduledTime: '14:00',
        chiefComplaint: 'Khám mắt',
      },
    }),
    prisma.appointment.create({
      data: {
        appointmentCode: 'LH005',
        patientId: patients[4].id,
        doctorId: doctors[0].id,
        branchId: mainBranch.id,
        type: 'FOLLOW_UP',
        status: 'PENDING',
        scheduledDate: tomorrow,
        scheduledTime: '11:00',
        chiefComplaint: 'Tái khám',
      },
    }),
  ]);

  // 10. Create services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        clinicId: clinic.id,
        name: 'Khám tổng quát',
        code: 'SVC001',
        price: 300000,
      },
    }),
    prisma.service.create({
      data: {
        clinicId: clinic.id,
        name: 'Khám chuyên khoa',
        code: 'SVC002',
        price: 500000,
      },
    }),
    prisma.service.create({
      data: {
        clinicId: clinic.id,
        name: 'Siêu âm',
        code: 'SVC003',
        price: 400000,
      },
    }),
  ]);

  // 11. Create invoices
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        invoiceCode: 'HD001',
        patientId: patients[0].id,
        createdById: doctors[4].id,
        status: 'PAID',
        subtotal: 300000,
        discount: 0,
        taxAmount: 0,
        totalAmount: 300000,
        patientPays: 300000,
        items: {
          create: [
            {
              type: 'SERVICE',
              serviceId: services[0].id,
              name: 'Khám tổng quát',
              quantity: 1,
              unitPrice: 300000,
              totalPrice: 300000,
            },
          ],
        },
        payments: {
          create: [
            {
              amount: 300000,
              method: 'CASH',
              status: 'PAID',
            },
          ],
        },
      },
    }),
    prisma.invoice.create({
      data: {
        invoiceCode: 'HD002',
        patientId: patients[1].id,
        createdById: doctors[4].id,
        status: 'PAID',
        subtotal: 500000,
        discount: 50000,
        taxAmount: 0,
        totalAmount: 450000,
        patientPays: 450000,
        items: {
          create: [
            {
              type: 'SERVICE',
              serviceId: services[1].id,
              name: 'Khám chuyên khoa',
              quantity: 1,
              unitPrice: 500000,
              totalPrice: 500000,
              discount: 50000,
            },
          ],
        },
        payments: {
          create: [
            {
              amount: 450000,
              method: 'BANK_TRANSFER',
              status: 'PAID',
            },
          ],
        },
      },
    }),
  ]);

  // 12. Create medical records for completed appointments
  const medicalRecord = await prisma.medicalRecord.create({
    data: {
      recordCode: 'HS001',
      appointmentId: appointments[2].id,
      patientId: patients[2].id,
      doctorId: doctors[2].id,
      visitDate: yesterday,
      chiefComplaint: 'Khám nha khoa định kỳ',
      clinicalNotes: 'Bệnh nhân có tình trạng sức khỏe ổn định',
      physicalExam: 'Kiểm tra quốc phòng toàn bộ khoang miệng',
      diagnosis: 'Viêm nướu nhẹ',
      icdCode: 'K05.0',
      treatment: 'Vệ sinh khoang miệng, kê đơn súc miệng',
      prescriptions: {
        create: [
          {
            prescriptionCode: 'ĐT001',
            status: 'DISPENSED',
            items: {
              create: [
                {
                  drugId: drugs[0].id,
                  quantity: 10,
                  dosage: '1 viên',
                  frequency: '2 lần/ngày',
                  duration: '7 ngày',
                  unitPrice: 5000,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('✅ Seed thành công!');
  console.log(`📋 Dữ liệu được tạo:`);
  console.log(`   - Phòng khám: ${clinic.name}`);
  console.log(`   - Bác sĩ: 4 người`);
  console.log(`   - Bệnh nhân: 5 người`);
  console.log(`   - Lịch hẹn: 5 cuộc`);
  console.log(`   - Hóa đơn: 2 phiếu`);
}

main()
  .catch((e) => {
    console.error('❌ Seed lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
