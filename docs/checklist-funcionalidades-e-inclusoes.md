# se.monitora - checklist funcional + inclusoes

Data: 2026-04-17
Objetivo: fechar funcionalidades reais por papel (USER, PROFESSIONAL, ADMIN) sem quebrar o fluxo atual.

## Atualizacao desta iteracao (P1 Home + Agenda)
- [x] Home reorganizada por prioridade: proxima sessao, check-in rapido e feed colapsavel.
- [x] Card Daily Insight incluido na Home.
- [x] Agenda com skeleton loading para evitar layout shift.
- [x] Agenda com filtros por foco de especialista (ex.: burnout, nutricao esportiva, postura, sono).
- [x] Minha agenda com links para Google Calendar e Outlook.
- [x] Promocao automatica da fila de espera ao liberar vaga + notificacao in-app para usuario promovido.
- [x] Feed estabilizado com fallback (demo) quando banco estiver vazio ou indisponivel.
- [x] Tratamento de erro separado para Feed vs Proxima Sessao (evita falso positivo de falha no feed).
- [x] Feed com paginacao + rolagem infinita na Home (carrega mais ao rolar).

### Observacao de depuracao local
- Se aparecer "Falha de conexão ao carregar o feed", primeiro reiniciar o `next dev` (processo antigo pode servir rotas desatualizadas).
- Extensoes do navegador podem causar warning de hydration no `<body>` (ex.: atributos injetados no DOM).

## 1) Regra obrigatoria de acesso por papel

Regra de negocio fechada:
- USER acessa somente `/usuario/*`
- PROFESSIONAL acessa somente `/profissional/*`
- ADMIN acessa somente `/admin/*`

### Checklist (bloqueio P0)
- [x] Remover links de troca de papel nas telas:
  - `src/components/layout/backoffice-shell.tsx`
  - `src/components/screens/profile-screen.tsx`
- [x] Manter e reforcar RBAC no `proxy` para todas as rotas protegidas.
- [x] Garantir que em producao o modo demo nao bypassa autorizacao.
- [x] Bloquear APIs por papel (nao apenas telas).
- [x] Criar `POST /api/auth/logout` para encerrar sessao com cookie limpo.
- [x] Definir pagina de `403` para tentativa de acesso indevido.

### Criterio de pronto
- [x] Usuario logado como USER nao abre `/admin` nem `/profissional`.
- [x] Usuario logado como PROFESSIONAL nao abre `/usuario` nem `/admin`.
- [x] Usuario logado como ADMIN nao abre `/usuario` nem `/profissional`.
- [x] Mesmo bloqueio aplicado nas APIs de cada modulo.

---

## 2) Tela ADMIN - o que falta implementar

Estado atual: painel com operacao minima real (usuarios, profissionais e eventos via API), faltando modulos avancados.

### Rotas que precisam existir
- [x] `/admin` (dashboard com dados reais)
- [x] `/admin/usuarios`
- [x] `/admin/profissionais`
- [x] `/admin/eventos`
- [x] `/admin/gamificacao`
- [x] `/admin/notificacoes`
- [x] `/admin/moderacao`
- [x] `/admin/relatorios`
- [x] `/admin/compliance` (consentimento de imagem, politicas)

### Funcionalidades por modulo

#### 2.1 Gestao de usuarios
- [x] Listar usuarios com busca/filtro (nome, email, area, papel, status).
- [x] Criar usuario com validacao de dados.
- [x] Editar perfil e papel (com trilha de auditoria).
- [x] Ativar/inativar usuario.
- [ ] Reset de senha administrativo (fluxo seguro).

#### 2.2 Gestao de profissionais
- [x] Criar/editar profissional e especialidade.
- [ ] Definir agenda base e limites diarios.
- [ ] Ativar/inativar profissional.
- [x] Ver metricas de comparecimento por profissional.

#### 2.3 Gestao de eventos/cultura/festas
- [x] CRUD completo de eventos.
- [x] Publicar/rascunho/cancelar evento.
- [x] Definir capacidade, pontos e janela de inscricao.
- [ ] Painel de presenca/check-in por evento.

