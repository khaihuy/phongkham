import { describe, it, expect } from "vitest"
import { formatCurrency, calcAge, generateCode, formatDate } from "../utils"

describe("formatCurrency", () => {
  it("formats VND correctly", () => {
    const result = formatCurrency(200000)
    expect(result).toContain("200")
    expect(result).toContain("000")
  })

  it("handles zero", () => {
    const result = formatCurrency(0)
    expect(result).toContain("0")
  })

  it("handles string input", () => {
    const result = formatCurrency("500000")
    expect(result).toContain("500")
  })
})

describe("calcAge", () => {
  it("calculates age correctly", () => {
    const dob = new Date()
    dob.setFullYear(dob.getFullYear() - 30)
    expect(calcAge(dob)).toBe(30)
  })

  it("handles birthday not yet this year", () => {
    const dob = new Date()
    dob.setFullYear(dob.getFullYear() - 25)
    dob.setMonth(dob.getMonth() + 1)
    const age = calcAge(dob)
    expect(age).toBe(24)
  })

  it("accepts string date", () => {
    const age = calcAge("1990-01-01")
    expect(age).toBeGreaterThan(30)
  })
})

describe("generateCode", () => {
  it("generates correct code", () => {
    expect(generateCode("BN", 1)).toBe("BN0001")
    expect(generateCode("LH", 123)).toBe("LH0123")
    expect(generateCode("BN", 9999)).toBe("BN9999")
  })

  it("pads to 4 digits", () => {
    expect(generateCode("BN", 1)).toHaveLength(6)
  })
})

describe("formatDate", () => {
  it("formats date in Vietnamese format", () => {
    const result = formatDate("2026-01-15")
    expect(result).toBe("15/01/2026")
  })

  it("accepts custom format", () => {
    const result = formatDate("2026-01-15", "yyyy/MM/dd")
    expect(result).toBe("2026/01/15")
  })
})
