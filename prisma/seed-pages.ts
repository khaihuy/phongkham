import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

type FooterGroup = "SUPPORT" | "ABOUT" | "LEGAL"

interface SeedPage {
  slug: string
  title: string
  content: string
  excerpt?: string
  footerGroup: FooterGroup
  footerLabel?: string
  linkUrl?: string
  sortOrder: number
}

// Nội dung mặc định cho các mục footer. {clinic} sẽ được thay bằng tên phòng khám.
const FOOTER_PAGES: SeedPage[] = [
  // Cột: Hỗ trợ khách hàng
  {
    slug: "tra-cuu-don", title: "Tra cứu đơn hàng", footerGroup: "SUPPORT", sortOrder: 1,
    excerpt: "Tra cứu trạng thái đơn thuốc / đơn hàng của bạn.",
    content: `<p>Để tra cứu đơn thuốc hoặc đơn hàng, vui lòng liên hệ hotline hoặc đến quầy lễ tân của {clinic} kèm mã đơn hoặc số điện thoại đã đăng ký.</p><p>Chúng tôi sẽ hỗ trợ bạn kiểm tra tình trạng đơn nhanh chóng.</p>`,
  },
  {
    slug: "cau-hoi", title: "Câu hỏi thường gặp", footerGroup: "SUPPORT", sortOrder: 2,
    excerpt: "Giải đáp những thắc mắc phổ biến của khách hàng.",
    content: `<h2>Làm sao để đặt lịch khám?</h2><p>Bạn có thể đặt lịch trực tuyến qua trang Đặt lịch khám hoặc gọi hotline.</p><h2>Tôi có cần mang theo giấy tờ gì không?</h2><p>Vui lòng mang CCCD/CMND và thẻ BHYT (nếu có) khi đến khám.</p><h2>Phòng khám làm việc giờ nào?</h2><p>Chúng tôi làm việc từ thứ Hai đến Chủ Nhật. Vui lòng xem chi tiết giờ làm việc tại mục Liên hệ.</p>`,
  },
  {
    slug: "lien-he", title: "Liên hệ", footerGroup: "SUPPORT", sortOrder: 3,
    excerpt: "Thông tin liên hệ và hỗ trợ.",
    content: `<p>Mọi thắc mắc xin liên hệ <strong>{clinic}</strong>:</p><ul><li>Hotline: gọi theo số hiển thị ở chân trang</li><li>Email: theo thông tin tại mục Cài đặt phòng khám</li><li>Địa chỉ: xem mục Hệ thống chi nhánh</li></ul><p>Chúng tôi luôn sẵn sàng hỗ trợ bạn.</p>`,
  },
  {
    slug: "dat-lich", title: "Đặt lịch khám", footerGroup: "SUPPORT", sortOrder: 4,
    linkUrl: "/dat-lich",
    content: `<p>Trang đặt lịch khám trực tuyến.</p>`,
  },
  // Cột: Về chúng tôi
  {
    slug: "gioi-thieu", title: "Giới thiệu", footerGroup: "ABOUT", sortOrder: 1,
    excerpt: "Về {clinic}.",
    content: `<p><strong>{clinic}</strong> là hệ thống phòng khám đa khoa với đội ngũ bác sĩ chuyên môn cao và trang thiết bị hiện đại.</p><p>Chúng tôi cam kết mang đến dịch vụ chăm sóc sức khỏe toàn diện, tận tâm và chuyên nghiệp cho mọi khách hàng.</p><h2>Tầm nhìn</h2><p>Trở thành địa chỉ chăm sóc sức khỏe tin cậy hàng đầu trong khu vực.</p><h2>Giá trị cốt lõi</h2><ul><li>Tận tâm với người bệnh</li><li>Chuyên môn vững vàng</li><li>Minh bạch &amp; trung thực</li></ul>`,
  },
  {
    slug: "chi-nhanh", title: "Hệ thống chi nhánh", footerGroup: "ABOUT", sortOrder: 2,
    linkUrl: "/chi-nhanh",
    content: `<p>Danh sách chi nhánh của hệ thống.</p>`,
  },
  {
    slug: "tuyen-dung", title: "Tuyển dụng", footerGroup: "ABOUT", sortOrder: 3,
    excerpt: "Cơ hội nghề nghiệp tại phòng khám.",
    content: `<p><strong>{clinic}</strong> luôn chào đón những ứng viên tài năng, tâm huyết với nghề y.</p><h2>Vị trí thường tuyển</h2><ul><li>Bác sĩ đa khoa / chuyên khoa</li><li>Điều dưỡng</li><li>Dược sĩ</li><li>Lễ tân &amp; chăm sóc khách hàng</li></ul><p>Ứng viên quan tâm vui lòng gửi hồ sơ qua email hoặc liên hệ hotline.</p>`,
  },
  {
    slug: "cam-nang", title: "Cẩm nang sức khỏe", footerGroup: "ABOUT", sortOrder: 4,
    linkUrl: "/cam-nang",
    content: `<p>Các bài viết cẩm nang sức khỏe.</p>`,
  },
  // Cột: Pháp lý
  {
    slug: "dieu-khoan", title: "Điều khoản sử dụng", footerGroup: "LEGAL", sortOrder: 1,
    excerpt: "Điều khoản & điều kiện sử dụng dịch vụ.",
    content: `<p>Khi sử dụng website và dịch vụ của <strong>{clinic}</strong>, bạn đồng ý với các điều khoản sau:</p><ul><li>Cung cấp thông tin chính xác khi đặt lịch/đăng ký.</li><li>Không sử dụng dịch vụ cho mục đích trái pháp luật.</li><li>Tôn trọng quyền sở hữu trí tuệ của nội dung trên website.</li></ul><p>Chúng tôi có quyền cập nhật điều khoản này khi cần thiết.</p>`,
  },
  {
    slug: "bao-mat", title: "Chính sách bảo mật", footerGroup: "LEGAL", sortOrder: 2,
    excerpt: "Cách chúng tôi bảo vệ thông tin của bạn.",
    content: `<p><strong>{clinic}</strong> cam kết bảo mật thông tin cá nhân và hồ sơ sức khỏe của khách hàng.</p><ul><li>Thông tin chỉ dùng cho mục đích khám chữa bệnh và chăm sóc khách hàng.</li><li>Không chia sẻ cho bên thứ ba khi chưa có sự đồng ý, trừ trường hợp pháp luật yêu cầu.</li><li>Dữ liệu được lưu trữ an toàn theo quy định.</li></ul>`,
  },
  {
    slug: "giao-hang", title: "Chính sách giao hàng", footerGroup: "LEGAL", sortOrder: 3,
    excerpt: "Quy định giao nhận thuốc / sản phẩm.",
    content: `<p>Áp dụng cho các đơn thuốc/sản phẩm đặt qua {clinic}:</p><ul><li>Giao hàng trong khu vực theo thoả thuận khi đặt đơn.</li><li>Thời gian giao tuỳ khoảng cách và tình trạng hàng.</li><li>Phí giao hàng (nếu có) được thông báo trước khi xác nhận.</li></ul>`,
  },
  {
    slug: "doi-tra", title: "Đổi trả", footerGroup: "LEGAL", sortOrder: 4,
    excerpt: "Chính sách đổi trả sản phẩm.",
    content: `<p>Vì lý do an toàn sức khỏe, thuốc đã xuất khỏi quầy không áp dụng đổi trả, trừ trường hợp:</p><ul><li>Sản phẩm lỗi do nhà sản xuất.</li><li>Giao sai sản phẩm so với đơn.</li></ul><p>Vui lòng liên hệ trong vòng 48 giờ kèm hoá đơn để được hỗ trợ.</p>`,
  },
]

// Seed các trang footer (idempotent — không ghi đè nội dung admin đã chỉnh sửa).
export async function seedSitePages() {
  const clinic = await prisma.clinic.findFirst({ select: { name: true } })
  const clinicName = clinic?.name ?? "Phòng Khám"

  let created = 0
  for (const p of FOOTER_PAGES) {
    const res = await prisma.sitePage.upsert({
      where: { slug: p.slug },
      update: {}, // giữ nguyên nội dung nếu trang đã tồn tại
      create: {
        slug: p.slug,
        title: p.title,
        content: p.content.replaceAll("{clinic}", clinicName),
        excerpt: p.excerpt ? p.excerpt.replaceAll("{clinic}", clinicName) : null,
        status: "PUBLISHED",
        footerGroup: p.footerGroup,
        footerLabel: p.footerLabel ?? null,
        linkUrl: p.linkUrl ?? null,
        sortOrder: p.sortOrder,
      },
    })
    if (res) created++
  }

  return { pages: FOOTER_PAGES.length, upserted: created }
}

// Run directly
if (require.main === module) {
  seedSitePages()
    .then((r) => console.log("✅ Seed footer pages:", r))
    .catch(console.error)
    .finally(() => prisma.$disconnect())
}
