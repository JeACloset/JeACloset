@echo off
REM ==========================================
REM ATUALIZAR TOKEN COM PERMISSAO WORKFLOW
REM ==========================================

echo.
echo ========================================
echo   ATUALIZAR TOKEN COM PERMISSAO WORKFLOW
echo ========================================
echo.
echo O GitHub precisa da permissao "workflow"
echo para gerenciar arquivos em .github/workflows/
echo.
echo ========================================
echo   SOLUCAO DEFINITIVA
echo ========================================
echo.
echo O GitHub bloqueou porque seu token nao
echo tem a permissao "workflow".
echo.
echo Voce PRECISA criar um novo token com:
echo   - repo (todas opcoes)
echo   - workflow (OBRIGATORIO!)
echo.
echo PASSO 1: Criar Novo Token no GitHub
echo.
echo 1. Acesse: https://github.com/settings/tokens
echo 2. Clique em: Generate new token (classic)
echo 3. Nome: JEACLOSET Deploy - Com Workflow
echo 4. Marque as permissoes:
echo    - repo (todas as opcoes)
echo    - workflow (OBRIGATORIO!)
echo 5. Gere/Copie o novo token
echo.
echo IMPORTANTE: Copie o token agora! Voce nao vera mais.
echo.
pause

echo.
echo PASSO 2: Configurar novo token
echo.
set /p NEW_TOKEN="Cole o novo token (com permissao workflow): "

if "%NEW_TOKEN%"=="" (
    echo ERRO: Token nao fornecido
    pause
    exit /b 1
)

echo.
echo Configurando remote com novo token...
git remote set-url origin https://%NEW_TOKEN%@github.com/JeACloset/JeACloset.git

if errorlevel 1 (
    echo ERRO: Falha ao configurar remote
    pause
    exit /b 1
)

echo.
echo OK Token atualizado!
echo.
echo Agora execute:
echo   git push -u origin main
echo.
pause

