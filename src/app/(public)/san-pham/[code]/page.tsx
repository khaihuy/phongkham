import { prisma } from "@/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Pill, ArrowLeft, ShoppingCart, ShieldAlert, Package } from "lucide-react";
import { productImageByType } from "@/lib/public-images";

export const dynamic = "force-dynamic";

function fmtVND(n: number | null) {
  if (!n) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

export default async function ProductDetailPage({ params }: { params: { code: string } }) {
  const drug = await prisma.drug.findUnique({
    where: { code: params.code },
    select: {
      id: true,
      code: true,
      name: true,
      genericName: true,
      brandName: true,
      unit: true,
      strength: true,
      form: true,
      manufacturer: true,
      countryOfOrigin: true,
      registrationNo: true,
      requirePrescription: true,
      productType: true,
      isActive: true,
      category: { select: { name: true } },
      inventory: {
        orderBy: { createdAt: "desc" },
        select: { quantity: true, sellPrice: true, expiryDate: true },
        take: 1,
      },
    },
  });

  if (!drug || !drug.isActive) notFound();

  const price = drug.inventory[0]?.sellPrice ? Number(drug.inventory[0].sellPrice) : null;
  const inStock = (drug.inventory[0]?.quantity ?? 0) > 0;
  const isSupp = drug.productType === "SUPPLEMENT";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Link href="/san-pham" className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Tất cả sản phẩm
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="bg-white rounded-2xl shadow-product overflow-hidden aspect-square">
          <img
            src={productImageByType(drug.productType)}
            alt={drug.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${
                isSupp ? "bg-emerald-100 text-emerald-700" : "bg-brand-100 text-brand-700"
              }`}
            >
              {isSupp ? "🌿 Thực phẩm chức năng" : "💊 Thuốc"}
            </span>
            {drug.requirePrescription && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-medium">
                Cần kê đơn
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {drug.name}
          </h1>
          {drug.genericName && (
            <p className="text-gray-500 mt-1">Hoạt chất: {drug.genericName}</p>
          )}

          <div className="mt-5 p-4 bg-gray-50 rounded-xl">
            <p className="text-3xl font-bold text-brand-700">{fmtVND(price)}</p>
            <p className="text-xs text-gray-500 mt-1">
              / {drug.unit?.toLowerCase()} · {drug.strength ?? "—"}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500">Hãng sản xuất</p>
              <p className="font-medium">{drug.manufacturer ?? "—"}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500">Xuất xứ</p>
              <p className="font-medium">{drug.countryOfOrigin ?? "—"}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500">Số đăng ký</p>
              <p className="font-medium font-mono text-xs">{drug.registrationNo ?? "—"}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500">Nhóm</p>
              <p className="font-medium">{drug.category.name}</p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 flex gap-3">
            {inStock ? (
              <button className="flex-1 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Chọn mua
              </button>
            ) : (
              <button disabled className="flex-1 py-3 bg-gray-100 text-gray-400 rounded-xl font-semibold">
                Tạm hết hàng
              </button>
            )}
            <Link
              href="/dat-lich"
              className="px-5 py-3 border-2 border-brand-600 text-brand-700 hover:bg-brand-50 rounded-xl font-semibold"
            >
              Tư vấn
            </Link>
          </div>

          {inStock && (
            <p className="mt-3 text-xs text-emerald-600 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> Còn hàng · Giao hàng 1-2 ngày
            </p>
          )}

          {drug.requirePrescription && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-sm text-amber-900">
              <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Đây là thuốc kê đơn. Vui lòng có toa của bác sĩ hoặc{" "}
                <Link href="/dat-lich" className="underline font-medium">đặt lịch tư vấn</Link>{" "}
                trước khi mua.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
