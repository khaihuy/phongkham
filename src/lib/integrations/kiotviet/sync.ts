// Engine đồng bộ kho thuốc từ KiotViet về DB local.
//
// Pull-based: gọi /products?includeInventory=true, upsert Drug theo
// `code` (idempotent). Sync 1 chiều KiotViet → Local (an toàn nhất
// trong giai đoạn đầu vì source-of-truth là KiotViet).
//
// Sync 2 chiều (Local → KiotViet) sẽ thêm sau khi rõ luồng nghiệp vụ.

import { prisma } from "@/db/prisma"
import { getKiotVietProvider, type KiotVietProduct } from "./provider"
import type { DrugUnit } from "@prisma/client"

export interface SyncOptions {
  // Chỉ pull sản phẩm sửa sau thời điểm này (incremental sync)
  since?: Date
  // Giới hạn số trang để test
  maxPages?: number
}

export interface SyncResult {
  providerName: string
  totalFetched: number
  inserted: number
  updated: number
  skipped: number
  errors: { code: string; message: string }[]
  durationMs: number
}

const UNIT_MAP: Record<string, DrugUnit> = {
  "viên": "TABLET",
  "viên sủi": "TABLET",
  "viên nang": "CAPSULE",
  "vỉ": "TABLET",
  "chai": "BOTTLE",
  "lọ": "BOTTLE",
  "tuýp": "TUBE",
  "ống": "AMPOULE",
  "gói": "SACHET",
  "hộp": "BOX",
}

function mapUnit(unit?: string): DrugUnit {
  if (!unit) return "TABLET"
  return UNIT_MAP[unit.toLowerCase()] ?? "TABLET"
}

async function ensureDefaultCategory(): Promise<string> {
  const existing = await prisma.drugCategory.findFirst({ where: { code: "KIOTVIET_DEFAULT" } })
  if (existing) return existing.id
  const created = await prisma.drugCategory.create({
    data: { name: "KiotViet (chưa phân loại)", code: "KIOTVIET_DEFAULT" },
  })
  return created.id
}

async function findCategoryIdByName(name?: string, fallbackId?: string): Promise<string | undefined> {
  if (!name) return fallbackId
  const cat = await prisma.drugCategory.findFirst({ where: { name } })
  return cat?.id ?? fallbackId
}

export async function syncDrugsFromKiotViet(opts: SyncOptions = {}): Promise<SyncResult> {
  const start = Date.now()
  const provider = getKiotVietProvider()
  const defaultCategoryId = await ensureDefaultCategory()

  let inserted = 0
  let updated = 0
  let skipped = 0
  let totalFetched = 0
  const errors: SyncResult["errors"] = []

  const pageSize = 100
  let currentItem = 0
  let page = 0
  const maxPages = opts.maxPages ?? 50

  while (page < maxPages) {
    const resp = await provider.listProducts({
      pageSize,
      currentItem,
      includeInventory: true,
      lastModifiedFrom: opts.since?.toISOString(),
    })
    if (!resp.data || resp.data.length === 0) break

    for (const product of resp.data) {
      totalFetched++
      try {
        const existedBefore = await prisma.drug.findUnique({
          where: { code: product.code },
          select: { id: true },
        })
        await upsertDrug(product, defaultCategoryId)
        if (existedBefore) updated++
        else inserted++
      } catch (e) {
        errors.push({
          code: product.code,
          message: e instanceof Error ? e.message : String(e),
        })
        skipped++
      }
    }

    page++
    currentItem += resp.data.length
    if (resp.data.length < pageSize) break
  }

  return {
    providerName: provider.name,
    totalFetched,
    inserted,
    updated,
    skipped,
    errors,
    durationMs: Date.now() - start,
  }
}

async function upsertDrug(product: KiotVietProduct, defaultCategoryId: string): Promise<void> {
  const categoryId = await findCategoryIdByName(product.categoryName, defaultCategoryId)
  if (!categoryId) throw new Error("Không xác định được category")

  const drug = await prisma.drug.upsert({
    where: { code: product.code },
    create: {
      code: product.code,
      name: product.name,
      categoryId,
      unit: mapUnit(product.unit),
      isActive: product.isActive ?? true,
      barcode: product.barCode ?? null,
    },
    update: {
      name: product.name,
      unit: mapUnit(product.unit),
      isActive: product.isActive ?? true,
      ...(product.barCode ? { barcode: product.barCode } : {}),
    },
  })

  // Sync inventory: tạo 1 batch "KIOTVIET-SYNC" mỗi lần sync để giữ
  // dấu vết. Không xoá batch cũ — kế toán cần lịch sử.
  if (product.inventories && product.inventories.length > 0) {
    const totalOnHand = product.inventories.reduce((s, inv) => s + (inv.onHand ?? 0), 0)
    const batchNo = `KV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`

    const existing = await prisma.drugInventory.findFirst({
      where: { drugId: drug.id, batchNo },
    })

    if (existing) {
      await prisma.drugInventory.update({
        where: { id: existing.id },
        data: {
          quantity: totalOnHand,
          sellPrice: product.basePrice ?? 0,
        },
      })
    } else if (totalOnHand > 0) {
      await prisma.drugInventory.create({
        data: {
          drugId: drug.id,
          batchNo,
          quantity: totalOnHand,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 năm placeholder
          importPrice: product.basePrice ?? 0,
          sellPrice: product.basePrice ?? 0,
          notes: "Sync tự động từ KiotViet",
        },
      })
    }
  }
}
