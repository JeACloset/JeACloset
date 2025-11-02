# 🔐 Como Configurar Personal Access Token no GitHub

## 📋 Passo a Passo Completo

### Passo 1: Criar Personal Access Token

1. **Acesse o GitHub:**
   - Vá para: https://github.com/settings/tokens
   - Ou: GitHub → Seu perfil (canto superior direito) → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Gerar novo token:**
   - Clique em **"Generate new token (classic)"**
   - Se pedir senha, confirme

3. **Configurar o token:**
   - **Note:** `JEACLOSET Deploy`
   - **Expiration:** Escolha (90 dias, 1 ano, ou "No expiration")
   - **Scopes:** Marque as seguintes opções:
     - ✅ **repo** (todas as opções de repo)
       - ✅ repo:status
       - ✅ repo_deployment
       - ✅ public_repo (se for repositório público)
       - ✅ repo:invite
       - ✅ security_events

4. **Gerar token:**
   - Role até o final e clique em **"Generate token"**

5. **⚠️ IMPORTANTE - Copiar o token:**
   - **COPIE O TOKEN IMEDIATAMENTE!**
   - Você NÃO verá mais esse token depois que fechar a página
   - Cole em algum lugar seguro (notepad, por exemplo)

### Passo 2: Configurar Git Credential Helper

Abra o PowerShell ou CMD e execute:

```bash
git config --global credential.helper wincred
```

Isso fará com que o Windows salve suas credenciais.

### Passo 3: Fazer Push Usando o Token

Quando executar `DEPLOY_GITHUB.bat` novamente e ele pedir credenciais:

1. **Username:** Digite `Danielpnvs` (seu usuário do GitHub)
2. **Password:** Cole o Personal Access Token que você copiou (NÃO sua senha do GitHub!)

### Passo 4: Testar

Execute o script novamente:
```bash
DEPLOY_GITHUB.bat
```

Agora deve funcionar!

---

## 🔍 Se Ainda Não Funcionar

### Verificar Permissões no Repositório

1. Acesse: https://github.com/JeACloset/JeACloset/settings
2. Verifique se você está como colaborador:
   - Settings → Collaborators
   - Se não estiver, peça para ser adicionado

### Alternativa: Criar Repositório Próprio

Se não conseguir acesso ao repositório `JeACloset/JeACloset`:

1. Crie um novo repositório com seu usuário:
   - https://github.com/new
   - Nome: `JeACloset` ou `jeacloset-app`
   - Público ou Privado

2. Configure o remote:
   ```bash
   git remote set-url origin https://github.com/Danielpnvs/JeACloset.git
   ```

3. Execute o script novamente

---

## ✅ Verificação Rápida

Teste se as credenciais estão funcionando:

```bash
git push -u origin master
```

Se pedir credenciais:
- Username: `Danielpnvs`
- Password: Personal Access Token

Se funcionar, o script `DEPLOY_GITHUB.bat` também funcionará!

