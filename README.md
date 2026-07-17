# Agendamento de Serviços - API

API REST do desafio de agendamento: autenticação, catálogo de serviços, disponibilidade de horários, agendamentos do cliente e área administrativa.

O frontend (`painel`, Next.js) está em um repositório separado - [Links](https://github.com/devgsanches/panel).

---

## Tecnologias utilizadas

| Camada | Escolha |
|---|---|
| Runtime | Node.js 20+ |
| Framework | NestJS 11 |
| Banco | PostgreSQL 16 (Docker no ambiente local) |
| ORM | Prisma 7, com driver adapter `@prisma/adapter-pg` |
| Autenticação | JWT (`@nestjs/jwt`) + Passport (`passport-jwt`), senha com bcrypt |
| Validação | `class-validator` + `class-transformer` via `ValidationPipe` global |
| Documentação | Swagger (`@nestjs/swagger`), servida em `/docs` |
| Datas | `date-fns` + `date-fns-tz` |
| Testes | Vitest, incluindo testes de integração contra Postgres real e e2e HTTP com Supertest |
| Lint/format | Biome |

---

## Rodando localmente

Pré-requisitos: Node.js 20+, pnpm e Docker.

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar as variáveis de ambiente
cp .env.example .env

# 3. Subir o Postgres (usuário/senha já batem com o .env.example)
docker compose up -d

# 4. Gerar o client do Prisma e aplicar as migrations
pnpm prisma:generate
pnpm prisma:migrate

# 5. Popular o banco (cria o admin, clientes demo e agendamentos de exemplo)
pnpm db:seed

# 6. Subir a API
pnpm start:dev
```

A API sobe em `http://localhost:3333`.

### Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `PORT` | Porta HTTP (padrão `3333`) |
| `CORS_ORIGIN` | Origens liberadas, separadas por vírgula. `*` libera todas |
| `DATABASE_URL` | Conexão com o Postgres |
| `JWT_SECRET` | Segredo de assinatura do token — **trocar em produção** |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciais do admin criado pelo seed |

### Outros comandos

```bash
pnpm test        # suíte completa (precisa do Postgres no ar)
pnpm lint        # Biome
pnpm build       # build de produção
```

---

## a API

Duas formas de percorrer a API sem precisar do frontend. **Comece por aqui.**

### 🔎 Swagger — `http://localhost:3333/docs`

Documentação interativa, traz os 12 endpoints versionados, os schemas de request/response e os códigos de erro de cada rota. O `/health` fica fora da doc de propósito - é healthcheck de infra, não superfície pública.

Para testar rotas autenticadas:

1. `POST /v1/auth/login` com uma das [credenciais abaixo](#credenciais-de-acesso) → copie o `access_token` da resposta.
2. Clique em **Authorize** (canto superior direito), cole o token e confirme.
3. As rotas protegidas passam a responder — inclusive as de admin, se o token for do administrador.

### 📄 `client.http` — o fluxo completo, na ordem

Na raiz do repositório. Abre com a extensão **REST Client** (VS Code / Cursor) e cobre **todas as rotas na ordem do fluxo real**, do cadastro à exclusão pelo admin.

O detalhe que o torna prático: **os tokens se preenchem sozinhos**. Rodar `# @name login` e `# @name adminLogin` alimenta as variáveis `{{token}}` e `{{adminToken}}`, e o id do agendamento criado encadeia nas requisições seguintes:

```http
@baseUrl = http://localhost:3333
@apiUrl = {{baseUrl}}/v1
@date = 2026-07-20

@token = {{login.response.body.access_token}}
@adminToken = {{adminLogin.response.body.access_token}}
```
---

## Credenciais de acesso

Criadas pelo `pnpm db:seed`.

**Administrador** - acessa a área administrativa:

| Email | Senha |
|---|---|
| `admin@devclub.com` | `admin123` |

**Clientes de exemplo** — senha `cliente123` para os três:

`ana@example.com` · `bruno@example.com` · `carla@example.com`

Qualquer conta criada pelo `/v1/auth/register` nasce com role `USER`. Não há como se cadastrar como admin pela API — a promoção só acontece via seed ou direto no banco.

---

## Rotas

Tudo é versionado sob `/v1`. O `/health` é a exceção, propositalmente.

| Método | Rota | Acesso |
|---|---|---|
| `GET` | `/health` | público, sem versão |
| `GET` | `/v1/services` | público |
| `GET` | `/v1/availability?date=YYYY-MM-DD` | público |
| `POST` | `/v1/auth/register` | público |
| `POST` | `/v1/auth/login` | público |
| `GET` | `/v1/auth/me` | autenticado |
| `POST` | `/v1/bookings` | autenticado |
| `GET` | `/v1/bookings/:id` | dono ou admin |
| `GET` | `/v1/me/bookings` | autenticado |
| `PATCH` | `/v1/me/bookings/:id/cancel` | dono |
| `GET` | `/v1/admin/bookings?date=&status=` | admin |
| `PATCH` | `/v1/admin/bookings/:id/status` | admin |
| `DELETE` | `/v1/admin/bookings/:id` | admin |

---

### Fuso horário

Persistência em UTC, exibição em `America/Sao_Paulo`.

### Modelagem: `Booking` referencia `User`

### Organização

Módulos por feature em `src/modules/`, transversais em `src/common/` (guards, decorators, filtros) e regra de negócio pura em `src/domain/` - esta última sem dependência de Nest nem de Prisma, o que a torna testável sem subir nada.

Versionamento por URI (`/v1`) para permitir evoluir a API sem quebrar o painel. O `/health` fica fora da versão de propósito: healthcheck de deploy não deve depender de qual versão da API está no ar.

Filtro global de exceções padroniza o corpo de erro (`statusCode`, `error`, `message`, `path`, `timestamp`).

### Testes

45 testes. Além dos unitários de domínio e DTO.
