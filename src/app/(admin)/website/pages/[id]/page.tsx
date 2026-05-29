'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader, AlertCircle } from 'lucide-react';
import SitePageForm from '@/components/website/SitePageForm';

export default function EditSitePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['site-page', id],
    queryFn: async () => {
      const r = await fetch(`/api/site-pages/${id}`);
      if (!r.ok) throw new Error('Not found');
      return (await r.json()).data;
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin text-sky-600" /></div>;
  if (error || !data) return <div className="text-center py-12 text-red-600"><AlertCircle className="inline w-5 h-5 mr-1" /> Không tìm thấy trang</div>;

  return (
    <SitePageForm
      pageId={id}
      initial={{
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt ?? '',
        content: data.content,
        status: data.status,
        footerGroup: data.footerGroup ?? '',
        footerLabel: data.footerLabel ?? '',
        linkUrl: data.linkUrl ?? '',
        sortOrder: data.sortOrder ?? 0,
        seoTitle: data.seoTitle ?? '',
        seoDescription: data.seoDescription ?? '',
      }}
    />
  );
}
