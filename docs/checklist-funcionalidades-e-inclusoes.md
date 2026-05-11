# dr.monitora Bem-Estar - diagnostico funcional e backlog modular

Data: 2026-05-11
Escopo desta revisao: Modulo 0 - documentacao, diagnostico funcional e ordem segura de implementacao.

Este documento compara o que existe no codigo atual com os pedidos levantados na reuniao da plataforma de Bem-Estar. Ele nao representa implementacao tecnica ainda. A finalidade e deixar claro o que ja esta ligado, o que esta parcial e o que precisa ser aprovado antes de mexer em banco, API ou tela.

## Legenda

- `Implementado`: existe no codigo, tela/API/modelo e fluxo basico estao ligados.
- `Parcial`: existe alguma parte, mas ainda falta regra, tela, persistencia completa ou acabamento.
- `Falta regra`: a decisao de produto/compliance ainda precisa ser fechada.
- `Falta banco`: precisa alterar Prisma/Neon.
- `Falta API`: precisa criar ou alterar rota de API.
- `Falta tela`: precisa criar ou alterar interface.
- `Fora deste modulo`: nao sera feito agora.

## Estado geral do projeto

- Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma e PostgreSQL.
- Deploy: Vercel.
- Banco: Neon via `DATABASE_URL` e `DIRECT_URL`.
- Repositorio remoto: `https://github.com/felipemaiocch/bem-estar.git`.
- URL publica atual: `https://bem-estar-self.vercel.app/`.
- RBAC atual: `USER`, `PROFESSIONAL`, `ADMIN`.
- Rotas protegidas por papel em `src/proxy.ts`.
- Prisma atual ja possui modelos de usuarios, profissionais, agenda, eventos, feed, comentarios, curtidas, progresso, notificacoes, regras de pontuacao, consentimento de imagem, auditoria, cards e notas internas.

## Rotas e superficies existentes

### Usuario

- `/usuario` - home com cards, proxima sessao, check-in rapido, ranking rapido e feed. `Parcial`
- `/usuario/agenda` - agenda com slots, filtros, reserva e lista de espera. `Parcial`
- `/usuario/agenda-dr` - agenda dr/eventos especiais. `Parcial`
- `/usuario/progresso` - historico de bem-estar, peso, humor/habitos. `Parcial`
- `/usuario/ranking` - ranking geral por score. `Parcial`
- `/usuario/perfil` - perfil e registros vindos dos profissionais. `Parcial`
- `/usuario/acompanhamento` - acompanhamento e feedback. `Parcial`
- `/usuario/configuracoes` - preferencias, senha e avatar. `Parcial`
- `/usuario/saude-bem-estar`, `/usuario/cultura`, `/usuario/eventos`, `/usuario/festas`. `Parcial`

### Profissional

- `/profissional` - dashboard profissional. `Parcial`
- `/profissional/agenda` - agenda do profissional. `Parcial`
- `/profissional/registros` - registros de atendimento. `Parcial`
- `/profissional/feed` e `/profissional/feed/novo` - publicacao de conteudo/feed. `Parcial`
- `/profissional/pacientes/[id]` - historico de paciente. `Parcial`

### Admin

- `/admin` - dashboard administrativo. `Parcial`
- `/admin/usuarios` - gestao de usuarios. `Parcial`
- `/admin/profissionais` - gestao de profissionais. `Parcial`
- `/admin/eventos` - gestao de eventos. `Parcial`
- `/admin/gamificacao` - regras de pontuacao. `Parcial`
- `/admin/moderacao` - moderacao/feed e chave de postagem. `Parcial`
- `/admin/notificacoes` - tela administrativa de notificacoes. `Parcial`
- `/admin/relatorios` - relatorios. `Parcial`
- `/admin/compliance` - compliance/consentimentos. `Parcial`
- `/admin/conteudos` - area de conteudos/cards. `Parcial`

