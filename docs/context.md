# Context — Cartola Odds Frontend

> Arquivo de contexto para desenvolvimento assistido por IA.  
> Leia este arquivo antes de qualquer tarefa neste repositório.

---

## O que é este projeto

Frontend Angular 21 que consome a **Cartola Odds API** (backend Java/Spring Boot) e apresenta dados estratégicos para jogadores do Cartola FC (fantasy football brasileiro).

O usuário final quer montar o melhor time possível cruzando:
- Métricas dos atletas (média de pontos, variação, preço)
- Odds do Brasileirão (qual time é favorito a vencer)

---

## Backend — Cartola Odds API

- **Repositório:** `FabioCarlesso/cartolaodds` (Java/Spring Boot)
- **URL local:** `http://localhost:8080`
- **Docs:** `docs/documentacao_api.md` (ver arquivo de referência da API no backend)

### Endpoints consumidos

Todos os endpoints exigem `Authorization: Bearer <token>`, exceto `POST /api/auth/login`.

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Autentica e devolve o access token JWT (único endpoint público) |
| PATCH | `/api/usuarios/me/senha` | Troca a senha do usuário autenticado (invalida o token atual) |
| GET | `/api/time` | Monta o time ideal da rodada |
| GET | `/api/time/comparar` | Monta e compara o melhor time entre múltiplas formações |
| GET | `/api/ranking` | Lista atletas ordenados por score |
| GET | `/api/favoritos` | Times favoritos por odds da rodada |

### Parâmetros relevantes

- `GET /api/ranking?posicao=ATA&limite=25` — filtra por posição e quantidade
- `GET /api/favoritos?oddLimite=3.0` — customiza o limite de odd para ser considerado favorito
- Se `oddLimite` não for enviado, o backend usa o valor de `application.properties` (padrão: 3.0)
- `GET /api/time/comparar?formacoes=4-3-3&formacoes=3-4-3&orcamento=120` — um parâmetro `formacoes` por formação (2 a 5) e `orcamento` opcional; resposta com `melhorFormacao` e `resultados` ordenados por `scoreTotal`

---

## Stack do Frontend

| Item | Detalhe |
|---|---|
| Framework | Angular 21.2 — **standalone components** (sem NgModules) |
| Linguagem | TypeScript 5.9 com `strict: true` |
| Estilo | SCSS puro (sem frameworks CSS externos) |
| HTTP | `HttpClient` com interceptor funcional |
| Forms | `ReactiveFormsModule` não usado — apenas `FormsModule` para dois filtros simples |
| State | Local component state (signals/NgRx não são necessários ainda) |
| Routing | Lazy loading por `loadComponent` |
| Build | esbuild via `@angular-devkit/build-angular:application` |

---

## Estrutura de Arquivos

```
src/app/
├── core/
│   ├── models/auth.model.ts                 ← Perfil, LoginRequest/Response, SessaoUsuario
│   ├── services/auth.service.ts             ← sessão em signals; token é a fonte de verdade
│   ├── guards/auth.guard.ts                 ← protege as rotas internas, guarda ?redirect=
│   └── interceptors/
│       ├── auth.interceptor.ts              ← Authorization: Bearer + logout no 401
│       └── error.interceptor.ts             ← mapeia erros HTTP → mensagens PT-BR
├── shared/
│   ├── models/
│   │   ├── atleta.model.ts         ← interface Atleta
│   │   ├── time.model.ts           ← interface TimeResponse
│   │   ├── ranking.model.ts        ← interface RankingResponse
│   │   ├── favoritos.model.ts      ← interfaces JogoFavorito, JogoDescartado, FavoritosResponse
│   │   └── comparacao.model.ts     ← interfaces FormacaoComparada, CompararResponse
│   ├── utils/
│   │   ├── time-mapper.util.ts     ← mapAtleta / mapTimeResponse (compartilhado entre time e comparação)
│   │   └── formacao.util.ts        ← formações válidas + conversão formação → config
│   └── components/
│       ├── loading-spinner/        ← spinner com message e fullPage
│       ├── alert-banner/           ← banner tipo warning/error/info/success
│       └── orcamento-input/        ← input reutilizável de orçamento (cartoletas)
└── features/
    ├── auth/
    │   └── pages/
    │       ├── login-page/         ← formulário reativo de login
    │       ├── forbidden-page/     ← aviso de acesso restrito (/403)
    │       └── alterar-senha-page/ ← troca da própria senha
    ├── time/
    │   ├── services/time.service.ts
    │   ├── components/
    │   │   ├── player-card/        ← card individual de atleta
    │   │   └── team-view/          ← campo visual 4-3-3
    │   └── pages/time-page/        ← página principal do time
    ├── ranking/
    │   ├── services/ranking.service.ts
    │   └── pages/ranking-page/     ← tabela com filtros
    ├── favoritos/
    │   ├── services/favoritos.service.ts
    │   └── pages/favoritos-page/   ← cards de partida + probabilidades
    └── comparacao/
        ├── services/comparacao.service.ts
        └── pages/comparacao-page/  ← chips de formação + cards ranqueados + detalhe colapsável
```

