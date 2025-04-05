# Usa a imagem base do Node (versão 16 LTS)
FROM node:16

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia apenas os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta que o servidor irá rodar (caso use 3000 no src/server.js)
EXPOSE 3000

# Comando para rodar a aplicação em produção
CMD ["npm", "start"]
