# PRD - Sistema de Gestao Disciplinar FALINTIL-FDTL

## Problema Original
Criar um sistema de Gestao Disciplinar completo para a FALINTIL-FDTL. O sistema deve ter autenticacao, diferentes niveis de acesso (super_admin, admin, pessoal_justica, pessoal_superior), gestao de casos disciplinares, relatorios, impressao com logo oficial, notificacoes por e-mail e na plataforma de sancoes a vencer, movimentacao automatica de casos, historico de membros, relatorios personalizados por unidade, e gestao de "Notificacoes Externas".

## Arquitetura
- **Frontend**: React + Tailwind CSS + Shadcn UI (porta 3000)
- **Backend**: FastAPI + MongoDB (Motor Async) + PyJWT + bcrypt (porta 8001)
- **Storage**: Filesystem local (/uploads)
- **DB**: MongoDB com autenticacao (user: admtl, authSource: admin)

## Funcionalidades Implementadas
- Autenticacao JWT com RBAC (4 roles)
- CRUD completo de casos disciplinares
- Modulo completo de Notificacoes Externas (CRUD, status automatico, upload de arquivos)
- Dashboard interativo com graficos (por tipo, unidade, genero)
- Cards NE no Dashboard (Total, Aguarde, Concluidas) clicaveis com filtro
- Paginacao (10/50/100) em listas de casos e NE
- Evolucao temporal (ano/mes) em relatorios
- Impressao com logo F-FDTL
- Notificacoes de sancoes a vencer (5 dias)
- Notificacoes de apresentacoes NE a vencer
- Notificacoes de acoes admin (criar, editar, processar, arquivar)
- Movimentacao automatica de status (sancao expirada -> anulado, NE -> concluida)
- Historico de membros por NIM
- Armazenamento local de PDFs e fotos
- CORS dinamico para rede local
- Campo "Origem do Anexo" nos modais de processar e arquivar casos
- "Outros" no dropdown de Tipo de Caso
- Campo "Telefone" nas Notificacoes Externas
- Filtro de status na listagem de NE
- Correcao de roteamento de notificacoes (NE vs Casos)
- Protecao por senha na edicao de NE
- MongoDB com autenticacao (user: admtl, senha: @justica#)
- Guia de Instalacao completo com instrucoes MongoDB auth

### Novas funcionalidades (Iteracao 4 - Maio 2026):
- **Alerta casos Em Processo > 30 dias**: Notificacao automatica para Admin e Pessoal Justica
- **Despacho PDF obrigatorio**: Processar caso e arquivar exigem anexo PDF
- **Foto perfil no sidebar**: Exibe foto do utilizador logado no sidebar
- **Penas somatorias**: Total de anos de pena calculado e exibido no historico do membro
- **Notificacoes para Pessoal Justica**: Tabs de sancoes, apresentacoes NE e atrasos
- **Desativar utilizador**: SuperAdmin pode desativar/ativar utilizadores
- **Campos extras no utilizador**: NIM, Sexo, Posto, Componente/Unidade
- **Filtro por Componente/Unidade**: Na lista de casos
- **Posto e Componente na lista de utilizadores**: Colunas adicionadas

## Backlog P1
- Integracao com PMS (Sistema de Gestao de Pessoal)

## Backlog P2
- Integracao real de e-mail (SendGrid/Resend)

## Backlog P3
- Refatoracao do server.py (~1500 linhas -> routers modulares)
