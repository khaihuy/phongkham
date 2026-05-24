"use client";

import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Pill, Search, Loader, ShoppingCart } from "lucide-react";

function fmtVND(n: number | null) {
  if (!n) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function CatalogInner() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("productType") || "";
  const initialSearch = searchParams.get("search") || "";

  const [productType, setProductType] = useState<string>(initialType);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["public-catalog", page, search, productType],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (search) params.set("search", search);
      if (productType) params.set("productType", productType);
      const r = await fetch(`/api/public/drugs?${params}`);
      return await r.json();
    },
  });

  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="max-w-8xl mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
        Thuốc & Thực phẩm chức năng
      </h1>
      <p className="text-gray-500 mb-6 text-sm">
        {meta?.total ?? 0} sản phẩm
      </p>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center mb-6">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm thuốc, hoạt chất, thương hiệu..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 p-1 rounded-full">
          {[
            { val: "", label: "Tất cả" },
            { val: "DRUG", label: "💊 Thuốc" },
            { val: "SUPPLEMENT", label: "🌿 TPCN" },
          ].map((t) => (
            <button
              key={t.val}
              onClick={() => {
                setProductType(t.val);
                setPage(1);
              }}
              className={`px-4 py-1.5 text-sm rounded-full font-medium transition ${
                productType === t.val
                  ? "bg-brand-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Pill className="w-12 h-12 mx-auto opacity-30 mb-3" />
          <p>Không tìm thấy sản phẩm phù hợp</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {items.map((p: any) => (
            <Link
              key={p.id}
              href={`/san-pham/${p.code}`}
              className="bg-white rounded-xl shadow-product hover:shadow-card transition-shadow overflow-hidden group"
            >
              <div className="aspect-square bg-gradient-to-br from-brand-50 to-gray-50 flex items-center justify-center relative">
                <Pill className="w-16 h-16 text-brand-300 group-hover:scale-110 transition-transform" />
                {p.requirePrescription && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded font-medium">
                    Kê đơn
                  </span>
                )}
              </div>
              <div className="p-3">
                <span
                  className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded ${
                    p.productType === "SUPPLEMENT"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-brand-100 text-brand-700"
                  }`}
                >
                  {p.productType === "SUPPLEMENT" ? "🌿 TPCN" : "💊 Thuốc"}
                </span>
                <h3 className="font-medium text-gray-900 text-sm mt-1.5 line-clamp-2 min-h-[2.5rem]">
                  {p.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {p.strength ? `${p.strength} · ` : ""}{p.manufacturer ?? ""}
                </p>
                <div className="mt-2">
                  <p className="font-bold text-brand-700">{fmtVND(p.price)}</p>
                  <p className="text-[10px] text-gray-500">{p.unit?.toLowerCase()}</p>
                </div>
                {p.inStock ? (
                  <button className="w-full mt-2 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1">
                    <ShoppingCart className="w-3.5 h-3.5" /> Chọn mua
                  </button>
                ) : (
                  <button disabled className="w-full mt-2 px-3 py-1.5 bg-gray-100 text-gray-400 text-xs rounded-lg">
                    Hết hàng
                  </button>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Trước
          </button>
          <span className="text-sm text-gray-600 px-3">
            Trang {meta.page}/{meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <Loader className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    }>
      <CatalogInner />
    </Suspense>
  );
}
