# POTORY 시연 종료: 외부 공개를 모두 내림 (사내 PC 안의 서비스·데이터는 그대로)
#  1) Cloudflare 터널 닫기 → API 외부 접속 차단
#  2) -KeepPages 를 안 붙이면 GitHub Pages 화면도 내림 (다음 start-demo.ps1 이 자동으로 다시 켬)
# 실행: custom-pot 폴더에서  powershell -ExecutionPolicy Bypass -File tools\demo\stop-demo.ps1 [-KeepPages]
param([switch]$KeepPages)
$ErrorActionPreference = 'Stop'
# docker 진행 메시지(stderr)를 PowerShell이 오류로 오해하지 않게 cmd로 실행
function Quiet([string]$c) { cmd /c "$c >nul 2>&1" }
Set-Location (Join-Path $PSScriptRoot '..\..')

Quiet 'docker compose --profile tunnel stop tunnel'
Quiet 'docker compose --profile tunnel rm -f tunnel'
Write-Host '터널을 닫았어요. 외부에서는 API에 접속할 수 없어요.' -ForegroundColor Green

if (-not $KeepPages) {
  cmd /c "gh api -X DELETE repos/{owner}/{repo}/pages >nul 2>&1"
  if ($LASTEXITCODE -eq 0) { Write-Host 'GitHub Pages 화면도 내렸어요. (다음 start-demo.ps1 실행 때 자동으로 다시 켜져요)' -ForegroundColor Green }
  else { Write-Host 'GitHub Pages는 이미 내려가 있어요.' -ForegroundColor DarkGray }
}
Write-Host '사내 PC의 서비스까지 모두 끄려면: docker compose down  (데이터는 남음)' -ForegroundColor DarkGray
