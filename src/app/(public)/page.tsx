import Link from "next/link";
import { prisma } from "@/db/prisma";
import {
  Stethoscope,
  CalendarDays,
  Pill,
  Phone,
  MapPin,
  ArrowRight,
  Star,
  ShieldCheck,
  Clock,
  Truck,
} from "lucide-react";
import { IMG, blogCoverByTag, productImageByType, doctorAvatarByIndex } from "@/lib/public-images";

export const dynamic = "force-dynamic";

function fmtVND(n: number | null) {
  if (!n) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

export default async function HomePage() {
  // SSR — server components: lấy data trực tiếp từ Prisma
  // Featured drugs: ưu tiên isFeatured=true, sort theo featuredOrder DESC.
  // Fallback: nếu không có featured, lấy 8 sản phẩm active mới nhất.
  const featuredFirst = await prisma.drug.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: [{ featuredOrder: "desc" }, { createdAt: "desc" }],
    take: 8,
    select: {
      id: true,
      code: true,
      name: true,
      unit: true,
      strength: true,
      manufacturer: true,
      productType: true,
      inventory: { select: { sellPrice: true, quantity: true }, take: 1, orderBy: { createdAt: "desc" } },
    },
  });
  const drugsPromise = featuredFirst.length >= 4
    ? Promise.resolve(featuredFirst)
    : prisma.drug.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          code: true,
          name: true,
          unit: true,
          strength: true,
          manufacturer: true,
          productType: true,
          inventory: { select: { sellPrice: true, quantity: true }, take: 1, orderBy: { createdAt: "desc" } },
        },
      });

  const settingsPromise = prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  const clinicPromise = prisma.clinic.findFirst({
    select: { name: true, phone: true, address: true },
  });

  const [drugs, doctors, branches, settings, clinic, latestPosts] = await Promise.all([
    drugsPromise,
    prisma.doctor.findMany({
      where: { isActive: true },
      take: 4,
      select: {
        id: true,
        title: true,
        yearsOfExp: true,
        user: { select: { fullName: true, avatarUrl: true } },
        specialty: { select: { name: true } },
      },
    }),
    prisma.branch.findMany({
      orderBy: [{ isMain: "desc" }, { name: "asc" }],
      take: 3,
      select: { id: true, name: true, address: true, phone: true },
    }),
    settingsPromise,
    clinicPromise,
    prisma.post.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: { id: true, slug: true, title: true, excerpt: true, coverImageUrl: true, tag: true, publishedAt: true },
    }),
  ]);

  const featured = drugs.map((d) => ({
    ...d,
    price: d.inventory[0]?.sellPrice ? Number(d.inventory[0].sellPrice) : null,
    inStock: (d.inventory[0]?.quantity ?? 0) > 0,
  }));

  return (
    <>
      {/* Promo banner */}
      {settings?.promoBannerText && (
        <div className="bg-accent-500 text-white text-center text-sm py-2 px-4">
          {settings.promoBannerUrl ? (
            <Link href={settings.promoBannerUrl} className="hover:underline">
              🎉 {settings.promoBannerText}
            </Link>
          ) : (
            <>🎉 {settings.promoBannerText}</>
          )}
        </div>
      )}

      {/* Hero */}
      <section
        className="relative bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white overflow-hidden"
      >
        {/* Background photo (giảm opacity để chữ vẫn rõ) */}
        <img
          src={IMG.hero}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-800/60 to-transparent" />
        <div className="relative max-w-8xl mx-auto px-4 py-12 md:py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-4">
              🏥 {clinic?.name ?? "Phòng khám đa khoa"}
            </p>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
              {settings?.heroTitle ?? "Chăm sóc sức khỏe toàn diện cho gia đình"}
            </h1>
            <p className="text-brand-50 text-lg mb-6">
              {settings?.heroSubtitle ?? "Đặt lịch khám online · Đội ngũ bác sĩ chuyên môn cao"}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={settings?.heroCtaUrl ?? "/dat-lich"}
                className="flex items-center gap-2 px-6 py-3 bg-accent-500 hover:bg-accent-600 rounded-full font-semibold shadow-lg"
              >
                <CalendarDays className="w-5 h-5" /> {settings?.heroCtaText ?? "Đặt lịch khám ngay"}
              </Link>
              <Link
                href="/san-pham"
                className="flex items-center gap-2 px-6 py-3 bg-white/15 hover:bg-white/25 backdrop-blur rounded-full font-semibold"
              >
                <Pill className="w-5 h-5" /> Mua thuốc & TPCN
              </Link>
            </div>
          </div>

          <div className="hidden md:grid grid-cols-2 gap-3">
            {[
              { icon: ShieldCheck, label: "Bác sĩ chuyên môn cao" },
              { icon: Clock, label: "Hỗ trợ 24/7" },
              { icon: Truck, label: "Giao thuốc tận nhà" },
              { icon: Star, label: "Đánh giá 4.8/5" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="bg-white/15 backdrop-blur rounded-xl p-4 border border-white/20"
              >
                <Icon className="w-7 h-7 mb-2 text-yellow-300" />
                <p className="text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service tiles */}
      <section className="max-w-8xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { href: "/dat-lich", icon: CalendarDays, label: "Đặt lịch khám", desc: "Chọn bác sĩ & giờ", color: "bg-brand-100 text-brand-700" },
            { href: "/san-pham?productType=DRUG", icon: Pill, label: "Mua thuốc", desc: "Có đơn / không đơn", color: "bg-emerald-100 text-emerald-700" },
            { href: "/san-pham?productType=SUPPLEMENT", icon: Pill, label: "TPCN", desc: "Thực phẩm chức năng", color: "bg-orange-100 text-orange-700" },
            { href: "/chi-nhanh", icon: MapPin, label: "Chi nhánh gần bạn", desc: "Tìm phòng khám", color: "bg-purple-100 text-purple-700" },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className="bg-white rounded-xl shadow-product hover:shadow-card transition-shadow p-4 flex items-start gap-3"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${t.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{t.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-8xl mx-auto px-4 mt-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Sản phẩm bán chạy</h2>
            <p className="text-sm text-gray-500 mt-1">Thuốc và TPCN được tin dùng</p>
          </div>
          <Link href="/san-pham" className="text-sm font-medium text-brand-700 hover:text-brand-800 flex items-center gap-1">
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {featured.map((p) => (
            <Link
              key={p.id}
              href={`/san-pham/${p.code}`}
              className="bg-white rounded-xl shadow-product hover:shadow-card transition-shadow overflow-hidden group"
            >
              <div className="aspect-square bg-gradient-to-br from-brand-50 to-gray-50 overflow-hidden">
                <img
                  src={productImageByType(p.productType)}
                  alt={p.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              </div>
              <div className="p-3">
                <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded ${
                  p.productType === "SUPPLEMENT"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-brand-100 text-brand-700"
                }`}>
                  {p.productType === "SUPPLEMENT" ? "TPCN" : "Thuốc"}
                </span>
                <h3 className="font-medium text-gray-900 text-sm mt-1.5 line-clamp-2 min-h-[2.5rem]">
                  {p.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{p.manufacturer ?? ""}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="font-bold text-brand-700">{fmtVND(p.price)}</p>
                  {p.inStock && <span className="text-[10px] text-emerald-600 font-medium">Còn hàng</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Doctors */}
      <section className="max-w-8xl mx-auto px-4 mt-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Đội ngũ bác sĩ</h2>
            <p className="text-sm text-gray-500 mt-1">Chuyên môn cao, tận tâm</p>
          </div>
          <Link href="/dat-lich" className="text-sm font-medium text-brand-700 flex items-center gap-1">
            Đặt lịch <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {doctors.map((d, i) => (
            <div key={d.id} className="bg-white rounded-xl shadow-product p-4 text-center hover:shadow-card transition">
              <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-3 ring-4 ring-brand-50">
                <img
                  src={d.user.avatarUrl ?? doctorAvatarByIndex(i)}
                  alt={d.user.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="font-semibold text-gray-900 text-sm">
                {d.title ?? "BS."} {d.user.fullName}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{d.specialty.name}</p>
              <p className="text-xs text-brand-700 mt-2">{d.yearsOfExp}+ năm kinh nghiệm</p>
            </div>
          ))}
        </div>
      </section>

      {/* Branches preview */}
      {branches.length > 0 && (
        <section className="bg-white mt-12 py-12">
          <div className="max-w-8xl mx-auto px-4">
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Hệ thống chi nhánh</h2>
                <p className="text-sm text-gray-500 mt-1">Tìm phòng khám gần bạn</p>
              </div>
              <Link href="/chi-nhanh" className="text-sm font-medium text-brand-700 flex items-center gap-1">
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {branches.map((b) => (
                <div key={b.id} className="border border-gray-100 rounded-xl overflow-hidden hover:border-brand-300 hover:shadow-card transition bg-white">
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={IMG.branchExterior}
                      alt={b.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-brand-700 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{b.name}</h3>
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{b.address}</p>
                        <a href={`tel:${b.phone}`} className="text-sm text-brand-700 mt-2 inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {b.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog */}
      {latestPosts.length > 0 && (
        <section className="max-w-8xl mx-auto px-4 mt-12">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Cẩm nang sức khỏe</h2>
              <p className="text-sm text-gray-500 mt-1">Bài viết & lời khuyên từ bác sĩ</p>
            </div>
            <Link href="/cam-nang" className="text-sm font-medium text-brand-700 flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {latestPosts.map((post) => (
              <Link
                key={post.id}
                href={`/cam-nang/${post.slug}`}
                className="bg-white rounded-xl shadow-product hover:shadow-card transition overflow-hidden group"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={post.coverImageUrl ?? blogCoverByTag(post.tag)}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-4">
                  {post.tag && <span className="inline-block px-2 py-0.5 bg-brand-50 text-brand-700 text-xs rounded">{post.tag}</span>}
                  <h3 className="font-semibold text-gray-900 mt-2 line-clamp-2 min-h-[3rem] group-hover:text-brand-700">
                    {post.title}
                  </h3>
                  {post.excerpt && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-8xl mx-auto px-4 my-12">
        <div className="bg-gradient-to-r from-brand-700 to-brand-500 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Đặt lịch khám online ngay hôm nay</h2>
          <p className="text-brand-100 mb-6 max-w-xl mx-auto">
            Đăng ký nhanh trong 2 phút, lễ tân sẽ liên hệ xác nhận giờ khám phù hợp với bạn.
          </p>
          <Link
            href="/dat-lich"
            className="inline-flex items-center gap-2 px-7 py-3 bg-white text-brand-700 hover:bg-brand-50 rounded-full font-semibold"
          >
            <CalendarDays className="w-5 h-5" /> Đặt lịch ngay
          </Link>
        </div>
      </section>
    </>
  );
}
