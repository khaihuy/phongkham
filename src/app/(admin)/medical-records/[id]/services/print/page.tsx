'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Printer, ArrowLeft, Loader, AlertCircle } from 'lucide-react';

const SERVICE_STATUS: Record<string, string> = {
  PENDING: 'Chờ',
  IN_PROGRESS: 'Đang làm',
  COMPLETED: 'Đã xong',
  SKIPPED: 'Bỏ qua',
};

function pad2(n: number) { return String(n).padStart(2, '0'); }
function fmtDate(d: string | Date) {
  const x = new Date(d);
  return `${pad2(x.getDate())}/${pad2(x.getMonth() + 1)}/${x.getFullYear()}`;
}

export default function ServicesSlipPrintPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: record, isLoading, error } = useQuery({
    queryKey: ['medical-record-services-print', id],
    queryFn: async () => {
      const r = await fetch(`/api/medical-records/${id}`);
      if (!r.ok) throw new Error('Not found');
      return (await r.json()).data;
    },
  });

  const { data: mrServices = [] } = useQuery({
    queryKey: ['mr-services-print', id],
    queryFn: async () => {
      const r = await fetch(`/api/medical-records/${id}/services`);
      return (await r.json()).data ?? [];
    },
  });

  const { data: clinic } = useQuery({
    queryKey: ['clinic'],
    queryFn: async () => (await fetch('/api/clinic')).json().then((r: any) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (record && clinic) setTimeout(() => window.print(), 400);
  }, [record, clinic]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader className="w-8 h-8 animate-spin text-sky-600" />
    </div>
  );
  if (error || !record) return (
    <div className="flex items-center justify-center h-screen text-red-600 gap-2">
      <AlertCircle className="w-6 h-6" /> Không tìm thấy hồ sơ bệnh án
    </div>
  );

  const patient = record.patient;
  const doctor = record.doctor?.user;
  const labs = record.labOrders ?? [];
  const imgs = record.imageOrders ?? [];

  // Tổng số dòng có chỉ định (services + lab + img)
  const totalLines = mrServices.length + labs.length + imgs.length;

  return (
    <>
      {/* Toolbar — chỉ hiện trên web, ẩn khi in */}
      <div className="print:hidden fixed top-4 left-4 right-4 flex items-center justify-between z-10 bg-white/90 backdrop-blur rounded-xl shadow px-4 py-3">
        <button
          onClick={() => {
            if (window.opener) window.close()
            else router.push(`/medical-records/${id}`)
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
          <Printer className="w-4 h-4" /> In phiếu dịch vụ
        </button>
      </div>

      <div className="min-h-screen bg-gray-100 print:bg-white flex items-start justify-center pt-20 print:pt-0 pb-8 print:pb-0">
        <div className="w-[148mm] bg-white shadow-lg print:shadow-none p-8 space-y-5 text-sm">
          {/* Clinic header */}
          <div className="text-center border-b-2 border-gray-800 pb-3">
            <h1 className="text-lg font-bold uppercase">{clinic?.name ?? 'PHÒNG KHÁM'}</h1>
            {clinic?.address && <p className="text-xs text-gray-600">{clinic.address}</p>}
            <p className="text-xs text-gray-600">
              ĐT: {clinic?.phone ?? '—'}{clinic?.licenseNo ? ` · GP: ${clinic.licenseNo}` : ''}
            </p>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold uppercase tracking-widest">PHIẾU CHỈ ĐỊNH DỊCH VỤ</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              Mã HS: {record.recordCode} · Ngày khám: {fmtDate(record.visitDate)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm border border-gray-200 rounded p-3">
            <div><span className="text-gray-500">Bệnh nhân: </span><strong>{patient?.fullName ?? '—'}</strong></div>
            <div><span className="text-gray-500">Mã BN: </span><strong className="font-mono">{patient?.patientCode ?? '—'}</strong></div>
            <div><span className="text-gray-500">Bác sĩ chỉ định: </span><strong>{doctor?.fullName ?? '—'}</strong></div>
            <div><span className="text-gray-500">Ngày: </span>{fmtDate(record.visitDate)}</div>
            {patient?.phone && (
              <div><span className="text-gray-500">SĐT: </span>{patient.phone}</div>
            )}
            {patient?.dateOfBirth && (
              <div><span className="text-gray-500">Năm sinh: </span>{new Date(patient.dateOfBirth).getFullYear()}</div>
            )}
          </div>

          {/* Chẩn đoán sơ bộ (nếu có) */}
          {(record.chiefComplaint || record.diagnosis) && (
            <div className="border border-gray-200 rounded p-3 text-xs space-y-1">
              {record.chiefComplaint && <p><strong>Lý do khám:</strong> {record.chiefComplaint}</p>}
              {record.diagnosis && <p><strong>Chẩn đoán:</strong> {record.diagnosis}</p>}
            </div>
          )}

          {/* Bảng dịch vụ */}
          {totalLines === 0 ? (
            <div className="text-center text-gray-400 py-8 border border-dashed border-gray-300 rounded">
              Không có dịch vụ chỉ định
            </div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-y-2 border-gray-800">
                  <th className="py-1.5 text-left w-8">STT</th>
                  <th className="py-1.5 text-left">Tên dịch vụ</th>
                  <th className="py-1.5 text-center w-14">SL</th>
                  <th className="py-1.5 text-left">Ghi chú / Hướng dẫn</th>
                  <th className="py-1.5 text-center w-12">Đã làm</th>
                </tr>
              </thead>
              <tbody>
                {/* Services (theo sequence) */}
                {mrServices.map((s: any, i: number) => (
                  <tr key={`svc-${s.id}`} className="border-b border-gray-200">
                    <td className="py-2 align-top">{i + 1}</td>
                    <td className="py-2 align-top font-medium">
                      {s.service?.name ?? '—'}
                      {s.service?.code && <p className="text-gray-500 font-mono text-[10px]">{s.service.code}</p>}
                    </td>
                    <td className="py-2 align-top text-center">{s.quantity}</td>
                    <td className="py-2 align-top text-gray-600">{s.notes ?? '—'}</td>
                    <td className="py-2 align-top text-center">
                      <span className={s.status === 'COMPLETED' ? 'text-green-700' : 'text-gray-400'}>
                        {s.status === 'COMPLETED' ? '✓' : '□'}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Lab orders */}
                {labs.map((lab: any, i: number) => (
                  <tr key={`lab-${lab.id}`} className="border-b border-gray-200">
                    <td className="py-2 align-top">{mrServices.length + i + 1}</td>
                    <td className="py-2 align-top font-medium">
                      [XN] {lab.testName}
                      {lab.testCode && <p className="text-gray-500 font-mono text-[10px]">{lab.testCode}</p>}
                    </td>
                    <td className="py-2 align-top text-center">1</td>
                    <td className="py-2 align-top text-gray-600">{lab.instructions ?? '—'}</td>
                    <td className="py-2 align-top text-center">
                      <span className={lab.status === 'COMPLETED' ? 'text-green-700' : 'text-gray-400'}>
                        {lab.status === 'COMPLETED' ? '✓' : '□'}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Image orders */}
                {imgs.map((img: any, i: number) => (
                  <tr key={`img-${img.id}`} className="border-b border-gray-200">
                    <td className="py-2 align-top">{mrServices.length + labs.length + i + 1}</td>
                    <td className="py-2 align-top font-medium">
                      [CĐHA] {img.imagingType}
                      {img.bodyPart && <span className="text-gray-500"> — {img.bodyPart}</span>}
                    </td>
                    <td className="py-2 align-top text-center">1</td>
                    <td className="py-2 align-top text-gray-600">{img.instructions ?? '—'}</td>
                    <td className="py-2 align-top text-center">
                      <span className={img.status === 'COMPLETED' ? 'text-green-700' : 'text-gray-400'}>
                        {img.status === 'COMPLETED' ? '✓' : '□'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Lời dặn */}
          <div className="border border-gray-200 rounded p-3 text-xs space-y-1">
            <p className="font-semibold mb-1">Lưu ý cho bệnh nhân:</p>
            <p className="text-gray-600">
              Vui lòng đến các phòng theo thứ tự để thực hiện dịch vụ. Mang phiếu này khi đi.
              Sau khi xong tất cả, quay lại gặp bác sĩ.
            </p>
          </div>

          {/* Chữ ký */}
          <div className="flex justify-between items-end pt-3">
            <div className="text-xs text-gray-500">
              Phiếu này chỉ để thực hiện dịch vụ — không thay thế hóa đơn thanh toán.
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
              </p>
              <p className="text-sm font-semibold mt-1">Bác sĩ chỉ định</p>
              <div className="h-12" />
              <p className="text-sm font-bold border-t border-gray-800 pt-1">
                {doctor?.fullName ?? '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`@media print { body { margin:0;padding:0; } @page { size: A5; margin: 0; } }`}</style>
    </>
  );
}
