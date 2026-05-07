'use client';

import { useState } from 'react';
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient } from '@/hooks/use-patients';
import Modal from '@/components/ui/Modal';
import { Plus, Search, Pencil, Trash2, Eye, AlertCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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
  gender: 'MALE' as const,
  phone: '',
  email: '',
  address: '',
  ward: '',
  district: '',
  province: '',
  bloodType: 'UNKNOWN' as const,
  idCardNo: '',
  insuranceNo: '',
  notes: '',
};

type FormData = typeof emptyForm;

export default function PatientsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);

  const { data: patientsData, isLoading, error } = usePatients(page, 10, search);
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient(selectedPatient?.id || '');
  const deletePatientMutation = useDeletePatient();

  const patients = patientsData?.data || [];
  const meta = patientsData?.meta;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (modalMode === 'add') {
        await createPatient.mutateAsync(form);
        toast.success('Thêm bệnh nhân thành công');
      } else if (modalMode === 'edit' && selectedPatient) {
        await updatePatient.mutateAsync(form);
        toast.success('Cập nhật bệnh nhân thành công');
      }
      setModalMode(null);
      setForm(emptyForm);
    } catch (err) {
      toast.error('Có lỗi xảy ra');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deletePatientMutation.mutateAsync(id);
      toast.success('Xóa bệnh nhân thành công');
      setDeleteConfirm(null);
    } catch (err) {
      toast.error('Có lỗi xảy ra');
    }
  }

  function openAdd() {
    setForm(emptyForm);
    setSelectedPatient(null);
    setModalMode('add');
  }

  function openEdit(patient: any) {
    setSelectedPatient(patient);
    setForm({
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth.split('T')[0],
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email || '',
      address: patient.address || '',
      ward: patient.ward || '',
      district: patient.district || '',
      province: patient.province || '',
      bloodType: patient.bloodType || 'UNKNOWN',
      idCardNo: patient.idCardNo || '',
      insuranceNo: patient.insuranceNo || '',
      notes: patient.notes || '',
    });
    setModalMode('edit');
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>Lỗi khi tải dữ liệu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Bệnh nhân</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm bệnh nhân
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, SĐT, mã BN..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-sky-600" />
          </div>
        ) : patients.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Mã BN</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Họ tên</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Ngày sinh</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Giới tính</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">SĐT</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {patients.map((patient: any) => (
                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{patient.patientCode}</td>
                      <td className="px-6 py-4 text-gray-900">{patient.fullName}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(patient.dateOfBirth)} ({calcAge(patient.dateOfBirth)} tuổi)
                      </td>
                      <td className="px-6 py-4 text-gray-600">{patient.gender === 'MALE' ? 'Nam' : 'Nữ'}</td>
                      <td className="px-6 py-4 text-gray-600">{patient.phone}</td>
                      <td className="px-6 py-4 flex items-center justify-center gap-2">
                        <Link href={`/patients/${patient.id}`}>
                          <button className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => openEdit(patient)}
                          className="p-2 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(patient)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">
                  Trang {meta.page} / {meta.totalPages} ({meta.total} bệnh nhân)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                    disabled={page === meta.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">Không có bệnh nhân</div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalMode && (
        <Modal
          title={modalMode === 'add' ? 'Thêm bệnh nhân' : 'Cập nhật bệnh nhân'}
          open={!!modalMode}
          onClose={() => setModalMode(null)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Họ tên"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
              <input
                type="tel"
                placeholder="Số điện thoại"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <input
                type="text"
                placeholder="Địa chỉ"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <input
                type="text"
                placeholder="Phường/Xã"
                value={form.ward}
                onChange={(e) => setForm({ ...form, ward: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <input
                type="text"
                placeholder="Quận/Huyện"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <textarea
              placeholder="Ghi chú"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createPatient.isPending || updatePatient.isPending}
                className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {createPatient.isPending || updatePatient.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Modal title="Xác nhận xóa" open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
          <p className="mb-4">Bạn có chắc chắn muốn xóa bệnh nhân {deleteConfirm.fullName}?</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleDelete(deleteConfirm.id)}
              disabled={deletePatientMutation.isPending}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
            >
              {deletePatientMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </button>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              Hủy
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
