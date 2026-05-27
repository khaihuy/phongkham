import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ─── DRUG CATEGORIES ─────────────────────────────────────────────────────────
const DRUG_CATEGORIES = [
  { code: "KHANGSINH", name: "Kháng sinh" },
  { code: "GIAMDAN_HASOET", name: "Giảm đau – Hạ sốt" },
  { code: "NSAID", name: "Kháng viêm không Steroid (NSAIDs)" },
  { code: "TIEUHOA", name: "Tiêu hóa" },
  { code: "TIMACH", name: "Tim mạch – Huyết áp" },
  { code: "NOITIET", name: "Nội tiết – Đái tháo đường" },
  { code: "HOHAP", name: "Hô hấp – Dị ứng" },
  { code: "THANKINH", name: "Thần kinh – An thần" },
  { code: "DALIEU", name: "Da liễu – Ngoại dụng" },
  { code: "VITAMIN", name: "Vitamin – Khoáng chất" },
  { code: "NHANKHOA", name: "Nhãn khoa" },
  { code: "COXUONGKHOP", name: "Cơ xương khớp" },
  { code: "PHUSANKHOA", name: "Phụ sản khoa" },
]

// ─── DRUGS ───────────────────────────────────────────────────────────────────
const DRUGS = [
  // Kháng sinh
  { cat: "KHANGSINH", code: "AMX500", name: "Amoxicillin 500mg", genericName: "Amoxicillin", unit: "TABLET", strength: "500mg", form: "Viên nang", manufacturer: "Vidipha", rx: true, minStock: 200 },
  { cat: "KHANGSINH", code: "AMXCLV625", name: "Amoxicillin/Clavulanate 625mg", genericName: "Amoxicillin + Clavulanic acid", brandName: "Augmentin", unit: "TABLET", strength: "625mg", form: "Viên nén", manufacturer: "GSK", rx: true, minStock: 100 },
  { cat: "KHANGSINH", code: "AZI500", name: "Azithromycin 500mg", genericName: "Azithromycin", brandName: "Zithromax", unit: "TABLET", strength: "500mg", form: "Viên nén", manufacturer: "Pfizer", rx: true, minStock: 100 },
  { cat: "KHANGSINH", code: "CIP500", name: "Ciprofloxacin 500mg", genericName: "Ciprofloxacin", unit: "TABLET", strength: "500mg", form: "Viên nén", manufacturer: "DHG Pharma", rx: true, minStock: 100 },
  { cat: "KHANGSINH", code: "MTZ250", name: "Metronidazole 250mg", genericName: "Metronidazole", unit: "TABLET", strength: "250mg", form: "Viên nén", manufacturer: "Imexpharm", rx: true, minStock: 200 },
  { cat: "KHANGSINH", code: "CEF500", name: "Cefuroxime 500mg", genericName: "Cefuroxime axetil", unit: "TABLET", strength: "500mg", form: "Viên nén", manufacturer: "Pymepharco", rx: true, minStock: 100 },
  { cat: "KHANGSINH", code: "DOXY100", name: "Doxycycline 100mg", genericName: "Doxycycline", unit: "CAPSULE", strength: "100mg", form: "Viên nang", manufacturer: "Vidipha", rx: true, minStock: 100 },
  { cat: "KHANGSINH", code: "CLA500", name: "Clarithromycin 500mg", genericName: "Clarithromycin", unit: "TABLET", strength: "500mg", form: "Viên nén", manufacturer: "Abbott", rx: true, minStock: 80 },

  // Giảm đau – Hạ sốt
  { cat: "GIAMDAN_HASOET", code: "PCT500", name: "Paracetamol 500mg", genericName: "Paracetamol", unit: "TABLET", strength: "500mg", form: "Viên nén", manufacturer: "Domesco", rx: false, minStock: 500 },
  { cat: "GIAMDAN_HASOET", code: "PCT650", name: "Efferalgan 650mg", genericName: "Paracetamol", brandName: "Efferalgan", unit: "TABLET", strength: "650mg", form: "Viên sủi", manufacturer: "UPSA", rx: false, minStock: 200 },
  { cat: "GIAMDAN_HASOET", code: "IBU400", name: "Ibuprofen 400mg", genericName: "Ibuprofen", unit: "TABLET", strength: "400mg", form: "Viên nén bao phim", manufacturer: "DHG Pharma", rx: false, minStock: 200 },
  { cat: "GIAMDAN_HASOET", code: "ASP81", name: "Aspirin 81mg", genericName: "Acetylsalicylic acid", unit: "TABLET", strength: "81mg", form: "Viên nén bao tan", manufacturer: "Bayer", rx: false, minStock: 200 },

  // NSAIDs
  { cat: "NSAID", code: "DIC50", name: "Diclofenac 50mg", genericName: "Diclofenac sodium", unit: "TABLET", strength: "50mg", form: "Viên nén bao tan", manufacturer: "Novartis", rx: true, minStock: 150 },
  { cat: "NSAID", code: "MEL15", name: "Meloxicam 15mg", genericName: "Meloxicam", unit: "TABLET", strength: "15mg", form: "Viên nén", manufacturer: "Boehringer", rx: true, minStock: 100 },
  { cat: "NSAID", code: "CEL200", name: "Celecoxib 200mg", genericName: "Celecoxib", brandName: "Celebrex", unit: "CAPSULE", strength: "200mg", form: "Viên nang", manufacturer: "Pfizer", rx: true, minStock: 80 },
  { cat: "NSAID", code: "NAP500", name: "Naproxen 500mg", genericName: "Naproxen sodium", unit: "TABLET", strength: "500mg", form: "Viên nén", manufacturer: "Roche", rx: true, minStock: 80 },

  // Tiêu hóa
  { cat: "TIEUHOA", code: "OME20", name: "Omeprazole 20mg", genericName: "Omeprazole", unit: "CAPSULE", strength: "20mg", form: "Viên nang", manufacturer: "DHG Pharma", rx: true, minStock: 200 },
  { cat: "TIEUHOA", code: "ESO40", name: "Esomeprazole 40mg", genericName: "Esomeprazole", brandName: "Nexium", unit: "TABLET", strength: "40mg", form: "Viên nén bao tan", manufacturer: "AstraZeneca", rx: true, minStock: 100 },
  { cat: "TIEUHOA", code: "PAN40", name: "Pantoprazole 40mg", genericName: "Pantoprazole", unit: "TABLET", strength: "40mg", form: "Viên nén bao tan", manufacturer: "Solvay", rx: true, minStock: 100 },
  { cat: "TIEUHOA", code: "DOM10", name: "Domperidone 10mg", genericName: "Domperidone", brandName: "Motilium", unit: "TABLET", strength: "10mg", form: "Viên nén", manufacturer: "Janssen", rx: false, minStock: 150 },
  { cat: "TIEUHOA", code: "LOP2", name: "Loperamide 2mg", genericName: "Loperamide", unit: "CAPSULE", strength: "2mg", form: "Viên nang", manufacturer: "Janssen", rx: false, minStock: 100 },
  { cat: "TIEUHOA", code: "SMECTA", name: "Smecta 3g", genericName: "Diosmectite", brandName: "Smecta", unit: "SACHET", strength: "3g", form: "Gói bột", manufacturer: "Ipsen", rx: false, minStock: 200 },
  { cat: "TIEUHOA", code: "BUSCO10", name: "Buscopan 10mg", genericName: "Hyoscine butylbromide", unit: "TABLET", strength: "10mg", form: "Viên nén bao phim", manufacturer: "Boehringer", rx: false, minStock: 100 },

  // Tim mạch
  { cat: "TIMACH", code: "AML5", name: "Amlodipine 5mg", genericName: "Amlodipine besylate", unit: "TABLET", strength: "5mg", form: "Viên nén", manufacturer: "DHG Pharma", rx: true, minStock: 200 },
  { cat: "TIMACH", code: "ATV20", name: "Atorvastatin 20mg", genericName: "Atorvastatin calcium", brandName: "Lipitor", unit: "TABLET", strength: "20mg", form: "Viên nén bao phim", manufacturer: "Pfizer", rx: true, minStock: 150 },
  { cat: "TIMACH", code: "LOS50", name: "Losartan 50mg", genericName: "Losartan potassium", brandName: "Cozaar", unit: "TABLET", strength: "50mg", form: "Viên nén bao phim", manufacturer: "MSD", rx: true, minStock: 150 },
  { cat: "TIMACH", code: "BIS5", name: "Bisoprolol 5mg", genericName: "Bisoprolol fumarate", unit: "TABLET", strength: "5mg", form: "Viên nén bao phim", manufacturer: "Merck", rx: true, minStock: 150 },
  { cat: "TIMACH", code: "ENA5", name: "Enalapril 5mg", genericName: "Enalapril maleate", unit: "TABLET", strength: "5mg", form: "Viên nén", manufacturer: "MSD", rx: true, minStock: 100 },

  // Nội tiết
  { cat: "NOITIET", code: "MET500", name: "Metformin 500mg", genericName: "Metformin HCl", brandName: "Glucophage", unit: "TABLET", strength: "500mg", form: "Viên nén bao phim", manufacturer: "Merck", rx: true, minStock: 200 },
  { cat: "NOITIET", code: "GLI5", name: "Glibenclamide 5mg", genericName: "Glibenclamide", unit: "TABLET", strength: "5mg", form: "Viên nén", manufacturer: "Sanofi", rx: true, minStock: 100 },
  { cat: "NOITIET", code: "LEV50", name: "Levothyroxine 50mcg", genericName: "Levothyroxine sodium", brandName: "Euthyrox", unit: "TABLET", strength: "50mcg", form: "Viên nén", manufacturer: "Merck", rx: true, minStock: 100 },

  // Hô hấp – Dị ứng
  { cat: "HOHAP", code: "SAL4", name: "Salbutamol 4mg", genericName: "Salbutamol sulfate", brandName: "Ventolin", unit: "TABLET", strength: "4mg", form: "Viên nén", manufacturer: "GSK", rx: true, minStock: 100 },
  { cat: "HOHAP", code: "CET10", name: "Cetirizine 10mg", genericName: "Cetirizine diHCl", brandName: "Zyrtec", unit: "TABLET", strength: "10mg", form: "Viên nén bao phim", manufacturer: "UCB", rx: false, minStock: 200 },
  { cat: "HOHAP", code: "LOR10", name: "Loratadine 10mg", genericName: "Loratadine", brandName: "Claritin", unit: "TABLET", strength: "10mg", form: "Viên nén", manufacturer: "MSD", rx: false, minStock: 150 },
  { cat: "HOHAP", code: "MON10", name: "Montelukast 10mg", genericName: "Montelukast sodium", brandName: "Singulair", unit: "TABLET", strength: "10mg", form: "Viên nén bao phim", manufacturer: "MSD", rx: true, minStock: 100 },
  { cat: "HOHAP", code: "BRH8", name: "Bromhexine 8mg", genericName: "Bromhexine HCl", unit: "TABLET", strength: "8mg", form: "Viên nén", manufacturer: "DHG Pharma", rx: false, minStock: 150 },
  { cat: "HOHAP", code: "PRED5", name: "Prednisolone 5mg", genericName: "Prednisolone", unit: "TABLET", strength: "5mg", form: "Viên nén", manufacturer: "Roussel", rx: true, minStock: 100 },

  // Da liễu
  { cat: "DALIEU", code: "BETA005", name: "Betamethasone Cream 0.05%", genericName: "Betamethasone valerate", unit: "TUBE", strength: "0.05%", form: "Kem bôi da", manufacturer: "DHG Pharma", rx: true, minStock: 50 },
  { cat: "DALIEU", code: "CLOTRI", name: "Clotrimazole Cream 1%", genericName: "Clotrimazole", brandName: "Canesten", unit: "TUBE", strength: "1%", form: "Kem bôi da", manufacturer: "Bayer", rx: false, minStock: 50 },
  { cat: "DALIEU", code: "ACIC5", name: "Acyclovir Cream 5%", genericName: "Acyclovir", brandName: "Zovirax", unit: "TUBE", strength: "5%", form: "Kem bôi da", manufacturer: "GSK", rx: true, minStock: 50 },

  // Vitamin & Khoáng chất
  { cat: "VITAMIN", code: "VITC500", name: "Vitamin C 500mg", genericName: "Ascorbic acid", unit: "TABLET", strength: "500mg", form: "Viên nén", manufacturer: "DHG Pharma", rx: false, minStock: 300 },
  { cat: "VITAMIN", code: "BCOMPLEX", name: "Vitamin B-Complex", genericName: "Vitamin B1+B6+B12", unit: "TABLET", strength: "B1 250mg", form: "Viên nén bao phim", manufacturer: "Domesco", rx: false, minStock: 200 },
  { cat: "VITAMIN", code: "CALD3", name: "Calcium + Vitamin D3", genericName: "Calcium carbonate + Cholecalciferol", brandName: "Caltrate", unit: "TABLET", strength: "600mg + 400IU", form: "Viên nén", manufacturer: "Pfizer", rx: false, minStock: 150 },
  { cat: "VITAMIN", code: "FOLIC5", name: "Folic Acid 5mg", genericName: "Folic acid", unit: "TABLET", strength: "5mg", form: "Viên nén", manufacturer: "Mekophar", rx: false, minStock: 150 },
  { cat: "VITAMIN", code: "MULTIVIT", name: "Multivitamin tổng hợp", genericName: "Multivitamin", brandName: "Centrum", unit: "TABLET", strength: "Đa sinh tố", form: "Viên nén bao phim", manufacturer: "Wyeth", rx: false, minStock: 100 },

  // Nhãn khoa
  { cat: "NHANKHOA", code: "TOBRA3", name: "Tobramycin nhỏ mắt 0.3%", genericName: "Tobramycin", brandName: "Tobrex", unit: "BOTTLE", strength: "0.3%", form: "Nhỏ mắt", manufacturer: "Alcon", rx: true, minStock: 30 },
  { cat: "NHANKHOA", code: "NATRTEYE", name: "Natri Clorid 0.9% nhỏ mắt", genericName: "Sodium chloride", unit: "BOTTLE", strength: "0.9%", form: "Nhỏ mắt", manufacturer: "DHG Pharma", rx: false, minStock: 50 },

  // Cơ xương khớp
  { cat: "COXUONGKHOP", code: "GLUCO500", name: "Glucosamine 500mg", genericName: "Glucosamine sulfate", unit: "CAPSULE", strength: "500mg", form: "Viên nang", manufacturer: "Vidipha", rx: false, minStock: 100 },
  { cat: "COXUONGKHOP", code: "VOLTSRM", name: "Voltaren Emulgel 1%", genericName: "Diclofenac diethylamine", brandName: "Voltaren", unit: "TUBE", strength: "1%", form: "Gel bôi", manufacturer: "Novartis", rx: false, minStock: 50 },
]

