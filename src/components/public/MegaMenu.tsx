"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Pill, ChevronDown, Stethoscope, HeartPulse, Baby, Sparkles, Tag } from "lucide-react";

const CATEGORIES = [
  {
    title: "Khám & Chữa bệnh",
    icon: Stethoscope,
    items: [
      { label: "Khám tổng quát", href: "/danh-muc/kham-tong-quat" },
      { label: "Khám chuyên khoa", href: "/danh-muc/chuyen-khoa" },
      { label: "Khám online", href: "/danh-muc/kham-online" },
      { label: "Tiêm chủng", href: "/danh-muc/tiem-chung" },
    ],
  },
  {
    title: "Thuốc",
    icon: Pill,
    items: [
      { label: "Thuốc kê đơn", href: "/san-pham?productType=DRUG&requirePrescription=true" },
      { label: "Thuốc không kê đơn", href: "/san-pham?productType=DRUG&requirePrescription=false" },
      { label: "Tất cả thuốc", href: "/san-pham?productType=DRUG" },
    ],
  },
  {
    title: "Thực phẩm chức năng",
    icon: HeartPulse,
    items: [
      { label: "Vitamin & khoáng chất", href: "/san-pham?productType=SUPPLEMENT&category=vitamin" },
      { label: "Tăng cường miễn dịch", href: "/san-pham?productType=SUPPLEMENT" },
      { label: "Tất cả TPCN", href: "/san-pham?productType=SUPPLEMENT" },
    ],
  },
  {
    title: "Mẹ & Bé",
    icon: Baby,
    items: [
      { label: "Khám nhi", href: "/danh-muc/nhi" },
      { label: "Tư vấn sản khoa", href: "/danh-muc/san-khoa" },
      { label: "Vitamin cho mẹ", href: "/san-pham?category=me-be" },
    ],
  },
  {
    title: "Chăm sóc cá nhân",
    icon: Sparkles,
    items: [
      { label: "Dụng cụ y tế", href: "/san-pham?category=dung-cu" },
      { label: "Chăm sóc da", href: "/san-pham?category=da" },
    ],
  },
  {
    title: "Khuyến mãi",
    icon: Tag,
    items: [
      { label: "Ưu đãi tuần", href: "/uu-dai" },
      { label: "Combo tiết kiệm", href: "/combo" },
    ],
  },
];

export default function MegaMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.title}>
                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-100">
                  <Icon className="w-4 h-4 text-brand-600" />
                  <h3 className="font-semibold text-sm text-gray-900">{cat.title}</h3>
                </div>
                <ul className="space-y-1">
                  {cat.items.map((item) => (
                    <li key={item.href}>
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
