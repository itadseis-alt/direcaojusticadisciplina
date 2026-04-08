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
- Impressão de documentos

## What's Been Implemented (2026-04-08)

### Backend (FastAPI + MongoDB)
- [x] Autenticação JWT com bcrypt
- [x] CRUD de usuários com permissões por role
- [x] CRUD de casos disciplinares
- [x] Upload de arquivos via Object Storage
- [x] Dashboard com estatísticas agregadas
- [x] Log de atividades
- [x] Exportação CSV/Excel
- [x] Seed de dados demo (15 casos, 4 usuários)

### Frontend (React + Shadcn UI)
- [x] Login page com design Swiss/High-Contrast
- [x] Dashboard com gráficos (Recharts)
- [x] Lista de casos com filtros e paginação
- [x] Formulário de registro de caso
- [x] Visualização detalhada de caso
- [x] Processamento de caso com sanções
- [x] Alteração de status com upload de despacho
- [x] Gestão de usuários
- [x] Página de logs de atividade
- [x] Perfil do usuário com alteração de senha
- [x] Controle de acesso por role no frontend

### Integrações
- [x] Object Storage para arquivos
- [x] JWT para autenticação

## Prioritized Backlog

### P0 (Critical) - DONE
- Login e autenticação
- Dashboard básico
- CRUD de casos
- Permissões por role

### P1 (High) - DONE
- Upload de arquivos
- Processamento de casos com sanções
- Exportação de dados
- Log de atividades

### P2 (Medium) - FUTURE
- Notificações por email quando status mudar
- Backup automático
- Integração com Sistema de Gestão Pessoal (PMS)
- Relatórios avançados personalizados

### P3 (Low) - FUTURE
- Dashboard com mais métricas
- Filtros avançados
- Histórico de alterações por caso
- Modo offline

## Next Tasks
1. Implementar notificações por email (Resend já configurado)
2. Adicionar validações mais rigorosas nos formulários
3. Implementar backup automático
4. Adicionar mais gráficos no dashboard
5. Implementar busca avançada com mais filtros

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
