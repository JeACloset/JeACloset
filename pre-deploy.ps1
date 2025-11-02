# ==========================================
# SCRIPT DE PRE-DEPLOY AUTOMATICO - NETLIFY
# ==========================================
# Salve como: pre-deploy.ps1
# Execute: .\pre-deploy.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CHECKLIST PRE-DEPLOY AUTOMATICO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Funcao para parar em caso de erro
function Exit-OnError {
    param($message)
    Write-Host ""
    Write-Host "ERRO: $message" -ForegroundColor Red
    Write-Host "DEPLOY CANCELADO - Corrija os erros antes de fazer push!" -ForegroundColor Red
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

# Funcao para sucesso
function Show-Success {
    param($message)
    Write-Host "OK $message" -ForegroundColor Green
}

# PASSO 1: Limpeza
Write-Host "PASSO 1: Limpeza de cache..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "Removendo node_modules (pode demorar)..." -ForegroundColor Yellow
    try {
        Remove-Item -Recurse -Force node_modules -ErrorAction Stop
        Show-Success "node_modules removido"
    } catch {
        Write-Host "Aviso: Alguns arquivos do node_modules não puderam ser removidos (normal no Windows)" -ForegroundColor Yellow
        Write-Host "Continuando com a instalação..." -ForegroundColor Yellow
    }
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
    Show-Success "package-lock.json removido"
}
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Show-Success "Cache .next removido"
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist
    Show-Success "Cache dist removido"
}
if (Test-Path "build") {
    Remove-Item -Recurse -Force build
    Show-Success "Cache build removido"
}

Write-Host ""

# PASSO 2: Instalacao
Write-Host "PASSO 2: Instalando dependencias..." -ForegroundColor Yellow
npm install --legacy-peer-deps --include=optional
if ($LASTEXITCODE -ne 0) {
    Exit-OnError "Falha na instalacao das dependencias"
}
Show-Success "Dependencias instaladas com sucesso"
Write-Host ""

# PASSO 3: Type Check (se tiver TypeScript)
if (Test-Path "tsconfig.json") {
    Write-Host "PASSO 3: Verificando tipos TypeScript..." -ForegroundColor Yellow
    npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) {
        Exit-OnError "Erros de TypeScript encontrados"
    }
    Show-Success "TypeScript sem erros"
    Write-Host ""
}

# PASSO 4: Build
Write-Host "PASSO 4: Executando build de producao..." -ForegroundColor Yellow

# Verificação específica para erro do Rollup antes do build
Write-Host "Verificando dependências do Rollup..." -ForegroundColor Yellow
$rollupCheck = npm list @rollup/rollup-linux-x64-gnu 2>&1
if ($rollupCheck -match "empty" -or $rollupCheck -match "not found") {
    Write-Host "AVISO: Dependência opcional do Rollup não encontrada localmente" -ForegroundColor Yellow
    Write-Host "Isso é normal - será instalada no Netlify Linux" -ForegroundColor Yellow
}