#### 2.4 Gamificacao
- [ ] CRUD de regras de pontuacao (sessao, evento, check-in, streak).
- [ ] Versionamento de regra (inicio/fim de vigencia).
- [ ] Simulador de pontuacao para validar impacto antes de publicar.

#### 2.5 Notificacoes em massa
- [ ] Compor campanha por publico (papel, area, periodo).
- [ ] Envio imediato ou agendado.
- [ ] Historico de envios e status (entregue/falha).

#### 2.6 Moderacao
- [ ] Fila de aprovacao de posts/depoimentos.
- [ ] Tratamento de denuncias/report.
- [ ] Acao de ocultar/remover conteudo.

#### 2.7 Relatorios
- [ ] Relatorio por periodo, area e profissional.
- [ ] Engajamento, retencao, presenca, pontuacao.
- [ ] Exportacao CSV.

#### 2.8 Compliance
- [ ] Politica de uso de imagem.
- [ ] Controle de consentimento por usuario.
- [ ] Bloqueio de publicacao sem consentimento valido.

### APIs ADMIN (inclusoes)
- [x] `GET/POST /api/admin/users`
- [x] `GET/PATCH /api/admin/users/[id]` (DELETE pendente)
- [x] `GET/POST /api/admin/professionals`
- [x] `GET/PATCH /api/admin/professionals/[id]` (DELETE pendente)
- [x] `GET/POST /api/admin/events`
- [x] `GET/PATCH /api/admin/events/[id]` (DELETE pendente)
- [ ] `GET/POST/PATCH /api/admin/scoring-rules`
- [ ] `POST /api/admin/notifications/bulk`
- [ ] `GET /api/admin/notifications/history`
- [ ] `GET/PATCH /api/admin/moderation/posts`
- [ ] `GET/PATCH /api/admin/moderation/testimonials`
- [ ] `GET /api/admin/reports`
- [ ] `GET /api/admin/audit-logs`

### Criterio de pronto ADMIN
- [x] Admin opera CRUDs basicos sem mexer em codigo/deploy.
- [ ] Todas as mudancas persistem em banco.
- [x] Todas as operacoes sensiveis ficam em audit log.

---

## 3) Tela PROFISSIONAL - o que falta implementar

Estado atual: fluxo profissional conectado em API (agenda, registros e publicacao de feed).

### Rotas que precisam existir
- [x] `/profissional` (dashboard real)
- [x] `/profissional/agenda`
- [x] `/profissional/pacientes/[id]`
- [x] `/profissional/registros`
- [x] `/profissional/feed`
- [x] `/profissional/feed/novo`

### Funcionalidades por modulo

#### 3.1 Agenda de atendimentos
- [x] Carregar agenda real do profissional autenticado.
- [x] Confirmar presenca do usuario.
- [x] Marcar sessao como concluida/falta/cancelada.
- [x] Motivo de cancelamento registrado (regra de penalidade automatica pendente).

#### 3.2 Historico do paciente
- [x] Visualizar historico completo por paciente.
- [ ] Filtrar por periodo/categoria.
- [x] Exibir metricas anteriores para comparacao.

#### 3.3 Observacoes clinicas e feedback
- [x] Registrar feedback em banco (nao localStorage).
- [x] Registrar entrega/recomendacao/proximo passo.
- [x] Registrar metricas por atendimento.
- [ ] Opcional: anexar documento/plano.

#### 3.4 Postagem no feed com fotos
- [x] Criar post com texto + imagem (URL).
- [ ] Upload real para storage (S3/R2/Vercel Blob).
- [ ] Regras de consentimento de imagem antes de publicar.
- [x] Status de publicacao suportado em modelo (moderacao pendente de interface).

### APIs PROFISSIONAL (inclusoes)
- [x] `GET /api/professional/bookings`
- [x] `PATCH /api/professional/bookings/[id]`
- [x] `GET/POST /api/professional/care-records`
- [x] `GET /api/professional/patients/[id]/care-records`
- [x] `POST /api/professional/feed-posts`
- [x] `GET /api/professional/feed-posts`
- [ ] `POST /api/uploads/presign`

