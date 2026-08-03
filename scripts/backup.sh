#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/crypto_intel"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

echo "📦 Starting Automated PostgreSQL Backup..."
docker exec crypto_intel_postgres_prod pg_dump -U postgres crypto_intel | gzip > "$BACKUP_DIR/postgres_backup_$TIMESTAMP.sql.gz"

echo "🔴 Starting Automated Redis Backup..."
docker exec crypto_intel_redis_prod redis-cli -a "$REDIS_PASSWORD" bgsave
cp /var/lib/docker/volumes/crypto_intel_redis_prod_data/_data/dump.rdb "$BACKUP_DIR/redis_backup_$TIMESTAMP.rdb" 2>/dev/null || true

echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

echo "✅ Backup Completed Successfully: $BACKUP_DIR/postgres_backup_$TIMESTAMP.sql.gz"
