$ErrorActionPreference = 'Stop'
# Arranca AMARU en modo local: verifica Node/pnpm, instala dependencias si
# faltan, aplica migraciones D1 locales, inicia Vite y abre el navegador.

$root = Split-Path -Parent $PSScriptRoot
$port = 5174
$url = "http://127.0.0.1:$port"
$healthUrl = "$url/__amaru/health"
Set-Location $root

function Write-Step($text) { Write-Host "`n> $text" -ForegroundColor Cyan }
function Fail($text) {
  Write-Host "`n[ERROR] $text" -ForegroundColor Red
  Read-Host 'Presiona Enter para cerrar'
  exit 1
}
function Test-Health {
  try {
    $r = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2
    return [bool]$r.ok
  } catch { return $false }
}

Write-Host 'AMARU AI Observatory - servidor local' -ForegroundColor White

if (Test-Health) {
  Write-Host "El servidor ya está en marcha en $url. Abriendo el navegador..." -ForegroundColor Green
  Start-Process $url
  exit 0
}

Write-Step 'Verificando Node.js'
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { Fail 'No se encontró Node.js. Instala Node 24 desde https://nodejs.org y vuelve a intentarlo.' }
Write-Host ("Node " + (& node --version))

Write-Step 'Verificando pnpm'
$pnpm = @('pnpm')
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  if (Get-Command corepack -ErrorAction SilentlyContinue) {
    $pnpm = @('corepack', 'pnpm')
    Write-Host 'pnpm no está en el PATH; se usará corepack pnpm.'
  } else {
    Fail 'No se encontró pnpm. Ejecuta "corepack enable" o "npm install -g pnpm".'
  }
}
function Invoke-Pnpm([string[]]$arguments) {
  $exe = $pnpm[0]
  $rest = @($pnpm | Select-Object -Skip 1) + $arguments
  & $exe @rest | Out-Host
  return $LASTEXITCODE
}

$listening = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($listening) {
  Fail "El puerto $port ya está ocupado por otro proceso (PID $($listening[0].OwningProcess)). Ciérralo o usa Apagar-Servidor.cmd."
}

if (-not (Test-Path (Join-Path $root 'node_modules'))) {
  Write-Step 'Instalando dependencias (primera vez, puede tardar unos minutos)'
  if ((Invoke-Pnpm @('install')) -ne 0) { Fail 'Falló la instalación de dependencias.' }
}

Write-Step 'Aplicando migraciones locales de la base de datos'
if ((Invoke-Pnpm @('db:migrate:local')) -ne 0) {
  Write-Host '[AVISO] Las migraciones fallaron; el servidor arrancará igual y la interfaz indicará si faltan.' -ForegroundColor Yellow
}

Write-Step "Iniciando el servidor en $url"
Write-Host 'Para apagarlo: botón "Apagar servidor" en Visualización, Apagar-Servidor.cmd o Ctrl+C en esta ventana.' -ForegroundColor DarkGray

# Opens the browser once the dev server answers; dies with this window.
$opener = Start-Job -ArgumentList $healthUrl, $url -ScriptBlock {
  param($health, $target)
  for ($i = 0; $i -lt 120; $i++) {
    Start-Sleep -Seconds 1
    try {
      $r = Invoke-RestMethod -Uri $health -TimeoutSec 2
      if ($r.ok) { Start-Process $target; return }
    } catch {}
  }
}

try {
  $code = Invoke-Pnpm @('dev')
} finally {
  Stop-Job $opener -ErrorAction SilentlyContinue
  Remove-Job $opener -Force -ErrorAction SilentlyContinue
}
Write-Host "`nServidor detenido." -ForegroundColor Yellow
exit $code
