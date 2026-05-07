'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Patient, Doctor, Appointment, MedicalRecord, Invoice } from '@/types';
import { mockPatients, mockDoctors, mockAppointments, mockMedicalRecords, mockInvoices } from './mockData';

interface StoreState {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
  invoices: Invoice[];
}

interface StoreActions {
  // Patients
  addPatient: (patient: Omit<Patient, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => Patient;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  getPatient: (id: string) => Patient | undefined;

  // Doctors
  addDoctor: (doctor: Omit<Doctor, 'id' | 'code'>) => Doctor;
  updateDoctor: (id: string, data: Partial<Doctor>) => void;
  deleteDoctor: (id: string) => void;

  // Appointments
  addAppointment: (appt: Omit<Appointment, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => Appointment;
  updateAppointment: (id: string, data: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;

  // Medical Records
  addMedicalRecord: (record: Omit<MedicalRecord, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => MedicalRecord;
  updateMedicalRecord: (id: string, data: Partial<MedicalRecord>) => void;
  deleteMedicalRecord: (id: string) => void;

  // Invoices
  addInvoice: (invoice: Omit<Invoice, 'id' | 'code' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
}

type Store = StoreState & StoreActions;

const StoreContext = createContext<Store | null>(null);

const STORAGE_KEY = 'phongkham_data';

function loadFromStorage(): StoreState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToStorage(state: StoreState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function nextCode(items: { code: string }[], prefix: string): string {
  const nums = items
    .map((i) => parseInt(i.code.replace(prefix, ''), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return prefix + String(max + 1).padStart(3, '0');
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(() => {
    const stored = loadFromStorage();
    return stored || {
      patients: mockPatients,
      doctors: mockDoctors,
      appointments: mockAppointments,
      medicalRecords: mockMedicalRecords,
      invoices: mockInvoices,
    };
  });

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const addPatient = useCallback((data: Omit<Patient, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Patient => {
    const now = new Date().toISOString();
    const patient: Patient = {
      ...data,
      id: generateId(),
      code: nextCode(state.patients, 'BN'),
      createdAt: now,
      updatedAt: now,
    };
    setState((prev) => ({ ...prev, patients: [...prev.patients, patient] }));
    return patient;
  }, [state.patients]);

  const updatePatient = useCallback((id: string, data: Partial<Patient>) => {
    setState((prev) => ({
      ...prev,
      patients: prev.patients.map((p) =>
        p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
      ),
    }));
  }, []);

  const deletePatient = useCallback((id: string) => {
    setState((prev) => ({ ...prev, patients: prev.patients.filter((p) => p.id !== id) }));
  }, []);

  const getPatient = useCallback((id: string) => state.patients.find((p) => p.id === id), [state.patients]);

  const addDoctor = useCallback((data: Omit<Doctor, 'id' | 'code'>): Doctor => {
    const doctor: Doctor = {
      ...data,
      id: generateId(),
      code: nextCode(state.doctors, 'BS'),
    };
    setState((prev) => ({ ...prev, doctors: [...prev.doctors, doctor] }));
    return doctor;
  }, [state.doctors]);

  const updateDoctor = useCallback((id: string, data: Partial<Doctor>) => {
    setState((prev) => ({
      ...prev,
      doctors: prev.doctors.map((d) => (d.id === id ? { ...d, ...data } : d)),
    }));
  }, []);

  const deleteDoctor = useCallback((id: string) => {
    setState((prev) => ({ ...prev, doctors: prev.doctors.filter((d) => d.id !== id) }));
  }, []);

  const addAppointment = useCallback((data: Omit<Appointment, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Appointment => {
    const now = new Date().toISOString();
    const appt: Appointment = {
      ...data,
      id: generateId(),
      code: nextCode(state.appointments, 'LH'),
      createdAt: now,
      updatedAt: now,
    };
    setState((prev) => ({ ...prev, appointments: [...prev.appointments, appt] }));
    return appt;
  }, [state.appointments]);

  const updateAppointment = useCallback((id: string, data: Partial<Appointment>) => {
    setState((prev) => ({
      ...prev,
      appointments: prev.appointments.map((a) =>
        a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
      ),
    }));
  }, []);

  const deleteAppointment = useCallback((id: string) => {
    setState((prev) => ({ ...prev, appointments: prev.appointments.filter((a) => a.id !== id) }));
  }, []);

  const updateAppointmentStatus = useCallback((id: string, status: Appointment['status']) => {
    setState((prev) => ({
      ...prev,
      appointments: prev.appointments.map((a) =>
        a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a
      ),
    }));
  }, []);

  const addMedicalRecord = useCallback((data: Omit<MedicalRecord, 'id' | 'code' | 'createdAt' | 'updatedAt'>): MedicalRecord => {
    const now = new Date().toISOString();
    const record: MedicalRecord = {
      ...data,
      id: generateId(),
      code: nextCode(state.medicalRecords, 'HS'),
      createdAt: now,
      updatedAt: now,
    };
    setState((prev) => ({ ...prev, medicalRecords: [...prev.medicalRecords, record] }));
    return record;
  }, [state.medicalRecords]);

  const updateMedicalRecord = useCallback((id: string, data: Partial<MedicalRecord>) => {
    setState((prev) => ({
      ...prev,
      medicalRecords: prev.medicalRecords.map((r) =>
        r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
      ),
    }));
  }, []);

  const deleteMedicalRecord = useCallback((id: string) => {
    setState((prev) => ({ ...prev, medicalRecords: prev.medicalRecords.filter((r) => r.id !== id) }));
  }, []);

  const addInvoice = useCallback((data: Omit<Invoice, 'id' | 'code' | 'createdAt'>): Invoice => {
    const invoice: Invoice = {
      ...data,
      id: generateId(),
      code: nextCode(state.invoices, 'HD'),
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, invoices: [...prev.invoices, invoice] }));
    return invoice;
  }, [state.invoices]);

  const updateInvoice = useCallback((id: string, data: Partial<Invoice>) => {
    setState((prev) => ({
      ...prev,
      invoices: prev.invoices.map((i) => (i.id === id ? { ...i, ...data } : i)),
    }));
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    setState((prev) => ({ ...prev, invoices: prev.invoices.filter((i) => i.id !== id) }));
  }, []);

  const value: Store = {
    ...state,
    addPatient,
    updatePatient,
    deletePatient,
    getPatient,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    updateAppointmentStatus,
    addMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,
    addInvoice,
    updateInvoice,
    deleteInvoice,
  };

  return React.createElement(StoreContext.Provider, { value }, children);
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
