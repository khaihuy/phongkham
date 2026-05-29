'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Save, ArrowLeft, Eye, Loader } from 'lucide-react';
import { toast } from 'sonner';

type FooterGroup = '' | 'SUPPORT' | 'ABOUT' | 'LEGAL';

interface SitePageFormData {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  footerGroup: FooterGroup;
  footerLabel: string;
  linkUrl: string;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
}

const EMPTY: SitePageFormData = {
  slug: '', title: '', excerpt: '', content: '', status: 'PUBLISHED',
  footerGroup: '', footerLabel: '', linkUrl: '', sortOrder: 0,
  seoTitle: '', seoDescription: '',
};

const FOOTER_GROUPS: { val: FooterGroup; label: string }[] = [
  { val: '', label: '— Không hiện ở footer —' },
  { val: 'SUPPORT', label: 'Hỗ trợ khách hàng' },
  { val: 'ABOUT', label: 'Về chúng tôi' },
  { val: 'LEGAL', label: 'Pháp lý' },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function SitePageForm({ initial, pageId }: { initial?: Partial<SitePageFormData>; pageId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<SitePageFormData>({ ...EMPTY, ...initial } as SitePageFormData);
  const [autoSlug, setAutoSlug] = useState(!pageId);
  const isEdit = !!pageId;

  const save = useMutation({
    mutationFn: async () => {
      const url = isEdit ? `/api/site-pages/${pageId}` : '/api/site-pages';
      const method = isEdit ? 'PUT' : 'POST';
      const payload = { ...form, footerGroup: form.footerGroup || null };
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const e = await r.json();
        const detail = Array.isArray(e.details)
          ? e.details.map((d: any) => `${d.field}: ${d.message}`).join('; ')
          : null;
        throw new Error(detail || e.error || 'Lưu thất bại');
      }
      return (await r.json()).data;
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật' : 'Đã tạo trang mới');
      router.push('/website/pages');
    },
    onError: (e: any) => toast.error(e.message),
  });

  function setField<K extends keyof SitePageFormData>(key: K, val: SitePageFormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function onTitleChange(v: string) {
    setField('title', v);
    if (autoSlug) setField('slug', slugify(v));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/website/pages" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <p className="text-sm text-gray-500">
            <Link href="/website/pages" className="hover:text-gray-700">Trang nội dung</Link> /{' '}
            <span className="text-gray-700">{isEdit ? 'Sửa' : 'Tạo mới'}</span>
          </p>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Sửa trang' : 'Trang mới'}</h1>
        </div>
        {isEdit && form.status === 'PUBLISHED' && !form.linkUrl && (
          <a
            href={`/${form.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" /> Xem
          </a>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="VD: Giới thiệu, Câu hỏi thường gặp, Điều khoản sử dụng..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
              Slug (URL: /<span className="text-sky-700 font-mono">{form.slug || 'tieu-de'}</span>)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.slug}
                onChange={(e) => { setField('slug', e.target.value); setAutoSlug(false); }}
                placeholder="tu-dong-tu-tieu-de"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {!autoSlug && (
                <button
                  type="button"
                  onClick={() => { setField('slug', slugify(form.title)); setAutoSlug(true); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-xs hover:bg-gray-50"
                >
                  Auto từ tiêu đề
                </button>
              )}
            </div>

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
              Tóm tắt <span className="text-gray-400 font-normal">(không bắt buộc)</span>
            </label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setField('excerpt', e.target.value)}
              rows={2}
              placeholder="Đoạn mô tả ngắn hiển thị đầu trang..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung * <span className="text-gray-400 font-normal">(hỗ trợ HTML)</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setField('content', e.target.value)}
              rows={18}
              placeholder={`<h2>Tiêu đề phụ</h2>\n<p>Đoạn văn...</p>\n<ul><li>Mục 1</li><li>Mục 2</li></ul>`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="text-xs text-gray-400 mt-2">
              Tip: dùng thẻ <code className="bg-gray-100 px-1 rounded">&lt;h2&gt;</code>,{' '}
              <code className="bg-gray-100 px-1 rounded">&lt;p&gt;</code>,{' '}
              <code className="bg-gray-100 px-1 rounded">&lt;ul&gt;</code>,{' '}
              <code className="bg-gray-100 px-1 rounded">&lt;strong&gt;</code> cho định dạng cơ bản.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">SEO</h3>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tiêu đề SEO</label>
              <input
                type="text"
                value={form.seoTitle}
                onChange={(e) => setField('seoTitle', e.target.value)}
                placeholder="Để trống dùng tiêu đề trang"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mô tả SEO</label>
              <textarea
                value={form.seoDescription}
                onChange={(e) => setField('seoDescription', e.target.value)}
                rows={2}
                placeholder="160 ký tự cho meta description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">Trạng thái</h3>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              {[
                { val: 'DRAFT', label: 'Nháp' },
                { val: 'PUBLISHED', label: 'Xuất bản' },
                { val: 'ARCHIVED', label: 'Lưu trữ' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setField('status', opt.val as any)}
                  className={`flex-1 px-2 py-1.5 text-xs rounded-md font-medium transition ${
                    form.status === opt.val ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center gap-2"
            >
              {save.isPending ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {save.isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo trang'}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">Hiển thị ở Footer</h3>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cột footer</label>
              <select
                value={form.footerGroup}
                onChange={(e) => setField('footerGroup', e.target.value as FooterGroup)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {FOOTER_GROUPS.map((g) => (
                  <option key={g.val} value={g.val}>{g.label}</option>
                ))}
              </select>
            </div>
            {form.footerGroup && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nhãn footer <span className="text-gray-400 font-normal">(mặc định = tiêu đề)</span>
                  </label>
                  <input
                    type="text"
                    value={form.footerLabel}
                    onChange={(e) => setField('footerLabel', e.target.value)}
                    placeholder={form.title || 'Nhãn ngắn gọn'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Link tuỳ chỉnh <span className="text-gray-400 font-normal">(để trống = /{form.slug || 'slug'})</span>
                  </label>
                  <input
                    type="text"
                    value={form.linkUrl}
                    onChange={(e) => setField('linkUrl', e.target.value)}
                    placeholder="VD: /dat-lich, /chi-nhanh"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Dùng khi mục footer trỏ tới trang chức năng có sẵn (đặt lịch, chi nhánh...).
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Thứ tự</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setField('sortOrder', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
