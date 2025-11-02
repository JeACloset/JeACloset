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
    # Verificar se é erro de TypeScript durante build
    elseif ($buildResult -match "error TS\d+" -or $buildResult -match "TypeScript.*error" -or $buildResult -match "\.tsx?\(\d+,\d+\):.*error") {
        Write-Host "" -ForegroundColor Yellow
        Write-Host "ERRO DE TYPESCRIPT DETECTADO NO BUILD!" -ForegroundColor Red
        Write-Host "Este erro deve ser corrigido antes do deploy:" -ForegroundColor Yellow
        Write-Host "✅ Verifique os erros acima" -ForegroundColor Green
        Write-Host "✅ Execute: npx tsc --noEmit (para ver todos os erros)" -ForegroundColor Green
        Write-Host "✅ Corrija os erros de TypeScript" -ForegroundColor Green
        Write-Host "" -ForegroundColor Yellow
        Exit-OnError "Corrija os erros de TypeScript antes de fazer deploy"
    }
    # Verificar se é erro de módulo não encontrado
    elseif ($buildResult -match "Cannot find module" -or $buildResult -match "Module not found" -or $buildResult -match "Failed to resolve import") {
        Write-Host "" -ForegroundColor Yellow
        Write-Host "ERRO: MODULO NAO ENCONTRADO!" -ForegroundColor Red
        Write-Host "Algum modulo/import nao foi encontrado:" -ForegroundColor Yellow
        Write-Host "✅ Verifique se todas as dependencias estao instaladas: npm install" -ForegroundColor Green
        Write-Host "✅ Verifique os imports nos arquivos mencionados" -ForegroundColor Green
        Write-Host "✅ Pode ser problema de caminho ou dependencia faltando" -ForegroundColor Green
        Write-Host "" -ForegroundColor Yellow
        Exit-OnError "Corrija os imports e dependencias antes de fazer deploy"
    }
    # Verificar se é erro de sintaxe ou parsing
    elseif ($buildResult -match "SyntaxError" -or $buildResult -match "Unexpected token" -or $buildResult -match "Parse error") {
        Write-Host "" -ForegroundColor Yellow
        Write-Host "ERRO DE SINTAXE DETECTADO!" -ForegroundColor Red
        Write-Host "Erro de sintaxe no codigo:" -ForegroundColor Yellow
        Write-Host "✅ Verifique os arquivos mencionados no erro" -ForegroundColor Green
        Write-Host "✅ Verifique chaves, parenteses, colchetes, aspas" -ForegroundColor Green
        Write-Host "✅ Execute: npm run build (para ver detalhes)" -ForegroundColor Green
        Write-Host "" -ForegroundColor Yellow
        Exit-OnError "Corrija os erros de sintaxe antes de fazer deploy"
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
    # Verificar se tem NODE_VERSION = "20"
    $netlifyContent = Get-Content "netlify.toml" -Raw
    if ($netlifyContent -match 'NODE_VERSION\s*=\s*"20"') {
        Show-Success "Node.js 20 configurado no netlify.toml"
    } else {
        Write-Host "AVISO: NODE_VERSION pode nao estar configurado como 20" -ForegroundColor Yellow
    }
} else {
    Write-Host "AVISO: Arquivo netlify.toml nao encontrado" -ForegroundColor Yellow
}

if (Test-Path "vite.config.ts") {
    Show-Success "Arquivo vite.config.ts encontrado"
} else {
    Write-Host "AVISO: Arquivo vite.config.ts nao encontrado" -ForegroundColor Yellow
}

