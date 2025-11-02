# 🐛 Erros Comuns no Deploy do Netlify - Guia Completo

Este documento lista todos os erros comuns que podem aparecer durante o deploy no Netlify e suas soluções.

---

## 📋 Índice de Erros

1. [Erro de Versão do Node.js](#1-erro-de-versão-do-nodejs)
2. [Erro do Rollup Linux](#2-erro-do-rollup-linux)
3. [Erro de Dependências Opcionais](#3-erro-de-dependências-opcionais)
4. [Erro de Engine do Firebase/Capacitor](#4-erro-de-engine-do-firebasecapacitor)
5. [Erro de Comando de Build](#5-erro-de-comando-de-build)
6. [Erro do npm ci](#6-erro-do-npm-ci)
7. [Erro de Workflow Permission](#7-erro-de-workflow-permission) ⭐ NOVO
8. [Erro de Secrets Detectados](#8-erro-de-secrets-detectados) ⭐ NOVO
9. [Erro de TypeScript](#9-erro-de-typescript) ⭐ NOVO
10. [Erro de Módulo Não Encontrado](#10-erro-de-módulo-não-encontrado) ⭐ NOVO

---

## 1. Erro de Versão do Node.js

### ❌ Erro:
```
You are using Node.js 18.20.8. Vite requires Node.js version 20.19+ or 22.12+
```

### ✅ Solução:
**Arquivo:** `netlify.toml`
```toml
[build.environment]
  NODE_VERSION = "20"
```

**Status:** ✅ Já corrigido no projeto

---

## 2. Erro do Rollup Linux

### ❌ Erro:
```
Cannot find module @rollup/rollup-linux-x64-gnu
```

### ✅ Solução:
**Arquivo:** `netlify.toml`
```toml
[build]
  command = "rm -rf node_modules package-lock.json && npm install --legacy-peer-deps --include=optional && npm run build"
```

**Status:** ✅ Já corrigido no projeto

---

## 3. Erro de Dependências Opcionais

### ❌ Erro:
```
npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828)
```

### ✅ Solução:
**Arquivo:** `.npmrc`
```ini
optional=true
legacy-peer-deps=true
include=optional
```

**Status:** ✅ Já corrigido no projeto

---

## 4. Erro de Engine do Firebase/Capacitor

### ❌ Erro:
```
EBADENGINE Unsupported engine - package: '@firebase/app@0.14.4', required: { node: '>=20.0.0' }
```

### ✅ Solução:
**Arquivo:** `.npmrc`
```ini
engine-strict=false
```

**Arquivo:** `netlify.toml`
```toml
NODE_VERSION = "20"
```

**Status:** ✅ Já corrigido no projeto

---

## 5. Erro de Comando de Build

### ❌ Erro:
```
Build script returned non-zero exit code: 2
```

### ✅ Solução:
**Arquivo:** `netlify.toml`
```toml
[build]
  command = "rm -rf node_modules package-lock.json && npm install --legacy-peer-deps --include=optional && npm run build"
```

**Status:** ✅ Já corrigido no projeto

---

## 6. Erro do npm ci

### ❌ Erro:
```
npm ci can only install with an existing package-lock.json
```

### ✅ Solução:
**Arquivo:** `netlify.toml`
```toml
[build]
  command = "... npm install ..."  # Usa npm install, não npm ci
```

**Status:** ✅ Já corrigido no projeto

---

## 7. Erro de Workflow Permission ⭐ NOVO

### ❌ Erro:
```
refusing to allow a Personal Access Token to create or update workflow 
`.github/workflows/...` without `workflow` scope
```

### ✅ Solução:

1. **Criar novo token com permissão `workflow`:**
   - Acesse: https://github.com/settings/tokens
   - Clique em "Generate new token (classic)"
   - Marque: `repo` (todas) + `workflow` ← **OBRIGATÓRIO!**
   - Copie o token

2. **Configurar token:**
   ```bash
   git remote set-url origin https://SEU_TOKEN@github.com/JeACloset/JeACloset.git
   ```

3. **OU use o script:**
   ```
   ATUALIZAR_TOKEN_WORKFLOW.bat
   ```

**Status:** ✅ Detectado pelo script `pre-deploy.ps1`

---

## 8. Erro de Secrets Detectados ⭐ NOVO

### ❌ Erro:
```
GH013: Repository rule violations found
Push cannot contain secrets
GitHub Personal Access Token detected
```

### ✅ Solução:

1. **Remover secrets dos arquivos:**
   - `SOLUCAO_TOKEN_GITHUB.md` - Não usar tokens reais
   - `driveConfig.ts` - Adicionar ao `.gitignore`
   - `RESUMO_ALTERACOES_JEACLOSET.md` - Mascarar credenciais

2. **Adicionar ao `.gitignore`:**
   ```
   src/config/driveConfig.ts
   ```

3. **OU permitir secrets uma vez:**
   - Acesse os links fornecidos pelo GitHub
   - Clique em "Allow this secret"

**Status:** ✅ Detectado pelo script `pre-deploy.ps1`

---

## 9. Erro de TypeScript ⭐ NOVO

### ❌ Erro:
```
error TS2307: Cannot find module '...'
error TS2322: Type 'X' is not assignable to type 'Y'
```

### ✅ Solução:

1. **Verificar todos os erros:**
   ```bash
   npx tsc --noEmit
   ```

2. **Corrigir os erros:**
   - Imports corretos
   - Tipos corretos
   - Dependências instaladas

**Status:** ✅ Detectado pelo script `pre-deploy.ps1`

---

## 10. Erro de Módulo Não Encontrado ⭐ NOVO

### ❌ Erro:
```
Cannot find module '...'
Module not found: Can't resolve '...'
Failed to resolve import '...'
```

### ✅ Solução:

1. **Instalar dependências:**
   ```bash
   npm install --legacy-peer-deps --include=optional
   ```

2. **Verificar imports:**
   - Caminhos corretos
   - Extensões de arquivo (.ts, .tsx)
   - Dependências instaladas

**Status:** ✅ Detectado pelo script `pre-deploy.ps1`

---

## 🔍 Como o Script Detecta os Erros

O script `pre-deploy.ps1` verifica automaticamente:

1. ✅ **Antes do build:** Verifica dependências do Rollup
2. ✅ **Durante o build:** Detecta todos os erros acima
3. ✅ **Durante o push:** Detecta erros de autenticação e permissão

**Cada erro detectado mostra:**
- ⚠️ Mensagem clara do erro
- ✅ Soluções já aplicadas
- 📝 Próximos passos

---

## 🚀 Verificação Automática

Execute o script antes de fazer push:

```powershell
.\pre-deploy.ps1
```

**O script:**
- ✅ Limpa cache
- ✅ Instala dependências
- ✅ Verifica TypeScript
- ✅ Faz build
- ✅ Detecta TODOS os erros conhecidos
- ✅ Sugere soluções

---

## 📝 Notas

- **Erros conhecidos:** O script não falha se detectar erros conhecidos que já foram corrigidos
- **Erros desconhecidos:** O script falha e pede para corrigir manualmente
- **Build local vs Netlify:** Alguns erros aparecem localmente mas não no Netlify (e vice-versa)

---

**Última atualização:** 02/11/2025  
**Script atualizado:** `pre-deploy.ps1` versão 2.0

