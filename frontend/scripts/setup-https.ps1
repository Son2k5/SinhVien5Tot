$ErrorActionPreference = "Stop"

$frontendRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$certificateDirectory = Join-Path $frontendRoot ".cert"
$certificatePath = Join-Path $certificateDirectory "localhost.pem"

New-Item -ItemType Directory -Path $certificateDirectory -Force | Out-Null

dotnet dev-certs https --trust
if ($LASTEXITCODE -ne 0) {
    throw "Không thể tạo hoặc trust chứng chỉ HTTPS phát triển."
}

dotnet dev-certs https `
    --export-path $certificatePath `
    --format Pem `
    --no-password
if ($LASTEXITCODE -ne 0) {
    throw "Không thể export chứng chỉ HTTPS cho Vite."
}

Write-Host "Đã cấu hình chứng chỉ HTTPS dùng chung cho frontend và backend."
Write-Host "Frontend: https://localhost:5173"
Write-Host "Backend:  https://localhost:7080"
