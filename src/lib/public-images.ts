// Bộ hình ảnh thực tế cho website công khai.
// Dùng Unsplash photo URLs (free, ổn định cho placeholder/production).
// Khi có ảnh thật của phòng khám, thay vào đây hoặc qua field DB
// tương ứng (Drug.imageUrl, Doctor.avatarUrl, Post.coverImageUrl).

const u = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

export const IMG = {
  // Hero — bác sĩ + bệnh nhân hoặc team y tế
  hero: u("1576091160550-2173dba999ef", 1600),

  // Trang chủ — section bác sĩ
  doctorMale:   u("1612349317150-e413f6a5b16d", 400),
  doctorFemale: u("1559839734-2b71ea197ec2", 400),

  // Branch / chi nhánh — phòng khám
  branchExterior: u("1519494026892-80bbd2d6fd0d", 600),

  // Product fallback theo loại — không có ảnh riêng thì dùng default
  drugDefault:       u("1584308666744-24d5c474f2ae", 600),
  supplementDefault: u("1556909114-f6e7ad7d3136", 600),

  // Blog cover fallback theo tag
  blogHealth:    u("1559757148-5c350d0d3c56", 1000),
  blogChildren: u("1607774037539-c7755a08e5f0", 1000),
  blogMedicine: u("1583947215259-38e31be8751f", 1000),
  blogNutrition: u("1490645935967-10de6ba17061", 1000),
  blogDefault:  u("1559757175-5700dde675bc", 1000),
};

// Pick blog cover fallback theo tag
export function blogCoverByTag(tag: string | null | undefined): string {
  if (!tag) return IMG.blogDefault;
  const t = tag.toLowerCase();
  if (t.includes("mẹ") || t.includes("bé")) return IMG.blogChildren;
  if (t.includes("thuốc") || t.includes("bệnh")) return IMG.blogMedicine;
  if (t.includes("dinh dưỡng")) return IMG.blogNutrition;
  return IMG.blogHealth;
}

// Pick product image fallback theo productType
export function productImageByType(type: string | null | undefined): string {
  return type === "SUPPLEMENT" ? IMG.supplementDefault : IMG.drugDefault;
}

// Pick doctor avatar fallback theo gender hoặc index
export function doctorAvatarByIndex(idx: number, gender?: string | null): string {
  if (gender === "MALE") return IMG.doctorMale;
  if (gender === "FEMALE") return IMG.doctorFemale;
  return idx % 2 === 0 ? IMG.doctorMale : IMG.doctorFemale;
}
