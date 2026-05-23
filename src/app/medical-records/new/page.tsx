'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Loader } from 'lucide-react';
import { toast } from 'sonner';

interface PrescriptionItem {
  drugId: string;
  drugName: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  unitPrice: string;
}

export default function NewMedicalRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prePatientId = searchParams.get('patientId') ?? '';
  const preApptId = searchParams.get('appointmentId') ?? '';

  const [form, setForm] = useState({
    appointmentId: preApptId,
    patientId: prePatientId,
    doctorId: '',
    visitDate: new Date().toISOString().split('T')[0],
    chiefComplaint: '',
    clinicalNotes: '',
    physicalExam: '',
    diagnosis: '',
    icdCode: '',
    treatment: '',
    followUpDate: '',
    followUpNotes: '',
  });
  const [prescItems, setPrescItems] = useState<PrescriptionItem[]>([]);
  const [showPrescForm, setShowPrescForm] = useState(false);
  const [newItem, setNewItem] = useState<Omit<PrescriptionItem, 'drugName'> & { drugName: string }>({
    drugId: '', drugName: '', quantity: 1, dosage: '1 viên', frequency: '2 lần/ngày', duration: '7 ngày', route: 'Uống', unitPrice: '5000',
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-all'],
    queryFn: async () => { const r = await fetch('/api/patients?pageSize=200'); const j = await r.json(); return j.data ?? []; },
  });
  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-appointments', form.patientId],
    queryFn: async () => {
      // Lấy mọi lịch hẹn của BN trừ CANCELLED/NO_SHOW — gồm cả PENDING,
      // CONFIRMED, IN_PROGRESS, COMPLETED. Bác sĩ thường tạo hồ sơ ngay
      // khi đang khám (IN_PROGRESS) chứ không đợi đến lúc COMPLETED.
      const r = await fetch(`/api/appointments?patientId=${form.patientId}&pageSize=50`);
      const j = await r.json();
      const all: any[] = j.data ?? [];
      return all
        .filter((a) => a.status !== 'CANCELLED' && a.status !== 'NO_SHOW')
        .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
    },
    enabled: !!form.patientId,
  });
  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors-all'],
    queryFn: async () => { const r = await fetch('/api/doctors?pageSize=100'); const j = await r.json(); return j.data ?? []; },
  });
  const { data: drugs = [] } = useQuery({
    queryKey: ['drugs-all'],
    queryFn: async () => { const r = await fetch('/api/drugs?pageSize=200'); const j = await r.json(); return j.data ?? []; },
  });

  const createRecord = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch('/api/medical-records', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error ?? 'Failed'); }
      return (await r.json()).data;
    },
    onSuccess: (record) => {
      toast.success('Tạo hồ sơ bệnh án thành công');
      router.push(`/medical-records`);
    },
    onError: (e: any) => toast.error(e.message ?? 'Tạo hồ sơ thất bại'),
  });

  function addPrescItem() {
    if (!newItem.drugId) { toast.error('Chọn thuốc'); return; }
    setPrescItems(items => [...items, { ...newItem }]);
    setNewItem({ drugId: '', drugName: '', quantity: 1, dosage: '1 viên', frequency: '2 lần/ngày', duration: '7 ngày', route: 'Uống', unitPrice: '5000' });
    setShowPrescForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.patientId) { toast.error('Vui lòng chọn bệnh nhân'); return; }
    if (!form.doctorId) { toast.error('Vui lòng chọn bác sĩ'); return; }
    createRecord.mutate({
      ...form,
      // Bỏ appointmentId rỗng để backend hiểu là không có lịch hẹn
      appointmentId: form.appointmentId || undefined,
      visitDate: form.visitDate,
      prescriptions: prescItems.length > 0 ? [{
        items: prescItems.map(it => ({
          drugId: it.drugId, quantity: it.quantity, dosage: it.dosage,
          frequency: it.frequency, duration: it.duration, route: it.route, unitPrice: it.unitPrice,
        })),
      }] : undefined,
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900">Tạo hồ sơ bệnh án</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Bệnh nhân + Lịch hẹn + Bác sĩ */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-700">Thông tin cơ bản</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bệnh nhân *</label>
              <select value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value, appointmentId: '' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" required>
                <option value="">Chọn bệnh nhân</option>
                {patients.map((p: any) => <option key={p.id} value={p.id}>{p.fullName} — {p.patientCode}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lịch hẹn <span className="text-gray-400 font-normal">(không bắt buộc)</span>
              </label>
              <select value={form.appointmentId} onChange={e => {
                const appt = appointments.find((a: any) => a.id === e.target.value);
                setForm(f => ({ ...f, appointmentId: e.target.value, doctorId: appt?.doctorId ?? f.doctorId, chiefComplaint: appt?.chiefComplaint ?? f.chiefComplaint }));
              }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm">
                <option value="">— Khám không hẹn —</option>
                {appointments.map((a: any) => {
                  const d = new Date(a.scheduledDate);
                  const dStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                  const statusLabel = ({
                    PENDING: 'Chờ khám',
                    CONFIRMED: 'Đã xác nhận',
                    IN_PROGRESS: 'Đang khám',
                    COMPLETED: 'Hoàn thành',
                  } as Record<string, string>)[a.status] ?? a.status;
                  return (
                    <option key={a.id} value={a.id}>
                      {a.appointmentCode} — {dStr} {a.scheduledTime} · {statusLabel}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bác sĩ *</label>
              <select value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" required>
                <option value="">Chọn bác sĩ</option>
                {doctors.map((d: any) => <option key={d.id} value={d.id}>{d.user?.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày khám</label>
              <input type="date" value={form.visitDate} onChange={e => setForm(f => ({ ...f, visitDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
            </div>
          </div>
        </div>

        {/* Khám lâm sàng */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-700">Khám lâm sàng</h3>
          {[
            { key: 'chiefComplaint', label: 'Lý do khám' },
            { key: 'physicalExam', label: 'Khám thực thể' },
            { key: 'clinicalNotes', label: 'Ghi chú lâm sàng' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <textarea value={(form as any)[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
            </div>
          ))}
        </div>

        {/* Chẩn đoán */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-700">Chẩn đoán & Điều trị</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Chẩn đoán</label>
              <input type="text" value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã ICD-10</label>
              <input type="text" value={form.icdCode} placeholder="VD: J11, K29.7"
                onChange={e => setForm(f => ({ ...f, icdCode: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tái khám</label>
              <input type="date" value={form.followUpDate} onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hướng điều trị</label>
              <textarea value={form.treatment} onChange={e => setForm(f => ({ ...f, treatment: e.target.value }))}
                rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
            </div>
          </div>
        </div>

        {/* Đơn thuốc */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Đơn thuốc</h3>
            <button type="button" onClick={() => setShowPrescForm(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-sm">
              <Plus className="w-4 h-4" /> Thêm thuốc
            </button>
          </div>

          {prescItems.length === 0 && !showPrescForm && (
            <p className="text-gray-400 text-sm text-center py-4">Chưa có thuốc trong đơn</p>
          )}

          {prescItems.length > 0 && (
            <div className="space-y-2">
              {prescItems.map((item, i) => (
                <div key={i} className="flex items-start justify-between p-3 bg-sky-50 rounded-lg text-sm">
                  <div>
                    <p className="font-medium">{item.drugName}</p>
                    <p className="text-xs text-gray-500">{item.dosage} · {item.frequency} · {item.duration} · {item.route}</p>
                    <p className="text-xs text-gray-500">SL: {item.quantity} · {Number(item.unitPrice).toLocaleString('vi-VN')}đ/viên</p>
                  </div>
                  <button type="button" onClick={() => setPrescItems(items => items.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showPrescForm && (
            <div className="border border-sky-200 rounded-lg p-4 space-y-3 bg-sky-50">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Thuốc *</label>
                  <select value={newItem.drugId} onChange={e => {
                    const d = drugs.find((dr: any) => dr.id === e.target.value);
                    setNewItem(n => ({ ...n, drugId: e.target.value, drugName: d?.name ?? '' }));
                  }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option value="">Chọn thuốc</option>
                    {drugs.map((d: any) => <option key={d.id} value={d.id}>{d.name} ({d.strength ?? d.unit})</option>)}
                  </select>
                </div>
                {[
                  { key: 'quantity', label: 'Số lượng', type: 'number' },
                  { key: 'unitPrice', label: 'Đơn giá (đ)', type: 'number' },
                  { key: 'dosage', label: 'Liều dùng', type: 'text' },
                  { key: 'frequency', label: 'Tần suất', type: 'text' },
                  { key: 'duration', label: 'Thời gian', type: 'text' },
                  { key: 'route', label: 'Đường dùng', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                    <input type={f.type} value={(newItem as any)[f.key]}
                      onChange={e => setNewItem(n => ({ ...n, [f.key]: f.type === 'number' ? e.target.value : e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={addPrescItem} className="flex-1 py-1.5 bg-sky-600 text-white rounded-lg text-sm">Thêm vào đơn</button>
                <button type="button" onClick={() => setShowPrescForm(false)} className="flex-1 py-1.5 border rounded-lg text-sm hover:bg-white">Hủy</button>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={createRecord.isPending}
            className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white rounded-xl font-semibold">
            {createRecord.isPending ? <span className="flex items-center justify-center gap-2"><Loader className="w-4 h-4 animate-spin" />Đang lưu...</span> : 'Lưu hồ sơ bệnh án'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50">Hủy</button>
        </div>
      </form>
    </div>
  );
}
