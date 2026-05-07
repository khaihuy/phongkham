'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Patient, Gender, BloodType } from '@/types';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  User,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  X,
} from 'lucide-react';

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

const emptyForm = {
  fullName: '',
  dateOfBirth: '',
  gender: 'Nam' as Gender,
  phone: '',
  email: '',
  address: '',
  bloodType: '' as BloodType | '',
  allergies: '',
  chronicDiseases: '',
  emergencyContact: '',
  emergencyPhone: '',
  insuranceNumber: '',
  notes: '',
};

type FormData = typeof emptyForm;

export default function PatientsPage() {
  const { patients, addPatient, updatePatient, deletePatient } = useStore();
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<Patient | null>(null);
  const PAGE_SIZE = 10;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
    );
  }, [patients, search]);

  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  function openAdd() {
    setForm(emptyForm);
    setSelectedPatient(null);
    setModalMode('add');
  }

  function openEdit(p: Patient) {
    setSelectedPatient(p);
    setForm({
      fullName: p.fullName,
      dateOfBirth: p.dateOfBirth,
      gender: p.gender,
      phone: p.phone,
      email: p.email || '',
      address: p.address,
      bloodType: p.bloodType || '',
      allergies: p.allergies || '',
      chronicDiseases: p.chronicDiseases || '',
      emergencyContact: p.emergencyContact || '',
      emergencyPhone: p.emergencyPhone || '',
      insuranceNumber: p.insuranceNumber || '',
      notes: p.notes || '',
    });
    setModalMode('edit');
  }

  function openView(p: Patient) {
    setSelectedPatient(p);
    setModalMode('view');
  }

  function closeModal() {
    setModalMode(null);
    setSelectedPatient(null);
    setForm(emptyForm);
  }

  function handleSubmit() {
    if (!form.fullName || !form.dateOfBirth || !form.phone || !form.address) return;
    const data = {
      fullName: form.fullName,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      phone: form.phone,
      email: form.email || undefined,
      address: form.address,
      bloodType: (form.bloodType || undefined) as BloodType | undefined,
      allergies: form.allergies || undefined,
      chronicDiseases: form.chronicDiseases || undefined,
      emergencyContact: form.emergencyContact || undefined,
      emergencyPhone: form.emergencyPhone || undefined,
      insuranceNumber: form.insuranceNumber || undefined,
      notes: form.notes || undefined,
    };
    if (modalMode === 'add') {
      addPatient(data);
    } else if (modalMode === 'edit' && selectedPatient) {
      updatePatient(selectedPatient.id, data);
    }
    closeModal();
  }

  function handleDelete(p: Patient) {
    deletePatient(p.id);
    setDeleteConfirm(null);
  }

  const columns = [
    {
      key: 'code',
      header: 'Mã BN',
      render: (p: Patient) => (
        <span className="font-mono text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">
          {p.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Họ tên',
      render: (p: Patient) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-bold text-xs">{p.fullName.split(' ').pop()?.charAt(0)}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{p.fullName}</p>
            <p className="text-xs text-gray-400">{p.gender}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'dob',
      header: 'Ngày sinh',
      render: (p: Patient) => (
        <div>
          <p className="text-sm">{formatDate(p.dateOfBirth)}</p>
          <p className="text-xs text-gray-400">{calcAge(p.dateOfBirth)} tuổi</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Điện thoại',
      render: (p: Patient) => <span className="font-medium">{p.phone}</span>,
    },
    {
      key: 'address',
      header: 'Địa chỉ',
      render: (p: Patient) => (
        <span className="text-gray-500 text-xs max-w-[200px] block truncate">{p.address}</span>
      ),
    },
    {
      key: 'blood',
      header: 'Nhóm máu',
      render: (p: Patient) =>
        p.bloodType ? (
          <Badge variant="danger">{p.bloodType}</Badge>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (p: Patient) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openView(p)}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEdit(p)}
            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Chỉnh sửa"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirm(p)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa"
          >
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
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm tên, SĐT, mã bệnh nhân..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Thêm bệnh nhân
        </button>
      </div>

      {/* Stats summary */}
      <div className="text-sm text-gray-500">
        Tìm thấy <span className="font-semibold text-gray-800">{filtered.length}</span> bệnh nhân
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={paged}
        keyExtractor={(p) => p.id}
        emptyMessage="Không tìm thấy bệnh nhân nào"
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total: filtered.length,
          onPageChange: setPage,
        }}
      />

      {/* Add/Edit Modal */}
      <Modal
        open={modalMode === 'add' || modalMode === 'edit'}
        onClose={closeModal}
        title={modalMode === 'add' ? 'Thêm bệnh nhân mới' : 'Chỉnh sửa bệnh nhân'}
        size="lg"
        footer={
          <>
            <button
              onClick={closeModal}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {modalMode === 'add' ? 'Thêm bệnh nhân' : 'Lưu thay đổi'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày sinh <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none bg-white"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
              placeholder="09xx xxx xxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
              placeholder="example@gmail.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
              placeholder="Số nhà, đường, quận, thành phố"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhóm máu</label>
            <select
              value={form.bloodType}
              onChange={(e) => setForm({ ...form, bloodType: e.target.value as BloodType | '' })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none bg-white"
            >
              <option value="">Không rõ</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số BHYT</label>
            <input
              type="text"
              value={form.insuranceNumber}
              onChange={(e) => setForm({ ...form, insuranceNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
              placeholder="DN40xxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dị ứng thuốc</label>
            <input
              type="text"
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
              placeholder="Penicillin, Aspirin..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bệnh mãn tính</label>
            <input
              type="text"
              value={form.chronicDiseases}
              onChange={(e) => setForm({ ...form, chronicDiseases: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
              placeholder="Tăng huyết áp, Tiểu đường..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Người liên hệ khẩn cấp</label>
            <input
              type="text"
              value={form.emergencyContact}
              onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
              placeholder="Họ tên"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SĐT khẩn cấp</label>
            <input
              type="tel"
              value={form.emergencyPhone}
              onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
              placeholder="09xx xxx xxx"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none resize-none"
              placeholder="Ghi chú thêm về bệnh nhân..."
            />
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={modalMode === 'view'}
        onClose={closeModal}
        title="Thông tin bệnh nhân"
        size="lg"
        footer={
          <>
            <button
              onClick={closeModal}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={() => { if (selectedPatient) { closeModal(); setTimeout(() => openEdit(selectedPatient), 100); } }}
              className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Chỉnh sửa
            </button>
          </>
        }
      >
        {selectedPatient && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl">
              <div className="w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {selectedPatient.fullName.split(' ').pop()?.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{selectedPatient.fullName}</h3>
                <p className="text-sm text-gray-500">
                  {selectedPatient.code} · {selectedPatient.gender} · {calcAge(selectedPatient.dateOfBirth)} tuổi
                </p>
                {selectedPatient.bloodType && (
                  <Badge variant="danger">{selectedPatient.bloodType}</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow icon={Calendar} label="Ngày sinh" value={formatDate(selectedPatient.dateOfBirth)} />
              <InfoRow icon={Phone} label="Điện thoại" value={selectedPatient.phone} />
              <InfoRow icon={MapPin} label="Địa chỉ" value={selectedPatient.address} className="sm:col-span-2" />
              {selectedPatient.email && (
                <InfoRow icon={User} label="Email" value={selectedPatient.email} className="sm:col-span-2" />
              )}
              {selectedPatient.insuranceNumber && (
                <InfoRow icon={User} label="Số BHYT" value={selectedPatient.insuranceNumber} />
              )}
              {selectedPatient.allergies && (
                <InfoRow icon={AlertCircle} label="Dị ứng" value={selectedPatient.allergies} color="red" />
              )}
              {selectedPatient.chronicDiseases && (
                <InfoRow icon={AlertCircle} label="Bệnh mãn tính" value={selectedPatient.chronicDiseases} color="amber" className="sm:col-span-2" />
              )}
              {selectedPatient.emergencyContact && (
                <InfoRow icon={Phone} label="Liên hệ khẩn cấp" value={`${selectedPatient.emergencyContact} (${selectedPatient.emergencyPhone})`} className="sm:col-span-2" />
              )}
              {selectedPatient.notes && (
                <div className="sm:col-span-2 p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-medium text-gray-500 mb-1">Ghi chú</p>
                  <p className="text-sm text-gray-700">{selectedPatient.notes}</p>
                </div>
              )}
            </div>
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
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Xóa bệnh nhân
            </button>
          </>
        }
      >
        <div className="text-center py-2">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-gray-700 text-sm">
            Bạn có chắc chắn muốn xóa bệnh nhân{' '}
            <span className="font-bold">{deleteConfirm?.fullName}</span> không?
          </p>
          <p className="text-gray-400 text-xs mt-1">Hành động này không thể hoàn tác.</p>
        </div>
      </Modal>
    </div>
  );
}

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: 'red' | 'amber';
  className?: string;
}

function InfoRow({ icon: Icon, label, value, color, className = '' }: InfoRowProps) {
  return (
    <div className={`flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl ${className}`}>
      <Icon
        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
          color === 'red' ? 'text-red-500' : color === 'amber' ? 'text-amber-500' : 'text-gray-400'
        }`}
      />
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className={`text-sm font-medium ${color === 'red' ? 'text-red-700' : color === 'amber' ? 'text-amber-700' : 'text-gray-800'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
