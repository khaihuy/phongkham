import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const DEFAULT_NAV = [
  {
    title: "Khám & Chữa bệnh", icon: "Stethoscope", sortOrder: 0,
    items: [
      { label: "Khám tổng quát", href: "/danh-muc/kham-tong-quat", sortOrder: 0 },
      { label: "Khám chuyên khoa", href: "/danh-muc/chuyen-khoa", sortOrder: 1 },
      { label: "Khám online", href: "/danh-muc/kham-online", sortOrder: 2 },
      { label: "Tiêm chủng", href: "/danh-muc/tiem-chung", sortOrder: 3 },
    ],
  },
  {
    title: "Thuốc", icon: "Pill", sortOrder: 1,
    items: [
      { label: "Thuốc kê đơn", href: "/san-pham?productType=DRUG&requirePrescription=true", sortOrder: 0 },
      { label: "Thuốc không kê đơn", href: "/san-pham?productType=DRUG&requirePrescription=false", sortOrder: 1 },
      { label: "Tất cả thuốc", href: "/san-pham?productType=DRUG", sortOrder: 2 },
    ],
  },
  {
    title: "Thực phẩm chức năng", icon: "HeartPulse", sortOrder: 2,
    items: [
      { label: "Vitamin & khoáng chất", href: "/san-pham?productType=SUPPLEMENT&category=vitamin", sortOrder: 0 },
      { label: "Tăng cường miễn dịch", href: "/san-pham?productType=SUPPLEMENT", sortOrder: 1 },
      { label: "Tất cả TPCN", href: "/san-pham?productType=SUPPLEMENT", sortOrder: 2 },
    ],
  },
  {
    title: "Mẹ & Bé", icon: "Baby", sortOrder: 3,
    items: [
      { label: "Khám nhi", href: "/danh-muc/nhi", sortOrder: 0 },
      { label: "Tư vấn sản khoa", href: "/danh-muc/san-khoa", sortOrder: 1 },
      { label: "Vitamin cho mẹ", href: "/san-pham?category=me-be", sortOrder: 2 },
    ],
  },
  {
    title: "Chăm sóc cá nhân", icon: "Sparkles", sortOrder: 4,
    items: [
      { label: "Dụng cụ y tế", href: "/san-pham?category=dung-cu", sortOrder: 0 },
      { label: "Chăm sóc da", href: "/san-pham?category=da", sortOrder: 1 },
    ],
  },
  {
    title: "Khuyến mãi", icon: "Tag", sortOrder: 5,
    items: [
      { label: "Ưu đãi tuần", href: "/uu-dai", sortOrder: 0 },
      { label: "Combo tiết kiệm", href: "/combo", sortOrder: 1 },
    ],
  },
]

export async function seedNavMenu() {
  const existing = await prisma.navCategory.count()
  if (existing > 0) return

  for (const cat of DEFAULT_NAV) {
    const { items, ...catData } = cat
    await prisma.navCategory.create({
      data: { ...catData, items: { create: items } },
    })
  }
  console.log("✅ Seeded nav menu with", DEFAULT_NAV.length, "categories")
}

if (require.main === module) {
  seedNavMenu().then(() => prisma.$disconnect())
}
