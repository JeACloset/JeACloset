# 📁 Arquivos .BAT - Explicação e Uso

## ✅ Arquivos Essenciais (Manter)

### 1. `PRE-DEPLOY.bat` ⭐ **PRINCIPAL - TUDO EM UM**
**Quando usar:** Sempre antes de fazer deploy
**O que faz:**
- ✅ Limpa cache
- ✅ Instala dependências
- ✅ Verifica TypeScript
- ✅ Faz build
- ✅ Detecta erros
- ✅ **Pergunta se quer atualizar GitHub** (git add, commit, push)

**Como usar:** Clique duas vezes no arquivo

**Vantagem:** Tudo em um único script! Verifica erros E já atualiza o GitHub se você quiser.

---

## 💻 Desenvolvimento Local

### 2. `INICIAR_PROJETO.bat` 🚀 **DESENVOLVIMENTO**
**Quando usar:** Quando for trabalhar no código localmente
**O que faz:**
- Instala/atualiza dependências
- Inicia servidor de desenvolvimento (`npm run dev`)
- Abre em `http://localhost:5176`

**Como usar:** Clique duas vezes no arquivo

---

## 🗑️ Arquivos Removidos (Simplificação)

- ❌ `ATUALIZAR_GITHUB.bat` - `PRE-DEPLOY.bat` já faz isso
- ❌ `PRIMEIRA_VEZ_GITHUB.bat` - Não precisa mais (já configurado)
- ❌ `CONFIGURAR_TOKEN_GIT.bat` - Se precisar, será criado novamente
- ❌ `ATUALIZAR_TOKEN_WORKFLOW.bat` - Se precisar, será criado novamente
- ❌ `REMOVER_SECRETS_GITHUB.bat` - Se precisar, será criado novamente

---

## 📋 Fluxo Recomendado

### Para Deploy Completo:
```
1. PRE-DEPLOY.bat (valida tudo E pergunta se quer atualizar GitHub)
   ↓
2. Se tudo OK e você disser "S", ele faz push automaticamente
   ↓
3. Netlify detecta e faz deploy automaticamente
```

### Para Desenvolvimento Local:
```
INICIAR_PROJETO.bat (instala dependências e inicia servidor)
```

---

## ❓ Dúvidas?

- **Quer validar erros E atualizar GitHub?** → `PRE-DEPLOY.bat` (faz tudo!)
- **Trabalhar localmente?** → `INICIAR_PROJETO.bat`
- **Problema com token/autenticação?** → Me avise que crio script específico

---

**Total de arquivos .bat mantidos: 2** ✨
- 1 principal (deploy completo)
- 1 desenvolvimento local

