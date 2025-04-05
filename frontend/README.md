# AgroConnect - Frontend

Este é o frontend do AgroConnect, uma aplicação que conecta produtores rurais e técnicos agrícolas para aluguel de máquinas e contratação de serviços.

## Tecnologias Utilizadas

- React Native
- Expo
- React Navigation
- Axios
- AsyncStorage
- Expo Notifications
- Expo Image Picker
- Expo Location

## Estrutura do Projeto

```
/frontend
  ├── /src
  │    ├── /screens           # Telas da aplicação
  │    │     ├── LoginScreen.js
  │    │     ├── RegisterScreen.js
  │    │     ├── HomeScreen.js
  │    │     ├── AnnouncementDetailScreen.js
  │    │     ├── CreateAnnouncementScreen.js
  │    │     ├── ChatScreen.js
  │    │     ├── ReviewScreen.js
  │    │     ├── ProfileScreen.js
  │    │     ├── MyAnnouncementsScreen.js
  │    │     └── MyOffersScreen.js
  │    ├── /components        # Componentes reutilizáveis
  │    │     ├── CustomButton.js
  │    │     ├── FormInput.js
  │    │     ├── AnnouncementCard.js
  │    │     └── LoadingIndicator.js
  │    └── /services          # Serviços e configurações
  │          ├── api.js
  │          ├── authContext.js
  │          └── notificationService.js
  ├── App.js                  # Componente principal
  ├── app.json                # Configuração do Expo
  └── package.json            # Dependências
```

## Funcionalidades

### Autenticação
- Login e registro de usuários
- Perfis de produtor e técnico
- Gerenciamento de sessão com tokens JWT

### Anúncios
- Listagem de anúncios com filtros
- Criação e edição de anúncios
- Detalhes do anúncio com imagens
- Categorização (Maquinário, Consultoria, Serviços, etc.)

### Ofertas
- Envio de ofertas para anúncios
- Negociação de valores
- Acompanhamento de status (pendente, aceita, rejeitada, concluída)

### Chat
- Comunicação entre usuários
- Discussão de detalhes da negociação

### Avaliações
- Avaliação após conclusão da negociação
- Visualização de avaliações recebidas

### Perfil
- Edição de informações pessoais
- Visualização de anúncios e ofertas
- Gerenciamento de conta

## Instalação e Execução

### Pré-requisitos
- Node.js (v14 ou superior)
- npm ou yarn
- Expo CLI

### Instalação
```bash
# Instalar dependências
npm install
# ou
yarn install
```

### Execução
```bash
# Iniciar o servidor de desenvolvimento
npm start
# ou
yarn start
```

Após iniciar o servidor, você pode executar o aplicativo em:
- Emulador Android/iOS
- Dispositivo físico através do aplicativo Expo Go
- Navegador web (funcionalidade limitada)

## Configuração

### Variáveis de Ambiente
Para conectar ao backend, edite o arquivo `src/services/api.js` e atualize a URL da API:

```javascript
const API_URL = 'http://seu-ip:3000/api';
```

### Notificações Push
Para configurar as notificações push, você precisa:
1. Criar um projeto no Firebase
2. Adicionar o arquivo `google-services.json` na raiz do projeto
3. Configurar o Expo para usar o Firebase Cloud Messaging

## Observações

Este é um protótipo funcional e algumas funcionalidades podem estar simuladas ou simplificadas. Em uma versão de produção, seria necessário implementar:

- Testes automatizados
- Melhor tratamento de erros
- Otimização de performance
- Implementação completa do sistema de pagamentos
- Melhorias de acessibilidade
