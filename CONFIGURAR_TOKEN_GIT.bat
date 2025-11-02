@echo off
setlocal enabledelayedexpansion
REM ==========================================
REM CONFIGURAR TOKEN DO GITHUB NO GIT
REM ==========================================
REM Este script configura o token para ser usado automaticamente

echo.
echo ========================================
echo   CONFIGURAR TOKEN DO GITHUB
echo ========================================
echo.

REM Verificar remote atual
echo Verificando remote atual...
git remote -v
echo.

REM Obter URL do remote
for /f "tokens=*" %%i in ('git remote get-url origin 2^>nul') do set CURRENT_URL=%%i

if "!CURRENT_URL!"=="" (
    echo ERRO: Remote 'origin' nao configurado
    echo.
    echo Configure primeiro com: PRIMEIRA_VEZ_GITHUB.bat
    echo.
    pause
    exit /b 1
)

echo Remote atual: !CURRENT_URL!
echo.

REM Opcoes de configuracao
echo Escolha como configurar o token:
echo.
echo 1. Inserir token na URL do remote (mais facil)
echo 2. Configurar credential helper (mais seguro)
echo.
set /p OPCAO="Escolha (1 ou 2): "

if "!OPCAO!"=="1" (
    echo.
    echo OPCAO 1: Inserir token na URL
    echo.
    echo Cole o Personal Access Token que voce copiou do GitHub:
    echo (Formato: ghp_XXXXXXXXXX...)
    echo.
    set "TOKEN="
    set /p "TOKEN=Token: "
    
    if "!TOKEN!"=="" (
        echo ERRO: Token nao fornecido
        pause
        exit /b 1
    )
    
    REM Extrair usuario e repo da URL atual
    for /f "tokens=4,5 delims=/." %%a in ("!CURRENT_URL!") do (
        set USER_REPO=%%a/%%b
    )
    
    REM Criar nova URL com token
    set NEW_URL=https://!TOKEN!@github.com/!USER_REPO!.git
    
    echo.
    echo Configurando remote com token...
    git remote set-url origin "!NEW_URL!"
    
    if errorlevel 1 (
        echo ERRO: Falha ao configurar remote
        pause
        exit /b 1
    )
    
    echo OK Remote configurado com token!
    echo.
    echo IMPORTANTE: O token esta na URL. Mantenha o arquivo .git/config seguro.
    echo.
    
) else if "!OPCAO!"=="2" (
    echo.
    echo OPCAO 2: Configurar Credential Helper
    echo.
    echo Configurando credential helper do Windows...
    git config --global credential.helper wincred
    
    echo.
    echo OK Credential helper configurado!
    echo.
    echo Na proxima vez que fizer push:
    echo   - Username: Seu usuario do GitHub (JeACloset)
    echo   - Password: Cole o Personal Access Token (NAO sua senha!)
    echo.
    echo Para limpar credenciais salvas (se precisar):
    echo   git credential-manager-core erase
    echo.
    
) else (
    echo.
    echo Opcao invalida
    pause
    exit /b 1
)

echo.
echo ========================================
echo   CONFIGURACAO CONCLUIDA!
echo ========================================
echo.
echo Teste fazendo push agora:
echo   git push -u origin main
echo.
echo Ou use o script: ATUALIZAR_GITHUB.bat
echo.
pause