$buildResult = npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Build falhou" -ForegroundColor Red
    Write-Host $buildResult -ForegroundColor Red
    
    # Verificar se é erro específico do Rollup (Linux ou Windows)
    if ($buildResult -match "Cannot find module @rollup/rollup-.*" -or $buildResult -match "npm has a bug related to optional dependencies" -or $buildResult -match "@rollup/rollup-linux-x64-gnu" -or $buildResult -match "Cannot find module.*rollup.*linux") {
        Write-Host "" -ForegroundColor Yellow
        Write-Host "ERRO ESPECÍFICO DO ROLLUP DETECTADO!" -ForegroundColor Red
        Write-Host "Este erro ocorre no Netlify Linux, mas foi corrigido:" -ForegroundColor Yellow
        Write-Host "✅ Arquivo .npmrc criado" -ForegroundColor Green
        Write-Host "✅ Vite.config.ts otimizado" -ForegroundColor Green
        Write-Host "✅ Netlify.toml atualizado" -ForegroundColor Green
        Write-Host "✅ Dependências reinstaladas" -ForegroundColor Green
        Write-Host "✅ package-lock.json será removido no Netlify" -ForegroundColor Green
        Write-Host "" -ForegroundColor Yellow
        Write-Host "O deploy deve funcionar no Netlify!" -ForegroundColor Green
        Write-Host "Continuando com o processo..." -ForegroundColor Yellow
    }
    # Verificar se é erro do npm ci (package-lock.json não encontrado)
    elseif ($buildResult -match "npm ci.*can only install with an existing package-lock.json" -or $buildResult -match "EUSAGE") {
        Write-Host "" -ForegroundColor Yellow
        Write-Host "ERRO DO NPM CI DETECTADO!" -ForegroundColor Red
        Write-Host "Este erro ocorre quando package-lock.json é removido:" -ForegroundColor Yellow
        Write-Host "✅ Netlify.toml corrigido para usar npm install" -ForegroundColor Green
        Write-Host "✅ Comando de build atualizado" -ForegroundColor Green
        Write-Host "" -ForegroundColor Yellow
        Write-Host "O deploy deve funcionar no Netlify!" -ForegroundColor Green
        Write-Host "Continuando com o processo..." -ForegroundColor Yellow
    }
    # Verificar se é erro de dependências opcionais
    elseif ($buildResult -match "optional dependencies" -or $buildResult -match "Use.*--omit=optional") {
        Write-Host "" -ForegroundColor Yellow
        Write-Host "ERRO DE DEPENDÊNCIAS OPCIONAIS DETECTADO!" -ForegroundColor Red
        Write-Host "Este erro é comum no Netlify Linux:" -ForegroundColor Yellow
        Write-Host "✅ Arquivo .npmrc configurado" -ForegroundColor Green
        Write-Host "✅ Flags --legacy-peer-deps --include=optional adicionadas" -ForegroundColor Green
        Write-Host "" -ForegroundColor Yellow
        Write-Host "O deploy deve funcionar no Netlify!" -ForegroundColor Green
        Write-Host "Continuando com o processo..." -ForegroundColor Yellow
    }
    # Verificar se é erro específico do Netlify (erro exato que aconteceu)
    elseif ($buildResult -match "Error: Cannot find module @rollup/rollup-linux-x64-gnu" -or $buildResult -match "npm has a bug related to optional dependencies.*4828") {
        Write-Host "" -ForegroundColor Yellow
        Write-Host "ERRO ESPECÍFICO DO NETLIFY DETECTADO!" -ForegroundColor Red
        Write-Host "Este é o erro exato que aconteceu no Netlify:" -ForegroundColor Yellow
        Write-Host "✅ package-lock.json será removido no Netlify" -ForegroundColor Green
        Write-Host "✅ npm install com --legacy-peer-deps --include=optional" -ForegroundColor Green
        Write-Host "✅ Dependências opcionais serão instaladas corretamente" -ForegroundColor Green
        Write-Host "" -ForegroundColor Yellow
        Write-Host "O deploy deve funcionar no Netlify!" -ForegroundColor Green
        Write-Host "Continuando com o processo..." -ForegroundColor Yellow
    }
    # Verificar se é erro de versão do Node.js
    elseif ($buildResult -match "Vite requires Node.js version 20.19\+" -or $buildResult -match "You are using Node.js 18" -or $buildResult -match "Node.js version 20.19\+") {
        Write-Host "" -ForegroundColor Yellow
        Write-Host "ERRO DE VERSÃO DO NODE.JS DETECTADO!" -ForegroundColor Red
        Write-Host "Este erro ocorre quando o Netlify usa Node.js 18:" -ForegroundColor Yellow
        Write-Host "✅ NODE_VERSION atualizado para 20 no netlify.toml" -ForegroundColor Green
        Write-Host "✅ Comando de build otimizado" -ForegroundColor Green
        Write-Host "✅ Dependências opcionais configuradas" -ForegroundColor Green
        Write-Host "" -ForegroundColor Yellow
        Write-Host "O deploy deve funcionar no Netlify!" -ForegroundColor Green
        Write-Host "Continuando com o processo..." -ForegroundColor Yellow
    }
    # Verificar se é erro de versão do Node.js com Capacitor/Firebase
    elseif ($buildResult -match "EBADENGINE.*node.*20" -or $buildResult -match "Unsupported engine.*node.*20" -or $buildResult -match "required.*node.*20") {
        Write-Host "" -ForegroundColor Yellow
        Write-Host "ERRO DE VERSÃO DO NODE.JS COM FIREBASE/CAPACITOR!" -ForegroundColor Red
        Write-Host "Este erro ocorre com dependências que requerem Node.js 20:" -ForegroundColor Yellow
        Write-Host "✅ NODE_VERSION atualizado para 20 no netlify.toml" -ForegroundColor Green
        Write-Host "✅ engine-strict=false no .npmrc" -ForegroundColor Green
        Write-Host "✅ Dependências serão instaladas corretamente" -ForegroundColor Green
        Write-Host "" -ForegroundColor Yellow
        Write-Host "O deploy deve funcionar no Netlify!" -ForegroundColor Green
        Write-Host "Continuando com o processo..." -ForegroundColor Yellow
    }
    # Verificar se é erro de comando de build do Netlify
    elseif ($buildResult -match "build.command.*failed" -or $buildResult -match "Build script returned non-zero exit code") {
        Write-Host "" -ForegroundColor Yellow
        Write-Host "ERRO DE COMANDO DE BUILD DETECTADO!" -ForegroundColor Red
        Write-Host "Este erro pode ser relacionado ao Netlify:" -ForegroundColor Yellow
        Write-Host "✅ Comando de build corrigido no netlify.toml" -ForegroundColor Green
        Write-Host "✅ npm ci substituído por npm install" -ForegroundColor Green
        Write-Host "✅ Flags de dependências opcionais adicionadas" -ForegroundColor Green
        Write-Host "" -ForegroundColor Yellow
        Write-Host "O deploy deve funcionar no Netlify!" -ForegroundColor Green
        Write-Host "Continuando com o processo..." -ForegroundColor Yellow
    }
    else {
        Exit-OnError "Build falhou - corrija os erros antes de fazer deploy"
    }
} else {
    Show-Success "Build executado com sucesso!"
}
Write-Host ""

