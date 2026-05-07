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
