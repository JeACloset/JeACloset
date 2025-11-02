#!/bin/bash

# ==========================================
# SCRIPT DE DEPLOY AUTOMATICO - GITHUB
# ==========================================
# Salve como: DEPLOY_GITHUB.sh
# Execute: chmod +x DEPLOY_GITHUB.sh && ./DEPLOY_GITHUB.sh

echo ""
echo "========================================"
echo "  DEPLOY AUTOMATICO - GITHUB"
echo "========================================"
echo ""

# Função para parar em caso de erro
exit_on_error() {
    echo ""
    echo "❌ ERRO: $1"
    echo ""
    read -p "Pressione ENTER para sair"
    exit 1
}

# Função para sucesso
show_success() {
    echo "✅ $1"
}

# PASSO 1: Verificar se está em um repositório Git
echo "PASSO 1: Verificando repositório Git..."
if [ ! -d ".git" ]; then
    exit_on_error "Este diretório não é um repositório Git. Execute 'git init' primeiro."
fi
show_success "Repositório Git encontrado"
echo ""

# PASSO 2: Verificar status do Git
echo "PASSO 2: Verificando status do Git..."
GIT_STATUS=$(git status --porcelain)
if [ -z "$GIT_STATUS" ]; then
    echo "⚠️  Nenhuma alteração para commitar"
    echo ""
    read -p "Deseja fazer push mesmo assim? (S/N): " response
    if [ "$response" != "S" ] && [ "$response" != "s" ]; then
        echo ""
        echo "Operação cancelada pelo usuário"
        read -p "Pressione ENTER para sair"
        exit 0
    fi
else
    echo "Alterações detectadas:"
    echo "$GIT_STATUS"
    echo ""
fi
echo ""

# PASSO 3: Verificar branch atual
echo "PASSO 3: Verificando branch atual..."
CURRENT_BRANCH=$(git branch --show-current)
echo "Branch atual: $CURRENT_BRANCH"
echo ""

# PASSO 4: Adicionar arquivos
echo "PASSO 4: Adicionando arquivos ao Git..."
git add .
if [ $? -ne 0 ]; then
    exit_on_error "Falha ao adicionar arquivos ao Git"
fi
show_success "Arquivos adicionados"
echo ""

# PASSO 5: Solicitar mensagem de commit
echo "PASSO 5: Mensagem do commit..."
echo ""
echo "Digite a mensagem do commit:"
echo "(Deixe em branco para usar mensagem padrão)"
echo ""
read -p "Mensagem: " commit_message

if [ -z "$commit_message" ]; then
    commit_message="chore: deploy automático - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Usando mensagem padrão: $commit_message"
fi

echo ""

# PASSO 6: Fazer commit
echo "PASSO 6: Fazendo commit..."
git commit -m "$commit_message"
if [ $? -ne 0 ]; then
    echo "⚠️  Nada para commitar ou commit já realizado"
else
    show_success "Commit realizado com sucesso!"
    echo "Mensagem: $commit_message"
fi
echo ""

# PASSO 7: Verificar se há remote configurado
echo "PASSO 7: Verificando remote do GitHub..."
REMOTE_URL=$(git remote get-url origin 2>&1)
if [ $? -ne 0 ]; then
    echo "⚠️  Remote 'origin' não configurado"
    echo ""
    read -p "Deseja configurar o remote agora? (S/N): " setup_remote
    if [ "$setup_remote" = "S" ] || [ "$setup_remote" = "s" ]; then
        echo ""
        echo "Digite a URL do repositório GitHub:"
        echo "(Exemplo: https://github.com/usuario/repositorio.git)"
        read -p "URL: " new_remote
        if [ -n "$new_remote" ]; then
            git remote add origin "$new_remote"
            if [ $? -eq 0 ]; then
                show_success "Remote 'origin' configurado"
                REMOTE_URL="$new_remote"
            else
                exit_on_error "Falha ao configurar remote"
            fi
        else
            exit_on_error "URL do repositório não fornecida"
        fi
    else
        exit_on_error "Não é possível fazer push sem remote configurado"
    fi
else
    show_success "Remote encontrado: $REMOTE_URL"
fi
echo ""

# PASSO 8: Fazer push
echo "PASSO 8: Fazendo push para o GitHub..."
echo "Branch: $CURRENT_BRANCH"
echo "Remote: $REMOTE_URL"
echo ""

# Verificar se o branch existe no remote
git ls-remote --heads origin "$CURRENT_BRANCH" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️  Branch não existe no remote. Será criado automaticamente."
    echo ""
fi

# Perguntar se quer fazer push
read -p "Deseja fazer push para o GitHub? (S/N): " push_confirm

if [ "$push_confirm" = "S" ] || [ "$push_confirm" = "s" ]; then
    echo ""
    echo "Enviando alterações..."
    
    # Tentar push com upstream
    git push -u origin "$CURRENT_BRANCH" > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        # Se falhar, tentar push simples
        git push origin "$CURRENT_BRANCH"
        if [ $? -ne 0 ]; then
            exit_on_error "Falha ao fazer push para o GitHub. Verifique suas credenciais e conexão."
        fi
    fi
    
    show_success "Push realizado com sucesso!"
    echo ""
else
    echo ""
    echo "⚠️  Push cancelado pelo usuário"
    echo ""
    echo "Para fazer push manualmente, execute:"
    echo "   git push -u origin $CURRENT_BRANCH"
    echo ""
    read -p "Pressione ENTER para sair"
    exit 0
fi

# PASSO 9: Informações sobre deploy
echo ""
echo "========================================"
echo "  ✅ DEPLOY CONCLUÍDO!"
echo "========================================"
echo ""
echo "📤 Código enviado para o GitHub com sucesso!"
echo ""
echo "🔗 Repositório:"
echo "   $REMOTE_URL"
echo ""
echo "🌿 Branch:"
echo "   $CURRENT_BRANCH"
echo ""

# Verificar se o Netlify está configurado (verificar netlify.toml)
if [ -f "netlify.toml" ]; then
    echo "🚀 NETLIFY:"
    echo "   Se o Netlify estiver conectado a este repositório,"
    echo "   o deploy será iniciado automaticamente!"
    echo ""
    echo "   Aguarde alguns minutos e verifique:"
    echo "   https://app.netlify.com"
    echo ""
fi

# Verificar se há workflow do GitHub Actions
if [ -d ".github/workflows" ]; then
    echo "⚙️  GITHUB ACTIONS:"
    echo "   Os workflows serão executados automaticamente!"
    echo ""
    echo "   Verifique em:"
    echo "   https://github.com/[usuario]/[repositorio]/actions"
    echo ""
fi

echo "========================================"
echo ""
read -p "Pressione ENTER para sair"

