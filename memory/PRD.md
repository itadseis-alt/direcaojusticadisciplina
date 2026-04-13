# PRD - Sistema de Gestão Disciplinar FALINTIL-FDTL

## Original Problem Statement
Criar um sistema de Gestão Disciplinar completo para a FALINTIL-FDTL baseado no documento PDF fornecido. O sistema deve ter autenticação, diferentes níveis de acesso (super_admin, admin, pessoal_justica, pessoal_superior), gestão de casos disciplinares, relatórios, impressão com logo oficial, notificações por e-mail e na plataforma de sanções a vencer (5 dias antes), movimentação automática de casos com sanção expirada para "Anulado", histórico de membros, timeout de sessão de 4 minutos, e relatórios personalizados por unidade.

## Architecture
- Frontend: React + Tailwind CSS + Shadcn UI
- Backend: FastAPI + MongoDB (Motor Async)
- Auth: JWT with bcrypt, 4-minute inactivity timeout
- Storage: Local filesystem (backend/uploads/)
- Background Tasks: APScheduler for auto-expiration

## Completed Features
- [x] JWT Authentication with 4 roles and 4-minute session timeout
- [x] CRUD for Disciplinary Cases with complex filtering, PDF attachments, status processing
- [x] Custom Dropdowns: Ranks (Posto), Units (Componente/Unidade), Case Types, Sanction Types
- [x] Print Layouts: A4 with F-FDTL Official Logo and custom headers
- [x] Branding: Login page, logos, footers
- [x] Automated Sanction Management: 5-day notifications, auto-move to "Anulado"
- [x] Member History: Search by NIM/Name, historical records (cases + NE)
- [x] Interactive Dashboard: Clickable stat cards with filtered routing
- [x] Reports: Unit-based filtering, CSV/Excel export, charts, temporal evolution (monthly/yearly)
- [x] Pagination on Cases list (10/50/100 per page)
- [x] Admin Notifications: Bell with tabs (Ações + Sanções) for case and NE actions
- [x] Case processed can change to archived/pending while keeping history
- [x] Pessoal Superior access to Reports
- [x] Local file storage (no cloud dependencies)
- [x] CORS configuration for LAN access with multiple IPs
- [x] **Notificações Externas** (External Notifications) - Full CRUD module with:
  - Auto-incrementing number
  - All required fields (Data Entrada, NIM, Nome, Sexo, Posto, Unidade, Qualidade, Tipo Caso, Nu. Nuc, Data Apresenta, Horas, Despacho PDF, Observação, Foto)
  - Dashboard card integration
  - Admin notification integration
  - Member History integration
  - Role-based permissions (SuperAdmin: full, Admin/Justiça: create/edit, Superior: read-only)
  - Password-confirmed edit/delete operations

## Pending / Backlog
- [ ] P1: API Integration with PMS (Personal Management System)
- [ ] P2: Advanced report filters
- [ ] P2: Real email integration (currently simulated)
- [ ] P3: Backend refactoring (split server.py into routers/models/services)

## Key Files
- /app/backend/server.py (all backend logic)
- /app/frontend/src/pages/ (all page components)
- /app/frontend/src/lib/api.js (API layer)
- /app/frontend/src/contexts/AuthContext.js (auth state)
- /app/frontend/src/components/Layout.js (navigation)
- /app/INSTALLATION_GUIDE.md (full installation guide)

## Test Credentials
See /app/memory/test_credentials.md
