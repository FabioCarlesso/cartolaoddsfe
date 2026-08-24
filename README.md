# Cartola Odds — Frontend

> Dashboard Angular para montar times estratégicos no Cartola FC com base em odds e métricas de atletas.

---

## Visão Geral

Interface web que consome a [Cartola Odds API](https://github.com/FabioCarlesso) e apresenta:

- **Time ideal da rodada** em formação 4-3-3 visual, com orçamento máximo opcional (cartoletas) — o time é sempre o de maior score, e quando há orçamento, o maior score possível dentro do teto — custo total e barra de saldo
- **Ranking de atletas** por score ponderado com filtros por posição, opção de excluir jogadores em dúvida e indicador de consistência (desvio padrão)
- **Análise de favoritos** com odds, probabilidades implícitas e jogos descartados
- **Comparação de formações** que monta o melhor time em até 5 formações ao mesmo tempo, ranqueia por score total e permite aplicar a formação escolhida na configuração global
- **Painel de configurações** para ajustar parâmetros de negócio (odd limite, pesos do score, formação) e gerenciar cache em runtime

---

## Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| Angular | 21.2 | Framework principal (standalone components) |
| TypeScript | 5.9 | Linguagem |
| RxJS | 7.8 | Gerenciamento de fluxos assíncronos |
| Angular Router | 21.2 | Roteamento com lazy loading |
| Angular HttpClient | 21.2 | Comunicação HTTP com o backend |
| SCSS | — | Estilização com CSS custom properties |

---

## Pré-requisitos

- Node.js 20+
- npm 10+
- Backend **Cartola Odds API** rodando em `http://localhost:8080`
- Docker + Docker Compose *(para execução containerizada)*

---

## Como Executar

### Desenvolvimento local

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
# Artefatos em dist/cartolaoddsfe/browser/
```

---

## Docker

### Início rápido

```bash
# 1. Copiar e configurar variáveis de ambiente
cp .env.example .env

# 2. Subir o container
docker compose up -d

# 3. Acessar
open http://localhost:4200
```

### Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `BACKEND_URL` | `http://host.docker.internal:8080` | URL do backend Cartola Odds API |
| `APP_PORT` | `4200` | Porta exposta no host |

### Comandos úteis

```bash
docker compose up -d             # Subir em background
docker compose up -d --build     # Rebuild após mudança de código
docker compose logs -f frontend  # Ver logs em tempo real
docker compose down              # Parar e remover containers
docker compose ps                # Verificar status e healthcheck

# Build manual da imagem
docker build -t cartola-odds-frontend:1.0.0 .

# Executar sem Compose (Linux: --add-host para resolver host.docker.internal)
docker run -p 4200:80 \
  --add-host=host.docker.internal:host-gateway \
  -e BACKEND_URL=http://host.docker.internal:8080 \
  cartola-odds-frontend:1.0.0
```

### Arquivos Docker

| Arquivo | Descrição |
|---|---|
| `Dockerfile` | Build multi-stage: Node 20 (build) + nginx 1.27 (runtime) |
| `nginx.conf.template` | Config nginx com proxy `/api` e headers de segurança |
| `docker-compose.yml` | Orquestração com healthcheck e resource limits |
| `.env.example` | Template de variáveis — copiar para `.env` antes de usar |
| `.dockerignore` | Exclui `node_modules/`, `dist/`, specs e docs do contexto |

### Acesso ao backend em localhost

O container não pode usar `localhost` para atingir o host. A solução é `host.docker.internal`:

- **Docker Desktop (Mac/Windows):** resolve automaticamente.
- **Linux:** o `docker-compose.yml` já inclui `extra_hosts: ["host.docker.internal:host-gateway"]`, que mapeia o nome para o IP do host — nenhuma configuração extra é necessária.

Se o backend rodar em `localhost:8080`, o padrão `BACKEND_URL=http://host.docker.internal:8080` funciona em qualquer plataforma.

### Decisões de design

- **Multi-stage build** — imagem final usa apenas nginx alpine (~25 MB vs ~300 MB com Node)
- **Usuário não-root** — container roda como `appuser` por segurança
- **`envsubst`** — `BACKEND_URL` substituído em runtime no `nginx.conf.template`
- **Proxy nginx** — `/api/*` proxiado para o backend; sem CORS em produção
- **`extra_hosts`** — `host.docker.internal` mapeado para o host em Linux via `host-gateway`
- **Cache de assets** — JS/CSS/fontes com `Cache-Control: public, immutable, 1y`
- **Gzip** — compressão habilitada para todos os tipos de texto

---

## Rotas

| URL | Tela |
|---|---|
| `/time` | Time ideal com formação 4-3-3 |
| `/ranking` | Ranking de atletas com filtros |
| `/favoritos` | Análise de odds e favoritos |
| `/comparar` | Comparação do melhor time entre múltiplas formações, ranqueadas por score total |
| `/historico` | Histórico de escalações por rodada com comparativo score sugerido × pontuação real |
| `/historico/:rodadaId` | Detalhe da escalação de uma rodada (titulares, reservas e gráficos) |
| `/admin` | Configurações de negócio e gerenciamento de cache |

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
    │   ├── models/                  # Interfaces TypeScript (Atleta, Time, Ranking, Favoritos, Historico, Comparacao)
    │   ├── utils/                   # consistencia.util (badge), performance.util (delta), score-info.util, time-mapper.util, formacao.util
    │   └── components/
    │       ├── loading-spinner/     # Spinner animado
    │       ├── alert-banner/        # Banners de aviso/erro/sucesso
    │       ├── consistencia-badge/  # Badge de consistência (🟢🟡🔴⚪) com tooltip
    │       └── orcamento-input/     # Input reutilizável de orçamento (cartoletas) com validação
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
        ├── favoritos/
        │   ├── services/favoritos.service.ts
        │   └── pages/favoritos-page/ # Cards de partidas + probabilidades
        ├── comparacao/
        │   ├── services/comparacao.service.ts # GET /api/time/comparar
        │   └── pages/comparacao-page/ # Chips de formação + cards ranqueados + detalhe colapsável
        ├── historico/
        │   ├── services/historico.service.ts # GET lista/detalhe, POST atualizar-pontuacao
        │   └── pages/
        │       ├── historico-page/           # Listagem de rodadas + gráfico de evolução
        │       └── historico-detalhe-page/   # Tabelas titulares/reservas + gráfico de barras
        └── admin/
            ├── services/
            │   ├── configuracao.service.ts  # GET/PATCH /api/config, POST /api/config/reset
            │   └── cache.service.ts         # DELETE /api/cache e /api/cache/{nome}
            └── pages/admin-page/            # Formulário de config + painel de cache
```

---

## Conexão com o Backend

Todos os serviços apontam para `/api` (proxiado para `localhost:8080/api` em dev):

| Serviço | Endpoint |
|---|---|
| `TimeService` | `GET /api/time?orcamento=X` (orçamento opcional) |
| `RankingService` | `GET /api/ranking?posicao=X&limite=N&excluirDuvida=true` (excluirDuvida opcional) |
| `FavoritosService` | `GET /api/favoritos?oddLimite=X` |
| `HistoricoService` | `GET /api/historico`, `GET /api/historico/{rodadaId}`, `POST /api/historico/{rodadaId}/atualizar-pontuacao` |
| `ConfiguracaoService` | `GET /api/config`, `PATCH /api/config`, `POST /api/config/reset` |
| `CacheService` | `DELETE /api/cache`, `DELETE /api/cache/{nome}` |

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
| `consistencia.util.spec.ts` | Util | Faixas de desvio, badge neutro, tooltip |
| `consistencia-badge.component.spec.ts` | Shared | Cores por faixa, badge neutro, toggle do tooltip |
| `orcamento-input.component.spec.ts` | Shared | Validação (>0), limpar, two-way binding, submit no Enter |
| `error.interceptor.spec.ts` | Core | Status 0, 400, 422, 502, 500, sucesso |
| `loading-spinner.component.spec.ts` | Shared | message, fullPage, spinner DOM |
| `alert-banner.component.spec.ts` | Shared | type, icon, classes CSS, message |
| `time.service.spec.ts` | Service | GET /api/time, param orçamento, campos de custo/estratégia, capitão nulo, erros HTTP |
| `ranking.service.spec.ts` | Service | GET /api/ranking, params posicao/limite/excluirDuvida, erros |
| `favoritos.service.spec.ts` | Service | GET /api/favoritos, oddLimite opcional, erros |
| `time-mapper.util.spec.ts` | Util | mapAtleta (clube/sinônimos/dúvida/substituto), mapTimeResponse (flatten, defaults) |
| `formacao.util.spec.ts` | Util | Formações válidas, limites 2–5, conversão formação → config, validação |
| `comparacao.service.spec.ts` | Service | GET /api/time/comparar, param formacoes/orçamento, ordenação, indisponível, melhorFormacao |
| `comparacao-page.component.spec.ts` | Page | Chips (2–5), comparar, expandir único, medalhas, modal "Usar formação" + PATCH/redirect, persistência |
| `player-card.component.spec.ts` | Component | scorePercent, critério do score, captain, dúvida, substituto, valorizacao, badge de consistência |
| `team-view.component.spec.ts` | Component | Filtros por posição, defensores LAT-ZAG-ZAG-LAT, capitão, reserva luxo |
| `time-page.component.spec.ts` | Page | Load, erro, métricas, avisoMercado, orçamento (validação/barra/estratégia/avisoOrcamento) |
| `ranking-page.component.spec.ts` | Page | Filtros, scorePercent, critério por posição, ordem da API, badge de consistência, erro, avisoMercado |
| `favoritos-page.component.spec.ts` | Page | probFavorito, probEmpate, reset, cards DOM |
| `configuracao.service.spec.ts` | Service | GET /api/config, PATCH, POST reset, erros |
| `cache.service.spec.ts` | Service | DELETE /api/cache, DELETE /{nome}, erro 400 |
| `admin-page.component.spec.ts` | Page | Load config, salvar, resetar, cache, validação pesos, validação pesoDesvio |

---

## Documentação Adicional

- [`docs/documentacao.md`](./docs/documentacao.md) — documentação técnica completa do frontend
- [`docs/context.md`](./docs/context.md) — contexto do projeto para desenvolvimento assistido por IA

---

## Licença

Distribuído sob a licença MIT. Veja [`LICENSE`](./LICENSE) para o texto completo.
