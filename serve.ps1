$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:4173/")
$listener.Start()
Write-Host "Server running at http://localhost:4173"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $requestPath = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($requestPath)) { $requestPath = "index.html" }

    $filePath = Join-Path $PSScriptRoot $requestPath
    if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        $context.Response.StatusCode = 404
        $context.Response.Close()
        continue
    }

    $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
    $contentTypes = @{
        ".html" = "text/html; charset=utf-8"
        ".css" = "text/css; charset=utf-8"
        ".js" = "application/javascript; charset=utf-8"
    }
    $context.Response.ContentType = $contentTypes[$extension]
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $context.Response.Close()
}