---

## Convenções do Código

### Componentes

- Todos os componentes são **standalone** (`standalone: true`)
- Imports explícitos em cada componente (sem barrel imports de módulos)
- Templates inline para componentes pequenos; arquivos `.html`/`.scss` separados para o app shell
- Uso de nova sintaxe de controle de fluxo: `@if`, `@for`, `@switch` (não `*ngIf`/`*ngFor`)

### Injeção de dependência

```typescript
// Padrão adotado — inject() no corpo da classe
private service = inject(MyService);

// NÃO usar construtor para injeção
constructor(private service: MyService) {} // ← evitar
```

### Serviços

- `providedIn: 'root'` em todos os serviços
- Retornam `Observable<T>` — sem conversão para Promise
- URL base sempre `/api` (resolve via proxy em dev)

### Estado local

Cada page component gerencia seu próprio estado com propriedades simples:

```typescript
data: ResponseType | null = null;
loading = false;
error = '';
```

Sem uso de `BehaviorSubject` ou stores para o escopo atual. A exceção é a sessão: o
`AuthService` a expõe por `signal`, porque é estado global lido pelo shell, pelas guardas e
pelo interceptor.

### Tratamento de erro

Sempre usar o campo `userMessage` injetado pelo interceptor:

```typescript
error: (err) => {
  this.error = err.userMessage ?? 'Erro genérico.';
  this.loading = false;
}
```

### Sessão e autorização

O `perfil` e o `usuarioId` vêm dos claims do JWT, nunca de um objeto guardado à parte. Um
token sem `perfil` conhecido, ilegível ou expirado não é sessão válida — o `AuthService`
limpa tudo e o usuário volta ao `/login`.

Guardas de rota são defesa de **experiência**, não de segurança: quem editar o
`localStorage` vê a tela, mas a API recusa a operação. A autorização real é sempre a do
backend.

---

## Design System

Tema escuro football inspirado em campo de futebol.

Arquivo: `src/styles.scss` — define CSS custom properties globais.

**Regras:**
- Nunca hardcode de cores nos componentes — sempre usar variáveis CSS (`var(--green-primary)`)
- Componentes podem ter estilos encapsulados (`:host` + component styles)
- Responsivo: mobile-first implícito, breakpoints em `640px` e `1024px`

**Cores chave:**
- `#22c55e` — verde (score bom, favorito, provável)
- `#f59e0b` — âmbar/dourado (dúvida, capitão)
- `#ef4444` — vermelho (erro, adversário)
- `#0a0f1a` — fundo escuro

---

## Regras de Negócio Refletidas no Frontend

### Atleta em Dúvida (`emDuvida: true`)

- Card com borda âmbar e fundo suave dourado
- Tag "⚠️ Dúvida" visível no card
- Se `substitutoProvavel` existir, exibido abaixo do card

### Capitão

- Identificado comparando `time.capitao.apelido === atleta.apelido`
- Card com borda dourada + tag "★ Cap"
- No Cartola FC real, o capitão tem pontuação dobrada

