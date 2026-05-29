'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Newspaper,
  Sparkles,
  Settings as SettingsIcon,
  MessageSquare,
  ExternalLink,
  Globe,
  FileText,
  ArrowRight,
} from 'lucide-react';

export default function WebsiteHubPage() {
  const { data: postsMeta } = useQuery({
    queryKey: ['website-stats-posts'],
    queryFn: async () => {
      const r = await fetch('/api/posts?pageSize=1');
      return (await r.json()).meta;
    },
  });

  const { data: leadsCount } = useQuery({
    queryKey: ['website-stats-leads'],
    queryFn: async () => {
      const r = await fetch('/api/appointments?source=ONLINE&pageSize=1');
      const json = await r.json();
      return json.meta?.total ?? 0;
    },
  });

  const { data: featuredCount } = useQuery({
    queryKey: ['website-stats-featured'],
    queryFn: async () => {
      const r = await fetch('/api/drugs?pageSize=1');
      const json = await r.json();
      return json.meta?.total ?? 0;
    },
  });

  const cards = [
    {
      href: '/website/posts',
      icon: Newspaper,
      title: 'Bài viết Cẩm nang',
      desc: 'Tạo & xuất bản bài viết sức khỏe',
      stat: postsMeta?.total ?? '—',
      statLabel: 'bài viết',
      color: 'bg-sky-50 text-sky-700 border-sky-100',
    },
    {
      href: '/website/featured',
      icon: Sparkles,
      title: 'Sản phẩm nổi bật',
      desc: 'Chọn thuốc/TPCN hiển thị trên trang chủ',
      stat: featuredCount ?? '—',
      statLabel: 'sản phẩm',
      color: 'bg-purple-50 text-purple-700 border-purple-100',
    },
    {
      href: '/website/pages',
      icon: FileText,
      title: 'Trang nội dung & Footer',
      desc: 'Giới thiệu, FAQ, điều khoản, bảo mật — mục chân trang',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    },
    {
      href: '/website/settings',
      icon: SettingsIcon,
      title: 'Cấu hình website',
      desc: 'Hero, hotline, banner promo, social media',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      href: '/website/leads',
      icon: MessageSquare,
      title: 'Đặt lịch online',
      desc: 'Lead khách hàng đặt qua website',
      stat: leadsCount ?? '—',
      statLabel: 'lượt',
      color: 'bg-orange-50 text-orange-700 border-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Website</h1>
          <p className="text-sm text-gray-500 mt-1">
            CMS cho website công khai · Đồng bộ với CRM nội bộ (bác sĩ, thuốc, lịch hẹn)
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          <Globe className="w-4 h-4" /> Xem website <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className={`p-5 border rounded-xl bg-white hover:shadow-card transition group`}
            >
              <div className="flex items-start justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-700 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-semibold text-gray-900 mt-3">{c.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
              {c.stat !== undefined && (
                <p className="text-xs text-gray-400 mt-3">
                  <strong className="text-gray-700">{c.stat}</strong> {c.statLabel}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
        <p className="font-semibold text-blue-900 mb-1">🔄 Đồng bộ tự động với CRM nội bộ</p>
        <ul className="text-blue-800 space-y-0.5">
          <li>• <strong>Bác sĩ trang public</strong> đọc từ bảng <code className="bg-white px-1 rounded">Doctor</code> · cập nhật từ <Link href="/doctors" className="underline">Doctor admin</Link></li>
          <li>• <strong>Thuốc & TPCN trang public</strong> đọc từ bảng <code className="bg-white px-1 rounded">Drug</code> · quản lý tại <Link href="/pharmacy" className="underline">Pharmacy admin</Link></li>
          <li>• <strong>Chi nhánh</strong> đọc từ bảng <code className="bg-white px-1 rounded">Branch</code></li>
          <li>• <strong>Đặt lịch online</strong> tạo bản ghi <code className="bg-white px-1 rounded">Appointment</code> status=PENDING, source=ONLINE · hiển thị ở <Link href="/appointments" className="underline">Lịch hẹn admin</Link></li>
        </ul>
      </div>
    </div>
  );
}
