$ErrorActionPreference = 'Stop'
# Apaga el servidor local de AMARU: primero de forma limpia vía
# /__amaru/shutdown; si no responde, ofrece terminar el proceso del puerto.

$port = 5174
$shutdownUrl = "http://127.0.0.1:$port/__amaru/shutdown"

Write-Host 'AMARU AI Observatory - apagar servidor local' -ForegroundColor White
try {
  $r = Invoke-RestMethod -Method Post -Uri $shutdownUrl -Headers @{ 'x-amaru-csrf' = 'local-ui' } -TimeoutSec 5
  if ($r.ok) {
    Write-Host 'Servidor apagado correctamente.' -ForegroundColor Green
    Start-Sleep -Seconds 2
    exit 0
  }
} catch {
  Write-Host 'El servidor no respondió a la solicitud de apagado limpio.' -ForegroundColor Yellow
}

$connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if (-not $connections) {
  Write-Host "No hay ningún proceso escuchando en el puerto $port. Nada que apagar." -ForegroundColor Green
  Start-Sleep -Seconds 2
  exit 0
}

$ids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($id in $ids) {
  $process = Get-Process -Id $id -ErrorAction SilentlyContinue
  $name = if ($process) { $process.ProcessName } else { 'desconocido' }
  Write-Host "Proceso en el puerto ${port}: $name (PID $id)"
}
$answer = Read-Host '¿Terminar este proceso? (S/N)'
if ($answer -match '^[sS]') {
  foreach ($id in $ids) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue }
  Write-Host 'Proceso terminado.' -ForegroundColor Green
} else {
  Write-Host 'No se terminó ningún proceso.'
}
Start-Sleep -Seconds 2
