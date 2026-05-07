# PROGRESS.md

## Giai Đoạn 1 — Foundation (Session hiện tại)

**Bắt đầu:** 2026-05-07  
**Trạng thái:** 🚧 Đang thực hiện

### ✅ Hoàn thành
- [x] Khởi tạo Next.js 14 project skeleton
- [x] Cấu hình TypeScript, Tailwind CSS
- [x] Types đầy đủ (`src/types/index.ts`)
- [x] Mock data ban đầu (`src/lib/mockData.ts`)
- [x] **CLAUDE.md, PROGRESS.md, DECISIONS.md**
- [x] **Architecture documentation** (`docs/architecture.md`) — ERD + Module Map + sơ đồ hệ thống
- [x] **package.json** — đầy đủ deps: Prisma, NextAuth, Zod, React Query, React Table, Recharts, xlsx...
- [x] **Prisma Schema** — 7 modules, 40+ models, 8 enums (Clinic, Auth, Doctor, Patient, Appointment, Pharmacy, Billing, Marketing, Telemedicine)
- [x] **4-tier project structure** (Presentation → API → Service → Data)
- [x] **Auth (NextAuth.js v5)** — Credentials provider, JWT session
- [x] **RBAC** — 5 roles, permission matrix đầy đủ
- [x] **Prisma Client** (`src/db/prisma.ts`)
- [x] **Database Seed** (`src/db/seed.ts`) — clinic, branches, rooms, specialties, users, doctors, patients, appointments, drugs, services
- [x] **Module Patient** — service layer, API routes GET/POST/PUT/DELETE, UI page
- [x] **Module Appointment** — service layer, API routes, slot management, UI page
- [x] **Module Medical Records** — UI page
- [x] **Module Billing** — service layer UI với stats
- [x] **Module Pharmacy** — UI với cảnh báo tồn kho
- [x] **Module Reports** — dashboard analytics, biểu đồ doanh thu 6 tháng
- [x] **Module Settings** — cấu hình phòng khám, thông báo, bảo mật, nhân viên
- [x] **Login page** — UI đẹp với credentials
- [x] **Middleware** — route protection
- [x] **Tests** — validations (patient, appointment), utils, RBAC (27+ test cases)
- [x] **Docker Compose** — PostgreSQL 16, Redis, Adminer, App
- [x] **.env.example**, **Dockerfile**, **.gitignore**

---

## Giai Đoạn 2 — Business Modules (Session tiếp theo)

**Trạng thái:** ⏳ Chờ

- [ ] Module Pharmacy (kho thuốc, đơn thuốc)
- [ ] Module Billing (hóa đơn, thanh toán)
- [ ] Module Reports (báo cáo, xuất Excel/PDF)
- [ ] Dashboard analytics nâng cao

---

## Giai Đoạn 3 — Advanced Features (Session tiếp theo)

**Trạng thái:** ⏳ Chờ

- [ ] Module Marketing (Zalo/SMS, campaign)
- [ ] Module Telemedicine (video call)
- [ ] PWA + mobile optimization
- [ ] Performance optimization

---

## Metrics

| Metric | Hiện tại | Mục tiêu |
|---|---|---|
| Modules hoàn chỉnh | 0/7 | 7/7 |
| API endpoints | 0 | 80+ |
| Test coverage | 0% | 80%+ |
| Prisma models | 0 | 50+ |
