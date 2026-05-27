import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, fmt = "dd/MM/yyyy") {
  return format(new Date(date), fmt, { locale: vi })
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: vi })
}

export function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount))
}

export function generateCode(prefix: string, num: number) {
  return `${prefix}${String(num).padStart(4, "0")}`
}

// Trích số lớn nhất từ list mã (regex \d+) — xử lý mọi prefix và padding
// (BN001, BN0001, LH030, INV2024-005, ĐT001, ...).
// Trả 0 nếu list rỗng hoặc không có số. Bỏ qua NaN.
export function maxCodeNumber(codes: string[]): number {
  let max = 0
  for (const code of codes) {
    if (!code) continue
    const match = code.match(/\d+/)
    if (match) {
      const n = parseInt(match[0], 10)
      if (!Number.isNaN(n) && n > max) max = n
    }
  }
  return max
}

// Tiện ích: sinh mã tiếp theo từ list mã hiện có.
// nextCode(['LH001','LH030'], 'LH') → 'LH0031'
export function nextCode(existingCodes: string[], prefix: string): string {
  return generateCode(prefix, maxCodeNumber(existingCodes) + 1)
}

export function calcAge(dateOfBirth: Date | string) {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

export function apiError(message: string, code = "INTERNAL_ERROR", status = 500) {
  return Response.json({ error: message, code }, { status })
}

export function apiSuccess<T>(data: T, meta?: object) {
  return Response.json({ data, ...(meta ? { meta } : {}) })
}
