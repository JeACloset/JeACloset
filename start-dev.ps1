# Script para iniciar o projeto JEACLOSET
# Resolve problemas de codificação do PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   JEACLOSET - Sistema de Gestão" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obter o diretório do script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Mudar para o diretório do projeto
Set-Location $scriptPath

Write-Host "Diretório atual: $scriptPath" -ForegroundColor Green
Write-Host ""

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependências..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Iniciando servidor de desenvolvimento" -ForegroundColor Cyan
Write-Host "   URL: http://localhost:5176" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Iniciar o servidor
npm run dev