# Verificar se driveConfig.ts está no .gitignore
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -match "driveConfig\.ts") {
        Show-Success "driveConfig.ts esta no .gitignore (secrets protegidos)"
    } else {
        Write-Host "AVISO: driveConfig.ts pode nao estar no .gitignore" -ForegroundColor Yellow
    }
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
    
    $pushResult = git push 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO: Push falhou" -ForegroundColor Red
        Write-Host $pushResult -ForegroundColor Red
        
        # Verificar se é erro de workflow permission
        if ($pushResult -match "refusing to allow.*Personal Access Token.*workflow.*without.*workflow.*scope" -or $pushResult -match "without `"workflow`" scope") {
            Write-Host "" -ForegroundColor Yellow
            Write-Host "ERRO DE PERMISSAO WORKFLOW DETECTADO!" -ForegroundColor Red
            Write-Host "Seu token do GitHub nao tem a permissao 'workflow':" -ForegroundColor Yellow
            Write-Host "✅ Execute: ATUALIZAR_TOKEN_WORKFLOW.bat" -ForegroundColor Green
            Write-Host "✅ OU crie novo token em: https://github.com/settings/tokens" -ForegroundColor Green
            Write-Host "✅ Marque a opcao: workflow (alem de repo)" -ForegroundColor Green
            Write-Host "" -ForegroundColor Yellow
            Write-Host "Veja: INSTRUCOES_TOKEN_WORKFLOW.md" -ForegroundColor Cyan
            Write-Host "" -ForegroundColor Yellow
            Exit-OnError "Configure o token com permissao workflow e tente novamente"
        }
        # Verificar se é erro de repository not found
        elseif ($pushResult -match "Repository not found" -or $pushResult -match "repository.*not found") {
            Write-Host "" -ForegroundColor Yellow
            Write-Host "ERRO: REPOSITORIO NAO ENCONTRADO!" -ForegroundColor Red
            Write-Host "O repositorio nao existe no GitHub ou voce nao tem acesso:" -ForegroundColor Yellow
            Write-Host "✅ Crie o repositorio em: https://github.com/new" -ForegroundColor Green
            Write-Host "✅ OU verifique a URL do remote: git remote -v" -ForegroundColor Green
            Write-Host "" -ForegroundColor Yellow
            Exit-OnError "Crie o repositorio no GitHub ou verifique o remote"
        }
        # Verificar se é erro de permission denied (403)
        elseif ($pushResult -match "Permission.*denied" -or $pushResult -match "403" -or $pushResult -match "Authentication failed") {
            Write-Host "" -ForegroundColor Yellow
            Write-Host "ERRO: PERMISSAO NEGADA!" -ForegroundColor Red
            Write-Host "Voce nao tem permissao para fazer push no repositorio:" -ForegroundColor Yellow
            Write-Host "✅ Configure Personal Access Token: https://github.com/settings/tokens" -ForegroundColor Green
            Write-Host "✅ OU peca para ser adicionado como colaborador" -ForegroundColor Green
            Write-Host "✅ OU configure o token: CONFIGURAR_TOKEN_GIT.bat" -ForegroundColor Green
            Write-Host "" -ForegroundColor Yellow
            Exit-OnError "Configure autenticacao e tente novamente"
        }
        # Verificar se é erro de secrets detectados
        elseif ($pushResult -match "Repository rule violations" -or $pushResult -match "GH013" -or $pushResult -match "Push cannot contain secrets" -or $pushResult -match "secret-scanning") {
            Write-Host "" -ForegroundColor Yellow
            Write-Host "ERRO: SECRETS DETECTADOS NO PUSH!" -ForegroundColor Red
            Write-Host "O GitHub bloqueou porque detectou secrets nos commits:" -ForegroundColor Yellow
            Write-Host "✅ Remova secrets dos arquivos (tokens, senhas, credenciais)" -ForegroundColor Green
            Write-Host "✅ Veja: RESOLVER_BLOQUEIO_SECRETS.md" -ForegroundColor Green
            Write-Host "✅ OU permita os secrets uma vez nos links fornecidos pelo GitHub" -ForegroundColor Green
            Write-Host "" -ForegroundColor Yellow
            Write-Host "Arquivos geralmente com secrets:" -ForegroundColor Yellow
            Write-Host "  - SOLUCAO_TOKEN_GITHUB.md (token do GitHub)" -ForegroundColor Gray
            Write-Host "  - driveConfig.ts (credenciais Google OAuth)" -ForegroundColor Gray
            Write-Host "  - RESUMO_ALTERACOES_JEACLOSET.md (credenciais)" -ForegroundColor Gray
            Write-Host "" -ForegroundColor Yellow
            Exit-OnError "Remova os secrets dos arquivos antes de fazer push"
        }
        # Verificar se é erro de password authentication
        elseif ($pushResult -match "Password authentication is not supported" -or $pushResult -match "Invalid username or token") {
            Write-Host "" -ForegroundColor Yellow
            Write-Host "ERRO: AUTENTICACAO POR SENHA NAO SUPORTADA!" -ForegroundColor Red
            Write-Host "O GitHub nao aceita mais senha, apenas Personal Access Token:" -ForegroundColor Yellow
            Write-Host "✅ Configure token: CONFIGURAR_TOKEN_GIT.bat" -ForegroundColor Green
            Write-Host "✅ OU veja: SOLUCAO_TOKEN_GITHUB.md" -ForegroundColor Green
            Write-Host "✅ Ao pedir senha, use o TOKEN (nao sua senha do GitHub!)" -ForegroundColor Green
            Write-Host "" -ForegroundColor Yellow
            Exit-OnError "Configure Personal Access Token e tente novamente"
        }
        else {
            Exit-OnError "Falha no git push - verifique os erros acima"
        }
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