# Documentação Técnica — Cartola Odds Frontend

> **Stack:** Angular 21 · TypeScript 5.9 · SCSS · RxJS 7.8 · Docker · nginx  
> **Versão:** 1.3.0

---

## Índice

1. [Arquitetura](#1-arquitetura)
2. [Configuração e Bootstrap](#2-configuração-e-bootstrap)
3. [Roteamento](#3-roteamento)
4. [Autenticação e Sessão](#4-autenticação-e-sessão)
5. [Interceptor de Erros](#5-interceptor-de-erros)
6. [Modelos de Dados](#6-modelos-de-dados)
7. [Serviços HTTP](#7-serviços-http)
8. [Componentes Compartilhados](#8-componentes-compartilhados)
9. [Feature: Time](#9-feature-time)
10. [Feature: Ranking](#10-feature-ranking)
11. [Feature: Favoritos](#11-feature-favoritos)
12. [Feature: Admin (Config + Cache)](#12-feature-admin-config--cache)
13. [Feature: Usuários](#13-feature-usuários)
14. [Design System](#14-design-system)
15. [Proxy de Desenvolvimento](#15-proxy-de-desenvolvimento)
16. [Build e Deploy](#16-build-e-deploy)
17. [Docker](#17-docker)
18. [Testes](#18-testes)
19. [Feature: Landing Pública](#19-feature-landing-pública)

---

## 1. Arquitetura

O projeto segue o padrão **Feature-based com Standalone Components** do Angular 21. Não usa NgModules — cada componente declara seus próprios imports.

```
app/
├── core/           # Infraestrutura transversal (auth, guards, interceptors)
├── shared/         # Modelos e componentes reutilizáveis
└── features/       # Domínios de negócio isolados
    ├── auth/       # Login, acesso restrito e troca de senha
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
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimations()
  ]
};
```

| Provider | Função |
|---|---|
| `provideRouter` | Habilita roteamento com input binding |
| `provideHttpClient` | HTTP com os interceptors funcionais, na ordem de execução |
| `provideAnimations` | Suporte a animações Angular |

A ordem do array de `withInterceptors` é a ordem de execução **da requisição**: o `authInterceptor`
vem primeiro e, por isso, fica mais externo. Na volta o erro sobe na ordem inversa, então quem vê o
erro primeiro é o `errorInterceptor` — que traduz a mensagem e devolve a **mesma instância** de
`HttpErrorResponse`. Isso não é detalhe de estilo: o `authInterceptor` reconhece o `401` de sessão
pelo `instanceof`, e uma cópia (`{ ...error }`) o desligaria em silêncio, deixando o usuário ver
"Sessão expirada" sem nunca ser deslogado.

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

| Path | Componente carregado | Guarda |
|---|---|---|
| `/` | `LandingPageComponent` | `visitanteGuard` |
| `/login` | `LoginPageComponent` | — |
| `/403` | `ForbiddenPageComponent` | — |
| `/time` | `TimePageComponent` | `authGuard` |
| `/ranking` | `RankingPageComponent` | `authGuard` |
| `/favoritos` | `FavoritosPageComponent` | `authGuard` |
| `/comparar` | `ComparacaoPageComponent` | `authGuard` |
| `/historico` | `HistoricoPageComponent` | `authGuard` |
| `/historico/:rodadaId` | `HistoricoDetalhePageComponent` | `authGuard` |
| `/admin` | `AdminPageComponent` | `authGuard` + `roleGuard(['ADMIN'])` |
| `/usuarios` | `UsuariosPageComponent` | `authGuard` + `roleGuard(['ADMIN'])` |
| `/usuarios/novo` | `UsuarioFormPageComponent` | `authGuard` + `roleGuard(['ADMIN'])` |
| `/usuarios/:id` | `UsuarioFormPageComponent` | `authGuard` + `roleGuard(['ADMIN'])` |
| `/alterar-senha` | `AlterarSenhaPageComponent` | `authGuard` |
| `**` | Redireciona para `/` | — |

A raiz é pública e traz o próprio cabeçalho e rodapé, então declara `data: { layoutFluido: true }`
— o `AppComponent` lê esse dado a cada `NavigationEnd` e sai da frente (ver [Shell](#shell)).

Uma URL desconhecida cai em `/`, e não em `/time`: com sessão, o `visitanteGuard` encaminha ao
time; sem sessão, o visitante para na landing em vez de numa tela de login sem contexto.

---

## 4. Autenticação e Sessão

A API exige JWT em todos os endpoints, com uma única exceção pública: `POST /api/auth/login`.
Os usuários são criados por um administrador — não existe auto-cadastro.

### `core/models/auth.model.ts`

| Tipo | Conteúdo |
|---|---|
| `Perfil` | `'ADMIN' \| 'USER'` |
| `LoginRequest` | `email`, `senha` |
| `LoginResponse` | `accessToken`, `tipo`, `expiraEmSegundos`, `nome`, `perfil` |
| `AlterarSenhaRequest` | `senhaAtual`, `novaSenha` |
| `SessaoUsuario` | `usuarioId`, `email`, `nome`, `perfil` |

### `core/services/auth.service.ts`

O estado da sessão é exposto por signals — `usuarioAtual`, `autenticado` e `perfilAtual` —
consumidos direto no template do shell.

O **token é a fonte de verdade**: `usuarioId`, `email` e `perfil` saem dos claims do próprio
JWT (`usuarioId`, `sub` e `perfil`), não de um objeto guardado ao lado dele. Só o `nome` vem
do corpo do login, porque o token não o carrega; sem ele, o e-mail é exibido no lugar.

Uma sessão só é considerada válida quando o token existe, decodifica, traz um `perfil`
conhecido e ainda não expirou. A expiração é reconferida a cada `isAuthenticated()` — e não
apenas no boot — porque o token vence com a aba aberta.

| Método | Comportamento |
|---|---|
| `login(request)` | `POST /api/auth/login`, persiste o token e monta a sessão a partir dele |
| `alterarSenha(request)` | `PATCH /api/usuarios/me/senha` |
| `logout()` | Limpa a sessão e navega para `/login` |
| `encerrarSessaoExpirada()` | Limpa a sessão e navega para `/login?expirada=1` |
| `encerrarSessaoAposTrocaDeSenha()` | Limpa a sessão e navega para `/login?senhaAlterada=1` |
| `consumirTokenDescartado()` | Diz, uma única vez, se a última limpeza veio de um token que não valia mais |
| `isAuthenticated()` | Revalida o token (existência, claims e expiração) |
| `getUsuarioAtual()` / `getPerfilAtual()` / `isAdmin()` | Leitura da sessão corrente |

**Persistência.** Token e nome ficam em `localStorage` (`cartolaodds.accessToken` e
`cartolaodds.nome`). Todo acesso é protegido: em navegador com storage de site bloqueado a
leitura lança, e nesse caso a sessão passa a viver em memória — o usuário entra e navega
normalmente, apenas perde o login ao recarregar a página. A alternativa mais segura seria
cookie `HttpOnly` + CSRF, descartada aqui pelo custo frente ao perfil de uso (aplicação
pessoal, sem dados de terceiros).

### `core/interceptors/auth.interceptor.ts`

Adiciona `Authorization: Bearer <token>` em toda requisição, exceto `/api/auth/login`.

No `401` fora do login, encerra a sessão e leva a `/login?expirada=1`. Isso é seguro neste
backend porque, fora do login, o `401` só nasce do `ErroSegurancaHandler` e sempre pelo mesmo
motivo — o token não vale mais (ausente, expirado, assinatura inválida, ou revogado por troca
de senha ou desativação do usuário). Credencial inválida é `401` apenas no login, e senha
atual errada na troca de senha é `422`. O `403` é permissão insuficiente com sessão válida e,
por isso, **não** desloga ninguém.

### `core/guards/auth.guard.ts`

Barra as rotas internas e guarda a URL pretendida em `?redirect=`, para devolver o usuário a
ela após o login. A tela de login só aceita destinos internos: um `redirect` absoluto ou
iniciado por `//` é ignorado, para que a rota não vire trampolim para outro domínio.

Quando o token existe mas não vale mais, o guard acrescenta `expirada=1` — e esse é o caminho
mais comum, porque quem volta com a sessão vencida é barrado aqui, antes de qualquer chamada
tomar `401`. Sem isso o usuário caía numa tela de login sem nenhuma explicação. O aviso é
consumido uma única vez (`consumirTokenDescartado()`), para não reaparecer numa visita
posterior ao login.

### `core/guards/role.guard.ts`

`roleGuard(perfis)` restringe a rota aos perfis informados: sem sessão manda para `/login`
(com os mesmos parâmetros montados pelo `authGuard`), e com sessão de perfil errado manda
para `/403`.

Isto é defesa de **experiência**, não de segurança: quem editar o `localStorage` chega à
tela, mas a API recusa a operação. A autorização real é sempre a do `SecurityConfig` no
backend.

### `core/guards/visitante.guard.ts`

Inverso do `authGuard`: libera a rota apenas para quem **não** tem sessão. Quem já está logado e
abre `/` — o bookmark mais comum de quem usa o app todo dia — recebe um `UrlTree` para `/time`,
em vez da página de apresentação.

```typescript
export const visitanteGuard: CanActivateFn = () =>
  authService.isAuthenticated() ? router.createUrlTree(['/time']) : true;
```

### `features/auth/pages/`

| Página | Rota | Papel |
|---|---|---|
| `login-page` | `/login` | Formulário reativo (e-mail e senha), estado de carregamento, erro de credencial, aviso de sessão expirada e confirmação de troca de senha |
| `forbidden-page` | `/403` | Aviso de acesso restrito, com volta para `/time` |
| `alterar-senha-page` | `/alterar-senha` | Troca da própria senha; como o backend invalida o token na operação, o fluxo termina em logout — a confirmação aparece na tela de login, porque a navegação acontece no mesmo instante |

### Shell

O `AppComponent` esconde a navegação inteira sem sessão e, com sessão, exibe o nome do usuário
(atalho para `/alterar-senha`) e o botão **Sair**. Os itens "Config" e "Usuários" só aparecem
para o perfil `ADMIN`.

Rotas marcadas com `data: { layoutFluido: true }` — hoje só a landing — trazem o próprio
cabeçalho e o próprio rodapé, e o shell esconde os seus. O `AppComponent` acompanha o dado da
rota mais profunda a cada `NavigationEnd` (`layoutFluido`, um `toSignal` sobre `router.events`),
em vez de comparar a URL: uma nova rota fluida só precisa declarar o `data`.

Como ADMIN o cabeçalho carrega sete links mais o nome e o **Sair**, e por isso degrada em
etapas: até 1120px aperta o espaçamento, até 1000px deixa os links só com o ícone, até 640px
esconde também o nome do usuário e, até 480px, o texto da marca. Sem essas etapas a página
inteira ganhava scroll horizontal e o **Sair** saía da tela.

---

## 5. Interceptor de Erros

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
| `401` | `E-mail ou senha inválidos.` no login; `Sessão expirada. Entre novamente.` nas demais chamadas |
| `403` | `Você não tem permissão para esta ação.` |
| `409` | Conflito de regra (usa `error.mensagem`: e-mail repetido, último administrador ativo) |
| `422` | Pool vazio — ODD_LIMITE restritivo ou sem API Key (usa `error.mensagem` quando presente) |
| `429` | Freio de força bruta do backend (usa `error.mensagem`, que informa quanto falta) |
| `502` | Falha na API externa (Cartola FC ou Odds API) |
| `5xx` | Erro interno do servidor |

---

## 6. Modelos de Dados

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
  descricaoScore?: string;
  pesosScore?: Record<string, number> | Array<{ nome: string; peso: number; descricao?: string }>;
  desvioPadrao?: number;        // desvio padrão do score nas últimas rodadas
  rodadasConsideradas?: number; // nº de rodadas usadas no cálculo do desvio
  emDuvida: boolean;
  status?: string;
  substitutoProvavel?: Atleta;
}
```

Os campos `desvioPadrao` e `rodadasConsideradas` são retornados pela API (`/api/time` e `/api/ranking`) com esses nomes oficiais e alimentam o **indicador de consistência** (ver `ConsistenciaBadgeComponent` na seção 7). Quando `rodadasConsideradas < 2` (ex.: início de temporada, sem histórico) o desvio não é calculável e o frontend exibe um badge neutro ⚪.

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
  pesosScorePorPosicao?: Record<string, Record<string, number>>;
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

## 7. Serviços HTTP

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

## 8. Componentes Compartilhados

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

### `ConsistenciaBadgeComponent`

Seletor: `app-consistencia-badge`

Indicador visual de consistência do atleta baseado no desvio padrão do score.

| Input | Tipo | Descrição |
|---|---|---|
| `desvioPadrao` | `number \| null` | Desvio padrão do score do atleta |
| `rodadasConsideradas` | `number \| null` | Nº de rodadas usadas no cálculo |

A classificação é centralizada em `shared/utils/consistencia.util.ts` →
`getConsistenciaBadge(desvioPadrao, rodadasConsideradas)`:

| Faixa de desvio | Badge | `level` |
|---|---|---|
| `0.0 – 2.0` | 🟢 Consistente | `consistente` |
| `2.1 – 4.0` | 🟡 Moderado | `moderado` |
| `> 4.0` | 🔴 Instável | `instavel` |
| `rodadasConsideradas < 2` | ⚪ Histórico insuficiente | `indisponivel` |

O tooltip (`Desvio padrão: X` + `Baseado nas últimas N rodadas`) abre ao passar o
mouse (desktop) e ao tocar/clicar (mobile), fechando ao clicar fora ou perder o foco.
Usado nas telas de **Ranking** (inline na célula de score) e **Time** (ao lado do
score em cada `PlayerCardComponent`, cobrindo titulares e reservas).

---

## 9. Feature: Time

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

## 10. Feature: Ranking

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

## 11. Feature: Favoritos

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

## 12. Feature: Admin (Config + Cache)

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
| `pesoDesvio` | `number` | 0.0 – 1.0 (penalidade de inconsistência; padrão 0.05) |
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

> `pesoDesvio` é uma penalidade independente da soma dos pesos. É validado por faixa
> (`pesoDesvioValido`): fora de `0.0 – 1.0` o frontend exibe erro inline e desabilita
> o botão **Salvar Alterações**.

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
  pesoDesvio: number;
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

## 13. Feature: Usuários

Tela de administração dos acessos, restrita a `ADMIN`. Sem ela, criar um acesso exigiria
`curl` ou o Swagger — que fica desabilitado em produção.

### Estrutura

```
core/models/usuario.model.ts              ← Usuario, UsuarioRequest, UsuarioUpdateRequest, Pagina<T>
features/usuarios/
├── services/usuario.service.ts           ← /api/usuarios
└── pages/
    ├── usuarios-page/                    ← listagem + ativar/desativar
    └── usuario-form-page/                ← criação e edição
```

### `UsuarioService`

| Método | Chamada |
|---|---|
| `listar()` | `GET /api/usuarios?size=100&sort=nome` |
| `buscarPorId(id)` | `GET /api/usuarios/{id}` |
| `criar(request)` | `POST /api/usuarios` |
| `atualizar(id, request)` | `PATCH /api/usuarios/{id}` |
| `desativar(id)` | `DELETE /api/usuarios/{id}` (desativa; o cadastro permanece) |
| `ativar(id)` | `PATCH /api/usuarios/{id}` com `{ ativo: true }` |

A API pagina em 20 por padrão, mas esta é uma aplicação pessoal com um punhado de acessos:
pedir 100 de uma vez evita construir uma paginação que nunca teria segunda página. O
`totalElementos` do envelope continua exibido, então o dia em que a lista passar disso a tela
mostra a diferença.

### `UsuariosPageComponent`

Tabela com nome, e-mail, perfil, situação e data de cadastro; a linha do próprio usuário
logado é marcada. Cada linha oferece **Editar** e **Desativar** (ou **Ativar**, se já estiver
inativo).

A desativação passa por um modal de confirmação — mesma preocupação da issue #28 sobre
invalidar cache sem confirmar. A reativação não confirma nada: é a ação que devolve acesso, não
a que tira.

### `UsuarioFormPageComponent`

O mesmo componente atende `/usuarios/novo` e `/usuarios/:id`. A senha só existe na criação:
o `PATCH` da API não a aceita, e o próprio usuário a troca em `/alterar-senha`. Nenhuma senha
é exibida em tela alguma, nem na listagem nem na edição.

Na edição, o `PATCH` leva **apenas os campos que mudaram** — a API trata campo ausente como
"deixe como está".

### Tratamento do `409`

| Situação | Mensagem exibida |
|---|---|
| Criar com e-mail existente | `E-mail já cadastrado.` |
| Editar para um e-mail existente | `E-mail já cadastrado.` |
| Rebaixar/desativar a própria conta de ADMIN | Mensagem da API |
| Rebaixar/desativar o último ADMIN ativo | Mensagem da API |

O `409` da criação só tem uma causa possível, então vira texto fixo. Na edição e na
desativação ele também pode vir das regras de administrador, e aí a mensagem da API é mais
informativa do que qualquer texto fixo do frontend.

---

## 14. Design System  

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

## 15. Proxy de Desenvolvimento

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

## 16. Build e Deploy

### Comandos

```bash
npm start          # Dev server com proxy (porta 4200)
npm run build      # Build de produção em dist/cartolaoddsfe/
npm test           # Testes com Karma/Jasmine
```

### `angular.json` — Builder

Usa o builder esbuild (`@angular-devkit/build-angular:application`), padrão do Angular 21:

- **Output:** `dist/cartolaoddsfe/`
- **Entry:** `src/main.ts` (navegador) e `src/main.server.ts` (prerender)
- **Styles:** `src/styles.scss`
- **Polyfills:** `zone.js`
- **Output hashing:** habilitado em produção

### Prerender da landing (SSG)

A rota `/` é pré-renderizada no build: o HTML da landing sai pronto do `npm run build`, sem
esperar o bootstrap do Angular no navegador. Não há servidor Node em produção — `ssr` fica
desligado e o deploy continua sendo o nginx servindo arquivos estáticos.

```jsonc
// angular.json → architect.build.options
"server": "src/main.server.ts",
"prerender": { "discoverRoutes": false, "routesFile": "prerender-routes.txt" },
"ssr": false
```

`discoverRoutes: false` é deliberado: descobrir as rotas automaticamente faria o build tentar
pré-renderizar as telas internas, que exigem sessão e chamam a API — sem backend no build, elas
congelariam uma tela de erro no HTML. O `prerender-routes.txt` lista só a raiz.

O build gera **dois** HTML na pasta `browser/`:

| Arquivo | Conteúdo | Quem serve |
|---|---|---|
| `index.html` | Landing pré-renderizada, com as marcas de hidratação | `location = /` no nginx |
| `index.csr.html` | Shell com `<app-root></app-root>` vazio | Fallback de SPA das demais rotas |

A separação evita o efeito colateral do prerender: se o fallback devolvesse o `index.html`, quem
abrisse `/time` direto veria a landing por um instante antes de a aplicação assumir a tela.

O `provideClientHydration()` no `app.config.ts` faz o Angular reaproveitar o HTML pré-renderizado
em vez de descartá-lo e desenhar tudo de novo.

### Variáveis de Ambiente

Não há `environment.ts` — a URL do backend é definida diretamente nos serviços como `/api` e resolvida pelo proxy em dev ou pelo servidor web em produção.

Para produção, configure o servidor web (nginx/Apache) para redirecionar `/api/*` → `http://backend:8080/api/*`.

---

## 17. Docker

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
| Security headers | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` — definidos em `nginx-security-headers.conf` e incluídos em cada `location` do SPA. Em `/api/` valem os headers do Spring Security; o nginx só preenche como fallback quando gera a resposta sozinho (502/504). `X-XSS-Protection` não é enviado: o auditor XSS legado foi removido dos navegadores e o backend define `0` deliberadamente |

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

## 18. Testes

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

**Interceptors** — usam `HttpClient` real com o interceptor registrado via `withInterceptors([...])`: o `errorInterceptor` é verificado pelo campo `userMessage` nos erros, e o `authInterceptor` pelo header `Authorization` da requisição e pelo efeito colateral no `AuthService` e no `Router`.

**Guardas** — executadas com `TestBed.runInInjectionContext`, comparando o `UrlTree` devolvido com a rota esperada. O `roleGuard` é chamado já parametrizado: `roleGuard(['ADMIN'])(route, state)`.

### Cobertura dos Testes

| Arquivo de Teste | Cenários cobertos |
|---|---|
| `app.component.spec.ts` | Criação, navbar, links por perfil (Config e Usuários só para ADMIN), usuário logado, botão Sair, navegação escondida sem sessão |
| `auth.service.spec.ts` | Login, claims do token, restauração da sessão, token expirado/sem `perfil`/malformado, logout, sessão expirada, storage indisponível, troca de senha |
| `auth.interceptor.spec.ts` | Header presente/ausente, login sem header, `401` deslogando, `403` mantendo a sessão, demais status |
| `auth.guard.spec.ts` | Sessão válida, sem sessão (com e sem `redirect`), token expirado |
| `role.guard.spec.ts` | ADMIN permitido, USER para `/403`, múltiplos perfis aceitos, visitante e sessão expirada para `/login` |
| `usuario.service.spec.ts` | Listagem paginada e ordenada, busca por id, criação, `PATCH` parcial, desativar, reativar, `409` de e-mail e de último ADMIN |
| `usuarios-page.component.spec.ts` | Listagem, colunas, ausência de senha, confirmação antes de desativar, cancelamento, `409` do último ADMIN, reativação, erro de carga, estado vazio |
| `usuario-form-page.component.spec.ts` | Validação de e-mail e senha mínima, criação, edição sem campo de senha, `PATCH` só do que mudou, `409` de e-mail e das regras de ADMIN, erro de carga |
| `login-page.component.spec.ts` | Submissão válida, credencial inválida, estado de carregamento, aviso de sessão expirada, `redirect` interno e externo |
| `forbidden-page.component.spec.ts` | Mensagem de acesso restrito e volta para `/time` |
| `alterar-senha-page.component.spec.ts` | Senhas divergentes, senha curta, sucesso encerrando a sessão, `422` de senha atual incorreta |
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

---

## 19. Feature: Landing Pública

Arquivos: `src/app/features/landing/`

Página da raiz, dirigida a duas audiências ao mesmo tempo: o cartoleiro, que precisa entender em
segundos o que o sistema faz por ele, e quem avalia o projeto tecnicamente.

### Estrutura

```
features/landing/
├── _secao.scss                      # Mixins: faixa, faixa-interna, sobrancelha, título, foco
├── components/
│   ├── landing-topo/                # Barra pública: marca, "Como funciona", "Entrar"
│   ├── landing-hero/                # Proposta de valor, CTAs (login e GitHub)
│   ├── landing-como-funciona/       # Pipeline em 4 passos (#como-funciona)
│   ├── landing-funcionalidades/     # Cards das capacidades reais do sistema
│   ├── landing-prints/              # Galeria das telas (#telas)
│   ├── landing-tecnologia/          # Stack, decisões de arquitetura e os dois repositórios
│   └── landing-rodape/              # Autoria, licença e aviso de desvínculo
└── pages/landing-page/              # Compõe as faixas na ordem da página
```

Cada faixa é um componente próprio: o conteúdo da página muda com frequência e por motivos
diferentes (produto, stack, capturas), e separar mantém cada mudança em um arquivo só.

### Independência da API

**Nenhum componente da landing injeta serviço que chame `/api`.** É requisito, não detalhe: a
landing é a primeira tela de quem chega pelo link — inclusive de um recrutador — e é justamente
quando o backend pode estar desligado ou em cold start. O teste
`should render without issuing a single HTTP request` monta a página com o
`HttpTestingController` e chama `verify()`; qualquer requisição aberta reprova.

### Acessibilidade e SEO

- Um único `h1` (o título do hero); cada `<section>` nomeada por `aria-labelledby` apontando para
  um título existente.
- Foco visível em todos os links e botões (mixin `foco-visivel`): o anel padrão do Chrome é preto
  e sumiria no fundo escuro do tema.
- Textos de corpo em `--text-secondary`, e não em `--text-muted`, que não alcança os 4,5:1 da
  WCAG 1.4.3 nos tamanhos usados.
- `title`, `meta description`, Open Graph e Twitter Card ficam estáticos no `index.html`, e o
  título da landing é o que fica na aba da página pública. Cada rota interna declara o próprio
  `title` (ver [Roteamento](#3-roteamento)), senão esse texto de divulgação ficaria na aba de
  todas as telas do sistema.
- `robots.txt` (`src/robots.txt`) libera a raiz e bloqueia `/api/`.
- A landing é pré-renderizada no build (ver [Build e Deploy](#16-build-e-deploy)), então o
  crawler recebe o conteúdo no HTML — e o visitante vê a página antes de o Angular inicializar.

### Capturas das telas

As imagens de `src/assets/landing/` são das telas reais, capturadas contra uma API de
demonstração com dados fictícios. O procedimento e a regra de manutenção estão em
[`prints-da-landing.md`](./prints-da-landing.md).
