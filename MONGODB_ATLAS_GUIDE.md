# Guia Passo a Passo: Configuração do MongoDB Atlas para o Cassanova

Como engenheiro Sênior de Software e Segurança da Informação (AppSec), este guia descreve o processo de ponta a ponta para provisionar, configurar e proteger um banco de dados MongoDB NoSQL de nível de produção no **MongoDB Atlas** para conectar perfeitamente à sua plataforma Cassanova (seja rodando localmente via Docker ou em deploy produtivo no Render).

---

## 🎯 Por que usar o MongoDB Atlas?
O backend do Cassanova é desenvolvido inteiramente sob a arquitetura **Mongoose ODM**. O MongoDB Atlas oferece clusters gerenciados de alta disponibilidade, backups automáticos de segurança, criptografia em repouso dos dados e um excelente plano gratuito (**M0 Basic**) para início imediato, sem necessidade de hardware local avançado.

Ao final deste tutorial, você obterá a string de conexão segura `MONGODB_URI` para inserir no seu arquivo `docker-compose.yml` ou nas variáveis de ambiente do Render.

---

## 🚀 Passo a Passo: Provisionando o Banco de Dados

### Passo 1: Criação de Conta no MongoDB Atlas
1. Acesse o portal oficial: [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Você pode se registrar rapidamente utilizando sua conta Google ou preenchendo o formulário de cadastro padrão.
3. Responda o breve questionário inicial de perfil do desenvolvedor (pode preencher de forma geral e direta) para ser direcionado ao painel do Atlas.

---

### Passo 2: Criando o seu Cluster de Banco de Dados Gratuito (M0)
1. No painel principal (Dashboard), clique no botão destacado **"Create"** ou **"New Cluster"**.
2. Na tela de seleção de planos, selecione a opção **M0 (Free)** (plano gratuito que oferece 512MB de armazenamento, ideal para desenvolvimento e testes de homologação).
3. **Provider & Region (Provedor e Região):**
   - Escolha **AWS**, **Google Cloud** ou **Azure** (Recomendamos **AWS** ou **Google Cloud**).
   - Escolha uma região física geograficamente próxima de onde seus servidores rodarão para reduzir a latência de tráfego. Exemplos: `N. Virginia (us-east-1)` ou `São Paulo (sa-east-1)`.
4. **Name (Nome do Cluster):** Pode manter o nome padrão `Cluster0` ou renomear para algo intuitivo como `Cassanova-Prod`.
5. Clique no botão inferior **"Create Cluster"**.

---

### Passo 3: Segurança Ativa - Criando o Usuário do Banco de Dados
A segurança de credenciais é essencial em estruturas iGaming. Você precisará de credenciais dedicadas para que a API do Cassanova se autentique:

1. Na tela **"Security Quickstart"** (ou no menu lateral esquerdo sob **Security** -> **Database Access**):
2. Em **"How would you like to authenticate your connection?"**, selecione **Username and Password** (Usuário e Senha).
3. Insira as credenciais do seu usuário de banco de dados. Exemplo:
   - **Username:** `cassanova_api_user`
   - **Password:** Clique em **"Autogenerate Secure Password"** para gerar uma senha criptograficamente segura. **Copie e salve esta senha em local blindado (como um gerenciador de segredos ou bloco de notas temporário)**.
4. Garanta que o privilégio de acesso (Database User Privileges) esteja setado para **"Read and Write to any database"** (Leitura e Escrita).
5. Clique em **"Create Database User"**.

---

### Passo 4: Segurança Ativa - Configurando a Lista de IPs Permitidos (Network Access)
Para blindar o banco de dados contra vetores de ataque externos, o MongoDB necessita saber quais servidores podem realizar requisições de conexão.

1. No menu lateral esquerdo, vá em **Security** -> **Network Access**.
2. Clique no botão à direita **"Add IP Address"**.
3. **Para desenvolvimento local ou nuvem (Render):**
   - Como os Web Services do Render possuem IPs de saída dinâmicos que mudam constantemente, a melhor prática de mercado é adicionar o padrão de rede global **"Allow Access from Anywhere"** (Permitir acesso de qualquer local).
   - Clique em **"Allow Access from Anywhere"**. O campo preencherá automaticamente: `0.0.0.0/0`.
   - *Nota de AppSec:* O acesso estará seguro porque qualquer conexão ainda exigirá a combinação altamente complexa de Usuário + Senha gerados no Passo 3.
4. Clique em **"Confirm"** e aguarde o status mudar de *Pending* para *Active*.

---

### Passo 5: Obtendo sua String de Conexão Mestre (MONGODB_URI)
Com o Cluster ativo, o usuário criado e a rede configurada, vamos obter o link que integrará o ecossistema:

1. Acesse o menu lateral **Services** -> **Database**.
2. Sob a visão do seu Cluster ativo, clique no botão cinza **"Connect"**.
3. Na janela pop-up, escolha a opção **"Drivers"** (conectar seu aplicativo usando drivers nativos do MongoDB).
4. No campo do Driver, confirme que está selecionado **Node.js** e a versão mais recente.
5. Copie a string de conexão em formato **SRV URI** exibida em cinza destacado. Ela se parecerá com o modelo abaixo:
   ```text
   mongodb+srv://cassanova_api_user:<db_password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```

---

## 🛠️ Integrando a String ao seu Projeto Cassanova

Para que a conexão mestre ocorra com êxito em qualquer ambiente do cassino, você deve substituir dois canais na string copiada:

1. Substitua `<db_password>` pela **senha mestre altamente segura** que você salvou no **Passo 3**. *(Atenção para remover as tags `<` e `>`)*.
2. Defina o nome do schema de banco de dados mestre inserindo `/cassanova` antes do caractere de interrogação `?`.

Sua string final integrada para produção/testes deve se parecer exatamente com isto:
```text
mongodb+srv://cassanova_api_user:MinhaSenhaUltraSeguraGenerica123@cluster0.xxxx.mongodb.net/cassanova?retryWrites=true&w=majority&appName=Cluster0
```

---

### 1. Inserindo no Docker-Compose Local (docker-compose.yml)
Abra o seu arquivo mestre `docker-compose.yml` e atualize a variável para o container `backend` apontar para a sua nuvem:

```yaml
  backend:
    # ... configurações anteriores
    environment:
      - PORT=5000
      - MONGODB_URI=mongodb+srv://cassanova_api_user:MinhaSenhaUltraSeguraGenerica123@cluster0.xxxx.mongodb.net/cassanova?retryWrites=true&w=majority&appName=Cluster0
      - JWT_SECRET=your-secret-key-change-in-production-safely-1234
      - FRONTEND_URL=http://localhost:3000
      - NODE_ENV=development
```
*Dica:* Ao apontar o Docker local para a nuvem Atlas, os dados que você registrar usando o frontend continuarão salvos de forma independente mesmo se você desligar ou reiniciar os containers Docker com `docker-compose down`.

---

### 2. Inserindo nas Configurações Produtivas do Render.com
No painel de deploy do Render (Etapa 2 descrita no guia oficial do cassino):

1. Vá em seu **Web Service do Backend** (`cassanova-backend`).
2. Clique na aba **"Environment"** (Variáveis de Ambiente).
3. Adicione ou edite a linha correspondente:
   - **Key:** `MONGODB_URI`
   - **Value:** `mongodb+srv://cassanova_api_user:MinhaSenhaUltraSeguraGenerica123@cluster0.xxxx.mongodb.net/cassanova?retryWrites=true&w=majority&appName=Cluster0`
4. Clique em **"Save Changes"**. O Render reiniciará sua aplicação automaticamente e ela se conectará de forma transparente, limpa e segura ao cluster de alta imunidade de dados que criamos.
