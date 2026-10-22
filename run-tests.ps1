# Chay bo Unit Tests
$env:PATH = "$env:USERPROFILE\.dotnet;$env:USERPROFILE\.dotnet\tools;$env:PATH"
$env:DOTNET_ROOT = "$env:USERPROFILE\.dotnet"

Write-Host ">>> Dang chay 15 Unit Tests cho backend..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot"
dotnet test backend/EmployeeManagement.sln
