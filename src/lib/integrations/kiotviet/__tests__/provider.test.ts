import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getKiotVietProvider, isKiotVietMock } from "../provider"

describe("KiotViet provider — mock mode", () => {
  beforeEach(() => {
    delete process.env.KIOTVIET_RETAILER
    delete process.env.KIOTVIET_CLIENT_ID
    delete process.env.KIOTVIET_CLIENT_SECRET
  })

  it("rơi về mock khi thiếu credential", () => {
    expect(isKiotVietMock()).toBe(true)
    expect(getKiotVietProvider().name).toBe("kiotviet-mock")
  })

  it("listProducts trả dataset mock", async () => {
    const provider = getKiotVietProvider()
    const r = await provider.listProducts({ pageSize: 10 })
    expect(r.total).toBeGreaterThan(0)
    expect(r.data.length).toBeGreaterThan(0)
    expect(r.data[0]).toHaveProperty("code")
    expect(r.data[0]).toHaveProperty("name")
  })

  it("paging hoạt động", async () => {
    const provider = getKiotVietProvider()
    const first = await provider.listProducts({ pageSize: 2, currentItem: 0 })
    const second = await provider.listProducts({ pageSize: 2, currentItem: 2 })
    expect(first.data.length).toBe(2)
    expect(second.data.length).toBeGreaterThanOrEqual(1)
    expect(first.data[0].id).not.toBe(second.data[0]?.id)
  })

  it("getProduct trả 1 product theo id", async () => {
    const provider = getKiotVietProvider()
    const product = await provider.getProduct(100001)
    expect(product.code).toBe("KV-PARA-500")
  })

  it("getProduct throw khi id không tồn tại", async () => {
    const provider = getKiotVietProvider()
    await expect(provider.getProduct(999999)).rejects.toThrow()
  })

  it("ping trả ok", async () => {
    const provider = getKiotVietProvider()
    const r = await provider.ping()
    expect(r.ok).toBe(true)
  })
})

describe("KiotViet provider — real mode chuyển khi đủ credential", () => {
  const original = { ...process.env }
  afterEach(() => {
    process.env = { ...original }
  })

  it("dùng real provider khi đủ 3 biến KIOTVIET_*", () => {
    process.env.KIOTVIET_RETAILER = "mystore"
    process.env.KIOTVIET_CLIENT_ID = "client-id"
    process.env.KIOTVIET_CLIENT_SECRET = "secret"
    expect(isKiotVietMock()).toBe(false)
    expect(getKiotVietProvider().name).toBe("kiotviet-real")
  })

  it("rơi về mock nếu thiếu 1 biến", () => {
    process.env.KIOTVIET_RETAILER = "mystore"
    process.env.KIOTVIET_CLIENT_ID = "client-id"
    delete process.env.KIOTVIET_CLIENT_SECRET
    expect(isKiotVietMock()).toBe(true)
  })
})
