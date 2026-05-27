import Link from "next/link";
import { Phone, Mail, MapPin, Facebook, Youtube, MessageCircle } from "lucide-react";
import type { SiteContext } from "./PublicShell";

export default function PublicFooter({ site }: { site: SiteContext }) {
  const clinicName = site.clinic?.name ?? "Phòng Khám";
  const shortName = clinicName.replace(/^Phòng Khám\s*(Đa Khoa\s*)?/i, "").trim() || clinicName;
  const initials = shortName.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "PK";
  const hotline = site.settings?.hotline ?? site.clinic?.phone ?? "";
  const email = site.clinic?.email ?? "";
  const address = site.clinic?.address ?? "";
  const licenseNo = site.clinic?.licenseNo ?? "";
  const { facebookUrl, youtubeUrl, zaloUrl } = site.settings ?? {};

  return (
    <footer className="bg-brand-900 text-white mt-16">
      <div className="max-w-8xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-700 font-bold">
              {initials}
            </div>
            <div>
              <p className="font-bold text-base">{shortName}</p>
              <p className="text-xs text-brand-200">{clinicName.startsWith("Phòng") ? clinicName : "Phòng khám"}</p>
            </div>
          </div>
          <p className="text-brand-200 text-xs leading-relaxed">
            Hệ thống phòng khám đa khoa với đội ngũ bác sĩ chuyên môn cao,
            trang thiết bị hiện đại — đem đến dịch vụ chăm sóc sức khỏe toàn diện.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Hỗ trợ khách hàng</h3>
          <ul className="space-y-2 text-brand-200">
            <li><Link href="/tra-cuu-don" className="hover:text-white">Tra cứu đơn hàng</Link></li>
            <li><Link href="/cau-hoi" className="hover:text-white">Câu hỏi thường gặp</Link></li>
            <li><Link href="/lien-he" className="hover:text-white">Liên hệ</Link></li>
            <li><Link href="/dat-lich" className="hover:text-white">Đặt lịch khám</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Về chúng tôi</h3>
          <ul className="space-y-2 text-brand-200">
            <li><Link href="/gioi-thieu" className="hover:text-white">Giới thiệu</Link></li>
            <li><Link href="/chi-nhanh" className="hover:text-white">Hệ thống chi nhánh</Link></li>
            <li><Link href="/tuyen-dung" className="hover:text-white">Tuyển dụng</Link></li>
            <li><Link href="/cam-nang" className="hover:text-white">Cẩm nang sức khỏe</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Pháp lý</h3>
          <ul className="space-y-2 text-brand-200">
            <li><Link href="/dieu-khoan" className="hover:text-white">Điều khoản sử dụng</Link></li>
            <li><Link href="/bao-mat" className="hover:text-white">Chính sách bảo mật</Link></li>
            <li><Link href="/giao-hang" className="hover:text-white">Chính sách giao hàng</Link></li>
            <li><Link href="/doi-tra" className="hover:text-white">Đổi trả</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Liên hệ</h3>
          <ul className="space-y-2 text-brand-200">
            {hotline && (
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href={`tel:${hotline}`} className="hover:text-white">
                  Hotline 24/7<br /><strong className="text-white">{hotline}</strong>
                </a>
              </li>
            )}
            {email && (
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white">{email}</a>
              </li>
            )}
            {address && (
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{address}</span>
              </li>
            )}
          </ul>
          {(facebookUrl || youtubeUrl || zaloUrl) && (
            <div className="flex gap-3 mt-4">
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener" className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {youtubeUrl && (
                <a href={youtubeUrl} target="_blank" rel="noopener" className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center">
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {zaloUrl && (
                <a href={zaloUrl} target="_blank" rel="noopener" className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-brand-800 py-4">
        <div className="max-w-8xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-brand-200">
          <p>© {new Date().getFullYear()} {clinicName}. Mọi quyền được bảo lưu.</p>
          {licenseNo && (
            <p>Giấy phép hoạt động khám chữa bệnh số {licenseNo} do Sở Y tế cấp.</p>
          )}
        </div>
      </div>
    </footer>
  );
}
