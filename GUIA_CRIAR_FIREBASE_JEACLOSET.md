# 🔥 Guia: Criar Firebase Separado para JEACLOSET

## 📋 Por que criar um Firebase separado?

- ✅ Projeto independente em outro email
- ✅ Não mistura com USEKAYLLA e SOLARIE
- ✅ Dados completamente isolados
- ✅ Controle de acesso separado

---

## 🚀 Passo a Passo Completo

### 1️⃣ Criar Novo Email/Gmail (se necessário)

Se você já tem outro email, pule para o passo 2.

1. Acesse: https://accounts.google.com/signup
2. Crie uma nova conta Gmail (ex: `jeacloset@gmail.com`)
3. Verifique o email

---

### 2️⃣ Fazer Logout do Firebase Atual

1. No console do Firebase que está aberto:
   - Clique na foto do perfil (canto superior direito)
   - Clique em **"Sair"** ou **"Sign out"**

---

### 3️⃣ Acessar Firebase com Novo Email

1. Acesse: https://console.firebase.google.com
2. Clique em **"Fazer login"**
3. Faça login com o **NOVO email** (o que você quer usar para JEACLOSET)

---

### 4️⃣ Criar Novo Projeto Firebase

1. Clique no botão **"Criar um novo projeto do Firebase"** (ou "Add project")
2. **Nome do projeto**: Digite `jeacloset` (minúsculas)
3. Clique em **"Continuar"**

---

### 5️⃣ Configurar Google Analytics (Opcional)

1. Você pode **desativar** o Google Analytics se não precisar
   - Desmarque a opção "Enable Google Analytics for this project"
   - OU escolha uma conta e clique em **"Continuar"**
2. Clique em **"Criar projeto"**
3. Aguarde a criação (pode levar alguns segundos)

---

### 6️⃣ Ativar Firestore Database

1. No painel do projeto, procure por **"Firestore Database"** no menu lateral
2. Clique em **"Firestore Database"**
3. Clique em **"Criar banco de dados"**

#### Configurações do Firestore:

1. **Escolher o modo de segurança:**
   - Selecione: **"Iniciar em modo de teste"** (para desenvolvimento)
   - ⚠️ **IMPORTANTE**: Isso permite leitura/escrita para qualquer usuário por 30 dias
   
2. **Escolher localização:**
   - Recomendado: **`southamerica-east1`** (Brasil - São Paulo)
   - OU escolha a mais próxima de você
   - Clique em **"Habilitar"**

3. **Aguardar criação:**
   - Pode levar 1-2 minutos
   - Não feche a página

---

### 7️⃣ Configurar Regras de Segurança (Temporário)

1. Vá para a aba **"Regras"** no Firestore
2. Substitua o código por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura e escrita para usuários autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // OU se não usar autenticação ainda, permitir tudo (APENAS PARA DESENVOLVIMENTO)
    // match /{document=**} {
    //   allow read, write: if true;
    // }
  }
}
```

3. Clique em **"Publicar"**

---

### 8️⃣ Obter Credenciais do Firebase

1. Clique no **ícone de engrenagem** (⚙️) ao lado de "Visão geral do projeto"
2. Selecione **"Configurações do projeto"**
3. Role até a seção **"Seus aplicativos"**
4. Clique no ícone **`</>`** (Web) para adicionar app web

---

### 9️⃣ Registrar App Web

1. **Nome do app**: Digite `jeacloset-web`
2. **Hosting do Firebase**: Pode deixar desmarcado por enquanto
3. Clique em **"Registrar app"**

---

### 🔟 Copiar Credenciais

Você verá um código JavaScript com as configurações. Copie apenas os valores:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",           // ← Copie isso
  authDomain: "...",            // ← Copie isso
  projectId: "jeacloset",       // ← Copie isso
  storageBucket: "...",          // ← Copie isso
  messagingSenderId: "...",      // ← Copie isso
  appId: "1:..."                 // ← Copie isso
};
```

---

### 1️⃣1️⃣ Atualizar Arquivo firebase.ts

1. Abra o arquivo: `src/config/firebase.ts`
2. Substitua TODAS as credenciais pelas novas que você copiou
3. Certifique-se de que `projectId` está como `"jeacloset"` (minúsculas)

**Exemplo do que deve ficar:**

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyDkY4FPYiUhpgGYkcYzJJ1uUyQv0yEe9Vo", // ← NOVA
  authDomain: "jeacloset.firebaseapp.com",            // ← NOVA
  projectId: "jeacloset",                              // ← NOVA (minúsculas!)
  storageBucket: "jeacloset.appspot.com",              // ← NOVA
  messagingSenderId: "948098617374",                  // ← NOVA
  appId: "1:948098617374:web:abc123..."               // ← NOVA
};
```

---

### 1️⃣2️⃣ Testar a Conexão

1. Salve o arquivo `firebase.ts`
2. Recarregue a aplicação (`Ctrl + Shift + R`)
3. Abra o Console do navegador (F12)
4. Verifique se não há erros do Firebase

---

## ✅ Checklist Final

Antes de considerar completo:

- [ ] Novo email criado (se necessário)
- [ ] Logout do Firebase antigo
- [ ] Login no Firebase com novo email
- [ ] Projeto `jeacloset` criado
- [ ] Firestore Database ativado
- [ ] Regras de segurança publicadas
- [ ] App web registrado (`jeacloset-web`)
- [ ] Credenciais copiadas
- [ ] Arquivo `firebase.ts` atualizado
- [ ] Aplicação testada e funcionando

---

## 🔒 Segurança

**Importante para produção:**

1. **Regras de Segurança:**
   - Mode de teste é apenas para desenvolvimento
   - Para produção, configure regras adequadas
   - Documentação: https://firebase.google.com/docs/firestore/security/get-started

2. **Autenticação:**
   - Considere ativar Firebase Authentication
   - Configure métodos de login (email/senha, Google, etc)

---

## 🆘 Troubleshooting

### Erro: "Firebase não está inicializado"
- Verifique se as credenciais estão corretas
- Certifique-se que o `projectId` está em minúsculas

### Erro: "permission-denied"
- Verifique as regras do Firestore
- Certifique-se que publicou as regras

### Erro: "unavailable" ou timeout
- Verifique sua conexão com internet
- Verifique se o Firestore está ativado
- Aguarde alguns minutos e tente novamente

---

## 📞 Próximos Passos

Após configurar o Firebase:

1. ✅ Testar cadastro de peças
2. ✅ Testar gerenciamento de estoque
3. ✅ Verificar se dados estão salvando no Firebase
4. ✅ Configurar regras de segurança adequadas

---

**Pronto! 🎉 Agora você tem um Firebase completamente separado para o JEACLOSET!**

