'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, FileText, Search, Loader, ExternalLink, Edit2, Trash2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  DRAFT:     { label: 'Nháp',         cls: 'bg-gray-100 text-gray-600' },
  PUBLISHED: { label: 'Đã xuất bản',  cls: 'bg-green-100 text-green-700' },
  ARCHIVED:  { label: 'Lưu trữ',      cls: 'bg-amber-100 text-amber-700' },
};

const FOOTER_LABEL: Record<string, string> = {
  SUPPORT: 'Hỗ trợ khách hàng',
  ABOUT: 'Về chúng tôi',
  LEGAL: 'Pháp lý',
};

export default function SitePagesListPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['site-pages', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const r = await fetch(`/api/site-pages?${params}`);
      return await r.json();
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/admin/seed-pages', { method: 'POST' });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.error ?? 'Tạo nội dung mẫu thất bại');
      }
      return (await r.json()).data;
    },
    onSuccess: (d: any) => {
      qc.invalidateQueries({ queryKey: ['site-pages'] });
      toast.success(`Đã tạo/đảm bảo ${d?.pages ?? ''} trang nội dung mẫu`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const delMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/site-pages/${id}`, { method: 'DELETE' });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.error ?? 'Xóa thất bại');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site-pages'] });
      toast.success('Đã xóa trang');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const pages = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            <Link href="/website" className="hover:text-gray-700">Quản lý Website</Link> /{' '}
            <span className="text-gray-700">Trang nội dung</span>
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Trang nội dung & Footer</h1>
          <p className="text-sm text-gray-500 mt-1">
            Giới thiệu, Câu hỏi thường gặp, Điều khoản, Bảo mật... — hiển thị ở chân trang website.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm('Tạo các trang nội dung footer mẫu (Giới thiệu, FAQ, Điều khoản...)? Trang đã có sẽ được giữ nguyên.')) {
                seedMutation.mutate();
              }
            }}
            disabled={seedMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {seedMutation.isPending ? <Loader className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Tạo nội dung mẫu
          </button>
          <Link
            href="/website/pages/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium"
          >
            <Plus className="w-4 h-4" /> Trang mới
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm theo tiêu đề, slug..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Nháp</option>
          <option value="PUBLISHED">Đã xuất bản</option>
          <option value="ARCHIVED">Lưu trữ</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin text-sky-600" /></div>
        ) : pages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-12 h-12 mx-auto opacity-30 mb-2" />
            <p>Chưa có trang nội dung nào</p>
            <Link href="/website/pages/new" className="text-sm text-sky-600 mt-2 inline-block">Tạo trang đầu tiên →</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500 font-medium">
                <th className="px-4 py-2">Tiêu đề</th>
                <th className="px-4 py-2">Cột footer</th>
                <th className="px-4 py-2">Trạng thái</th>
                <th className="px-4 py-2 text-center">Thứ tự</th>
                <th className="px-4 py-2 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pages.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/website/pages/${p.id}`} className="font-medium text-gray-900 hover:text-sky-700 block">
                      {p.title}
                    </Link>
                    <p className="text-xs text-gray-400 font-mono">{p.linkUrl || `/${p.slug}`}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.footerGroup
                      ? <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-xs rounded">{FOOTER_LABEL[p.footerGroup] ?? p.footerGroup}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[p.status]?.cls}`}>
                      {STATUS_BADGE[p.status]?.label ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{p.sortOrder}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {p.status === 'PUBLISHED' && !p.linkUrl && (
                        <a
                          href={`/${p.slug}`}
                          target="_blank"
                          className="p-1.5 text-gray-400 hover:text-sky-700"
                          title="Xem trên website"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <Link
                        href={`/website/pages/${p.id}`}
                        className="p-1.5 text-gray-400 hover:text-gray-900"
                        title="Sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(`Xóa trang "${p.title}"?`)) delMutation.mutate(p.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center gap-2 justify-center">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Trước</button>
          <span className="text-sm text-gray-600 px-3">Trang {meta.page}/{meta.totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Sau</button>
        </div>
      )}
    </div>
  );
}
