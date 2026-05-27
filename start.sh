#!/bin/sh
set -e

echo "🔄 Initializing database schema..."
./node_modules/.bin/prisma db push --skip-generate --accept-data-loss

echo "🌱 Seeding database..."
./node_modules/.bin/tsx prisma/seed.ts

echo "✅ Database ready"
echo "🚀 Starting Phòng Khám CRM..."

exec node server.js
