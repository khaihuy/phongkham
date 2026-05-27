"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CalendarDays, Phone, User, CheckCircle, Stethoscope, Loader, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { doctorAvatarByIndex } from "@/lib/public-images";

interface Doctor {
  id: string;
  title?: string;
  yearsOfExp: number;
  consultFee: string;
  user: { fullName: string };
  specialty: { id: string; name: string };
}

function todayPlusDays(d: number) {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
}

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
];

export default function BookingPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState(todayPlusDays(1));
  const [time, setTime] = useState("09:00");
  const [form, setForm] = useState({
    fullName: "", phone: "", dateOfBirth: "", gender: "MALE" as "MALE" | "FEMALE" | "OTHER",
    chiefComplaint: "", notes: "",
  });
  const [confirmation, setConfirmation] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["public-doctors", selectedSpecialty],
    queryFn: async () => {
      const url = selectedSpecialty
        ? `/api/public/doctors?specialtyId=${selectedSpecialty}`
        : `/api/public/doctors`;
      const r = await fetch(url);
      return (await r.json()).data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/public/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          doctorId: selectedDoctor!.id,
          scheduledDate: date,
          scheduledTime: time,
        }),
      });
      if (!r.ok) {
        const e = await r.json();
        const detail = Array.isArray(e.details)
          ? e.details.map((d: any) => `${d.field}: ${d.message}`).join("; ")
          : null;
        throw new Error(detail || e.error || "Đặt lịch thất bại");
      }
      return (await r.json()).data;
    },
    onSuccess: (data) => {
      setConfirmation(data);
      setStep(4);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const specialties = data?.specialties ?? [];
  const doctors: Doctor[] = data?.doctors ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Đặt lịch khám online</h1>
      <p className="text-gray-500 mb-6">Chọn chuyên khoa, bác sĩ và thời gian phù hợp. Lễ tân sẽ liên hệ xác nhận.</p>

      {/* Stepper */}
      <ol className="flex items-center gap-2 mb-8 overflow-x-auto">
        {[
          { n: 1, label: "Chuyên khoa" },
          { n: 2, label: "Bác sĩ" },
          { n: 3, label: "Thông tin" },
          { n: 4, label: "Hoàn tất" },
        ].map((s, i) => (
          <li key={s.n} className="flex items-center gap-2 flex-shrink-0">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= (s.n as any) ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {step > s.n ? <CheckCircle className="w-4 h-4" /> : s.n}
            </span>
            <span className={`text-sm ${step >= s.n ? "font-medium text-gray-900" : "text-gray-400"}`}>
              {s.label}
            </span>
            {i < 3 && <ArrowRight className="w-3 h-3 text-gray-300 ml-1" />}
          </li>
        ))}
      </ol>

      {/* Step 1: Specialty */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Chọn chuyên khoa</h2>
          {isLoading ? (
            <Loader className="w-6 h-6 animate-spin text-brand-600 mx-auto" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {specialties.map((sp: any) => (
                <button
                  key={sp.id}
                  onClick={() => {
                    setSelectedSpecialty(sp.id);
                    setStep(2);
                  }}
                  className="text-left p-4 border-2 border-gray-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition"
                >
                  <Stethoscope className="w-6 h-6 text-brand-600 mb-2" />
                  <p className="font-medium text-gray-900">{sp.name}</p>
                  {sp.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{sp.description}</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Doctor + slot */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Chọn bác sĩ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {doctors.map((d, i) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDoctor(d)}
                  className={`text-left p-4 border-2 rounded-xl transition ${
                    selectedDoctor?.id === d.id
                      ? "border-brand-500 bg-brand-50"
                      : "border-gray-200 hover:border-brand-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-brand-100">
                      <img
                        src={doctorAvatarByIndex(i)}
                        alt={d.user.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {d.title ?? "BS."} {d.user.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{d.specialty.name}</p>
                      <p className="text-xs text-brand-700 mt-1">
                        {d.yearsOfExp}+ năm · Phí khám: {Number(d.consultFee).toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedDoctor && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Chọn thời gian</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ngày khám</label>
                  <input
                    type="date"
                    value={date}
                    min={todayPlusDays(0)}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Giờ khám</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TIME_SLOTS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTime(t)}
                        className={`px-2 py-1.5 text-xs rounded border ${
                          time === t
                            ? "bg-brand-600 text-white border-brand-600"
                            : "bg-white text-gray-700 border-gray-200 hover:border-brand-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Quay lại
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium"
                >
                  Tiếp tục
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Contact info */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Thông tin liên hệ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Họ tên *</label>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Nguyễn Văn A"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số điện thoại *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="VD: 0912 345 678"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ngày sinh</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Giới tính</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Lý do khám</label>
              <textarea
                value={form.chiefComplaint}
                onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="VD: Đau đầu, ho khan 3 ngày..."
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-brand-50 rounded-lg text-sm text-brand-900">
            <p className="font-medium">📋 Tóm tắt</p>
            <p>BS: <strong>{selectedDoctor?.title ?? "BS."} {selectedDoctor?.user.fullName}</strong> · {selectedDoctor?.specialty.name}</p>
            <p>Thời gian: <strong>{date.split("-").reverse().join("/")}</strong> · <strong>{time}</strong></p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Quay lại
            </button>
            <button
              onClick={() => submitMutation.mutate()}
              disabled={!form.fullName || !form.phone || submitMutation.isPending}
              className="flex-1 py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center gap-2"
            >
              {submitMutation.isPending && <Loader className="w-4 h-4 animate-spin" />}
              Xác nhận đặt lịch
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && confirmation && (
        <div className="bg-white rounded-xl border-2 border-emerald-300 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Đặt lịch thành công!</h2>
          <p className="text-gray-600 mb-6">Lễ tân sẽ gọi xác nhận trong vòng 30 phút.</p>

          <div className="bg-emerald-50 rounded-lg p-4 text-left space-y-1 text-sm max-w-md mx-auto">
            <p><span className="text-gray-500">Mã lịch hẹn:</span> <strong className="font-mono">{confirmation.appointment.appointmentCode}</strong></p>
            <p><span className="text-gray-500">Bệnh nhân:</span> <strong>{confirmation.patient.fullName}</strong> ({confirmation.patient.patientCode})</p>
            <p><span className="text-gray-500">Thời gian:</span> <strong>{date.split("-").reverse().join("/")} {time}</strong></p>
            <p><span className="text-gray-500">Bác sĩ:</span> <strong>{selectedDoctor?.title ?? "BS."} {selectedDoctor?.user.fullName}</strong></p>
          </div>

          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => {
                setStep(1);
                setSelectedDoctor(null);
                setSelectedSpecialty(null);
                setForm({ fullName: "", phone: "", dateOfBirth: "", gender: "MALE", chiefComplaint: "", notes: "" });
              }}
              className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Đặt lịch khác
            </button>
            <a
              href="/"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium"
            >
              Về trang chủ
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