## Modulo 0 - Diagnostico e backlog tecnico

Status: `Implementado nesta revisao documental`.

Itens cobertos:

- Revisar checklist antigo contra codigo atual.
- Atualizar rotas, APIs e modelos que ja existem.
- Separar backlog por modulo funcional.
- Marcar pendencias por regra, banco, API e tela.
- Definir ordem de implementacao segura com commits pequenos.

Nao entra neste modulo:

- Alteracao de schema Prisma.
- Mudanca em API.
- Mudanca em interface.
- Deploy.
- Migracao no Neon.

Commit sugerido:

- `docs: update wellness roadmap and implementation modules`

## Modulo 1 - Usuarios, aprovacao e grupos

Objetivo: controlar quem entra, quem precisa aprovacao e quem pertence a turmas/grupos especificos.

### Estado atual

- Login e cadastro existem. `Implementado`
- Admin cria, edita, ativa/inativa e exclui usuarios. `Parcial`
- RBAC por papel existe em tela e API. `Implementado`
- Cadastro publico cria usuario `USER` diretamente quando fora do modo demo. `Implementado`
- Nao existe status de cadastro pendente/aprovado/rejeitado. `Falta banco`, `Falta API`, `Falta tela`
- Nao existe convite ou cadastro restrito por turma. `Falta regra`, `Falta banco`, `Falta API`, `Falta tela`
- Nao existe modelo de grupo/turma/tag de participante. `Falta banco`, `Falta API`, `Falta tela`

### Entraria no modulo

- Criar status de cadastro: `PENDING`, `APPROVED`, `REJECTED`.
- Criar fluxo admin para aprovar/rejeitar cadastro.
- Definir se cadastro publico fica aberto ou vira solicitacao pendente.
- Criar base para grupos/tags: Ingles, Maisa, Clube do Livro, turma fechada, profissional por categoria.
- Preparar vinculo usuario-grupo sem ainda implementar todos os fluxos de aula.

### Decisoes antes de implementar

- Usuario externo pode se cadastrar sozinho ou sempre precisa aprovacao?
- Quais dominios/emails podem entrar sem aprovacao?
- Turmas fechadas usam convite, aprovacao manual ou lista cadastrada pelo admin?

Commit sugerido:

- `feat: add user approval and group foundation`

## Modulo 2 - Compliance e aceites

Objetivo: garantir aceite obrigatorio antes de uso sensivel da plataforma.

### Estado atual

- Existe modelo `ImageConsent`. `Parcial`
- Existe rota/tela admin de compliance. `Parcial`
- Nao existe termo obrigatorio no primeiro login. `Falta banco`, `Falta API`, `Falta tela`
- Nao existe aceite geral de liberalidade/nao substituicao medica. `Falta regra`, `Falta banco`, `Falta tela`
- Nao existe bloqueio por falta de aceite. `Falta API`, `Falta tela`
- Consentimento de imagem ainda nao bloqueia publicacao. `Parcial`

### Entraria no modulo

- Criar aceite geral de termos de uso.
- Criar aceite de imagem/publicacao.
- Registrar data, versao do termo e origem do aceite.
- Bloquear acesso ou publicacao quando aceite obrigatorio estiver pendente.
- Texto base: beneficio por mera liberalidade da empresa e nao substitui atendimento medico.

### Decisoes antes de implementar

- Bloqueio sera total no primeiro login ou so para feed/imagem?
- Quem pode ver historico de aceite?
- Termo tera versao unica ou versionamento por atualizacao?

Commit sugerido:

- `feat: add compliance acceptance flow`

## Modulo 3 - Gamificacao: pontos, moedas e auditoria

Objetivo: separar ranking de saldo de troca.

### Estado atual

