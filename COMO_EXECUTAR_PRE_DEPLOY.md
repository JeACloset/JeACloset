# 🚀 Como Executar o Pre-Deploy

## ❌ Problema: Ao clicar em `.ps1` abre o Bloco de Notas

Isso é normal no Windows! Arquivos `.ps1` não executam automaticamente ao clicar.

## ✅ SOLUÇÃO RÁPIDA

### Opção 1: Usar o Arquivo .BAT (Mais Fácil) ⭐

**Clique duas vezes em:**
```
PRE-DEPLOY.bat
```

Pronto! O script PowerShell será executado automaticamente!

---

### Opção 2: Executar pelo PowerShell

1. **Abra o PowerShell** (não o CMD)
2. **Navegue até a pasta:**
   ```powershell
   cd "C:\Users\danie\OneDrive\Área de Trabalho\NOVA APLICAÇÂO"
   ```
3. **Execute:**
   ```powershell
   .\pre-deploy.ps1
   ```

**Se der erro de permissão:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\pre-deploy.ps1
```

---

### Opção 3: Executar pelo CMD (Prompt de Comando)

1. **Abra o CMD** (Prompt de Comando)
2. **Navegue até a pasta:**
   ```cmd
   cd "C:\Users\danie\OneDrive\Área de Trabalho\NOVA APLICAÇÂO"
   ```
3. **Execute:**
   ```cmd
   powershell -ExecutionPolicy Bypass -File pre-deploy.ps1
   ```

---

## 🎯 RECOMENDAÇÃO

**Use sempre o `PRE-DEPLOY.bat`** - É mais fácil e funciona sempre!

1. Clique duas vezes em `PRE-DEPLOY.bat`
2. O script PowerShell será executado automaticamente
3. Siga as instruções na tela

---

## 📋 O que o Script Faz

1. ✅ Limpa cache
2. ✅ Instala dependências
3. ✅ Verifica TypeScript
4. ✅ Faz build
5. ✅ Detecta erros
6. ✅ Pergunta se quer fazer push
7. ✅ Se sim, faz commit e push para GitHub
8. ✅ Netlify detecta e faz deploy automaticamente

---

## 🔧 Se Ainda Não Funcionar

### Permitir Execução de Scripts (Uma Vez)

Abra o PowerShell como Administrador e execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Depois execute normalmente:
```powershell
.\pre-deploy.ps1
```

---

## 📝 Arquivos Disponíveis

| Arquivo | Como Usar | Quando Usar |
|---------|-----------|-------------|
| `PRE-DEPLOY.bat` | Clique duas vezes | ⭐ **Use este!** |
| `pre-deploy.ps1` | Execute no PowerShell | Se preferir PowerShell |
| `ATUALIZAR_GITHUB.bat` | Clique duas vezes | Atualizações simples |
| `PRIMEIRA_VEZ_GITHUB.bat` | Clique duas vezes | Primeira vez configurando |

---

**Agora você pode usar o `PRE-DEPLOY.bat` clicando duas vezes nele!** 🎉

