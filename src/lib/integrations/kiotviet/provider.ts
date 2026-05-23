// Abstraction để code business không phụ thuộc trực tiếp vào API KiotViet.
// Nếu có credential (KIOTVIET_CLIENT_ID + SECRET + RETAILER) → dùng Real
// provider gọi API thật. Nếu thiếu → dùng Mock provider sinh dữ liệu giả.
//
// Pattern giống src/lib/services/marketing/provider.ts.

import { kiotvietFetch, type KiotVietConfig } from "./client"

export interface KiotVietProduct {
  id: number
  code: string
  name: string
  fullName?: string
  categoryId?: number
  categoryName?: string
  basePrice?: number
  unit?: string
  barCode?: string
  description?: string
  isActive?: boolean
  inventories?: Array<{
    branchId: number
    branchName: string
    onHand: number
    reserved: number
  }>
  modifiedDate?: string
}

export interface ListProductsParams {
  pageSize?: number
  currentItem?: number
  includeInventory?: boolean
  lastModifiedFrom?: string // ISO date
}

export interface ListProductsResponse {
  total: number
  pageSize: number
  data: KiotVietProduct[]
}

export interface KiotVietProvider {
  readonly name: string
  listProducts(params?: ListProductsParams): Promise<ListProductsResponse>
  getProduct(id: number): Promise<KiotVietProduct>
  ping(): Promise<{ ok: boolean; retailer?: string; error?: string }>
}

// ─── Real provider ───────────────────────────────────────

class RealKiotVietProvider implements KiotVietProvider {
  readonly name = "kiotviet-real"
  constructor(private readonly config: KiotVietConfig) {}

  async listProducts(params: ListProductsParams = {}): Promise<ListProductsResponse> {
    const qs = new URLSearchParams()
    qs.set("pageSize", String(params.pageSize ?? 100))
    if (params.currentItem !== undefined) qs.set("currentItem", String(params.currentItem))
    if (params.includeInventory) qs.set("includeInventory", "true")
    if (params.lastModifiedFrom) qs.set("lastModifiedFrom", params.lastModifiedFrom)
    return kiotvietFetch<ListProductsResponse>(`/products?${qs}`, this.config)
  }

  async getProduct(id: number): Promise<KiotVietProduct> {
    return kiotvietFetch<KiotVietProduct>(`/products/${id}`, this.config)
  }

  async ping(): Promise<{ ok: boolean; retailer?: string; error?: string }> {
    try {
      await kiotvietFetch("/branches?pageSize=1", this.config)
      return { ok: true, retailer: this.config.retailer }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
  }
}

// ─── Mock provider ───────────────────────────────────────
// Trả về dataset cố định để dev/test mà không cần credential.

const MOCK_PRODUCTS: KiotVietProduct[] = [
  {
    id: 100001,
    code: "KV-PARA-500",
    name: "Paracetamol 500mg KV",
    categoryName: "Giảm đau hạ sốt",
    basePrice: 1200,
    unit: "Viên",
    isActive: true,
    inventories: [{ branchId: 1, branchName: "CN Trung tâm", onHand: 350, reserved: 0 }],
  },
  {
    id: 100002,
    code: "KV-AMOX-500",
    name: "Amoxicillin 500mg KV",
    categoryName: "Kháng sinh",
    basePrice: 2500,
    unit: "Viên",
    isActive: true,
    inventories: [{ branchId: 1, branchName: "CN Trung tâm", onHand: 180, reserved: 0 }],
  },
  {
    id: 100003,
    code: "KV-VITC",
    name: "Vitamin C 1000mg KV",
    categoryName: "Vitamin & Khoáng",
    basePrice: 3000,
    unit: "Viên sủi",
    isActive: true,
    inventories: [{ branchId: 1, branchName: "CN Trung tâm", onHand: 90, reserved: 0 }],
  },
  {
    id: 100004,
    code: "KV-OMEP-20",
    name: "Omeprazole 20mg KV",
    categoryName: "Tiêu hóa",
    basePrice: 4500,
    unit: "Viên",
    isActive: true,
    inventories: [{ branchId: 1, branchName: "CN Trung tâm", onHand: 220, reserved: 0 }],
  },
  {
    id: 100005,
    code: "KV-LORA-10",
    name: "Loratadine 10mg KV",
    categoryName: "Dị ứng",
    basePrice: 2000,
    unit: "Viên",
    isActive: true,
    inventories: [{ branchId: 1, branchName: "CN Trung tâm", onHand: 140, reserved: 0 }],
  },
]

class MockKiotVietProvider implements KiotVietProvider {
  readonly name = "kiotviet-mock"

  async listProducts(params: ListProductsParams = {}): Promise<ListProductsResponse> {
    const pageSize = params.pageSize ?? 100
    const start = params.currentItem ?? 0
    const data = MOCK_PRODUCTS.slice(start, start + pageSize)
    return { total: MOCK_PRODUCTS.length, pageSize, data }
  }

  async getProduct(id: number): Promise<KiotVietProduct> {
    const p = MOCK_PRODUCTS.find((x) => x.id === id)
    if (!p) throw new Error(`Mock product ${id} not found`)
    return p
  }

  async ping(): Promise<{ ok: boolean; retailer?: string; error?: string }> {
    return { ok: true, retailer: "MOCK_RETAILER" }
  }
}

// ─── Factory ─────────────────────────────────────────────

export function getKiotVietProvider(): KiotVietProvider {
  const retailer = process.env.KIOTVIET_RETAILER
  const clientId = process.env.KIOTVIET_CLIENT_ID
  const clientSecret = process.env.KIOTVIET_CLIENT_SECRET
  if (retailer && clientId && clientSecret) {
    return new RealKiotVietProvider({ retailer, clientId, clientSecret })
  }
  return new MockKiotVietProvider()
}

export function isKiotVietMock(): boolean {
  return getKiotVietProvider().name === "kiotviet-mock"
}
