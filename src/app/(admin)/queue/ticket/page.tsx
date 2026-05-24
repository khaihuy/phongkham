'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function QueueTicketPage() {
  const params = useSearchParams();
  const [apt, setApt] = useState<any>(null);
  const [waiting, setWaiting] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const aptId = params.get('id');

  useEffect(() => {
    if (!aptId) return;
    (async () => {
      try {
        const [aptRes, queueRes] = await Promise.all([
          fetch(`/api/appointments/${aptId}`),
          fetch(`/api/appointments?status=CONFIRMED&status=PENDING&dateFrom=${new Date().toISOString().split('T')[0]}&dateTo=${new Date().toISOString().split('T')[0]}&pageSize=100`),
        ]);
        const aptData = await aptRes.json();
        const queueData = await queueRes.json();
        const a = aptData.data ?? aptData;
        setApt(a);
        // Count people waiting before this patient (lower queue number, not completed)
        const queue: any[] = queueData.data ?? [];
        const before = queue.filter(
          (q: any) =>
            (q.status === 'PENDING' || q.status === 'CONFIRMED') &&
            q.queueNumber != null &&
            a.queueNumber != null &&
            q.queueNumber < a.queueNumber
        );
        setWaiting(before.length);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [aptId]);

  useEffect(() => {
    if (!loading && apt) {
      const t = setTimeout(() => window.print(), 500);
      return () => clearTimeout(t);
    }
  }, [loading, apt]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!apt) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Không tìm thấy lịch hẹn
      </div>
    );
  }

  const queueNum = apt.queueNumber ?? '—';
  const patientName = apt.patient?.fullName ?? '—';
  const patientCode = apt.patient?.patientCode ?? '';
  const doctorName = apt.doctor?.user?.fullName ?? '—';
  const roomName = apt.room?.name ?? apt.room?.code ?? null;
  const scheduledTime = apt.scheduledTime ?? '—';
  const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .ticket { width: 80mm; min-height: 120mm; margin: 0 auto; }
        }
        @media screen {
          body { background: #f3f4f6; }
        }
      `}</style>

      {/* Screen controls */}
      <div className="no-print flex items-center gap-3 p-4 bg-white border-b border-gray-200">
        <Link href="/queue" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Hàng đợi
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium ml-auto"
        >
          <Printer className="w-4 h-4" /> In phiếu
        </button>
      </div>

      {/* Ticket — 80mm width for thermal printer */}
      <div className="ticket flex flex-col items-center p-6 bg-white max-w-xs mx-auto mt-6 rounded-2xl shadow-lg no-print-shadow">
        {/* Clinic header */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Phòng Khám</p>
        <p className="text-xs text-gray-400 text-center mt-0.5">PHIẾU XẾP HÀNG KHÁM BỆNH</p>

        <div className="w-full border-t border-dashed border-gray-300 my-4" />

        {/* Queue number — big */}
        <p className="text-xs text-gray-500 uppercase tracking-wide">Số thứ tự</p>
        <p className="text-8xl font-black text-sky-600 leading-none my-2 font-mono tabular-nums">
          {String(queueNum).padStart(3, '0')}
        </p>

        <div className="w-full border-t border-dashed border-gray-300 my-4" />

        {/* Patient info */}
        <div className="w-full space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Bệnh nhân</span>
            <span className="font-semibold text-gray-900 text-right max-w-[55%]">{patientName}</span>
          </div>
          {patientCode && (
            <div className="flex justify-between">
              <span className="text-gray-500">Mã BN</span>
              <span className="font-mono text-gray-700">{patientCode}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Bác sĩ</span>
            <span className="font-medium text-gray-900 text-right max-w-[55%]">{doctorName}</span>
          </div>
          {roomName && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Phòng khám</span>
              <span className="font-bold text-sky-700 text-lg">{roomName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Giờ đăng ký</span>
            <span className="font-mono text-gray-700">{scheduledTime}</span>
          </div>
        </div>

        <div className="w-full border-t border-dashed border-gray-300 my-4" />

        {/* Wait info */}
        <div className="w-full bg-amber-50 rounded-xl p-3 text-center">
          {waiting === 0 ? (
            <>
              <p className="text-xs text-amber-600 font-medium">Bạn là người tiếp theo!</p>
              <p className="text-xs text-amber-500 mt-0.5">Vui lòng vào phòng khám ngay</p>
            </>
          ) : (
            <>
              <p className="text-xs text-amber-700 font-semibold">
                Còn <span className="text-2xl font-black">{waiting}</span> người chờ trước bạn
              </p>
              <p className="text-xs text-amber-500 mt-0.5">Xin vui lòng ngồi chờ, chúng tôi sẽ gọi tên bạn</p>
            </>
          )}
        </div>

        <div className="w-full border-t border-dashed border-gray-300 my-4" />

        <p className="text-[10px] text-gray-400 text-center capitalize">{today}</p>
        <p className="text-[10px] text-gray-300 text-center mt-0.5">In lúc {now}</p>
      </div>
    </>
  );
}
