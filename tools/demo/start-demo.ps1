# POTORY 시연 시작 (배포)
#  1) Docker 전체 켜기  2) Cloudflare 임시 터널로 API 외부 공개
#  3) 터널 주소를 GitHub 저장소 변수 API_URL 에 저장  4) Pages 다시 빌드·배포  5) 접속 링크 출력
# 실행: custom-pot 폴더에서  powershell -ExecutionPolicy Bypass -File tools\demo\start-demo.ps1
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..\..')

Write-Host "`n[1/5] Docker 서비스 켜는 중..." -ForegroundColor Cyan
docker compose up -d | Out-Null

Write-Host "[2/5] Cloudflare 임시 터널 여는 중..." -ForegroundColor Cyan
docker compose --profile tunnel up -d --force-recreate tunnel | Out-Null
$url = $null
for ($i = 0; $i -lt 40 -and -not $url; $i++) {
  Start-Sleep 2
  $log = docker compose --profile tunnel logs tunnel 2>$null | Out-String
  $m = [regex]::Matches($log, 'https://[a-z0-9-]+\.trycloudflare\.com')
  if ($m.Count -gt 0) { $url = $m[$m.Count - 1].Value }
}
if (-not $url) { throw '터널 주소를 찾지 못했어요. docker compose --profile tunnel logs tunnel 로 확인하세요.' }
Write-Host "      API 주소: $url" -ForegroundColor Green

Write-Host "[3/5] API가 터널로 응답하는지 확인 중..." -ForegroundColor Cyan
$ok = $false
for ($i = 0; $i -lt 30 -and -not $ok; $i++) {
  try { $r = Invoke-WebRequest "$url/health" -UseBasicParsing -TimeoutSec 5; $ok = $r.StatusCode -eq 200 } catch { Start-Sleep 3 }
}
if (-not $ok) { throw "터널로 API에 접속이 안 돼요: $url/health" }
Write-Host "      정상 응답" -ForegroundColor Green

Write-Host "[4/5] GitHub Pages 다시 배포 중 (1~2분)..." -ForegroundColor Cyan
gh variable set API_URL --body $url | Out-Null
gh workflow run deploy-pages.yml | Out-Null
Start-Sleep 5
$runId = gh run list --workflow deploy-pages.yml --limit 1 --json databaseId --jq '.[0].databaseId'
gh run watch $runId --exit-status --interval 10 | Out-Null
if ($LASTEXITCODE -ne 0) { throw "배포 실패: gh run view $runId --log-failed 로 확인하세요." }

$site = (gh api "repos/{owner}/{repo}/pages" --jq '.html_url').TrimEnd('/')
Write-Host "`n[5/5] 시연 준비 완료" -ForegroundColor Green
Write-Host "  Shop    : $site/"
Write-Host "  Admin   : $site/admin/"
Write-Host "  Console : $site/console/"
Write-Host "  API     : $url  (이 PC가 켜져 있는 동안만 동작)"
Write-Host "`n끝나면: powershell -ExecutionPolicy Bypass -File tools\demo\stop-demo.ps1`n"
