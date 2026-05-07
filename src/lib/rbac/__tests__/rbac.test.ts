import { describe, it, expect } from "vitest"
import { hasPermission, requirePermission } from "../../rbac"

describe("hasPermission", () => {
  it("ADMIN has all permissions", () => {
    expect(hasPermission("ADMIN", "users:manage")).toBe(true)
    expect(hasPermission("ADMIN", "patients:view")).toBe(true)
    expect(hasPermission("ADMIN", "billing:manage")).toBe(true)
    expect(hasPermission("ADMIN", "settings:manage")).toBe(true)
  })

  it("DOCTOR cannot manage users", () => {
    expect(hasPermission("DOCTOR", "users:manage")).toBe(false)
  })

  it("DOCTOR can view and edit patients", () => {
    expect(hasPermission("DOCTOR", "patients:view")).toBe(true)
    expect(hasPermission("DOCTOR", "patients:edit")).toBe(true)
  })

  it("DOCTOR cannot delete patients", () => {
    expect(hasPermission("DOCTOR", "patients:delete")).toBe(false)
  })

  it("RECEPTIONIST can manage appointments", () => {
    expect(hasPermission("RECEPTIONIST", "appointments:manage")).toBe(true)
    expect(hasPermission("RECEPTIONIST", "billing:manage")).toBe(true)
  })

  it("RECEPTIONIST cannot access medical records", () => {
    expect(hasPermission("RECEPTIONIST", "medical-records:edit")).toBe(false)
  })

  it("PHARMACIST can manage pharmacy", () => {
    expect(hasPermission("PHARMACIST", "pharmacy:manage")).toBe(true)
    expect(hasPermission("PHARMACIST", "prescriptions:manage")).toBe(true)
  })

  it("PHARMACIST cannot access billing", () => {
    expect(hasPermission("PHARMACIST", "billing:manage")).toBe(false)
  })

  it("ACCOUNTANT can view and export reports", () => {
    expect(hasPermission("ACCOUNTANT", "billing:view")).toBe(true)
    expect(hasPermission("ACCOUNTANT", "reports:export")).toBe(true)
  })

  it("ACCOUNTANT cannot manage patients", () => {
    expect(hasPermission("ACCOUNTANT", "patients:view")).toBe(false)
    expect(hasPermission("ACCOUNTANT", "appointments:manage")).toBe(false)
  })
})

describe("requirePermission", () => {
  it("does not throw if user has permission", () => {
    expect(() => requirePermission("ADMIN", "users:manage")).not.toThrow()
    expect(() => requirePermission("DOCTOR", "patients:view")).not.toThrow()
  })

  it("throws if user lacks permission", () => {
    expect(() => requirePermission("RECEPTIONIST", "users:manage")).toThrow("Permission denied")
    expect(() => requirePermission("ACCOUNTANT", "patients:view")).toThrow("Permission denied")
  })
})
