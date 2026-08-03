#!/bin/bash

API_HEALTH_URL="http://localhost:8080/api/v1/health"

echo "🔍 Running Production Service Health Check..."

# 1. API Health Check
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_HEALTH_URL)

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "✅ API Server is Healthy (HTTP 200)"
else
  echo "❌ API Server Health Check Failed (HTTP $HTTP_STATUS)"
  exit 1
fi

# 2. Database Health Check
if docker exec crypto_intel_postgres_prod pg_isready -U postgres > /dev/null 2>&1; then
  echo "✅ PostgreSQL Database is Healthy"
else
  echo "❌ PostgreSQL Database Health Check Failed"
  exit 1
fi

# 3. Redis Health Check
if docker exec crypto_intel_redis_prod redis-cli -a "$REDIS_PASSWORD" ping | grep -q PONG; then
  echo "✅ Redis Cache is Healthy"
else
  echo "❌ Redis Cache Health Check Failed"
  exit 1
fi

echo "🚀 All Production Services are ONLINE and HEALTHY."
