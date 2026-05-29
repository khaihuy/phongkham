import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedSitePages } from './seed-pages';

const prisma = new PrismaClient();

function daysFromNow(days: number, hours = 8, minutes = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...');

  const existingClinic = await prisma.clinic.findFirst();
  if (existingClinic) {
    console.log('⏭️  Dữ liệu chính đã tồn tại — chỉ đảm bảo trang nội dung footer.');
    const r = await seedSitePages();
    console.log(`   - Trang nội dung footer: ${r.pages}`);
    return;
  }

  // ────────── 1. CLINIC + BRANCHES + ROOMS ──────────
  const clinic = await prisma.clinic.create({
    data: {
      name: 'Phòng Khám Đa Khoa An Khang',
      taxCode: '0123456789',
      phone: '(028) 1234 5678',
      email: 'info@ankhanghc.com',
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      licenseNo: 'QĐ-2024-001',
      website: 'https://ankhanghc.com',
    },
  });

  const branch1 = await prisma.branch.create({
    data: {
      clinicId: clinic.id,
      name: 'Chi nhánh Quận 1',
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      phone: '(028) 1234 5678',
      isMain: true,
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      clinicId: clinic.id,
      name: 'Chi nhánh Quận 7',
      address: '88 Nguyễn Văn Linh, Quận 7, TP.HCM',
      phone: '(028) 8765 4321',
      isMain: false,
    },
  });

  const rooms = await Promise.all([
    prisma.room.create({ data: { branchId: branch1.id, name: 'Phòng khám Nội', code: 'PK001', floor: 1 } }),
    prisma.room.create({ data: { branchId: branch1.id, name: 'Phòng khám Ngoại', code: 'PK002', floor: 1 } }),
    prisma.room.create({ data: { branchId: branch1.id, name: 'Phòng Nha khoa', code: 'PK003', floor: 2 } }),
    prisma.room.create({ data: { branchId: branch1.id, name: 'Phòng Mắt', code: 'PK004', floor: 2 } }),
    prisma.room.create({ data: { branchId: branch1.id, name: 'Phòng Sản', code: 'PK005', floor: 3 } }),
    prisma.room.create({ data: { branchId: branch2.id, name: 'Phòng khám tổng quát', code: 'PK101', floor: 1 } }),
    prisma.room.create({ data: { branchId: branch2.id, name: 'Phòng Nhi', code: 'PK102', floor: 1 } }),
  ]);

  // ────────── 2. SPECIALTIES ──────────
  const specialties = await Promise.all([
    prisma.specialty.create({ data: { name: 'Nội khoa', code: 'NOI', description: 'Khám và điều trị bệnh nội khoa' } }),
    prisma.specialty.create({ data: { name: 'Ngoại khoa', code: 'NGOAI', description: 'Khám và điều trị bệnh ngoại khoa' } }),
    prisma.specialty.create({ data: { name: 'Nha khoa', code: 'NHA', description: 'Khám và điều trị răng hàm mặt' } }),
    prisma.specialty.create({ data: { name: 'Nhãn khoa', code: 'MAT', description: 'Khám và điều trị mắt' } }),
    prisma.specialty.create({ data: { name: 'Sản phụ khoa', code: 'SAN', description: 'Khám và điều trị sản phụ khoa' } }),
    prisma.specialty.create({ data: { name: 'Nhi khoa', code: 'NHI', description: 'Khám và điều trị bệnh trẻ em' } }),
    prisma.specialty.create({ data: { name: 'Tai Mũi Họng', code: 'TMH', description: 'Khám và điều trị tai mũi họng' } }),
    prisma.specialty.create({ data: { name: 'Da liễu', code: 'DALIEU', description: 'Khám và điều trị bệnh da' } }),
  ]);

  // ────────── 3. USERS ──────────
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: { email: 'admin@clinic.com', username: 'admin', passwordHash, fullName: 'Quản trị viên', phone: '0900000001', role: 'ADMIN' },
  });

  const doctorUsers = await Promise.all([
    prisma.user.create({ data: { email: 'dr.hung@clinic.com', username: 'dr.hung', passwordHash, fullName: 'BS. Trần Văn Hùng', phone: '0901234567', role: 'DOCTOR' } }),
    prisma.user.create({ data: { email: 'dr.minh@clinic.com', username: 'dr.minh', passwordHash, fullName: 'BS. Phạm Thị Minh', phone: '0902345678', role: 'DOCTOR' } }),
    prisma.user.create({ data: { email: 'dr.hoa@clinic.com', username: 'dr.hoa', passwordHash, fullName: 'BS. Nguyễn Văn Hoa', phone: '0903456789', role: 'DOCTOR' } }),
    prisma.user.create({ data: { email: 'dr.linh@clinic.com', username: 'dr.linh', passwordHash, fullName: 'BS. Vũ Thị Linh', phone: '0904567890', role: 'DOCTOR' } }),
    prisma.user.create({ data: { email: 'dr.tuan@clinic.com', username: 'dr.tuan', passwordHash, fullName: 'BS. Lê Anh Tuấn', phone: '0905678901', role: 'DOCTOR' } }),
    prisma.user.create({ data: { email: 'dr.mai@clinic.com', username: 'dr.mai', passwordHash, fullName: 'BS. Đỗ Thị Mai', phone: '0906789012', role: 'DOCTOR' } }),
    prisma.user.create({ data: { email: 'dr.son@clinic.com', username: 'dr.son', passwordHash, fullName: 'BS. Hoàng Văn Sơn', phone: '0907890123', role: 'DOCTOR' } }),
    prisma.user.create({ data: { email: 'dr.thao@clinic.com', username: 'dr.thao', passwordHash, fullName: 'BS. Bùi Thị Thảo', phone: '0908901234', role: 'DOCTOR' } }),
  ]);

  const reception1 = await prisma.user.create({
    data: { email: 'reception@clinic.com', username: 'reception', passwordHash, fullName: 'Lê Thị Thanh Hoa', phone: '0911111111', role: 'RECEPTIONIST' },
  });
  const reception2 = await prisma.user.create({
    data: { email: 'reception2@clinic.com', username: 'reception2', passwordHash, fullName: 'Trần Thu Hà', phone: '0911111112', role: 'RECEPTIONIST' },
  });

  const pharmacist = await prisma.user.create({
    data: { email: 'pharmacy@clinic.com', username: 'pharmacy', passwordHash, fullName: 'DS. Nguyễn Hoàng Anh', phone: '0922222222', role: 'PHARMACIST' },
  });

  const accountant = await prisma.user.create({
    data: { email: 'accountant@clinic.com', username: 'accountant', passwordHash, fullName: 'KT. Phạm Quốc Việt', phone: '0933333333', role: 'ACCOUNTANT' },
  });

  // ────────── 4. DOCTORS ──────────
  const doctors = await Promise.all([
    prisma.doctor.create({ data: { userId: doctorUsers[0].id, branchId: branch1.id, employeeCode: 'BS001', specialtyId: specialties[0].id, title: 'Bác sĩ chuyên khoa I', licenseNo: 'LIC001', yearsOfExp: 15, consultFee: 500000, bio: 'Chuyên gia về tim mạch và bệnh nội tiết' } }),
    prisma.doctor.create({ data: { userId: doctorUsers[1].id, branchId: branch1.id, employeeCode: 'BS002', specialtyId: specialties[1].id, title: 'Thạc sĩ - Bác sĩ', licenseNo: 'LIC002', yearsOfExp: 12, consultFee: 600000, bio: 'Phẫu thuật ngoại tổng quát' } }),
    prisma.doctor.create({ data: { userId: doctorUsers[2].id, branchId: branch1.id, employeeCode: 'BS003', specialtyId: specialties[2].id, title: 'Bác sĩ', licenseNo: 'LIC003', yearsOfExp: 10, consultFee: 400000, bio: 'Chuyên về cấy ghép Implant và niềng răng' } }),
    prisma.doctor.create({ data: { userId: doctorUsers[3].id, branchId: branch1.id, employeeCode: 'BS004', specialtyId: specialties[3].id, title: 'Tiến sĩ - Bác sĩ', licenseNo: 'LIC004', yearsOfExp: 20, consultFee: 800000, bio: 'Phẫu thuật khúc xạ và đục thủy tinh thể' } }),
    prisma.doctor.create({ data: { userId: doctorUsers[4].id, branchId: branch1.id, employeeCode: 'BS005', specialtyId: specialties[4].id, title: 'Bác sĩ chuyên khoa II', licenseNo: 'LIC005', yearsOfExp: 18, consultFee: 700000, bio: 'Sản phụ khoa và sinh hỗ trợ' } }),
    prisma.doctor.create({ data: { userId: doctorUsers[5].id, branchId: branch2.id, employeeCode: 'BS006', specialtyId: specialties[5].id, title: 'Bác sĩ', licenseNo: 'LIC006', yearsOfExp: 8, consultFee: 350000, bio: 'Khám và điều trị nhi khoa tổng quát' } }),
    prisma.doctor.create({ data: { userId: doctorUsers[6].id, branchId: branch2.id, employeeCode: 'BS007', specialtyId: specialties[6].id, title: 'Bác sĩ', licenseNo: 'LIC007', yearsOfExp: 11, consultFee: 450000, bio: 'Tai mũi họng và thính học' } }),
    prisma.doctor.create({ data: { userId: doctorUsers[7].id, branchId: branch1.id, employeeCode: 'BS008', specialtyId: specialties[7].id, title: 'Bác sĩ', licenseNo: 'LIC008', yearsOfExp: 9, consultFee: 400000, bio: 'Da liễu thẩm mỹ' } }),
  ]);

  // ────────── 5. DOCTOR SCHEDULES ──────────
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
  for (const doctor of doctors) {
    for (const day of days) {
      await prisma.doctorSchedule.create({
        data: { doctorId: doctor.id, dayOfWeek: day, startTime: '08:00', endTime: '17:00', slotMinutes: 30, maxSlots: 16 },
      });
    }
  }

  // ────────── 6. PATIENTS ──────────
  const patientData = [
    { code: 'BN001', name: 'Nguyễn Văn An', dob: '1990-05-15', gender: 'MALE', phone: '0901111111', email: 'nvan.an@gmail.com', blood: 'O_POSITIVE', district: 'Quận 1' },
    { code: 'BN002', name: 'Trần Thị Bích', dob: '1985-08-20', gender: 'FEMALE', phone: '0902222222', email: 'ttbich@gmail.com', blood: 'A_POSITIVE', district: 'Quận 3' },
    { code: 'BN003', name: 'Phạm Văn Dũng', dob: '1995-12-10', gender: 'MALE', phone: '0903333333', email: 'pvdung@gmail.com', blood: 'B_POSITIVE', district: 'Quận 10' },
    { code: 'BN004', name: 'Hoàng Thị Lan', dob: '1980-03-25', gender: 'FEMALE', phone: '0904444444', email: 'htlan@gmail.com', blood: 'AB_NEGATIVE', district: 'Quận 5' },
    { code: 'BN005', name: 'Võ Văn Giáp', dob: '1988-06-08', gender: 'MALE', phone: '0905555555', email: 'vgiap@gmail.com', blood: 'O_NEGATIVE', district: 'Quận 10' },
    { code: 'BN006', name: 'Đỗ Thị Hồng', dob: '1992-09-12', gender: 'FEMALE', phone: '0906666666', email: 'dthong@gmail.com', blood: 'A_POSITIVE', district: 'Quận 7' },
    { code: 'BN007', name: 'Lê Văn Khoa', dob: '1975-02-28', gender: 'MALE', phone: '0907777777', email: 'lvkhoa@gmail.com', blood: 'B_NEGATIVE', district: 'Quận 2' },
    { code: 'BN008', name: 'Bùi Thị Mai', dob: '1998-11-05', gender: 'FEMALE', phone: '0908888888', email: 'btmai@gmail.com', blood: 'O_POSITIVE', district: 'Bình Thạnh' },
    { code: 'BN009', name: 'Ngô Văn Phong', dob: '1965-07-19', gender: 'MALE', phone: '0909999999', email: 'nvphong@gmail.com', blood: 'AB_POSITIVE', district: 'Phú Nhuận' },
    { code: 'BN010', name: 'Vũ Thị Quỳnh', dob: '2001-04-22', gender: 'FEMALE', phone: '0910101010', email: 'vtquynh@gmail.com', blood: 'A_NEGATIVE', district: 'Tân Bình' },
    { code: 'BN011', name: 'Trương Văn Sơn', dob: '1983-10-30', gender: 'MALE', phone: '0911121314', email: 'tvson@gmail.com', blood: 'O_POSITIVE', district: 'Gò Vấp' },
    { code: 'BN012', name: 'Đặng Thị Tâm', dob: '1990-01-14', gender: 'FEMALE', phone: '0912131415', email: 'dttam@gmail.com', blood: 'B_POSITIVE', district: 'Quận 4' },
    { code: 'BN013', name: 'Phan Văn Uy', dob: '1972-06-25', gender: 'MALE', phone: '0913141516', email: 'pvuy@gmail.com', blood: 'A_POSITIVE', district: 'Quận 6' },
    { code: 'BN014', name: 'Mai Thị Vân', dob: '1987-08-08', gender: 'FEMALE', phone: '0914151617', email: 'mtvan@gmail.com', blood: 'O_NEGATIVE', district: 'Quận 8' },
    { code: 'BN015', name: 'Lý Văn Xuân', dob: '2015-03-17', gender: 'MALE', phone: '0915161718', email: 'lvxuan@gmail.com', blood: 'A_POSITIVE', district: 'Quận 11' },
    { code: 'BN016', name: 'Trần Thị Yến', dob: '1995-12-01', gender: 'FEMALE', phone: '0916171819', email: 'ttyen@gmail.com', blood: 'B_POSITIVE', district: 'Quận 12' },
    { code: 'BN017', name: 'Nguyễn Văn Bảo', dob: '2010-05-20', gender: 'MALE', phone: '0917181920', email: 'nvbao@gmail.com', blood: 'O_POSITIVE', district: 'Thủ Đức' },
    { code: 'BN018', name: 'Phạm Thị Cúc', dob: '1955-09-09', gender: 'FEMALE', phone: '0918192021', email: 'ptcuc@gmail.com', blood: 'AB_POSITIVE', district: 'Quận 1' },
    { code: 'BN019', name: 'Hoàng Văn Đức', dob: '1978-11-11', gender: 'MALE', phone: '0919202122', email: 'hvduc@gmail.com', blood: 'A_POSITIVE', district: 'Bình Tân' },
    { code: 'BN020', name: 'Lê Thị Hương', dob: '2020-07-04', gender: 'FEMALE', phone: '0920212223', email: 'lthuong@gmail.com', blood: 'O_POSITIVE', district: 'Quận 7' },
  ];

  const patients = await Promise.all(
    patientData.map(p =>
      prisma.patient.create({
        data: {
          patientCode: p.code,
          fullName: p.name,
          dateOfBirth: new Date(p.dob),
          gender: p.gender as any,
          phone: p.phone,
          email: p.email,
          address: `${Math.floor(Math.random() * 200 + 1)} Đường ${['Nguyễn Huệ', 'Lê Lợi', 'Trần Hưng Đạo', 'Hai Bà Trưng', 'Cách Mạng Tháng 8'][Math.floor(Math.random() * 5)]}`,
          ward: `Phường ${Math.floor(Math.random() * 15 + 1)}`,
          district: p.district,
          province: 'TP.HCM',
          bloodType: p.blood as any,
          emergencyName: 'Người thân',
          emergencyPhone: '0900000000',
          emergencyRel: 'Gia đình',
        },
      })
    )
  );

  // Allergies for some patients
  await prisma.allergy.create({ data: { patientId: patients[0].id, allergen: 'Penicillin', reaction: 'Phát ban, ngứa', severity: 'Trung bình' } });
  await prisma.allergy.create({ data: { patientId: patients[3].id, allergen: 'Hải sản', reaction: 'Sưng môi, khó thở', severity: 'Nặng' } });
  await prisma.allergy.create({ data: { patientId: patients[7].id, allergen: 'Phấn hoa', reaction: 'Hắt hơi, chảy nước mũi', severity: 'Nhẹ' } });

  // Vitals
  for (let i = 0; i < 10; i++) {
    await prisma.patientVital.create({
      data: {
        patientId: patients[i].id,
        weight: 50 + Math.random() * 30,
        height: 150 + Math.random() * 30,
        bmi: 18 + Math.random() * 8,
        bloodPressureSystolic: 110 + Math.floor(Math.random() * 30),
        bloodPressureDiastolic: 70 + Math.floor(Math.random() * 20),
        heartRate: 60 + Math.floor(Math.random() * 30),
        temperature: 36 + Math.random() * 1.5,
        oxygenSat: 95 + Math.floor(Math.random() * 5),
      },
    });
  }

  // ────────── 7. SUPPLIERS ──────────
  const suppliers = await Promise.all([
    prisma.supplier.create({ data: { name: 'Công ty Dược phẩm Sài Gòn', taxCode: '0301234567', phone: '02838223344', email: 'info@sapharco.com', address: 'Quận 10, TP.HCM' } }),
    prisma.supplier.create({ data: { name: 'Dược Hậu Giang', taxCode: '0301234568', phone: '02923899099', email: 'info@dhgpharma.com', address: 'Cần Thơ' } }),
    prisma.supplier.create({ data: { name: 'Pymepharco', taxCode: '0301234569', phone: '02573823888', email: 'info@pymepharco.com', address: 'Phú Yên' } }),
  ]);

  // ────────── 8. DRUG CATEGORIES + DRUGS ──────────
  const drugCats = await Promise.all([
    prisma.drugCategory.create({ data: { name: 'Kháng sinh', code: 'KS' } }),
    prisma.drugCategory.create({ data: { name: 'Giảm đau - Hạ sốt', code: 'GDHS' } }),
    prisma.drugCategory.create({ data: { name: 'Vitamin & Khoáng chất', code: 'VTKC' } }),
    prisma.drugCategory.create({ data: { name: 'Tim mạch', code: 'TM' } }),
    prisma.drugCategory.create({ data: { name: 'Tiêu hóa', code: 'TH' } }),
    prisma.drugCategory.create({ data: { name: 'Hô hấp', code: 'HH' } }),
    prisma.drugCategory.create({ data: { name: 'Da liễu', code: 'DL' } }),
  ]);

  const drugList = [
    { cat: 0, name: 'Amoxicillin 500mg', generic: 'Amoxicillin', code: 'AMOX500', unit: 'CAPSULE', strength: '500mg', mfr: 'Sapharco', rx: true, sell: 5000 },
    { cat: 0, name: 'Cefixime 200mg', generic: 'Cefixime', code: 'CEFI200', unit: 'CAPSULE', strength: '200mg', mfr: 'DHG', rx: true, sell: 12000 },
    { cat: 0, name: 'Azithromycin 500mg', generic: 'Azithromycin', code: 'AZI500', unit: 'TABLET', strength: '500mg', mfr: 'Pymepharco', rx: true, sell: 15000 },
    { cat: 1, name: 'Paracetamol 500mg', generic: 'Paracetamol', code: 'PARA500', unit: 'TABLET', strength: '500mg', mfr: 'Sapharco', rx: false, sell: 1000 },
    { cat: 1, name: 'Ibuprofen 400mg', generic: 'Ibuprofen', code: 'IBU400', unit: 'TABLET', strength: '400mg', mfr: 'DHG', rx: false, sell: 2000 },
    { cat: 1, name: 'Aspirin 100mg', generic: 'Aspirin', code: 'ASP100', unit: 'TABLET', strength: '100mg', mfr: 'Sapharco', rx: false, sell: 800 },
    { cat: 2, name: 'Vitamin C 1000mg', generic: 'Ascorbic Acid', code: 'VITC1000', unit: 'TABLET', strength: '1000mg', mfr: 'Sapharco', rx: false, sell: 3000 },
    { cat: 2, name: 'Vitamin B Complex', generic: 'Vitamin B', code: 'VITB', unit: 'TABLET', strength: '50mg', mfr: 'DHG', rx: false, sell: 2500 },
    { cat: 2, name: 'Calcium D3', generic: 'Calcium', code: 'CALD3', unit: 'TABLET', strength: '600mg', mfr: 'Pymepharco', rx: false, sell: 4000 },
    { cat: 3, name: 'Amlodipine 5mg', generic: 'Amlodipine', code: 'AML5', unit: 'TABLET', strength: '5mg', mfr: 'Sapharco', rx: true, sell: 3500 },
    { cat: 3, name: 'Losartan 50mg', generic: 'Losartan', code: 'LOS50', unit: 'TABLET', strength: '50mg', mfr: 'DHG', rx: true, sell: 5000 },
    { cat: 3, name: 'Atorvastatin 20mg', generic: 'Atorvastatin', code: 'ATO20', unit: 'TABLET', strength: '20mg', mfr: 'Pymepharco', rx: true, sell: 7000 },
    { cat: 4, name: 'Omeprazole 20mg', generic: 'Omeprazole', code: 'OME20', unit: 'CAPSULE', strength: '20mg', mfr: 'DHG', rx: true, sell: 4000 },
    { cat: 4, name: 'Smecta', generic: 'Diosmectite', code: 'SME', unit: 'SACHET', strength: '3g', mfr: 'Sapharco', rx: false, sell: 6000 },
    { cat: 5, name: 'Salbutamol 4mg', generic: 'Salbutamol', code: 'SAL4', unit: 'TABLET', strength: '4mg', mfr: 'DHG', rx: true, sell: 3000 },
    { cat: 5, name: 'Loratadine 10mg', generic: 'Loratadine', code: 'LOR10', unit: 'TABLET', strength: '10mg', mfr: 'Sapharco', rx: false, sell: 2500 },
    { cat: 6, name: 'Betadine 10%', generic: 'Povidone Iodine', code: 'BET10', unit: 'BOTTLE', strength: '90ml', mfr: 'Pymepharco', rx: false, sell: 35000 },
    { cat: 6, name: 'Hydrocortisone 1%', generic: 'Hydrocortisone', code: 'HYD1', unit: 'TUBE', strength: '15g', mfr: 'DHG', rx: true, sell: 25000 },
  ];

  const drugs = await Promise.all(
    drugList.map(d =>
      prisma.drug.create({
        data: {
          categoryId: drugCats[d.cat].id,
          name: d.name,
          genericName: d.generic,
          code: d.code,
          unit: d.unit as any,
          strength: d.strength,
          manufacturer: d.mfr,
          requirePrescription: d.rx,
          minStock: 50,
        },
      })
    )
  );

  // Drug inventory
  for (let i = 0; i < drugs.length; i++) {
    const d = drugs[i];
    const sell = drugList[i].sell;
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 2);
    await prisma.drugInventory.create({
      data: {
        drugId: d.id,
        batchNo: `B2026-${String(i + 1).padStart(3, '0')}`,
        expiryDate: expiry,
        quantity: 200 + Math.floor(Math.random() * 800),
        importPrice: sell * 0.7,
        sellPrice: sell,
        supplierId: suppliers[i % suppliers.length].id,
      },
    });
  }

  // ────────── 9. SERVICES ──────────
  const services = await Promise.all([
    prisma.service.create({ data: { clinicId: clinic.id, name: 'Khám tổng quát', code: 'SVC001', price: 300000 } }),
    prisma.service.create({ data: { clinicId: clinic.id, name: 'Khám chuyên khoa', code: 'SVC002', price: 500000 } }),
    prisma.service.create({ data: { clinicId: clinic.id, name: 'Khám nha khoa', code: 'SVC003', price: 400000 } }),
    prisma.service.create({ data: { clinicId: clinic.id, name: 'Siêu âm bụng tổng quát', code: 'SVC004', price: 400000 } }),
    prisma.service.create({ data: { clinicId: clinic.id, name: 'X-Quang ngực', code: 'SVC005', price: 250000 } }),
    prisma.service.create({ data: { clinicId: clinic.id, name: 'Xét nghiệm máu cơ bản', code: 'SVC006', price: 350000 } }),
    prisma.service.create({ data: { clinicId: clinic.id, name: 'Điện tim ECG', code: 'SVC007', price: 200000 } }),
    prisma.service.create({ data: { clinicId: clinic.id, name: 'Khám sản phụ khoa', code: 'SVC008', price: 600000 } }),
    prisma.service.create({ data: { clinicId: clinic.id, name: 'Lấy cao răng', code: 'SVC009', price: 300000 } }),
    prisma.service.create({ data: { clinicId: clinic.id, name: 'Đo thị lực', code: 'SVC010', price: 150000 } }),
  ]);

  // ────────── 10. APPOINTMENTS ──────────
  const apptStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;
  const apptTypes = ['GENERAL', 'SPECIALIST', 'FOLLOW_UP', 'EMERGENCY'] as const;
  const complaints = [
    'Đau đầu, sốt cao 2 ngày',
    'Khám sức khỏe định kỳ',
    'Đau bụng vùng thượng vị',
    'Ho có đờm, khó thở',
    'Đau lưng kéo dài',
    'Tái khám tăng huyết áp',
    'Đau răng hàm dưới',
    'Mờ mắt, nhức mắt',
    'Khám thai 3 tháng',
    'Trẻ ho sốt',
    'Đau họng, nuốt khó',
    'Nổi mẩn ngứa toàn thân',
  ];

  const appointments: Array<Awaited<ReturnType<typeof prisma.appointment.create>>> = [];
  for (let i = 0; i < 30; i++) {
    const offset = Math.floor(i / 3) - 5; // -5 to +5 days
    const hour = 8 + (i % 8);
    const status: any = i < 15 ? 'COMPLETED' : i < 22 ? 'CONFIRMED' : i < 26 ? 'PENDING' : i < 28 ? 'CANCELLED' : 'NO_SHOW';
    const doctor = doctors[i % doctors.length];
    const room = rooms[i % rooms.length];
    const appt = await prisma.appointment.create({
      data: {
        appointmentCode: `LH${String(i + 1).padStart(3, '0')}`,
        patientId: patients[i % patients.length].id,
        doctorId: doctor.id,
        branchId: doctor.branchId,
        roomId: room.branchId === doctor.branchId ? room.id : undefined,
        type: apptTypes[i % apptTypes.length] as any,
        status,
        scheduledDate: daysFromNow(offset, hour, 0),
        scheduledTime: `${String(hour).padStart(2, '0')}:00`,
        chiefComplaint: complaints[i % complaints.length],
      },
    });
    appointments.push(appt);
  }

  // ────────── 11. MEDICAL RECORDS for COMPLETED appointments ──────────
  const completedAppts = appointments.filter(a => a.status === 'COMPLETED');
  const diagnosesData = [
    { dx: 'Cảm cúm thông thường', icd: 'J11', tx: 'Nghỉ ngơi, uống nhiều nước, dùng thuốc hạ sốt khi cần' },
    { dx: 'Viêm họng cấp', icd: 'J02.9', tx: 'Kháng sinh 7 ngày, súc họng nước muối' },
    { dx: 'Viêm dạ dày', icd: 'K29.7', tx: 'PPI 2 tuần, ăn uống điều độ, tránh chua cay' },
    { dx: 'Tăng huyết áp độ I', icd: 'I10', tx: 'Amlodipine 5mg/ngày, theo dõi huyết áp' },
    { dx: 'Đau lưng cơ năng', icd: 'M54.5', tx: 'Giảm đau, vật lý trị liệu, tránh khuân vác nặng' },
    { dx: 'Sâu răng độ II', icd: 'K02.1', tx: 'Trám răng, vệ sinh răng miệng đúng cách' },
    { dx: 'Viêm kết mạc dị ứng', icd: 'H10.45', tx: 'Thuốc nhỏ mắt kháng histamin, tránh dụi mắt' },
    { dx: 'Thai 12 tuần phát triển bình thường', icd: 'Z34.0', tx: 'Bổ sung vitamin, khám thai định kỳ' },
    { dx: 'Viêm phế quản cấp', icd: 'J20.9', tx: 'Kháng sinh, long đờm, theo dõi nhiệt độ' },
    { dx: 'Mề đay cấp', icd: 'L50.0', tx: 'Loratadine 10mg/ngày, tránh dị nguyên' },
    { dx: 'Viêm tai giữa', icd: 'H66.9', tx: 'Kháng sinh, giảm đau, vệ sinh tai' },
    { dx: 'Đau đầu căng cơ', icd: 'G44.2', tx: 'Giảm đau, nghỉ ngơi, giảm stress' },
  ];

  for (let i = 0; i < completedAppts.length; i++) {
    const appt = completedAppts[i];
    const dx = diagnosesData[i % diagnosesData.length];
    const drug = drugs[i % drugs.length];
    const drug2 = drugs[(i + 3) % drugs.length];

    await prisma.medicalRecord.create({
      data: {
        recordCode: `HS${String(i + 1).padStart(3, '0')}`,
        appointmentId: appt.id,
        patientId: appt.patientId,
        doctorId: appt.doctorId,
        visitDate: appt.scheduledDate,
        chiefComplaint: appt.chiefComplaint ?? '',
        clinicalNotes: 'Bệnh nhân tỉnh táo, hợp tác tốt. Tình trạng chung ổn định.',
        physicalExam: 'Da niêm hồng, không phù, không xuất huyết. Hô hấp đều. Tim đều.',
        diagnosis: dx.dx,
        icdCode: dx.icd,
        treatment: dx.tx,
        diagnoses: {
          create: [{ icdCode: dx.icd, description: dx.dx, isPrimary: true }],
        },
        prescriptions: {
          create: [
            {
              prescriptionCode: `ĐT${String(i + 1).padStart(3, '0')}`,
              status: i % 3 === 0 ? 'PENDING' : 'DISPENSED',
              items: {
                create: [
                  { drugId: drug.id, quantity: 10, dosage: '1 viên', frequency: '2 lần/ngày', duration: '5 ngày', route: 'Uống', unitPrice: 5000 },
                  { drugId: drug2.id, quantity: 14, dosage: '1 viên', frequency: '2 lần/ngày', duration: '7 ngày', route: 'Uống', unitPrice: 3000 },
                ],
              },
            },
          ],
        },
        labOrders: i % 4 === 0 ? {
          create: [
            { testName: 'Công thức máu', testCode: 'CBC', status: 'COMPLETED', result: 'Trong giới hạn bình thường', resultDate: appt.scheduledDate },
          ],
        } : undefined,
        imageOrders: i % 5 === 0 ? {
          create: [
            { imagingType: 'X-Quang', bodyPart: 'Ngực', status: 'COMPLETED', findings: 'Phổi sáng, không có tổn thương khu trú' },
          ],
        } : undefined,
      },
    });
  }

  // ────────── 12. INVOICES ──────────
  for (let i = 0; i < completedAppts.length; i++) {
    const appt = completedAppts[i];
    const isPaid = i < 12;
    const subtotal = 300000 + (i % 5) * 100000;
    const discount = i % 4 === 0 ? 50000 : 0;
    const totalAmount = subtotal - discount;

    await prisma.invoice.create({
      data: {
        invoiceCode: `HD${String(i + 1).padStart(3, '0')}`,
        patientId: appt.patientId,
        appointmentId: appt.id,
        createdById: reception1.id,
        status: isPaid ? 'PAID' : 'ISSUED',
        issuedAt: appt.scheduledDate,
        subtotal,
        discount,
        totalAmount,
        patientPays: totalAmount,
        items: {
          create: [
            {
              type: 'SERVICE',
              serviceId: services[i % services.length].id,
              name: services[i % services.length].name,
              quantity: 1,
              unitPrice: subtotal,
              discount,
              totalPrice: totalAmount,
            },
          ],
        },
        payments: isPaid ? {
          create: [
            {
              amount: totalAmount,
              method: ['CASH', 'BANK_TRANSFER', 'CARD', 'MOMO'][i % 4] as any,
              status: 'PAID',
              paidAt: appt.scheduledDate,
            },
          ],
        } : undefined,
      },
    });
  }

  // ────────── 13. CAMPAIGNS ──────────
  await prisma.campaign.create({
    data: {
      name: 'Nhắc tái khám tháng 5',
      type: 'REMINDER',
      channel: 'ZALO',
      status: 'COMPLETED',
      message: 'Kính chào Quý khách, đã đến lịch tái khám tại Phòng Khám An Khang. Vui lòng đặt lịch qua hotline.',
      sentAt: daysFromNow(-3),
      totalSent: 25,
      totalFailed: 1,
    },
  });
  await prisma.campaign.create({
    data: {
      name: 'Khuyến mãi khám sức khỏe định kỳ',
      type: 'PROMOTION',
      channel: 'SMS',
      status: 'SCHEDULED',
      message: 'Giảm 20% gói khám sức khỏe định kỳ. Áp dụng đến hết 31/05/2026.',
      scheduledAt: daysFromNow(2),
    },
  });

  const pagesResult = await seedSitePages();

  console.log('✅ Seed thành công!');
  console.log(`📋 Dữ liệu được tạo:`);
  console.log(`   - Trang nội dung footer: ${pagesResult.pages}`);
  console.log(`   - Phòng khám: ${clinic.name} (2 chi nhánh, ${rooms.length} phòng)`);
  console.log(`   - Chuyên khoa: ${specialties.length}`);
  console.log(`   - Bác sĩ: ${doctors.length} người`);
  console.log(`   - Tài khoản: 1 admin, 2 lễ tân, 1 dược sĩ, 1 kế toán, ${doctors.length} bác sĩ`);
  console.log(`   - Bệnh nhân: ${patients.length} người`);
  console.log(`   - Thuốc: ${drugs.length} loại (${drugCats.length} nhóm)`);
  console.log(`   - Dịch vụ: ${services.length}`);
  console.log(`   - Lịch hẹn: ${appointments.length}`);
  console.log(`   - Hồ sơ bệnh án: ${completedAppts.length}`);
  console.log(`   - Hóa đơn: ${completedAppts.length}`);
  console.log('');
  console.log('🔑 Đăng nhập: admin / Password123!');
}

main()
  .catch(e => {
    console.error('❌ Seed lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
