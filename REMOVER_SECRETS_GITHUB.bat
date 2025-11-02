@echo off
REM ==========================================
REM REMOVER SECRETS ANTES DE FAZER PUSH
REM ==========================================
REM Este script ajuda a remover secrets dos commits

echo.
echo ========================================
echo   REMOVER SECRETS DO GITHUB
echo ========================================
echo.
echo AVISO: O GitHub bloqueou o push porque
echo detectou secrets nos arquivos:
echo.
echo 1. Token do GitHub no SOLUCAO_TOKEN_GITHUB.md
echo 2. Credenciais do Google no RESUMO e driveConfig.ts
echo.
echo SOLUCAO: Ja removemos os secrets dos arquivos
echo Agora precisa fazer um novo commit sem eles
echo.
pause

echo.
echo Fazendo novo commit sem os secrets...
git add .
git commit -m "fix: remover secrets e credenciais sensiveis dos arquivos"

if errorlevel 1 (
    echo AVISO: Nada para commitar ou ja foi feito
)

echo.
echo ========================================
echo   AGORA PODE FAZER PUSH!
echo ========================================
echo.
echo Execute:
echo   git push -u origin main
echo.
echo Ou use: ATUALIZAR_GITHUB.bat
echo.
pause

