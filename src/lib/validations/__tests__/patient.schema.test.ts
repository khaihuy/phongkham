import { describe, it, expect } from "vitest"
import { patientSchema, patientUpdateSchema } from "../patient.schema"

describe("patientSchema", () => {
  const validData = {
    fullName: "Nguyễn Văn An",
    dateOfBirth: "1990-05-15",
    gender: "MALE" as const,
    phone: "0901234567",
    email: "an.nguyen@gmail.com",
    bloodType: "O_POSITIVE" as const,
  }

  it("validates a correct patient", () => {
    const result = patientSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it("rejects short fullName", () => {
    const result = patientSchema.safeParse({ ...validData, fullName: "A" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain("fullName")
  })

  it("rejects invalid phone format", () => {
    const result = patientSchema.safeParse({ ...validData, phone: "123456789" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain("phone")
  })

  it("rejects phone not starting with 0", () => {
    const result = patientSchema.safeParse({ ...validData, phone: "1901234567" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid email", () => {
    const result = patientSchema.safeParse({ ...validData, email: "not-an-email" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain("email")
  })

  it("accepts empty email (optional)", () => {
    const result = patientSchema.safeParse({ ...validData, email: "" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid dateOfBirth", () => {
    const result = patientSchema.safeParse({ ...validData, dateOfBirth: "not-a-date" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid gender", () => {
    const result = patientSchema.safeParse({ ...validData, gender: "UNKNOWN" as any })
    expect(result.success).toBe(false)
  })

  it("defaults bloodType to UNKNOWN if not provided", () => {
    const { bloodType, ...rest } = validData
    const result = patientSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.bloodType).toBe("UNKNOWN")
    }
  })
})

describe("patientUpdateSchema", () => {
  it("allows partial updates", () => {
    const result = patientUpdateSchema.safeParse({ fullName: "Nguyễn Thị Bình" })
    expect(result.success).toBe(true)
  })

  it("validates partial fields", () => {
    const result = patientUpdateSchema.safeParse({ phone: "invalid" })
    expect(result.success).toBe(false)
  })

  it("accepts empty object", () => {
    const result = patientUpdateSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})
