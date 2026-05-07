'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Printer, ArrowLeft, Loader, AlertCircle } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  GENERAL: 'Khám tổng quát',
  SPECIALIST: 'Khám chuyên khoa',
  FOLLOW_UP: 'Tái khám',
  EMERGENCY: 'Cấp cứu',
  TELEMEDICINE: 'Khám trực tuyến',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ khám',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang khám',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Không đến',
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function AppointmentPrintPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: apt, isLoading, error } = useQuery({
    queryKey: ['appointment-print', id],
    queryFn: async () => {
      const r = await fetch(`/api/appointments/${id}`);
      if (!r.ok) throw new Error('Không tìm thấy lịch hẹn');
      return (await r.json()).data;
    },
  });

  const { data: clinic } = useQuery({
    queryKey: ['clinic'],
    queryFn: async () => (await fetch('/api/clinic')).json().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (apt && clinic) {
      setTimeout(() => window.print(), 400);
    }
  }, [apt, clinic]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader className="w-8 h-8 animate-spin text-sky-600" />
    </div>
  );
  if (error || !apt) return (
    <div className="flex items-center justify-center h-screen text-red-600 gap-2">
      <AlertCircle className="w-6 h-6" /> Không tìm thấy lịch hẹn
    </div>
  );

  const patient = apt.patient;
  const doctor = apt.doctor;

  return (
    <>
      {/* Screen-only controls */}
      <div className="print:hidden fixed top-4 left-4 right-4 flex items-center justify-between z-10 bg-white/90 backdrop-blur rounded-xl shadow px-4 py-3">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium">
          <Printer className="w-4 h-4" /> In phiếu
        </button>
      </div>

      {/* Print content */}
      <div className="min-h-screen bg-gray-100 print:bg-white flex items-start justify-center pt-20 print:pt-0 pb-8 print:pb-0">
        <div className="w-[210mm] bg-white shadow-lg print:shadow-none p-10 space-y-6">

          {/* Clinic header */}
          <div className="text-center border-b-2 border-gray-800 pb-4">
            <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
              {clinic?.name ?? 'PHÒNG KHÁM'}
            </h1>
            {clinic?.address && <p className="text-sm text-gray-600 mt-0.5">{clinic.address}</p>}
            <div className="flex items-center justify-center gap-6 mt-1 text-sm text-gray-600">
              {clinic?.phone && <span>ĐT: {clinic.phone}</span>}
              {clinic?.email && <span>Email: {clinic.email}</span>}
              {clinic?.licenseNo && <span>GP: {clinic.licenseNo}</span>}
            </div>
          </div>

          {/* Slip title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-widest">PHIẾU KHÁM BỆNH</h2>
            <p className="text-sm text-gray-500 mt-1 font-mono">Mã lịch hẹn: <strong className="text-gray-800">{apt.appointmentCode}</strong></p>
          </div>

          {/* Queue number highlight */}
          <div className="flex justify-center">
            <div className="border-4 border-gray-800 rounded-2xl px-12 py-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Giờ hẹn</p>
              <p className="text-5xl font-black text-gray-900 font-mono">{apt.scheduledTime}</p>
              <p className="text-sm text-gray-600 mt-1">{fmtDate(apt.scheduledDate)}</p>
            </div>
          </div>

          {/* Patient info */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 border border-gray-200 rounded-lg p-5">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Họ và tên</p>
              <p className="font-bold text-gray-900 text-lg">{patient?.fullName ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Mã bệnh nhân</p>
              <p className="font-bold text-gray-900 font-mono text-lg">{patient?.patientCode ?? '—'}</p>
            </div>
            {patient?.dateOfBirth && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Ngày sinh</p>
                <p className="font-medium text-gray-800">{new Date(patient.dateOfBirth).toLocaleDateString('vi-VN')}</p>
              </div>
            )}
            {patient?.phone && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Điện thoại</p>
                <p className="font-medium text-gray-800">{patient.phone}</p>
              </div>
            )}
          </div>

          {/* Appointment info */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 border border-gray-200 rounded-lg p-5">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Bác sĩ khám</p>
              <p className="font-bold text-gray-900">{doctor?.user?.fullName ?? '—'}</p>
              {doctor?.specialty?.name && (
                <p className="text-sm text-sky-600">{doctor.specialty.name}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Loại khám</p>
              <p className="font-medium text-gray-800">{TYPE_LABELS[apt.type] ?? apt.type}</p>
            </div>
            {apt.service && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Dịch vụ</p>
                <p className="font-medium text-gray-800">{apt.service.name}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Trạng thái</p>
              <p className="font-medium text-gray-800">{STATUS_LABELS[apt.status] ?? apt.status}</p>
            </div>
            {apt.chiefComplaint && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Lý do khám</p>
                <p className="font-medium text-gray-800">{apt.chiefComplaint}</p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">Lưu ý cho bệnh nhân:</p>
            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
              <li>Vui lòng có mặt trước giờ hẹn <strong>15 phút</strong> để làm thủ tục</li>
              <li>Mang theo CCCD/hộ chiếu và thẻ BHYT (nếu có)</li>
              <li>Giữ phiếu này để đối chiếu khi vào khám</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 border-t pt-4">
            <p>Phiếu được tạo lúc {new Date().toLocaleString('vi-VN')} — {clinic?.name}</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { margin: 0; padding: 0; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </>
  );
}
