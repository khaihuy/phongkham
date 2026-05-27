# Hướng Dẫn Deploy Lên Railway

Tài liệu này hướng dẫn deploy Phòng Khám CRM lên [Railway](https://railway.app) bằng GitHub integration. Toàn bộ quá trình mất khoảng **5–10 phút**.

## Yêu Cầu

- Tài khoản Railway (đăng ký miễn phí tại [railway.app](https://railway.app))
- Repo `khaihuy/phongkham` (đã có)
- Branch để deploy (mặc định: `main` hoặc branch sản phẩm)

## Tổng Quan Kiến Trúc Trên Railway

```
┌──────────────────────────┐       ┌────────────────────┐
│  phongkham-app           │──────▶│  Postgres plugin   │
│  (Next.js, Dockerfile)   │       │  (DATABASE_URL)    │
│  PORT = $PORT (Railway)  │       └────────────────────┘
│  Healthcheck /api/health │
└──────────────────────────┘
            │
            ▼ (optional)
┌──────────────────────────┐
│  Redis plugin            │
│  (REDIS_URL)             │
└──────────────────────────┘
```

## Bước 1 — Tạo Project Trên Railway

1. Đăng nhập [railway.app](https://railway.app)
2. Bấm **"New Project"** → **"Deploy from GitHub repo"**
3. Cấp quyền Railway truy cập repo `khaihuy/phongkham` (lần đầu)
4. Chọn repo **`khaihuy/phongkham`**
5. Chọn branch: `main` (production) hoặc `claude/load-system-RzX0A` (staging)
6. Railway sẽ tự phát hiện `Dockerfile` + `railway.json` → bắt đầu build

## Bước 2 — Thêm PostgreSQL Plugin

1. Trong project vừa tạo, bấm **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway tự sinh biến `DATABASE_URL` ở plugin
3. Sang service `phongkham-app` → tab **"Variables"** → bấm **"Add Reference"**
4. Chọn `Postgres.DATABASE_URL` → service sẽ tự inject biến

## Bước 3 — Cấu Hình Biến Môi Trường

Vào service `phongkham-app` → tab **"Variables"**, thêm:

| Biến | Giá trị | Bắt buộc |
|---|---|---|
| `DATABASE_URL` | (reference từ Postgres plugin) | ✅ |
| `NEXTAUTH_SECRET` | chuỗi ngẫu nhiên ≥ 32 ký tự ([sinh tại đây](https://generate-secret.vercel.app/32)) | ✅ |
| `NEXTAUTH_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `REDIS_URL` | (reference nếu thêm Redis plugin) | ⬜ optional |
| `ZALO_OA_ID` | (lấy từ Zalo OA) | ⬜ optional |
| `ZALO_OA_SECRET` | (lấy từ Zalo OA) | ⬜ optional |
| `SMS_API_KEY` | (lấy từ nhà cung cấp SMS) | ⬜ optional |
| `SMS_BRAND_NAME` | tên brand SMS | ⬜ optional |
| `SMTP_HOST` | SMTP host | ⬜ optional |
| `SMTP_PORT` | `587` | ⬜ optional |
| `SMTP_USER` | email user | ⬜ optional |
| `SMTP_PASS` | email password | ⬜ optional |
| `SMTP_FROM` | `noreply@phongkham.vn` | ⬜ optional |

> **Lưu ý**: `NEXTAUTH_URL` dùng `${{RAILWAY_PUBLIC_DOMAIN}}` để tự bắt domain Railway sinh ra. Sau khi gắn custom domain, đổi sang domain thật.

## Bước 4 — Generate Public Domain

1. Service `phongkham-app` → tab **"Settings"** → **"Networking"**
2. Bấm **"Generate Domain"** → Railway sinh URL dạng `phongkham-app-production-XXXX.up.railway.app`
3. (Tuỳ chọn) Thêm custom domain riêng của phòng khám

## Bước 5 — Trigger Deploy

Sau khi cấu hình xong, Railway tự deploy. Theo dõi log:

1. Tab **"Deployments"** → bấm vào deployment mới nhất
2. Quan sát các bước:
   - `Building` — Docker multi-stage build (~3–5 phút lần đầu)
   - `Deploying` — push image lên Railway runtime
   - `Initializing database schema` — chạy `prisma db push` (từ `start.sh`)
   - `Seeding database` — chạy seed (admin/Password123!, 20 bệnh nhân, …)
   - `Starting Phòng Khám CRM...` — Next.js server lắng nghe `$PORT`
3. Healthcheck `/api/health` phải trả 200 → status chuyển sang **"SUCCESS"**

## Bước 6 — Verify Deployment

```bash
# Healthcheck
curl https://<your-railway-domain>/api/health
# → { "status": "ok", "db": "connected", "timestamp": "..." }

# Login page
curl -I https://<your-railway-domain>/login
# → 200 OK
```

Mở browser tại `https://<your-railway-domain>` → đăng nhập:

```
Username: admin
Password: Password123!
```

## ⚠️ Bảo Mật Quan Trọng

Sau khi deploy thành công, **đổi mật khẩu admin ngay**:

1. Login → **Settings** → **Nhân Sự** → đổi mật khẩu cho tài khoản `admin`
2. Hoặc xoá user demo, tạo tài khoản admin riêng

Seed script (`prisma/seed.ts`) chỉ chạy nếu DB rỗng — không ghi đè dữ liệu thật. Để **tắt seed trong production**, sửa `start.sh`:

```sh
# Production — skip seed
# ./node_modules/.bin/tsx prisma/seed.ts
```

## Xử Lý Sự Cố

### Build fail: "prisma: command not found"

Đảm bảo `prisma` ở `devDependencies` được cài. Dockerfile dùng `npm ci` (cài cả dev) nên đã OK.

### Runtime fail: "Can't reach database server"

- Kiểm tra `DATABASE_URL` đã reference đúng Postgres plugin chưa
- Kiểm tra Postgres plugin đã start chưa
- Trong Railway dashboard → Postgres plugin → tab **"Data"** → đảm bảo có thể connect

### Healthcheck timeout

- Tăng `healthcheckTimeout` trong `railway.json` (mặc định 100s)
- Kiểm tra `/api/health` log — có thể DB connection chậm khi cold start

### NextAuth lỗi "Configuration"

- Đảm bảo `NEXTAUTH_SECRET` đủ ≥ 32 ký tự
- Đảm bảo `NEXTAUTH_URL` khớp domain thật (không có trailing slash)

## Auto-Deploy Khi Push

Railway tự deploy mỗi khi có commit mới vào branch đã chọn. Để tắt: Service → **Settings** → **Service** → **Automatic Deploys** → Disable.

## Chi Phí

- **Trial**: $5 free credit/tháng (đủ cho dev/staging)
- **Hobby plan**: $5/tháng + usage (~$10–20/tháng cho production nhỏ)
- **Pro**: $20/tháng + usage (production có SLA)

Xem chi tiết: [railway.app/pricing](https://railway.app/pricing)
