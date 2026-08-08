$ErrorActionPreference = "Stop"

$apiRoot = Split-Path -Parent $PSScriptRoot
$violations = [System.Collections.Generic.List[string]]::new()

function Test-ForbiddenDependency {
    param(
        [string]$Layer,
        [string[]]$ForbiddenNamespaces
    )

    $layerPath = Join-Path $apiRoot $Layer

    Get-ChildItem -LiteralPath $layerPath -Recurse -Filter *.cs | ForEach-Object {
        $content = Get-Content -LiteralPath $_.FullName -Raw

        foreach ($forbiddenNamespace in $ForbiddenNamespaces) {
            if ($content -match "using\s+$([regex]::Escape($forbiddenNamespace))") {
                $relativePath = $_.FullName.Substring($apiRoot.Length + 1)
                $violations.Add("$relativePath depends on $forbiddenNamespace")
            }
        }
    }
}

Test-ForbiddenDependency `
    -Layer "Domain" `
    -ForbiddenNamespaces @("SV5T.Application", "SV5T.Infrastructure", "SV5T.Presentation")

Test-ForbiddenDependency `
    -Layer "Application" `
    -ForbiddenNamespaces @("SV5T.Infrastructure", "SV5T.Presentation")

Test-ForbiddenDependency `
    -Layer "Infrastructure" `
    -ForbiddenNamespaces @("SV5T.Presentation")

Test-ForbiddenDependency `
    -Layer "Presentation" `
    -ForbiddenNamespaces @(
        "SV5T.Infrastructure",
        "SV5T.Application.Interfaces.Repositories"
    )

if ($violations.Count -gt 0) {
    Write-Error ("Clean Architecture violations:`n - " + ($violations -join "`n - "))
}

Write-Host "Clean Architecture dependency check passed."
