#!/bin/sh
set -e

echo "🔄 Initializing database..."

# Run migrations (or create schema with db push if migrations don't exist)
if ! ./node_modules/.bin/prisma migrate deploy; then
  echo "⚠️  migrate deploy failed, trying db push..."
  ./node_modules/.bin/prisma db push --skip-generate || true
fi

echo "🌱 Seeding database..."
./node_modules/.bin/prisma db seed

echo "✅ Database ready"
echo "🚀 Starting Phòng Khám CRM..."

exec node server.js
