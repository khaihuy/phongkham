# CLAUDE.md — Phòng Khám CRM

## Tổng Quan Dự Án

CRM quản lý phòng khám tư nhân toàn diện, xây dựng trên Next.js 14 App Router với TypeScript, Prisma ORM, và PostgreSQL.

## Kiến Trúc 4-Tier

```
Tier 1 — Presentation:    src/app/         (Next.js pages + layouts)
Tier 2 — API Layer:       src/app/api/     (Route handlers)
Tier 3 — Service Layer:   src/lib/         (Business logic, services)
Tier 4 — Data Layer:      src/db/          (Prisma client, queries, seeds)
```

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript 5 |
| Database | PostgreSQL 16 |
| ORM | Prisma 5 |
| Auth | NextAuth.js v5 + JWT |
| Validation | Zod |
| UI | Tailwind CSS + shadcn/ui |
| Testing | Vitest + React Testing Library |
| Container | Docker + Docker Compose |

## Modules (7)

1. **Patient (EMR)** — Hồ sơ bệnh nhân, lịch sử khám
2. **Appointment** — Lịch hẹn, slot management, calendar
3. **Pharmacy** — Kho thuốc, đơn thuốc, xuất nhập
4. **Billing** — Hóa đơn, thanh toán, doanh thu
5. **Reports** — Báo cáo thống kê, xuất Excel/PDF
6. **Marketing** — Zalo/SMS, campaign, reminder
7. **Telemedicine** — Khám online, video call

## Roles (RBAC)

| Role | Mô tả |
|---|---|
| `ADMIN` | Quản trị viên — toàn quyền |
| `DOCTOR` | Bác sĩ — khám bệnh, kê đơn |
| `RECEPTIONIST` | Lễ tân — tiếp nhận, lịch hẹn |
| `PHARMACIST` | Dược sĩ — quản lý thuốc |
| `ACCOUNTANT` | Kế toán — thanh toán, báo cáo |

## Convention

### File Naming
- Components: `PascalCase.tsx`
- Hooks: `use-kebab-case.ts`
- Utilities: `kebab-case.ts`
- API routes: `route.ts` trong thư mục tương ứng

### API Responses
```typescript
// Success
{ data: T, meta?: PaginationMeta }

// Error
{ error: string, code: string, details?: ZodError[] }
```

### Commit Messages
```
feat(module): thêm tính năng X
fix(module): sửa lỗi Y
chore: cập nhật dependencies
docs: cập nhật PROGRESS.md
```

## Chạy Dự Án

```bash
# Development
docker-compose up -d db
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# Tests
npm run test
npm run test:e2e

# Production
docker-compose up -d
```

## Biến Môi Trường

Xem `.env.example` để biết các biến cần thiết.

## Liên Hệ

Dự án nội bộ — mọi thắc mắc liên hệ team lead.
