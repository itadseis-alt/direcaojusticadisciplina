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
- [x] Posto atualizado com hierarquia militar completa
- [x] Componente/Unidade atualizado com 15 unidades F-FDTL
- [x] Campo "Telefone do Requerente" adicionado ao formulário
- [x] Campo "Anexar PDF" no formulário de processamento
- [x] Impressão em formato A4 com cabeçalho oficial

### 2026-04-08 (Update 2)
- [x] Logo oficial F-FDTL na página de login e sidebar
- [x] Footer "F-FDTL: Divisão de Comunicações e Sistema de Informação @2026"
- [x] Session timeout de 4 minutos de inatividade
- [x] Página de Relatórios por Unidade com gráficos
- [x] Notificações por email quando status do caso muda

### 2026-04-08 (Update 3) - Sistema de Notificações e Histórico
- [x] **Notificações de Sanções a Vencer**: 5 dias antes da data_fim, o sistema notifica todos os usuários
- [x] **Sino de Notificações** no header mostrando sanções prestes a terminar
- [x] **Mudança Automática de Status**: Quando data_fim chega, caso muda de "Processado" para "Anulado" automaticamente
- [x] **Verificação Periódica**: Sistema verifica sanções expiradas a cada hora
- [x] **Página de Histórico de Membros**: Buscar membro por nome ou NIM e ver todo o histórico de casos
- [x] **Histórico Limpo**: Se membro não tem casos, sistema indica "Histórico Limpo"
- [x] **Resumo por Membro**: Total de casos, processados, pendentes, etc.

## Documentation
- `/app/INSTALLATION_GUIDE.md` - Guia completo de instalação

## Technical Stack
- **Backend**: FastAPI, MongoDB, PyJWT, bcrypt, Resend (email)
- **Frontend**: React, Tailwind CSS, Shadcn UI, Recharts
- **Storage**: Emergent Object Storage
- **Auth**: JWT (httpOnly cookies) com timeout de 4 min

## Environment Variables
### Backend (.env)
- MONGO_URL
- DB_NAME
- JWT_SECRET
- ADMIN_EMAIL
- ADMIN_PASSWORD
- FRONTEND_URL
- RESEND_API_KEY (opcional, para notificações email)
- EMAIL_FROM

## Test Credentials
- Super Admin: superadmin@falintil.tl / Admin@2024
- Admin: admin@falintil.tl / Demo@2024
- Pessoal Justiça: justica@falintil.tl / Demo@2024
- Pessoal Superior: superior@falintil.tl / Demo@2024

## Automações Implementadas
1. **Verificação de Sanções Expiradas**: A cada hora, sistema verifica casos processados com data_fim <= hoje e move para "Anulado"
2. **Notificações de 5 dias**: Todos os casos com sanções terminando em até 5 dias aparecem no sino de notificações
3. **Log Automático**: Todas as alterações de status são registradas no log de atividades

## Integration Ready
O sistema está preparado para integração com:
- PMS (Personal Management System) - via API REST
- Outros sistemas militares - via endpoints /api/
