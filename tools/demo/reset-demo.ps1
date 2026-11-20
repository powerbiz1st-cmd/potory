# POTORY 시연용 초기화
#  1) 지금 DB를 backups/before-reset-*.sql.gz 로 먼저 백업 (되돌릴 수 있게)
#  2) 주문·기록을 모두 지우고 데모 주문 22건 + 재고로 다시 채움 (tools/demo/demo-data.sql)
#  3) 감시 기록·알림 메일함(Mailpit)·장애 시연 스위치 비우기
# 실행: custom-pot 폴더에서  powershell -ExecutionPolicy Bypass -File tools\demo\reset-demo.ps1
# 되돌리기: gunzip -c backups\before-reset-....sql.gz | docker compose exec -T db psql -U potory -d potory
param([switch]$Yes)
$ErrorActionPreference = 'Stop'
function Quiet([string]$c) { cmd /c "$c >nul 2>&1" }
Set-Location (Join-Path $PSScriptRoot '..\..')

if (-not $Yes) {
  Write-Host '지금 DB의 주문·기록을 모두 지우고 데모 데이터로 바꿉니다. (직전 상태는 backups 폴더에 백업)' -ForegroundColor Yellow
  $a = Read-Host '계속할까요? (y/n)'
  if ($a -ne 'y') { Write-Host '취소했어요.'; exit 1 }
}

Write-Host "`n[1/4] DB 켜고 백업 중..." -ForegroundColor Cyan
Quiet 'docker compose up -d db'
New-Item -ItemType Directory -Force backups | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$bk = "backups/before-reset-$stamp.sql.gz"
cmd /c "docker compose exec -T db sh -c ""pg_dump -U potory -d potory --clean --if-exists | gzip"" > $bk"
if ((Get-Item $bk).Length -lt 200) { throw "백업이 비어 있어요: $bk — 초기화를 멈춥니다." }
Write-Host "      백업: $bk ($([math]::Round((Get-Item $bk).Length / 1KB, 1))KB)" -ForegroundColor Green

Write-Host '[2/4] 데모 데이터 넣는 중...' -ForegroundColor Cyan
$out = cmd /c "docker compose exec -T db psql -U potory -d potory -v ON_ERROR_STOP=1 -q < tools\demo\demo-data.sql 2>&1"
if ($LASTEXITCODE -ne 0) { $out; throw '데모 데이터를 넣지 못했어요. (DB는 트랜잭션이라 바뀌지 않았어요)' }
$out | ForEach-Object { "      $_" }

Write-Host '[3/4] API 1·2호기 다시 켜기 (장애 시연 스위치 초기화)...' -ForegroundColor Cyan
# 감시를 먼저 멈춰야 API 재시작이 "장애"로 잡혀 실제 메일이 가지 않음
Quiet 'docker compose stop watchdog'
Quiet 'docker compose restart api-1 api-2'

Write-Host '[4/4] 감시 기록·알림 메일함 비우는 중...' -ForegroundColor Cyan
Quiet 'docker compose run --rm --no-deps --entrypoint sh watchdog -c "rm -f /data/incidents.json"'
Quiet 'docker compose up -d watchdog'
try { Invoke-WebRequest -Method Delete 'http://localhost:8025/api/v1/messages' -UseBasicParsing -TimeoutSec 5 | Out-Null } catch { }

# API가 다시 뜰 때까지 대기
for ($i = 0; $i -lt 40; $i++) {
  try { if ((Invoke-WebRequest 'http://localhost:3000/health' -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200) { break } } catch { Start-Sleep 3 }
}
Write-Host "`n초기화 완료 — 데모 주문 22건, 재고 재설정, 감시·메일 기록 비움" -ForegroundColor Green
Write-Host '참고: 휴대폰에 저장돼 있던 예전 주문번호는 조회 목록에서 자동으로 사라져요.' -ForegroundColor DarkGray
