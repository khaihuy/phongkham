# Phòng Khám CRM — Hệ Thống Quản Lý Phòng Khám Tư Nhân

Nền tảng CRM toàn diện xây dựng bằng **Next.js 14**, **TypeScript**, **Prisma ORM**, và **PostgreSQL**. Hỗ trợ quản lý bệnh nhân, lịch hẹn, hồ sơ bệnh án, thanh toán, báo cáo và tiếp thị.

## 🎯 Tính Năng Chính

### 7 Modules

| Module | Tính Năng |
|--------|----------|
| **Bệnh nhân (EMR)** | Hồ sơ bệnh nhân, lịch sử khám, dị ứng, chỉ số sinh hiệu |
| **Lịch hẹn** | Đặt lịch, quản lý slot, lịch bác sĩ, trạng thái |
| **Bác sĩ** | Quản lý thông tin, chuyên khoa, lịch làm việc |
| **Hồ sơ bệnh án** | Chẩn đoán, đơn thuốc, xét nghiệm, hình ảnh |
| **Thanh toán** | Hóa đơn, thanh toán, doanh thu, báo cáo |
| **Dược phẩm** | Kho thuốc, nhập/xuất, quản lý lô hàng |
| **Báo cáo & Marketing** | Thống kê, xuất Excel/PDF, Zalo/SMS |

### 5 Vai Trò (RBAC)

- **Admin** — Quản trị toàn hệ
- **Doctor** — Khám bệnh, kê đơn
- **Receptionist** — Tiếp nhận, lịch hẹn
- **Pharmacist** — Quản lý kho thuốc
- **Accountant** — Thanh toán, báo cáo

## 🛠️ Tech Stack

```
Next.js 14 (App Router) + TypeScript
├── Frontend: Tailwind CSS + shadcn/ui
├── Backend: Route Handlers + API
├── Database: PostgreSQL 16 + Prisma ORM
├── Auth: NextAuth.js v5 + JWT
└── Testing: Vitest + React Testing Library
```

## 🚀 Khởi Chạy Nhanh

### Yêu Cầu
- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **npm** hoặc **yarn**

### Local Development

```bash
# 1. Clone repository
git clone <repo-url>
cd phongkham

# 2. Cài dependencies
npm install

# 3. Setup biến môi trường
cp .env.example .env.local
# Sửa .env.local với DATABASE_URL của bạn

# 4. Chạy migrations
npx prisma migrate dev

# 5. Seed dữ liệu ban đầu
npx prisma db seed

# 6. Dev server
npm run dev
```

**Truy cập:** http://localhost:3000

### Tài Khoản Demo

```
Username: admin          | Mật khẩu: Password123!
Username: dr.hung        | Chuyên khoa: Nội khoa
Username: reception      | Vai trò: Lễ tân
```

## 📦 Production (Railway)

### Deployment

```bash
# Railway tự động detect Dockerfile
# 1. Push code lên repository
# 2. Kết nối repo với Railway
# 3. Railway tự động:
#    - Build Docker image
#    - Chạy migrations (prisma migrate deploy)
#    - Seed dữ liệu (prisma db seed)
#    - Khởi động ứng dụng
```

### Environment Variables (Railway)

Railway sẽ tự động inject:
- `DATABASE_URL` — PostgreSQL connection
- `NEXTAUTH_SECRET` — Auth secret key
- Các biến khác từ Settings → Variables

## 📋 Scripts Sẵn Có

```bash
npm run dev              # Dev server (next dev)
npm run build            # Build production
npm run start            # Start prod server
npm run lint             # ESLint
npm run test             # Vitest
npm run db:migrate       # Prisma migrate dev
npm run db:push          # Push schema to DB
npm run db:seed          # Seed data
npm run db:studio        # Prisma Studio UI
npm run db:reset         # Reset & re-seed (⚠️ prod)
```

## 🗂️ Cấu Trúc Thư Mục

```
src/
├── app/                 # Next.js pages (App Router)
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Dashboard
│   ├── api/             # Route handlers
│   └── [module]/        # Pages (patients, appointments, etc.)
├── components/
│   ├── layout/          # Sidebar, Header
│   └── ui/              # Reusable components
├── lib/
│   ├── auth.ts          # Authentication helpers
│   ├── db.ts            # Prisma client
│   └── utils.ts         # Utilities
├── db/
│   └── queries/         # Database queries
└── types/               # TypeScript types

prisma/
├── schema.prisma        # Database schema
├── seed.ts              # Initial data
└── migrations/          # Auto-generated
```

## 🔐 Bảo Mật

- ✅ NextAuth.js v5 (JWT sessions)
- ✅ Role-based access control (RBAC)
- ✅ Password hashing (bcryptjs)
- ✅ SQL injection prevention (Prisma ORM)
- ✅ CSRF protection (NextAuth)
- ✅ Secure headers (Next.js defaults)
- ✅ Environment variable validation

## 📚 Database Schema

**Core Models:**
- `User` — Tài khoản đăng nhập
- `Patient` — Bệnh nhân
- `Doctor` — Bác sĩ
- `Appointment` — Lịch hẹn
- `MedicalRecord` — Hồ sơ bệnh án
- `Invoice` — Hóa đơn
- `Drug`, `DrugInventory` — Kho thuốc
- `Prescription` — Đơn thuốc

**Đầy đủ:** Xem [schema.prisma](prisma/schema.prisma)

## 🧪 Testing

```bash
npm run test              # Run unit tests
npm run test:ui           # Vitest UI
npm run test:coverage     # Coverage report
npm run test:e2e          # E2E tests (nếu có)
```

## 📖 Thêm Thông Tin

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org)
- [Tailwind CSS](https://tailwindcss.com)

## 📝 Commit Convention

```
feat(module): Thêm tính năng
fix(module): Sửa lỗi
docs: Cập nhật docs
chore: Cập nhật dependencies
test: Thêm tests
perf: Tối ưu performance
```

## 📞 Support

Dự án nội bộ — liên hệ team lead nếu có thắc mắc.

---

**Phòng Khám An Khang** © 2024 — Xây dựng với ❤️ cho tác vụ quản lý phòng khám
