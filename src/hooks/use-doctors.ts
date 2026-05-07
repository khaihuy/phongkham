import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Doctor {
  id: string;
  userId: string;
  branchId: string;
  employeeCode: string;
  specialtyId: string;
  title?: string;
  bio?: string;
  licenseNo: string;
  yearsOfExp: number;
  consultFee: string;
  isActive: boolean;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function useDoctors(
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    specialtyId?: string;
    branchId?: string;
    search?: string;
  }
) {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('pageSize', pageSize.toString());
  if (filters?.specialtyId) params.set('specialtyId', filters.specialtyId);
  if (filters?.branchId) params.set('branchId', filters.branchId);
  if (filters?.search) params.set('search', filters.search);

  return useQuery({
    queryKey: ['doctors', page, pageSize, filters],
    queryFn: async () => {
      const response = await fetch(`/api/doctors?${params}`);
      if (!response.ok) throw new Error('Failed to fetch doctors');
      const result = await response.json();
      return result as { data: Doctor[]; meta: PaginationMeta };
    },
  });
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const response = await fetch(`/api/doctors/${id}`);
      if (!response.ok) throw new Error('Failed to fetch doctor');
      const result = await response.json();
      return result.data as Doctor;
    },
    enabled: !!id,
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Doctor>) => {
      const response = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create doctor');
      const result = await response.json();
      return result.data as Doctor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}

export function useUpdateDoctor(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Doctor>) => {
      const response = await fetch(`/api/doctors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update doctor');
      const result = await response.json();
      return result.data as Doctor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', id] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/doctors/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete doctor');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}
