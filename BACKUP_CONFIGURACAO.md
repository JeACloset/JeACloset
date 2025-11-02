# 🔄 Sistema de Backup Automático - JEACLOSET

## 📋 Como Funciona

O sistema faz backup automático dos dados do Firebase sempre que a cliente acessa a aplicação, **se passou 3 dias** desde o último backup.

### ✅ O que está implementado:

1. **Verificação automática** ao carregar a aplicação
2. **Exportação completa** de todas as coleções:
   - `users`
   - `clothing`
   - `sales`
   - `fluxo`
   - `notes`
   - `investments`
3. **Salvamento automático** no Google Drive (pasta `JEACLOSET-Backups`)
4. **Roda em segundo plano** - a cliente não vê nada

---

## 🔐 Configuração Inicial (Primeira Vez)

### 1. Primeira Autorização

Na **primeira vez** que a cliente acessar a aplicação após 3 dias:
- Abrirá uma tela do Google pedindo permissão
- Cliente precisa autorizar acesso ao Google Drive
- Após autorizar, funciona automaticamente depois

### 2. Onde Encontrar os Backups

Os backups são salvos automaticamente na pasta:
**Google Drive → `JEACLOSET-Backups`**

Nome dos arquivos:
- `JEACLOSET-backup-YYYY-MM-DD-HHmm.json`

---

## ⚙️ Configurações Disponíveis

No arquivo `src/config/driveConfig.ts` você pode ajustar:

```typescript
backupIntervalDays: 3  // Mudar para 2, 5, 7, etc.
folderName: 'JEACLOSET-Backups'  // Nome da pasta no Drive
```

---

## 🚀 Publicação no Netlify

Ao publicar, certifique-se de que:
1. ✅ Arquivo `driveConfig.ts` está configurado com as credenciais
2. ✅ URL no Netlify corresponde ao `redirectUri` no `driveConfig.ts`
3. ✅ Google Cloud Console tem a URL do Netlify nas "Origens JavaScript autorizadas"

---

## 📝 Notas Importantes

- **Backup acontece automaticamente** - cliente não precisa fazer nada
- **Múltiplos backups** - mantém histórico completo no Drive
- **Seguro** - dados apenas na conta Google da cliente
- **Gratuito** - Google Drive permite até 15GB gratuitos

---

## 🔍 Como Verificar se Está Funcionando

1. Abra o console do navegador (F12)
2. Ao acessar a aplicação, procure por mensagens:
   - `🔄 Iniciando backup automático...`
   - `✅ Backup salvo no Google Drive`
3. Verifique no Google Drive se a pasta `JEACLOSET-Backups` foi criada

---

## ❓ Troubleshooting

**Backup não está funcionando?**
- Verifique se as credenciais no `driveConfig.ts` estão corretas
- Verifique o console do navegador para erros
- Certifique-se que a URL do Netlify está configurada no Google Cloud Console

