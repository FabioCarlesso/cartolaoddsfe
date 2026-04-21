# Cartola Odds — Frontend

> Dashboard Angular para montar times estratégicos no Cartola FC com base em odds e métricas de atletas.

---

## Visão Geral

Interface web que consome a [Cartola Odds API](https://github.com/FabioCarlesso) e apresenta:

- **Time ideal da rodada** em formação 4-3-3 visual
- **Ranking de atletas** por score ponderado com filtros por posição
- **Análise de favoritos** com odds, probabilidades implícitas e jogos descartados

---

## Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| Angular | 17.3 | Framework principal (standalone components) |
| TypeScript | 5.4 | Linguagem |
| RxJS | 7.8 | Gerenciamento de fluxos assíncronos |
| Angular Router | 17.3 | Roteamento com lazy loading |
| Angular HttpClient | 17.3 | Comunicação HTTP com o backend |
| SCSS | — | Estilização com CSS custom properties |

---

## Pré-requisitos

- Node.js 18+
- npm 9+
- Backend **Cartola Odds API** rodando em `http://localhost:8080`

---

## Como Executar

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar em modo desenvolvimento (com proxy para o backend)
npm start

# 3. Acessar no browser
open http://localhost:4200
```

> O `npm start` usa `proxy.conf.json` que redireciona `/api` → `http://localhost:8080`, evitando problemas de CORS em desenvolvimento.

### Build de Produção

```bash
npm run build
# Artefatos em dist/cartolaoddsfe/
```

---

## Rotas

| URL | Tela |
|---|---|
| `/time` | Time ideal com formação 4-3-3 |
| `/ranking` | Ranking de atletas com filtros |
| `/favoritos` | Análise de odds e favoritos |

---

## Estrutura do Projeto

```
src/
├── main.ts                          # Bootstrap standalone
├── index.html
├── styles.scss                      # Design system: variáveis CSS globais
└── app/
    ├── app.config.ts                # Providers: router, http, interceptor
    ├── app.routes.ts                # Rotas com lazy loading
    ├── app.component.*              # Shell: navbar + router-outlet
    ├── core/
    │   └── interceptors/
    │       └── error.interceptor.ts # Tratamento global de erros HTTP
    ├── shared/
    │   ├── models/                  # Interfaces TypeScript (Atleta, Time, Ranking, Favoritos)
    │   └── components/
    │       ├── loading-spinner/     # Spinner animado
    │       └── alert-banner/        # Banners de aviso/erro/sucesso
    └── features/
        ├── time/
        │   ├── services/time.service.ts
        │   ├── components/
        │   │   ├── player-card/     # Card de atleta com score, dúvida, capitão
        │   │   └── team-view/       # Campo visual 4-3-3
        │   └── pages/time-page/
        ├── ranking/
        │   ├── services/ranking.service.ts
        │   └── pages/ranking-page/  # Tabela com filtros
        └── favoritos/
            ├── services/favoritos.service.ts
            └── pages/favoritos-page/ # Cards de partidas + probabilidades
```

---

## Conexão com o Backend

Todos os serviços apontam para `/api` (proxiado para `localhost:8080/api` em dev):

| Serviço | Endpoint |
|---|---|
| `TimeService` | `GET /api/time` |
| `RankingService` | `GET /api/ranking?posicao=X&limite=N` |
| `FavoritosService` | `GET /api/favoritos?oddLimite=X` |

---

## Design System

Paleta de cores definida em `src/styles.scss` via CSS custom properties:

| Variável | Cor | Uso |
|---|---|---|
| `--bg-primary` | `#0a0f1a` | Fundo principal |
| `--bg-card` | `#1a2332` | Cards |
| `--green-primary` | `#22c55e` | Destaque principal, score, favorito |
| `--gold` | `#f59e0b` | Capitão, alertas |
| `--red` | `#ef4444` | Erros, risco |
| `--text-primary` | `#f1f5f9` | Texto principal |
| `--text-muted` | `#64748b` | Texto secundário |

---

## Testes

O projeto usa **Karma + Jasmine** com cobertura em todas as camadas.

```bash
# Executar todos os testes (headless)
npm test

# Cobertura de código
npm test -- --code-coverage
# Relatório em coverage/cartolaoddsfe/index.html
```

### Cobertura por camada

| Arquivo de teste | Camada | Cenários |
|---|---|---|
| `app.component.spec.ts` | Shell | Navbar, links, router-outlet |
| `error.interceptor.spec.ts` | Core | Status 0, 400, 422, 502, 500, sucesso |
| `loading-spinner.component.spec.ts` | Shared | message, fullPage, spinner DOM |
| `alert-banner.component.spec.ts` | Shared | type, icon, classes CSS, message |
| `time.service.spec.ts` | Service | GET /api/time, dados, erros HTTP |
| `ranking.service.spec.ts` | Service | GET /api/ranking, params posicao/limite, erros |
| `favoritos.service.spec.ts` | Service | GET /api/favoritos, oddLimite opcional, erros |
| `player-card.component.spec.ts` | Component | scorePercent, captain, dúvida, substituto, valorizacao |
| `team-view.component.spec.ts` | Component | Filtros por posição, defensores LAT-ZAG-ZAG-LAT, capitão, reserva luxo |
| `time-page.component.spec.ts` | Page | Load, erro, métricas calculadas, avisoMercado |
| `ranking-page.component.spec.ts` | Page | Filtros, scorePercent, erro, avisoMercado |
| `favoritos-page.component.spec.ts` | Page | probFavorito, probEmpate, reset, cards DOM |

---

## Documentação Adicional

- [`docs/documentacao.md`](./docs/documentacao.md) — documentação técnica completa do frontend
- [`docs/context.md`](./docs/context.md) — contexto do projeto para desenvolvimento assistido por IA
