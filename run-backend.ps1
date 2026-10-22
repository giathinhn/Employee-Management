# Khởi chạy Backend ASP.NET Core 8 Web API
$env:PATH = "$env:USERPROFILE\.dotnet;$env:USERPROFILE\.dotnet\tools;$env:PATH"
$env:DOTNET_ROOT = "$env:USERPROFILE\.dotnet"

Write-Host ">>> Dang khoi chay ASP.NET Core 8 Web API tai http://localhost:5000..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\backend"
dotnet run --project src/EmployeeManagement.API --urls "http://localhost:5000"
