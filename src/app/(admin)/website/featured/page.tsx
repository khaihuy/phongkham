'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, Loader, Star, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

export default function FeaturedPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false);
  const [productType, setProductType] = useState<'' | 'DRUG' | 'SUPPLEMENT'>('');

  const { data, isLoading } = useQuery({
    queryKey: ['drugs-for-featured', search, productType],
    queryFn: async () => {
      const params = new URLSearchParams({ pageSize: '100' });
      if (search) params.set('search', search);
      if (productType) params.set('productType', productType);
      const r = await fetch(`/api/drugs?${params}`);
      return (await r.json()).data ?? [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: any }) => {
      const r = await fetch(`/api/drugs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.error ?? 'Cập nhật thất bại');
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drugs-for-featured'] }),
    onError: (e: any) => toast.error(e.message),
  });

  const drugs: any[] = data ?? [];
  const filtered = showOnlyFeatured ? drugs.filter((d) => d.isFeatured) : drugs;
  const featuredCount = drugs.filter((d) => d.isFeatured).length;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-gray-500">
          <Link href="/website" className="hover:text-gray-700">Quản lý Website</Link> /{' '}
          <span className="text-gray-700">Sản phẩm nổi bật</span>
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Sản phẩm nổi bật trên trang chủ</h1>
        <p className="text-sm text-gray-500 mt-1">
          Đã chọn <strong className="text-purple-700">{featuredCount}</strong> sản phẩm · Hiển thị tối đa 8 sản phẩm theo thứ tự ưu tiên cao nhất
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <select
          value={productType}
          onChange={(e) => setProductType(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Tất cả loại</option>
          <option value="DRUG">💊 Thuốc</option>
          <option value="SUPPLEMENT">🌿 TPCN</option>
        </select>
        <label className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyFeatured}
            onChange={(e) => setShowOnlyFeatured(e.target.checked)}
            className="rounded"
          />
          Chỉ xem đã chọn
        </label>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin text-sky-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500 font-medium">
                <th className="px-4 py-2 w-16 text-center">Nổi bật</th>
                <th className="px-4 py-2">Tên</th>
                <th className="px-4 py-2">Loại</th>
                <th className="px-4 py-2">Mã</th>
                <th className="px-4 py-2 w-24 text-center">Thứ tự</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((d) => (
                <tr key={d.id} className={d.isFeatured ? 'bg-purple-50/30' : ''}>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => updateMutation.mutate({ id: d.id, body: { isFeatured: !d.isFeatured } })}
                      className={`p-1.5 rounded-lg ${d.isFeatured ? 'text-yellow-500 hover:bg-yellow-50' : 'text-gray-300 hover:bg-gray-100'}`}
                      title={d.isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'}
                    >
                      <Star className={`w-5 h-5 ${d.isFeatured ? 'fill-current' : ''}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{d.name}</p>
                    {d.strength && <p className="text-xs text-gray-400">{d.strength}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      d.productType === 'SUPPLEMENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                    }`}>
                      {d.productType === 'SUPPLEMENT' ? '🌿 TPCN' : '💊 Thuốc'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.code}</td>
                  <td className="px-4 py-3 text-center">
                    {d.isFeatured && (
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => updateMutation.mutate({ id: d.id, body: { featuredOrder: (d.featuredOrder ?? 0) + 1 } })}
                          className="p-0.5 text-gray-400 hover:text-purple-700"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-purple-700 w-6 text-center">{d.featuredOrder ?? 0}</span>
                        <button
                          onClick={() => updateMutation.mutate({ id: d.id, body: { featuredOrder: Math.max(0, (d.featuredOrder ?? 0) - 1) } })}
                          className="p-0.5 text-gray-400 hover:text-purple-700"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              {showOnlyFeatured ? 'Chưa chọn sản phẩm nào nổi bật' : 'Không tìm thấy sản phẩm'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
