# 🚀 Próximos Passos - JEACLOSET

## ✅ O que já foi concluído

1. ✅ Projeto renomeado de USEKAYLLA para JEACLOSET
2. ✅ `package.json`: nome atualizado para "jeacloset"
3. ✅ localStorage: usando chave `JEACLOSET_user`
4. ✅ Emails: configurados com domínio `@JEACLOSET.com`
5. ✅ Porta: 5176 (configurada no `vite.config.ts`)
6. ✅ Título da página: "JEACLOSET" (em `index.html`)
7. ✅ Interface: título atualizado para "JEACLOSET"
8. ✅ README.md: atualizado com informações do projeto

## 📝 Configurações Atuais

### Firebase (ATENÇÃO - Precisa ser atualizado)
```typescript
// src/config/firebase.ts
projectId: "JEACLOSET"
authDomain: "JEACLOSET.firebaseapp.com"
```

**⚠️ IMPORTANTE**: As credenciais do Firebase no arquivo `src/config/firebase.ts` provavelmente são de exemplo. Você precisa criar um novo projeto Firebase para JEACLOSET.

## 🔥 Passos para Configurar Firebase

### 1. Criar Projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"** ou **"Create a project"**
3. Nome do projeto: `jeacloset` (em minúsculas)
4. Aceite os termos e clique em **Continuar**
5. Desative o Google Analytics (ou mantenha se quiser)
6. Clique em **Criar projeto**

### 2. Ativar Firestore Database

1. No painel do projeto, clique em **Firestore Database**
2. Clique em **Criar banco de dados**
3. Escolha o modo: **Iniciar em modo de teste** (para desenvolvimento)
4. Escolha uma localização (ex: `southamerica-east1` para Brasil)
5. Clique em **Habilitar**

### 3. Configurar Regras de Segurança

1. Vá para a aba **Regras** no Firestore
2. Substitua por este código temporário:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
3. Clique em **Publicar**

### 4. Obter Credenciais

1. Vá em **Configurações do projeto** (ícone de engrenagem)
2. Role até **Seus aplicativos**
3. Clique em **Adicionar app** > **Web** (ícone </>)
4. Registre o app com nome: `jeacloset-web`
5. Copie as credenciais que aparecerem

### 5. Atualizar firebase.ts

Atualize o arquivo `src/config/firebase.ts` com suas credenciais reais:

```typescript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "jeacloset.firebaseapp.com",
  projectId: "jeacloset",
  storageBucket: "jeacloset.appspot.com", // ou jeacloset.firebasestorage.app
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

## 🌐 Deploy no Netlify

### Opção 1: Via GitHub (Recomendado)

1. Crie um repositório no GitHub chamado `jeacloset`
2. No terminal, execute:
```bash
git init
git add .
git commit -m "Initial commit - JEACLOSET"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/jeacloset.git
git push -u origin main
```

3. Acesse [app.netlify.com](https://app.netlify.com)
4. Clique em **Add new site** > **Import an existing project**
5. Autorize acesso ao GitHub
6. Selecione o repositório `jeacloset`
7. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
8. Clique em **Deploy site**

### Opção 2: Via Arrastar e Soltar

1. Execute o build localmente:
```bash
npm run build
```
2. Acesse [app.netlify.com](https://app.netlify.com)
3. Arraste a pasta `dist` para o Netlify
4. O site estará no ar em segundos!

## 🧪 Testar Localmente

### 1. Instalar Dependências

```bash
npm install
```

### 2. Executar em Desenvolvimento

```bash
npm run dev
```

O site estará disponível em: **http://localhost:5176**

### 3. Usuários Padrão

Após configurar o Firebase, você poderá fazer login com:

- **Admin**:
  - Email: `admin@JEACLOSET.com`
  - Senha: `admin123`

- **Usuário**:
  - Email: `user@JEACLOSET.com`
  - Senha: `user123`

- **Visualizador** (modo demo):
  - Email: `test@JEACLOSET.com`
  - Senha: `test123`

## 📋 Checklist Final

Antes de fazer deploy, verifique:

- [ ] Firebase configurado com credenciais reais
- [ ] Firestore criado e configurado
- [ ] Regras de segurança do Firestore publicadas
- [ ] Projeto testado localmente (`npm run dev`)
- [ ] Build funcionando (`npm run build`)
- [ ] Repositório no GitHub (se usando Git)
- [ ] Netlify configurado

## 🔍 Arquivos Importantes

- `src/config/firebase.ts` - Credenciais do Firebase
- `netlify.toml` - Configuração do Netlify (já configurado)
- `vite.config.ts` - Configuração do Vite (porta 5176)
- `.npmrc` - Configuração de dependências (já configurado)
- `package.json` - Nome do projeto: "jeacloset"

## 💡 Dicas

1. **Problemas com dependências?**
   - Use `npm install --legacy-peer-deps`
   - Verifique o arquivo `.npmrc`

2. **Problemas no Netlify?**
   - Verifique os logs de build
   - A configuração já está em `netlify.toml`

3. **Ajuda com o Firebase?**
   - Consulte a [documentação oficial](https://firebase.google.com/docs)
   - Teste localmente antes do deploy

## 🎉 Pronto!

Siga estes passos e sua aplicação JEACLOSET estará no ar! 🚀

Para dúvidas, consulte a documentação ou execute `npm run dev` para testar localmente.

