# Documentação Técnica — Cartola Odds Frontend

> **Stack:** Angular 17 · TypeScript 5.4 · SCSS · RxJS 7.8  
> **Versão:** 1.0.0

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
11. [Design System](#11-design-system)
12. [Proxy de Desenvolvimento](#12-proxy-de-desenvolvimento)
13. [Build e Deploy](#13-build-e-deploy)

---

## 1. Arquitetura

O projeto segue o padrão **Feature-based com Standalone Components** do Angular 17. Não usa NgModules — cada componente declara seus próprios imports.

```
app/
├── core/           # Infraestrutura transversal (interceptors)
├── shared/         # Modelos e componentes reutilizáveis
└── features/       # Domínios de negócio isolados
    ├── time/
    ├── ranking/
    └── favoritos/
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

## 11. Design System

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

## 12. Proxy de Desenvolvimento

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

## 13. Build e Deploy

### Comandos

```bash
npm start          # Dev server com proxy (porta 4200)
npm run build      # Build de produção em dist/cartolaoddsfe/
npm test           # Testes com Karma/Jasmine
```

### `angular.json` — Builder

Usa o novo builder esbuild (`@angular-devkit/build-angular:application`), padrão do Angular 17:

- **Output:** `dist/cartolaoddsfe/`
- **Entry:** `src/main.ts`
- **Styles:** `src/styles.scss`
- **Polyfills:** `zone.js`
- **Output hashing:** habilitado em produção

### Variáveis de Ambiente

Não há `environment.ts` — a URL do backend é definida diretamente nos serviços como `/api` e resolvida pelo proxy em dev ou pelo servidor web em produção.

Para produção, configure o servidor web (nginx/Apache) para redirecionar `/api/*` → `http://backend:8080/api/*`.

---

*Documentação gerada em 2025 — Projeto Cartola Odds Frontend.*