- `User.score` existe e alimenta ranking. `Implementado`
- `ScoringRule` existe no Prisma. `Implementado`
- Admin lista/cria/ativa/inativa regra de pontuacao. `Parcial`
- API de missao incrementa score diretamente. `Parcial`
- Pontos e moedas ainda nao estao separados. `Falta banco`, `Falta API`, `Falta tela`
- Nao existe carteira/saldo de moedas. `Falta banco`, `Falta API`, `Falta tela`
- Nao existe ledger historico de ganhos/gastos. `Falta banco`, `Falta API`

### Entraria no modulo

- Manter pontos acumulados para ranking.
- Criar moedas/saldo separado para lojinha/trocas futuras.
- Criar historico de transacoes de pontuacao/moeda.
- Garantir que gastar moedas nao reduza posicao no ranking.
- Preparar regras para login, check-in, streak, evento/aula, campanha e feed.

### Decisoes antes de implementar

- Moeda tera nome proprio?
- Quais acoes geram ponto, moeda ou ambos?
- Gastos de moeda ja terao lojinha agora ou apenas estrutura?

Commit sugerido:

- `feat: split points and wallet balance`

## Modulo 4 - Ranking e privacidade

Objetivo: reduzir exposicao e permitir anonimato.

### Estado atual

- Ranking existe em `/usuario/ranking`. `Parcial`
- API `/api/user/ranking` lista usuarios ativos por `score`. `Parcial`
- Nao existe flag de aparecer publicamente no ranking. `Falta banco`, `Falta API`, `Falta tela`
- Nao existe anonimizar/censurar usuario. `Falta API`, `Falta tela`
- Ranking por categoria ainda nao esta real. `Parcial`

### Entraria no modulo

- Campo de privacidade no usuario: deseja aparecer publicamente no ranking.
- API retorna nome real so quando permitido ou quando for o proprio usuario.
- Tela exibe anonimo/censurado para quem nao quiser aparecer.
- Avaliar top 3/top 10 + posicao individual como padrao mais seguro.

### Decisoes antes de implementar

- Ranking geral completo continua visivel?
- Quem nao autorizar aparece como `Usuario #23`, `*****` ou nao aparece?
- Admin pode ver nomes reais em relatorio interno?

Commit sugerido:

- `feat: add ranking privacy controls`

## Modulo 5 - Check-in diario, streak e progresso

Objetivo: fechar rotina de check-in com trava, historico e pontuacao.

### Estado atual

- `WellnessEntry` salva peso, humor, habitos e notas. `Parcial`
- API `/api/user/progress/wellness` lista e cria entradas. `Parcial`
- Home possui check-in rapido. `Parcial`
- Admin possui estatistica de humor recente. `Parcial`
- Nao existe trava formal de um check-in por periodo. `Falta regra`, `Falta API`
- Nao existe streak real de 5 dias com bonus. `Falta banco`, `Falta API`, `Falta tela`
- Medida de burnout por quantidade de pessoas ainda nao esta fechada. `Falta regra`, `Falta API`, `Falta tela`

### Entraria no modulo

- Check-in diario com janela de validade.
- Pontuacao/moeda por check-in.
- Bonus por 5 dias seguidos.
- Historico visual no progresso.
- Metricas admin por humor, energia, cansaco e sinais criticos.
- Mostrar burnout por quantidade de pessoas, nao somente percentual.

### Decisoes antes de implementar

- Check-in vale por dia calendario ou janela de 24 horas?
- Quais perguntas entram: humor, energia, cansaco, sono, presenca?
- Qual criterio dispara alerta critico?

Commit sugerido:

- `feat: add daily checkin streak scoring`

## Modulo 6 - Turmas, eventos fechados e presenca

Objetivo: controlar turmas fechadas, presenca e pontuacao por aula/evento.

### Estado atual

