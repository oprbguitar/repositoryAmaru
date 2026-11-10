$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$viteCli = Join-Path $root 'node_modules\vite\bin\vite.js'
$proxyScript = Join-Path $PSScriptRoot 'web-share-proxy.mjs'
$credentialPath = Join-Path $root '.share.env'
$vitePort = 5174
$proxyPort = 5175
$runId = [Guid]::NewGuid().ToString('N')
$logRoot = Join-Path ([System.IO.Path]::GetTempPath()) "amaru-observatory-share-$runId"
$processes = [System.Collections.Generic.List[System.Diagnostics.Process]]::new()
$lifetimeJob = $null
$publicUrl = $null
$exitCode = 0

$jobTypeDefinition = @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;

namespace Amaru.Share {
    public sealed class KillOnCloseJob : IDisposable {
        private IntPtr handle;

        [StructLayout(LayoutKind.Sequential)]
        private struct BasicLimitInformation {
            public long PerProcessUserTimeLimit;
            public long PerJobUserTimeLimit;
            public uint LimitFlags;
            public UIntPtr MinimumWorkingSetSize;
            public UIntPtr MaximumWorkingSetSize;
            public uint ActiveProcessLimit;
            public UIntPtr Affinity;
            public uint PriorityClass;
            public uint SchedulingClass;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct IoCounters {
            public ulong ReadOperationCount;
            public ulong WriteOperationCount;
            public ulong OtherOperationCount;
            public ulong ReadTransferCount;
            public ulong WriteTransferCount;
            public ulong OtherTransferCount;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct ExtendedLimitInformation {
            public BasicLimitInformation BasicLimitInformation;
            public IoCounters IoInfo;
            public UIntPtr ProcessMemoryLimit;
            public UIntPtr JobMemoryLimit;
            public UIntPtr PeakProcessMemoryUsed;
            public UIntPtr PeakJobMemoryUsed;
        }

        [DllImport("kernel32.dll", EntryPoint = "CreateJobObjectW", CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern IntPtr CreateJobObject(IntPtr attributes, string name);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool SetInformationJobObject(IntPtr job, int informationClass, IntPtr information, uint informationLength);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern IntPtr OpenProcess(uint desiredAccess, bool inheritHandle, int processId);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool CloseHandle(IntPtr handle);

        public KillOnCloseJob() {
            handle = CreateJobObject(IntPtr.Zero, null);
            if (handle == IntPtr.Zero) throw new Win32Exception(Marshal.GetLastWin32Error());
            var info = new ExtendedLimitInformation();
            info.BasicLimitInformation.LimitFlags = 0x2000;
            var size = Marshal.SizeOf(typeof(ExtendedLimitInformation));
            var buffer = Marshal.AllocHGlobal(size);
            try {
                Marshal.StructureToPtr(info, buffer, false);
                if (!SetInformationJobObject(handle, 9, buffer, (uint)size))
                    throw new Win32Exception(Marshal.GetLastWin32Error());
            } catch {
                Dispose();
                throw;
            } finally {
                Marshal.FreeHGlobal(buffer);
            }
        }

        public void Assign(int processId) {
            const uint processSetQuota = 0x0100;
            const uint processTerminate = 0x0001;
            var process = OpenProcess(processSetQuota | processTerminate, false, processId);
            if (process == IntPtr.Zero) throw new Win32Exception(Marshal.GetLastWin32Error());
            try {
                if (!AssignProcessToJobObject(handle, process))
                    throw new Win32Exception(Marshal.GetLastWin32Error());
            } finally {
                CloseHandle(process);
            }
        }

        public void Dispose() {
            if (handle != IntPtr.Zero) {
                CloseHandle(handle);
                handle = IntPtr.Zero;
            }
        }
    }
}
'@

function Get-CommandPath([string] $name) {
    $command = Get-Command $name -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -eq $command) { return $null }
    return $command.Source
}

function Test-LoopbackPortFree([int] $port) {
    $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $port)
    try {
        $listener.Start()
        return $true
    }
    catch {
        return $false
    }
    finally {
        $listener.Stop()
    }
}

function Start-TrackedProcess([string] $file, [string[]] $arguments, [string] $stdoutPath, [string] $stderrPath) {
    $process = Start-Process -FilePath $file -ArgumentList $arguments -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
    $processes.Add($process) | Out-Null
    $lifetimeJob.Assign($process.Id)
    return $process
}

function Get-HttpStatus([string] $uri, [string] $authorization = $null) {
    $request = [System.Net.HttpWebRequest]::Create($uri)
    $request.Method = 'GET'
    $request.Timeout = 3500
    $request.ReadWriteTimeout = 3500
    $request.AllowAutoRedirect = $false
    if ($uri.StartsWith('http://127.0.0.1:', [StringComparison]::OrdinalIgnoreCase)) {
        $request.Proxy = $null
    }
    else {
        $request.Proxy = [System.Net.WebRequest]::DefaultWebProxy
    }
    if ($null -ne $authorization) { $request.Headers['Authorization'] = $authorization }

    try {
        $response = [System.Net.HttpWebResponse]$request.GetResponse()
        try { return [int]$response.StatusCode } finally { $response.Close() }
    }
    catch [System.Net.WebException] {
        if ($null -ne $_.Exception.Response) {
            try { return [int]$_.Exception.Response.StatusCode } finally { $_.Exception.Response.Close() }
        }
        return 0
    }
    catch {
        return 0
    }
}

function Wait-ForStatus([string] $uri, [int] $expectedStatus, [int] $timeoutSeconds, [string] $authorization = $null, [System.Diagnostics.Process] $trackedProcess = $null) {
    $deadline = [DateTime]::UtcNow.AddSeconds($timeoutSeconds)
    while ([DateTime]::UtcNow -lt $deadline) {
        if ($null -ne $trackedProcess -and $trackedProcess.HasExited) { return $false }
        if ((Get-HttpStatus -uri $uri -authorization $authorization) -eq $expectedStatus) { return $true }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

function Stop-TrackedProcess([System.Diagnostics.Process] $process) {
    if ($null -eq $process) { return }
    try {
        $process.Refresh()
        if (-not $process.HasExited) {
            & "$env:SystemRoot\System32\taskkill.exe" /PID $process.Id /T /F *> $null
            $process.WaitForExit(5000) | Out-Null
        }
    }
    catch { }
}

function New-SharePassword {
    $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $bytes = New-Object byte[] 32
        $random.GetBytes($bytes)
        return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
    }
    finally {
        $random.Dispose()
    }
}

function Wait-ForTunnelUrl([string[]] $logPaths, [int] $timeoutSeconds, [System.Diagnostics.Process] $tunnelProcess) {
    $deadline = [DateTime]::UtcNow.AddSeconds($timeoutSeconds)
    $pattern = 'https://[a-z0-9-]+\.trycloudflare\.com'
    while ([DateTime]::UtcNow -lt $deadline) {
        if ($tunnelProcess.HasExited) { return $null }
        foreach ($logPath in $logPaths) {
            if (-not (Test-Path -LiteralPath $logPath)) { continue }
            try {
                $match = [regex]::Match((Get-Content -LiteralPath $logPath -Raw -ErrorAction Stop), $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                if ($match.Success) { return $match.Value.TrimEnd('.') }
            }
            catch { }
        }
        Start-Sleep -Milliseconds 500
    }
    return $null
}

try {
    $node = Get-CommandPath 'node.exe'
    $cloudflared = Get-CommandPath 'cloudflared.exe'
    if (-not $node -or -not (Test-Path -LiteralPath $viteCli) -or -not (Test-Path -LiteralPath $proxyScript)) {
        Write-Host 'Falta Node.js o no están instaladas las dependencias locales del proyecto.' -ForegroundColor Red
        Write-Host 'Instala Node.js 24 y ejecuta pnpm install desde la carpeta del proyecto.'
        exit 1
    }
    if (-not $cloudflared) {
        Write-Host 'No se encontró cloudflared.exe en PATH. Instálalo y vuelve a iniciar este archivo.' -ForegroundColor Red
        exit 1
    }
    if (-not (Test-LoopbackPortFree $vitePort) -or -not (Test-LoopbackPortFree $proxyPort)) {
        Write-Host "No se puede iniciar: el puerto local $vitePort o $proxyPort ya está ocupado." -ForegroundColor Red
        exit 1
    }

    if (-not ('Amaru.Share.KillOnCloseJob' -as [type])) {
        Add-Type -TypeDefinition $jobTypeDefinition
    }
    $lifetimeJob = [Amaru.Share.KillOnCloseJob]::new()

    New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
    $password = New-SharePassword
    $credentialText = "USERNAME=amaru`r`nPASSWORD=$password`r`n"
    [System.IO.File]::WriteAllText($credentialPath, $credentialText, [System.Text.Encoding]::ASCII)
    $credentialText = $null

    Write-Host 'Iniciando AMARU AI Observatory en localhost...' -ForegroundColor Cyan
    $viteOut = Join-Path $logRoot 'vite.stdout.log'
    $viteErr = Join-Path $logRoot 'vite.stderr.log'
    $viteArguments = @('"' + $viteCli + '"', '--host', '127.0.0.1', '--port', "$vitePort", '--strictPort')
    $viteProcess = Start-TrackedProcess -file $node -arguments $viteArguments -stdoutPath $viteOut -stderrPath $viteErr

    if (-not (Wait-ForStatus -uri "http://127.0.0.1:$vitePort/" -expectedStatus 200 -timeoutSeconds 120 -trackedProcess $viteProcess)) {
        throw 'vite-startup'
    }

    Write-Host 'Iniciando proxy autenticado local...' -ForegroundColor Cyan
    $proxyOut = Join-Path $logRoot 'proxy.stdout.log'
    $proxyErr = Join-Path $logRoot 'proxy.stderr.log'
    $proxyProcess = Start-TrackedProcess -file $node -arguments @('"' + $proxyScript + '"') -stdoutPath $proxyOut -stderrPath $proxyErr
    $authorization = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("amaru:$password"))
    $localUri = "http://127.0.0.1:$proxyPort/"

    if (-not (Wait-ForStatus -uri $localUri -expectedStatus 401 -timeoutSeconds 20 -trackedProcess $proxyProcess)) {
        throw 'proxy-startup'
    }
    Remove-Item -LiteralPath $credentialPath -Force -ErrorAction SilentlyContinue
    if (-not (Wait-ForStatus -uri $localUri -expectedStatus 200 -timeoutSeconds 20 -authorization $authorization -trackedProcess $proxyProcess)) {
        throw 'proxy-readiness'
    }

    Write-Host 'Abriendo túnel HTTPS temporal de Cloudflare...' -ForegroundColor Cyan
    $tunnelOut = Join-Path $logRoot 'cloudflared.stdout.log'
    $tunnelErr = Join-Path $logRoot 'cloudflared.stderr.log'
    $cloudflaredConfig = Join-Path $logRoot 'cloudflared.yml'
    [System.IO.File]::WriteAllText($cloudflaredConfig, '{}', [System.Text.Encoding]::ASCII)
    $tunnelArguments = @('--config', ('"' + $cloudflaredConfig + '"'), '--no-autoupdate', 'tunnel', '--url', "http://127.0.0.1:$proxyPort")
    $tunnelProcess = Start-TrackedProcess -file $cloudflared -arguments $tunnelArguments -stdoutPath $tunnelOut -stderrPath $tunnelErr
    $publicUrl = Wait-ForTunnelUrl -logPaths @($tunnelOut, $tunnelErr) -timeoutSeconds 120 -tunnelProcess $tunnelProcess
    if (-not $publicUrl) { throw 'tunnel-startup' }

    $publicReady = $false
    $publicDeadline = [DateTime]::UtcNow.AddSeconds(120)
    while ([DateTime]::UtcNow -lt $publicDeadline) {
        if ((Get-HttpStatus -uri "$publicUrl/" -authorization $null) -eq 401 -and (Get-HttpStatus -uri "$publicUrl/" -authorization $authorization) -eq 200) {
            $publicReady = $true
            break
        }
        if ($tunnelProcess.HasExited) { break }
        Start-Sleep -Seconds 2
    }
    if (-not $publicReady) { throw 'public-verification' }

    Write-Host ''
    Write-Host 'Observatorio disponible con HTTPS y autenticación.' -ForegroundColor Green
    Write-Host "Enlace: $publicUrl/" -ForegroundColor White
    Write-Host 'Usuario: amaru' -ForegroundColor White
    Write-Host "Clave: $password" -ForegroundColor Yellow
    Write-Host 'El enlace funciona mientras esta ventana y el túnel sigan activos.' -ForegroundColor DarkGray
    Write-Host 'Se abrirá el enlace en tu navegador predeterminado. Presiona Ctrl+C aquí para cerrar todo.' -ForegroundColor DarkGray
    Start-Process -FilePath "$publicUrl/" | Out-Null

    while ($true) {
        foreach ($process in $processes) {
            $process.Refresh()
            if ($process.HasExited) { throw 'service-stopped' }
        }
        Start-Sleep -Seconds 2
    }
}
catch [System.Management.Automation.PipelineStoppedException] {
    Write-Host 'Cerrando servicios y túnel...' -ForegroundColor DarkGray
}
catch {
    $exitCode = 1
    Write-Host ''
    Write-Host 'No se pudo completar el inicio. Revisa que los puertos 5174/5175 estén libres, que Node.js 24 esté instalado y que cloudflared pueda conectarse.' -ForegroundColor Red
    Write-Host 'Los procesos iniciados por este lanzador se cerrarán automáticamente.' -ForegroundColor DarkGray
}
finally {
    for ($index = $processes.Count - 1; $index -ge 0; $index--) {
        Stop-TrackedProcess -process $processes[$index]
    }
    Remove-Item -LiteralPath $credentialPath -Force -ErrorAction SilentlyContinue
    if ($null -ne $lifetimeJob) { $lifetimeJob.Dispose() }
    if (Test-Path -LiteralPath $logRoot) { Remove-Item -LiteralPath $logRoot -Recurse -Force -ErrorAction SilentlyContinue }
}

if ($exitCode -ne 0) { exit $exitCode }
