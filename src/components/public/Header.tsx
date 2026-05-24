"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Phone, ShoppingCart, User, MapPin, Menu, X, ChevronDown } from "lucide-react";
import MegaMenu from "./MegaMenu";

const NAV = [
  { href: "/dat-lich", label: "Đặt lịch khám" },
  { href: "/san-pham", label: "Thuốc & TPCN" },
  { href: "/chi-nhanh", label: "Chi nhánh" },
  { href: "/cam-nang", label: "Cẩm nang" },
];

export default function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Promo bar */}
      <div className="hidden md:block bg-brand-600 text-white text-xs">
        <div className="max-w-8xl mx-auto px-4 py-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Phone className="w-3 h-3" /> Hotline 24/7:{" "}
            <strong>1800 6928</strong>
          </span>
          <div className="flex items-center gap-4 text-white/90">
            <Link href="/tra-cuu-don" className="hover:text-white">Tra cứu đơn</Link>
            <Link href="/uu-dai" className="hover:text-white">Ưu đãi</Link>
            <Link href="/he-thong" className="hover:text-white">Hệ thống chi nhánh</Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="max-w-8xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              AK
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-brand-700 text-lg leading-tight">An Khang</p>
              <p className="text-[10px] text-gray-500 leading-tight">Phòng khám đa khoa</p>
            </div>
          </Link>

          {/* Search */}
          <form
            action="/san-pham"
            method="GET"
            className="flex-1 max-w-2xl"
          >
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm thuốc, dịch vụ, bác sĩ..."
                className="w-full pl-10 pr-20 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-sm"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-sm font-medium"
              >
                Tìm
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/chi-nhanh"
              className="flex items-center gap-1.5 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700"
            >
              <MapPin className="w-4 h-4 text-brand-600" /> Chi nhánh
            </Link>
            <Link
              href="/gio-hang"
              className="flex items-center gap-1.5 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 relative"
            >
              <ShoppingCart className="w-4 h-4 text-brand-600" /> Giỏ hàng
            </Link>
            <Link
              href="/tai-khoan"
              className="flex items-center gap-1.5 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700"
            >
              <User className="w-4 h-4 text-brand-600" /> Tài khoản
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
          <MegaMenu />
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-brand-700 hover:bg-brand-50 rounded-lg"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/dat-lich"
            className="ml-auto px-4 py-1.5 bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold rounded-full"
          >
            Đặt lịch ngay
          </Link>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="px-4 py-3 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-gray-700 hover:text-brand-700"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/dat-lich"
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-accent-600 font-semibold"
            >
              ⭐ Đặt lịch ngay
            </Link>
            <div className="border-t border-gray-100 pt-2 space-y-1">
              <Link href="/tai-khoan" className="block py-2 text-gray-700">
                <User className="inline w-4 h-4 mr-2" /> Tài khoản
              </Link>
              <Link href="/gio-hang" className="block py-2 text-gray-700">
                <ShoppingCart className="inline w-4 h-4 mr-2" /> Giỏ hàng
              </Link>
              <Link href="/chi-nhanh" className="block py-2 text-gray-700">
                <MapPin className="inline w-4 h-4 mr-2" /> Chi nhánh
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
