# ✅ Checklist: Publicação no Netlify - JEACLOSET

## 🔧 Antes de Publicar

### 1. Verificar Google Cloud Console

Acesse: https://console.cloud.google.com/apis/credentials

#### Origens JavaScript autorizadas:
- ✅ `http://localhost:5176` (para desenvolvimento)
- ✅ `https://jeacloset.netlify.app` (para produção)

#### URIs de redirecionamento autorizados:
- ✅ `http://localhost:5176/drive-auth-callback.html` (para desenvolvimento)
- ✅ `https://jeacloset.netlify.app/drive-auth-callback.html` (para produção)

**IMPORTANTE:** Verifique se TODAS essas URLs estão configuradas antes de publicar!

---

## 📦 Arquivos para Publicar

Certifique-se de que esses arquivos estão no projeto:
- ✅ `src/config/driveConfig.ts` (com suas credenciais)
- ✅ `public/drive-auth-callback.html` (página de callback do OAuth)
- ✅ Todos os outros arquivos da aplicação

---

## 🚀 Publicação no Netlify

1. **Conecte seu repositório GitHub ao Netlify**
2. **Configure o build:**
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Variáveis de ambiente (se necessário):** Nenhuma necessária (tudo está no código)
4. **Deploy!**

---

## ✅ Após Publicar

### 1. Testar Backup Automático

1. Acesse: `https://jeacloset.netlify.app`
2. Faça login
3. Aguarde 5 segundos
4. Verifique o console (F12)
5. Deve aparecer popup do Google Drive (primeira vez)
6. Autorize o acesso
7. Backup será salvo automaticamente

### 2. Verificar no Google Drive

1. Acesse: https://drive.google.com
2. Procure pela pasta: `JEACLOSET-Backups`
3. Deve ter arquivos de backup lá

---

## ⚠️ Problemas Comuns

### Backup não funciona no Netlify:
- ✅ Verifique se `https://jeacloset.netlify.app` está nas "Origens JavaScript autorizadas"
- ✅ Verifique se `https://jeacloset.netlify.app/drive-auth-callback.html` está nos "URIs de redirecionamento"
- ✅ Aguarde 2-3 minutos após salvar no Google Cloud (propagação)

### Popup não abre:
- ✅ Verifique se popups não estão bloqueados no navegador
- ✅ Verifique o console do navegador para erros

### Erro 403 (Access denied):
- ✅ Verifique se o email está em "Usuários de teste" no Google Cloud
- ✅ Ou publique o app (em "Tela de permissão OAuth")

---

## 📝 Notas Importantes

- **Código já está configurado:** `window.location.origin` usa automaticamente a URL correta
- **Não precisa mudar código:** Funciona tanto em localhost quanto no Netlify
- **Token é salvo localmente:** Cada navegador/dispositivo precisa autorizar uma vez

---

## ✅ Pronto!

Após verificar tudo acima, está pronto para usar em produção! 🎉

