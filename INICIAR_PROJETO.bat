@echo off
echo ========================================
echo    JEACLOSET - Sistema de Gestao
echo ========================================
echo.
echo Instalando dependencias...
call npm install --legacy-peer-deps
echo.
echo ========================================
echo    Iniciando servidor de desenvolvimento
echo    URL: http://localhost:5176
echo ========================================
echo.
call npm run dev
pause

