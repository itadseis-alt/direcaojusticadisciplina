# Guia de Instalação - Sistema de Gestão Disciplinar FALINTIL-FDTL

## Requisitos do Sistema

### Software Necessário
- **Node.js** v18.x ou superior
- **Python** 3.10 ou superior
- **MongoDB** 6.0 ou superior
- **Git** (para clonar o repositório)

---

## Parte 1: Instalação em Localhost

### 1.1 Instalação no Linux (Ubuntu/Debian)

#### Passo 1: Instalar dependências do sistema

```bash
# Atualizar repositórios
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Python 3 e pip
sudo apt install -y python3 python3-pip python3-venv

# Instalar MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Iniciar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Instalar Yarn
npm install -g yarn
```

#### Passo 2: Clonar e configurar o projeto

```bash
# Clonar o repositório
git clone <URL_DO_REPOSITORIO> sistema-disciplinar
cd sistema-disciplinar

# Configurar Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Criar arquivo .env do backend
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=disciplina_fdtl
JWT_SECRET=$(openssl rand -hex 32)
ADMIN_EMAIL=superadmin@falintil.tl
ADMIN_PASSWORD=Admin@2024
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
EOF

# Configurar Frontend
cd ../frontend
yarn install

# Criar arquivo .env do frontend
cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
```

#### Passo 3: Iniciar a aplicação

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 - Frontend
cd frontend
yarn start
```

#### Passo 4: Acessar o sistema
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/api

---

### 1.2 Instalação no Windows

#### Passo 1: Instalar dependências

1. **Node.js**: Baixar e instalar de https://nodejs.org/ (versão LTS)

2. **Python 3.10+**: Baixar de https://www.python.org/downloads/
   - Durante instalação, marcar "Add Python to PATH"

3. **MongoDB**: Baixar de https://www.mongodb.com/try/download/community
   - Instalar como serviço Windows
   - Ou usar MongoDB Atlas (cloud)

4. **Git**: Baixar de https://git-scm.com/download/win

5. **Yarn**: Abrir PowerShell como Administrador:
```powershell
npm install -g yarn
```

#### Passo 2: Clonar e configurar o projeto

```powershell
# Clonar o repositório
git clone <URL_DO_REPOSITORIO> sistema-disciplinar
cd sistema-disciplinar

# Configurar Backend
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Criar arquivo .env do backend (usar Notepad ou outro editor)
# Conteúdo:
# MONGO_URL=mongodb://localhost:27017
# DB_NAME=disciplina_fdtl
# JWT_SECRET=<gerar_chave_aleatoria_64_caracteres>
# ADMIN_EMAIL=superadmin@falintil.tl
# ADMIN_PASSWORD=Admin@2024
# FRONTEND_URL=http://localhost:3000
# CORS_ORIGINS=http://localhost:3000

# Configurar Frontend
cd ..\frontend
yarn install

# Criar arquivo .env do frontend
# Conteúdo:
# REACT_APP_BACKEND_URL=http://localhost:8001
```

#### Passo 3: Iniciar a aplicação

```powershell
# Terminal 1 (PowerShell) - Backend
cd backend
.\venv\Scripts\activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 (PowerShell) - Frontend
cd frontend
yarn start
```

---

## Parte 2: Instalação em Servidor de Produção

### 2.1 Servidor Linux (Ubuntu 22.04 LTS)

#### Passo 1: Preparar o servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y nginx certbot python3-certbot-nginx

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Python
sudo apt install -y python3 python3-pip python3-venv

# Instalar MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Instalar Yarn e PM2
npm install -g yarn pm2
```

#### Passo 2: Configurar o projeto

```bash
# Criar usuário para a aplicação
sudo useradd -m -s /bin/bash disciplina
sudo su - disciplina

# Clonar repositório
git clone <URL_DO_REPOSITORIO> /home/disciplina/app
cd /home/disciplina/app

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Criar .env de produção
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=disciplina_fdtl_prod
JWT_SECRET=$(openssl rand -hex 64)
ADMIN_EMAIL=superadmin@falintil.tl
ADMIN_PASSWORD=<SENHA_FORTE_AQUI>
FRONTEND_URL=https://seudominio.com
CORS_ORIGINS=https://seudominio.com
EOF

# Frontend
cd ../frontend
yarn install
yarn build

# Voltar ao usuário root
exit
```

#### Passo 3: Configurar PM2 para o Backend

```bash
# Criar arquivo de configuração PM2
sudo -u disciplina cat > /home/disciplina/app/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'disciplina-backend',
    cwd: '/home/disciplina/app/backend',
    script: 'venv/bin/uvicorn',
    args: 'server:app --host 127.0.0.1 --port 8001',
    interpreter: 'none',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Iniciar com PM2
sudo -u disciplina pm2 start /home/disciplina/app/ecosystem.config.js
sudo -u disciplina pm2 save
sudo -u disciplina pm2 startup
```