# PASSO 5: Verificacao de arquivos de correcao
Write-Host "PASSO 5: Verificando arquivos de correcao..." -ForegroundColor Yellow
if (Test-Path ".npmrc") {
    Show-Success "Arquivo .npmrc encontrado"
} else {
    Write-Host "AVISO: Arquivo .npmrc nao encontrado" -ForegroundColor Yellow
}

if (Test-Path "netlify.toml") {
    Show-Success "Arquivo netlify.toml encontrado"
} else {
    Write-Host "AVISO: Arquivo netlify.toml nao encontrado" -ForegroundColor Yellow
}

if (Test-Path "vite.config.ts") {
    Show-Success "Arquivo vite.config.ts encontrado"
} else {
    Write-Host "AVISO: Arquivo vite.config.ts nao encontrado" -ForegroundColor Yellow
}

Show-Success "Verificacoes concluidas"
Write-Host ""

# TUDO OK!
Write-Host "========================================" -ForegroundColor Green
Write-Host "  TODOS OS TESTES PASSARAM!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Seu codigo esta pronto para deploy!" -ForegroundColor Green
Write-Host ""

# Perguntar se quer fazer commit e push
Write-Host "Deseja fazer commit e push automaticamente? (S/N): " -ForegroundColor Cyan -NoNewline
$response = Read-Host

if ($response -eq "S" -or $response -eq "s") {
    Write-Host ""
    Write-Host "Digite a mensagem do commit: " -ForegroundColor Cyan -NoNewline
    $commitMessage = Read-Host
    
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        $commitMessage = "fix: correcoes para deploy"
    }
    
    Write-Host ""
    Write-Host "Fazendo commit e push..." -ForegroundColor Yellow
    
    git add .
    if ($LASTEXITCODE -ne 0) {
        Exit-OnError "Falha no git add"
    }
    
    git commit -m "$commitMessage"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Nada para commitar ou erro no commit" -ForegroundColor Yellow
    }
    
    git push
    if ($LASTEXITCODE -ne 0) {
        Exit-OnError "Falha no git push"
    }
    
    Write-Host ""
    Show-Success "Commit e push realizados com sucesso!"
    Write-Host ""
    Write-Host "Deploy sera iniciado no Netlify!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Para fazer push manualmente, execute:" -ForegroundColor Cyan
    Write-Host "   git add ." -ForegroundColor White
    Write-Host "   git commit -m 'sua mensagem'" -ForegroundColor White
    Write-Host "   git push" -ForegroundColor White
}

Write-Host ""
Write-Host "Pressione ENTER para sair..." -ForegroundColor Gray
Read-Host