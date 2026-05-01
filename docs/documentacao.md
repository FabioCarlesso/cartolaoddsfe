# Documentação Técnica — Cartola Odds Frontend

> **Stack:** Angular 21 · TypeScript 5.9 · SCSS · RxJS 7.8 · Docker · nginx  
> **Versão:** 1.3.0

---

## Índice

1. [Arquitetura](#1-arquitetura)
2. [Configuração e Bootstrap](#2-configuração-e-bootstrap)
3. [Roteamento](#3-roteamento)
4. [Interceptor de Erros](#4-interceptor-de-erros)
5. [Modelos de Dados](#5-modelos-de-dados)
6. [Serviços HTTP](#6-serviços-http)
7. [Componentes Compartilhados](#7-componentes-compartilhados)
8. [Feature: Time](#8-feature-time)
9. [Feature: Ranking](#9-feature-ranking)
10. [Feature: Favoritos](#10-feature-favoritos)
11. [Feature: Admin (Config + Cache)](#11-feature-admin-config--cache)
12. [Design System](#12-design-system)
13. [Proxy de Desenvolvimento](#13-proxy-de-desenvolvimento)
14. [Build e Deploy](#14-build-e-deploy)
15. [Docker](#15-docker)
16. [Testes](#16-testes)

---

## 1. Arquitetura

O projeto segue o padrão **Feature-based com Standalone Components** do Angular 21. Não usa NgModules — cada componente declara seus próprios imports.

```
app/
├── core/           # Infraestrutura transversal (interceptors)
├── shared/         # Modelos e componentes reutilizáveis
└── features/       # Domínios de negócio isolados
    ├── time/
    ├── ranking/
    ├── favoritos/
    └── admin/      # Configurações e gerenciamento de cache
```

### Decisões de Arquitetura

| Decisão | Justificativa |
|---|---|
| Standalone components | Padrão Angular 17 — sem boilerplate de NgModule |
| Lazy loading por rota | Reduz bundle inicial; cada feature carrega sob demanda |
| `inject()` em vez de construtor | Código mais conciso, compatível com signals futuros |
| Inline styles em componentes menores | Encapsulamento total; evita conflitos de CSS global |
| `async pipe` e `subscribe` explícito | Preferência pelo `subscribe` com `OnInit` para controle de estado local |

---

## 2. Configuração e Bootstrap

### `src/main.ts`

Ponto de entrada da aplicação. Usa `bootstrapApplication` (standalone):

```typescript
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
```

### `src/app/app.config.ts`

Registra os providers globais:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([errorInterceptor])),
    provideAnimations()
  ]
};
```

| Provider | Função |
|---|---|
| `provideRouter` | Habilita roteamento com input binding |
| `provideHttpClient` | HTTP com interceptor funcional |
| `provideAnimations` | Suporte a animações Angular |

---

## 3. Roteamento

Arquivo: `src/app/app.routes.ts`

Todas as rotas usam **lazy loading** via `loadComponent`:

```typescript
{
  path: 'time',
  loadComponent: () => import('./features/time/pages/time-page/time-page.component')
    .then(m => m.TimePageComponent)
}
```

| Path | Componente carregado |
|---|---|
| `/` | Redireciona para `/time` |
| `/time` | `TimePageComponent` |
| `/ranking` | `RankingPageComponent` |
| `/favoritos` | `FavoritosPageComponent` |
| `/admin` | `AdminPageComponent` |
| `**` | Redireciona para `/time` |

---

## 4. Interceptor de Erros

Arquivo: `src/app/core/interceptors/error.interceptor.ts`

Interceptor funcional (`HttpInterceptorFn`) que captura erros HTTP e adiciona `userMessage` ao objeto de erro:

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // mapeia status HTTP → mensagem em português
      return throwError(() => ({ ...error, userMessage }));
    })
  );
};
```

### Mapeamento de Erros

| Status HTTP | Mensagem exibida |
|---|---|
| `0` | Servidor inacessível — backend não está rodando |
| `400` | Requisição inválida (usa `error.mensagem` do backend) |
| `422` | Pool vazio — ODD_LIMITE restritivo ou sem API Key |
| `502` | Falha na API externa (Cartola FC ou Odds API) |
| `5xx` | Erro interno do servidor |

---

## 5. Modelos de Dados

Todos em `src/app/shared/models/`.

### `Atleta`

```typescript
interface Atleta {
  apelido: string;
  posicao: string;       // "GOL" | "LAT" | "ZAG" | "MEI" | "ATA" | "TEC"
  clube?: string;        // "Flamengo (FLA)"
  mediaPontos: number;
  valorizacao: number;
  preco: number;
  score: number;
  criterioScore?: string;
  scoreCriterio?: string;
  tipoScore?: string;
  estrategiaScore?: string;
  descricaoScore?: string;
  scoreDescricao?: string;
  pesosScore?: Record<string, number> | Array<{ nome: string; peso: number; descricao?: string }>;
  emDuvida: boolean;
  status?: string;
  substitutoProvavel?: Atleta;
}
```

### `TimeResponse`

```typescript
interface TimeResponse {
  titulares: Atleta[];
  reservas: Atleta[];
  capitao: Atleta;
  reservaLuxo: Atleta;
  alertasDuvida: string[];
  avisoMercado: string | null;
  rodada?: number;
}
```

### `RankingResponse`

```typescript
interface RankingResponse {
  atletas: Atleta[];
  avisoMercado: string | null;
  rodada?: number;
  criterioScore?: string;
  descricaoScore?: string;
  criteriosScorePorPosicao?: Record<string, string>;
  pesosScorePorPosicao?: Record<string, unknown>;
}
```

### `FavoritosResponse`

```typescript
interface FavoritosResponse {
  favoritos: JogoFavorito[];
  descartados: JogoDescartado[];
  oddLimiteUtilizado: number;
}

interface JogoFavorito {
  timeFavorito: string;
  oddFavorito: number;
  timeAdversario: string;
  oddAdversario: number;
  oddEmpate?: number;
  favoritoEmCasa: boolean;
}

interface JogoDescartado {
  timeCasa: string;
  timeVisitante: string;
  motivo: string;
}
```

---

## 6. Serviços HTTP

Todos usam `inject(HttpClient)` e são `providedIn: 'root'`.

### `TimeService`

```typescript
getTime(): Observable<TimeResponse>
// GET /api/time
```

O backend retorna `titulares` e `reservas` agrupados por posição (`{ ATA: [], MEI: [], ... }`). O service aplica mapeamento interno antes de expor o `Observable<TimeResponse>`:

- `titulares`: objeto por posição → `Atleta[]` flat via `Object.values().flat()`
- `reservas`: objeto por posição (um atleta por chave) → `Atleta[]` via `Object.values()`
- `nomeClube` → `clube`
- `status` (string `"⚠️ Dúvida"`) → `emDuvida` (boolean)
- `substitutoProvavel` mapeado recursivamente

### `RankingService`

```typescript
getRanking(posicao?: string, limite = 25): Observable<RankingResponse>
// GET /api/ranking?posicao=X&limite=N
```

### `FavoritosService`

```typescript
getFavoritos(oddLimite?: number): Observable<FavoritosResponse>
// GET /api/favoritos?oddLimite=X
```

Quando `oddLimite` é `undefined`, o parâmetro não é enviado e o backend usa o valor padrão configurado em `application.properties`.

### `ConfiguracaoService`

```typescript
getConfig(): Observable<ConfiguracaoResponse>
// GET /api/config

patchConfig(request: ConfiguracaoRequest): Observable<ConfiguracaoResponse>
// PATCH /api/config

resetConfig(): Observable<ConfiguracaoResponse>
// POST /api/config/reset
```

### `CacheService`

```typescript
invalidateAll(): Observable<CacheResponse>
// DELETE /api/cache

invalidateByName(nome: string): Observable<CacheResponse>
// DELETE /api/cache/{nome}
```

Caches disponíveis: `odds`, `atletas`, `clubes`, `partidas`, `pontuados`, `statusMercado`.

---

## 7. Componentes Compartilhados

### `LoadingSpinnerComponent`

Seletor: `app-loading-spinner`

| Input | Tipo | Padrão | Descrição |
|---|---|---|---|
| `message` | `string` | `''` | Texto abaixo do spinner |
| `fullPage` | `boolean` | `false` | Centraliza na tela com `min-height: 50vh` |

### `AlertBannerComponent`

Seletor: `app-alert-banner`

| Input | Tipo | Padrão | Descrição |
|---|---|---|---|
| `message` | `string` | `''` | Texto do alerta |
| `type` | `'warning' \| 'error' \| 'info' \| 'success'` | `'info'` | Determina cor e ícone |

Cada tipo tem ícone automático: ⚠️ `warning`, ❌ `error`, ℹ️ `info`, ✅ `success`.

---

## 8. Feature: Time

### Estrutura

```
features/time/
├── services/time.service.ts
├── components/
│   ├── player-card/player-card.component.ts
│   └── team-view/team-view.component.ts
└── pages/time-page/time-page.component.ts
```

### `PlayerCardComponent`

Seletor: `app-player-card`

| Input | Tipo | Padrão | Descrição |
|---|---|---|---|
| `atleta` | `Atleta` | — | **Obrigatório** |
| `isCaptain` | `boolean` | `false` | Borda dourada + tag "Cap" |
| `isLuxuryReserve` | `boolean` | `false` | Tag "Luxo" |
| `isReserve` | `boolean` | `false` | Reduz opacidade |

**Comportamentos visuais:**
- Badge de posição colorido por posição (`GOL`=vermelho, `LAT`=azul, `ZAG`=roxo, `MEI`=verde, `ATA`=âmbar, `TEC`=cinza)
- Barra de score normalizada para máximo de 12 pontos
- Indicação do critério do score retornado pela API; quando ausente, fallback por posição
- Valorização positiva em verde, negativa em vermelho
- Atletas em dúvida: borda âmbar + gradiente de fundo + bloco com substituto provável

**Score percent:**
```typescript
get scorePercent(): number {
  return Math.min((this.atleta.score / 12) * 100, 100);
}
```

### `TeamViewComponent`

Seletor: `app-team-view`

| Input | Tipo | Descrição |
|---|---|---|
| `time` | `TimeResponse` | **Obrigatório** |

Renderiza o campo visual com faixas CSS e organiza os jogadores em linhas:

| Linha | Posições incluídas |
|---|---|
| Ataque | `ATA` |
| Meio | `MEI` |
| Defesa | `LAT` + `ZAG` (ordem: LAT-ZAG-ZAG-LAT) |
| Goleiro | `GOL` |
| Coach (fora do campo) | `TEC` |

**Lógica dos defensores:**
```typescript
get defensores(): Atleta[] {
  const lats = this.time.titulares.filter(a => a.posicao === 'LAT');
  const zags = this.time.titulares.filter(a => a.posicao === 'ZAG');
  const [lat1, lat2] = lats;
  return [lat1, ...zags, lat2].filter(Boolean);
}
```

### `TimePageComponent`

Gerencia estado local: `loading`, `error`, `time`.

**Métricas calculadas no template:**
- `titularesCount` — total de titulares
- `duvidaCount` — titulares com `emDuvida === true`
- `totalPreco` — soma de `preco` dos titulares
- `mediaScore` — média de `score` dos titulares

---

## 9. Feature: Ranking

### `RankingPageComponent`

Filtros controlados por `ngModel` + `FormsModule`:

| Filtro | Tipo | Padrão |
|---|---|---|
| `posicaoSelecionada` | `string` | `''` (todas) |
| `limiteSelecionado` | `number` | `25` |

Opções de posição disponíveis: `GOL`, `LAT`, `ZAG`, `MEI`, `ATA`, `TEC`.

A tabela exibe para cada atleta:
- Medalha (🥇🥈🥉) para os 3 primeiros
- Badge de posição colorido
- Barra de score de 80px de largura
- Critério do score por atleta, usando metadados opcionais da API ou fallback local por posição
- Valorização com cor (positivo verde / negativo vermelho)
- Status: "Provável" (verde) ou "Dúvida" (âmbar)

---

## 10. Feature: Favoritos

### `FavoritosPageComponent`

Permite customizar o `oddLimite` via input numérico. O botão "Padrão" limpa o valor e usa o configurado no backend.

**Cards de Favoritos:**  
Cada jogo exibe times, odds, indicador de mandante e barra de probabilidade calculada a partir das odds implícitas:

```typescript
probFavorito(jogo: JogoFavorito): number {
  const total = 1/jogo.oddFavorito + 1/jogo.oddAdversario + (jogo.oddEmpate ? 1/jogo.oddEmpate : 0);
  return ((1 / jogo.oddFavorito) / total) * 100;
}

probEmpate(jogo: JogoFavorito): number {
  if (!jogo.oddEmpate) return 0;
  const total = 1/jogo.oddFavorito + 1/jogo.oddAdversario + 1/jogo.oddEmpate;
  return ((1 / jogo.oddEmpate) / total) * 100;
}
```

> A probabilidade implícita inclui a margem da casa de apostas (overround), portanto o total não soma 100%.

**Jogos descartados:** listados com motivo textual retornado pelo backend.

---

## 11. Feature: Admin (Config + Cache)

### Estrutura

```
features/admin/
├── services/
│   ├── configuracao.service.ts    # GET/PATCH /api/config, POST /api/config/reset
│   └── cache.service.ts           # DELETE /api/cache, DELETE /api/cache/{nome}
└── pages/admin-page/
    └── admin-page.component.ts    # Tela unificada de configuração e cache
```

### `AdminPageComponent`

Tela unificada com duas seções:

#### Seção: Parâmetros de Negócio

Exibe o formulário com todos os campos da configuração carregados do banco via `GET /api/config`. O formulário é sincronizado com `syncForm()` a cada resposta do backend.

| Campo | Tipo | Validação |
|---|---|---|
| `oddLimite` | `number` | > 1.0 |
| `pesoMediaPontos` | `number` | 0.0 – 1.0 |
| `pesoValorizacao` | `number` | 0.0 – 1.0 |
| `pesoDesempenho` | `number` | 0.0 – 1.0 |
| `pesoFatorCasa` | `number` | 0.0 – 1.0 |
| `pesoTimeFavorito` | `number` | 0.0 – 1.0 |
| `formacaoGol` | `number` | >= 1 |
| `formacaoLat` | `number` | >= 1 |
| `formacaoZag` | `number` | >= 1 |
| `formacaoMei` | `number` | >= 1 |
| `formacaoAta` | `number` | >= 1 |
| `formacaoTec` | `number` | >= 1 |

**Soma dos pesos calculada em tempo real:**
```typescript
get somasPesos(): number {
  return (pesoMediaPontos + pesoValorizacao + pesoDesempenho + pesoFatorCasa + pesoTimeFavorito);
}
get pesosValidos(): boolean {
  return Math.abs(this.somasPesos - 1.0) <= 0.01;
}
```

Ações:
- **Salvar Alterações** — envia `PATCH /api/config` com todos os campos do formulário.
- **Restaurar Defaults** — envia `POST /api/config/reset`.

#### Seção: Gerenciar Cache

Lista os 6 caches disponíveis (`odds`, `atletas`, `clubes`, `partidas`, `pontuados`, `statusMercado`) mais um botão para invalidar todos de uma vez.

| Ação | Endpoint |
|---|---|
| Invalidar Todos | `DELETE /api/cache` |
| Invalidar cache específico | `DELETE /api/cache/{nome}` |

**Estado de loading por cache:** `cacheLoading` recebe `'all'` ou o nome do cache em operação, permitindo desabilitar apenas o botão correto.

### Modelos

**`ConfiguracaoResponse`** — retornado por `GET /api/config`, `PATCH /api/config` e `POST /api/config/reset`:
```typescript
interface ConfiguracaoResponse {
  oddLimite: number;
  pesoMediaPontos: number; pesoValorizacao: number;
  pesoDesempenho: number; pesoFatorCasa: number; pesoTimeFavorito: number;
  formacaoGol: number; formacaoLat: number; formacaoZag: number;
  formacaoMei: number; formacaoAta: number; formacaoTec: number;
  updatedAt: string;
}
```

**`ConfiguracaoRequest`** — body do `PATCH /api/config` (todos os campos opcionais):
```typescript
interface ConfiguracaoRequest { oddLimite?: number; /* ... mesmos campos ... */ }
```

**`CacheResponse`** — retornado por `DELETE /api/cache` e `DELETE /api/cache/{nome}`:
```typescript
interface CacheResponse {
  cachesInvalidados: string[];
  mensagem: string;
  timestamp: string;
}
```

---

## 12. Design System  

Definido em `src/styles.scss` via CSS custom properties:

### Paleta

```scss
:root {
  --bg-primary:    #0a0f1a;   // fundo da página
  --bg-secondary:  #111827;   // inputs, dropdowns
  --bg-card:       #1a2332;   // cards
  --border:        #2d3748;   // bordas padrão
  --green-primary: #22c55e;   // destaque principal
  --green-dark:    #16a34a;   // hover de botões
  --gold:          #f59e0b;   // capitão, alertas
  --red:           #ef4444;   // erros
  --blue:          #3b82f6;   // informação
  --text-primary:  #f1f5f9;
  --text-secondary:#94a3b8;
  --text-muted:    #64748b;
}
```

### Classes Utilitárias Globais

| Classe | Uso |
|---|---|
| `.page-container` | `max-width: 1200px`, centralizado |
| `.page-header` | Flex row com `justify-content: space-between` |
| `.page-title` | Título H1 com fonte Space Grotesk |
| `.section-title` | Título H2 de seção |
| `.card` | Card com fundo, borda e sombra padrão |
| `.btn.btn-primary` | Botão verde |
| `.btn.btn-secondary` | Botão com borda |
| `.form-control` | Input/select estilizado |
| `.badge.*` | Badges coloridos (green, gold, red, blue, purple) |
| `.empty-state` | Estado vazio centralizado |

### Tipografia

- **Corpo:** `Inter` (Google Fonts)
- **Títulos e números:** `Space Grotesk` (Google Fonts)

---

## 13. Proxy de Desenvolvimento

Arquivo: `proxy.conf.json`

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

Ativo automaticamente com `npm start` (`ng serve --proxy-config proxy.conf.json`).

---

## 14. Build e Deploy

### Comandos

```bash
npm start          # Dev server com proxy (porta 4200)
npm run build      # Build de produção em dist/cartolaoddsfe/
npm test           # Testes com Karma/Jasmine
```

### `angular.json` — Builder

Usa o builder esbuild (`@angular-devkit/build-angular:application`), padrão do Angular 21:

- **Output:** `dist/cartolaoddsfe/`
- **Entry:** `src/main.ts`
- **Styles:** `src/styles.scss`
- **Polyfills:** `zone.js`
- **Output hashing:** habilitado em produção

### Variáveis de Ambiente

Não há `environment.ts` — a URL do backend é definida diretamente nos serviços como `/api` e resolvida pelo proxy em dev ou pelo servidor web em produção.

Para produção, configure o servidor web (nginx/Apache) para redirecionar `/api/*` → `http://backend:8080/api/*`.

---

## 15. Docker

### Arquivos

| Arquivo | Descrição |
|---|---|
| `Dockerfile` | Build multi-stage: Node 20 Alpine (build) + nginx 1.27 Alpine (runtime) |
| `nginx.conf.template` | Config nginx com template envsubst para `BACKEND_URL` |
| `docker-compose.yml` | Orquestração com healthcheck e resource limits |
| `.env.example` | Template de variáveis — copiar para `.env` antes de usar |
| `.dockerignore` | Exclui `node_modules/`, `dist/`, specs e docs do contexto |

### Dockerfile — Multi-stage Build

```
Stage 1 — build (node:20-alpine)
  └── npm ci --legacy-peer-deps
  └── npm run build
        └── gera dist/cartolaoddsfe/browser/

Stage 2 — runtime (nginx:1.27-alpine)
  └── COPY nginx.conf.template
  └── COPY --from=build dist/cartolaoddsfe/browser → /usr/share/nginx/html
  └── USER appuser (não-root)
  └── EXPOSE 80
  └── CMD: envsubst + nginx
```

**Decisões de design:**
- **Alpine** — imagem base mínima (~25 MB na runtime vs ~300 MB com Node)
- **Usuário não-root** — `appuser` criado no estágio runtime, boa prática para produção
- **`envsubst`** — `BACKEND_URL` substituído no template em tempo de inicialização do container, sem rebuild de imagem
- **Multi-stage** — Node.js não existe na imagem final, reduz superfície de ataque

### nginx.conf.template

Configurações habilitadas:

| Recurso | Detalhe |
|---|---|
| SPA routing | `try_files $uri $uri/ /index.html` — suporta client-side routing |
| Proxy `/api/` | Proxia para `${BACKEND_URL}/api/` — sem CORS em produção |
| Cache de assets | `Cache-Control: public, immutable` por 1 ano para JS/CSS/fontes |
| Gzip | Compressão habilitada para `text/*`, `application/json`, `application/javascript` |
| Security headers | `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy` |

### Variáveis de Ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `BACKEND_URL` | `http://host.docker.internal:8080` | URL do backend Cartola Odds API |
| `APP_PORT` | `4200` | Porta exposta no host |

### Comandos

```bash
# Início rápido
cp .env.example .env            # 1. copiar template
# editar .env se necessário      # 2. ajustar BACKEND_URL
docker compose up -d            # 3. subir container

# Rebuild após mudança de código
docker compose up -d --build

# Logs
docker compose logs -f frontend

# Status e healthcheck
docker compose ps

# Parar
docker compose down

# Build manual
docker build -t cartola-odds-frontend:1.0.0 .

# Executar sem Compose
docker run -p 4200:80 \
  -e BACKEND_URL=http://localhost:8080 \
  cartola-odds-frontend:1.0.0
```

### Resource Limits (docker-compose.yml)

```yaml
deploy:
  resources:
    limits:
      memory: 128m
      cpus: "0.5"
    reservations:
      memory: 64m
      cpus: "0.1"
```

O container nginx consome muito menos recursos que o backend Java — 128 MB é suficiente para tráfego de desenvolvimento e uso moderado em produção.

---

## 16. Testes

### Stack de Testes

| Ferramenta | Versão | Uso |
|---|---|---|
| Karma | via `@angular-devkit/build-angular` | Test runner |
| Jasmine | ~5.1 | Framework de asserções e spies |
| `karma-coverage` | ~2.2 | Relatório de cobertura de código |
| `ChromeHeadless` | — | Browser de execução (CI-friendly) |

Configuração em `karma.conf.js`, referenciado no `angular.json` via `"karmaConfig": "karma.conf.js"`.

### Estratégia por camada

**Serviços** — usam `provideHttpClient()` + `provideHttpClientTesting()` + `HttpTestingController` para interceptar e verificar chamadas HTTP:

```typescript
const req = httpMock.expectOne('/api/time');
expect(req.request.method).toBe('GET');
req.flush(mockData);
```

**Componentes compartilhados e de UI** — importam o componente standalone diretamente em `TestBed.configureTestingModule({ imports: [Component] })`, verificam DOM via `fixture.nativeElement` e testam inputs/outputs.

**Componentes de página** — usam `jasmine.createSpyObj` para mockar serviços, controlam retornos com `of(data)` e `throwError(...)` do RxJS:

```typescript
mockTimeService = jasmine.createSpyObj('TimeService', ['getTime']);
mockTimeService.getTime.and.returnValue(of(mockTime));
```

**Interceptor** — usa `HttpClient` real com o interceptor registrado via `withInterceptors([errorInterceptor])` e verifica o campo `userMessage` nos erros.

### Cobertura dos Testes

| Arquivo de Teste | Cenários cobertos |
|---|---|
| `app.component.spec.ts` | Criação, navbar, links, router-outlet |
| `error.interceptor.spec.ts` | Status 0, 400 (com e sem mensagem), 422, 502, 500, resposta de sucesso |
| `loading-spinner.component.spec.ts` | Spinner DOM, message vazio/preenchido, classe full-page |
| `alert-banner.component.spec.ts` | Tipos (warning/error/success/info), ícones, classes CSS, message |
| `time.service.spec.ts` | GET /api/time, mapeamento agrupado→flat, nomeClube→clube, status→emDuvida, substituto recursivo, avisoMercado, erros |
| `ranking.service.spec.ts` | GET com limite padrão, com/sem posicao, propagação de erro |
| `favoritos.service.spec.ts` | GET sem oddLimite, com oddLimite, propagação de erro |
| `player-card.component.spec.ts` | Nome, clube, posição, dúvida, capitão, luxo, substituto, scorePercent (0/50/100%), valorizacao |
| `team-view.component.spec.ts` | Filtros por posição, ordem LAT-ZAG-ZAG-LAT, capitão, reserva de luxo, sem TEC, sem LAT |
| `time-page.component.spec.ts` | Load no init, sucesso, erro, fallback, métricas (titularesCount, duvidaCount, totalPreco, mediaScore), null state |
| `ranking-page.component.spec.ts` | Load, filtros, scorePercent, erro, lista de posições, avisoMercado |
| `favoritos-page.component.spec.ts` | probFavorito, probEmpate (com/sem oddEmpate), reset, DOM cards, erro |
| `configuracao.service.spec.ts` | GET /api/config, PATCH com body, POST /api/config/reset, erros HTTP |
| `cache.service.spec.ts` | DELETE /api/cache (todos), DELETE /api/cache/{nome}, erro 400 nome inválido |
| `admin-page.component.spec.ts` | Load config, sync form, salvar, resetar, invalidarTodos, invalidarCache, somasPesos, pesosValidos, erros |

### Comandos

```bash
# Todos os testes (ChromeHeadless)
npm test

# Com relatório de cobertura
npm test -- --code-coverage
# HTML em coverage/cartolaoddsfe/index.html

# Manter testes em watch mode
npm test -- --watch
```

---

*Documentação atualizada em 2026 — Projeto Cartola Odds Frontend.*
