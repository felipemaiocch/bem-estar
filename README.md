# Pulse Hub

SaaS mobile-first de bem-estar corporativo, cultura organizacional e gamificação.

## Stack

- Next.js 16 com App Router
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Recharts
- Prisma + PostgreSQL
- JWT com `jose`
- Estrutura pronta para Vercel + Neon

## O que já está implementado

- Tela de login e onboarding com visual premium
- Dashboard do colaborador com:
  - cultura, eventos, festas e lazer
  - agenda e notificações
  - gamificação e ranking
  - progresso e acompanhamento
- Painel do profissional
- Painel administrativo
- Bottom navigation mobile-first
- Manifest para instalar como app web
- Skeleton loading
- Rotas de API para login, cadastro e health check
- Middleware preparado para RBAC por papel
- Schema Prisma pronto para conectar no Neon

## Estrutura principal

- `src/app`
  - rotas da interface
  - `api/auth/login`
  - `api/auth/register`
- `src/components`
  - auth
  - layout
  - screens
  - ui
- `src/lib`
  - constantes
  - dados mockados
  - Prisma
  - JWT e sessão
- `prisma/schema.prisma`
  - modelos para usuários, profissionais, agendamentos, eventos, notificações e progresso

## Rodando localmente

1. Instale dependências:

```bash
npm install
```

2. Crie o arquivo de ambiente:

```bash
cp .env.example .env
```

3. Rode o projeto:

```bash
npm run dev
```

4. Abra:

```bash
http://localhost:3000
```

## Conectando com Neon

1. Crie um projeto PostgreSQL no Neon.
2. Copie a connection string.
3. Preencha `DATABASE_URL` e `DIRECT_URL` no `.env`.
4. Gere o client Prisma:

```bash
npm run db:generate
```

5. Suba o schema:

```bash
npm run db:push
```

## Deploy na Vercel

1. Suba este projeto para um repositório no GitHub.
2. Importe o repositório na Vercel.
3. Configure as variáveis:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_DEMO_MODE`
4. Faça o deploy.

O script `postinstall` já executa `prisma generate`, o que ajuda no fluxo padrão da Vercel.

## GitHub

Fluxo sugerido:

```bash
git init
git add .
git commit -m "feat: initial pulse hub saas"
git branch -M main
git remote add origin <URL_DO_SEU_REPOSITORIO>
git push -u origin main
```

## Observações

- `NEXT_PUBLIC_DEMO_MODE=true` deixa a navegação livre para apresentar o produto sem depender do banco.
- Ao definir `NEXT_PUBLIC_DEMO_MODE=false`, o middleware passa a exigir sessão JWT para `/usuario`, `/profissional` e `/admin`.
- As rotas de auth já estão prontas para sair do modo demo e autenticar com Prisma.
