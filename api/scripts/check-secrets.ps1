$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$violations = [System.Collections.Generic.List[string]]::new()

$trackedFiles = & git -C $repositoryRoot ls-files 2>$null
if ($LASTEXITCODE -eq 0) {
    foreach ($path in $trackedFiles) {
        $name = [System.IO.Path]::GetFileName($path)
        if (($name -eq '.env' -or $name -like '.env.*') -and $name -notlike '*.example') {
            $violations.Add("Tracked environment file: $path")
        }
    }
}

$patterns = @(
    '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----',
    '(?i)(password|secret|api[_-]?key|token)\s*[:=]\s*["''][^"'']{16,}["'']'
)
$sourceFiles = Get-ChildItem -LiteralPath $repositoryRoot -Recurse -File |
    Where-Object {
        $_.FullName -notmatch '\\(bin|obj|node_modules|dist|\.git|\.data-protection-keys)\\' -and
        $_.Extension -in @('.cs', '.ts', '.tsx', '.json', '.yaml', '.yml', '.md')
    }
foreach ($file in $sourceFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    foreach ($pattern in $patterns) {
        if ($content -match $pattern) {
            $relative = $file.FullName.Substring($repositoryRoot.Length + 1)
            $violations.Add("Potential secret pattern: $relative")
            break
        }
    }
}

if ($violations.Count -gt 0) {
    Write-Error ("Secret scan failed:`n - " + ($violations -join "`n - "))
}

Write-Host 'Secret scan passed.'
