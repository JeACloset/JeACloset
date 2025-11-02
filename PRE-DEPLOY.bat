@echo off
REM ==========================================
REM EXECUTAR PRE-DEPLOY
REM ==========================================
REM Clique duas vezes neste arquivo para executar o pre-deploy

cd /d "%~dp0"
powershell.exe -ExecutionPolicy Bypass -File "%~dp0pre-deploy.ps1"
pause