// ─── SERVICES ────────────────────────────────────────────────────────────────
const SERVICES = [
  // Khám bệnh
  { code: "KB01", name: "Khám tổng quát", price: 150000, duration: 20, desc: "Khám sức khỏe tổng quát" },
  { code: "KB02", name: "Khám chuyên khoa", price: 250000, duration: 30, desc: "Khám theo chuyên khoa" },
  { code: "KB03", name: "Khám nội khoa", price: 200000, duration: 25, desc: "Khám bệnh lý nội khoa" },
  { code: "KB04", name: "Khám nhi khoa", price: 180000, duration: 20, desc: "Khám trẻ em" },
  { code: "KB05", name: "Khám tim mạch", price: 350000, duration: 30, desc: "Khám bệnh lý tim mạch" },
  { code: "KB06", name: "Khám da liễu", price: 200000, duration: 20, desc: "Khám bệnh da" },
  { code: "KB07", name: "Khám tai mũi họng", price: 200000, duration: 20, desc: "Khám TMH" },
  { code: "KB08", name: "Khám mắt", price: 180000, duration: 20, desc: "Khám nhãn khoa" },
  { code: "KB09", name: "Khám phụ sản", price: 250000, duration: 30, desc: "Khám phụ khoa và sản khoa" },
  { code: "KB10", name: "Khám xương khớp", price: 250000, duration: 25, desc: "Khám cơ xương khớp" },
  { code: "KB11", name: "Khám thần kinh", price: 300000, duration: 30, desc: "Khám thần kinh" },
  { code: "KB12", name: "Tư vấn dinh dưỡng", price: 200000, duration: 30, desc: "Tư vấn và lập kế hoạch dinh dưỡng" },
  { code: "KB13", name: "Tái khám", price: 80000, duration: 15, desc: "Tái khám sau điều trị" },
  { code: "KB14", name: "Khám sức khỏe định kỳ (cơ bản)", price: 350000, duration: 45, desc: "Gói khám định kỳ cơ bản" },
  { code: "KB15", name: "Khám sức khỏe định kỳ (nâng cao)", price: 750000, duration: 60, desc: "Gói khám định kỳ nâng cao" },

  // Thủ thuật
  { code: "TT01", name: "Tiêm bắp", price: 50000, duration: 10, desc: "Tiêm thuốc bắp thịt" },
  { code: "TT02", name: "Tiêm tĩnh mạch", price: 80000, duration: 15, desc: "Tiêm thuốc tĩnh mạch" },
  { code: "TT03", name: "Truyền dịch (500ml)", price: 180000, duration: 60, desc: "Truyền dịch tĩnh mạch" },
  { code: "TT04", name: "Thay băng vết thương đơn giản", price: 50000, duration: 15, desc: "Thay băng vết thương nhỏ" },
  { code: "TT05", name: "Khâu vết thương nhỏ (< 5cm)", price: 200000, duration: 20, desc: "Khâu vết thương đơn giản" },
  { code: "TT06", name: "Cắt chỉ", price: 50000, duration: 10, desc: "Cắt chỉ sau khâu" },
  { code: "TT07", name: "Rửa tai", price: 100000, duration: 15, desc: "Lấy ráy tai, rửa tai" },
  { code: "TT08", name: "Hút mũi", price: 80000, duration: 10, desc: "Hút mũi điều trị viêm mũi" },
  { code: "TT09", name: "Xông họng", price: 100000, duration: 20, desc: "Xông hơi thuốc điều trị họng" },
  { code: "TT10", name: "Trích áp xe nhỏ", price: 200000, duration: 20, desc: "Rạch tháo mủ áp xe nhỏ" },

  // Xét nghiệm
  { code: "XN01", name: "Công thức máu (CBC)", price: 100000, duration: 30, desc: "Xét nghiệm tổng phân tích tế bào máu" },
  { code: "XN02", name: "Đường huyết lúc đói", price: 50000, duration: 30, desc: "Glucose máu" },
  { code: "XN03", name: "Đường huyết sau ăn 2h", price: 50000, duration: 30, desc: "Glucose máu sau ăn" },
  { code: "XN04", name: "HbA1c", price: 150000, duration: 30, desc: "Hemoglobin A1c – kiểm soát đường huyết 3 tháng" },
  { code: "XN05", name: "Lipid máu toàn bộ", price: 200000, duration: 30, desc: "Cholesterol TP, LDL, HDL, Triglyceride" },
  { code: "XN06", name: "Chức năng gan (AST, ALT, GGT)", price: 140000, duration: 30, desc: "Xét nghiệm men gan" },
  { code: "XN07", name: "Chức năng thận (Creatinine, Urea)", price: 120000, duration: 30, desc: "Xét nghiệm chức năng thận" },
  { code: "XN08", name: "Tổng phân tích nước tiểu (10 thông số)", price: 60000, duration: 30, desc: "Xét nghiệm nước tiểu" },
  { code: "XN09", name: "TSH (Tuyến giáp)", price: 200000, duration: 45, desc: "Thyroid stimulating hormone" },
  { code: "XN10", name: "HBsAg (Viêm gan B)", price: 100000, duration: 30, desc: "Kháng nguyên bề mặt virus viêm gan B" },
  { code: "XN11", name: "HIV Ag/Ab Combo", price: 150000, duration: 30, desc: "Xét nghiệm HIV thế hệ 4" },
  { code: "XN12", name: "CRP (Protein phản ứng C)", price: 100000, duration: 30, desc: "Chỉ số viêm nhiễm" },
  { code: "XN13", name: "Nhóm máu ABO + Rh", price: 80000, duration: 30, desc: "Xét nghiệm nhóm máu" },
  { code: "XN14", name: "Điện giải đồ (Na, K, Cl)", price: 150000, duration: 30, desc: "Xét nghiệm điện giải" },
  { code: "XN15", name: "Axit uric máu", price: 80000, duration: 30, desc: "Xét nghiệm Gout" },
  { code: "XN16", name: "Pro-BNP (suy tim)", price: 400000, duration: 60, desc: "NT-proBNP – marker suy tim" },

  // Chẩn đoán hình ảnh
  { code: "CDHA01", name: "X-quang ngực thẳng", price: 150000, duration: 15, desc: "Chụp X-quang phổi và tim" },
  { code: "CDHA02", name: "X-quang cột sống thắt lưng", price: 180000, duration: 15, desc: "X-quang cột sống 2 tư thế" },
  { code: "CDHA03", name: "X-quang xương (chi)", price: 150000, duration: 15, desc: "X-quang xương tay/chân" },
  { code: "CDHA04", name: "Siêu âm bụng tổng quát", price: 200000, duration: 20, desc: "Siêu âm gan, mật, tụy, lách, thận" },
  { code: "CDHA05", name: "Siêu âm thai", price: 250000, duration: 20, desc: "Siêu âm thai kỳ" },
  { code: "CDHA06", name: "Siêu âm tim (Doppler)", price: 450000, duration: 30, desc: "Siêu âm tim 2D có Doppler màu" },
  { code: "CDHA07", name: "Siêu âm tuyến giáp", price: 200000, duration: 15, desc: "Siêu âm tuyến giáp" },
  { code: "CDHA08", name: "Siêu âm phụ khoa", price: 200000, duration: 15, desc: "Siêu âm bộ phận sinh dục nữ" },
  { code: "CDHA09", name: "Điện tâm đồ (ECG 12 chuyển đạo)", price: 100000, duration: 15, desc: "Đo điện tim" },
  { code: "CDHA10", name: "Holter ECG 24 giờ", price: 800000, duration: 1440, desc: "Theo dõi điện tim 24 giờ" },
  { code: "CDHA11", name: "Đo mật độ xương (DXA)", price: 350000, duration: 20, desc: "Đo loãng xương" },
  { code: "CDHA12", name: "Nội soi dạ dày tá tràng", price: 700000, duration: 30, desc: "Nội soi dạ dày qua đường miệng" },
  { code: "CDHA13", name: "Nội soi đại tràng", price: 1200000, duration: 45, desc: "Nội soi đại tràng" },
  { code: "CDHA14", name: "CT scan sọ não", price: 1500000, duration: 30, desc: "Chụp cắt lớp vi tính đầu" },
  { code: "CDHA15", name: "MRI não", price: 4000000, duration: 45, desc: "Chụp cộng hưởng từ não" },
]

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export async function seedReferenceData() {
  const clinic = await prisma.clinic.findFirst()
  if (!clinic) throw new Error("Chưa có dữ liệu phòng khám. Chạy seed chính trước.")

  // 1. Drug categories
  console.log("📦 Seeding drug categories...")
  const catMap: Record<string, string> = {}
  for (const c of DRUG_CATEGORIES) {
    const cat = await prisma.drugCategory.upsert({
      where: { code: c.code },
      update: { name: c.name },
      create: { code: c.code, name: c.name },
    })
    catMap[c.code] = cat.id
  }

  // 2. Drugs
  console.log("💊 Seeding drugs...")
  let drugCount = 0
  for (const d of DRUGS) {
    const catId = catMap[d.cat]
    if (!catId) continue
    try {
      await prisma.drug.upsert({
        where: { code: d.code },
        update: { name: d.name, genericName: d.genericName, brandName: d.brandName, strength: d.strength, form: d.form, manufacturer: d.manufacturer },
        create: {
          code: d.code,
          name: d.name,
          genericName: d.genericName,
          brandName: d.brandName,
          unit: d.unit as any,
          strength: d.strength,
          form: d.form,
          manufacturer: d.manufacturer,
          countryOfOrigin: d.manufacturer && ["DHG Pharma","Domesco","Imexpharm","Vidipha","Pymepharco","Mekophar"].includes(d.manufacturer) ? "Việt Nam" : "Nhập khẩu",
          requirePrescription: d.rx,
          minStock: d.minStock,
          categoryId: catId,
        },
      })
      drugCount++
    } catch (e: any) {
      console.warn(`  ⚠ Drug ${d.code}: ${e.message}`)
    }
  }
  console.log(`  ✓ ${drugCount} thuốc`)

  // 3. Services
  console.log("🏥 Seeding services...")
  let svcCount = 0
  for (const s of SERVICES) {
    try {
      await prisma.service.upsert({
        where: { code: s.code },
        update: { name: s.name, price: s.price, description: s.desc },
        create: {
          code: s.code,
          name: s.name,
          price: s.price,
          description: s.desc,
          clinicId: clinic.id,
          unit: "lần",
          isActive: true,
        },
      })
      svcCount++
    } catch (e: any) {
      console.warn(`  ⚠ Service ${s.code}: ${e.message}`)
    }
  }
  console.log(`  ✓ ${svcCount} dịch vụ`)

  return { categories: DRUG_CATEGORIES.length, drugs: drugCount, services: svcCount }
}

// Run directly
if (require.main === module) {
  seedReferenceData()
    .then(r => console.log("✅ Done:", r))
    .catch(console.error)
    .finally(() => prisma.$disconnect())
}
