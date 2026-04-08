# PRD - Sistema de Gestão Disciplinar FALINTIL-FDTL

## Original Problem Statement
Criar um sistema de Gestão Disciplinar completo baseado no documento PDF fornecido para FALINTIL-FDTL (Forças de Defesa de Timor-Leste).

## User Personas
1. **Super Admin** - Acesso total ao sistema (CRUD usuários, casos, logs, backup)
2. **Admin** - Pode criar usuários (exceto super_admin), gerenciar casos
3. **Pessoal Justiça** - Pode registrar e editar casos
4. **Pessoal Superior** - Apenas visualização de casos (somente leitura)

## Core Requirements
- Autenticação JWT com 4 níveis de acesso
- Dashboard com estatísticas e gráficos
- Gestão de usuários com permissões por role
- Registro de casos disciplinares com campos completos
- Status de casos: Pendente, Em Processo, Processado, Arquivado, Anulado
- Sanções disciplinares
- Upload de arquivos (fotos, PDFs, despachos)
- Log de atividades
- Exportação para CSV/Excel
- Impressão de documentos em A4

## What's Been Implemented

### 2026-04-08 (Initial Release)
- [x] Autenticação JWT com bcrypt
- [x] CRUD de usuários com permissões por role
- [x] CRUD de casos disciplinares
- [x] Upload de arquivos via Object Storage
- [x] Dashboard com estatísticas agregadas
- [x] Log de atividades
- [x] Exportação CSV/Excel
- [x] Seed de dados demo (15 casos, 4 usuários)

### 2026-04-08 (Update 1)
- [x] Posto atualizado com hierarquia militar completa:
  - Oficiais Generais (General, Almirante, etc.)
  - Oficiais Superiores (Coronel, Major, etc.)
  - Oficiais Capitães e Subalternos
  - Sargentos
  - Praças
- [x] Componente/Unidade atualizado com 15 unidades F-FDTL
- [x] Campo "Telefone do Requerente" adicionado ao formulário
- [x] Campo "Anexar PDF" no formulário de processamento
- [x] Impressão em formato A4 com cabeçalho oficial
- [x] Removido watermark "Made with Emergent"
- [x] Guia de instalação criado (Linux/Windows, localhost/servidor)

## Documentation
- `/app/INSTALLATION_GUIDE.md` - Guia completo de instalação

## Technical Stack
- **Backend**: FastAPI, MongoDB, PyJWT, bcrypt
- **Frontend**: React, Tailwind CSS, Shadcn UI, Recharts
- **Storage**: Emergent Object Storage
- **Auth**: JWT (httpOnly cookies)

## Test Credentials
- Super Admin: superadmin@falintil.tl / Admin@2024
- Admin: admin@falintil.tl / Demo@2024
- Pessoal Justiça: justica@falintil.tl / Demo@2024
- Pessoal Superior: superior@falintil.tl / Demo@2024
