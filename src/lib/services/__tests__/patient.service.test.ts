import { describe, it, expect } from "vitest"
import { maxPatientNumber } from "../patient.service"

describe("maxPatientNumber — regression cho bug PKCNaN", () => {
  it("trả 0 với mảng rỗng", () => {
    expect(maxPatientNumber([])).toBe(0)
  })

  it("đọc đúng số từ BN001/BN0001 (mọi padding)", () => {
    expect(maxPatientNumber(["BN001", "BN020", "BN005"])).toBe(20)
    expect(maxPatientNumber(["BN0001", "BN0020", "BN0005"])).toBe(20)
  })

  it("đọc đúng dù prefix lẫn lộn (seed BN + record cũ PKC)", () => {
    // Bug cũ: dùng replace('PKC', '') trên BN020 → NaN
    expect(maxPatientNumber(["BN001", "BN020", "PKC005"])).toBe(20)
    expect(maxPatientNumber(["PKC100", "BN050"])).toBe(100)
  })

  it("bỏ qua code không có số", () => {
    expect(maxPatientNumber(["INVALID", "BN010", "NOCODE"])).toBe(10)
  })

  it("bỏ qua giá trị NaN từ code rác như PKCNaN", () => {
    expect(maxPatientNumber(["BN020", "PKCNaN"])).toBe(20)
  })

  it("lấy số đầu tiên trong code có nhiều cụm số", () => {
    expect(maxPatientNumber(["BN2024001"])).toBe(2024001)
  })

  it("chấp nhận số lớn", () => {
    expect(maxPatientNumber(["BN9999", "BN10000"])).toBe(10000)
  })
})
