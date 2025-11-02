@echo off
setlocal enabledelayedexpansion
REM ==========================================
REM SCRIPT - PRIMEIRA VEZ NO GITHUB
REM ==========================================
REM Configura tudo do zero seguindo o fluxo USEKAYLLA

echo.
echo ========================================
echo   PRIMEIRA VEZ - CONFIGURAR GITHUB
echo ========================================
echo.

REM PASSO 1: Verificar se já é repositório Git
if exist ".git" (
    echo AVISO: Ja e um repositorio Git
    echo.
    set /p CONTINUE="Deseja reconfigurar? (S/N): "
    if /i not "!CONTINUE!"=="S" (
        echo Cancelado
        pause
        exit /b 0
    )
    echo.
    echo Reconfigurando...
    echo.
) else (
    echo PASSO 1: Inicializando Git...
    git init
    if errorlevel 1 (
        echo ERRO: Falha ao inicializar Git
        pause
        exit /b 1
    )
    echo OK Git inicializado
    echo.
)

REM PASSO 2: Adicionar arquivos
echo PASSO 2: Adicionando todos os arquivos...
git add .
if errorlevel 1 (
    echo ERRO: Falha ao adicionar arquivos
    pause
    exit /b 1
)
echo OK Arquivos adicionados
echo.

REM PASSO 3: Primeiro commit
echo PASSO 3: Fazendo primeiro commit...
git commit -m "Primeiro commit: aplicacao inicial"
if errorlevel 1 (
    echo AVISO: Nada para commitar (talvez ja tenha commits)
)
echo.

REM PASSO 4: Configurar remote
echo PASSO 4: Configurar remote do GitHub...
echo.
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Remote nao configurado.
    echo.
    echo Digite a URL do repositorio GitHub:
    echo Exemplo: https://github.com/Danielpnvs/JEACLOSET.git
    echo.
    set "REPO_URL="
    set /p "REPO_URL=URL: "
    
    if "!REPO_URL!"=="" (
        echo ERRO: URL nao fornecida
        pause
        exit /b 1
    )
    
    REM Adicionar .git se não tiver
    echo !REPO_URL! | findstr /C:".git" >nul
    if errorlevel 1 (
        set "REPO_URL=!REPO_URL!.git"
    )
    
    git remote add origin "!REPO_URL!"
    if errorlevel 1 (
        echo AVISO: Tentando atualizar remote existente...
        git remote set-url origin "!REPO_URL!"
    )
    echo OK Remote configurado: !REPO_URL!
) else (
    for /f "tokens=*" %%i in ('git remote get-url origin') do set REPO_URL=%%i
    echo Remote ja configurado: %REPO_URL%
    echo.
    set /p UPDATE="Deseja atualizar o remote? (S/N): "
    if /i "!UPDATE!"=="S" (
        set "NEW_URL="
        set /p "NEW_URL=Nova URL: "
        if not "!NEW_URL!"=="" (
            echo !NEW_URL! | findstr /C:".git" >nul
            if errorlevel 1 (
                set "NEW_URL=!NEW_URL!.git"
            )
            git remote set-url origin "!NEW_URL!"
            set "REPO_URL=!NEW_URL!"
            echo OK Remote atualizado
        )
    )
)
echo.

REM PASSO 5: Renomear branch para main (se necessário)
echo PASSO 5: Verificando branch...
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo Branch atual: %CURRENT_BRANCH%

if /i not "%CURRENT_BRANCH%"=="main" (
    echo.
    set /p RENAME="Deseja renomear branch para 'main'? (S/N): "
    if /i "!RENAME!"=="S" (
        git branch -M main
        set CURRENT_BRANCH=main
        echo OK Branch renomeado para main
    )
)
echo.

REM PASSO 6: Fazer push
echo PASSO 6: Enviar para o GitHub...
echo.
echo Repositorio: %REPO_URL%
echo Branch: %CURRENT_BRANCH%
echo.
set /p PUSH="Deseja fazer push agora? (S/N): "

if /i "!PUSH!"=="S" (
    echo.
    echo Enviando...
    git push -u origin %CURRENT_BRANCH%
    
    if errorlevel 1 (
        echo.
        echo ERRO: Falha ao fazer push
        echo.
        echo Possiveis causas:
        echo   - Repositorio nao existe no GitHub (crie em https://github.com/new)
        echo   - Sem permissao (configure Personal Access Token)
        echo   - Credenciais nao configuradas
        echo.
        echo Para criar repositorio: https://github.com/new
        echo Para configurar token: https://github.com/settings/tokens
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo ========================================
    echo   OK! Primeiro push realizado!
    echo ========================================
    echo.
    echo O Netlify detectara automaticamente e fara o deploy
    echo.
) else (
    echo.
    echo Push cancelado.
    echo.
    echo Para fazer push depois, execute:
    echo   git push -u origin %CURRENT_BRANCH%
    echo.
    echo Ou use o script: ATUALIZAR_GITHUB.bat
    echo.
)

pause

