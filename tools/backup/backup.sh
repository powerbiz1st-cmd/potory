#!/bin/sh
# POTORY DB 백업: 컨테이너가 켜지면 1번, 이후 BACKUP_INTERVAL_HOURS 마다 pg_dump → /backups/*.sql.gz
# 최근 BACKUP_KEEP 개만 남기고 오래된 건 지움.
# 복원: gunzip -c backups/potory-YYYYMMDD-HHMMSS.sql.gz | docker compose exec -T db psql -U potory -d potory
set -eu
INTERVAL_HOURS="${BACKUP_INTERVAL_HOURS:-24}"
KEEP="${BACKUP_KEEP:-7}"
mkdir -p /backups

backup() {
  name="potory-$(date +%Y%m%d-%H%M%S).sql.gz"
  if pg_dump -h db -U potory -d potory --clean --if-exists | gzip > "/backups/$name.tmp"; then
    mv "/backups/$name.tmp" "/backups/$name"
    echo "[backup] 완료: $name ($(du -k "/backups/$name" | cut -f1)KB)"
  else
    rm -f "/backups/$name.tmp"
    echo "[backup] 실패" >&2
  fi
  # 오래된 백업 정리
  ls -1t /backups/*.sql.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f
}

until pg_isready -h db -U potory -d potory >/dev/null 2>&1; do sleep 2; done
while true; do
  backup
  sleep $((INTERVAL_HOURS * 3600))
done
