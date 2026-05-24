'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, Plus, User, Phone, Mail, MapPin, Heart, Activity, Calendar, FileText, AlertTriangle, Loader, AlertCircle, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

function fmt(d: string) { return new Date(d).toLocaleDateString('vi-VN'); }
function age(d: string) {
  const y = new Date().getFullYear() - new Date(d).getFullYear();
  return y;
}

const BLOOD_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-', UNKNOWN: 'Chưa xác định',
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ khám', CONFIRMED: 'Xác nhận', IN_PROGRESS: 'Đang khám',
  COMPLETED: 'Hoàn thành', CANCELLED: 'Hủy', NO_SHOW: 'Không đến',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700', CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700', COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500', NO_SHOW: 'bg-red-100 text-red-700',
};

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'info' | 'appointments' | 'records' | 'billing' | 'vitals' | 'allergies'>('info');
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [allergyModal, setAllergyModal] = useState(false);
  const [vitalModal, setVitalModal] = useState(false);
  const [editPatientModal, setEditPatientModal] = useState(false);
  const [allergyForm, setAllergyForm] = useState({ allergen: '', reaction: '', severity: 'Nhẹ' });
  const [vitalForm, setVitalForm] = useState({ weight: '', height: '', bloodPressureSystolic: '', bloodPressureDiastolic: '', heartRate: '', temperature: '', oxygenSat: '' });
  const [editPatientForm, setEditPatientForm] = useState({
    fullName: '', phone: '', email: '', address: '', occupation: '',
    emergencyContact: '', emergencyPhone: '', bloodType: 'UNKNOWN', allergiesNote: '',
  });

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const r = await fetch(`/api/patients/${id}`);
      if (!r.ok) throw new Error('Not found');
      const j = await r.json();
      return j.data;
    },
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-appointments', id],
    queryFn: async () => {
      const r = await fetch(`/api/appointments?patientId=${id}&pageSize=50`);
      const j = await r.json();
      return j.data ?? [];
    },
    enabled: tab === 'appointments',
  });

  const { data: records = [] } = useQuery({
    queryKey: ['patient-records', id],
    queryFn: async () => {
      const r = await fetch(`/api/medical-records?patientId=${id}&pageSize=50`);
      const j = await r.json();
      return j.data ?? [];
    },
    enabled: tab === 'records',
  });

  const { data: billingData } = useQuery({
    queryKey: ['patient-billing', id],
    queryFn: async () => {
      const r = await fetch(`/api/invoices?patientId=${id}&pageSize=20`);
      return (await r.json()).data ?? [];
    },
    enabled: tab === 'billing',
  });

  const addAllergy = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch('/api/patients/' + id + '/allergies', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient', id] }); toast.success('Đã thêm dị ứng'); setAllergyModal(false); setAllergyForm({ allergen: '', reaction: '', severity: 'Nhẹ' }); },
    onError: () => toast.error('Thêm dị ứng thất bại'),
  });

  const addVital = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch('/api/patients/' + id + '/vitals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient', id] }); toast.success('Đã lưu chỉ số'); setVitalModal(false); },
    onError: () => toast.error('Lưu thất bại'),
  });

  const updatePatient = useMutation({
    mutationFn: async (data: typeof editPatientForm) => {
      const r = await fetch('/api/patients/' + id, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? 'Cập nhật thất bại');
      }
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient', id] });
      toast.success('Đã cập nhật thông tin bệnh nhân');
      setEditPatientModal(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleOpenEditPatient = () => {
    if (!patient) return;
    setEditPatientForm({
      fullName: patient.fullName ?? '',
      phone: patient.phone ?? '',
      email: patient.email ?? '',
      address: patient.address ?? '',
      occupation: patient.occupation ?? '',
      emergencyContact: patient.emergencyContact ?? patient.emergencyName ?? '',
      emergencyPhone: patient.emergencyPhone ?? '',
      bloodType: patient.bloodType ?? 'UNKNOWN',
      allergiesNote: patient.allergiesNote ?? '',
    });
    setEditPatientModal(true);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader className="w-8 h-8 animate-spin text-sky-600" /></div>;
  if (error || !patient) return <div className="flex items-center justify-center h-64 text-red-600"><AlertCircle className="w-8 h-8 mr-2" /> Không tìm thấy bệnh nhân</div>;

  const TABS = [
    { key: 'info', label: 'Thông tin' },
    { key: 'appointments', label: 'Lịch hẹn' },
    { key: 'records', label: 'Hồ sơ khám' },
    { key: 'billing', label: '💳 Hóa đơn' },
    { key: 'vitals', label: 'Chỉ số' },
    { key: 'allergies', label: 'Dị ứng' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{patient.fullName}</h1>
          <p className="text-sm text-gray-500">{patient.patientCode} · {age(patient.dateOfBirth)} tuổi · {patient.gender === 'MALE' ? 'Nam' : 'Nữ'}</p>
        </div>
        <Link href={`/medical-records/new?patientId=${id}`}>
          <button className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Tạo hồ sơ khám
          </button>
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <Heart className="w-5 h-5 text-red-500" />
          <div><p className="text-xs text-gray-500">Nhóm máu</p><p className="font-semibold text-sm">{BLOOD_LABELS[patient.bloodType] ?? '—'}</p></div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <div><p className="text-xs text-gray-500">Dị ứng</p><p className="font-semibold text-sm">{patient.allergies?.length ?? 0} loại</p></div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-500" />
          <div><p className="text-xs text-gray-500">Lịch hẹn</p><p className="font-semibold text-sm">{patient.appointments?.length ?? 0}</p></div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <FileText className="w-5 h-5 text-green-500" />
          <div><p className="text-xs text-gray-500">Hồ sơ khám</p><p className="font-semibold text-sm">{patient.medicalRecords?.length ?? 0}</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${tab === t.key ? 'border-b-2 border-sky-600 text-sky-600 bg-sky-50' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'info' && (
            <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700 text-sm">Thông tin bệnh nhân</h3>
              <button
                onClick={handleOpenEditPatient}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium"
              >
                <Edit2 className="w-3.5 h-3.5" /> Chỉnh sửa
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 text-sm">Thông tin cơ bản</h3>
                <Row icon={<User className="w-4 h-4" />} label="Họ tên" value={patient.fullName} />
                <Row icon={<Calendar className="w-4 h-4" />} label="Ngày sinh" value={`${fmt(patient.dateOfBirth)} (${age(patient.dateOfBirth)} tuổi)`} />
                <Row icon={<Phone className="w-4 h-4" />} label="Điện thoại" value={patient.phone} />
                <Row icon={<Mail className="w-4 h-4" />} label="Email" value={patient.email ?? '—'} />
                <Row icon={<MapPin className="w-4 h-4" />} label="Địa chỉ" value={[patient.address, patient.ward, patient.district, patient.province].filter(Boolean).join(', ') || '—'} />
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 text-sm">Thông tin y tế</h3>
                <Row icon={<Heart className="w-4 h-4" />} label="Nhóm máu" value={BLOOD_LABELS[patient.bloodType]} />
                <Row icon={<User className="w-4 h-4" />} label="CCCD/CMND" value={patient.idCardNo ?? '—'} />
                <Row icon={<Activity className="w-4 h-4" />} label="BHYT" value={patient.insuranceNo ?? '—'} />
                {patient.emergencyName && (
                  <Row icon={<Phone className="w-4 h-4" />} label="Liên hệ khẩn" value={`${patient.emergencyName} (${patient.emergencyRel}) — ${patient.emergencyPhone}`} />
                )}
                {patient.notes && <Row icon={<FileText className="w-4 h-4" />} label="Ghi chú" value={patient.notes} />}
              </div>
            </div>
            </div>
          )}

          {tab === 'appointments' && (
            <div className="space-y-3">
              {appointments.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Chưa có lịch hẹn</p>
              ) : appointments.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{a.appointmentCode} — {a.chiefComplaint ?? 'Khám bệnh'}</p>
                    <p className="text-xs text-gray-500">{fmt(a.scheduledDate)} {a.scheduledTime} · {a.doctor?.user?.fullName ?? ''}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[a.status] ?? a.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === 'records' && (
            <div className="space-y-3">
              {records.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Chưa có hồ sơ bệnh án</p>
              ) : records.map((rec: any) => (
                <div key={rec.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedRecord(expandedRecord === rec.id ? null : rec.id)}>
                    <div>
                      <p className="font-semibold text-gray-800">{rec.recordCode}</p>
                      <p className="text-sm text-gray-500">{new Date(rec.visitDate).toLocaleDateString('vi-VN')} · BS: {rec.doctor?.user?.fullName ?? '—'}</p>
                      {rec.diagnosis && <p className="text-sm text-sky-700 mt-0.5">CĐ: {rec.diagnosis}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/medical-records/${rec.id}`} onClick={e => e.stopPropagation()}
                        className="px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-lg text-xs font-medium">
                        Xem chi tiết
                      </Link>
                      <span className="text-gray-400">{expandedRecord === rec.id ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {expandedRecord === rec.id && (
                    <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-gray-50 text-sm">
                      {rec.prescriptions?.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-600 mb-1">💊 Đơn thuốc:</p>
                          {rec.prescriptions.map((p: any) => (
                            <div key={p.id} className="pl-3 border-l-2 border-amber-300">
                              {p.items?.map((item: any, i: number) => (
                                <p key={i} className="text-gray-700">{item.drug?.name} {item.drug?.strength} — {item.dosage} × {item.frequency} × {item.duration} (SL: {item.quantity})</p>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      {rec.labOrders?.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-600 mb-1">🔬 Xét nghiệm:</p>
                          {rec.labOrders.map((lab: any) => (
                            <p key={lab.id} className="pl-3 border-l-2 border-purple-300 text-gray-700">
                              {lab.testName} {lab.result && <span className="text-green-700">→ {lab.result}</span>}
                            </p>
                          ))}
                        </div>
                      )}
                      {rec.imageOrders?.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-600 mb-1">🩻 CĐHA:</p>
                          {rec.imageOrders.map((img: any) => (
                            <p key={img.id} className="pl-3 border-l-2 border-teal-300 text-gray-700">
                              {img.imagingType} {img.findings && <span className="text-green-700">→ {img.findings}</span>}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'billing' && (
            <div className="space-y-3">
              {!billingData ? (
                <div className="text-center py-8 text-gray-400">Đang tải...</div>
              ) : billingData.length === 0 ? (
                <div className="text-center py-8 text-gray-400">Chưa có hóa đơn</div>
              ) : billingData.map((inv: any) => (
                <Link key={inv.id} href={`/billing/${inv.id}`}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-sky-200 hover:shadow-md transition-all">
                  <div>
                    <p className="font-semibold text-gray-800 font-mono">{inv.invoiceCode}</p>
                    <p className="text-sm text-gray-500">{new Date(inv.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(inv.totalAmount))}</p>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                      inv.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                      'bg-blue-100 text-blue-700'
                    }`}>{inv.status === 'PAID' ? 'Đã thanh toán' : inv.status === 'DRAFT' ? 'Nháp' : 'Chưa thanh toán'}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {tab === 'vitals' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setVitalModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-sm">
                  <Plus className="w-4 h-4" /> Ghi chỉ số
                </button>
              </div>
              {(!patient.vitals || patient.vitals.length === 0) ? (
                <p className="text-gray-400 text-center py-8">Chưa có chỉ số sinh tồn</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Ngày', 'Cân (kg)', 'Chiều cao (cm)', 'BMI', 'Huyết áp', 'Nhịp tim', 'Nhiệt độ', 'SpO2'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {patient.vitals.map((v: any) => (
                        <tr key={v.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-xs">{fmt(v.recordedAt)}</td>
                          <td className="px-3 py-2">{v.weight ?? '—'}</td>
                          <td className="px-3 py-2">{v.height ?? '—'}</td>
                          <td className="px-3 py-2">{v.bmi ? Number(v.bmi).toFixed(1) : '—'}</td>
                          <td className="px-3 py-2">{v.bloodPressureSystolic && v.bloodPressureDiastolic ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}` : '—'}</td>
                          <td className="px-3 py-2">{v.heartRate ?? '—'}</td>
                          <td className="px-3 py-2">{v.temperature ?? '—'}</td>
                          <td className="px-3 py-2">{v.oxygenSat ? `${v.oxygenSat}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'allergies' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setAllergyModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-sm">
                  <Plus className="w-4 h-4" /> Thêm dị ứng
                </button>
              </div>
              {(!patient.allergies || patient.allergies.length === 0) ? (
                <p className="text-gray-400 text-center py-8">Chưa ghi nhận dị ứng</p>
              ) : (
                <div className="space-y-3">
                  {patient.allergies.map((a: any) => (
                    <div key={a.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-red-800">{a.allergen}</p>
                        {a.reaction && <p className="text-xs text-red-600">Phản ứng: {a.reaction}</p>}
                        {a.severity && <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">{a.severity}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Allergy Modal */}
      {allergyModal && (
        <Modal title="Thêm dị ứng" open={true} onClose={() => setAllergyModal(false)}>
          <form onSubmit={e => { e.preventDefault(); addAllergy.mutate(allergyForm); }} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chất gây dị ứng *</label>
              <input type="text" value={allergyForm.allergen} onChange={e => setAllergyForm(f => ({ ...f, allergen: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phản ứng</label>
              <input type="text" value={allergyForm.reaction} onChange={e => setAllergyForm(f => ({ ...f, reaction: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ</label>
              <select value={allergyForm.severity} onChange={e => setAllergyForm(f => ({ ...f, severity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option>Nhẹ</option><option>Trung bình</option><option>Nặng</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={addAllergy.isPending}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium disabled:bg-gray-400">
                {addAllergy.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button type="button" onClick={() => setAllergyModal(false)} className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50">Hủy</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Vital Signs Modal */}
      {vitalModal && (
        <Modal title="Ghi chỉ số sinh tồn" open={true} onClose={() => setVitalModal(false)}>
          <form onSubmit={e => {
            e.preventDefault();
            const data: any = {};
            if (vitalForm.weight) data.weight = parseFloat(vitalForm.weight);
            if (vitalForm.height) data.height = parseFloat(vitalForm.height);
            if (vitalForm.weight && vitalForm.height) data.bmi = parseFloat(vitalForm.weight) / Math.pow(parseFloat(vitalForm.height) / 100, 2);
            if (vitalForm.bloodPressureSystolic) data.bloodPressureSystolic = parseInt(vitalForm.bloodPressureSystolic);
            if (vitalForm.bloodPressureDiastolic) data.bloodPressureDiastolic = parseInt(vitalForm.bloodPressureDiastolic);
            if (vitalForm.heartRate) data.heartRate = parseInt(vitalForm.heartRate);
            if (vitalForm.temperature) data.temperature = parseFloat(vitalForm.temperature);
            if (vitalForm.oxygenSat) data.oxygenSat = parseInt(vitalForm.oxygenSat);
            addVital.mutate(data);
          }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'weight', label: 'Cân nặng (kg)', placeholder: '65' },
                { key: 'height', label: 'Chiều cao (cm)', placeholder: '170' },
                { key: 'bloodPressureSystolic', label: 'Huyết áp tâm thu', placeholder: '120' },
                { key: 'bloodPressureDiastolic', label: 'Huyết áp tâm trương', placeholder: '80' },
                { key: 'heartRate', label: 'Nhịp tim (lần/phút)', placeholder: '72' },
                { key: 'temperature', label: 'Nhiệt độ (°C)', placeholder: '36.5' },
                { key: 'oxygenSat', label: 'SpO2 (%)', placeholder: '98' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type="number" step="any" placeholder={f.placeholder}
                    value={(vitalForm as any)[f.key]}
                    onChange={e => setVitalForm(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={addVital.isPending}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm disabled:bg-gray-400">
                {addVital.isPending ? 'Đang lưu...' : 'Lưu chỉ số'}
              </button>
              <button type="button" onClick={() => setVitalModal(false)} className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50">Hủy</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Patient Modal */}
      {editPatientModal && (
        <Modal title="Chỉnh sửa thông tin bệnh nhân" open={true} onClose={() => setEditPatientModal(false)} size="lg">
          <form onSubmit={e => { e.preventDefault(); updatePatient.mutate(editPatientForm); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                <input type="text" value={editPatientForm.fullName}
                  onChange={e => setEditPatientForm(f => ({ ...f, fullName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại</label>
                <input type="tel" value={editPatientForm.phone}
                  onChange={e => setEditPatientForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={editPatientForm.email}
                  onChange={e => setEditPatientForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nghề nghiệp</label>
                <input type="text" value={editPatientForm.occupation}
                  onChange={e => setEditPatientForm(f => ({ ...f, occupation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <input type="text" value={editPatientForm.address}
                  onChange={e => setEditPatientForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhóm máu</label>
                <select value={editPatientForm.bloodType}
                  onChange={e => setEditPatientForm(f => ({ ...f, bloodType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
                  {Object.entries(BLOOD_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Người liên hệ khẩn</label>
                <input type="text" value={editPatientForm.emergencyContact}
                  onChange={e => setEditPatientForm(f => ({ ...f, emergencyContact: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SĐT liên hệ khẩn</label>
                <input type="tel" value={editPatientForm.emergencyPhone}
                  onChange={e => setEditPatientForm(f => ({ ...f, emergencyPhone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú dị ứng</label>
                <input type="text" value={editPatientForm.allergiesNote}
                  onChange={e => setEditPatientForm(f => ({ ...f, allergiesNote: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="VD: Dị ứng Penicillin, Aspirin..." />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={updatePatient.isPending}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium disabled:bg-gray-400">
                {updatePatient.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button type="button" onClick={() => setEditPatientModal(false)}
                className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50">Hủy</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <span className="text-gray-500 w-28 shrink-0">{label}:</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}
