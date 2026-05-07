'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Printer, ArrowLeft, Loader, AlertCircle } from 'lucide-react';

const UNIT_LABELS: Record<string, string> = {
  TABLET: 'viên', CAPSULE: 'nang', BOTTLE: 'chai', AMPOULE: 'ống',
  TUBE: 'tuýp', SACHET: 'gói', VIAL: 'lọ', BOX: 'hộp',
};

export default function PrescriptionPrintPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: presc, isLoading, error } = useQuery({
    queryKey: ['prescription-print', id],
    queryFn: async () => {
      const r = await fetch(`/api/prescriptions/${id}`);
      if (!r.ok) throw new Error('Not found');
      return (await r.json()).data;
    },
  });

  const { data: clinic } = useQuery({
    queryKey: ['clinic'],
    queryFn: async () => (await fetch('/api/clinic')).json().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (presc && clinic) setTimeout(() => window.print(), 400);
  }, [presc, clinic]);

  if (isLoading) return <div className="flex items-center justify-center h-screen"><Loader className="w-8 h-8 animate-spin text-sky-600" /></div>;
  if (error || !presc) return <div className="flex items-center justify-center h-screen text-red-600 gap-2"><AlertCircle className="w-6 h-6" /> Không tìm thấy đơn thuốc</div>;

  const patient = presc.medicalRecord?.patient;
  const doctor = presc.medicalRecord?.doctor?.user;

  return (
    <>
      <div className="print:hidden fixed top-4 left-4 right-4 flex items-center justify-between z-10 bg-white/90 backdrop-blur rounded-xl shadow px-4 py-3">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium">
          <Printer className="w-4 h-4" /> In đơn thuốc
        </button>
      </div>

      <div className="min-h-screen bg-gray-100 print:bg-white flex items-start justify-center pt-20 print:pt-0 pb-8 print:pb-0">
        <div className="w-[148mm] bg-white shadow-lg print:shadow-none p-8 space-y-5 text-sm">
          {/* Clinic header */}
          <div className="text-center border-b-2 border-gray-800 pb-3">
            <h1 className="text-lg font-bold uppercase">{clinic?.name ?? 'PHÒNG KHÁM'}</h1>
            {clinic?.address && <p className="text-xs text-gray-600">{clinic.address}</p>}
            <p className="text-xs text-gray-600">ĐT: {clinic?.phone ?? '—'}{clinic?.licenseNo ? ` · GP: ${clinic.licenseNo}` : ''}</p>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold uppercase tracking-widest">ĐƠN THUỐC</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">Mã: {presc.prescriptionCode} · {new Date(presc.createdAt).toLocaleDateString('vi-VN')}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm border border-gray-200 rounded p-3">
            <div><span className="text-gray-500">Bệnh nhân: </span><strong>{patient?.fullName ?? '—'}</strong></div>
            <div><span className="text-gray-500">Mã BN: </span><strong className="font-mono">{patient?.patientCode ?? '—'}</strong></div>
            <div><span className="text-gray-500">Bác sĩ: </span><strong>{doctor?.fullName ?? '—'}</strong></div>
            <div><span className="text-gray-500">Ngày kê: </span>{new Date(presc.createdAt).toLocaleDateString('vi-VN')}</div>
          </div>

          {/* Drug table */}
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-y-2 border-gray-800">
                <th className="py-1.5 text-left w-6">STT</th>
                <th className="py-1.5 text-left">Tên thuốc</th>
                <th className="py-1.5 text-center">Liều dùng</th>
                <th className="py-1.5 text-center">Tần suất</th>
                <th className="py-1.5 text-center">T.Gian</th>
                <th className="py-1.5 text-center">SL</th>
              </tr>
            </thead>
            <tbody>
              {presc.items?.map((item: any, i: number) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-2">{i + 1}</td>
                  <td className="py-2 font-medium">
                    {item.drug?.name ?? '—'}
                    {item.drug?.strength && <span className="text-gray-500 font-normal"> {item.drug.strength}</span>}
                    {item.route && <p className="text-gray-500 text-xs">{item.route}</p>}
                    {item.instructions && <p className="text-gray-500 text-xs italic">{item.instructions}</p>}
                  </td>
                  <td className="py-2 text-center">{item.dosage ?? '—'}</td>
                  <td className="py-2 text-center">{item.frequency ?? '—'}</td>
                  <td className="py-2 text-center">{item.duration ?? '—'}</td>
                  <td className="py-2 text-center font-bold">{item.quantity} {UNIT_LABELS[item.drug?.unit ?? ''] ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {presc.notes && (
            <p className="text-xs text-gray-600 border-t pt-2"><strong>Ghi chú:</strong> {presc.notes}</p>
          )}

          <div className="border border-gray-200 rounded p-3 text-xs space-y-1">
            <p className="font-semibold mb-1">Lời dặn:</p>
            <div className="flex gap-4">
              <span>□ Uống sau ăn</span>
              <span>□ Uống trước ăn</span>
              <span>□ Uống đúng giờ</span>
            </div>
            <p className="mt-1 text-gray-500">Tái khám nếu không cải thiện sau 3 ngày hoặc có phản ứng thuốc.</p>
          </div>

          <div className="flex justify-end pt-2">
            <div className="text-center">
              <p className="text-xs text-gray-500">{clinic?.address?.split(',').slice(-1)[0]?.trim() ?? ''}, ngày {new Date().getDate()} tháng {new Date().getMonth()+1} năm {new Date().getFullYear()}</p>
              <p className="text-sm font-semibold mt-1">Bác sĩ điều trị</p>
              <div className="h-12" />
              <p className="text-sm font-bold border-t border-gray-800 pt-1">{doctor?.fullName ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`@media print { body { margin:0;padding:0; } @page { size: A5; margin: 0; } }`}</style>
    </>
  );
}