- `Event` e `EventAttendance` existem. `Implementado`
- Usuario confirma participacao em evento. `Parcial`
- Eventos possuem capacidade e pontos. `Parcial`
- Nao existe grupo/turma com participantes selecionados. `Falta banco`, `Falta API`, `Falta tela`
- Nao existe regra para Ingles, Maisa ou Clube do Livro. `Falta regra`, `Falta banco`, `Falta tela`
- Nao existe painel completo de presenca/check-in por evento. `Falta tela`, `Falta API`
- Penalidade por falta ainda nao esta implementada. `Falta regra`, `Falta API`

### Entraria no modulo

- Criar modelo de turma/grupo e participantes.
- Vincular evento/aula a turma.
- Mostrar detalhes internos apenas para participantes.
- Mostrar "em breve" ou "proxima turma em X meses" para quem esta fora.
- Check-in/presenca por evento/aula.
- Pontuar presenca e preparar penalidade por falta se aprovada.

### Decisoes antes de implementar

- Faltas devem perder pontos/moedas ou apenas nao pontuar?
- Quem confirma presenca: usuario, profissional ou admin?
- Turmas fechadas podem ter lista de espera?

Commit sugerido:

- `feat: add cohorts and event attendance rules`

## Modulo 7 - Feed e moderacao

Objetivo: controlar publicacoes sem matar campanhas.

### Estado atual

- Feed real existe com `FeedPost`, `FeedComment` e `FeedLike`. `Implementado`
- Usuario pode listar, publicar, editar e excluir seus posts. `Parcial`
- Profissional pode criar/listar/editar/excluir posts. `Parcial`
- Admin lista posts recentes e pode excluir. `Parcial`
- `PlatformSettings.allowUserPosting` liga/desliga postagem de usuario. `Parcial`
- `ContentStatus` suporta `PENDING`, `APPROVED`, `REJECTED`, `PUBLISHED`. `Parcial`
- Posts atualmente tendem a nascer publicados. `Parcial`
- Nao existe fila real de aprovacao/rejeicao antes de publicar. `Falta API`, `Falta tela`
- Denuncia/report existe como modelo, mas fluxo ainda nao esta fechado. `Parcial`

### Entraria no modulo

- Definir modo inicial: pre-moderacao, pos-moderacao ou feed por campanha.
- Criar chave admin de moderacao ativa.
- Criar posts como `PENDING` quando pre-moderacao estiver ativa.
- Fila admin para aprovar/rejeitar/remover.
- Preservar chave para bloquear publicacao de usuarios.

### Decisoes antes de implementar

- Profissional publica direto ou tambem passa por admin?
- Usuario pode postar fora de campanha?
- Comentarios tambem precisam moderacao?

Commit sugerido:

- `feat: add feed moderation workflow`

## Modulo 8 - Conteudos, blog e publicacoes dos especialistas

Objetivo: separar feed social de conteudo editorial.

### Estado atual

- Existe rota admin `/admin/conteudos`. `Parcial`
- Existem `EngagementCard` e cards por categoria. `Parcial`
- Feed pode carregar imagem/link via URL no post. `Parcial`
- Nao existe modelo editorial claro de artigo/dica/blog. `Falta banco`, `Falta API`, `Falta tela`
- Decisao da reuniao: profissionais nao publicam diretamente; admin/equipe publica. `Falta regra aplicada`

### Entraria no modulo

- Criar area de conteudos/dicas/artigos separada do feed.
- Admin publica conteudos dos especialistas.
- Conteudo com titulo, descricao, observacoes, imagem, link externo e categoria.
- Exibir conteudo no usuario conforme categoria/grupo.

### Decisoes antes de implementar

- Conteudo sera publico para todos ou filtrado por grupo/turma?
- Profissional apenas sugere rascunho ou nao acessa essa area?
- Comentarios em conteudo editorial serao permitidos?

Commit sugerido:

- `feat: add specialist content area`

## Modulo 9 - Perfil dos profissionais e avaliacoes

Objetivo: tornar perfis mais especificos por area de atuacao.

### Estado atual

