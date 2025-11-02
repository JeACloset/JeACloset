# 🔐 Solução: Password authentication is not supported

## ❌ Erro que você está vendo:

```
remote: Invalid username or token. 
Password authentication is not supported for Git operations.
fatal: Authentication failed
```

## ✅ SOLUÇÃO RÁPIDA

### Opção 1: Usar Script Automático (Mais Fácil)

1. **Execute:**
   ```
   CONFIGURAR_TOKEN_GIT.bat
   ```

2. **Escolha opção 1** (Inserir token na URL)

3. **Cole o token** que você copiou:
   ```
   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
   ```
   (Use o seu token, não esse exemplo)

4. **Pronto!** Agora execute:
   ```
   ATUALIZAR_GITHUB.bat
   ```

---

### Opção 2: Configurar Manualmente (Passo a Passo)

#### Método A: Token na URL (Mais Simples)

1. **Pegue seu token:**
   - Token que você copiou: `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`

2. **Configure o remote com token:**
   ```bash
   git remote set-url origin https://SEU_TOKEN@github.com/JeACloset/JeACloset.git
   ```
   
   **Exemplo:**
   ```bash
   git remote set-url origin https://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@github.com/JeACloset/JeACloset.git
   ```
   
   ⚠️ **Substitua `SEU_TOKEN` pelo token que você copiou!**

3. **Teste:**
   ```bash
   git push -u origin main
   ```
   
   Agora deve funcionar sem pedir senha!

---

#### Método B: Usar Credential Helper

1. **Configurar credential helper:**
   ```bash
   git config --global credential.helper wincred
   ```

2. **Fazer push:**
   ```bash
   git push -u origin main
   ```

3. **Quando pedir credenciais:**
   - **Username:** `JeACloset` (seu usuário do GitHub)
   - **Password:** Cole o **TOKEN** (NÃO sua senha do GitHub!)
     ```
     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
     ```

4. **O Windows salvará as credenciais** para próximas vezes

---

## 🎯 Qual Método Usar?

| Método | Vantagem | Desvantagem |
|--------|----------|-------------|
| **Token na URL** | Mais simples, funciona direto | Token fica visível no `.git/config` |
| **Credential Helper** | Mais seguro | Precisa digitar token na primeira vez |

**Recomendação:** Use o **Token na URL** (Método A) - é mais fácil e funciona imediatamente!

---

## 📝 Passo a Passo Completo (Token na URL)

### 1. Pegue seu token
Do GitHub, você já tem:
```
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
```

### 2. Configure o remote
```bash
git remote set-url origin https://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@github.com/JeACloset/JeACloset.git
```
⚠️ **Substitua pelo SEU token!**

### 3. Teste
```bash
git push -u origin main
```

**Deve funcionar agora!** ✅

---

## 🔍 Verificar se está configurado corretamente

```bash
git remote -v
```

**Deve mostrar algo como:**
```
origin  https://ghp_...TOKEN...@github.com/JeACloset/JeACloset.git (fetch)
origin  https://ghp_...TOKEN...@github.com/JeACloset/JeACloset.git (push)
```

Se aparecer o token na URL, está correto! ✅

---

## ⚠️ IMPORTANTE

- **NÃO** compartilhe o arquivo `.git/config` publicamente (ele tem seu token)
- **NÃO** faça commit do arquivo `.git/config`
- Se o token expirar, gere um novo e atualize a URL

---

## 🚀 Após Configurar

Agora você pode usar normalmente:
```
ATUALIZAR_GITHUB.bat
```

Ou comandos manuais:
```bash
git add .
git commit -m "sua mensagem"
git push
```

**Tudo funcionará sem pedir senha!** 🎉

