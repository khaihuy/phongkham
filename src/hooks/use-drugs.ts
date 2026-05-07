import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Drug {
  id: string;
  code: string;
  name: string;
  genericName?: string;
  unit: string;
  isActive: boolean;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function useDrugs(page: number = 1, pageSize: number = 10, search?: string) {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('pageSize', pageSize.toString());
  if (search) params.set('search', search);

  return useQuery({
    queryKey: ['drugs', page, pageSize, search],
    queryFn: async () => {
      const response = await fetch(`/api/drugs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch drugs');
      const result = await response.json();
      return result as { data: Drug[]; meta: PaginationMeta };
    },
  });
}

export function useDrug(id: string) {
  return useQuery({
    queryKey: ['drug', id],
    queryFn: async () => {
      const response = await fetch(`/api/drugs/${id}`);
      if (!response.ok) throw new Error('Failed to fetch drug');
      const result = await response.json();
      return result.data as Drug;
    },
    enabled: !!id,
  });
}

export function useCreateDrug() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/drugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create drug');
      const result = await response.json();
      return result.data as Drug;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drugs'] });
    },
  });
}
