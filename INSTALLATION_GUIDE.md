# GUIA DE INSTALACAO COMPLETO
# Sistema de Gestao Disciplinar - FALINTIL-FDTL
# Direcao Justica e Disciplina

---

## INDICE

1. [Requisitos do Sistema](#requisitos-do-sistema)
2. [PARTE 1A - Instalacao em Localhost (Linux)](#parte-1a---instalacao-em-localhost-linux)
3. [PARTE 1B - Instalacao em Localhost (Windows)](#parte-1b---instalacao-em-localhost-windows)
4. [PARTE 1C - Acesso pela Rede Local (outro computador)](#parte-1c---acesso-pela-rede-local-outro-computador)
5. [PARTE 2A - Instalacao em Servidor (Linux)](#parte-2a---instalacao-em-servidor-linux)
6. [PARTE 2B - Instalacao em Servidor (Windows)](#parte-2b---instalacao-em-servidor-windows)
7. [Credenciais Padrao](#credenciais-padrao)
8. [Backup e Restauracao](#backup-e-restauracao)
8. [Solucao de Problemas](#solucao-de-problemas)

---

## Requisitos do Sistema

| Componente    | Versao Minima       | Funcao                          |
|---------------|---------------------|---------------------------------|
| Node.js       | v18.x ou superior   | Executar o frontend React       |
| Yarn          | v1.22+              | Gestor de pacotes do frontend   |
| Python        | 3.10 ou superior    | Executar o backend FastAPI      |
| MongoDB       | 6.0 ou superior     | Base de dados                   |
| Git           | Qualquer versao     | Clonar o repositorio            |

**Portas utilizadas:**
- Frontend: `3000`
- Backend API: `8001`
- MongoDB: `27017`

---

## PARTE 1A - INSTALACAO EM LOCALHOST (LINUX)

> Testado em Ubuntu 22.04 LTS e Debian 12

### Passo 1 de 7: Atualizar o sistema

Abra o Terminal e execute:

```bash
sudo apt update
sudo apt upgrade -y
```

Aguarde a conclusao. Este passo garante que todos os pacotes do sistema estao atualizados.

---

### Passo 2 de 7: Instalar o Node.js e Yarn

```bash
# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar a instalacao
node --version
# Deve mostrar: v18.x.x

# Instalar Yarn (gestor de pacotes)
sudo npm install -g yarn

# Verificar
yarn --version
```

Se o comando `node --version` mostrar a versao 18 ou superior, este passo esta concluido.

---

### Passo 3 de 7: Instalar o Python 3

```bash
# Instalar Python 3, pip e venv
sudo apt install -y python3 python3-pip python3-venv

# Verificar a instalacao
python3 --version
# Deve mostrar: Python 3.10.x ou superior
```

---

### Passo 4 de 7: Instalar e iniciar o MongoDB

```bash
# Importar a chave GPG do MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# Adicionar o repositorio
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Instalar
sudo apt update
sudo apt install -y mongodb-org

# Iniciar o servico MongoDB
sudo systemctl start mongod

# Ativar inicio automatico
sudo systemctl enable mongod

# Verificar se esta a funcionar
sudo systemctl status mongod
# Deve mostrar: active (running)
```

Para testar a conexao:
```bash
mongosh --eval "db.runCommand({ ping: 1 })"
# Deve mostrar: { ok: 1 }
```

---

### Passo 5 de 7: Clonar e configurar o projeto

```bash
# Clonar o repositorio
git clone <URL_DO_REPOSITORIO> sistema-disciplinar
cd sistema-disciplinar
```

**Configurar o Backend:**

```bash
cd backend

# Criar ambiente virtual Python
python3 -m venv venv

# Ativar o ambiente virtual
source venv/bin/activate

# Instalar dependencias (pode demorar 1-2 minutos)
pip install -r requirements.txt
```

**Criar o ficheiro .env do Backend:**

```bash
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=disciplina_fdtl
JWT_SECRET=ALTERAR_PARA_CHAVE_SECRETA_ALEATORIA_DE_64_CARACTERES
ADMIN_EMAIL=superadmin@falintil.tl
ADMIN_PASSWORD=Admin@2024
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
EOF
```

Para gerar uma chave secreta aleatoria para JWT_SECRET:
```bash
openssl rand -hex 32
# Copie o resultado e substitua no .env
```

**Configurar o Frontend:**

```bash
cd ../frontend

# Instalar dependencias (pode demorar 2-3 minutos)
yarn install

# Criar o ficheiro .env do frontend
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
```

---

### Passo 6 de 7: Iniciar a aplicacao

Precisa de **2 terminais** abertos simultaneamente:

**Terminal 1 - Iniciar o Backend:**

```bash
cd sistema-disciplinar/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Deve aparecer:
```
INFO:     Uvicorn running on http://0.0.0.0:8001
INFO:     Started reloader process
```

**Terminal 2 - Iniciar o Frontend:**

```bash
cd sistema-disciplinar/frontend
yarn start
```

Deve aparecer:
```
Compiled successfully!
You can now view the app in the browser.
Local: http://localhost:3000
```

---

### Passo 7 de 7: Acessar e verificar

1. Abra o navegador (Chrome, Firefox, etc.)
2. Acesse: **http://localhost:3000**
3. Faca login com as credenciais padrao (ver seccao "Credenciais Padrao")
4. Verifique se o Dashboard carrega corretamente
5. Verifique se consegue criar um novo caso

**Para parar a aplicacao:** Pressione `Ctrl+C` em cada terminal.

---

## PARTE 1B - INSTALACAO EM LOCALHOST (WINDOWS)

> Testado em Windows 10/11

### Passo 1 de 8: Instalar o Node.js

1. Abra o navegador e acesse: **https://nodejs.org/**
2. Clique no botao de download da versao **LTS** (Long Term Support)
3. Execute o ficheiro `.msi` descarregado
4. Siga o assistente de instalacao:
   - Clique "Next" em todas as telas
   - Aceite os termos
   - Mantenha as opcoes padrao
   - Clique "Install"
5. Quando terminar, clique "Finish"

**Verificar:** Abra o PowerShell (tecla Windows, digite "PowerShell", Enter) e execute:
```powershell
node --version
# Deve mostrar: v18.x.x ou superior
```

---

### Passo 2 de 8: Instalar o Yarn

No PowerShell (como Administrador - clique direito no PowerShell, "Executar como administrador"):

```powershell
npm install -g yarn
```

**Verificar:**
```powershell
yarn --version
```

---

### Passo 3 de 8: Instalar o Python

1. Acesse: **https://www.python.org/downloads/**
2. Clique em "Download Python 3.x.x"
3. Execute o ficheiro descarregado
4. **IMPORTANTE:** Na primeira tela, marque a opcao:
   - [x] **"Add python.exe to PATH"** (na parte inferior)
5. Clique em "Install Now"
6. Aguarde a instalacao e clique "Close"

**Verificar:** Abra um **novo** PowerShell e execute:
```powershell
python --version
# Deve mostrar: Python 3.10.x ou superior
```

---

### Passo 4 de 8: Instalar o MongoDB

1. Acesse: **https://www.mongodb.com/try/download/community**
2. Selecione:
   - Version: 6.0 ou superior
   - Platform: Windows
   - Package: MSI
3. Clique "Download"
4. Execute o ficheiro `.msi`
5. Siga o assistente:
   - Escolha "Complete" (instalacao completa)
   - **Marque:** "Install MongoDB as a Service" (muito importante!)
   - Marque "Install MongoDB Compass" (opcional, interface grafica)
   - Clique "Install"

**Verificar:** Abra o PowerShell e execute:
```powershell
mongosh --eval "db.runCommand({ ping: 1 })"
# Deve mostrar: { ok: 1 }
```

Se nao funcionar, verifique nos Servicos do Windows (Win+R, digite `services.msc`) se o servico "MongoDB Server" esta a correr.

---

### Passo 5 de 8: Instalar o Git

1. Acesse: **https://git-scm.com/download/win**
2. O download deve iniciar automaticamente
3. Execute o ficheiro e siga o assistente com as opcoes padrao

**Verificar:**
```powershell
git --version
```

---

### Passo 6 de 8: Clonar e configurar o projeto

Abra o PowerShell e execute:

```powershell
# Navegar para uma pasta de sua escolha (exemplo: Documentos)
cd C:\Users\SeuUsuario\Documents

# Clonar o repositorio
git clone <URL_DO_REPOSITORIO> sistema-disciplinar
cd sistema-disciplinar
```

**Configurar o Backend:**

```powershell
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar o ambiente virtual
.\venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

**Criar o ficheiro .env do Backend:**

Abra o Bloco de Notas (Notepad) e crie um ficheiro com o seguinte conteudo:

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=disciplina_fdtl
JWT_SECRET=ALTERAR_PARA_CHAVE_SECRETA_ALEATORIA_DE_64_CARACTERES
ADMIN_EMAIL=superadmin@falintil.tl
ADMIN_PASSWORD=Admin@2024
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
```

Salve como: `C:\Users\SeuUsuario\Documents\sistema-disciplinar\backend\.env`

> ATENCAO: No Bloco de Notas, ao salvar, selecione "Todos os ficheiros (*.*)" no tipo e escreva o nome como `.env` (com o ponto no inicio).

Para gerar uma chave secreta JWT, abra o PowerShell e execute:
```powershell
python -c "import secrets; print(secrets.token_hex(32))"
# Copie o resultado e cole no .env no campo JWT_SECRET
```

**Configurar o Frontend:**

```powershell
cd ..\frontend

# Instalar dependencias
yarn install
```

Criar o ficheiro `.env` do frontend em `C:\Users\SeuUsuario\Documents\sistema-disciplinar\frontend\.env`:

```
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

### Passo 7 de 8: Iniciar a aplicacao

Precisa de **2 janelas do PowerShell** abertas:

**PowerShell 1 - Iniciar o Backend:**

```powershell
cd C:\Users\SeuUsuario\Documents\sistema-disciplinar\backend
.\venv\Scripts\activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Deve aparecer:
```
INFO:     Uvicorn running on http://0.0.0.0:8001
```

**PowerShell 2 - Iniciar o Frontend:**

```powershell
cd C:\Users\SeuUsuario\Documents\sistema-disciplinar\frontend
yarn start
```

Deve aparecer:
```
Compiled successfully!
Local: http://localhost:3000
```

O navegador deve abrir automaticamente.

---

### Passo 8 de 8: Acessar e verificar

1. O navegador deve abrir automaticamente em **http://localhost:3000**
2. Se nao abrir, abra manualmente e acesse: http://localhost:3000
3. Faca login com as credenciais padrao (ver seccao "Credenciais Padrao")
4. Verifique se o Dashboard carrega
5. Verifique se consegue visualizar e criar casos

**Para parar:** Pressione `Ctrl+C` em cada janela do PowerShell.

---

## PARTE 1C - ACESSO PELA REDE LOCAL (OUTRO COMPUTADOR)

> Depois de instalar o sistema num computador (seguindo a Parte 1A ou 1B), pode acessa-lo a partir de qualquer outro computador na mesma rede Wi-Fi ou rede cabeada (LAN).

### Como funciona

O computador onde o sistema esta instalado funciona como um "servidor local". Os outros computadores na mesma rede podem aceder ao sistema atraves do navegador, usando o endereco IP desse computador.

```
  [Computador A]                    [Computador B]
  Sistema instalado aqui            Acessa pelo navegador
  IP: 192.168.1.100         --->    http://192.168.1.100:3000
  Backend: porta 8001
  Frontend: porta 3000
```

---

### Passo 1 de 5: Descobrir o IP do computador onde o sistema esta instalado

**No Linux:**

```bash
# Opcao 1 - Comando ip
ip addr show | grep "inet " | grep -v 127.0.0.1
# Procure o endereco que comeca com 192.168.x.x ou 10.x.x.x
# Exemplo de resultado:
#     inet 192.168.1.100/24 brd 192.168.1.255 scope global

# Opcao 2 - Comando hostname
hostname -I
# Exemplo: 192.168.1.100
```

**No Windows:**

```powershell
# No PowerShell
ipconfig
```

Procure pela secao "Adaptador de Rede Sem Fio Wi-Fi" ou "Adaptador Ethernet":
```
   Endereco IPv4. . . . . . . . : 192.168.1.100
```

> ANOTE ESTE NUMERO (exemplo: 192.168.1.100). Vai precisar dele nos proximos passos.

---

### Passo 2 de 5: Atualizar o ficheiro .env do Frontend

No computador onde o sistema esta instalado, altere o ficheiro `.env` do frontend para usar o IP em vez de `localhost`:

**No Linux:**

```bash
cd sistema-disciplinar/frontend

# Editar o ficheiro .env
nano .env
```

**No Windows:**

Abra o ficheiro `.env` da pasta `frontend` com o Bloco de Notas.

**Altere o conteudo de:**
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

**Para:**
```
REACT_APP_BACKEND_URL=http://192.168.1.100:8001
```

> Substitua `192.168.1.100` pelo IP real que encontrou no Passo 1.

---

### Passo 3 de 5: Atualizar o ficheiro .env do Backend

Altere o ficheiro `.env` do backend para aceitar conexoes da rede:

**No Linux:**

```bash
cd sistema-disciplinar/backend
nano .env
```

**No Windows:**

Abra o ficheiro `.env` da pasta `backend` com o Bloco de Notas.

**Altere as linhas:**
```
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
```

**Para:**
```
FRONTEND_URL=http://192.168.1.100:3000
CORS_ORIGINS=http://192.168.1.100:3000,http://localhost:3000
```

> Mantemos `http://localhost:3000` no CORS_ORIGINS para que o acesso local tambem continue a funcionar.

---

### Passo 4 de 5: Liberar as portas no Firewall

O firewall do computador pode bloquear o acesso de outros computadores. Precisa abrir as portas 3000 e 8001.

**No Linux (UFW):**

```bash
# Abrir porta do frontend
sudo ufw allow 3000

# Abrir porta do backend
sudo ufw allow 8001

# Verificar
sudo ufw status
```

Se o UFW nao estiver ativo, pode nao ser necessario (mas e recomendado ativa-lo):
```bash
sudo ufw enable
```

**No Windows:**

Opcao 1 - Pelo PowerShell (como Administrador):

```powershell
# Abrir porta do frontend
New-NetFirewallRule -DisplayName "Disciplina Frontend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow

# Abrir porta do backend
New-NetFirewallRule -DisplayName "Disciplina Backend" -Direction Inbound -Protocol TCP -LocalPort 8001 -Action Allow
```

Opcao 2 - Pela interface grafica:

1. Pressione a tecla Windows e procure **"Firewall do Windows Defender"**
2. Clique em **"Configuracoes avancadas"** (no lado esquerdo)
3. Clique em **"Regras de Entrada"** (Inbound Rules)
4. Clique em **"Nova Regra..."** (New Rule)
5. Selecione **"Porta"** e clique Proximo
6. Selecione **"TCP"** e em "Portas locais especificas" digite: **3000, 8001**
7. Selecione **"Permitir a conexao"** e clique Proximo
8. Marque todos os perfis (Dominio, Privado, Publico) e clique Proximo
9. Nome: **"Sistema Disciplinar"** e clique Concluir

---

### Passo 5 de 5: Reiniciar e acessar de outro computador

**No computador onde o sistema esta instalado:**

Pare os servicos (Ctrl+C em ambos os terminais) e inicie novamente:

**Linux:**
```bash
# Terminal 1 - Backend
cd sistema-disciplinar/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 - Frontend
cd sistema-disciplinar/frontend
HOST=0.0.0.0 yarn start
```

**Windows:**
```powershell
# PowerShell 1 - Backend
cd C:\Users\SeuUsuario\Documents\sistema-disciplinar\backend
.\venv\Scripts\activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# PowerShell 2 - Frontend
cd C:\Users\SeuUsuario\Documents\sistema-disciplinar\frontend
$env:HOST="0.0.0.0"
yarn start
```

> NOTA: O `--host 0.0.0.0` e o `HOST=0.0.0.0` sao essenciais! Permitem que o sistema aceite conexoes de outros computadores na rede, nao apenas do localhost.

**No outro computador (que quer acessar):**

1. Abra o navegador (Chrome, Firefox, Edge, etc.)
2. Na barra de endereco, digite:

```
http://192.168.1.100:3000
```

3. A pagina de login do sistema deve aparecer
4. Faca login com as credenciais normais

> Substitua `192.168.1.100` pelo IP real do computador onde o sistema esta instalado.

---

### Resumo rapido - Acesso pela rede

| O que fazer                        | Onde                | Valor                                  |
|------------------------------------|---------------------|----------------------------------------|
| Descobrir o IP                     | Computador A        | `hostname -I` (Linux) / `ipconfig` (Win) |
| Frontend .env                      | Computador A        | `REACT_APP_BACKEND_URL=http://IP:8001` |
| Backend .env - FRONTEND_URL        | Computador A        | `http://IP:3000`                       |
| Backend .env - CORS_ORIGINS        | Computador A        | `http://IP:3000,http://localhost:3000` |
| Liberar portas firewall            | Computador A        | 3000 e 8001                            |
| Iniciar backend com                | Computador A        | `--host 0.0.0.0`                       |
| Iniciar frontend com               | Computador A        | `HOST=0.0.0.0 yarn start`             |
| Acessar no navegador               | Computador B        | `http://IP:3000`                       |

---

### Solucao de problemas - Acesso pela rede

**Nao consigo acessar de outro computador:**

1. Verifique se os dois computadores estao na mesma rede (mesmo Wi-Fi ou mesma LAN)
2. No computador B, tente fazer ping ao computador A:
   ```bash
   ping 192.168.1.100
   ```
   Se nao responder, ha um problema de rede ou firewall.

3. No computador A, verifique se as portas estao abertas:
   ```bash
   # Linux
   sudo ss -tlnp | grep -E "3000|8001"

   # Windows PowerShell
   netstat -ano | findstr "3000 8001"
   ```
   Deve mostrar `0.0.0.0:3000` e `0.0.0.0:8001` (nao `127.0.0.1`)

4. Se mostrar `127.0.0.1` em vez de `0.0.0.0`:
   - Backend: certifique-se de usar `--host 0.0.0.0`
   - Frontend: certifique-se de definir `HOST=0.0.0.0` antes do `yarn start`

**O sistema abre mas da erro ao carregar dados:**

- O ficheiro `.env` do frontend tem o IP correto no `REACT_APP_BACKEND_URL`?
- O ficheiro `.env` do backend tem o IP correto no `CORS_ORIGINS`?
- Reiniciou ambos os servicos apos alterar os ficheiros `.env`?

**O IP do computador mudou:**

Se o IP muda frequentemente, configure um IP fixo:

Linux:
```bash
sudo nano /etc/netplan/01-netcfg.yaml
```
```yaml
network:
  version: 2
  ethernets:
    eth0:
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```
```bash
sudo netplan apply
```

Windows:
1. Painel de Controle > Rede e Internet > Centro de Rede
2. Clique no adaptador de rede > Propriedades
3. Selecione "Protocolo IP Versao 4 (TCP/IPv4)" > Propriedades
4. Selecione "Usar o seguinte endereco IP"
5. Preencha: IP `192.168.1.100`, Mascara `255.255.255.0`, Gateway `192.168.1.1`
6. DNS: `8.8.8.8` e `8.8.4.4`
7. OK

---

## PARTE 2A - INSTALACAO EM SERVIDOR (LINUX)

> Guia para Ubuntu Server 22.04 LTS - Producao

### Passo 1 de 9: Preparar o servidor

Acesse o servidor via SSH:
```bash
ssh usuario@IP_DO_SERVIDOR
```

Atualizar o sistema:
```bash
sudo apt update
sudo apt upgrade -y
```

---

### Passo 2 de 9: Instalar todas as dependencias

```bash
# Instalar ferramentas essenciais
sudo apt install -y curl wget git build-essential

# Instalar Nginx (servidor web)
sudo apt install -y nginx

# Instalar Certbot (certificado SSL/HTTPS)
sudo apt install -y certbot python3-certbot-nginx

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Yarn e PM2 (gestor de processos)
sudo npm install -g yarn pm2

# Instalar Python 3
sudo apt install -y python3 python3-pip python3-venv

# Instalar MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Iniciar e ativar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Verificar tudo:**
```bash
node --version      # v18.x.x
yarn --version      # 1.22.x
python3 --version   # Python 3.10+
mongosh --eval "db.runCommand({ping:1})"  # { ok: 1 }
nginx -v            # nginx/1.x.x
pm2 --version       # 5.x.x
```

---

### Passo 3 de 9: Criar usuario da aplicacao

```bash
# Criar usuario dedicado (boa pratica de seguranca)
sudo useradd -m -s /bin/bash disciplina

# Definir senha para o usuario
sudo passwd disciplina

# Mudar para o usuario
sudo su - disciplina
```

---

### Passo 4 de 9: Configurar o projeto

```bash
# Clonar o repositorio
git clone <URL_DO_REPOSITORIO> /home/disciplina/app
cd /home/disciplina/app

# --- BACKEND ---
cd backend

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

**Criar o ficheiro .env de producao:**
```bash
# Gerar chave secreta
JWT_KEY=$(openssl rand -hex 64)
echo "Chave gerada: $JWT_KEY"

# Criar ficheiro .env
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=disciplina_fdtl_prod
JWT_SECRET=$JWT_KEY
ADMIN_EMAIL=superadmin@falintil.tl
ADMIN_PASSWORD=SuaSenhaForteAqui2024!
FRONTEND_URL=https://seudominio.com
CORS_ORIGINS=https://seudominio.com
EOF
```

> IMPORTANTE: Substitua `SuaSenhaForteAqui2024!` por uma senha forte.
> IMPORTANTE: Substitua `seudominio.com` pelo dominio real do servidor.

```bash
# --- FRONTEND ---
cd ../frontend

# Instalar dependencias
yarn install

# Criar .env de producao
cat > .env << EOF
REACT_APP_BACKEND_URL=https://seudominio.com
EOF

# Compilar para producao (gera ficheiros estaticos)
yarn build
# Aguarde... Deve mostrar "Compiled successfully" ao final
```

```bash
# Voltar ao usuario root
exit
```

---

### Passo 5 de 9: Configurar o PM2 (Gestor de processos do Backend)

```bash
# Criar ficheiro de configuracao PM2
sudo -u disciplina bash -c 'cat > /home/disciplina/app/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: "disciplina-backend",
    cwd: "/home/disciplina/app/backend",
    script: "venv/bin/uvicorn",
    args: "server:app --host 127.0.0.1 --port 8001",
    interpreter: "none",
    env: {
      NODE_ENV: "production"
    },
    max_restarts: 10,
    restart_delay: 5000
  }]
};
EOF'

# Iniciar o backend
sudo -u disciplina pm2 start /home/disciplina/app/ecosystem.config.js

# Salvar configuracao PM2
sudo -u disciplina pm2 save

# Configurar inicio automatico no boot
sudo -u disciplina pm2 startup systemd
# Copie e execute o comando sugerido pelo PM2

# Verificar se esta a correr
sudo -u disciplina pm2 status
# Deve mostrar: disciplina-backend | online
```

---

### Passo 6 de 9: Configurar o Nginx (Servidor Web)

```bash
# Criar configuracao do site
sudo nano /etc/nginx/sites-available/disciplina
```

Cole o seguinte conteudo (substitua `seudominio.com` pelo seu dominio):

```nginx
server {
    listen 80;
    server_name seudominio.com;

    # Limite de upload de ficheiros (para PDFs)
    client_max_body_size 20M;

    # Frontend - Ficheiros estaticos do React
    location / {
        root /home/disciplina/app/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API - Proxy reverso
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout para uploads grandes
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

Salve o ficheiro (Ctrl+O, Enter, Ctrl+X no nano).

```bash
# Ativar o site
sudo ln -s /etc/nginx/sites-available/disciplina /etc/nginx/sites-enabled/

# Remover site padrao (opcional)
sudo rm -f /etc/nginx/sites-enabled/default

# Testar a configuracao
sudo nginx -t
# Deve mostrar: syntax is ok / test is successful

# Reiniciar Nginx
sudo systemctl reload nginx
```

---

### Passo 7 de 9: Configurar SSL/HTTPS (Certificado gratuito)

```bash
# Obter certificado SSL com Let's Encrypt
sudo certbot --nginx -d seudominio.com

# Siga as instrucoes:
# 1. Insira o seu email
# 2. Aceite os termos
# 3. Escolha se quer redirecionar HTTP para HTTPS (recomendado: Sim)
```

O Certbot configura automaticamente o HTTPS e a renovacao automatica do certificado.

**Verificar renovacao automatica:**
```bash
sudo certbot renew --dry-run
```

---

### Passo 8 de 9: Configurar Firewall

```bash
# Ativar UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verificar regras
sudo ufw status
# Deve mostrar:
# 22/tcp  ALLOW
# Nginx Full  ALLOW
```

---

### Passo 9 de 9: Verificar a instalacao

1. Abra o navegador e acesse: **https://seudominio.com**
2. Verifique se a pagina de login aparece
3. Faca login com as credenciais padrao
4. Verifique se o Dashboard carrega com os dados
5. Teste criar um caso novo
6. Teste o upload de um ficheiro PDF

**Comandos uteis para verificacao:**
```bash
# Ver status do backend
sudo -u disciplina pm2 status

# Ver logs do backend
sudo -u disciplina pm2 logs disciplina-backend

# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar se MongoDB esta a correr
sudo systemctl status mongod

# Reiniciar o backend
sudo -u disciplina pm2 restart disciplina-backend

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## PARTE 2B - INSTALACAO EM SERVIDOR (WINDOWS SERVER)

> Guia para Windows Server 2019/2022

### Passo 1 de 9: Instalar o Node.js

1. Abra o navegador no servidor
2. Acesse: **https://nodejs.org/**
3. Descarregue a versao LTS (.msi)
4. Execute o instalador e siga o assistente com opcoes padrao
5. Reinicie o servidor se solicitado

**Verificar:** Abra o PowerShell como Administrador:
```powershell
node --version
npm install -g yarn
yarn --version
```

---

### Passo 2 de 9: Instalar o Python

1. Acesse: **https://www.python.org/downloads/**
2. Descarregue o Python 3.10 ou superior
3. Execute o instalador
4. **IMPORTANTE:** Marque estas opcoes:
   - [x] "Install for all users"
   - [x] "Add python.exe to PATH"
5. Clique "Install Now"

**Verificar:**
```powershell
python --version
```

---

### Passo 3 de 9: Instalar o MongoDB

1. Acesse: **https://www.mongodb.com/try/download/community**
2. Selecione: Windows, MSI
3. Execute o instalador:
   - Escolha "Complete"
   - **Marque:** "Install MongoDB as a Service"
   - Clique "Install"

**Verificar:**
```powershell
mongosh --eval "db.runCommand({ ping: 1 })"
```

Se nao reconhecer o comando `mongosh`, adicione ao PATH:
```powershell
$env:Path += ";C:\Program Files\MongoDB\Server\6.0\bin"
```

---

### Passo 4 de 9: Instalar o Git

1. Acesse: **https://git-scm.com/download/win**
2. Descarregue e instale com opcoes padrao

---

### Passo 5 de 9: Instalar o IIS e modulos

1. Abra o **Server Manager**
2. Clique em "Add Roles and Features"
3. Avance ate "Server Roles"
4. Marque: **Web Server (IIS)**
5. Avance e clique "Install"

Instalar modulos adicionais:
1. **URL Rewrite Module**: Descarregue de https://www.iis.net/downloads/microsoft/url-rewrite
2. **Application Request Routing (ARR)**: Descarregue de https://www.iis.net/downloads/microsoft/application-request-routing

---

### Passo 6 de 9: Configurar o projeto

Abra o PowerShell como Administrador:

```powershell
# Criar pasta da aplicacao
mkdir C:\Apps\Disciplina
cd C:\Apps\Disciplina

# Clonar repositorio
git clone <URL_DO_REPOSITORIO> .

# --- BACKEND ---
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
.\venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

**Criar ficheiro .env do Backend:**

Abra o Bloco de Notas como Administrador e crie o ficheiro `C:\Apps\Disciplina\backend\.env`:

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=disciplina_fdtl_prod
JWT_SECRET=COLE_A_CHAVE_SECRETA_AQUI
ADMIN_EMAIL=superadmin@falintil.tl
ADMIN_PASSWORD=SuaSenhaForteAqui2024!
FRONTEND_URL=https://seudominio.com
CORS_ORIGINS=https://seudominio.com
```

Para gerar a chave secreta:
```powershell
python -c "import secrets; print(secrets.token_hex(64))"
# Copie o resultado e cole no JWT_SECRET
```

> IMPORTANTE: Substitua `seudominio.com` pelo IP ou dominio do servidor.
> ATENCAO: Salve como tipo "Todos os ficheiros (*.*)" com o nome `.env`

```powershell
# --- FRONTEND ---
cd ..\frontend

# Instalar dependencias
yarn install

# Criar .env
# No Bloco de Notas, crie C:\Apps\Disciplina\frontend\.env com:
# REACT_APP_BACKEND_URL=https://seudominio.com

# Compilar para producao
yarn build
# Aguarde ate aparecer "Compiled successfully"
```

---

### Passo 7 de 9: Criar servico Windows para o Backend

Opcao A - Usando NSSM (recomendado):

1. Descarregue o NSSM: **https://nssm.cc/download**
2. Extraia o ficheiro ZIP
3. Copie `nssm.exe` para `C:\Windows\System32\`

No PowerShell como Administrador:

```powershell
# Instalar o servico
nssm install DisciplinaBackend "C:\Apps\Disciplina\backend\venv\Scripts\python.exe"
nssm set DisciplinaBackend AppParameters "-m uvicorn server:app --host 127.0.0.1 --port 8001"
nssm set DisciplinaBackend AppDirectory "C:\Apps\Disciplina\backend"
nssm set DisciplinaBackend Description "F-FDTL Sistema Disciplinar - Backend API"
nssm set DisciplinaBackend Start SERVICE_AUTO_START

# Iniciar o servico
nssm start DisciplinaBackend

# Verificar
nssm status DisciplinaBackend
# Deve mostrar: SERVICE_RUNNING
```

Opcao B - Usando Task Scheduler (alternativa simples):

1. Abra o Task Scheduler (Agendador de Tarefas)
2. Crie uma nova tarefa:
   - Nome: "Disciplina Backend"
   - Marque: "Run whether user is logged on or not"
   - Trigger: At startup
   - Action: Start a program
     - Program: `C:\Apps\Disciplina\backend\venv\Scripts\python.exe`
     - Arguments: `-m uvicorn server:app --host 127.0.0.1 --port 8001`
     - Start in: `C:\Apps\Disciplina\backend`

---

### Passo 8 de 9: Configurar o IIS

**Criar Site para o Frontend:**

1. Abra o **IIS Manager** (Win+R, digite `inetmgr`)
2. No painel esquerdo, clique direito em "Sites"
3. Clique "Add Website":
   - Site name: `Disciplina`
   - Physical path: `C:\Apps\Disciplina\frontend\build`
   - Binding: Type `http`, Port `80`, Host name: `seudominio.com`
4. Clique OK

**Configurar URL Rewrite (para SPA React funcionar):**

1. Selecione o site "Disciplina"
2. Clique duas vezes em "URL Rewrite"
3. Clique "Add Rule(s)..."
4. Escolha "Blank Rule":
   - Name: `SPA Fallback`
   - Match URL Pattern: `^(?!api)(.*)$`
   - Conditions: Add condition:
     - Input: `{REQUEST_FILENAME}`
     - Type: "Is Not a File"
   - Action: Rewrite, URL: `index.html`
5. Apply

**Configurar Reverse Proxy para a API:**

1. No IIS Manager, selecione o site "Disciplina"
2. Clique duas vezes em "URL Rewrite"
3. Clique "Add Rule(s)..."
4. Escolha "Blank Rule":
   - Name: `API Proxy`
   - Match URL Pattern: `^api/(.*)`
   - Action: Rewrite
   - URL: `http://127.0.0.1:8001/api/{R:1}`
5. Em Server Variables, adicione:
   - Name: `HTTP_X_FORWARDED_FOR`, Value: `{REMOTE_ADDR}`
6. Apply

> NOTA: Se o Reverse Proxy nao funcionar, certifique-se que o modulo ARR esta ativado:
> IIS Manager > Server > Application Request Routing Cache > Server Proxy Settings > Enable proxy

---

### Passo 9 de 9: Verificar e configurar HTTPS

**Opcao A - Certificado proprio:**

1. No IIS Manager, selecione o servidor
2. Clique em "Server Certificates"
3. Importe o seu certificado SSL (.pfx)
4. Edite o binding do site:
   - Add binding: Type `https`, Port `443`
   - Selecione o certificado SSL

**Opcao B - Usando win-acme (Let's Encrypt gratuito):**

1. Descarregue: **https://www.win-acme.com/**
2. Extraia e execute `wacs.exe` como Administrador
3. Siga as instrucoes para obter o certificado

**Configurar Firewall:**

```powershell
# Permitir HTTP e HTTPS
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

**Verificar a instalacao:**

1. Abra o navegador: **https://seudominio.com**
2. Verifique se a pagina de login aparece
3. Faca login com as credenciais padrao
4. Teste todas as funcionalidades

---

## Credenciais Padrao

Apos a instalacao, o sistema cria automaticamente estes utilizadores:

| Funcao            | Email                     | Senha        | Permissoes                    |
|-------------------|---------------------------|--------------|-------------------------------|
| Super Admin       | superadmin@falintil.tl    | Admin@2024   | Acesso total ao sistema       |
| Admin             | admin@falintil.tl         | Demo@2024    | Gestao de casos e utilizadores|
| Pessoal Justica   | justica@falintil.tl       | Demo@2024    | Registrar e processar casos   |
| Pessoal Superior  | superior@falintil.tl      | Demo@2024    | Somente leitura               |

> SEGURANCA: Altere TODAS as senhas padrao apos o primeiro acesso em producao!

---

## Backup e Restauracao

### Linux

```bash
# Fazer backup
mongodump --db disciplina_fdtl_prod --out /backup/$(date +%Y%m%d)

# Restaurar backup
mongorestore --db disciplina_fdtl_prod /backup/20260408/disciplina_fdtl_prod

# Agendar backup diario (crontab)
crontab -e
# Adicione a linha:
# 0 2 * * * mongodump --db disciplina_fdtl_prod --out /backup/$(date +\%Y\%m\%d)
```

### Windows

```powershell
# Fazer backup
mongodump --db disciplina_fdtl_prod --out C:\Backup\MongoDB\%date:~0,4%%date:~5,2%%date:~8,2%

# Restaurar backup
mongorestore --db disciplina_fdtl_prod C:\Backup\MongoDB\20260408\disciplina_fdtl_prod
```

Para agendar backup automatico no Windows:
1. Abra o Task Scheduler
2. Crie uma tarefa diaria
3. Action: `mongodump --db disciplina_fdtl_prod --out C:\Backup\MongoDB\`

---

## Solucao de Problemas

### O sistema nao abre (pagina em branco)

```bash
# Linux - Verificar se os servicos estao a correr
sudo systemctl status mongod          # MongoDB
sudo -u disciplina pm2 status         # Backend
sudo systemctl status nginx           # Nginx
```

```powershell
# Windows - Verificar servicos
Get-Service MongoDB
nssm status DisciplinaBackend
Get-Service W3SVC   # IIS
```

---

### MongoDB nao inicia

```bash
# Linux
sudo systemctl status mongod
sudo journalctl -u mongod --no-pager -n 50

# Verificar permissoes
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo systemctl restart mongod
```

```powershell
# Windows - Reiniciar servico
Restart-Service MongoDB
```

---

### Erro de CORS (bloqueio de acesso)

1. Verifique se `CORS_ORIGINS` no ficheiro `.env` do backend corresponde ao URL do frontend
2. Exemplos:
   - Localhost: `CORS_ORIGINS=http://localhost:3000`
   - Producao: `CORS_ORIGINS=https://seudominio.com`
3. Reinicie o backend apos alterar o .env

---

### Porta ja em uso

```bash
# Linux - Encontrar processo na porta
sudo lsof -i :8001
sudo lsof -i :3000

# Terminar processo
sudo kill -9 <PID>
```

```powershell
# Windows - Encontrar processo na porta
netstat -ano | findstr :8001
netstat -ano | findstr :3000

# Terminar processo
taskkill /PID <numero> /F
```

---

### Backend nao inicia (erro Python)

```bash
# Linux
cd /home/disciplina/app/backend
source venv/bin/activate
pip install -r requirements.txt   # Reinstalar dependencias
uvicorn server:app --host 127.0.0.1 --port 8001  # Testar manualmente
```

```powershell
# Windows
cd C:\Apps\Disciplina\backend
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --host 127.0.0.1 --port 8001
```

---

### Atualizar o sistema (nova versao)

```bash
# Linux
cd /home/disciplina/app
git pull

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
pm2 restart disciplina-backend

# Frontend
cd ../frontend
yarn install
yarn build
sudo systemctl reload nginx
```

```powershell
# Windows
cd C:\Apps\Disciplina
git pull

# Backend
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
nssm restart DisciplinaBackend

# Frontend
cd ..\frontend
yarn install
yarn build
# Reiniciar o site no IIS Manager
```

---

## Suporte

Para suporte tecnico, entre em contacto com:
- **Divisao de Comunicacoes e Sistema de Informacao**
- **F-FDTL - Direcao Justica e Disciplina**
