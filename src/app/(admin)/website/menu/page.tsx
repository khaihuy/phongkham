"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, GripVertical, ChevronDown, ChevronRight, Eye, EyeOff, RefreshCw } from "lucide-react"
import { toast } from "sonner"

const ICON_OPTIONS = [
  "Stethoscope", "Pill", "HeartPulse", "Baby", "Sparkles", "Tag",
  "ShoppingBag", "Star", "Zap", "Heart", "Shield", "Activity",
]

interface NavItem {
  id: string
  label: string
  href: string
  sortOrder: number
  isActive: boolean
}

interface NavCategory {
  id: string
  title: string
  icon: string
  sortOrder: number
  isActive: boolean
  items: NavItem[]
}

function ItemRow({ item, onEdit, onDelete }: {
  item: NavItem
  onEdit: (item: NavItem) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-3 rounded hover:bg-gray-50 group">
      <GripVertical className="w-4 h-4 text-gray-300" />
      <span className={`flex-1 text-sm ${item.isActive ? "text-gray-700" : "text-gray-400 line-through"}`}>
        {item.label}
      </span>
      <span className="text-xs text-gray-400 hidden sm:block truncate max-w-[200px]">{item.href}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(item)} className="p-1 hover:bg-blue-50 rounded text-blue-600">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(item.id)} className="p-1 hover:bg-red-50 rounded text-red-500">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function CategoryCard({ cat, onSave, onDelete }: {
  cat: NavCategory
  onSave: (id: string, data: Partial<NavCategory> & { items?: NavItem[] }) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editingCat, setEditingCat] = useState(false)
  const [catForm, setCatForm] = useState({ title: cat.title, icon: cat.icon, sortOrder: cat.sortOrder })
  const [items, setItems] = useState<NavItem[]>(cat.items)
  const [editingItem, setEditingItem] = useState<NavItem | null>(null)
  const [newItem, setNewItem] = useState<Partial<NavItem> | null>(null)
  const [dirty, setDirty] = useState(false)

  function handleSaveItems() {
    onSave(cat.id, { items })
    setDirty(false)
  }

  function handleSaveCat() {
    onSave(cat.id, catForm)
    setEditingCat(false)
  }

  function handleToggleActive() {
    onSave(cat.id, { isActive: !cat.isActive })
  }

  function saveItem(item: NavItem) {
    const idx = items.findIndex(i => i.id === item.id)
    if (idx >= 0) {
      const next = [...items]
      next[idx] = item
      setItems(next)
    } else {
      setItems([...items, { ...item, id: crypto.randomUUID(), sortOrder: items.length }])
    }
    setEditingItem(null)
    setNewItem(null)
    setDirty(true)
  }

  function deleteItem(id: string) {
    setItems(items.filter(i => i.id !== id))
    setDirty(true)
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Category header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50">
        <button onClick={() => setExpanded(v => !v)} className="p-0.5">
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
        </button>
        {editingCat ? (
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <input
              className="border rounded px-2 py-1 text-sm w-40"
              value={catForm.title}
              onChange={e => setCatForm(p => ({ ...p, title: e.target.value }))}
            />
            <select
              className="border rounded px-2 py-1 text-sm"
              value={catForm.icon}
              onChange={e => setCatForm(p => ({ ...p, icon: e.target.value }))}
            >
              {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <input
              type="number"
              className="border rounded px-2 py-1 text-sm w-20"
              placeholder="Thứ tự"
              value={catForm.sortOrder}
              onChange={e => setCatForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
            />
            <button onClick={handleSaveCat} className="px-3 py-1 bg-blue-600 text-white text-sm rounded">Lưu</button>
            <button onClick={() => setEditingCat(false)} className="px-3 py-1 bg-gray-200 text-sm rounded">Huỷ</button>
          </div>
        ) : (
          <>
            <span className={`flex-1 font-medium text-sm ${cat.isActive ? "text-gray-800" : "text-gray-400"}`}>
              {cat.title}
              <span className="ml-2 text-xs text-gray-400 font-normal">({cat.icon})</span>
              <span className="ml-2 text-xs text-gray-400 font-normal">{cat.items.length} mục</span>
            </span>
            <button onClick={handleToggleActive} className="p-1.5 hover:bg-white rounded text-gray-500" title={cat.isActive ? "Ẩn" : "Hiện"}>
              {cat.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button onClick={() => setEditingCat(true)} className="p-1.5 hover:bg-white rounded text-blue-600">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(cat.id)} className="p-1.5 hover:bg-white rounded text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Items */}
      {expanded && (
        <div className="p-2">
          {items.map(item => (
            editingItem?.id === item.id ? (
              <ItemForm key={item.id} item={editingItem} onSave={saveItem} onCancel={() => setEditingItem(null)} />
            ) : (
              <ItemRow key={item.id} item={item} onEdit={setEditingItem} onDelete={deleteItem} />
            )
          ))}

          {newItem !== null && (
            <ItemForm item={newItem as NavItem} onSave={saveItem} onCancel={() => setNewItem(null)} />
          )}

          <div className="flex items-center gap-2 mt-2 px-3">
            {newItem === null && (
              <button
                onClick={() => setNewItem({ label: "", href: "", sortOrder: items.length, isActive: true })}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm mục
              </button>
            )}
            {dirty && (
              <button onClick={handleSaveItems} className="ml-auto px-3 py-1 bg-green-600 text-white text-sm rounded">
                Lưu thay đổi
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ItemForm({ item, onSave, onCancel }: {
  item: Partial<NavItem>
  onSave: (item: NavItem) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({ label: item.label ?? "", href: item.href ?? "", isActive: item.isActive ?? true })

  return (
    <div className="flex items-center gap-2 py-1.5 px-3 bg-blue-50 rounded">
      <input
        className="border rounded px-2 py-1 text-sm flex-1 min-w-0"
        placeholder="Tên mục"
        value={form.label}
        onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
      />
      <input
        className="border rounded px-2 py-1 text-sm flex-1 min-w-0"
        placeholder="Đường dẫn /san-pham"
        value={form.href}
        onChange={e => setForm(p => ({ ...p, href: e.target.value }))}
      />
      <button
        onClick={() => onSave({ ...item, ...form, id: item.id ?? "" } as NavItem)}
        className="px-2 py-1 bg-blue-600 text-white text-sm rounded"
      >Lưu</button>
      <button onClick={onCancel} className="px-2 py-1 bg-gray-200 text-sm rounded">Huỷ</button>
    </div>
  )
}

export default function MenuAdminPage() {
  const qc = useQueryClient()
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCat, setNewCat] = useState({ title: "", icon: "Tag", sortOrder: 0 })

  const { data: categories = [], isLoading } = useQuery<NavCategory[]>({
    queryKey: ["nav-categories-admin"],
    queryFn: async () => {
      const r = await fetch("/api/nav-categories")
      return (await r.json()).data ?? []
    },
  })

  const saveCat = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const r = await fetch(`/api/nav-categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!r.ok) throw new Error("Lỗi lưu danh mục")
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["nav-categories-admin"] }); qc.invalidateQueries({ queryKey: ["nav-menu"] }); toast.success("Đã lưu") },
    onError: () => toast.error("Lỗi lưu danh mục"),
  })

  const deleteCat = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/nav-categories/${id}`, { method: "DELETE" })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["nav-categories-admin"] }); qc.invalidateQueries({ queryKey: ["nav-menu"] }); toast.success("Đã xoá") },
  })

  const createCat = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch("/api/nav-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!r.ok) throw new Error("Lỗi tạo danh mục")
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nav-categories-admin"] })
      qc.invalidateQueries({ queryKey: ["nav-menu"] })
      setShowNewCat(false)
      setNewCat({ title: "", icon: "Tag", sortOrder: 0 })
      toast.success("Đã tạo danh mục")
    },
    onError: () => toast.error("Lỗi tạo danh mục"),
  })

  const seedNav = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/admin/seed-nav", { method: "POST" })
      if (!r.ok) throw new Error("Lỗi")
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["nav-categories-admin"] }); qc.invalidateQueries({ queryKey: ["nav-menu"] }); toast.success("Đã tạo menu mẫu") },
    onError: () => toast.error("Lỗi tạo menu mẫu"),
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Menu</h1>
          <p className="text-sm text-gray-500 mt-1">Cấu hình danh mục và mục con hiển thị trên menu website</p>
        </div>
        <div className="flex gap-2">
          {categories.length === 0 && (
            <button
              onClick={() => seedNav.mutate()}
              disabled={seedNav.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg"
            >
              <RefreshCw className={`w-4 h-4 ${seedNav.isPending ? "animate-spin" : ""}`} />
              Tạo menu mẫu
            </button>
          )}
          <button
            onClick={() => setShowNewCat(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
          >
            <Plus className="w-4 h-4" /> Thêm danh mục
          </button>
        </div>
      </div>

      {isLoading && <p className="text-gray-400 text-sm">Đang tải...</p>}

      {showNewCat && (
        <div className="border border-blue-200 rounded-xl p-4 mb-4 bg-blue-50 flex flex-wrap items-center gap-2">
          <input
            className="border rounded px-2 py-1.5 text-sm flex-1 min-w-[140px]"
            placeholder="Tên danh mục"
            value={newCat.title}
            onChange={e => setNewCat(p => ({ ...p, title: e.target.value }))}
          />
          <select
            className="border rounded px-2 py-1.5 text-sm"
            value={newCat.icon}
            onChange={e => setNewCat(p => ({ ...p, icon: e.target.value }))}
          >
            {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <input
            type="number"
            className="border rounded px-2 py-1.5 text-sm w-24"
            placeholder="Thứ tự"
            value={newCat.sortOrder}
            onChange={e => setNewCat(p => ({ ...p, sortOrder: Number(e.target.value) }))}
          />
          <button
            onClick={() => createCat.mutate(newCat)}
            disabled={!newCat.title || createCat.isPending}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded disabled:opacity-50"
          >Tạo</button>
          <button onClick={() => setShowNewCat(false)} className="px-3 py-1.5 bg-gray-200 text-sm rounded">Huỷ</button>
        </div>
      )}

      <div className="space-y-3">
        {categories.map(cat => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            onSave={(id, data) => saveCat.mutate({ id, data })}
            onDelete={id => {
              if (confirm("Xoá danh mục và toàn bộ mục con?")) deleteCat.mutate(id)
            }}
          />
        ))}
      </div>

      {categories.length === 0 && !isLoading && (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-3">Chưa có danh mục nào</p>
          <button onClick={() => seedNav.mutate()} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">
            Tạo menu mẫu
          </button>
        </div>
      )}
    </div>
  )
}
