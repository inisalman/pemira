#!/bin/sh
set -e

echo "Running database migrations..."

# Resolve any failed migrations first, then deploy
node_modules/.bin/prisma migrate resolve --rolled-back 20260510120000_add_candidate_photo_wakil 2>/dev/null || true
node_modules/.bin/prisma migrate deploy

echo "Starting Next.js server..."
node server.js
