import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface MedicalRecord {
  id: string;
  recordCode: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  visitDate: string;
  chiefComplaint?: string;
  clinicalNotes?: string;
  physicalExam?: string;
  diagnosis?: string;
  icdCode?: string;
  treatment?: string;
  followUpDate?: string;
  followUpNotes?: string;
  isConfidential: boolean;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function useMedicalRecords(
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    patientId?: string;
    doctorId?: string;
  }
) {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('pageSize', pageSize.toString());
  if (filters?.patientId) params.set('patientId', filters.patientId);
  if (filters?.doctorId) params.set('doctorId', filters.doctorId);

  return useQuery({
    queryKey: ['medicalRecords', page, pageSize, filters],
    queryFn: async () => {
      const response = await fetch(`/api/medical-records?${params}`);
      if (!response.ok) throw new Error('Failed to fetch medical records');
      const result = await response.json();
      return result as { data: MedicalRecord[]; meta: PaginationMeta };
    },
  });
}

export function useMedicalRecord(id: string) {
  return useQuery({
    queryKey: ['medicalRecord', id],
    queryFn: async () => {
      const response = await fetch(`/api/medical-records/${id}`);
      if (!response.ok) throw new Error('Failed to fetch medical record');
      const result = await response.json();
      return result.data as MedicalRecord;
    },
    enabled: !!id,
  });
}

export function useCreateMedicalRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<MedicalRecord>) => {
      const response = await fetch('/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create medical record');
      const result = await response.json();
      return result.data as MedicalRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicalRecords'] });
    },
  });
}

export function useUpdateMedicalRecord(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<MedicalRecord>) => {
      const response = await fetch(`/api/medical-records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update medical record');
      const result = await response.json();
      return result.data as MedicalRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicalRecord', id] });
      queryClient.invalidateQueries({ queryKey: ['medicalRecords'] });
    },
  });
}

export function useAddPrescription(recordId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/medical-records/${recordId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-prescription', ...data }),
      });
      if (!response.ok) throw new Error('Failed to add prescription');
      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicalRecord', recordId] });
    },
  });
}

export function useAddLabOrder(recordId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { testName: string; testCode?: string; instructions?: string }) => {
      const response = await fetch(`/api/medical-records/${recordId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-lab-order', ...data }),
      });
      if (!response.ok) throw new Error('Failed to add lab order');
      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicalRecord', recordId] });
    },
  });
}

export function useAddImageOrder(recordId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { imagingType: string; bodyPart?: string; instructions?: string }) => {
      const response = await fetch(`/api/medical-records/${recordId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-image-order', ...data }),
      });
      if (!response.ok) throw new Error('Failed to add image order');
      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicalRecord', recordId] });
    },
  });
}
