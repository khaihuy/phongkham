import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Appointment {
  id: string;
  appointmentCode: string;
  patientId: string;
  doctorId: string;
  branchId: string;
  roomId?: string;
  type: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  chiefComplaint?: string;
  notes?: string;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function useAppointments(
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    status?: string;
    doctorId?: string;
    patientId?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('pageSize', pageSize.toString());
  if (filters?.status) params.set('status', filters.status);
  if (filters?.doctorId) params.set('doctorId', filters.doctorId);
  if (filters?.patientId) params.set('patientId', filters.patientId);
  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.set('dateTo', filters.dateTo);

  return useQuery({
    queryKey: ['appointments', page, pageSize, filters],
    queryFn: async () => {
      const response = await fetch(`/api/appointments?${params}`);
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const result = await response.json();
      return result as { data: Appointment[]; meta: PaginationMeta };
    },
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const response = await fetch(`/api/appointments/${id}`);
      if (!response.ok) throw new Error('Failed to fetch appointment');
      const result = await response.json();
      return result.data as Appointment;
    },
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Appointment>) => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create appointment');
      const result = await response.json();
      return result.data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useUpdateAppointment(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Appointment>) => {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update appointment');
      const result = await response.json();
      return result.data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useUpdateAppointmentStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { status: string; cancelReason?: string }) => {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update appointment status');
      const result = await response.json();
      return result.data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete appointment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useAppointmentSlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: ['appointmentSlots', doctorId, date],
    queryFn: async () => {
      const params = new URLSearchParams({
        doctorId,
        date,
      });
      const response = await fetch(`/api/appointments/slots?${params}`);
      if (!response.ok) throw new Error('Failed to fetch appointment slots');
      const result = await response.json();
      return result.data as { slots: string[] };
    },
    enabled: !!doctorId && !!date,
  });
}