### Criterio de pronto PROFISSIONAL
- [x] Profissional fecha o ciclo completo: agenda -> atendimento -> registro -> publicacao no feed.
- [x] Usuario enxerga no perfil os registros salvos pelo profissional em tempo real.

---

## 4) Dependencias do lado USER para fechar o ciclo

### Home e feed
- [x] Trocar feed mock por API real.
- [x] Curtir/comentar persistindo em banco.
- [ ] Depoimentos reais com regra de aprovacao.

### Agenda
- [x] Reserva real de slot.
- [x] Validacao de conflito de horario.
- [x] Lista de espera real.

### Progresso e acompanhamento
- [x] Salvar peso/humor/habitos no backend.
- [ ] Salvar check diario e upload de feedback no backend.

### Perfil e notificacoes
- [x] Salvar preferencias de notificacao no backend.
- [ ] Carregar mensagens/notificacoes reais.

---

## 5) Inclusoes de banco (Prisma)

### Novos modelos
- [x] `CareRecord`
- [x] `FeedPost`
- [x] `FeedComment`
- [x] `FeedLike`
- [x] `MediaAsset`
- [x] `Testimonial`
- [x] `NotificationPreference`
- [x] `ScoringRule`
- [x] `ContentReport`
- [x] `ImageConsent`
- [x] `AuditLog`

### Ajustes em modelos existentes
- [x] `SessionBooking`: `cancellationReason`, `cancelledAt`, `completedAt`, `pointsAwarded`
- [x] `Event`: `kind` (evento/cultura/festa), `registrationDeadline`, `publishedBy`
- [x] `Notification`: `channel`, `deliveryStatus`, `sentAt`

### Criterio de pronto DB
- [ ] Migracoes aditivas (sem quebrar dados existentes).
- [ ] Constraints e indices para evitar duplicidade e conflito.

---

## 6) Ordem de implementacao (sem quebra)

### Fase A - Seguranca e base tecnica
- [x] Fechar RBAC total (UI + API + proxy).
- [x] Corrigir falhas de lint atuais.
- [x] Hardening de auth (role no cadastro, logout, secret de producao).

### Fase B - Operacao minima (ADMIN + PROFISSIONAL)
- [x] Entregar CRUD de usuarios/profissionais/eventos (admin).
- [x] Entregar agenda + registro clinico real (profissional).
- [x] Entregar leitura do historico no perfil do usuario.

### Fase C - Engajamento real
- [ ] Entregar feed com upload e moderacao.
- [x] Entregar curtida/comentario persistidos.
- [ ] Entregar depoimentos persistidos + moderacao.
- [ ] Entregar notificacoes reais (disparo e entrega).

### Fase D - Gestao avancada
- [ ] Regras de gamificacao editaveis.
- [ ] Relatorios e exportacao.
- [ ] Compliance + auditoria.

---

## 7) Definition of Done por tela

### Admin pronto quando
- [x] Consegue cadastrar/editar entidades principais.
- [ ] Consegue publicar evento/campanha e ver impacto no sistema.
- [ ] Consegue moderar feed e extrair relatorio.

### Profissional pronto quando
- [x] Consegue gerir agenda do dia real.
- [x] Consegue registrar feedback completo por usuario em banco.
- [ ] Consegue postar foto/relato no feed com regra de consentimento.

### Usuario pronto quando
- [x] Consegue reservar/confirmar/cancelar com efeito real.
- [x] Consegue acompanhar historico vindo do profissional.
- [x] Consegue interagir no feed com persistencia.

---

## 8) Itens tecnicos obrigatorios para nao quebrar nada
- [x] Toda feature nova atras de API versionada/estavel.
- [x] Validacao Zod em todas as entradas.
- [x] Autorizacao por papel em todas as rotas de API.
- [ ] Logs de erro + monitoracao basica.
- [ ] Testes de smoke por papel (login e bloqueio de acesso).
- [ ] Testes de fluxo critico: agenda, registro clinico, post no feed, CRUD admin.
