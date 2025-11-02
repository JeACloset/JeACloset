# Script para configurar o nome visual "J&A CLOSET" na interface
Write-Host "Configurando nome visual J&A CLOSET na interface..." -ForegroundColor Yellow

# Atualizar index.html
$indexContent = Get-Content "index.html" -Raw
$indexContent = $indexContent -replace "USEKAYLLA", "J&A CLOSET"
Set-Content "index.html" -Value $indexContent -NoNewline

# Atualizar título no README.md se existir
if (Test-Path "README.md") {
    $readmeContent = Get-Content "README.md" -Raw
    $readmeContent = $readmeContent -replace "USEKAYLLA", "J&A CLOSET"
    Set-Content "README.md" -Value $readmeContent -NoNewline
}

Write-Host "Nome visual configurado!" -ForegroundColor Green
Write-Host ""
Write-Host "Agora a interface mostrara: J&A CLOSET" -ForegroundColor Green
Write-Host "E o codigo usa: JEACLOSET" -ForegroundColor Green

