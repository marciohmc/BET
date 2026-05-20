# Guia de Configuração Docker & Deploy no Render - Cassanova

Este guia orienta passo a passo como executar localmente via **Docker / Docker Compose** o ecossistema do cassino Cassanova e como realizar o deploy produtivo na plataforma **Render.com**.

---

## ⚠️ Nota de Arquitetura Crucial (MongoDB vs PostgreSQL)

O código mestre do backend que você enviou utiliza **Mongoose (MongoDB)** como provedor de banco de dados (`mongoose.connect(MONGODB_URI)`). 

Caso você utilize o PostgreSQL, o backend **não funcionará e falhará ao iniciar** por falta de drivers relacionais e schemas SQL. Por esta razão, configuramos o **MongoDB** nos arquivos oficiais do Docker e no guia do Render para que sua aplicação funcione perfeitamente sem necessidade de reescrever o código do banco de dados.

---

## Parte 1: Executando a Aplicação Localmente com Docker

Graças aos arquivos criados (`backend/Dockerfile`, `frontend/Dockerfile` e `docker-compose.yml`), você pode subir todo o ecossistema com um único comando.

### Requisitos
- **Docker** instalado em sua máquina.
- **Docker Compose** instalado.

### Passo 1: Organização dos Arquivos
Garanta que os arquivos gerados estão posicionados da seguinte forma na estrutura do seu projeto:
```text
Cassanova-main/
├── backend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile             # Dockerfile do Backend criado
├── frontend/
│   ├── app/
│   ├── package.json
│   └── Dockerfile             # Dockerfile do Frontend criado
├── docker-compose.yml         # Docker Compose na raiz criado
└── .env                       # Variáveis de ambiente na raiz (opcional)
```

### Passo 2: Subindo os Serviços
Abra o terminal na pasta raiz do projeto (`Cassanova-main/`) e rode o seguinte comando para construir as imagens e iniciar os serviços:

```bash
docker-compose up --build
```

O comando irá:
1. Subir um container MongoDB isolado na porta `27017`.
2. Compilar os arquivos TypeScript do backend e iniciar a API na porta `5000`.
3. Compilar o aplicativo Next.js (Frontend) e expor o servidor de produção na porta `3000`.

### Passo 3: Verificando as Conexões
- **Frontend (Next.js):** Acesse `http://localhost:3000` no seu navegador.
- **Backend (API):** Acesse `http://localhost:5000/api/health` para ver o status da API (`{"status": "OK", "message": "Cassanova API is running"}`).
- **Banco de Dados (MongoDB):** Estará acessível em `mongodb://localhost:27017/cassanova`.

Para rodar os containers em segundo plano (modo daemon):
```bash
docker-compose up -d
```

Para desligar o serviço:
```bash
docker-compose down
```

---

## Parte 2: Passo a Passo do Deploy na Nuvem (Render.com)

O Render é uma plataforma de nuvem fantástica para hospedar Next.js (Frontend) e Express (Backend). Como o Cassanova necessita de um banco de dados MongoDB, faremos o deploy em 3 etapas integradas.

### 🌟 Etapa 1: Provisionando o MongoDB na Nuvem

O Render não possui banco MongoDB com persistência integrada nativo, por isso o padrão de mercado recomendado para o MongoDB é utilizar o **MongoDB Atlas** (estágio gratuito excelente para produção e homologação).

1. Crie uma conta gratuita em [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Crie um Cluster Compartilhado Grátis (Shared Cluster).
3. Vá em **Database Access** e crie um usuário para o Cassanova (Guarde o usuário e senha).
4. Vá em **Network Access** e clique em **Add IP Address** -> Selecione **Allow Access from Anywhere** (`0.0.0.0/0`) para permitir as instâncias do Render conectarem.
5. Clique em **Connect** -> **Connect your application** e copie a sua string de conexão (`MONGODB_URI`), ela se parecerá com isto:
   `mongodb+srv://<usuario>:<senha>@cluster0.xxxx.mongodb.net/cassanova?retryWrites=true&w=majority`

---

### 🚀 Etapa 2: Deploy do Backend (API Express) no Render

1. Acesse o painel do [Render.com](https://render.com/) e faça login.
2. Clique em **New** -> **Web Service**.
3. Conecte o repositório do GitHub onde estão localizados os códigos de Cassanova.
4. Preencha as configurações do serviço do **Backend**:
   - **Name:** `cassanova-backend`
   - **Root Directory:** `backend` *(fundamental especificar para que o Render build apenas esta pasta)*
   - **Language/Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start` *(ou `node dist/server.js`)*
5. Clique em **Advanced** e clique em **Add Environment Variable** para preencher as variáveis do `.env`:
   - `PORT` = `10000` *(o Render define isso automaticamente, mas você pode setar se quiser)*
   - `MONGODB_URI` = *Insira a string de conexão copiada do MongoDB Atlas*
   - `JWT_SECRET` = *Insira uma chave secreta complexa de produção*
   - `NODE_ENV` = `production`
6. Clique em **Create Web Service**. 
7. Copie a URL pública gerada para o seu backend pelo Render (ex: `https://cassanova-backend.onrender.com`).

---

### 💻 Etapa 3: Deploy do Frontend (Next.js) no Render

Next.js por possuir recursos dinâmicos e rotas `/app` pode ser implantado como outro **Web Service** no Render.

1. No painel do Render, clique em **New** -> **Web Service**.
2. Selecione o mesmo repositório sob o GitHub.
3. Preencha as configurações do serviço do **Frontend**:
   - **Name:** `cassanova-frontend`
   - **Root Directory:** `frontend` *(fundamental apontar para a pasta frontend)*
   - **Language/Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Clique em **Advanced** e configure a variável de ambiente necessária para conectar Next.js ao backend:
   - `NEXT_PUBLIC_API_URL` = *Insira a URL pública que você copiou do Backend na etapa anterior* (ex: `https://cassanova-backend.onrender.com/api`)
5. Clique em **Create Web Service**.

Pronto! Ao final das compilações, o Render disponibilizará sua aplicação frontend publica. O Next.js se conectará com segurança à sua API backend no Render, que por sua vez se comunicará com o cluster de altíssima velocidade e persistência no MongoDB Atlas.
