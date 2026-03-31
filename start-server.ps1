param(
  [int]$Port = 8080,
  [string]$Root = (Split-Path -Parent $MyInvocation.MyCommand.Path)
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$resolvedRoot = (Resolve-Path $Root).Path

$mimeTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.js' = 'application/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.png' = 'image/png'
  '.jpg' = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.gif' = 'image/gif'
  '.svg' = 'image/svg+xml'
  '.ico' = 'image/x-icon'
  '.txt' = 'text/plain; charset=utf-8'
  '.wav' = 'audio/wav'
  '.mp3' = 'audio/mpeg'
}

function Write-Response {
  param(
    [System.IO.Stream]$Stream,
    [int]$StatusCode,
    [string]$Reason,
    [string]$ContentType,
    [byte[]]$Body,
    [bool]$HeadOnly = $false
  )

  $header = "HTTP/1.1 $StatusCode $Reason`r`n" +
    "Content-Type: $ContentType`r`n" +
    "Content-Length: $($Body.Length)`r`n" +
    "Connection: close`r`n`r`n"

  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)

  if (-not $HeadOnly -and $Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
$listener.Start()

$ips = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254.*' } |
  Select-Object -ExpandProperty IPAddress -Unique

Write-Host "Servidor ECO GUARDIAN iniciado" -ForegroundColor Green
Write-Host "Pasta: $resolvedRoot"
Write-Host "Local: http://localhost:$Port"
if ($ips) {
  foreach ($ip in $ips) {
    Write-Host "Rede:  http://${ip}:$Port"
  }
}
Write-Host "Pressione Ctrl+C para parar."

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()

    try {
      $stream = $client.GetStream()
      $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)

      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        $empty = [byte[]]::new(0)
        Write-Response -Stream $stream -StatusCode 400 -Reason 'Bad Request' -ContentType 'text/plain; charset=utf-8' -Body $empty
        continue
      }

      # Read and ignore headers.
      while ($true) {
        $line = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($line)) { break }
      }

      $parts = $requestLine.Split(' ')
      if ($parts.Count -lt 2) {
        $body = [System.Text.Encoding]::UTF8.GetBytes('400 - Bad Request')
        Write-Response -Stream $stream -StatusCode 400 -Reason 'Bad Request' -ContentType 'text/plain; charset=utf-8' -Body $body
        continue
      }

      $method = $parts[0].ToUpperInvariant()
      $rawPath = $parts[1]
      $headOnly = $method -eq 'HEAD'

      if ($method -ne 'GET' -and -not $headOnly) {
        $body = [System.Text.Encoding]::UTF8.GetBytes('405 - Method Not Allowed')
        Write-Response -Stream $stream -StatusCode 405 -Reason 'Method Not Allowed' -ContentType 'text/plain; charset=utf-8' -Body $body
        continue
      }

      $pathOnly = $rawPath.Split('?')[0]
      $requestPath = [System.Uri]::UnescapeDataString($pathOnly.TrimStart('/'))
      if ([string]::IsNullOrWhiteSpace($requestPath)) {
        $requestPath = 'index.html'
      }

      $combined = Join-Path $resolvedRoot $requestPath
      $fullPath = [System.IO.Path]::GetFullPath($combined)

      if (-not $fullPath.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes('403 - Forbidden')
        Write-Response -Stream $stream -StatusCode 403 -Reason 'Forbidden' -ContentType 'text/plain; charset=utf-8' -Body $body -HeadOnly:$headOnly
        continue
      }

      if (Test-Path $fullPath -PathType Container) {
        $fullPath = Join-Path $fullPath 'index.html'
      }

      if (-not (Test-Path $fullPath -PathType Leaf)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes('404 - Not Found')
        Write-Response -Stream $stream -StatusCode 404 -Reason 'Not Found' -ContentType 'text/plain; charset=utf-8' -Body $body -HeadOnly:$headOnly
        continue
      }

      $ext = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
      $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }
      $fileBytes = [System.IO.File]::ReadAllBytes($fullPath)

      Write-Response -Stream $stream -StatusCode 200 -Reason 'OK' -ContentType $contentType -Body $fileBytes -HeadOnly:$headOnly
    } catch {
      Write-Warning "Erro no request: $($_.Exception.Message)"
    } finally {
      if ($client.Connected) { $client.Close() }
    }
  }
} finally {
  $listener.Stop()
}
