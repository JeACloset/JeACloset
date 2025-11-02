# 🚀 Como Usar o Deploy Automático no GitHub

Este guia explica como usar os scripts de deploy automático para enviar seu código ao GitHub e disparar o deploy no Netlify.

---

## 📁 Arquivos Disponíveis

Três scripts foram criados para diferentes sistemas operacionais:

| Arquivo | Sistema | Como Executar |
|---------|---------|---------------|
| `DEPLOY_GITHUB.ps1` | Windows (PowerShell) | Clique duas vezes ou execute no PowerShell |
| `DEPLOY_GITHUB.sh` | Linux/Mac (Bash) | `chmod +x DEPLOY_GITHUB.sh && ./DEPLOY_GITHUB.sh` |
| `DEPLOY_GITHUB.bat` | Windows (CMD) | Clique duas vezes no arquivo |

---

## 🪟 Windows (PowerShell)

### Opção 1: Executar pelo Explorador
1. Navegue até a pasta do projeto
2. Clique duas vezes em `DEPLOY_GITHUB.ps1`
3. Se necessário, permita a execução de scripts:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### Opção 2: Executar pelo PowerShell
```powershell
# Navegue até a pasta do projeto
cd "C:\caminho\para\projeto"

# Execute o script
.\DEPLOY_GITHUB.ps1
```

### Opção 3: Executar pelo CMD (arquivo .bat)
1. Clique duas vezes em `DEPLOY_GITHUB.bat`
2. Siga as instruções na tela

---

## 🐧 Linux / Mac (Bash)

### Passo 1: Dar permissão de execução
```bash
chmod +x DEPLOY_GITHUB.sh
```

### Passo 2: Executar o script
```bash
./DEPLOY_GITHUB.sh
```

---

## 📋 O que o Script Faz

1. ✅ **Verifica** se o diretório é um repositório Git
2. ✅ **Verifica** se há alterações para commitar
3. ✅ **Adiciona** todos os arquivos (`git add .`)
4. ✅ **Solicita** uma mensagem de commit
5. ✅ **Faz commit** das alterações
6. ✅ **Verifica** se há remote configurado
7. ✅ **Configura remote** se necessário (pergunta ao usuário)
8. ✅ **Faz push** para o GitHub
9. ✅ **Informa** sobre o deploy automático no Netlify

---

## 🔧 Configuração Inicial (Primeira Vez)

### 1. Inicializar Git (se ainda não foi feito)
```bash
git init
```

### 2. Configurar usuário Git (se ainda não foi feito)
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"
```

### 3. Configurar Remote do GitHub

**Opção A:** Se já tem o repositório no GitHub:
```bash
git remote add origin https://github.com/USUARIO/REPOSITORIO.git
```

**Opção B:** O script pergunta automaticamente se o remote não estiver configurado.

---

## 📝 Exemplo de Uso

### Cenário: Primeira vez usando o script

```
========================================
  DEPLOY AUTOMATICO - GITHUB
========================================

PASSO 1: Verificando repositório Git...
✅ Repositório Git encontrado

PASSO 2: Verificando status do Git...
Alterações detectadas:
 M  src/components/Account.tsx
 M  netlify.toml
 A  .github/workflows/pre-deploy.yml

PASSO 3: Verificando branch atual...
Branch atual: main

PASSO 4: Adicionando arquivos ao Git...
✅ Arquivos adicionados

PASSO 5: Mensagem do commit...
Digite a mensagem do commit:
(Deixe em branco para usar mensagem padrão)

Mensagem: feat: adicionar scripts de deploy automático

PASSO 6: Fazendo commit...
✅ Commit realizado com sucesso!
Mensagem: feat: adicionar scripts de deploy automático

PASSO 7: Verificando remote do GitHub...
✅ Remote encontrado: https://github.com/usuario/jeacloset.git

PASSO 8: Fazendo push para o GitHub...
Branch: main
Deseja fazer push para o GitHub? (S/N): S

Enviando alterações...
✅ Push realizado com sucesso!

========================================
  ✅ DEPLOY CONCLUÍDO!
========================================

📤 Código enviado para o GitHub com sucesso!

🔗 Repositório:
   https://github.com/usuario/jeacloset.git

🌿 Branch:
   main

🚀 NETLIFY:
   Se o Netlify estiver conectado a este repositório,
   o deploy será iniciado automaticamente!

   Aguarde alguns minutos e verifique:
   https://app.netlify.com
```

---

## ⚙️ Fluxo Completo

```
Você faz alterações no código
         ↓
Executa o script DEPLOY_GITHUB
         ↓
Script faz commit e push
         ↓
GitHub recebe as alterações
         ↓
Netlify detecta mudanças no GitHub
         ↓
Netlify executa build automaticamente
         ↓
Deploy concluído! 🎉
```

---

## 🔐 Autenticação no GitHub

### Para HTTPS:
O Git pode pedir suas credenciais. Use:
- **Username:** Seu usuário do GitHub
- **Password:** Use um **Personal Access Token** (não sua senha)

**Como criar Personal Access Token:**
1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Marque as permissões necessárias (pelo menos `repo`)
4. Copie o token e use como senha

### Para SSH:
Configure uma chave SSH no GitHub (mais seguro):
```bash
# Gerar chave SSH (se ainda não tiver)
ssh-keygen -t ed25519 -C "seu.email@exemplo.com"

# Adicionar ao GitHub
cat ~/.ssh/id_ed25519.pub
# Copie a saída e adicione em: https://github.com/settings/keys
```

---

## 🐛 Solução de Problemas

### Erro: "Este diretório não é um repositório Git"
```bash
git init
```

### Erro: "Remote 'origin' não configurado"
O script pergunta automaticamente. Ou configure manualmente:
```bash
git remote add origin https://github.com/USUARIO/REPOSITORIO.git
```

### Erro: "Falha ao fazer push"
- Verifique suas credenciais do GitHub
- Use Personal Access Token em vez de senha
- Verifique sua conexão com a internet

### Erro: "Permission denied" (Linux/Mac)
```bash
chmod +x DEPLOY_GITHUB.sh
```

### Erro: "Cannot run script" (Windows PowerShell)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 💡 Dicas

1. **Mensagem de commit:** Use mensagens descritivas como:
   - `feat: adicionar nova funcionalidade`
   - `fix: corrigir bug no login`
   - `chore: atualizar dependências`

2. **Verificar antes de fazer push:** O script mostra todas as alterações antes de commitar

3. **Deploy automático:** Se o Netlify estiver conectado ao repositório, o deploy será automático após o push

4. **GitHub Actions:** Se você tiver workflows configurados (como `.github/workflows/pre-deploy.yml`), eles serão executados automaticamente

---

## 📚 Arquivos Relacionados

- `.github/workflows/pre-deploy.yml` - Workflow do GitHub Actions para verificação pré-deploy
- `netlify.toml` - Configuração do Netlify
- `VERIFICACAO_DEPLOY_NETLIFY.md` - Verificação de erros comuns

---

**Pronto para usar! 🚀**

Execute o script correspondente ao seu sistema operacional e siga as instruções na tela.