- `ProfessionalProfile` possui especialidade, registro e metricas basicas. `Parcial`
- Admin cria/edita profissional. `Parcial`
- Agenda vincula profissional a sessoes. `Parcial`
- `Testimonial` existe com rating, mas fluxo completo nao esta ligado. `Parcial`
- Nao existem tags/categorias multiplas por profissional. `Falta banco`, `Falta API`, `Falta tela`
- Nao existem campos especificos por categoria profissional. `Falta regra`, `Falta banco`, `Falta tela`

### Entraria no modulo

- Tags/categorias: nutricao, treino, ingles, defesa pessoal, clube do livro, etc.
- Campos de perfil por area: materiais, agenda, links, observacoes.
- Avaliacao por estrelas/nota/sentimento.
- Relacionar avaliacao ao profissional e possivelmente ao atendimento/evento.

### Decisoes antes de implementar

- Avaliacao sera anonima?
- Profissional pode ver suas avaliacoes?
- Admin aprova depoimento antes de ficar publico?

Commit sugerido:

- `feat: expand professional profiles and ratings`

## Modulo 10 - Links, embeds e materiais externos

Objetivo: priorizar links/embeds em vez de upload pesado.

### Estado atual

- Posts e cards aceitam imagem/link por URL em alguns pontos. `Parcial`
- `MediaAsset` existe, mas upload real ainda nao esta fechado. `Parcial`
- Nao existe whitelist/sanitizacao especifica para iframe/embed. `Falta regra`, `Falta API`, `Falta tela`
- Caso Camila ainda nao tem tela/card dedicada com link/embed. `Falta tela`

### Entraria no modulo

- Campo de link externo em conteudos/cards/profissionais.
- Suporte controlado a embed/iframe com dominios permitidos.
- Card/tela para Camila e composicao corporal.
- Evitar upload pesado de PDF no inicio.

### Decisoes antes de implementar

- Quais dominios podem ser embutidos?
- Links abrem dentro da plataforma ou nova aba?
- Materiais precisam aceite/termo antes de acesso?

Commit sugerido:

- `feat: add external resources and embeds`

## Modulo 11 - Painel admin e relatorios

Objetivo: consolidar gestao e leitura operacional.

### Estado atual

- Admin dashboard existe com metricas e CRUDs basicos. `Parcial`
- Mapa de humor recente existe. `Parcial`
- Usuarios, profissionais, eventos, cards, agenda config e alerta global possuem APIs. `Parcial`
- Relatorios filtrados/exportacao ainda nao existem. `Falta API`, `Falta tela`
- Alertas criticos ainda nao existem. `Falta regra`, `Falta API`, `Falta tela`
- Filtros por equipe/setor/lider ainda nao existem. `Falta banco`, `Falta API`, `Falta tela`

### Entraria no modulo

- Dashboard com usuarios, engajamento, check-ins, humor, pontuacao, avaliacoes e profissionais.
- Alertas de baixa frequencia e situacao emocional critica.
- Relatorios por periodo, area e profissional.
- Preparar filtros por equipe/setor/lider para etapa futura.

### Decisoes antes de implementar

- Quem pode ver dados sensiveis de humor?
- Alerta critico vai para admin, RH, lideranca ou profissional?
- Exportacao CSV e obrigatoria agora?

Commit sugerido:

- `feat: improve admin wellness reporting`

## Modulo 12 - Painel profissional e comunicacao interna

Objetivo: fechar rotina de atendimento e colaboracao entre especialistas.

### Estado atual

- Agenda do profissional existe. `Parcial`
- Historico do paciente existe. `Parcial`
- Registro de atendimento existe em `CareRecord`. `Implementado`
- `TeamNote` existe no Prisma. `Parcial`
- Comunicacao interna entre profissionais ainda nao esta completa na interface. `Falta tela`, `Falta API`
- Anexos/documentos por atendimento ainda nao existem. `Falta banco`, `Falta API`, `Falta tela`

