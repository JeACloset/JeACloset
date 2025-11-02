# 🔄 Workflows do GitHub Actions

## 📋 Pre-Deploy Checklist

Este workflow executa verificações automáticas antes do deploy no Netlify.

### 🚀 Como funciona

O workflow `pre-deploy.yml` executa automaticamente quando:

- ✅ Você faz `push` para `main` ou `master`
- ✅ Você abre um `pull request` para `main` ou `master`
- ✅ Você executa manualmente via "Actions" no GitHub

### 📝 O que é verificado

1. **Limpeza de cache** - Remove `node_modules`, `dist`, `build`, etc.
2. **Instalação de dependências** - Instala com `--legacy-peer-deps --include=optional`
3. **Verificação de tipos TypeScript** - Executa `tsc --noEmit`
4. **Build de produção** - Executa `npm run build`
5. **Verificação de arquivos** - Verifica presença de `.npmrc`, `netlify.toml`, `vite.config.ts`

### 🔍 Detecção de erros conhecidos

O workflow é inteligente e detecta erros conhecidos que ocorrem no ambiente local mas não no Netlify:

- ❌ Erros do Rollup relacionados a dependências opcionais
- ❌ Erros do npm ci quando `package-lock.json` é removido
- ❌ Erros de versão do Node.js
- ❌ Erros de dependências opcionais

Quando detecta esses erros, o workflow **não falha**, apenas avisa que o deploy no Netlify deve funcionar corretamente.

### 📊 Ver status

1. Vá para a aba **"Actions"** no GitHub
2. Clique no workflow **"Pre-Deploy Checklist"**
3. Veja o status de cada etapa

### ⚠️ Importante

- O workflow usa **Node.js 20** (mesma versão do Netlify)
- O workflow **não faz commit/push automaticamente** - você deve fazer manualmente
- Se o workflow falhar, corrija os erros antes de fazer deploy

### 🔧 Executar manualmente

1. Vá para **Actions** no GitHub
2. Clique em **"Pre-Deploy Checklist"**
3. Clique em **"Run workflow"**
4. Selecione o branch e clique em **"Run workflow"**

### 📚 Arquivos relacionados

- `.github/workflows/pre-deploy.yml` - Workflow do GitHub Actions
- `pre-deploy.ps1` - Script PowerShell para Windows (execução local)
- `netlify.toml` - Configuração do Netlify

