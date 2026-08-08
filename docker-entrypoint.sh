#!/bin/sh
set -e

# Push Prisma schema to database (creates tables if not exist)
echo "Pushing Prisma schema to database..."
node ./node_modules/prisma/build/index.js db push --accept-data-loss --schema=./prisma/schema.prisma

echo "Starting Next.js server..."
exec node server.js
