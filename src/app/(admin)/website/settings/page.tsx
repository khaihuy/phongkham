'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Save, Loader, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function SiteSettingsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const r = await fetch('/api/site-settings');
      return (await r.json()).data;
    },
  });

  const [form, setForm] = useState<any>({
    heroTitle: '', heroSubtitle: '', heroCtaText: '', heroCtaUrl: '',
    hotline: '', promoBannerText: '', promoBannerUrl: '',
    facebookUrl: '', youtubeUrl: '', zaloUrl: '',
    seoTitle: '', seoDescription: '',
  });

  useEffect(() => {
    if (data) {
      setForm({
        heroTitle: data.heroTitle ?? '',
        heroSubtitle: data.heroSubtitle ?? '',
        heroCtaText: data.heroCtaText ?? '',
        heroCtaUrl: data.heroCtaUrl ?? '',
        hotline: data.hotline ?? '',
        promoBannerText: data.promoBannerText ?? '',
        promoBannerUrl: data.promoBannerUrl ?? '',
        facebookUrl: data.facebookUrl ?? '',
        youtubeUrl: data.youtubeUrl ?? '',
        zaloUrl: data.zaloUrl ?? '',
        seoTitle: data.seoTitle ?? '',
        seoDescription: data.seoDescription ?? '',
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.error ?? 'Lưu thất bại');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Đã lưu cấu hình website');
    },
    onError: (e: any) => toast.error(e.message),
  });

  function f(key: string, val: string) {
    setForm((prev: any) => ({ ...prev, [key]: val }));
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin text-sky-600" /></div>;
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500';

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            <Link href="/website" className="hover:text-gray-700">Quản lý Website</Link> /{' '}
            <span className="text-gray-700">Cấu hình</span>
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Cấu hình website công khai</h1>
        </div>
        <a href="/" target="_blank" className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          <Globe className="w-4 h-4" /> Xem trước
        </a>
      </div>

      {/* Hero */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Hero (banner trang chủ)</h2>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tiêu đề chính</label>
          <input value={form.heroTitle} onChange={(e) => f('heroTitle', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Phụ đề</label>
          <textarea value={form.heroSubtitle} onChange={(e) => f('heroSubtitle', e.target.value)} rows={2} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nút CTA (text)</label>
            <input value={form.heroCtaText} onChange={(e) => f('heroCtaText', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nút CTA (URL)</label>
            <input value={form.heroCtaUrl} onChange={(e) => f('heroCtaUrl', e.target.value)} placeholder="/dat-lich" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Promo banner */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Banner khuyến mãi</h2>
        <p className="text-xs text-gray-500">Hiển thị thanh nhỏ phía trên header (chỉ khi có nội dung)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Text banner</label>
            <input value={form.promoBannerText} onChange={(e) => f('promoBannerText', e.target.value)}
              placeholder="VD: Giảm 20% tất cả vaccine cho trẻ trong tháng 6" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Link (URL)</label>
            <input value={form.promoBannerUrl} onChange={(e) => f('promoBannerUrl', e.target.value)} placeholder="/uu-dai" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Contact + Social */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Liên hệ & Mạng xã hội</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Hotline (hiển thị trên header)</label>
            <input value={form.hotline} onChange={(e) => f('hotline', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Facebook URL</label>
            <input value={form.facebookUrl} onChange={(e) => f('facebookUrl', e.target.value)} placeholder="https://facebook.com/..." className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">YouTube URL</label>
            <input value={form.youtubeUrl} onChange={(e) => f('youtubeUrl', e.target.value)} placeholder="https://youtube.com/..." className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Zalo OA URL</label>
            <input value={form.zaloUrl} onChange={(e) => f('zaloUrl', e.target.value)} placeholder="https://zalo.me/..." className={inputCls} />
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">SEO mặc định</h2>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tiêu đề SEO (cho các trang không có riêng)</label>
          <input value={form.seoTitle} onChange={(e) => f('seoTitle', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Mô tả SEO</label>
          <textarea value={form.seoDescription} onChange={(e) => f('seoDescription', e.target.value)} rows={2} className={inputCls} />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="flex items-center gap-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
        >
          {save.isPending ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Lưu cấu hình
        </button>
      </div>
    </div>
  );
}
