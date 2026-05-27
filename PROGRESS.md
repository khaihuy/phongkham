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

**Trạng thái:** ✅ ~100% hoàn thành

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

### Đã làm thêm
- [x] **Xuất Excel + PDF** — Revenue + Doctor stats (jsPDF + autotable, multi-sheet xlsx, helper `src/lib/export.ts`)
- [x] **Date range picker** — Reports đã có sẵn (Từ-Đến + preset hôm nay/7 ngày/tháng này/tháng trước)

### Chưa làm
- [ ] Phân quyền chi tiết cho từng module-action
- [ ] Nhúng font Unicode trong PDF (hiện dùng Helvetica nên dấu tiếng Việt chưa hoàn hảo)

---

## Giai Đoạn 3 — Advanced Features

**Trạng thái:** 🟢 ~55% hoàn thành

### Đã làm
- [x] **Marketing — provider abstraction** (`MessageProvider` interface, factory tự chọn Mock/Real theo env)
- [x] **Marketing — mock providers** SMS/Zalo/Email (log + simulate, không gọi API thật)
- [x] **Marketing — real provider stubs** (`ZaloOAProvider`, `SmsGatewayProvider`) sẵn TODO khi có credential
- [x] **Marketing — campaign launch engine** (gửi broadcast cho toàn bộ BN, tạo CampaignLog, update status)
- [x] **Marketing — reminder engine** (`runReminders` quét appt trong N giờ tới, gửi SMS, đánh dấu `reminderSent` để idempotent)
- [x] **Marketing — API `POST /api/reminders/run`** + UI button "Gửi nhắc lịch (24h)"
- [x] **PWA — manifest.json** (theme color #0284c7, shortcuts, icons 192/512)
- [x] **PWA — service worker** (cache shell, network-first HTML, stale-while-revalidate static)
- [x] **PWA — mobile viewport** (viewportFit cover, theme color, apple-web-app)
- [x] **Mobile responsive** — UI hiện đã responsive trên mọi page (Tailwind grid + flex)

### Chưa làm
- [ ] Marketing — wire Zalo OA API thật (cần access_token flow)
- [ ] Marketing — wire SMS gateway thật (chọn nhà cung cấp: Esms/Speedsms/VietGuys)
- [ ] Marketing — SMTP integration (nodemailer + SMTP_HOST/PORT/USER/PASS)
- [ ] Marketing — segmentation theo `targetGroup` (theo độ tuổi, bệnh án...)
- [ ] Telemedicine — video call (WebRTC / nhà cung cấp third-party)
- [ ] Telemedicine — lịch khám online, đặt cọc
- [ ] PWA — offline fallback page riêng
- [ ] Performance optimization (server components audit, lazy load, image optimization)

---

## Giai Đoạn 4 — Deployment & DevOps

**Trạng thái:** 🟢 Cấu hình xong, chờ deploy thật

### Đã làm
- [x] **Dockerfile** — multi-stage build, Next.js standalone output
- [x] **Docker Compose** — local dev với Postgres + Redis + Adminer
- [x] **start.sh** — auto prisma db push + seed khi container start
- [x] **railway.json** — builder DOCKERFILE, healthcheck /api/health, restart policy
- [x] **Healthcheck endpoint** (`/api/health`) — ping Prisma SELECT 1
- [x] **Middleware whitelist** — /api/health, /manifest.json, /sw.js public
- [x] **Deploy docs** (`docs/deploy-railway.md`) — hướng dẫn từng bước
- [x] **GitHub Actions CI** (`.github/workflows/ci.yml`) — lint + typecheck + test + build (với Postgres service)
- [x] **Branch main + PR #1** trên GitHub

### Chưa làm
- [ ] Deploy thật lên Railway (chờ user thao tác trên dashboard)
- [ ] Custom domain (phongkham-an-khang.vn hoặc tương tự)
- [ ] Monitoring + log aggregation (Sentry, Better Stack...)
- [ ] Backup chiến lược (DB snapshot định kỳ)
- [ ] Scheduled job cho `POST /api/reminders/run` chạy mỗi giờ (cron / Railway scheduled)

---

## Metrics

| Metric | Hiện tại | Mục tiêu |
|---|---|---|
| Modules hoàn chỉnh | 6/7 (Telemedicine chờ video call) | 7/7 |
| Prisma models | 32 | 50+ |
| Prisma enums | 15 | 8 ✅ vượt |
| API route groups | 29 | 30+ |
| Test files / cases | 5 / **59 pass** | 80%+ coverage |
| Git commits | 56 | — |
| Pull requests | 1 (#1 — Foundation + Deployment + PWA) | — |

---

## Lịch Sử Cập Nhật

| Ngày | Thay đổi |
|---|---|
| 2026-05-07 | Khởi tạo Giai đoạn 1 |
| 2026-05-23 | Cập nhật trạng thái thực tế: G1 ✅, G2 🟢, G3 🟡; thêm G4 Deployment với Railway config |
| 2026-05-23 | G2 ✅ (PDF/Excel export); G3 🟢 55% (PWA + Marketing mock providers + reminder engine); G4 thêm GitHub Actions CI |
