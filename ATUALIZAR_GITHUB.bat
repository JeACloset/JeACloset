@echo off
REM ==========================================
REM SCRIPT SIMPLES - ATUALIZAR GITHUB
REM ==========================================
REM Segue o mesmo fluxo usado na USEKAYLLA

echo.
echo ========================================
echo   ATUALIZAR GITHUB
echo ========================================
echo.

REM Verificar se é repositório Git
if not exist ".git" (
    echo AVISO: Nao e um repositorio Git.
    echo Execute primeiro: git init
    echo.
    pause
    exit /b 1
)

REM Ver status
echo Verificando mudancas...
git status --short
echo.

REM Perguntar mensagem do commit
set /p COMMIT_MSG="Digite a mensagem do commit (ou ENTER para usar padrao): "

if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=Atualizacao automatica
)

echo.
echo Adicionando arquivos...
git add .

echo.
echo Fazendo commit...
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo AVISO: Nada para commitar
    echo.
    pause
    exit /b 0
)

echo.
echo Enviando para o GitHub...
git push

if errorlevel 1 (
    echo.
    echo ERRO: Falha ao fazer push
    echo Verifique se o remote esta configurado e se tem permissao
    echo.
    echo Para verificar remote: git remote -v
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   OK! Atualizacao enviada com sucesso!
echo ========================================
echo.
echo O Netlify detectara automaticamente e fara o deploy
echo.
pause

