# ==========================================
# SCRIPT DE DEPLOY AUTOMATICO - GITHUB
# ==========================================
# Salve como: DEPLOY_GITHUB.ps1
# Execute: .\DEPLOY_GITHUB.ps1
# Ou clique duas vezes no arquivo

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY AUTOMATICO - GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Função para parar em caso de erro
function Exit-OnError {
    param($message)
    Write-Host ""
    Write-Host "❌ ERRO: $message" -ForegroundColor Red
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

# Função para sucesso
function Show-Success {
    param($message)
    Write-Host "✅ $message" -ForegroundColor Green
}

# PASSO 1: Verificar se está em um repositório Git
Write-Host "PASSO 1: Verificando repositório Git..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    Exit-OnError "Este diretório não é um repositório Git. Execute 'git init' primeiro."
}
Show-Success "Repositório Git encontrado"
Write-Host ""

# PASSO 2: Verificar status do Git
Write-Host "PASSO 2: Verificando status do Git..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ([string]::IsNullOrWhiteSpace($gitStatus)) {
    Write-Host "⚠️  Nenhuma alteração para commitar" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Deseja fazer push mesmo assim? (S/N): " -ForegroundColor Cyan -NoNewline
    $response = Read-Host
    if ($response -ne "S" -and $response -ne "s") {
        Write-Host ""
        Write-Host "Operação cancelada pelo usuário" -ForegroundColor Yellow
        Read-Host "Pressione ENTER para sair"
        exit 0
    }
} else {
    Write-Host "Alterações detectadas:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Gray
    Write-Host ""
}
Write-Host ""

# PASSO 3: Verificar branch atual
Write-Host "PASSO 3: Verificando branch atual..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "Branch atual: $currentBranch" -ForegroundColor Cyan
Write-Host ""

# PASSO 4: Adicionar arquivos
Write-Host "PASSO 4: Adicionando arquivos ao Git..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Exit-OnError "Falha ao adicionar arquivos ao Git"
}
Show-Success "Arquivos adicionados"
Write-Host ""

# PASSO 5: Solicitar mensagem de commit
Write-Host "PASSO 5: Mensagem do commit..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Digite a mensagem do commit:" -ForegroundColor Cyan
Write-Host "(Deixe em branco para usar mensagem padrão)" -ForegroundColor Gray
Write-Host ""
$commitMessage = Read-Host "Mensagem"

if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "chore: deploy automático - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "Usando mensagem padrão: $commitMessage" -ForegroundColor Gray
}

Write-Host ""

# PASSO 6: Fazer commit
Write-Host "PASSO 6: Fazendo commit..." -ForegroundColor Yellow
git commit -m "$commitMessage"
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Nada para commitar ou commit já realizado" -ForegroundColor Yellow
} else {
    Show-Success "Commit realizado com sucesso!"
    Write-Host "Mensagem: $commitMessage" -ForegroundColor Gray
}
Write-Host ""

# PASSO 7: Verificar se há remote configurado
Write-Host "PASSO 7: Verificando remote do GitHub..." -ForegroundColor Yellow
$remoteUrl = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Remote 'origin' não configurado" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Deseja configurar o remote agora? (S/N): " -ForegroundColor Cyan -NoNewline
    $setupRemote = Read-Host
    if ($setupRemote -eq "S" -or $setupRemote -eq "s") {
        Write-Host ""
        Write-Host "Digite a URL do repositório GitHub:" -ForegroundColor Cyan
        Write-Host "(Exemplo: https://github.com/usuario/repositorio.git)" -ForegroundColor Gray
        $newRemote = Read-Host "URL"
        if (-not [string]::IsNullOrWhiteSpace($newRemote)) {
            git remote add origin $newRemote
            if ($LASTEXITCODE -eq 0) {
                Show-Success "Remote 'origin' configurado"
                $remoteUrl = $newRemote
            } else {
                Exit-OnError "Falha ao configurar remote"
            }
        } else {
            Exit-OnError "URL do repositório não fornecida"
        }
    } else {
        Exit-OnError "Não é possível fazer push sem remote configurado"
    }
} else {
    Show-Success "Remote encontrado: $remoteUrl"
}
Write-Host ""

# PASSO 8: Fazer push
Write-Host "PASSO 8: Fazendo push para o GitHub..." -ForegroundColor Yellow
Write-Host "Branch: $currentBranch" -ForegroundColor Gray
Write-Host "Remote: $remoteUrl" -ForegroundColor Gray
Write-Host ""

# Verificar se o branch existe no remote
$branchExists = git ls-remote --heads origin $currentBranch 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Branch não existe no remote. Será criado automaticamente." -ForegroundColor Yellow
    Write-Host ""
}

# Perguntar se quer fazer push
Write-Host "Deseja fazer push para o GitHub? (S/N): " -ForegroundColor Cyan -NoNewline
$pushConfirm = Read-Host

if ($pushConfirm -eq "S" -or $pushConfirm -eq "s") {
    Write-Host ""
    Write-Host "Enviando alterações..." -ForegroundColor Yellow
    
    # Tentar push com upstream
    git push -u origin $currentBranch 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        # Se falhar, tentar push simples
        git push origin $currentBranch
        if ($LASTEXITCODE -ne 0) {
            Exit-OnError "Falha ao fazer push para o GitHub. Verifique suas credenciais e conexão."
        }
    }
    
    Show-Success "Push realizado com sucesso!"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  Push cancelado pelo usuário" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para fazer push manualmente, execute:" -ForegroundColor Cyan
    Write-Host "   git push -u origin $currentBranch" -ForegroundColor White
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 0
}

# PASSO 9: Informações sobre deploy
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📤 Código enviado para o GitHub com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Repositório:" -ForegroundColor Cyan
Write-Host "   $remoteUrl" -ForegroundColor White
Write-Host ""
Write-Host "🌿 Branch:" -ForegroundColor Cyan
Write-Host "   $currentBranch" -ForegroundColor White
Write-Host ""

# Verificar se o Netlify está configurado (verificar netlify.toml)
if (Test-Path "netlify.toml") {
    Write-Host "🚀 NETLIFY:" -ForegroundColor Cyan
    Write-Host "   Se o Netlify estiver conectado a este repositório," -ForegroundColor Gray
    Write-Host "   o deploy será iniciado automaticamente!" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Aguarde alguns minutos e verifique:" -ForegroundColor Gray
    Write-Host "   https://app.netlify.com" -ForegroundColor White
    Write-Host ""
}

# Verificar se há workflow do GitHub Actions
if (Test-Path ".github/workflows") {
    Write-Host "⚙️  GITHUB ACTIONS:" -ForegroundColor Cyan
    Write-Host "   Os workflows serão executados automaticamente!" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Verifique em:" -ForegroundColor Gray
    Write-Host "   https://github.com/[usuario]/[repositorio]/actions" -ForegroundColor White
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Pressione ENTER para sair..." -ForegroundColor Gray
Read-Host

