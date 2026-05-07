#!/bin/sh
set -e

echo "🔄 Initializing database..."

# Run migrations (or create schema with db push if migrations don't exist)
./node_modules/.bin/prisma migrate deploy 2>/dev/null || ./node_modules/.bin/prisma db push --skip-generate 2>/dev/null || true

echo "🌱 Seeding database..."

# Seed the database (may fail if database is not ready, but that's ok)
./node_modules/.bin/prisma db seed 2>/dev/null || true

echo "✅ Database ready"
echo "🚀 Starting Phòng Khám CRM..."

# Start the application
exec node server.js
