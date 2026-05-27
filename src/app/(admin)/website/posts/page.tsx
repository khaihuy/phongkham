'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Newspaper, Search, Loader, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  DRAFT:     { label: 'Nháp',         cls: 'bg-gray-100 text-gray-600' },
  PUBLISHED: { label: 'Đã xuất bản',  cls: 'bg-green-100 text-green-700' },
  ARCHIVED:  { label: 'Lưu trữ',      cls: 'bg-amber-100 text-amber-700' },
};

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

export default function PostsListPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['posts', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const r = await fetch(`/api/posts?${params}`);
      return await r.json();
    },
  });

  const delMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.error ?? 'Xóa thất bại');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Đã xóa bài viết');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const posts = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            <Link href="/website" className="hover:text-gray-700">Quản lý Website</Link> /{' '}
            <span className="text-gray-700">Bài viết</span>
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Bài viết Cẩm nang</h1>
        </div>
        <Link
          href="/website/posts/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium"
        >
          <Plus className="w-4 h-4" /> Bài viết mới
        </Link>
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
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Newspaper className="w-12 h-12 mx-auto opacity-30 mb-2" />
            <p>Chưa có bài viết nào</p>
            <Link href="/website/posts/new" className="text-sm text-sky-600 mt-2 inline-block">Tạo bài đầu tiên →</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500 font-medium">
                <th className="px-4 py-2">Tiêu đề</th>
                <th className="px-4 py-2">Tag</th>
                <th className="px-4 py-2">Tác giả</th>
                <th className="px-4 py-2">Trạng thái</th>
                <th className="px-4 py-2">Xuất bản</th>
                <th className="px-4 py-2 text-center">Lượt xem</th>
                <th className="px-4 py-2 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/website/posts/${p.id}`} className="font-medium text-gray-900 hover:text-sky-700 block">
                      {p.title}
                    </Link>
                    <p className="text-xs text-gray-400 font-mono">/{p.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.tag && <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-xs rounded">{p.tag}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.author?.fullName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[p.status]?.cls}`}>
                      {STATUS_BADGE[p.status]?.label ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(p.publishedAt)}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{p.viewCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {p.status === 'PUBLISHED' && (
                        <a
                          href={`/cam-nang/${p.slug}`}
                          target="_blank"
                          className="p-1.5 text-gray-400 hover:text-sky-700"
                          title="Xem trên website"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <Link
                        href={`/website/posts/${p.id}`}
                        className="p-1.5 text-gray-400 hover:text-gray-900"
                        title="Sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(`Xóa bài "${p.title}"?`)) delMutation.mutate(p.id);
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
