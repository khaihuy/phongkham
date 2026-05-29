"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Pill, ChevronDown, Stethoscope, HeartPulse, Baby, Sparkles, Tag,
  ShoppingBag, Star, Zap, Heart, Shield, Activity,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Stethoscope, Pill, HeartPulse, Baby, Sparkles, Tag,
  ShoppingBag, Star, Zap, Heart, Shield, Activity,
};

const FALLBACK_CATEGORIES = [
  {
    id: "1", title: "Khám & Chữa bệnh", icon: "Stethoscope",
    items: [
      { id: "1", label: "Khám tổng quát", href: "/danh-muc/kham-tong-quat" },
      { id: "2", label: "Khám chuyên khoa", href: "/danh-muc/chuyen-khoa" },
      { id: "3", label: "Khám online", href: "/danh-muc/kham-online" },
      { id: "4", label: "Tiêm chủng", href: "/danh-muc/tiem-chung" },
    ],
  },
  {
    id: "2", title: "Thuốc", icon: "Pill",
    items: [
      { id: "5", label: "Thuốc kê đơn", href: "/san-pham?productType=DRUG&requirePrescription=true" },
      { id: "6", label: "Thuốc không kê đơn", href: "/san-pham?productType=DRUG&requirePrescription=false" },
      { id: "7", label: "Tất cả thuốc", href: "/san-pham?productType=DRUG" },
    ],
  },
  {
    id: "3", title: "Thực phẩm chức năng", icon: "HeartPulse",
    items: [
      { id: "8", label: "Vitamin & khoáng chất", href: "/san-pham?productType=SUPPLEMENT&category=vitamin" },
      { id: "9", label: "Tăng cường miễn dịch", href: "/san-pham?productType=SUPPLEMENT" },
      { id: "10", label: "Tất cả TPCN", href: "/san-pham?productType=SUPPLEMENT" },
    ],
  },
  {
    id: "4", title: "Mẹ & Bé", icon: "Baby",
    items: [
      { id: "11", label: "Khám nhi", href: "/danh-muc/nhi" },
      { id: "12", label: "Tư vấn sản khoa", href: "/danh-muc/san-khoa" },
      { id: "13", label: "Vitamin cho mẹ", href: "/san-pham?category=me-be" },
    ],
  },
  {
    id: "5", title: "Chăm sóc cá nhân", icon: "Sparkles",
    items: [
      { id: "14", label: "Dụng cụ y tế", href: "/san-pham?category=dung-cu" },
      { id: "15", label: "Chăm sóc da", href: "/san-pham?category=da" },
    ],
  },
  {
    id: "6", title: "Khuyến mãi", icon: "Tag",
    items: [
      { id: "16", label: "Ưu đãi tuần", href: "/uu-dai" },
      { id: "17", label: "Combo tiết kiệm", href: "/combo" },
    ],
  },
];

export default function MegaMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: categories } = useQuery({
    queryKey: ["nav-menu"],
    queryFn: async () => {
      const r = await fetch("/api/public/nav-menu");
      if (!r.ok) return null;
      const json = await r.json();
      return json.data?.length ? json.data : null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const menu = categories ?? FALLBACK_CATEGORIES;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg"
      >
        <Pill className="w-4 h-4" /> Danh mục
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-[640px] bg-white shadow-xl rounded-xl border border-gray-100 p-4 grid grid-cols-3 gap-4 z-50">
          {menu.map((cat: any) => {
            const Icon = ICON_MAP[cat.icon] ?? Tag;
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-100">
                  <Icon className="w-4 h-4 text-brand-600" />
                  <h3 className="font-semibold text-sm text-gray-900">{cat.title}</h3>
                </div>
                <ul className="space-y-1">
                  {cat.items.map((item: any) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block py-1 text-sm text-gray-600 hover:text-brand-700"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
