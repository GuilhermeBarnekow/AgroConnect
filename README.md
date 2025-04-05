# AgroConnect

AgroConnect é uma plataforma que conecta produtores rurais e técnicos agrícolas para aluguel de máquinas e contratação de serviços. Este protótipo funcional permite cadastro de usuários, criação de anúncios, negociação de valores através de ofertas, avaliações entre usuários e notificações push.

## Visão Geral

O projeto é dividido em duas partes principais:

1. **Frontend**: Aplicativo móvel desenvolvido com React Native e Expo
2. **Backend**: API RESTful desenvolvida com Node.js, Express e PostgreSQL

## Funcionalidades Principais

- **Autenticação**: Cadastro e login de usuários com dois perfis (produtor e técnico)
- **Anúncios**: Criação e gerenciamento de anúncios de serviços agrícolas e máquinas para aluguel
- **Ofertas**: Sistema de propostas para negociação de valores entre usuários
- **Chat**: Comunicação direta entre usuários para discutir detalhes
- **Avaliações**: Sistema de avaliação após conclusão do negócio
- **Notificações**: Alertas via Firebase Cloud Messaging (FCM)

## Estrutura do Projeto

```
/agroconnect
  ├── /frontend           # Aplicação React Native com Expo
  │     ├── /src
  │     │    ├── /screens
  │     │    ├── /components
  │     │    └── /services
  │     ├── app.json
  │     ├── package.json
  │     └── README.md
  └── /backend            # API com Node.js, Express e PostgreSQL
        ├── /src
        │    ├── /controllers
        │    ├── /models
        │    ├── /routes
        │    ├── /middlewares
        │    ├── /migrations
        │    ├── config.js
        │    └── app.js
        ├── package.json
        └── README.md
```

## Tecnologias Utilizadas

### Frontend
- React Native
- Expo
- React Navigation
- Axios
- AsyncStorage
- Expo Notifications
- Expo Image Picker

### Backend
- Node.js
- Express
- PostgreSQL
- Sequelize (ORM)
- JWT (Autenticação)
- Bcrypt (Criptografia de senhas)
- Multer (Upload de arquivos)

## Instalação e Execução

### Pré-requisitos
- Node.js (v14 ou superior)
- npm ou yarn
- PostgreSQL
- Expo CLI (para o frontend)

### Backend

```bash
# Entrar na pasta do backend
cd agroconnect/backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Crie um arquivo .env com base no .env.example

# Executar migrações do banco de dados
npx sequelize-cli db:migrate

# Iniciar o servidor
npm start
```

### Frontend

```bash
# Entrar na pasta do frontend
cd agroconnect/frontend

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm start
```

Após iniciar o servidor Expo, você pode executar o aplicativo em:
- Emulador Android/iOS
- Dispositivo físico através do aplicativo Expo Go
- Navegador web (funcionalidade limitada)

## Configuração

### Backend
Configure as variáveis de ambiente no arquivo `.env`:

```
DB_HOST=localhost
DB_USER=postgres
DB_PASS=sua_senha
DB_NAME=agroconnect
JWT_SECRET=sua_chave_secreta
PORT=3000
```

### Frontend
Para conectar ao backend, edite o arquivo `src/services/api.js` e atualize a URL da API:

```javascript
const API_URL = 'http://seu-ip:3000/api';
```

## Fluxo de Uso

1. Usuário se cadastra como produtor ou técnico
2. Usuário cria anúncios ou navega pelos anúncios existentes
3. Usuário faz ofertas em anúncios de interesse
4. Proprietário do anúncio aceita ou rejeita ofertas
5. Usuários conversam via chat para acertar detalhes
6. Após conclusão do negócio, usuários se avaliam mutuamente

## Próximos Passos

Este é um protótipo funcional. Para uma versão de produção, seria necessário implementar:

- Sistema de pagamentos
- Melhorias de segurança
- Testes automatizados
- Otimização de performance
- Melhorias de UX/UI
- Funcionalidades adicionais como filtros avançados, geolocalização, etc.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.
