# ==========================================
# SCRIPT PARA RENOMEAR APLICAÇÃO
# ==========================================
# Este script substitui todas as ocorrências de "USEKAYLLA" por um novo nome

param(
    [Parameter(Mandatory=$true)]
    [string]$NovoNome
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RENOMEAR APLICAÇÃO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  ATENÇÃO: Este script vai modificar TODOS os arquivos!" -ForegroundColor Yellow
Write-Host "Nome antigo: USEKAYLLA / usekaylla" -ForegroundColor White
Write-Host "Nome novo: $NovoNome" -ForegroundColor Green
Write-Host ""
Write-Host "Deseja continuar? (S/N): " -ForegroundColor Cyan -NoNewline
$response = Read-Host

if ($response -ne "S" -and $response -ne "s") {
    Write-Host "Operação cancelada." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Iniciando substituição..." -ForegroundColor Yellow
Write-Host ""

# Contador de arquivos modificados
$count = 0

# Extensões de arquivos para processar
$extensions = @("*.tsx", "*.ts", "*.json", "*.html", "*.bat", "*.md")

foreach ($ext in $extensions) {
    $files = Get-ChildItem -Path . -Filter $ext -Recurse -File
    
    foreach ($file in $files) {
        # Ignorar node_modules, .git, dist
        if ($file.FullName -match "node_modules|\.git|dist") {
            continue
        }
        
        try {
            $content = Get-Content $file.FullName -Raw -Encoding UTF8
            $originalContent = $content
            
            # Substituições
            $content = $content -replace 'usekaylla', $NovoNome.ToLower()
            $content = $content -replace 'USEKAYLLA', $NovoNome.ToUpper()
            
            # Substituição específica para emails (manter domínio ou usar padrão)
            $newDomain = $NovoNome.ToLower().Replace(" ", "") + ".com"
            $content = $content -replace 'usekaylla\.com', $newDomain
            
            # Se houve mudança, salvar
            if ($content -ne $originalContent) {
                Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
                Write-Host "✓ Modificado: $($file.Name)" -ForegroundColor Green
                $count++
            }
        } catch {
            Write-Host "✗ Erro ao processar: $($file.Name)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SUBSTITUIÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Total de arquivos modificados: $count" -ForegroundColor Green
Write-Host ""

# Renomear arquivos específicos
Write-Host "Renomeando arquivos..." -ForegroundColor Yellow

if (Test-Path "EXECUTAR_USEKAYLLA.bat") {
    $newName = "EXECUTAR_$($NovoNome.ToUpper()).bat"
    Rename-Item -Path "EXECUTAR_USEKAYLLA.bat" -NewName $newName -Force
    Write-Host "✓ Renomeado: EXECUTAR_USEKAYLLA.bat → $newName" -ForegroundColor Green
}

# Atualizar package.json com nome correto
Write-Host ""
Write-Host "Atualizando package.json..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$packageJson.name = $NovoNome.ToLower()
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json" -Encoding UTF8
Write-Host "✓ package.json atualizado" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PRÓXIMOS PASSOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Remover node_modules e package-lock.json" -ForegroundColor White
Write-Host "   rm -rf node_modules package-lock.json" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Reinstalar dependências" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Configurar novo Firebase" -ForegroundColor White
Write-Host "   - Criar projeto em console.firebase.google.com" -ForegroundColor Gray
Write-Host "   - Atualizar credenciais em src/config/firebase.ts" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Testar aplicação" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Fazer commit e push" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Renomeado para $NovoNome'" -ForegroundColor Gray
Write-Host "   git push" -ForegroundColor Gray
Write-Host ""

Write-Host "Pressione ENTER para sair..." -ForegroundColor Gray
Read-Host

