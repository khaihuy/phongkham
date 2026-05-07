# DECISIONS.md — Architectural Decision Records

## ADR-001: Next.js App Router thay vì Pages Router

**Ngày:** 2026-05-07  
**Trạng thái:** Đã chấp nhận

**Lý do:**
- Server Components giảm bundle size, tăng performance
- Layouts lồng nhau (nested layouts) phù hợp cấu trúc CRM
- Route Groups hỗ trợ auth flows
- App Router là hướng đi chính thức của Next.js

---

## ADR-002: PostgreSQL + Prisma thay vì MongoDB

**Ngày:** 2026-05-07  
**Trạng thái:** Đã chấp nhận

**Lý do:**
- Dữ liệu y tế có quan hệ phức tạp (bệnh nhân → hồ sơ → đơn thuốc)
- ACID transactions quan trọng cho billing
- Prisma type-safety + migrations rõ ràng
- Dễ audit log, compliance

---

## ADR-003: NextAuth.js v5 cho Authentication

**Ngày:** 2026-05-07  
**Trạng thái:** Đã chấp nhận

**Lý do:**
- Tích hợp tốt với Next.js App Router
- Hỗ trợ JWT + database sessions
- Custom credentials provider cho login bằng username/password nội bộ
- Middleware-based route protection

---

## ADR-004: Zod cho Validation ở cả Client lẫn Server

**Ngày:** 2026-05-07  
**Trạng thái:** Đã chấp nhận

**Lý do:**
- Single source of truth cho schema validation
- TypeScript inference tự động
- Tái sử dụng schema giữa form validation và API validation

---

## ADR-005: RBAC dựa trên Role + Permission Matrix

**Ngày:** 2026-05-07  
**Trạng thái:** Đã chấp nhận

**Permission Matrix:**

| Action | ADMIN | DOCTOR | RECEPTIONIST | PHARMACIST | ACCOUNTANT |
|---|:---:|:---:|:---:|:---:|:---:|
| Manage users | ✅ | ❌ | ❌ | ❌ | ❌ |
| View patients | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit patients | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create appointments | ✅ | ✅ | ✅ | ❌ | ❌ |
| Medical records | ✅ | ✅ | ❌ | ❌ | ❌ |
| Prescriptions | ✅ | ✅ | ❌ | ✅ | ❌ |
| Pharmacy inventory | ✅ | ❌ | ❌ | ✅ | ❌ |
| Billing | ✅ | ❌ | ✅ | ❌ | ✅ |
| Reports | ✅ | ❌ | ❌ | ❌ | ✅ |
| System config | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## ADR-006: Soft Delete cho dữ liệu y tế

**Ngày:** 2026-05-07  
**Trạng thái:** Đã chấp nhận

**Lý do:**
- Dữ liệu y tế phải được lưu trữ theo quy định (không được xóa thật)
- Audit trail đầy đủ
- Tất cả models có `deletedAt: DateTime?` field

---

## ADR-007: Docker Compose cho Development + Production

**Ngày:** 2026-05-07  
**Trạng thái:** Đã chấp nhận

**Services:**
- `app` — Next.js application
- `db` — PostgreSQL 16
- `redis` — Session cache + queue
- `nginx` — Reverse proxy (production only)
