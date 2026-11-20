# POTORY 시연 종료: 외부 공개 터널만 닫음 (사내 PC 안의 서비스·데이터는 그대로)
# 실행: custom-pot 폴더에서  powershell -ExecutionPolicy Bypass -File tools\demo\stop-demo.ps1
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..\..')
docker compose --profile tunnel stop tunnel | Out-Null
docker compose --profile tunnel rm -f tunnel | Out-Null
Write-Host '터널을 닫았어요. 이제 외부에서는 API에 접속할 수 없어요. (GitHub Pages 화면은 남아 있지만 주문·조회는 안 돼요)' -ForegroundColor Green
Write-Host '사내 PC의 서비스까지 모두 끄려면: docker compose down' -ForegroundColor DarkGray
