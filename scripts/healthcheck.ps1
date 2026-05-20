param([switch]$Fix)

$backendDir = Join-Path $PSScriptRoot "..\backend"
$frontendDir = Join-Path $PSScriptRoot "..\frontend"
$ok = $true

# Backend health
$be = netstat -ano | Select-String ":5000 " | Select-String "LISTENING"
if (-not $be) {
  Write-Host "[FAIL] Backend (5000) - NOT RUNNING" -ForegroundColor Red
  $ok = $false
  if ($Fix) {
    Write-Host "  -> Starting backend..." -ForegroundColor Yellow
    Start-Process -WindowStyle Hidden -FilePath "node" -ArgumentList "src/server.js" -WorkingDirectory $backendDir
    Start-Sleep -Seconds 3
  }
} else {
  Write-Host "[OK]   Backend (5000) - RUNNING" -ForegroundColor Green
}

# Frontend health
$fe = netstat -ano | Select-String ":5173 " | Select-String "LISTENING"
if (-not $fe) {
  Write-Host "[FAIL] Frontend (5173) - NOT RUNNING" -ForegroundColor Red
  $ok = $false
  if ($Fix) {
    Write-Host "  -> Starting frontend..." -ForegroundColor Yellow
    Start-Process -WindowStyle Hidden -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory $frontendDir
    Start-Sleep -Seconds 5
  }
} else {
  Write-Host "[OK]   Frontend (5173) - RUNNING" -ForegroundColor Green
}

# API health
try {
  $r = Invoke-WebRequest -Uri "http://localhost:5000/api/products" -UseBasicParsing -TimeoutSec 5
  if ($r.StatusCode -eq 200) {
    Write-Host "[OK]   API /api/products - RESPONDING" -ForegroundColor Green
  }
} catch {
  Write-Host "[FAIL] API - NOT RESPONDING ($($_.Exception.Message))" -ForegroundColor Red
  $ok = $false
}

if (-not $ok) {
  Write-Host "`nAlgunos servicios no estan corriendo." -ForegroundColor Yellow
  if (-not $Fix) { Write-Host "Usa: .\scripts\healthcheck.ps1 -Fix para intentar reparar automaticamente." -ForegroundColor Cyan }
  exit 1
} else {
  Write-Host "`nTodo OK - http://localhost:5173" -ForegroundColor Green
  exit 0
}