#### Passo 4: Configurar Nginx

```bash
# Criar configuração Nginx
sudo cat > /etc/nginx/sites-available/disciplina << EOF
server {
    listen 80;
    server_name seudominio.com;

    # Frontend (arquivos estáticos do React)
    location / {
        root /home/disciplina/app/frontend/build;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Ativar site
sudo ln -s /etc/nginx/sites-available/disciplina /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Passo 5: Configurar SSL (HTTPS)

```bash
# Instalar certificado SSL com Let's Encrypt
sudo certbot --nginx -d seudominio.com

# O Certbot irá configurar automaticamente o HTTPS
# Renovação automática já está configurada
```

#### Passo 6: Configurar Firewall

```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

### 2.2 Servidor Windows Server

#### Passo 1: Instalar dependências

1. **IIS (Internet Information Services)**:
   - Server Manager → Add Roles and Features → Web Server (IIS)

2. **Node.js**: https://nodejs.org/ (LTS)

3. **Python 3.10+**: https://www.python.org/downloads/
   - Marcar "Install for all users"
   - Marcar "Add Python to PATH"

4. **MongoDB**: https://www.mongodb.com/try/download/community
   - Instalar como Windows Service

5. **URL Rewrite Module para IIS**: https://www.iis.net/downloads/microsoft/url-rewrite

6. **iisnode**: https://github.com/Azure/iisnode/releases

#### Passo 2: Configurar o projeto

```powershell
# Criar pasta para a aplicação
mkdir C:\Apps\Disciplina
cd C:\Apps\Disciplina

# Clonar repositório
git clone <URL_DO_REPOSITORIO> .

# Backend
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Criar arquivo .env
# Usar Notepad para criar C:\Apps\Disciplina\backend\.env

# Frontend
cd ..\frontend
yarn install
yarn build
```

#### Passo 3: Configurar IIS

1. **Criar Site para Frontend**:
   - IIS Manager → Sites → Add Website
   - Site name: Disciplina-Frontend
   - Physical path: C:\Apps\Disciplina\frontend\build
   - Port: 80

2. **Configurar URL Rewrite** (para SPA):
   - Selecionar o site → URL Rewrite → Add Rule
   - Blank Rule:
     - Name: SPA Fallback
     - Pattern: ^(?!api).*
     - Action: Rewrite to index.html

3. **Configurar Reverse Proxy para API**:
   - Add Rule → Reverse Proxy
   - Server: localhost:8001
   - Pattern: ^api/(.*)

#### Passo 4: Criar Serviço Windows para Backend

```powershell
# Instalar NSSM (Non-Sucking Service Manager)
# Baixar de https://nssm.cc/download

# Criar serviço
nssm install DisciplinaBackend "C:\Apps\Disciplina\backend\venv\Scripts\python.exe"
nssm set DisciplinaBackend AppParameters "-m uvicorn server:app --host 127.0.0.1 --port 8001"
nssm set DisciplinaBackend AppDirectory "C:\Apps\Disciplina\backend"
nssm start DisciplinaBackend
```

---

## Credenciais Padrão

Após a instalação, use estas credenciais para acessar:

| Usuário | Email | Senha | Permissão |
|---------|-------|-------|-----------|
| Super Admin | superadmin@falintil.tl | Admin@2024 | Acesso total |
| Admin | admin@falintil.tl | Demo@2024 | Gestão |
| Pessoal Justiça | justica@falintil.tl | Demo@2024 | Registrar casos |
| Pessoal Superior | superior@falintil.tl | Demo@2024 | Somente leitura |

**⚠️ IMPORTANTE**: Altere as senhas padrão após o primeiro acesso!

---

## Backup do Banco de Dados

### Linux
```bash
# Backup
mongodump --db disciplina_fdtl_prod --out /backup/$(date +%Y%m%d)

# Restaurar
mongorestore --db disciplina_fdtl_prod /backup/20240408/disciplina_fdtl_prod
```

### Windows
```powershell
# Backup
mongodump --db disciplina_fdtl_prod --out C:\Backup\%date:~0,4%%date:~5,2%%date:~8,2%

# Restaurar
mongorestore --db disciplina_fdtl_prod C:\Backup\20240408\disciplina_fdtl_prod
```

---

## Solução de Problemas

### MongoDB não inicia
```bash
# Linux
sudo systemctl status mongod
sudo journalctl -u mongod

# Windows - Verificar Serviços Windows
services.msc
```

### Erro de CORS
- Verificar se CORS_ORIGINS no .env está correto
- Reiniciar o backend após alterar .env

### Porta já em uso
```bash
# Linux - Verificar portas
sudo lsof -i :8001
sudo lsof -i :3000

# Windows
netstat -ano | findstr :8001
```

---

## Suporte

Para suporte técnico, entre em contato com a equipe de TI da F-FDTL.
