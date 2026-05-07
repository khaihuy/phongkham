"use client"

import { useState } from "react"
import { Pill, Search, Package, AlertTriangle, TrendingDown, Plus } from "lucide-react"
import Badge from "@/components/ui/Badge"
import Table from "@/components/ui/Table"

const mockDrugs = [
  { id: "1", code: "AMX500", name: "Amoxicillin 500mg", category: "Kháng sinh", unit: "Viên", stock: 450, minStock: 100, sellPrice: 3500, expiry: "2026-12-31", status: "ok" },
  { id: "2", code: "PCT500", name: "Paracetamol 500mg", category: "Hạ sốt - Giảm đau", unit: "Viên", stock: 1200, minStock: 200, sellPrice: 800, expiry: "2026-06-30", status: "ok" },
  { id: "3", code: "IBU400", name: "Ibuprofen 400mg", category: "Hạ sốt - Giảm đau", unit: "Viên", stock: 85, minStock: 100, sellPrice: 2000, expiry: "2025-08-15", status: "low" },
  { id: "4", code: "MET500", name: "Metformin 500mg", category: "Tiểu đường", unit: "Viên", stock: 300, minStock: 50, sellPrice: 1500, expiry: "2026-03-20", status: "ok" },
  { id: "5", code: "AML5", name: "Amlodipine 5mg", category: "Tim mạch", unit: "Viên", stock: 20, minStock: 50, sellPrice: 2500, expiry: "2025-05-10", status: "critical" },
  { id: "6", code: "OFX200", name: "Ofloxacin 200mg", category: "Kháng sinh", unit: "Viên", stock: 200, minStock: 100, sellPrice: 4000, expiry: "2026-09-15", status: "ok" },
]

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ"
}

export default function PharmacyPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  const filtered = mockDrugs.filter((d) => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === "all" ||
      (filter === "low" && (d.status === "low" || d.status === "critical")) ||
      (filter === "ok" && d.status === "ok")
    return matchSearch && matchFilter
  })

  const stats = {
    total: mockDrugs.length,
    low: mockDrugs.filter((d) => d.status === "low").length,
    critical: mockDrugs.filter((d) => d.status === "critical").length,
    ok: mockDrugs.filter((d) => d.status === "ok").length,
  }

  const columns = [
    { key: "code", header: "Mã thuốc", render: (v: string) => <span className="font-mono text-xs font-bold text-sky-700">{v}</span> },
    { key: "name", header: "Tên thuốc", render: (v: string) => <span className="font-medium">{v}</span> },
    { key: "category", header: "Nhóm thuốc" },
    { key: "unit", header: "ĐVT" },
    {
      key: "stock",
      header: "Tồn kho",
      render: (v: number, row: any) => (
        <span className={`font-bold ${row.status === "critical" ? "text-red-600" : row.status === "low" ? "text-amber-600" : "text-gray-700"}`}>
          {v}
        </span>
      ),
    },
    { key: "minStock", header: "Tồn tối thiểu" },
    { key: "sellPrice", header: "Đơn giá", render: (v: number) => formatCurrency(v) },
    {
      key: "expiry",
      header: "Hạn dùng",
      render: (v: string) => {
        const expired = new Date(v) < new Date()
        return <span className={expired ? "text-red-600 font-semibold" : ""}>{new Date(v).toLocaleDateString("vi-VN")}</span>
      },
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (v: string) => {
        if (v === "critical") return <Badge color="red">Sắp hết</Badge>
        if (v === "low") return <Badge color="yellow">Sắp cạn</Badge>
        return <Badge color="green">Đủ hàng</Badge>
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng danh mục", value: stats.total, icon: Package, bg: "bg-sky-100", text: "text-sky-700" },
          { label: "Đủ hàng", value: stats.ok, icon: Pill, bg: "bg-emerald-100", text: "text-emerald-700" },
          { label: "Sắp cạn", value: stats.low, icon: TrendingDown, bg: "bg-amber-100", text: "text-amber-700" },
          { label: "Cần nhập gấp", value: stats.critical, icon: AlertTriangle, bg: "bg-red-100", text: "text-red-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg} ${s.text}`}>
              <s.icon size={18} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alert for critical */}
      {stats.critical > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">
            Có {stats.critical} loại thuốc sắp hết — cần nhập hàng ngay!
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Pill size={18} className="text-green-500" />
            Quản lý dược phẩm
          </h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm thuốc..."
                className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 w-48"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Tất cả</option>
              <option value="ok">Đủ hàng</option>
              <option value="low">Sắp cạn / hết</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors">
              <Plus size={14} />
              Nhập thuốc
            </button>
          </div>
        </div>
        <Table data={filtered} columns={columns} emptyText="Không có thuốc nào" />
      </div>
    </div>
  )
}
