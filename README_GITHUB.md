# 📚 Guia de Uso - Git/GitHub para JEACLOSET

Siga o mesmo fluxo usado na aplicação USEKAYLLA.

---

## 🚀 Primeira Vez - Enviar Tudo para o GitHub

### Passo 1: Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. **Repository name:** `JEACLOSET` (ou o nome que preferir)
3. **Description:** (opcional)
4. **Visibility:** Escolha Público ou Privado
5. **⚠️ IMPORTANTE:** NÃO marque:
   - ❌ Add a README file
   - ❌ Add .gitignore
   - ❌ Choose a license
6. Clique em **"Create repository"**

### Passo 2: Executar Script de Primeira Vez

Execute o script:
```
PRIMEIRA_VEZ_GITHUB.bat
```

O script faz automaticamente:
- ✅ `git init` (se necessário)
- ✅ `git add .`
- ✅ `git commit -m "Primeiro commit: aplicação inicial"`
- ✅ Configura o remote
- ✅ `git branch -M main`
- ✅ `git push -u origin main`

### Passo 3: Ou Fazer Manualmente

Se preferir fazer manualmente:

```bash
# Na pasta do projeto
git init
git add .
git commit -m "Primeiro commit: aplicacao inicial"
git remote add origin https://github.com/Danielpnvs/JEACLOSET.git
git branch -M main
git push -u origin main
```

---

## 📝 Depois - Atualizar Quando Há Modificações

### Opção 1: Usar Script Automático (Recomendado)

Execute:
```
ATUALIZAR_GITHUB.bat
```

O script:
- ✅ Mostra mudanças (`git status`)
- ✅ Adiciona tudo (`git add .`)
- ✅ Faz commit (pede mensagem)
- ✅ Envia para GitHub (`git push`)

### Opção 2: Comandos Manuais

```bash
# Ver mudanças
git status

# Adicionar arquivos modificados
git add .
# OU arquivos específicos:
git add arquivo1.ts arquivo2.tsx

# Commit (salvar mudanças)
git commit -m "Descrição do que foi alterado"

# Enviar para o GitHub
git push
```

---

## 📋 Exemplos de Mensagens de Commit

Use mensagens claras e descritivas:

```bash
# Correções
git commit -m "fix: correção de erro ao acessar aba histórico"
git commit -m "fix: correções de data e deploy para Netlify"

# Novas funcionalidades
git commit -m "feat: adicionar campo de telefone do cliente"
git commit -m "feat: sistema de restauração de backup"

# Melhorias
git commit -m "refactor: melhorar validação de formulários"
git commit -m "style: ajustar layout mobile"

# Renomeação
git commit -m "Renomeado para JEACLOSET"
```

---

## 📁 Scripts Disponíveis

| Script | Quando Usar | O que Faz |
|--------|-------------|-----------|
| `PRIMEIRA_VEZ_GITHUB.bat` | Primeira vez configurando Git | Inicializa, commit inicial, configura remote, push |
| `ATUALIZAR_GITHUB.bat` | Atualizações normais | Add, commit, push (versão simples) |
| `DEPLOY_GITHUB.bat` | Deploy completo com verificações | Versão completa com mais validações |
| `pre-deploy.ps1` | Antes de fazer deploy | Verifica build, TypeScript, etc |

---

## 🔄 Fluxo Completo de Trabalho

```
1. Você faz alterações no código
         ↓
2. Execute: ATUALIZAR_GITHUB.bat
         ↓
3. Digite mensagem do commit
         ↓
4. Script faz: git add . → commit → push
         ↓
5. GitHub recebe as alterações
         ↓
6. Netlify detecta automaticamente
         ↓
7. Netlify faz build e deploy
         ↓
8. Aplicação atualizada! 🎉
```

---

## 🔍 Comandos Úteis

```bash
# Ver status (o que mudou)
git status

# Ver histórico de commits
git log

# Ver remote configurado
git remote -v

# Mudar remote (se necessário)
git remote set-url origin https://github.com/Danielpnvs/JEACLOSET.git

# Ver branch atual
git branch

# Mudar para branch main
git branch -M main
```

---

## 🐛 Solução de Problemas

### Erro: "Repository not found"
- **Causa:** Repositório não existe no GitHub
- **Solução:** Crie em https://github.com/new

### Erro: "Permission denied" (403)
- **Causa:** Sem permissão ou não autenticado
- **Solução:** Configure Personal Access Token em https://github.com/settings/tokens

### Erro: "Nothing to commit"
- **Causa:** Não há mudanças para commitar
- **Solução:** Está tudo certo! Faça alterações primeiro

### Remote já configurado incorretamente
```bash
git remote remove origin
git remote add origin https://github.com/Danielpnvs/JEACLOSET.git
```

---

## ✅ Checklist - Primeira Vez

- [ ] Criar repositório em https://github.com/new
- [ ] Executar `PRIMEIRA_VEZ_GITHUB.bat`
- [ ] Ou seguir comandos manuais
- [ ] Verificar push no GitHub
- [ ] Configurar Netlify para detectar o repositório

---

## ✅ Checklist - Atualizações

- [ ] Fazer alterações no código
- [ ] Executar `ATUALIZAR_GITHUB.bat`
- [ ] Verificar push no GitHub
- [ ] Aguardar deploy automático no Netlify

---

**Pronto! Agora você segue o mesmo fluxo simples da USEKAYLLA!** 🚀

