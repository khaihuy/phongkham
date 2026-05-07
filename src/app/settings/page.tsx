"use client"

import { useState } from "react"
import { Settings, Building2, Bell, Shield, Users, Save } from "lucide-react"

const tabs = [
  { id: "clinic", label: "Phòng khám", icon: Building2 },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "security", label: "Bảo mật", icon: Shield },
  { id: "staff", label: "Nhân viên", icon: Users },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("clinic")
  const [clinicName, setClinicName] = useState("Phòng Khám Đa Khoa Hoàng Gia")
  const [phone, setPhone] = useState("028 3456 7890")
  const [email, setEmail] = useState("info@hoanggia.vn")
  const [address, setAddress] = useState("123 Nguyễn Huệ, Quận 1, TP. HCM")
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Settings size={20} className="text-gray-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Cài đặt hệ thống</h2>
          <p className="text-sm text-gray-500">Quản lý cấu hình phòng khám</p>
        </div>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Tab nav */}
        <div className="lg:w-52 flex-shrink-0">
          <nav className="bg-white rounded-2xl shadow-card border border-gray-100 p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                  activeTab === tab.id
                    ? "bg-sky-50 text-sky-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-2xl shadow-card border border-gray-100 p-6">
          {activeTab === "clinic" && (
            <div className="space-y-5">
              <h3 className="font-bold text-gray-800 text-lg">Thông tin phòng khám</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên phòng khám</label>
                  <input value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                  <input defaultValue="https://hoanggia.vn" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Số giấy phép</label>
                  <input defaultValue="01-GP/BYT" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mã số thuế</label>
                  <input defaultValue="0312345678" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-xl transition-colors text-sm"
              >
                <Save size={15} />
                {saved ? "Đã lưu!" : "Lưu thay đổi"}
              </button>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-5">
              <h3 className="font-bold text-gray-800 text-lg">Cài đặt thông báo</h3>
              {[
                { label: "Nhắc nhở lịch hẹn qua SMS", desc: "Gửi SMS nhắc nhở trước 24 giờ", checked: true },
                { label: "Nhắc nhở qua Zalo", desc: "Gửi Zalo OA nhắc nhở lịch hẹn", checked: true },
                { label: "Email xác nhận lịch hẹn", desc: "Gửi email khi lịch hẹn được xác nhận", checked: false },
                { label: "Thông báo hủy lịch", desc: "Thông báo khi lịch hẹn bị hủy", checked: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500" />
                  </label>
                </div>
              ))}
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-5">
              <h3 className="font-bold text-gray-800 text-lg">Bảo mật</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
                  <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 max-w-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
                  <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 max-w-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
                  <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 max-w-sm" />
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-xl transition-colors text-sm">
                  <Save size={15} />
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          )}

          {activeTab === "staff" && (
            <div className="space-y-5">
              <h3 className="font-bold text-gray-800 text-lg">Quản lý nhân viên</h3>
              <p className="text-sm text-gray-500">Quản lý tài khoản và phân quyền nhân viên tại đây.</p>
              <div className="space-y-3">
                {[
                  { name: "Quản Trị Viên", role: "ADMIN", email: "admin@hoanggia.vn", status: "Hoạt động" },
                  { name: "TS.BS. Nguyễn Văn Minh", role: "DOCTOR", email: "bs.minh@hoanggia.vn", status: "Hoạt động" },
                  { name: "ThS.BS. Trần Thị Lan", role: "DOCTOR", email: "bs.lan@hoanggia.vn", status: "Hoạt động" },
                  { name: "Phạm Thị Mai", role: "RECEPTIONIST", email: "letan.mai@hoanggia.vn", status: "Hoạt động" },
                ].map((s) => (
                  <div key={s.email} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                    <div className="w-9 h-9 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 font-bold text-sm flex-shrink-0">
                      {s.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">{s.role}</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-medium">{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
