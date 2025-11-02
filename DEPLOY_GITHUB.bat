@echo off
REM ==========================================
REM SCRIPT DE DEPLOY AUTOMATICO - GITHUB
REM ==========================================
REM Clique duas vezes no arquivo para executar

echo.
echo ========================================
echo   DEPLOY AUTOMATICO - GITHUB
echo ========================================
echo.

REM PASSO 1: Verificar se está em um repositório Git
echo PASSO 1: Verificando repositorio Git...
if not exist ".git" (
    echo.
    echo ERRO: Este diretorio nao e um repositorio Git. Execute 'git init' primeiro.
    echo.
    pause
    exit /b 1
)
echo OK Repositorio Git encontrado
echo.

REM PASSO 2: Verificar branch atual
echo PASSO 2: Verificando branch atual...
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo Branch atual: %CURRENT_BRANCH%
echo.

REM PASSO 3: Adicionar arquivos
echo PASSO 3: Adicionando arquivos ao Git...
git add .
if errorlevel 1 (
    echo.
    echo ERRO: Falha ao adicionar arquivos ao Git
    echo.
    pause
    exit /b 1
)
echo OK Arquivos adicionados
echo.

REM PASSO 4: Solicitar mensagem de commit
echo PASSO 4: Mensagem do commit...
echo.
echo Digite a mensagem do commit:
echo (Deixe em branco para usar mensagem padrao)
echo.
set /p COMMIT_MESSAGE="Mensagem: "

if "%COMMIT_MESSAGE%"=="" (
    for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set DATE=%%c-%%b-%%a
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set TIME=%%a:%%b
    set COMMIT_MESSAGE=chore: deploy automatico - %DATE% %TIME%
    echo Usando mensagem padrao: %COMMIT_MESSAGE%
)

echo.

REM PASSO 5: Fazer commit
echo PASSO 5: Fazendo commit...
git commit -m "%COMMIT_MESSAGE%"
if errorlevel 1 (
    echo AVISO: Nada para commitar ou commit ja realizado
) else (
    echo OK Commit realizado com sucesso!
    echo Mensagem: %COMMIT_MESSAGE%
)
echo.

REM PASSO 6: Verificar remote
echo PASSO 6: Verificando remote do GitHub...
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo.
    echo AVISO: Remote 'origin' nao configurado
    echo.
    set /p SETUP_REMOTE="Deseja configurar o remote agora? (S/N): "
    if /i "%SETUP_REMOTE%"=="S" (
        echo.
        echo Digite a URL do repositorio GitHub:
        echo (Exemplo: https://github.com/usuario/repositorio.git)
        set /p NEW_REMOTE="URL: "
        if not "%NEW_REMOTE%"=="" (
            git remote add origin "%NEW_REMOTE%"
            if errorlevel 1 (
                echo.
                echo ERRO: Falha ao configurar remote
                echo.
                pause
                exit /b 1
            )
            echo OK Remote 'origin' configurado
        ) else (
            echo.
            echo ERRO: URL do repositorio nao fornecida
            echo.
            pause
            exit /b 1
        )
    ) else (
        echo.
        echo ERRO: Nao e possivel fazer push sem remote configurado
        echo.
        pause
        exit /b 1
    )
) else (
    for /f "tokens=*" %%i in ('git remote get-url origin') do set REMOTE_URL=%%i
    echo OK Remote encontrado: %REMOTE_URL%
)
echo.

REM PASSO 7: Fazer push
echo PASSO 7: Fazendo push para o GitHub...
echo Branch: %CURRENT_BRANCH%
echo.
set /p PUSH_CONFIRM="Deseja fazer push para o GitHub? (S/N): "

if /i "%PUSH_CONFIRM%"=="S" (
    echo.
    echo Enviando alteracoes...
    git push -u origin %CURRENT_BRANCH%
    if errorlevel 1 (
        git push origin %CURRENT_BRANCH%
        if errorlevel 1 (
            echo.
            echo ERRO: Falha ao fazer push para o GitHub. Verifique suas credenciais e conexao.
            echo.
            pause
            exit /b 1
        )
    )
    echo.
    echo OK Push realizado com sucesso!
    echo.
) else (
    echo.
    echo AVISO: Push cancelado pelo usuario
    echo.
    echo Para fazer push manualmente, execute:
    echo    git push -u origin %CURRENT_BRANCH%
    echo.
    pause
    exit /b 0
)

REM PASSO 8: Informações sobre deploy
echo.
echo ========================================
echo   OK DEPLOY CONCLUIDO!
echo ========================================
echo.
echo Codigo enviado para o GitHub com sucesso!
echo.
echo Repositorio:
echo    %REMOTE_URL%
echo.
echo Branch:
echo    %CURRENT_BRANCH%
echo.

REM Verificar se o Netlify está configurado
if exist "netlify.toml" (
    echo NETLIFY:
    echo    Se o Netlify estiver conectado a este repositorio,
    echo    o deploy sera iniciado automaticamente!
    echo.
    echo    Aguarde alguns minutos e verifique:
    echo    https://app.netlify.com
    echo.
)

REM Verificar se há workflow do GitHub Actions
if exist ".github\workflows" (
    echo GITHUB ACTIONS:
    echo    Os workflows serao executados automaticamente!
    echo.
    echo    Verifique em:
    echo    https://github.com/[usuario]/[repositorio]/actions
    echo.
)

echo ========================================
echo.
pause

