# JEACLOSET - Sistema de Gestão de Vestuário Feminino

Sistema completo de gestão de estoque e vendas para o ramo de vestuário feminino, desenvolvido com React, TypeScript e Firebase.

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18 com TypeScript e Vite
- **Estilização**: Tailwind CSS com tema personalizado
- **Banco de dados**: Firebase/Firestore
- **Ícones**: Lucide React

## 📋 Funcionalidades

### ✅ Implementadas
- **Cadastro de Peças**: Formulário completo com validação e cálculos automáticos
- **Gerenciamento de Estoque**: Visualização em tabela com filtros avançados
- **Sistema de Variações**: Controle de tamanhos, cores e quantidades
- **Cálculos Financeiros**: Preços baseados em custos + margem de lucro
- **Interface Responsiva**: Design moderno e adaptável

### 🔄 Em Desenvolvimento
- Registro de Vendas
- Histórico de Vendas
- Relatórios e Analytics
- Gestão de Investimentos
- Fluxo de Caixa
- Sistema de Autenticação

## 🛠️ Configuração do Projeto

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Firebase
1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto ou use um existente
3. Ative o Firestore Database
4. Copie as configurações do seu projeto
5. Edite o arquivo `src/config/firebase.ts` com suas credenciais:

```typescript
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "sua-app-id"
};
```

### 3. Executar o Projeto
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ClothingForm.tsx    # Formulário de cadastro
│   ├── InventoryManager.tsx # Gerenciamento de estoque
│   ├── SalesRegister.tsx   # Registro de vendas
│   ├── SalesHistory.tsx    # Histórico de vendas
│   ├── Reports.tsx         # Relatórios
│   ├── Investments.tsx     # Investimentos
│   ├── CashFlow.tsx        # Fluxo de caixa
│   └── Account.tsx         # Conta do usuário
├── config/
│   └── firebase.ts      # Configuração do Firebase
├── hooks/
│   └── useFirestore.ts  # Hook personalizado para Firestore
├── types/
│   └── index.ts         # Definições de tipos TypeScript
├── App.tsx              # Componente principal
└── index.css            # Estilos globais com Tailwind
```

## 🎨 Características do Design

- **Tema Rosa/Elegante**: Cores suaves e femininas
- **Interface Intuitiva**: Navegação por abas lateral
- **Responsivo**: Funciona em desktop, tablet e mobile
- **Componentes Reutilizáveis**: Botões, inputs e cards padronizados

## 📊 Estrutura de Dados

### ClothingItem
- Informações básicas (nome, categoria, marca, fornecedor)
- Variações (tamanhos, cores, quantidades)
- Preços e custos (custo, frete, extras, margem)
- Status e datas
- Tags para busca

### Categorias Suportadas
- Blusas, Camisetas, Vestidos, Calças, Shorts, Saias
- Jaquetas, Blazers, Casacos, Roupas Íntimas
- Acessórios, Calçados, Bolsas, Cintos, Joias

### Tamanhos
- Numéricos: 34, 36, 38, 40, 42, 44, 46, 48, 50, 52
- Letras: PP, P, M, G, GG, XG, XXG
- Customizados: Único

## 🔧 Próximos Passos

1. **Configurar Firebase** com suas credenciais
2. **Testar o cadastro** de peças
3. **Implementar funcionalidades** restantes conforme necessário
4. **Personalizar** cores e layout conforme sua marca

## 📞 Suporte

Para dúvidas ou sugestões, entre em contato através do sistema de issues do projeto.

---

**JEACLOSET** - Transformando a gestão de vestuário feminino! 💖