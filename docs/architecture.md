# Kiến Trúc Hệ Thống — Phòng Khám CRM

## Sơ Đồ Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                    NGINX (Reverse Proxy)                      │
│              Rate Limiting + SSL Termination                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  NEXT.JS 14 APP (Port 3000)                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Tier 1: App Layer (src/app/)                            │ │
│  │   ├── (auth)/ — Login, Register pages                  │ │
│  │   ├── (dashboard)/ — Protected routes                  │ │
│  │   │   ├── patients/                                     │ │
│  │   │   ├── appointments/                                 │ │
│  │   │   ├── pharmacy/                                     │ │
│  │   │   ├── billing/                                      │ │
│  │   │   ├── reports/                                      │ │
│  │   │   └── settings/                                     │ │
│  │   └── api/ — API Route Handlers                        │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ Tier 2: API Layer (src/app/api/)                        │ │
│  │   ├── auth/ — NextAuth handlers                        │ │
│  │   ├── patients/ — Patient CRUD                         │ │
│  │   ├── appointments/ — Appointment management           │ │
│  │   ├── medical-records/ — EMR endpoints                 │ │
│  │   ├── pharmacy/ — Drug inventory                       │ │
│  │   └── billing/ — Invoice management                   │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ Tier 3: Service Layer (src/lib/services/)              │ │
│  │   ├── patient.service.ts                               │ │
│  │   ├── appointment.service.ts                           │ │
│  │   ├── pharmacy.service.ts                              │ │
│  │   └── billing.service.ts                              │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ Tier 4: Data Layer (src/db/)                           │ │
│  │   ├── prisma.ts — Prisma client singleton             │ │
│  │   ├── queries/ — Typed query functions                │ │
│  │   └── seed.ts — Database seeder                      │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────┬────────────────────────┬────────────────────────-─┘
           │                        │
┌──────────▼───────┐    ┌──────────▼──────────┐
│  PostgreSQL 16   │    │    Redis (Cache)     │
│  Port: 5432      │    │    Port: 6379        │
│  Main database   │    │  Sessions + Queues   │
└──────────────────┘    └─────────────────────┘
```

## Module Map

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          ← Sidebar + Header
│   │   ├── page.tsx            ← Dashboard tổng quan
│   │   ├── patients/
│   │   │   ├── page.tsx        ← Danh sách bệnh nhân
│   │   │   ├── new/page.tsx    ← Thêm bệnh nhân
│   │   │   └── [id]/
│   │   │       ├── page.tsx    ← Chi tiết bệnh nhân
│   │   │       └── records/    ← Hồ sơ bệnh án
│   │   ├── appointments/
│   │   │   ├── page.tsx        ← Danh sách lịch hẹn
│   │   │   ├── calendar/       ← Lịch theo tháng/tuần
│   │   │   └── [id]/page.tsx
│   │   ├── doctors/
│   │   ├── pharmacy/
│   │   ├── billing/
│   │   ├── reports/
│   │   └── settings/
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── patients/
│       │   ├── route.ts        ← GET list, POST create
│       │   └── [id]/route.ts   ← GET, PUT, DELETE
│       ├── appointments/
│       ├── medical-records/
│       ├── pharmacy/
│       └── billing/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Breadcrumb.tsx
│   ├── patients/
│   │   ├── PatientForm.tsx
│   │   ├── PatientTable.tsx
│   │   └── PatientCard.tsx
│   ├── appointments/
│   │   ├── AppointmentForm.tsx
│   │   ├── AppointmentCalendar.tsx
│   │   └── SlotPicker.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Table.tsx
│       ├── Badge.tsx
│       └── StatsCard.tsx
├── lib/
│   ├── auth.ts                 ← NextAuth config
│   ├── services/
│   │   ├── patient.service.ts
│   │   └── appointment.service.ts
│   ├── validations/
│   │   ├── patient.schema.ts
│   │   └── appointment.schema.ts
│   └── utils.ts
├── db/
│   ├── prisma.ts
│   ├── queries/
│   └── seed.ts
├── hooks/
│   ├── use-patients.ts
│   └── use-appointments.ts
└── types/
    └── index.ts
```

## ERD (Entity Relationship Diagram)

```
User ──────────────── UserRole
 │                        │
 │                        ▼
 │                      Role
 │
 ├──── (as Doctor) ──► Doctor
 │                       │
 │                       ├──► DoctorSchedule
 │                       ├──► Appointment ◄──── Patient
 │                       └──► MedicalRecord      │
 │                                │              ├──► PatientVital
 │                                │              └──► Allergy
 │                                ├──► Prescription
 │                                │       └──► PrescriptionItem ──► Drug
 │                                └──► Diagnosis
 │
 └──── (as Staff) ──► Invoice ◄──── Appointment
                         │
                         └──► InvoiceItem
                                  │
                                  ├──► Service
                                  └──► Drug

Drug ──► DrugCategory
  │
  └──► DrugInventory ──► DrugTransaction

Clinic ──► Branch ──► Room
```
