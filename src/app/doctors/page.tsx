'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Doctor, DoctorSchedule } from '@/types';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  X,
  Star,
  Phone,
  Mail,
  Award,
  Clock,
  DollarSign,
} from 'lucide-react';

const DAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DAYS_FULL = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const SPECIALTIES = [
  'Nội tổng quát',
  'Tim mạch',
  'Nội tiết - Tiểu đường',
  'Da liễu',
  'Tiêu hóa',
  'Nhi khoa',
  'Thần kinh',
  'Cơ xương khớp',
  'Tai mũi họng',
  'Mắt',
  'Răng hàm mặt',
  'Sản phụ khoa',
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

const emptyForm = {
  fullName: '',
  specialty: '',
  phone: '',
  email: '',
  licenseNumber: '',
  education: '',
  experience: 0,
  consultationFee: 300000,
  bio: '',
  status: 'active' as 'active' | 'inactive',
  schedule: [] as DoctorSchedule[],
};

type FormData = typeof emptyForm;

const emptySchedule: DoctorSchedule = { dayOfWeek: 1, startTime: '07:30', endTime: '11:30' };

export default function DoctorsPage() {
  const { doctors, addDoctor, updateDoctor, deleteDoctor } = useStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<Doctor | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return doctors.filter((d) => {
      const matchSearch =
        d.fullName.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'all' || d.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [doctors, search, filterStatus]);

  function openAdd() {
    setForm(emptyForm);
    setSelectedDoctor(null);
    setModalMode('add');
  }

  function openEdit(d: Doctor) {
    setSelectedDoctor(d);
    setForm({
      fullName: d.fullName,
      specialty: d.specialty,
      phone: d.phone,
      email: d.email,
      licenseNumber: d.licenseNumber,
      education: d.education,
      experience: d.experience,
      consultationFee: d.consultationFee,
      bio: d.bio || '',
      status: d.status,
      schedule: d.schedule,
    });
    setModalMode('edit');
  }

  function openView(d: Doctor) {
    setSelectedDoctor(d);
    setModalMode('view');
  }

  function closeModal() {
    setModalMode(null);
    setSelectedDoctor(null);
    setForm(emptyForm);
  }

  function handleSubmit() {
    if (!form.fullName || !form.specialty || !form.phone || !form.email) return;
    const data = {
      fullName: form.fullName,
      specialty: form.specialty,
      phone: form.phone,
      email: form.email,
      licenseNumber: form.licenseNumber,
      education: form.education,
      experience: form.experience,
      consultationFee: form.consultationFee,
      bio: form.bio || undefined,
      status: form.status,
      schedule: form.schedule,
    };
    if (modalMode === 'add') {
      addDoctor(data);
    } else if (modalMode === 'edit' && selectedDoctor) {
      updateDoctor(selectedDoctor.id, data);
    }
    closeModal();
  }

  function addScheduleRow() {
    setForm({ ...form, schedule: [...form.schedule, { ...emptySchedule }] });
  }

  function removeScheduleRow(idx: number) {
    setForm({ ...form, schedule: form.schedule.filter((_, i) => i !== idx) });
  }

  function updateScheduleRow(idx: number, field: keyof DoctorSchedule, value: string | number) {
    const s = [...form.schedule];
    s[idx] = { ...s[idx], [field]: typeof value === 'number' ? value : value };
    setForm({ ...form, schedule: s });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tên, chuyên khoa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm w-60 focus:ring-2 focus:ring-primary-300 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none"
          >
            <option value="all">Tất cả</option>
            <option value="active">Đang làm việc</option>
            <option value="inactive">Nghỉ</option>
          </select>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm bác sĩ
        </button>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((doctor) => (
          <DoctorCard
            key={doctor.id}
            doctor={doctor}
            onView={() => openView(doctor)}
            onEdit={() => openEdit(doctor)}
            onDelete={() => setDeleteConfirm(doctor)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-400">
            <p className="text-lg font-medium">Không tìm thấy bác sĩ nào</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalMode === 'add' || modalMode === 'edit'}
        onClose={closeModal}
        title={modalMode === 'add' ? 'Thêm bác sĩ mới' : 'Chỉnh sửa thông tin bác sĩ'}
        size="xl"
        footer={
          <>
            <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors">
              Hủy
            </button>
            <button onClick={handleSubmit} className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors">
              {modalMode === 'add' ? 'Thêm bác sĩ' : 'Lưu thay đổi'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên <span className="text-red-500">*</span></label>
            <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none"
              placeholder="TS.BS. Nguyễn Văn A" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chuyên khoa <span className="text-red-500">*</span></label>
            <select value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none bg-white">
              <option value="">-- Chọn chuyên khoa --</option>
              {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none bg-white">
              <option value="active">Đang làm việc</option>
              <option value="inactive">Tạm nghỉ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none"
              placeholder="09xx xxx xxx" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none"
              placeholder="bacsi@phongkham.vn" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số chứng chỉ hành nghề</label>
            <input type="text" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none"
              placeholder="GP-xxxxxx" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kinh nghiệm (năm)</label>
            <input type="number" min={0} value={form.experience} onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Học vấn</label>
            <input type="text" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none"
              placeholder="Tiến sĩ Y khoa - Đại học Y Hà Nội" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phí khám (VND)</label>
            <input type="number" min={0} step={50000} value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Giới thiệu</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none resize-none"
              placeholder="Mô tả ngắn về bác sĩ..." />
          </div>

          {/* Schedule */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Lịch làm việc</label>
              <button onClick={addScheduleRow} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Thêm ca
              </button>
            </div>
            <div className="space-y-2">
              {form.schedule.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                  <select value={s.dayOfWeek} onChange={(e) => updateScheduleRow(idx, 'dayOfWeek', Number(e.target.value))}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none flex-1">
                    {DAYS_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                  <input type="time" value={s.startTime} onChange={(e) => updateScheduleRow(idx, 'startTime', e.target.value)}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none w-24" />
                  <span className="text-gray-400 text-xs">—</span>
                  <input type="time" value={s.endTime} onChange={(e) => updateScheduleRow(idx, 'endTime', e.target.value)}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none w-24" />
                  <button onClick={() => removeScheduleRow(idx)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {form.schedule.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">Chưa có lịch làm việc. Nhấn &quot;Thêm ca&quot; để thêm.</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={modalMode === 'view'}
        onClose={closeModal}
        title="Thông tin bác sĩ"
        size="lg"
        footer={
          <>
            <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors">Đóng</button>
            <button onClick={() => { if (selectedDoctor) { closeModal(); setTimeout(() => openEdit(selectedDoctor), 100); } }}
              className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors">Chỉnh sửa</button>
          </>
        }
      >
        {selectedDoctor && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary-50 to-sky-50 rounded-xl">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {selectedDoctor.fullName.split(' ').pop()?.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{selectedDoctor.fullName}</h3>
                <p className="text-sm text-gray-500">{selectedDoctor.specialty}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={selectedDoctor.status === 'active' ? 'success' : 'gray'} dot>
                    {selectedDoctor.status === 'active' ? 'Đang làm việc' : 'Tạm nghỉ'}
                  </Badge>
                  <Badge variant="info">{selectedDoctor.code}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                <div><p className="text-xs text-gray-500">Điện thoại</p><p className="text-sm font-medium text-gray-800">{selectedDoctor.phone}</p></div>
              </div>
              <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl">
                <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                <div><p className="text-xs text-gray-500">Email</p><p className="text-sm font-medium text-gray-800">{selectedDoctor.email}</p></div>
              </div>
              <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl">
                <Award className="w-4 h-4 text-gray-400 mt-0.5" />
                <div><p className="text-xs text-gray-500">CCHN</p><p className="text-sm font-medium text-gray-800">{selectedDoctor.licenseNumber}</p></div>
              </div>
              <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl">
                <Star className="w-4 h-4 text-gray-400 mt-0.5" />
                <div><p className="text-xs text-gray-500">Kinh nghiệm</p><p className="text-sm font-medium text-gray-800">{selectedDoctor.experience} năm</p></div>
              </div>
              <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl sm:col-span-2">
                <Award className="w-4 h-4 text-gray-400 mt-0.5" />
                <div><p className="text-xs text-gray-500">Học vấn</p><p className="text-sm font-medium text-gray-800">{selectedDoctor.education}</p></div>
              </div>
              <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl">
                <DollarSign className="w-4 h-4 text-gray-400 mt-0.5" />
                <div><p className="text-xs text-gray-500">Phí khám</p><p className="text-sm font-medium text-gray-800">{formatCurrency(selectedDoctor.consultationFee)}</p></div>
              </div>
            </div>

            {selectedDoctor.bio && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs font-medium text-gray-500 mb-1">Giới thiệu</p>
                <p className="text-sm text-gray-700">{selectedDoctor.bio}</p>
              </div>
            )}

            {selectedDoctor.schedule.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" /> Lịch làm việc
                </p>
                <div className="space-y-1.5">
                  {selectedDoctor.schedule.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-lg">
                      <span className="text-xs font-semibold text-primary-700 w-12">{DAYS_FULL[s.dayOfWeek]}</span>
                      <span className="text-xs text-gray-600">{s.startTime} – {s.endTime}</span>
                    </div>
                  ))}
                </div>
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
            <button onClick={() => { if (deleteConfirm) { deleteDoctor(deleteConfirm.id); setDeleteConfirm(null); } }}
              className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">Xóa</button>
          </>
        }
      >
        <div className="text-center py-2">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-gray-700 text-sm">Xóa bác sĩ <span className="font-bold">{deleteConfirm?.fullName}</span>?</p>
        </div>
      </Modal>
    </div>
  );
}

interface DoctorCardProps {
  doctor: Doctor;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function DoctorCard({ doctor, onView, onEdit, onDelete }: DoctorCardProps) {
  const DAYS_FULL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const workDays = [...new Set(doctor.schedule.map((s) => s.dayOfWeek))].sort();

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5 hover:border-primary-200 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {doctor.fullName.split(' ').pop()?.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-800 text-sm leading-tight">{doctor.fullName}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{doctor.code}</p>
          </div>
        </div>
        <Badge variant={doctor.status === 'active' ? 'success' : 'gray'} dot>
          {doctor.status === 'active' ? 'Hoạt động' : 'Nghỉ'}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 bg-primary-100 rounded-md flex items-center justify-center flex-shrink-0">
            <Star className="w-3 h-3 text-primary-600" />
          </span>
          <span className="text-sm text-gray-700 font-medium">{doctor.specialty}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
            <Award className="w-3 h-3 text-gray-500" />
          </span>
          <span className="text-xs text-gray-500">{doctor.experience} năm kinh nghiệm</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 bg-emerald-100 rounded-md flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-3 h-3 text-emerald-600" />
          </span>
          <span className="text-xs text-gray-500">
            Phí khám: <span className="font-semibold text-gray-700">{new Intl.NumberFormat('vi-VN').format(doctor.consultationFee)}đ</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 bg-amber-100 rounded-md flex items-center justify-center flex-shrink-0">
            <Clock className="w-3 h-3 text-amber-600" />
          </span>
          <div className="flex gap-1 flex-wrap">
            {workDays.map((d) => (
              <span key={d} className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                {DAYS_FULL[d]}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 pt-3 border-t border-gray-50">
        <button onClick={onView} className="flex-1 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
          Xem chi tiết
        </button>
        <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
