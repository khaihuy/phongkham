import Link from "next/link";
import { Phone, Mail, MapPin, Facebook, Youtube, MessageCircle } from "lucide-react";
import type { SiteContext, FooterLink } from "./PublicShell";

// Link mặc định khi admin chưa cấu hình trang nội dung nào cho nhóm tương ứng
const DEFAULT_LINKS: Record<FooterLink["group"], { label: string; url: string }[]> = {
  SUPPORT: [
    { label: "Tra cứu đơn hàng", url: "/tra-cuu-don" },
    { label: "Câu hỏi thường gặp", url: "/cau-hoi" },
    { label: "Liên hệ", url: "/lien-he" },
    { label: "Đặt lịch khám", url: "/dat-lich" },
  ],
  ABOUT: [
    { label: "Giới thiệu", url: "/gioi-thieu" },
    { label: "Hệ thống chi nhánh", url: "/chi-nhanh" },
    { label: "Tuyển dụng", url: "/tuyen-dung" },
    { label: "Cẩm nang sức khỏe", url: "/cam-nang" },
  ],
  LEGAL: [
    { label: "Điều khoản sử dụng", url: "/dieu-khoan" },
    { label: "Chính sách bảo mật", url: "/bao-mat" },
    { label: "Chính sách giao hàng", url: "/giao-hang" },
    { label: "Đổi trả", url: "/doi-tra" },
  ],
};

export default function PublicFooter({ site }: { site: SiteContext }) {
  const clinicName = site.clinic?.name ?? "Phòng Khám";
  const shortName = clinicName.replace(/^Phòng Khám\s*(Đa Khoa\s*)?/i, "").trim() || clinicName;
  const initials = shortName.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "PK";
  const hotline = site.settings?.hotline ?? site.clinic?.phone ?? "";
  const email = site.clinic?.email ?? "";
  const address = site.clinic?.address ?? "";
  const licenseNo = site.clinic?.licenseNo ?? "";
  const { facebookUrl, youtubeUrl, zaloUrl } = site.settings ?? {};

  // Lấy link theo nhóm — ưu tiên cấu hình admin, fallback về mặc định
  const linksFor = (group: FooterLink["group"]) => {
    const fromDb = (site.footerLinks ?? []).filter((l) => l.group === group);
    return fromDb.length > 0 ? fromDb : DEFAULT_LINKS[group];
  };

  const FooterColumn = ({ title, group }: { title: string; group: FooterLink["group"] }) => (
    <div>
      <h3 className="font-semibold mb-3">{title}</h3>
      <ul className="space-y-2 text-brand-200">
        {linksFor(group).map((l) => (
          <li key={l.url + l.label}>
            <Link href={l.url} className="hover:text-white">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );

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

        <FooterColumn title="Hỗ trợ khách hàng" group="SUPPORT" />
        <FooterColumn title="Về chúng tôi" group="ABOUT" />
        <FooterColumn title="Pháp lý" group="LEGAL" />

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
