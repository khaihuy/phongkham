'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Appointment, AppointmentStatus } from '@/types';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import { AppointmentStatusBadge } from '@/components/ui/Badge';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  CalendarDays,
  Filter,
  Clock,
  X,
  ChevronDown,
} from 'lucide-react';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

const STATUS_OPTIONS: AppointmentStatus[] = ['chờ khám', 'đang khám', 'hoàn thành', 'hủy'];
const ROOMS = ['Phòng 1', 'Phòng 2', 'Phòng 3', 'Phòng 4', 'Phòng 5'];

const emptyForm = {
  patientId: '',
  doctorId: '',
  date: '',
  time: '',
  reason: '',
  status: 'chờ khám' as AppointmentStatus,
  room: '',
  notes: '',
};

type FormData = typeof emptyForm;

export default function AppointmentsPage() {
  const { appointments, patients, doctors, addAppointment, updateAppointment, deleteAppointment, updateAppointmentStatus } = useStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const [filterDate, setFilterDate] = useState<'today' | 'tomorrow' | 'all'>('all');
  const [page, setPage] = useState(1);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<Appointment | null>(null);
  const PAGE_SIZE = 10;

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return appointments
      .filter((a) => {
        const matchSearch =
          a.patientName.toLowerCase().includes(q) ||
          a.doctorName.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          a.reason.toLowerCase().includes(q);
        const matchStatus = filterStatus === 'all' || a.status === filterStatus;
        const matchDate =
          filterDate === 'all' ||
          (filterDate === 'today' && a.date === todayStr) ||
          (filterDate === 'tomorrow' && a.date === tomorrowStr);
        return matchSearch && matchStatus && matchDate;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return a.time.localeCompare(b.time);
      });
  }, [appointments, search, filterStatus, filterDate, todayStr, tomorrowStr]);

  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  // Counts
  const todayCount = appointments.filter((a) => a.date === todayStr).length;
  const pendingCount = appointments.filter((a) => a.status === 'chờ khám').length;
  const inProgressCount = appointments.filter((a) => a.status === 'đang khám').length;

  function openAdd() {
    setForm({ ...emptyForm, date: todayStr });
    setSelectedAppt(null);
    setModalMode('add');
  }

  function openEdit(a: Appointment) {
    setSelectedAppt(a);
    setForm({
      patientId: a.patientId,
      doctorId: a.doctorId,
      date: a.date,
      time: a.time,
      reason: a.reason,
      status: a.status,
      room: a.room || '',
      notes: a.notes || '',
    });
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setSelectedAppt(null);
    setForm(emptyForm);
  }

  function handleSubmit() {
    if (!form.patientId || !form.doctorId || !form.date || !form.time || !form.reason) return;
    const patient = patients.find((p) => p.id === form.patientId);
    const doctor = doctors.find((d) => d.id === form.doctorId);
    if (!patient || !doctor) return;

    const data = {
      patientId: form.patientId,
      patientName: patient.fullName,
      doctorId: form.doctorId,
      doctorName: doctor.fullName,
      date: form.date,
      time: form.time,
      reason: form.reason,
      status: form.status,
      room: form.room || undefined,
      notes: form.notes || undefined,
    };

    if (modalMode === 'add') {
      addAppointment(data);
    } else if (modalMode === 'edit' && selectedAppt) {
      updateAppointment(selectedAppt.id, data);
    }
    closeModal();
  }

  function handleStatusChange(id: string, status: AppointmentStatus) {
    updateAppointmentStatus(id, status);
  }

  function handleDelete(a: Appointment) {
    deleteAppointment(a.id);
    setDeleteConfirm(null);
  }

  const columns = [
    {
      key: 'code',
      header: 'Mã LH',
      render: (a: Appointment) => (
        <span className="font-mono text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">
          {a.code}
        </span>
      ),
    },
    {
      key: 'datetime',
      header: 'Ngày / Giờ',
      render: (a: Appointment) => (
        <div>
          <p className="font-semibold text-gray-800 text-sm">{formatDate(a.date)}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {a.time}
          </p>
        </div>
      ),
    },
    {
      key: 'patient',
      header: 'Bệnh nhân',
      render: (a: Appointment) => (
        <div>
          <p className="font-semibold text-gray-800 text-sm">{a.patientName}</p>
        </div>
      ),
    },
    {
      key: 'doctor',
      header: 'Bác sĩ',
      render: (a: Appointment) => (
        <p className="text-sm text-gray-600 max-w-[180px] truncate">{a.doctorName}</p>
      ),
    },
    {
      key: 'reason',
      header: 'Lý do khám',
      render: (a: Appointment) => (
        <p className="text-sm text-gray-600 max-w-[180px] truncate">{a.reason}</p>
      ),
    },
    {
      key: 'room',
      header: 'Phòng',
      render: (a: Appointment) => (
        <span className="text-sm text-gray-500">{a.room || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (a: Appointment) => (
        <div className="relative group">
          <div className="cursor-pointer">
            <AppointmentStatusBadge status={a.status} />
          </div>
          {/* Status dropdown */}
          <div className="hidden group-hover:block absolute right-0 top-full mt-1 z-10 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[160px]">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(a.id, s)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                  s === a.status ? 'font-bold text-primary-600' : 'text-gray-700'
                }`}
              >
                {s === 'chờ khám' ? 'Chờ khám' : s === 'đang khám' ? 'Đang khám' : s === 'hoàn thành' ? 'Hoàn thành' : 'Hủy'}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (a: Appointment) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEdit(a)}
            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirm(a)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => { setFilterDate('today'); setPage(1); }}
          className={`p-3 rounded-xl text-left transition-all ${filterDate === 'today' ? 'bg-primary-500 text-white' : 'bg-white border border-gray-100 hover:border-primary-200'}`}
        >
          <p className={`text-2xl font-bold ${filterDate === 'today' ? 'text-white' : 'text-gray-800'}`}>{todayCount}</p>
          <p className={`text-xs ${filterDate === 'today' ? 'text-primary-100' : 'text-gray-500'}`}>Hôm nay</p>
        </button>
        <button
          onClick={() => { setFilterStatus('chờ khám'); setFilterDate('all'); setPage(1); }}
          className={`p-3 rounded-xl text-left transition-all ${filterStatus === 'chờ khám' ? 'bg-amber-500 text-white' : 'bg-white border border-gray-100 hover:border-amber-200'}`}
        >
          <p className={`text-2xl font-bold ${filterStatus === 'chờ khám' ? 'text-white' : 'text-gray-800'}`}>{pendingCount}</p>
          <p className={`text-xs ${filterStatus === 'chờ khám' ? 'text-amber-100' : 'text-gray-500'}`}>Chờ khám</p>
        </button>
        <button
          onClick={() => { setFilterStatus('đang khám'); setFilterDate('all'); setPage(1); }}
          className={`p-3 rounded-xl text-left transition-all ${filterStatus === 'đang khám' ? 'bg-sky-500 text-white' : 'bg-white border border-gray-100 hover:border-sky-200'}`}
        >
          <p className={`text-2xl font-bold ${filterStatus === 'đang khám' ? 'text-white' : 'text-gray-800'}`}>{inProgressCount}</p>
          <p className={`text-xs ${filterStatus === 'đang khám' ? 'text-sky-100' : 'text-gray-500'}`}>Đang khám</p>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm bệnh nhân, bác sĩ..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm w-56 focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as AppointmentStatus | 'all'); setPage(1); }}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value as 'today' | 'tomorrow' | 'all'); setPage(1); }}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none"
          >
            <option value="all">Tất cả ngày</option>
            <option value="today">Hôm nay</option>
            <option value="tomorrow">Ngày mai</option>
          </select>
          {(filterStatus !== 'all' || filterDate !== 'all' || search) && (
            <button
              onClick={() => { setFilterStatus('all'); setFilterDate('all'); setSearch(''); setPage(1); }}
              className="px-3 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl text-sm flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Bỏ lọc
            </button>
          )}
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Thêm lịch hẹn
        </button>
      </div>

      <div className="text-sm text-gray-500">
        Tìm thấy <span className="font-semibold text-gray-800">{filtered.length}</span> lịch hẹn
        {' '}<span className="text-xs text-gray-400">(click vào badge trạng thái để thay đổi)</span>
      </div>

      <Table
        columns={columns}
        data={paged}
        keyExtractor={(a) => a.id}
        emptyMessage="Không tìm thấy lịch hẹn nào"
        pagination={{ page, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage }}
      />

      {/* Add/Edit Modal */}
      <Modal
        open={modalMode === 'add' || modalMode === 'edit'}
        onClose={closeModal}
        title={modalMode === 'add' ? 'Thêm lịch hẹn mới' : 'Chỉnh sửa lịch hẹn'}
        size="md"
        footer={
          <>
            <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors">
              Hủy
            </button>
            <button onClick={handleSubmit} className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors">
              {modalMode === 'add' ? 'Tạo lịch hẹn' : 'Lưu thay đổi'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bệnh nhân <span className="text-red-500">*</span></label>
            <select
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none bg-white"
            >
              <option value="">-- Chọn bệnh nhân --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.code} - {p.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bác sĩ <span className="text-red-500">*</span></label>
            <select
              value={form.doctorId}
              onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none bg-white"
            >
              <option value="">-- Chọn bác sĩ --</option>
              {doctors.filter((d) => d.status === 'active').map((d) => (
                <option key={d.id} value={d.id}>{d.fullName} - {d.specialty}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giờ <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lý do khám <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none"
              placeholder="Nhập lý do khám bệnh"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phòng khám</label>
              <select
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none bg-white"
              >
                <option value="">-- Chọn phòng --</option>
                {ROOMS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentStatus })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none bg-white"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 outline-none resize-none"
              placeholder="Ghi chú thêm..."
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Xác nhận xóa"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors">
              Hủy
            </button>
            <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">
              Xóa
            </button>
          </>
        }
      >
        <div className="text-center py-2">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-gray-700 text-sm">
            Xóa lịch hẹn <span className="font-bold">{deleteConfirm?.code}</span> của{' '}
            <span className="font-bold">{deleteConfirm?.patientName}</span>?
          </p>
        </div>
      </Modal>
    </div>
  );
}
