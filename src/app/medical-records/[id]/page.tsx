'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, X, Save, Loader, AlertCircle, FileText, FlaskConical, ScanLine } from 'lucide-react';
import { toast } from 'sonner';

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

export default function MedicalRecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);

  const { data: record, isLoading, error } = useQuery({
    queryKey: ['medical-record', id],
    queryFn: async () => {
      const r = await fetch(`/api/medical-records/${id}`);
      if (!r.ok) throw new Error('Not found');
      const j = await r.json();
      return j.data;
    },
  });

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
    setForm(f => f ? { ...f, [key]: e.target.value } : f);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader className="w-8 h-8 animate-spin text-sky-600" />
    </div>
  );
  if (error || !record) return (
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
        <div className="ml-auto flex gap-2">
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

      {/* Patient + doctor info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoItem label="Bệnh nhân" value={`${record.patient?.fullName} (${record.patient?.patientCode})`} />
          <InfoItem label="Bác sĩ" value={record.doctor?.user?.fullName ?? '—'} />
          <InfoItem label="Mã hồ sơ" value={record.recordCode} />
        </div>
      </div>

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
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRESC_STATUS_COLORS[presc.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {PRESC_STATUS[presc.status] ?? presc.status}
                </span>
              </div>
              {presc.items && presc.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-t border-gray-100">
                      <tr>
                        {['Tên thuốc', 'Liều dùng', 'Tần suất', 'Thời gian', 'Số lượng'].map(h => (
                          <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
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

      {/* Lab orders */}
      {record.labOrders && record.labOrders.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-800">Xét nghiệm ({record.labOrders.length})</h2>
          </div>
          <div className="space-y-2">
            {record.labOrders.map((lab: any, i: number) => (
              <div key={lab.id ?? i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <span className="font-medium text-gray-800">{lab.testName ?? lab.name ?? `Xét nghiệm ${i + 1}`}</span>
                  {lab.notes && <p className="text-xs text-gray-500 mt-0.5">{lab.notes}</p>}
                </div>
                {lab.status && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">{lab.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image orders */}
      {record.imageOrders && record.imageOrders.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-teal-600" />
            <h2 className="font-semibold text-gray-800">Chẩn đoán hình ảnh ({record.imageOrders.length})</h2>
          </div>
          <div className="space-y-2">
            {record.imageOrders.map((img: any, i: number) => (
              <div key={img.id ?? i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <span className="font-medium text-gray-800">{img.imagingType ?? img.name ?? `Hình ảnh ${i + 1}`}</span>
                  {img.notes && <p className="text-xs text-gray-500 mt-0.5">{img.notes}</p>}
                </div>
                {img.status && (
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs font-medium">{img.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
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
