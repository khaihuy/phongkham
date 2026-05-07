import { describe, it, expect } from "vitest"
import { appointmentSchema, appointmentUpdateSchema } from "../appointment.schema"

describe("appointmentSchema", () => {
  const validData = {
    patientId: "pat-01",
    doctorId: "doc-01",
    branchId: "branch-01",
    scheduledDate: "2026-06-15",
    scheduledTime: "09:00",
    type: "GENERAL" as const,
    duration: 30,
    chiefComplaint: "Đau đầu, chóng mặt",
  }

  it("validates a correct appointment", () => {
    const result = appointmentSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it("rejects missing patientId", () => {
    const { patientId, ...rest } = validData
    const result = appointmentSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it("rejects missing doctorId", () => {
    const { doctorId, ...rest } = validData
    const result = appointmentSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it("rejects invalid time format", () => {
    const result = appointmentSchema.safeParse({ ...validData, scheduledTime: "9:0" })
    expect(result.success).toBe(false)
  })

  it("accepts valid time formats", () => {
    const result = appointmentSchema.safeParse({ ...validData, scheduledTime: "14:30" })
    expect(result.success).toBe(true)
  })

  it("rejects duration below 15", () => {
    const result = appointmentSchema.safeParse({ ...validData, duration: 10 })
    expect(result.success).toBe(false)
  })

  it("rejects duration above 120", () => {
    const result = appointmentSchema.safeParse({ ...validData, duration: 150 })
    expect(result.success).toBe(false)
  })

  it("defaults type to GENERAL", () => {
    const { type, ...rest } = validData
    const result = appointmentSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe("GENERAL")
    }
  })

  it("defaults duration to 30", () => {
    const { duration, ...rest } = validData
    const result = appointmentSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.duration).toBe(30)
    }
  })
})

describe("appointmentUpdateSchema", () => {
  it("allows status update only", () => {
    const result = appointmentUpdateSchema.safeParse({ status: "COMPLETED" })
    expect(result.success).toBe(true)
  })

  it("allows cancel with reason", () => {
    const result = appointmentUpdateSchema.safeParse({
      status: "CANCELLED",
      cancelReason: "Bệnh nhân bận",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid status", () => {
    const result = appointmentUpdateSchema.safeParse({ status: "INVALID_STATUS" as any })
    expect(result.success).toBe(false)
  })
})
