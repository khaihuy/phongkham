'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Save, ArrowLeft, Eye, Loader } from 'lucide-react';
import { toast } from 'sonner';

interface PostFormData {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  tag: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  seoTitle: string;
  seoDescription: string;
}

const EMPTY: PostFormData = {
  slug: '', title: '', excerpt: '', content: '', coverImageUrl: '',
  tag: '', status: 'DRAFT', seoTitle: '', seoDescription: '',
};

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

export default function PostForm({ initial, postId }: { initial?: Partial<PostFormData>; postId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<PostFormData>({ ...EMPTY, ...initial } as PostFormData);
  const [autoSlug, setAutoSlug] = useState(!postId); // Tạo mới → auto generate; sửa → giữ slug
  const isEdit = !!postId;

  const save = useMutation({
    mutationFn: async () => {
      const url = isEdit ? `/api/posts/${postId}` : '/api/posts';
      const method = isEdit ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
      toast.success(isEdit ? 'Đã cập nhật' : 'Đã tạo bài mới');
      router.push('/website/posts');
    },
    onError: (e: any) => toast.error(e.message),
  });

  function setField<K extends keyof PostFormData>(key: K, val: PostFormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function onTitleChange(v: string) {
    setField('title', v);
    if (autoSlug) setField('slug', slugify(v));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/website/posts" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <p className="text-sm text-gray-500">
            <Link href="/website/posts" className="hover:text-gray-700">Bài viết</Link> /{' '}
            <span className="text-gray-700">{isEdit ? 'Sửa' : 'Tạo mới'}</span>
          </p>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Sửa bài viết' : 'Bài viết mới'}</h1>
        </div>
        {isEdit && form.status === 'PUBLISHED' && (
          <a
            href={`/cam-nang/${form.slug}`}
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
              placeholder="VD: 5 cách phòng ngừa cảm cúm mùa lạnh"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
              Slug (URL: /cam-nang/<span className="text-sky-700 font-mono">{form.slug || 'tieu-de'}</span>)
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
              placeholder="Đoạn ngắn hiển thị ở danh sách bài viết..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung * <span className="text-gray-400 font-normal">(hỗ trợ HTML/Markdown đơn giản)</span>
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
                placeholder="Để trống dùng tiêu đề bài"
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
            <h3 className="font-semibold text-gray-900 text-sm">Trạng thái xuất bản</h3>
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
              {save.isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo bài viết'}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">Phân loại</h3>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tag</label>
              <select
                value={form.tag}
                onChange={(e) => setField('tag', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">— Không phân loại —</option>
                <option value="Thuốc">Thuốc</option>
                <option value="Bệnh thường gặp">Bệnh thường gặp</option>
                <option value="Sức khỏe">Sức khỏe</option>
                <option value="Mẹ &amp; Bé">Mẹ &amp; Bé</option>
                <option value="Dinh dưỡng">Dinh dưỡng</option>
                <option value="Tin tức">Tin tức</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ảnh bìa (URL)</label>
              <input
                type="url"
                value={form.coverImageUrl}
                onChange={(e) => setField('coverImageUrl', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {form.coverImageUrl && (
                <img src={form.coverImageUrl} alt="Cover" className="mt-2 w-full h-32 object-cover rounded-lg" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
