// Lớp trừu tượng cho các provider gửi tin nhắn (SMS, Email, Zalo).
//
// Khi có credential thật (ZALO_OA_ID, SMS_API_KEY, SMTP_*) sẽ tự động
// dùng provider thật; nếu thiếu thì rơi về Mock provider — vẫn ghi log
// vào DB nhưng không gọi API ngoài. Nhờ vậy phát triển/test local an toàn.

import type { NotificationChannel } from "@prisma/client"

export interface SendResult {
  ok: boolean
  providerMessageId?: string
  error?: string
}

export interface MessageProvider {
  readonly name: string
  readonly channel: NotificationChannel
  send(recipient: string, message: string, meta?: Record<string, any>): Promise<SendResult>
}

// ─── Mock providers ──────────────────────────────────────

class MockSmsProvider implements MessageProvider {
  readonly name = "mock-sms"
  readonly channel = "SMS" as const
  async send(recipient: string, message: string): Promise<SendResult> {
    if (!/^\+?\d{8,15}$/.test(recipient.replace(/\s/g, ""))) {
      return { ok: false, error: "Số điện thoại không hợp lệ" }
    }
    if (process.env.NODE_ENV !== "test") {
      console.log(`[mock-sms] → ${recipient}: ${message.slice(0, 80)}`)
    }
    return { ok: true, providerMessageId: `mock-sms-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
  }
}

class MockZaloProvider implements MessageProvider {
  readonly name = "mock-zalo"
  readonly channel = "ZALO" as const
  async send(recipient: string, message: string): Promise<SendResult> {
    if (!/^\+?\d{8,15}$/.test(recipient.replace(/\s/g, ""))) {
      return { ok: false, error: "ZaloID/SĐT không hợp lệ" }
    }
    if (process.env.NODE_ENV !== "test") {
      console.log(`[mock-zalo] → ${recipient}: ${message.slice(0, 80)}`)
    }
    return { ok: true, providerMessageId: `mock-zalo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
  }
}

class MockEmailProvider implements MessageProvider {
  readonly name = "mock-email"
  readonly channel = "EMAIL" as const
  async send(recipient: string, message: string): Promise<SendResult> {
    if (!/^\S+@\S+\.\S+$/.test(recipient)) {
      return { ok: false, error: "Email không hợp lệ" }
    }
    if (process.env.NODE_ENV !== "test") {
      console.log(`[mock-email] → ${recipient}: ${message.slice(0, 80)}`)
    }
    return { ok: true, providerMessageId: `mock-email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
  }
}

// ─── Real providers (stub) ───────────────────────────────
// Khi có credential, thay thân hàm để gọi API thật.

class ZaloOAProvider implements MessageProvider {
  readonly name = "zalo-oa"
  readonly channel = "ZALO" as const
  constructor(private readonly oaId: string, private readonly secret: string) {}
  async send(_recipient: string, _message: string): Promise<SendResult> {
    // TODO: gọi https://openapi.zalo.me/v3.0/oa/message/cs với access_token
    // tham khảo https://developers.zalo.me/docs/api/official-account-api
    return { ok: false, error: "Zalo OA provider chưa triển khai (cần access_token flow)" }
  }
}

class SmsGatewayProvider implements MessageProvider {
  readonly name = "sms-gateway"
  readonly channel = "SMS" as const
  constructor(private readonly apiKey: string, private readonly brandName: string) {}
  async send(_recipient: string, _message: string): Promise<SendResult> {
    // TODO: gọi API nhà cung cấp SMS (Esms, Speedsms, VietGuys...)
    return { ok: false, error: "SMS gateway chưa triển khai (cần chọn nhà cung cấp)" }
  }
}

// ─── Factory ─────────────────────────────────────────────

export function getProvider(channel: NotificationChannel): MessageProvider {
  switch (channel) {
    case "SMS": {
      const key = process.env.SMS_API_KEY
      const brand = process.env.SMS_BRAND_NAME
      if (key && brand) return new SmsGatewayProvider(key, brand)
      return new MockSmsProvider()
    }
    case "ZALO": {
      const id = process.env.ZALO_OA_ID
      const secret = process.env.ZALO_OA_SECRET
      if (id && secret) return new ZaloOAProvider(id, secret)
      return new MockZaloProvider()
    }
    case "EMAIL": {
      // SMTP integration sẽ thêm sau (nodemailer + SMTP_HOST/PORT/USER/PASS)
      return new MockEmailProvider()
    }
    default:
      throw new Error(`Channel không hỗ trợ: ${channel}`)
  }
}

export function isMockMode(channel: NotificationChannel): boolean {
  return getProvider(channel).name.startsWith("mock-")
}

// ─── Template variables ──────────────────────────────────
// Thay biến trong message: {name}, {date}, {time}, {doctor}, {clinic}

export function renderTemplate(template: string, vars: Record<string, string | number | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key]
    return v === undefined || v === null ? `{${key}}` : String(v)
  })
}