### Reserva de Luxo

- Identificado comparando `time.reservaLuxo.apelido === atleta.apelido`
- Tag "⭐ Luxo" no card

### Comparação de Formações (`/comparar`)

- O usuário seleciona de **2 a 5** formações via chips (`FORMACOES_DISPONIVEIS` em `formacao.util.ts`); abaixo de 2 o botão fica desabilitado e acima de 5 os demais chips ficam desabilitados
- Seleção de formações e orçamento persistem em `sessionStorage` (`comparacao.formacoes`, `comparacao.orcamento`) para sobreviver a uma comparação
- Cards ranqueados por `scoreTotal` decrescente, com medalhas 🥇🥈🥉 nas 3 primeiras posições e ordinal (`4º`…) nas demais; o primeiro card (`melhorFormacao`) recebe destaque visual
- Formação sem atletas suficientes (`indisponivel`/`422` por formação) exibe aviso inline no próprio card sem quebrar os demais
- Detalhe colapsável reusa o `app-team-view` da tela de Time; **apenas um card expandido por vez**
- "Usar esta formação" é destrutivo: abre modal de confirmação e, ao confirmar, chama `PATCH /api/config` (via `formacaoParaConfig`, que fixa GOL=1, LAT=2, TEC=1 e deriva ZAG = DEF − 2) e redireciona para `/time`
- **Salvaguarda de composição** (`validarComposicao` em `formacao.util.ts`): compara a contagem de titulares retornada pelo backend com a composição esperada da formação, **agrupando laterais + zagueiros no total de defensores (`DEF`)** — assim uma variação legítima do split LAT/ZAG (com total correto) não gera aviso, só a inflação do total importa. Havendo divergência (ou posição não reconhecida), o card exibe um aviso `warning`. Defesa contra regressões do backend (cartolaoddsapi#31), em que `/api/time/comparar` chegou a inflar os defensores (ex.: 4-3-3 com ZAG=4 → DEF=6). Formação não reconhecida → sem aviso (degradação graciosa)

### Score (normalização visual)

- O valor de `score` vem pronto da API e deve ser tratado como fonte de verdade para ranking/listagens
- A API pode enviar metadados opcionais (`criterioScore`, `scoreCriterio`, `tipoScore`, `estrategiaScore`, `descricaoScore`, `pesosScore`) para explicar o cálculo usado
- Se não houver metadados, o frontend mostra fallback visual por posição: goleiros como critério defensivo, atacantes como critério ofensivo e demais posições como critério padrão da API
- Máximo assumido de 12 pontos para a barra de progresso
- `scorePercent = Math.min((score / 12) * 100, 100)`
- Scores acima de 12 ficam em 100% da barra

### Indicador de Consistência (desvio padrão)

- A API envia `desvioPadrao` e `rodadasConsideradas` dentro de cada `Atleta`, tanto em `/api/time` quanto em `/api/ranking`
- **Status do contrato (validado em 22/05/2026 contra `localhost:8080`):** `pesoDesvio` existe em `/api/config` e os campos `desvioPadrao`/`rodadasConsideradas` são retornados em `AtletaDto`/`AtletaRankingDto` com esses nomes oficiais (sem sinônimos). Quando `rodadasConsideradas < 2` (ex.: início de temporada, sem histórico), o desvio não é calculável e o frontend exibe o badge neutro ⚪ — degradação graciosa.
- O frontend exibe um badge colorido ao lado do score nas telas de **Ranking** e **Time**
- Classificação centralizada em `shared/utils/consistencia.util.ts` (`getConsistenciaBadge`):
  - `0.0 – 2.0` → 🟢 Consistente
  - `2.1 – 4.0` → 🟡 Moderado
  - `> 4.0` → 🔴 Instável
  - `rodadasConsideradas < 2` → ⚪ Histórico insuficiente (desvio não calculável)
- Componente reutilizável `app-consistencia-badge` com tooltip (hover no desktop, toque no mobile)
- A configuração `pesoDesvio` (0.0–1.0, padrão 0.05) controla a penalidade no backend; editável no `/admin`

### Probabilidade Implícita (Favoritos)

- Calculada como `(1/odd) / sum(1/odds)` para cada desfecho
- Inclui overround da casa de apostas — total > 100% é esperado

---

## O que NÃO fazer

- Não usar NgModules — o projeto é 100% standalone
- Não usar `async pipe` nos templates se já tiver `subscribe()` no componente — escolher um padrão
- Não hardcode a URL `localhost:8080` nos serviços — usar sempre `/api`
- Não usar `*ngIf`/`*ngFor` — usar a nova sintaxe `@if`/`@for`
- Não adicionar dependências externas (Material, PrimeNG, etc.) sem alinhamento prévio

---

## Mapeamento da API — TimeService

O backend retorna `titulares` e `reservas` agrupados por posição:

```json
{
  "titulares": { "ATA": [...], "MEI": [...], "ZAG": [...] },
  "reservas":  { "ATA": {...}, "MEI": {...} }
}
```

O `TimeService` transforma isso para arrays planos antes de emitir o `Observable<TimeResponse>`:
- `nomeClube` → `clube`
- `status` (string `"⚠️ Dúvida"`) → `emDuvida` (boolean)
- `substitutoProvavel` mapeado recursivamente

Os models (`Atleta`, `TimeResponse`) e todos os templates trabalham com o formato já mapeado — sem acesso ao formato raw.

---

## Docker e Containerização

### Arquivos Docker

| Arquivo | Papel |
|---|---|
| `Dockerfile` | Build multi-stage: Node 20 Alpine (build) → nginx 1.27 Alpine (runtime) |
| `nginx.conf.template` | Config nginx com `envsubst` — proxy `/api/`, SPA routing, gzip, cache 1 ano |
| `docker-compose.yml` | Serviço `frontend` com healthcheck e resource limits |
| `.env.example` | Template de variáveis de ambiente — copiar para `.env` antes de usar |
| `.dockerignore` | Exclui `node_modules/`, `dist/`, `.angular/`, specs, docs do contexto de build |

### Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `BACKEND_URL` | `http://host.docker.internal:8080` | URL do backend Cartola Odds API |
| `APP_PORT` | `4200` | Porta exposta no host |

### Como funciona

- O CMD do container executa `envsubst` para substituir `${BACKEND_URL}` no `nginx.conf.template` antes de iniciar o nginx — sem rebuild da imagem para trocar de backend.
- `nginx` faz proxy de `/api/` para `${BACKEND_URL}/api/`, eliminando CORS em produção (mesmo comportamento do `proxy.conf.json` em dev).
- Build output esperado pelo Dockerfile: `dist/cartolaoddsfe/browser/` (path do Angular 21 com esbuild).
- Container roda como usuário não-root (`appuser`) por segurança.

### Acesso ao backend em localhost:8080

O container não pode usar `localhost` para atingir o host — `localhost` dentro do container é o próprio container.

A solução é `host.docker.internal`, que resolve para o IP do host:
- **Docker Desktop (Mac/Windows):** funciona automaticamente.
- **Linux:** requer `extra_hosts: ["host.docker.internal:host-gateway"]` no `docker-compose.yml` — já incluído.

Se o backend estiver em `localhost:8080` no host, **nenhuma configuração adicional** é necessária — o padrão `BACKEND_URL=http://host.docker.internal:8080` já resolve corretamente.

### O que NÃO fazer em Docker

- Não hardcode a URL do backend na imagem — usar `BACKEND_URL` via variável de ambiente
- Não expor porta 8080 no container de frontend — nginx escuta na 80 internamente
- Não editar `nginx.conf.template` sem testar o `envsubst` manualmente

---

## Próximas Melhorias Previstas

- [ ] Dark/light mode toggle
- [ ] Página de dashboard com resumo de todas as features
- [ ] Gráficos de score por posição (Chart.js ou D3)
- [ ] Histórico de rodadas
- [ ] Filtro de budget máximo (C$) na tela de Time
- [ ] PWA / Service Worker para cache offline
- [ ] NgRx Signals para estado global (quando a complexidade justificar)
