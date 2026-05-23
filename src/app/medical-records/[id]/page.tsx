'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, X, Save, Loader, AlertCircle, FileText, FlaskConical, ScanLine, CheckCircle, CreditCard, Activity, Plus, Bell, Printer, CalendarDays, Stethoscope, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';

function fmt(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

function fmtDateTime(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleString('vi-VN');
}

function toInputDate(d: string | null | undefined) {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
}

function formatCurrency(n: any) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n));
}

const PRESC_STATUS: Record<string, string> = {
  PENDING: 'Chờ bán',
  DISPENSED: 'Đã bán',
  CANCELLED: 'Hủy',
};
const PRESC_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  DISPENSED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

interface EditForm {
  visitDate: string;
  chiefComplaint: string;
  physicalExam: string;
  clinicalNotes: string;
  diagnosis: string;
  icdCode: string;
  treatment: string;
  followUpDate: string;
  followUpNotes: string;
}

function LabOrderForm({ services, onSubmit, loading }: { services: any[]; onSubmit: (d: { serviceId: string; name: string; code: string; instructions: string }) => void; loading: boolean }) {
  const [selectedId, setSelectedId] = useState('');
  const [instructions, setInstructions] = useState('');
  const selected = services.find((s) => s.id === selectedId);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Loại xét nghiệm *</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
        >
          <option value="">— Chọn xét nghiệm —</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({new Intl.NumberFormat('vi-VN').format(Number(s.price))}đ)
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Chỉ dẫn (tuỳ chọn)</label>
        <input
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          placeholder="Nhịn ăn 8 tiếng, lấy mẫu buổi sáng..."
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          disabled={!selectedId || loading}
          onClick={() => onSubmit({ serviceId: selected?.id, name: selected?.name, code: selected?.code, instructions })}
          className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium"
        >
          {loading ? 'Đang lưu...' : 'Xác nhận chỉ định'}
        </button>
      </div>
    </div>
  );
}

function ImgOrderForm({ services, onSubmit, loading }: { services: any[]; onSubmit: (d: { serviceId: string; name: string; instructions: string }) => void; loading: boolean }) {
  const [selectedId, setSelectedId] = useState('');
  const [instructions, setInstructions] = useState('');
  const selected = services.find((s) => s.id === selectedId);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Loại CĐHA *</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
        >
          <option value="">— Chọn CĐHA —</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({new Intl.NumberFormat('vi-VN').format(Number(s.price))}đ)
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Chỉ dẫn (tuỳ chọn)</label>
        <input
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          placeholder="Ghi chú thêm..."
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          disabled={!selectedId || loading}
          onClick={() => onSubmit({ serviceId: selected?.id, name: selected?.name, instructions })}
          className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium"
        >
          {loading ? 'Đang lưu...' : 'Xác nhận chỉ định'}
        </button>
      </div>
    </div>
  );
}

