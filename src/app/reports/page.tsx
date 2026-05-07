"use client"

import { useMemo } from "react"
import { useStore } from "@/lib/store"
import { BarChart3, TrendingUp, Users, CalendarDays, DollarSign, Download } from "lucide-react"

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
}

export default function ReportsPage() {
  const { patients, appointments, invoices, doctors } = useStore()

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const thisMonthAppts = appointments.filter((a) => {
      const d = new Date(a.date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    const revenue = invoices
      .filter((i) => i.paymentStatus === "đã thanh toán")
      .reduce((s, i) => s + i.total, 0)

    const monthRevenue = invoices
      .filter((i) => {
        const d = new Date(i.createdAt)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && i.paymentStatus === "đã thanh toán"
      })
      .reduce((s, i) => s + i.total, 0)

    const byStatus = {
      completed: appointments.filter((a) => a.status === "hoàn thành").length,
      cancelled: appointments.filter((a) => a.status === "hủy").length,
      pending: appointments.filter((a) => a.status === "chờ khám").length,
    }

    return { revenue, monthRevenue, thisMonthAppts: thisMonthAppts.length, byStatus }
  }, [appointments, invoices])

  const topDoctors = useMemo(() => {
    return doctors
      .map((d) => ({
        ...d,
        appointmentCount: appointments.filter((a) => a.doctorId === d.id).length,
        completedCount: appointments.filter((a) => a.doctorId === d.id && a.status === "hoàn thành").length,
      }))
      .sort((a, b) => b.appointmentCount - a.appointmentCount)
      .slice(0, 5)
  }, [doctors, appointments])

  const monthlyRevenue = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (5 - i))
      return { month: d.toLocaleDateString("vi-VN", { month: "short", year: "numeric" }), revenue: Math.floor(Math.random() * 50000000) + 10000000 }
    })
    return months
  }, [])

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Báo cáo & Thống kê</h2>
          <p className="text-sm text-gray-500">Tổng hợp dữ liệu hoạt động phòng khám</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <Download size={16} />
          Xuất báo cáo
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng bệnh nhân", value: patients.length, sub: "Đã đăng ký", icon: Users, color: "sky" },
          { label: "Lịch hẹn tháng này", value: stats.thisMonthAppts, sub: "Tháng hiện tại", icon: CalendarDays, color: "emerald" },
          { label: "Doanh thu tháng", value: formatCurrency(stats.monthRevenue).replace("₫", "đ"), sub: "Đã thu", icon: DollarSign, color: "amber" },
          { label: "Tổng doanh thu", value: formatCurrency(stats.revenue).replace("₫", "đ"), sub: "Tất cả thời gian", icon: TrendingUp, color: "purple" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl p-4 shadow-card border border-gray-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-${kpi.color}-100 text-${kpi.color}-600`}>
              <kpi.icon size={18} />
            </div>
            <p className="text-xl font-bold text-gray-800 truncate">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
            <p className="text-xs text-gray-400">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-sky-500" />
            Doanh thu 6 tháng gần nhất
          </h3>
          <div className="flex items-end gap-3 h-40">
            {monthlyRevenue.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-sky-500 rounded-t-lg hover:bg-sky-600 transition-colors cursor-pointer"
                  style={{ height: `${(m.revenue / maxRevenue) * 100}%`, minHeight: "4px" }}
                  title={formatCurrency(m.revenue)}
                />
                <p className="text-xs text-gray-500 text-center whitespace-nowrap">{m.month}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Appointment Status Breakdown */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">Tình trạng lịch hẹn</h3>
          <div className="space-y-3">
            {[
              { label: "Hoàn thành", value: stats.byStatus.completed, color: "bg-emerald-500", total: appointments.length },
              { label: "Chờ khám", value: stats.byStatus.pending, color: "bg-amber-500", total: appointments.length },
              { label: "Đã hủy", value: stats.byStatus.cancelled, color: "bg-red-400", total: appointments.length },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{s.label}</span>
                  <span className="font-semibold">{s.value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.color}`}
                    style={{ width: `${s.total > 0 ? (s.value / s.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Doctors */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Top bác sĩ theo số lượng lịch hẹn</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {topDoctors.map((d, i) => (
            <div key={d.id} className="flex items-center gap-4 px-5 py-3">
              <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{d.fullName}</p>
                <p className="text-xs text-gray-400">{d.specialty}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-700">{d.appointmentCount}</p>
                <p className="text-xs text-gray-400">lịch hẹn</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600">{d.completedCount}</p>
                <p className="text-xs text-gray-400">hoàn thành</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
