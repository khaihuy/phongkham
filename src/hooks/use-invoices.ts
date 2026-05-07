import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Invoice {
  id: string;
  invoiceCode: string;
  patientId: string;
  appointmentId?: string;
  status: string;
  subtotal: string;
  discount: string;
  taxAmount: string;
  totalAmount: string;
  patientPays: string;
  notes?: string;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function useInvoices(
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    status?: string;
    patientId?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('pageSize', pageSize.toString());
  if (filters?.status) params.set('status', filters.status);
  if (filters?.patientId) params.set('patientId', filters.patientId);
  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.set('dateTo', filters.dateTo);

  return useQuery({
    queryKey: ['invoices', page, pageSize, filters],
    queryFn: async () => {
      const response = await fetch(`/api/invoices?${params}`);
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const result = await response.json();
      return result as { data: Invoice[]; meta: PaginationMeta };
    },
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await fetch(`/api/invoices/${id}`);
      if (!response.ok) throw new Error('Failed to fetch invoice');
      const result = await response.json();
      return result.data as Invoice;
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create invoice');
      const result = await response.json();
      return result.data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateInvoice(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Invoice>) => {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update invoice');
      const result = await response.json();
      return result.data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useIssueInvoice(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'issue' }),
      });
      if (!response.ok) throw new Error('Failed to issue invoice');
      const result = await response.json();
      return result.data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useAddPayment(invoiceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      amount: string;
      method: string;
      transactionId?: string;
      reference?: string;
      notes?: string;
    }) => {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-payment', ...data }),
      });
      if (!response.ok) throw new Error('Failed to add payment');
      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete invoice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