export default function MedicalRecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showImgModal, setShowImgModal] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [invoicePreview, setInvoicePreview] = useState<any>(null);
  const [markingRead, setMarkingRead] = useState(false);
  const [creatingFollowUp, setCreatingFollowUp] = useState(false);

  const { data: record, isLoading, error } = useQuery({
    queryKey: ['medical-record', id],
    queryFn: async () => {
      const r = await fetch(`/api/medical-records/${id}`);
      if (!r.ok) throw new Error('Not found');
      const j = await r.json();
      return j.data;
    },
  });

  const { data: servicesData } = useQuery({
    queryKey: ['services-all'],
    queryFn: async () => {
      const r = await fetch('/api/services?pageSize=200&isActive=true');
      return (await r.json()).data ?? [];
    },
  });

  const labServiceList = (servicesData ?? []).filter((s: any) => s.code?.startsWith('XN'));
  const imgServiceList = (servicesData ?? []).filter(
    (s: any) =>
      s.code?.startsWith('CD') ||
      s.code?.startsWith('SIEU') ||
      s.code?.startsWith('XRAY') ||
      s.code?.startsWith('ECHO'),
  );

  const updateMutation = useMutation({
    mutationFn: async (data: EditForm) => {
      const r = await fetch(`/api/medical-records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          visitDate: data.visitDate ? new Date(data.visitDate).toISOString() : undefined,
          followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString() : undefined,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? 'Lưu thất bại');
      }
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical-record', id] });
      toast.success('Đã lưu hồ sơ bệnh án');
      setEditing(false);
      setForm(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addLabOrder = useMutation({
    mutationFn: async (data: { serviceId: string; name: string; code: string; instructions: string }) => {
      const r = await fetch('/api/lab-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicalRecordId: record.id,
          testName: data.name,
          testCode: data.code,
          serviceId: data.serviceId,
          instructions: data.instructions,
        }),
      });
      if (!r.ok) throw new Error('Thêm thất bại');
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical-record', id] });
      toast.success('Đã thêm chỉ định xét nghiệm');
      setShowLabModal(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addImgOrder = useMutation({
    mutationFn: async (data: { serviceId: string; name: string; instructions: string }) => {
      const r = await fetch('/api/image-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicalRecordId: record.id,
          imagingType: data.name,
          serviceId: data.serviceId,
          instructions: data.instructions,
        }),
      });
      if (!r.ok) throw new Error('Thêm thất bại');
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical-record', id] });
      toast.success('Đã thêm chỉ định CĐHA');
      setShowImgModal(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleEdit = () => {
    if (!record) return;
    setForm({
      visitDate: toInputDate(record.visitDate),
      chiefComplaint: record.chiefComplaint ?? '',
      physicalExam: record.physicalExam ?? '',
      clinicalNotes: record.clinicalNotes ?? '',
      diagnosis: record.diagnosis ?? '',
      icdCode: record.icdCode ?? '',
      treatment: record.treatment ?? '',
      followUpDate: toInputDate(record.followUpDate),
      followUpNotes: record.followUpNotes ?? '',
    });
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setForm(null);
  };

  const handleSave = () => {
    if (!form) return;
    updateMutation.mutate(form);
  };

  const set = (key: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => (f ? { ...f, [key]: e.target.value } : f));

  async function handleComplete() {
    if (!confirm('Hoàn tất khám và tạo hóa đơn tự động?')) return;
    setCompleting(true);
    try {
      // Dùng endpoint medical-records để xử lý cả trường hợp khám không hẹn
      // (record.appointmentId có thể là null)
      const r = await fetch(`/api/medical-records/${id}/complete`, {
        method: 'POST',
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Lỗi');
      qc.invalidateQueries({ queryKey: ['medical-record', id] });
      setInvoicePreview(j.data);
      toast.success(`Đã hoàn tất khám — Hóa đơn ${j.data.invoice.invoiceCode} (${j.data.itemCount} khoản)`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCompleting(false);
    }
  }

  async function handleMarkResultsRead() {
    const newLabs = (record?.labOrders ?? []).filter((o: any) => o.status === 'COMPLETED' && !o.reviewedAt);
    const newImgs = (record?.imageOrders ?? []).filter((o: any) => o.status === 'COMPLETED' && !o.reviewedAt);
    if (!newLabs.length && !newImgs.length) return;
    setMarkingRead(true);
    try {
      await fetch('/api/notifications/lab-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labIds: newLabs.map((o: any) => o.id), imageIds: newImgs.map((o: any) => o.id) }),
      });
      qc.invalidateQueries({ queryKey: ['medical-record', id] });
      qc.invalidateQueries({ queryKey: ['lab-notifications'] });
      toast.success('Đã đánh dấu đã đọc tất cả kết quả');
    } catch {
      toast.error('Lỗi');
    } finally {
      setMarkingRead(false);
    }
  }

  async function handleCreateFollowUp() {
    if (!record.followUpDate) return;
    setCreatingFollowUp(true);
    try {
      const r = await fetch('/api/appointments', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          patientId: record.patientId,
          doctorId: record.doctorId,
          branchId: record.appointment?.branchId ?? '',
          type: 'FOLLOW_UP',
          scheduledDate: record.followUpDate,
          scheduledTime: record.appointment?.scheduledTime ?? '08:00',
          duration: 30,
          chiefComplaint: `Tái khám: ${record.diagnosis ?? ''}`.trim(),
          notes: record.followUpNotes ?? '',
        })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Lỗi tạo lịch hẹn');
      toast.success(`Đã tạo lịch tái khám: ${new Date(record.followUpDate).toLocaleDateString('vi-VN')}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreatingFollowUp(false);
    }
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  if (error || !record)
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <AlertCircle className="w-8 h-8 mr-2" /> Không tìm thấy hồ sơ bệnh án
      </div>
    );

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm';
  const textareaCls = `${inputCls} resize-none`;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb / header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Hồ sơ bệnh án</span>
          <span>/</span>
          <span className="text-gray-900 font-semibold">{record.recordCode}</span>
        </div>
        <div className="ml-auto flex gap-2 flex-wrap justify-end">
          {/* Billing link if invoice exists */}
          {record.appointment?.invoice && (
            <Link
              href={`/billing/${record.appointment.invoice.id}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-lg text-sm font-medium"
            >
              <CreditCard className="w-4 h-4" /> Xem hóa đơn
            </Link>
          )}

          {/* Follow-up appointment button */}
          {record.followUpDate && record.appointment?.status === 'COMPLETED' && (
            <button onClick={handleCreateFollowUp} disabled={creatingFollowUp}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium">
              <CalendarDays className="w-4 h-4" />
              {creatingFollowUp ? 'Đang tạo...' : `Tái khám ${new Date(record.followUpDate).toLocaleDateString('vi-VN')}`}
            </button>
          )}

          {/* Complete exam button */}
          {!editing && record.appointment?.status !== 'COMPLETED' && (
            <button
              onClick={handleComplete}
              disabled={completing || record.appointment?.status === 'COMPLETED'}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:bg-gray-400"
            >
              <CheckCircle className="w-4 h-4" />
              {completing ? 'Đang xử lý...' : 'Hoàn tất khám'}
            </button>
          )}

          {editing ? (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <X className="w-4 h-4" /> Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium disabled:bg-gray-400"
              >
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium"
            >
              <Edit2 className="w-4 h-4" /> Chỉnh sửa
            </button>
          )}
        </div>
      </div>

      {/* Invoice preview banner after completion */}
      {invoicePreview && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="font-medium">Hoàn tất khám — Hóa đơn {invoicePreview.invoice.invoiceCode}</span>
            <span className="text-sm text-emerald-600">
              ({invoicePreview.itemCount} khoản, {formatCurrency(invoicePreview.invoice.totalAmount)})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* In phiếu dịch vụ — không giá */}
            <Link
              href={`/medical-records/${id}/services/print`}
              target="_blank"
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
            >
              <Printer className="w-4 h-4" /> In phiếu dịch vụ
            </Link>
            {/* In đơn thuốc / TPCN — không giá */}
            {record.prescriptions?.map((presc: any) => {
              const isTPCN = presc.type === 'SUPPLEMENT_ORDER';
              return (
                <Link
                  key={presc.id}
                  href={`/prescriptions/${presc.id}/print`}
                  target="_blank"
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white ${
                    isTPCN ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  {isTPCN ? 'In đơn TPCN' : 'In đơn thuốc'}
                </Link>
              );
            })}
            {/* Đến hóa đơn để thanh toán + in hóa đơn (có giá) */}
            <Link
              href={`/billing/${invoicePreview.invoice.id}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
            >
              <CreditCard className="w-4 h-4" /> Hóa đơn & thanh toán
            </Link>
          </div>
          {(!record.prescriptions || record.prescriptions.length === 0) && (
            <p className="text-xs text-emerald-700">Không có đơn thuốc trong hồ sơ này.</p>
          )}
        </div>
      )}

      {/* Patient + doctor info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoItem label="Bệnh nhân" value={`${record.patient?.fullName} (${record.patient?.patientCode})`} />
          <InfoItem label="Bác sĩ" value={record.doctor?.user?.fullName ?? '—'} />
          <InfoItem label="Mã hồ sơ" value={record.recordCode} />
        </div>
      </div>

      {/* Vital signs from appointment */}
      {(() => {
        const vs = record.appointment?.vitalSigns as any;
        if (!vs || typeof vs !== 'object' || Object.keys(vs).length === 0) return null;
        const items: { label: string; value: string | null }[] = [
          vs.systolic != null && vs.diastolic != null
            ? { label: 'HA', value: `${vs.systolic}/${vs.diastolic} mmHg` }
            : null,
          vs.heartRate != null ? { label: 'Nhịp tim', value: `${vs.heartRate} bpm` } : null,
          vs.temperature != null ? { label: 'Nhiệt độ', value: `${vs.temperature} °C` } : null,
          vs.weight != null ? { label: 'Cân nặng', value: `${vs.weight} kg` } : null,
          vs.height != null ? { label: 'Chiều cao', value: `${vs.height} cm` } : null,
          vs.spo2 != null ? { label: 'SpO₂', value: `${vs.spo2} %` } : null,
        ].filter(Boolean) as { label: string; value: string }[];
        if (items.length === 0) return null;
        return (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-rose-500" />
              <h2 className="font-semibold text-gray-800 text-sm">Sinh hiệu</h2>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {items.map((item) => (
                <div key={item.label} className="flex flex-col">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className="font-semibold text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Main clinical info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
        <h2 className="font-semibold text-gray-800">Thông tin lâm sàng</h2>

        {/* Visit date */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Ngày khám</label>
          {editing && form ? (
            <input type="date" value={form.visitDate} onChange={set('visitDate')} className={inputCls} />
          ) : (
            <p className="text-sm text-gray-800">{fmtDateTime(record.visitDate)}</p>
          )}
        </div>

        {/* Chief complaint */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Lý do khám</label>
          {editing && form ? (
            <textarea rows={2} value={form.chiefComplaint} onChange={set('chiefComplaint')} className={textareaCls} />
          ) : (
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{record.chiefComplaint ?? '—'}</p>
          )}
        </div>

        {/* Physical exam */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Khám lâm sàng</label>
          {editing && form ? (
            <textarea rows={3} value={form.physicalExam} onChange={set('physicalExam')} className={textareaCls} />
          ) : (
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{record.physicalExam ?? '—'}</p>
          )}
        </div>

        {/* Clinical notes */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Ghi chú lâm sàng</label>
          {editing && form ? (
            <textarea rows={3} value={form.clinicalNotes} onChange={set('clinicalNotes')} className={textareaCls} />
          ) : (
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{record.clinicalNotes ?? '—'}</p>
          )}
        </div>

        {/* Diagnosis + ICD code */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Chẩn đoán</label>
            {editing && form ? (
              <input type="text" value={form.diagnosis} onChange={set('diagnosis')} className={inputCls} />
            ) : (
              <p className="text-sm text-gray-800">{record.diagnosis ?? '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mã ICD</label>
            {editing && form ? (
              <input type="text" value={form.icdCode} onChange={set('icdCode')} className={inputCls} placeholder="VD: J06.9" />
            ) : (
              <p className="text-sm text-gray-800 font-mono">{record.icdCode ?? '—'}</p>
            )}
          </div>
        </div>

        {/* Treatment */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Hướng điều trị</label>
          {editing && form ? (
            <textarea rows={3} value={form.treatment} onChange={set('treatment')} className={textareaCls} />
          ) : (
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{record.treatment ?? '—'}</p>
          )}
        </div>

        {/* Follow-up */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ngày tái khám</label>
            {editing && form ? (
              <input type="date" value={form.followUpDate} onChange={set('followUpDate')} className={inputCls} />
            ) : (
              <p className="text-sm text-gray-800">{fmt(record.followUpDate)}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Ghi chú tái khám</label>
            {editing && form ? (
              <input type="text" value={form.followUpNotes} onChange={set('followUpNotes')} className={inputCls} />
            ) : (
              <p className="text-sm text-gray-800">{record.followUpNotes ?? '—'}</p>
            )}
          </div>
        </div>
      </div>

      {/* New results banner */}
      {(() => {
        const newLabs = (record.labOrders ?? []).filter((o: any) => o.status === 'COMPLETED' && !o.reviewedAt);
        const newImgs = (record.imageOrders ?? []).filter((o: any) => o.status === 'COMPLETED' && !o.reviewedAt);
        const total = newLabs.length + newImgs.length;
        if (total === 0) return null;
        return (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex-shrink-0 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </span>
              <div>
                <p className="font-semibold text-amber-900">
                  {total} kết quả xét nghiệm mới chưa đọc
                </p>
                <p className="text-xs text-amber-700">
                  {newLabs.length > 0 && `${newLabs.length} xét nghiệm`}
                  {newLabs.length > 0 && newImgs.length > 0 && ' · '}
                  {newImgs.length > 0 && `${newImgs.length} CĐHA`}
                </p>
              </div>
            </div>
            <button onClick={handleMarkResultsRead} disabled={markingRead}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors">
              <CheckCircle className="w-4 h-4" />
              {markingRead ? 'Đang xử lý...' : 'Đánh dấu đã đọc'}
            </button>
          </div>
        );
      })()}

      {/* Lab orders & CĐHA section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-800">Chỉ định xét nghiệm & CĐHA</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLabModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Xét nghiệm
            </button>
            <button
              onClick={() => setShowImgModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded-lg font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> CĐHA
            </button>
          </div>
        </div>

        {/* Existing lab orders */}
        {record.labOrders?.map((lab: any) => (
          <div key={lab.id} className={`flex items-center justify-between p-3 rounded-lg text-sm border ${lab.status === 'COMPLETED' && !lab.reviewedAt ? 'bg-green-50 border-green-300' : 'bg-purple-50 border-transparent'}`}>
            <div>
              <span className="font-medium text-gray-800">{lab.testName}</span>
              {lab.service?.price && (
                <span className="ml-2 text-purple-600 font-medium">{formatCurrency(lab.service.price)}</span>
              )}
              {lab.result && <p className="text-xs text-green-700 mt-0.5">✓ {lab.result}</p>}
            </div>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                lab.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {lab.status === 'PENDING' ? 'Chờ XN' : lab.status === 'COMPLETED' ? 'Có kết quả' : lab.status}
            </span>
          </div>
        ))}

        {/* Existing image orders */}
        {record.imageOrders?.map((img: any) => (
          <div key={img.id} className={`flex items-center justify-between p-3 rounded-lg text-sm border ${img.status === 'COMPLETED' && !img.reviewedAt ? 'bg-green-50 border-green-300' : 'bg-teal-50 border-transparent'}`}>
            <div>
              <span className="font-medium text-gray-800">{img.imagingType}</span>
              {img.service?.price && (
                <span className="ml-2 text-teal-600 font-medium">{formatCurrency(img.service.price)}</span>
              )}
              {img.findings && <p className="text-xs text-green-700 mt-0.5">✓ {img.findings}</p>}
            </div>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                img.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {img.status === 'PENDING' ? 'Chờ CĐHA' : img.status === 'COMPLETED' ? 'Có kết quả' : img.status}
            </span>
          </div>
        ))}

        {!record.labOrders?.length && !record.imageOrders?.length && (
          <p className="text-gray-400 text-sm text-center py-4">Chưa có chỉ định xét nghiệm</p>
        )}
      </div>

      {/* Dịch vụ chỉ định */}
      <MedicalRecordServicesSection recordId={id} hasOrders={(record.labOrders?.length ?? 0) + (record.imageOrders?.length ?? 0) > 0} />

      {/* Prescriptions */}
      {record.prescriptions && record.prescriptions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            <h2 className="font-semibold text-gray-800">Đơn thuốc ({record.prescriptions.length})</h2>
          </div>
          {record.prescriptions.map((presc: any, pi: number) => (
            <div key={presc.id} className="border border-gray-100 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
                <span className="text-sm font-medium text-gray-700">Đơn {pi + 1}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRESC_STATUS_COLORS[presc.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {PRESC_STATUS[presc.status] ?? presc.status}
                  </span>
                  <Link href={`/prescriptions/${presc.id}/print`} target="_blank"
                    className="flex items-center gap-1 px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded text-xs font-medium transition-colors">
                    <Printer className="w-3 h-3" /> In đơn
                  </Link>
                </div>
              </div>
              {presc.items && presc.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-t border-gray-100">
                      <tr>
                        {['Tên thuốc', 'Liều dùng', 'Tần suất', 'Thời gian', 'Số lượng'].map((h) => (
                          <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {presc.items.map((item: any, ii: number) => (
                        <tr key={ii} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-800">
                            {item.drug?.name ?? '—'}
                            {item.drug?.unit && <span className="text-gray-400 font-normal ml-1">({item.drug.unit})</span>}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">{item.dosage ?? '—'}</td>
                          <td className="px-4 py-2.5 text-gray-600">{item.frequency ?? '—'}</td>
                          <td className="px-4 py-2.5 text-gray-600">{item.duration ?? '—'}</td>
                          <td className="px-4 py-2.5 text-gray-600">{item.quantity ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-sm px-4 py-3">Không có thuốc trong đơn</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lab order modal */}
      {showLabModal && (
        <Modal title="Chỉ định xét nghiệm" open={true} onClose={() => setShowLabModal(false)}>
          <LabOrderForm
            services={labServiceList}
            onSubmit={(d) => addLabOrder.mutate(d)}
            loading={addLabOrder.isPending}
          />
        </Modal>
      )}

      {/* Image order modal */}
      {showImgModal && (
        <Modal title="Chỉ định CĐHA" open={true} onClose={() => setShowImgModal(false)}>
          <ImgOrderForm
            services={imgServiceList}
            onSubmit={(d) => addImgOrder.mutate(d)}
            loading={addImgOrder.isPending}
          />
        </Modal>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

// ─── Section: Dịch vụ chỉ định ───────────────────────────────

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING:     { label: 'Chờ',         cls: 'bg-gray-100 text-gray-700' },
  IN_PROGRESS: { label: 'Đang làm',    cls: 'bg-amber-100 text-amber-700' },
  COMPLETED:   { label: 'Đã xong',     cls: 'bg-green-100 text-green-700' },
  SKIPPED:     { label: 'Bỏ qua',      cls: 'bg-red-100 text-red-600' },
};

const NEXT_STATUS: Record<string, string> = {
  PENDING: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  COMPLETED: 'PENDING',
  SKIPPED: 'PENDING',
};

function MedicalRecordServicesSection({ recordId, hasOrders = false }: { recordId: string; hasOrders?: boolean }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['mr-services', recordId],
    queryFn: async () => {
      const r = await fetch(`/api/medical-records/${recordId}/services`);
      return (await r.json()).data ?? [];
    },
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ['services-catalog'],
    queryFn: async () => {
      const r = await fetch('/api/services?pageSize=200');
      return (await r.json()).data ?? [];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['mr-services', recordId] });

  const addMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/medical-records/${recordId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: selectedServiceId, quantity, notes: notes || undefined }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error ?? 'Thêm thất bại'); }
    },
    onSuccess: () => {
      invalidate();
      setShowAdd(false); setSelectedServiceId(''); setQuantity(1); setNotes('');
      toast.success('Đã thêm dịch vụ');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: any }) => {
      const r = await fetch(`/api/medical-records/${recordId}/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error ?? 'Cập nhật thất bại'); }
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message),
  });

  const delMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/medical-records/${recordId}/services/${id}`, { method: 'DELETE' });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error ?? 'Xóa thất bại'); }
    },
    onSuccess: () => { invalidate(); toast.success('Đã xóa dịch vụ'); },
    onError: (e: any) => toast.error(e.message),
  });

  function move(item: any, direction: 'up' | 'down') {
    const idx = services.findIndex((s: any) => s.id === item.id);
    const target = direction === 'up' ? services[idx - 1] : services[idx + 1];
    if (!target) return;
    updateMutation.mutate({ id: item.id, body: { sequence: target.sequence } });
  }

  function toggleStatus(item: any) {
    updateMutation.mutate({ id: item.id, body: { status: NEXT_STATUS[item.status] ?? 'PENDING' } });
  }

  const total = services.reduce((s: number, i: any) =>
    i.status === 'SKIPPED' ? s : s + Number(i.unitPrice) * i.quantity, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-800">
            Dịch vụ chỉ định {services.length > 0 && <span className="text-gray-400 text-sm">({services.length})</span>}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="text-sm text-gray-600">
              Tổng: <span className="font-bold text-indigo-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}</span>
            </span>
          )}
          {(services.length > 0 || hasOrders) && (
            <Link
              href={`/medical-records/${recordId}/services/print`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-700 border border-sky-200 text-xs rounded-lg font-medium"
              title="In phiếu chỉ định dịch vụ (không kèm giá) cho bệnh nhân"
            >
              <Printer className="w-3.5 h-3.5" /> In phiếu DV
            </Link>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm dịch vụ
          </button>
        </div>
      </div>

      {isLoading && <Loader className="w-5 h-5 animate-spin text-gray-400 mx-auto" />}

      {!isLoading && services.length === 0 && !showAdd && (
        <p className="text-gray-400 text-sm text-center py-4">Chưa có dịch vụ chỉ định</p>
      )}

      {services.map((item: any, i: number) => (
        <div key={item.id} className={`flex items-center gap-2 p-3 rounded-lg border ${item.status === 'COMPLETED' ? 'bg-green-50 border-green-200' : item.status === 'IN_PROGRESS' ? 'bg-amber-50 border-amber-200' : item.status === 'SKIPPED' ? 'bg-red-50 border-red-200 opacity-70' : 'bg-gray-50 border-gray-200'}`}>
          {/* Sequence + arrows */}
          <div className="flex flex-col items-center gap-0.5 mr-1">
            <button onClick={() => move(item, 'up')} disabled={i === 0}
              className="p-0.5 text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed">
              <ArrowUp className="w-3 h-3" />
            </button>
            <span className="text-xs font-bold text-indigo-700">{item.sequence}</span>
            <button onClick={() => move(item, 'down')} disabled={i === services.length - 1}
              className="p-0.5 text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed">
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>

          {/* Service info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">{item.service.name}</p>
            <p className="text-xs text-gray-500">
              {item.service.code} · SL: {item.quantity} ×{' '}
              {new Intl.NumberFormat('vi-VN').format(Number(item.unitPrice))}đ
              {item.performer && <> · BS: {item.performer.fullName}</>}
            </p>
            {item.notes && <p className="text-xs text-gray-600 italic mt-0.5">{item.notes}</p>}
          </div>

          {/* Total */}
          <div className="text-sm font-bold text-indigo-700 whitespace-nowrap">
            {new Intl.NumberFormat('vi-VN').format(Number(item.unitPrice) * item.quantity)}đ
          </div>

          {/* Status pill (clickable) */}
          <button
            onClick={() => toggleStatus(item)}
            className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_LABELS[item.status]?.cls}`}
            title={`Đổi sang ${STATUS_LABELS[NEXT_STATUS[item.status]]?.label}`}
          >
            {STATUS_LABELS[item.status]?.label ?? item.status}
          </button>

          {/* Delete */}
          <button onClick={() => { if (confirm('Xóa dịch vụ này?')) delMutation.mutate(item.id); }}
            className="p-1 text-gray-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Add form */}
      {showAdd && (
        <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 bg-indigo-50 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Dịch vụ *</label>
            <select value={selectedServiceId} onChange={e => setSelectedServiceId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">— Chọn từ danh mục dịch vụ —</option>
              {catalog.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) — {new Intl.NumberFormat('vi-VN').format(Number(s.price))}đ
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Số lượng</label>
              <input type="number" min={1} value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú (không bắt buộc)</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="VD: ưu tiên làm trước"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowAdd(false); setSelectedServiceId(''); }}
              className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-white">
              Hủy
            </button>
            <button onClick={() => addMutation.mutate()} disabled={!selectedServiceId || addMutation.isPending}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium">
              {addMutation.isPending ? 'Đang thêm...' : 'Thêm vào hồ sơ'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
