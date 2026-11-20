# POTORY 시연 종료: 외부 공개 터널만 닫음 (사내 PC 안의 서비스·데이터는 그대로)
# 실행: custom-pot 폴더에서  powershell -ExecutionPolicy Bypass -File tools\demo\stop-demo.ps1
$ErrorActionPreference = 'Stop'
# docker 진행 메시지(stderr)를 PowerShell이 오류로 오해하지 않게 cmd로 실행
function Quiet([string]$c) { cmd /c "$c >nul 2>&1" }
Set-Location (Join-Path $PSScriptRoot '..\..')
Quiet 'docker compose --profile tunnel stop tunnel'
Quiet 'docker compose --profile tunnel rm -f tunnel'
Write-Host '터널을 닫았어요. 이제 외부에서는 API에 접속할 수 없어요. (GitHub Pages 화면은 남아 있지만 주문·조회는 안 돼요)' -ForegroundColor Green
Write-Host '사내 PC의 서비스까지 모두 끄려면: docker compose down' -ForegroundColor DarkGray
