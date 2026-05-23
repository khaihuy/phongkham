import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getProvider, isMockMode, renderTemplate } from "../provider"

describe("renderTemplate", () => {
  it("thay biến đúng", () => {
    expect(renderTemplate("Chào {name}", { name: "An" })).toBe("Chào An")
  })

  it("thay nhiều biến", () => {
    expect(renderTemplate("{a} - {b}", { a: 1, b: 2 })).toBe("1 - 2")
  })

  it("giữ nguyên biến nếu không có giá trị", () => {
    expect(renderTemplate("Hi {name}", {})).toBe("Hi {name}")
  })

  it("xử lý undefined", () => {
    expect(renderTemplate("Hi {x}", { x: undefined })).toBe("Hi {x}")
  })
})

describe("getProvider — mock mode", () => {
  beforeEach(() => {
    delete process.env.SMS_API_KEY
    delete process.env.SMS_BRAND_NAME
    delete process.env.ZALO_OA_ID
    delete process.env.ZALO_OA_SECRET
  })

  it("SMS rơi về mock khi thiếu API key", () => {
    expect(getProvider("SMS").name).toBe("mock-sms")
    expect(isMockMode("SMS")).toBe(true)
  })

  it("ZALO rơi về mock khi thiếu credential", () => {
    expect(getProvider("ZALO").name).toBe("mock-zalo")
    expect(isMockMode("ZALO")).toBe(true)
  })

  it("EMAIL luôn dùng mock (SMTP chưa wire)", () => {
    expect(getProvider("EMAIL").name).toBe("mock-email")
  })
})

describe("getProvider — real mode khi có credential", () => {
  const original = { ...process.env }
  afterEach(() => {
    process.env = { ...original }
  })

  it("SMS dùng provider thật khi có SMS_API_KEY + SMS_BRAND_NAME", () => {
    process.env.SMS_API_KEY = "test-key"
    process.env.SMS_BRAND_NAME = "TestBrand"
    expect(getProvider("SMS").name).toBe("sms-gateway")
    expect(isMockMode("SMS")).toBe(false)
  })

  it("ZALO dùng provider thật khi có ZALO_OA_ID + ZALO_OA_SECRET", () => {
    process.env.ZALO_OA_ID = "oa-id"
    process.env.ZALO_OA_SECRET = "oa-secret"
    expect(getProvider("ZALO").name).toBe("zalo-oa")
  })
})

describe("MockSmsProvider.send", () => {
  it("trả ok với SĐT hợp lệ", async () => {
    const p = getProvider("SMS")
    const r = await p.send("0912345678", "Test message")
    expect(r.ok).toBe(true)
    expect(r.providerMessageId).toMatch(/^mock-sms-/)
  })

  it("trả lỗi với SĐT không hợp lệ", async () => {
    const p = getProvider("SMS")
    const r = await p.send("abc", "Test")
    expect(r.ok).toBe(false)
    expect(r.error).toContain("không hợp lệ")
  })
})

describe("MockEmailProvider.send", () => {
  it("trả ok với email hợp lệ", async () => {
    const p = getProvider("EMAIL")
    const r = await p.send("user@example.com", "Hi")
    expect(r.ok).toBe(true)
  })

  it("trả lỗi với email sai định dạng", async () => {
    const p = getProvider("EMAIL")
    const r = await p.send("not-an-email", "Hi")
    expect(r.ok).toBe(false)
  })
})
