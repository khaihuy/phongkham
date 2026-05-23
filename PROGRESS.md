# PROGRESS.md

## Giai Đoạn 1 — Foundation

**Bắt đầu:** 2026-05-07
**Trạng thái:** ✅ Hoàn thành

### Đã làm
- [x] Khởi tạo Next.js 14 project skeleton
- [x] Cấu hình TypeScript, Tailwind CSS
- [x] Types đầy đủ (`src/types/index.ts`)
- [x] Mock data ban đầu (`src/lib/mockData.ts`)
- [x] **CLAUDE.md, PROGRESS.md, DECISIONS.md**
- [x] **Architecture documentation** (`docs/architecture.md`) — ERD + Module Map + sơ đồ hệ thống
- [x] **package.json** — Prisma, NextAuth, Zod, React Query, React Table, Recharts, xlsx, jspdf...
- [x] **Prisma Schema** — 32 models, 15 enums (Clinic, Auth, Doctor, Patient, Appointment, Pharmacy, Billing, Marketing, Telemedicine)
- [x] **4-tier project structure** (Presentation → API → Service → Data)
- [x] **Auth (NextAuth.js v5)** — Credentials provider, JWT session
- [x] **RBAC** — 5 roles, permission matrix đầy đủ
- [x] **Prisma Client** (`src/db/prisma.ts`)
- [x] **Database Seed** (`prisma/seed.ts`) — clinic, branches, rooms, specialties, users, doctors, patients, appointments, drugs, services
- [x] **Module Patient** — service layer, API routes GET/POST/PUT/DELETE, UI page
- [x] **Module Appointment** — service layer, API routes, slot management 15 phút, UI page
- [x] **Module Medical Records** — UI page với inline XN/CĐHA ordering
- [x] **Module Billing** — service layer UI với stats
- [x] **Module Pharmacy** — UI với cảnh báo tồn kho
- [x] **Module Reports** — dashboard analytics, biểu đồ doanh thu 6 tháng
- [x] **Module Settings** — cấu hình phòng khám, thông báo, bảo mật, nhân viên
- [x] **Login page** — UI với credentials
- [x] **Middleware** — route protection
- [x] **Tests** — 46/46 pass (validations: patient, appointment; utils; RBAC)
- [x] **Docker Compose** — PostgreSQL 16, Redis, Adminer, App
- [x] **.env.example**, **Dockerfile**, **.gitignore**

---

## Giai Đoạn 2 — Business Modules

**Trạng thái:** 🟢 ~85% hoàn thành

### Đã làm
- [x] **Pharmacy nâng cao** — dispensing workflow, prescription queue, cảnh báo tồn kho thấp + sắp hết hạn
- [x] **Billing nâng cao** — auto-invoice khi complete khám, BHYT trong thanh toán, công nợ hóa đơn, schema serviceId trên orders
- [x] **Reports nâng cao** — thống kê theo bác sĩ, doanh thu 6 tháng, dashboard analytics
- [x] **Medical Record** — inline XN/CĐHA ordering, auto-invoice khi complete
- [x] **Queue tiếp nhận** — vãng lai, số thứ tự, in phiếu lượt (timezone Asia/Ho_Chi_Minh)
- [x] **Appointments** — chọn slot 15 phút bằng bảng, in phiếu khám, consultation service selection, tự tạo lịch tái khám
- [x] **Patient history** — tab hóa đơn, mở rộng hồ sơ đầy đủ
- [x] **Notifications** — badge kết quả xét nghiệm mới cho bác sĩ
- [x] **Prescription** — in đơn thuốc
- [x] **Dashboard** — thao tác nhanh theo vai trò
- [x] **Global search** — tìm kiếm BN/hóa đơn/lịch hẹn với Ctrl+K

### Chưa làm
- [ ] Xuất Excel/PDF nâng cao (mới có xlsx + jspdf cài, chưa wire đầy đủ)
- [ ] Báo cáo theo dải thời gian tuỳ chọn (date range picker)
- [ ] Phân quyền chi tiết cho từng module-action

---

## Giai Đoạn 3 — Advanced Features

**Trạng thái:** 🟡 ~10% hoàn thành (mới có khung)

### Đã làm
- [x] Module Marketing — UI page khung (campaign list)
- [x] Module Telemedicine — placeholder

### Chưa làm
- [ ] Marketing — wire Zalo OA API thật (gửi tin nhắn, broadcast)
- [ ] Marketing — wire SMS gateway (reminder lịch hẹn tự động)
- [ ] Marketing — email SMTP integration
- [ ] Telemedicine — video call (WebRTC / nhà cung cấp third-party)
- [ ] Telemedicine — lịch khám online, đặt cọc
- [ ] PWA + mobile optimization (service worker, manifest, offline)
- [ ] Performance optimization (server components audit, lazy load, image optimization)

---

## Giai Đoạn 4 — Deployment

**Trạng thái:** 🟢 Cấu hình xong, chờ deploy thật

### Đã làm
- [x] **Dockerfile** — multi-stage build, Next.js standalone output
- [x] **Docker Compose** — local dev với Postgres + Redis + Adminer
- [x] **start.sh** — auto prisma db push + seed khi container start
- [x] **railway.json** — builder DOCKERFILE, healthcheck /api/health, restart policy
- [x] **Healthcheck endpoint** (`/api/health`) — ping Prisma SELECT 1
- [x] **Middleware whitelist** — /api/health public cho Railway probe
- [x] **Deploy docs** (`docs/deploy-railway.md`) — hướng dẫn từng bước
- [x] **Branch main + PR #1** trên GitHub

### Chưa làm
- [ ] Deploy thật lên Railway (chờ user thao tác trên dashboard)
- [ ] Custom domain (phongkhanh-an-khang.vn hoặc tương tự)
- [ ] CI/CD GitHub Actions (test + build kiểm tra PR)
- [ ] Monitoring + log aggregation (Sentry, Better Stack...)
- [ ] Backup chiến lược (DB snapshot định kỳ)

---

## Metrics

| Metric | Hiện tại | Mục tiêu |
|---|---|---|
| Modules hoàn chỉnh | 5/7 (core production-ready) | 7/7 |
| Prisma models | 32 | 50+ |
| Prisma enums | 15 | 8 ✅ vượt |
| API route groups | 28 | 30+ |
| Test files / cases | 4 / **46 pass** | 80%+ coverage |
| Git commits | 51 | — |
| Pull requests | 1 (#1 — Foundation) | — |

---

## Lịch Sử Cập Nhật

| Ngày | Thay đổi |
|---|---|
| 2026-05-07 | Khởi tạo Giai đoạn 1 |
| 2026-05-23 | Cập nhật trạng thái thực tế: G1 ✅, G2 🟢, G3 🟡; thêm G4 Deployment với Railway config |