### Entraria no modulo

- Melhorar agenda, historico, registros e observacoes.
- Mural/notas internas entre profissionais.
- Notas restritas ao time profissional/admin quando necessario.
- Metricas de presenca e atendimentos.

### Decisoes antes de implementar

- Usuario final pode ver quais notas?
- Profissional pode escrever para outro profissional especifico?
- Precisa anexar PDF/plano ou apenas link?

Commit sugerido:

- `feat: improve professional workspace`

## Modulo 13 - Notificacoes

Objetivo: avisos operacionais antes de push real.

### Estado atual

- `Notification` existe com canal e status de entrega. `Parcial`
- Preferencias de notificacao existem e persistem. `Implementado`
- Notificacao in-app de vaga liberada aparece em fluxo de agenda/lista de espera. `Parcial`
- Tela admin de notificacoes existe. `Parcial`
- Disparo em massa e historico de envios ainda nao existem. `Falta API`, `Falta tela`
- Push real ainda nao existe. `Falta regra`, `Falta API`, `Falta tela`

### Entraria no modulo

- Priorizar notificacoes in-app.
- Avisos de vaga, proxima turma, campanha, check-in e evento.
- Historico basico de envio.
- Push web/app fica para etapa posterior apos base operacional.

### Decisoes antes de implementar

- Notificacao em massa podera filtrar por grupo/turma?
- Usuario pode desligar todos os tipos?
- Push real sera PWA/web push ou app nativo no futuro?

Commit sugerido:

- `feat: add in-app notification workflows`

## Modulo 14 - Revisao tecnica final por ciclo

Objetivo: manter a plataforma hospedada estavel.

Checklist apos cada modulo funcional:

- Rodar `npm run lint`.
- Rodar `npm run build`.
- Conferir login e bloqueio por papel.
- Conferir APIs protegidas.
- Testar fluxo principal afetado.
- Revisar `git diff`.
- Fazer commit pequeno.
- Fazer push somente depois de validado localmente.
- Conferir deploy/preview da Vercel antes de seguir para o proximo modulo.

## Ordem recomendada de implementacao

1. Modulo 0 - Diagnostico e backlog tecnico.
2. Modulo 1 - Usuarios, aprovacao e grupos.
3. Modulo 2 - Compliance e aceites.
4. Modulo 3 - Gamificacao: pontos, moedas e auditoria.
5. Modulo 4 - Ranking e privacidade.
6. Modulo 5 - Check-in diario, streak e progresso.
7. Modulo 6 - Turmas, eventos fechados e presenca.
8. Modulo 7 - Feed e moderacao.
9. Modulo 8 - Conteudos, blog e publicacoes dos especialistas.
10. Modulo 9 - Perfil dos profissionais e avaliacoes.
11. Modulo 10 - Links, embeds e materiais externos.
12. Modulo 11 - Painel admin e relatorios.
13. Modulo 12 - Painel profissional e comunicacao interna.
14. Modulo 13 - Notificacoes.
15. Modulo 14 - Revisao tecnica final por ciclo.

## Principais riscos identificados

- Alterar banco de dados sem migracao aditiva pode quebrar a instancia Neon em producao.
- Misturar compliance, gamificacao e ranking em um unico commit aumenta risco de regressao.
- Moderacao do feed precisa de regra clara antes de alterar status padrao de publicacao.
- Ranking sem anonimato pode contrariar a preocupacao de privacidade levantada na reuniao.
- Check-in com pontuacao sem trava pode gerar abuso.
- Turmas fechadas precisam de grupo/permissao antes de aparecerem na interface do usuario.

## Proximo passo sugerido

Aprovar ou ajustar o escopo do Modulo 1 antes de qualquer alteracao funcional. O Modulo 1 e o primeiro que deve mexer em banco/API/tela, portanto precisa de decisao previa sobre cadastro livre, aprovacao manual e grupos/turmas.
