# 🔐 INSTRUÇÕES: Adicionar Permissão Workflow ao Token

## ⚠️ PROBLEMA ATUAL

O GitHub está bloqueando o push porque seu token **não tem a permissão `workflow`**.

O erro aparece para qualquer arquivo em `.github/workflows/`:
- ✅ `pre-deploy.yml` 
- ✅ `README.md` (mesmo depois de mover)

## ✅ SOLUÇÃO DEFINITIVA

Você **PRECISA** adicionar a permissão `workflow` ao seu token.

---

## 📋 Passo a Passo (5 minutos)

### 1. Acesse o GitHub

Vá para: **https://github.com/settings/tokens**

### 2. Encontre seu Token Atual

Procure pelo token que você está usando:
- Token atual: `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`

### 3. Editar Token

**Opção A: Editar token existente (se permitir)**
- Clique no token
- Se houver opção "Edit", edite e adicione `workflow`

**Opção B: Criar novo token (mais fácil)**
- Clique em **"Generate new token (classic)"**
- Dê um nome: `JEACLOSET Deploy - Com Workflow`

### 4. Marcar Permissões

⚠️ **IMPORTANTE: Marque estas permissões:**

```
✅ repo (todas as opções):
   ✅ repo:status
   ✅ repo_deployment  
   ✅ public_repo
   ✅ repo:invite
   ✅ security_events

✅ workflow ← ADICIONAR ESTA!
```

### 5. Gerar Token

- Clique em **"Generate token"**
- **COPIE O TOKEN IMEDIATAMENTE!** (você não verá mais)

### 6. Configurar no Git

Execute este comando (substitua `SEU_NOVO_TOKEN`):

```bash
git remote set-url origin https://SEU_NOVO_TOKEN@github.com/JeACloset/JeACloset.git
```

**Exemplo:**
```bash
git remote set-url origin https://ghp_XXXXXXXXXX_NOVO_TOKEN@github.com/JeACloset/JeACloset.git
```

### 7. Testar Push

```bash
git push -u origin main
```

**Agora deve funcionar!** ✅

---

## 🚀 OU Use o Script Automático

Execute:
```
ATUALIZAR_TOKEN_WORKFLOW.bat
```

O script vai guiar você passo a passo.

---

## ⚠️ IMPORTANTE

- O token antigo **pode continuar funcionando** para outras coisas
- Mas para `.github/workflows/` você **PRECISA** do token com `workflow`
- Após atualizar, faça push normalmente

---

**Após seguir estes passos, o push funcionará definitivamente!** 🎉

