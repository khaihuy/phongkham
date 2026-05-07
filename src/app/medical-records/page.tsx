'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { MedicalRecord, Prescription, LabTest } from '@/types';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  FileText,
  Pill,
  FlaskConical,
  Calendar,
  User,
  Stethoscope,
} from 'lucide-react';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

const emptyPrescription = (): Prescription => ({
  id: generateId(),
  medicineName: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
  quantity: 1,
  unit: 'viên',
});

const emptyLabTest = (): LabTest => ({
  id: generateId(),
  testName: '',
  result: '',
  normalRange: '',
  unit: '',
  status: 'bình thường',
});

const emptyForm = {
  patientId: '',
  doctorId: '',
  appointmentId: '',
  visitDate: '',
  chiefComplaint: '',
  diagnosis: '',
  icdCode: '',
  symptoms: '',
  examination: '',
  treatment: '',
  prescriptions: [] as Prescription[],
  labTests: [] as LabTest[],
  followUpDate: '',
  notes: '',
};

type FormData = typeof emptyForm;

export default function MedicalRecordsPage() {
  const { medicalRecords, patients, doctors, appointments, addMedicalRecord, updateMedicalRecord, deleteMedicalRecord } = useStore();
  const [search, setSearch] = useState('');
  const [filterPatient, setFilterPatient] = useState('');
  const [page, setPage] = useState(1);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<MedicalRecord | null>(null);
  const PAGE_SIZE = 10;

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return medicalRecords
      .filter((r) => {
        const matchSearch =
          r.patientName.toLowerCase().includes(q) ||
          r.doctorName.toLowerCase().includes(q) ||
          r.diagnosis.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q);
        const matchPatient = !filterPatient || r.patientId === filterPatient;
        return matchSearch && matchPatient;
      })
      .sort((a, b) => b.visitDate.localeCompare(a.visitDate));
  }, [medicalRecords, search, filterPatient]);

  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  function openAdd() {
    setForm({ ...emptyForm, visitDate: todayStr });
    setSelectedRecord(null);
    setModalMode('add');
  }

  function openEdit(r: MedicalRecord) {
    setSelectedRecord(r);
    setForm({
      patientId: r.patientId,
      doctorId: r.doctorId,
      appointmentId: r.appointmentId || '',
      visitDate: r.visitDate,
      chiefComplaint: r.chiefComplaint,
      diagnosis: r.diagnosis,
      icdCode: r.icdCode || '',
      symptoms: r.symptoms,
      examination: r.examination,
      treatment: r.treatment,
      prescriptions: r.prescriptions,
      labTests: r.labTests || [],
      followUpDate: r.followUpDate || '',
      notes: r.notes || '',
    });
    setModalMode('edit');
  }

  function openView(r: MedicalRecord) {
    setSelectedRecord(r);
    setModalMode('view');
  }

  function closeModal() {
    setModalMode(null);
    setSelectedRecord(null);
    setForm(emptyForm);
  }

  function handleSubmit() {
    if (!form.patientId || !form.doctorId || !form.visitDate || !form.diagnosis) return;
    const patient = patients.find((p) => p.id === form.patientId);
    const doctor = doctors.find((d) => d.id === form.doctorId);
    if (!patient || !doctor) return;

    const data = {
      patientId: form.patientId,
      patientName: patient.fullName,
      doctorId: form.doctorId,
      doctorName: doctor.fullName,
      appointmentId: form.appointmentId || undefined,
      visitDate: form.visitDate,
      chiefComplaint: form.chiefComplaint,
      diagnosis: form.diagnosis,
      icdCode: form.icdCode || undefined,
      symptoms: form.symptoms,
      examination: form.examination,
      treatment: form.treatment,
      prescriptions: form.prescriptions,
      labTests: form.labTests.length > 0 ? form.labTests : undefined,
      followUpDate: form.followUpDate || undefined,
      notes: form.notes || undefined,
    };

    if (modalMode === 'add') {
      addMedicalRecord(data);
    } else if (modalMode === 'edit' && selectedRecord) {
      updateMedicalRecord(selectedRecord.id, data);
    }
    closeModal();
  }

  function addPrescription() {
    setForm({ ...form, prescriptions: [...form.prescriptions, emptyPrescription()] });
  }

  function removePrescription(idx: number) {
    setForm({ ...form, prescriptions: form.prescriptions.filter((_, i) => i !== idx) });
  }

  function updatePrescription(idx: number, field: keyof Prescription, value: string | number) {
    const p = [...form.prescriptions];
    p[idx] = { ...p[idx], [field]: value };
    setForm({ ...form, prescriptions: p });
  }

  function addLabTest() {
    setForm({ ...form, labTests: [...form.labTests, emptyLabTest()] });
  }

  function removeLabTest(idx: number) {
    setForm({ ...form, labTests: form.labTests.filter((_, i) => i !== idx) });
  }

  function updateLabTest(idx: number, field: keyof LabTest, value: string) {
    const lt = [...form.labTests];
    lt[idx] = { ...lt[idx], [field]: value };
    setForm({ ...form, labTests: lt });
  }

  const columns = [
    {
      key: 'code',
      header: 'Mã HS',
      render: (r: MedicalRecord) => (
        <span className="font-mono text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">{r.code}</span>
      ),
    },
    {
      key: 'date',
      header: 'Ngày khám',
      render: (r: MedicalRecord) => <span className="text-sm">{formatDate(r.visitDate)}</span>,
    },
    {
      key: 'patient',
      header: 'Bệnh nhân',
      render: (r: MedicalRecord) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-bold text-xs">{r.patientName.split(' ').pop()?.charAt(0)}</span>
          </div>
          <span className="font-medium text-gray-800 text-sm">{r.patientName}</span>
        </div>
      ),
    },
    {
      key: 'doctor',
      header: 'Bác sĩ',
      render: (r: MedicalRecord) => <span className="text-sm text-gray-600 max-w-[160px] block truncate">{r.doctorName}</span>,
    },
    {
      key: 'diagnosis',
      header: 'Chẩn đoán',
      render: (r: MedicalRecord) => (
        <div>
          <p className="text-sm font-medium text-gray-800 max-w-[200px] truncate">{r.diagnosis}</p>
          {r.icdCode && <p className="text-xs text-gray-400">ICD: {r.icdCode}</p>}
        </div>
      ),
    },
    {
      key: 'rx',
      header: 'Đơn thuốc',
      render: (r: MedicalRecord) => (
        <Badge variant="purple">{r.prescriptions.length} thuốc</Badge>
      ),
    },
    {
      key: 'followup',
      header: 'Tái khám',
      render: (r: MedicalRecord) => (
        r.followUpDate ? (
          <span className="text-sm text-amber-600 font-medium">{formatDate(r.followUpDate)}</span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (r: MedicalRecord) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openView(r)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteConfirm(r)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm hồ sơ..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm w-60 focus:ring-2 focus:ring-primary-300 outline-none"
            />
          </div>
          <select
            value={filterPatient}
            onChange={(e) => { setFilterPatient(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none"
          >
            <option value="">Tất cả bệnh nhân</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </select>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tạo hồ sơ bệnh án
        </button>
      </div>

      <Table
        columns={columns}
        data={paged}
        keyExtractor={(r) => r.id}
        emptyMessage="Không tìm thấy hồ sơ bệnh án nào"
        pagination={{ page, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage }}
      />

      {/* Add/Edit Modal */}
      <Modal
        open={modalMode === 'add' || modalMode === 'edit'}
        onClose={closeModal}
        title={modalMode === 'add' ? 'Tạo hồ sơ bệnh án mới' : 'Chỉnh sửa hồ sơ bệnh án'}
        size="xl"
        footer={
          <>
            <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors">Hủy</button>
            <button onClick={handleSubmit} className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors">
              {modalMode === 'add' ? 'Tạo hồ sơ' : 'Lưu thay đổi'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Basic Info */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Thông tin cơ bản</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bệnh nhân <span className="text-red-500">*</span></label>
                <select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none bg-white">
                  <option value="">-- Chọn bệnh nhân --</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.code} - {p.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bác sĩ <span className="text-red-500">*</span></label>
                <select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none bg-white">
                  <option value="">-- Chọn bác sĩ --</option>
                  {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ngày khám <span className="text-red-500">*</span></label>
                <input type="date" value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ngày tái khám</label>
                <input type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Lý do khám</label>
                <input type="text" value={form.chiefComplaint} onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none"
                  placeholder="Lý do đến khám..." />
              </div>
            </div>
          </div>

          {/* Clinical */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Thông tin lâm sàng</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Triệu chứng</label>
                <textarea value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none resize-none"
                  placeholder="Mô tả triệu chứng..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kết quả khám</label>
                <textarea value={form.examination} onChange={(e) => setForm({ ...form, examination: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none resize-none"
                  placeholder="Kết quả thăm khám lâm sàng..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Chẩn đoán <span className="text-red-500">*</span></label>
                  <input type="text" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none"
                    placeholder="Chẩn đoán bệnh..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mã ICD-10</label>
                  <input type="text" value={form.icdCode} onChange={(e) => setForm({ ...form, icdCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none"
                    placeholder="I10, E11..." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phương án điều trị</label>
                <textarea value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none resize-none"
                  placeholder="Phác đồ điều trị..." />
              </div>
            </div>
          </div>

          {/* Prescriptions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Pill className="w-4 h-4" /> Đơn thuốc ({form.prescriptions.length})</h4>
              <button onClick={addPrescription} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Thêm thuốc
              </button>
            </div>
            {form.prescriptions.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-xl">Chưa có thuốc trong đơn. Nhấn &quot;Thêm thuốc&quot;.</p>
            ) : (
              <div className="space-y-2">
                {form.prescriptions.map((rx, idx) => (
                  <div key={rx.id} className="p-3 bg-gray-50 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">Thuốc #{idx + 1}</span>
                      <button onClick={() => removePrescription(idx)} className="p-0.5 text-gray-400 hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Tên thuốc" value={rx.medicineName}
                        onChange={(e) => updatePrescription(idx, 'medicineName', e.target.value)}
                        className="col-span-2 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-300 outline-none bg-white" />
                      <input type="text" placeholder="Liều dùng (VD: 500mg)" value={rx.dosage}
                        onChange={(e) => updatePrescription(idx, 'dosage', e.target.value)}
                        className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-300 outline-none bg-white" />
                      <input type="text" placeholder="Tần suất (VD: 2 lần/ngày)" value={rx.frequency}
                        onChange={(e) => updatePrescription(idx, 'frequency', e.target.value)}
                        className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-300 outline-none bg-white" />
                      <input type="text" placeholder="Thời gian (VD: 7 ngày)" value={rx.duration}
                        onChange={(e) => updatePrescription(idx, 'duration', e.target.value)}
                        className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-300 outline-none bg-white" />
                      <input type="text" placeholder="Hướng dẫn dùng" value={rx.instructions}
                        onChange={(e) => updatePrescription(idx, 'instructions', e.target.value)}
                        className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-300 outline-none bg-white" />
                      <input type="number" placeholder="Số lượng" value={rx.quantity}
                        onChange={(e) => updatePrescription(idx, 'quantity', Number(e.target.value))}
                        className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-300 outline-none bg-white" />
                      <select value={rx.unit} onChange={(e) => updatePrescription(idx, 'unit', e.target.value)}
                        className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-300 outline-none bg-white">
                        {['viên', 'gói', 'chai', 'ống', 'tuýp', 'mg', 'ml'].map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lab Tests */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Xét nghiệm ({form.labTests.length})</h4>
              <button onClick={addLabTest} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Thêm xét nghiệm
              </button>
            </div>
            {form.labTests.length > 0 && (
              <div className="space-y-2">
                {form.labTests.map((lt, idx) => (
                  <div key={lt.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                    <input type="text" placeholder="Tên xét nghiệm" value={lt.testName}
                      onChange={(e) => updateLabTest(idx, 'testName', e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-300 outline-none bg-white" />
                    <input type="text" placeholder="Kết quả" value={lt.result}
                      onChange={(e) => updateLabTest(idx, 'result', e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-300 outline-none bg-white" />
                    <select value={lt.status} onChange={(e) => updateLabTest(idx, 'status', e.target.value)}
                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-300 outline-none bg-white">
                      <option value="bình thường">Bình thường</option>
                      <option value="bất thường">Bất thường</option>
                      <option value="chờ kết quả">Chờ kết quả</option>
                    </select>
                    <button onClick={() => removeLabTest(idx)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none resize-none"
              placeholder="Ghi chú thêm..." />
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={modalMode === 'view'}
        onClose={closeModal}
        title="Chi tiết hồ sơ bệnh án"
        size="xl"
        footer={
          <>
            <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors">Đóng</button>
            <button onClick={() => { if (selectedRecord) { closeModal(); setTimeout(() => openEdit(selectedRecord), 100); } }}
              className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors">Chỉnh sửa</button>
          </>
        }
      >
        {selectedRecord && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-primary-50 rounded-xl">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-lg">{selectedRecord.code}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{formatDate(selectedRecord.visitDate)}</span>
                </div>
                <h3 className="font-bold text-gray-800">{selectedRecord.patientName}</h3>
                <p className="text-sm text-gray-500">{selectedRecord.doctorName}</p>
              </div>
              {selectedRecord.followUpDate && (
                <div className="text-right">
                  <p className="text-xs text-gray-400">Tái khám</p>
                  <p className="text-sm font-semibold text-amber-600">{formatDate(selectedRecord.followUpDate)}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Section title="Lý do khám" content={selectedRecord.chiefComplaint} />
              <Section title="Triệu chứng" content={selectedRecord.symptoms} />
              <Section title="Kết quả khám" content={selectedRecord.examination} className="sm:col-span-2" />
              <Section title="Chẩn đoán" content={`${selectedRecord.diagnosis}${selectedRecord.icdCode ? ` (${selectedRecord.icdCode})` : ''}`} highlight />
              <Section title="Điều trị" content={selectedRecord.treatment} />
            </div>

            {/* Prescriptions */}
            {selectedRecord.prescriptions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-purple-500" /> Đơn thuốc ({selectedRecord.prescriptions.length} thuốc)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-3 py-2 font-semibold text-gray-500 rounded-tl-lg">Tên thuốc</th>
                        <th className="px-3 py-2 font-semibold text-gray-500">Liều</th>
                        <th className="px-3 py-2 font-semibold text-gray-500">Tần suất</th>
                        <th className="px-3 py-2 font-semibold text-gray-500">Thời gian</th>
                        <th className="px-3 py-2 font-semibold text-gray-500 rounded-tr-lg">SL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedRecord.prescriptions.map((rx) => (
                        <tr key={rx.id}>
                          <td className="px-3 py-2 font-medium text-gray-800">{rx.medicineName}</td>
                          <td className="px-3 py-2 text-gray-600">{rx.dosage}</td>
                          <td className="px-3 py-2 text-gray-600">{rx.frequency}</td>
                          <td className="px-3 py-2 text-gray-600">{rx.duration}</td>
                          <td className="px-3 py-2 text-gray-600">{rx.quantity} {rx.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Lab Tests */}
            {selectedRecord.labTests && selectedRecord.labTests.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-sky-500" /> Kết quả xét nghiệm
                </h4>
                <div className="space-y-1.5">
                  {selectedRecord.labTests.map((lt) => (
                    <div key={lt.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{lt.testName}</p>
                        <p className="text-xs text-gray-500">{lt.result}{lt.unit ? ` ${lt.unit}` : ''}</p>
                      </div>
                      <Badge variant={lt.status === 'bình thường' ? 'success' : lt.status === 'bất thường' ? 'danger' : 'warning'}>
                        {lt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedRecord.notes && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs font-medium text-amber-700 mb-1">Ghi chú</p>
                <p className="text-sm text-amber-800">{selectedRecord.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Xác nhận xóa"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors">Hủy</button>
            <button onClick={() => { if (deleteConfirm) { deleteMedicalRecord(deleteConfirm.id); setDeleteConfirm(null); } }}
              className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">Xóa</button>
          </>
        }
      >
        <div className="text-center py-2">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-gray-700 text-sm">Xóa hồ sơ <span className="font-bold">{deleteConfirm?.code}</span> của <span className="font-bold">{deleteConfirm?.patientName}</span>?</p>
        </div>
      </Modal>
    </div>
  );
}

function Section({ title, content, className = '', highlight }: { title: string; content: string; className?: string; highlight?: boolean }) {
  return (
    <div className={`p-3 ${highlight ? 'bg-primary-50 border border-primary-100' : 'bg-gray-50'} rounded-xl ${className}`}>
      <p className={`text-xs font-medium mb-1 ${highlight ? 'text-primary-600' : 'text-gray-500'}`}>{title}</p>
      <p className={`text-sm ${highlight ? 'font-semibold text-primary-800' : 'text-gray-700'}`}>{content || '—'}</p>
    </div>
  );
}
