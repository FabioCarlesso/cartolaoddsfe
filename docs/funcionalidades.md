# Funcionalidades

> Comportamento de cada tela e do que a sustenta: sessão, erros, modelos, serviços, componentes
> compartilhados e as features. O mapa de rotas está em [`rotas.md`](rotas.md); as regras de
> negócio e o porquê delas, em [`context.md`](context.md).

- [Autenticação e Sessão](#autenticação-e-sessão)
- [Interceptor de Erros](#interceptor-de-erros)
- [Modelos de Dados](#modelos-de-dados)
- [Serviços HTTP](#serviços-http)
- [Componentes Compartilhados](#componentes-compartilhados)
- [Feature: Time](#feature-time)
- [Feature: Ranking](#feature-ranking)
- [Feature: Favoritos](#feature-favoritos)
- [Feature: Comparação de Formações](#feature-comparação-de-formações)
- [Feature: Histórico](#feature-histórico)
- [Feature: Admin (Config + Cache + Cota)](#feature-admin-config--cache--cota)
- [Feature: Usuários](#feature-usuários)
- [Feature: Landing Pública](#feature-landing-pública)

---

## Autenticação e Sessão

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
normalmente, apenas perde o login ao recarregar a página. O porquê dessa escolha de
armazenamento está em [Sessão e autorização](./context.md#sessão-e-autorização).

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

Isto é defesa de **experiência**, não de segurança — a autorização real é sempre a do
`SecurityConfig` no backend (ver
[Sessão e autorização](./context.md#sessão-e-autorização)).

### `core/guards/visitante.guard.ts`

Inverso do `authGuard`: libera a rota apenas para quem **não** tem sessão. Quem já está logado e
abre `/` recebe um `UrlTree` para `/time`, em vez da página de apresentação.

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

### `core/services/theme.service.ts`

Tema visual da aplicação — `'claro'` ou `'escuro'`.

| Membro | Função |
|---|---|
| `temaAtual` | Signal somente leitura com o tema em vigor |
| `escuro` | `computed` que o cabeçalho usa para decidir ícone e rótulo do botão |
| `alternar()` | Troca o tema e grava a escolha |
| `definir(tema)` | Fixa um tema específico e grava a escolha |

A escolha vive em `localStorage` (`cartolaodds.tema`) e o serviço escreve o atributo
`data-theme` no `<html>`, que é o que seleciona a paleta em `src/styles.scss`. Sem escolha
gravada, o tema segue o `prefers-color-scheme` do sistema — inclusive quando o usuário troca o
tema do sistema com a aba aberta. Depois do primeiro clique no botão, o sistema deixa de mandar.
A meta `theme-color` acompanha a troca, para a barra do navegador no celular não ficar escura
sobre uma tela clara.

O primeiro paint não passa por aqui: um script inline no `index.html` aplica a mesma decisão
antes de o Angular subir (ver [Design System](./context.md#design-system)).

### Shell

O `AppComponent` esconde a navegação inteira sem sessão e, com sessão, exibe o nome do usuário
(atalho para `/alterar-senha`) e o botão **Sair**. Os itens "Config", "Cota" e "Usuários" só
aparecem para o perfil `ADMIN`.

O botão de tema (`.btn-tema`) fica fora do bloco de sessão: aparece com ou sem login — a
preferência vale também para quem está na tela de entrada. Ele anuncia o destino da troca, não o
tema atual: no escuro mostra o sol e diz "Mudar para o tema claro".

Rotas marcadas com `data: { layoutFluido: true }` — hoje só a landing — trazem o próprio
cabeçalho e o próprio rodapé, e o shell esconde os seus. O `AppComponent` acompanha o dado da
rota mais profunda a cada `NavigationEnd` (`layoutFluido`, um `toSignal` sobre `router.events`),
em vez de comparar a URL: uma nova rota fluida só precisa declarar o `data`.

Como ADMIN o cabeçalho carrega sete links, o nome, o **Sair** e o botão de tema, e a barra não
cresce com a tela — o `.navbar-inner` para em 1200px. Por isso o espaçamento entre os links é
apertado em qualquer largura — assim como o limite de 130px no nome do usuário, que passa dali
em reticências —, e a degradação segue em etapas: até 1220px some a folga lateral, até 1150px os
links ficam só com o ícone, até 640px o nome do usuário some e, até 480px, o texto da marca (ver [Design System](./context.md#design-system)).

---

## Interceptor de Erros

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
| `5xx` | `Erro interno do servidor.` — **fixa: a `mensagem` do backend não é repassada** |

> O `5xx` é o único caso em que a mensagem do backend é descartada de propósito. Nos demais
> (`400`, `409`, `422`, `429`) o `mensagem` é um texto escrito para o usuário ler; num `500` o
> handler global da API cai no `getMessage()` da exceção, e isso já chegou à tela com o SQL e os
> nomes das colunas de uma falha de JDBC — não ajuda quem está olhando e descreve o schema para
> quem não deveria vê-lo.

---

## Modelos de Dados

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

Os campos `desvioPadrao` e `rodadasConsideradas` são retornados pela API (`/api/time` e `/api/ranking`) com esses nomes oficiais e alimentam o **indicador de consistência** (ver [`ConsistenciaBadgeComponent`](#consistenciabadgecomponent)). Quando `rodadasConsideradas < 2` (ex.: início de temporada, sem histórico) o desvio não é calculável e o frontend exibe um badge neutro ⚪ — ver [Indicador de Consistência](./context.md#indicador-de-consistência-desvio-padrão).

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

## Serviços HTTP

Todos usam `inject(HttpClient)` e são `providedIn: 'root'`. A URL base é sempre `/api` —
proxiada para `localhost:8080/api` em dev — e toda chamada sai com
`Authorization: Bearer <token>`, exceto o próprio login.

| Serviço | Endpoints |
|---|---|
| `AuthService` | `POST /api/auth/login`, `PATCH /api/usuarios/me/senha` (ver [Autenticação e Sessão](#autenticação-e-sessão)) |
| `UsuarioService` | `GET/POST /api/usuarios`, `GET/PATCH/DELETE /api/usuarios/{id}` — restrito a ADMIN (ver [Feature: Usuários](#feature-usuários)) |
| `TimeService` | `GET /api/time?orcamento=X` |
| `ComparacaoService` | `GET /api/time/comparar?formacoes=…&orcamento=X` |
| `RankingService` | `GET /api/ranking?posicao=X&limite=N&excluirDuvida=true` |
| `FavoritosService` | `GET /api/favoritos?oddLimite=X` |
| `HistoricoService` | `GET /api/historico`, `GET /api/historico/{rodadaId}`, `POST /api/historico/{rodadaId}/atualizar-pontuacao` |
| `ConfiguracaoService` | `GET /api/config`, `PATCH /api/config`, `POST /api/config/reset` |
| `CacheService` | `DELETE /api/cache`, `DELETE /api/cache/{nome}` |
| `CotaService` | `GET /api/odds/cota`, `GET /api/odds/cota/historico?dias=N` — restrito a ADMIN |

### `TimeService`

```typescript
getTime(orcamento?: number | null): Observable<TimeResponse>
// GET /api/time?orcamento=X  — sem o parâmetro, o time é o de maior score sem teto de custo
```

O backend retorna `titulares` e `reservas` agrupados por posição (`{ ATA: [], MEI: [], ... }`). O service aplica mapeamento interno antes de expor o `Observable<TimeResponse>`:

- `titulares`: objeto por posição → `Atleta[]` flat via `Object.values().flat()`
- `reservas`: objeto por posição (um atleta por chave) → `Atleta[]` via `Object.values()`
- `nomeClube` → `clube`
- `status` (string `"⚠️ Dúvida"`) → `emDuvida` (boolean)
- `substitutoProvavel` mapeado recursivamente

O mapeamento vive em `shared/utils/time-mapper.util.ts` (`mapAtleta` e `mapTimeResponse`), e não
no serviço, porque a comparação de formações reusa exatamente a mesma transformação.

### `ComparacaoService`

```typescript
comparar(formacoes: string[], orcamento?: number | null): Observable<CompararResponse>
// GET /api/time/comparar?formacoes=4-3-3&formacoes=3-4-3&orcamento=120
```

Um parâmetro `formacoes` por formação (de 2 a 5) e `orcamento` opcional. A resposta traz
`melhorFormacao` e `resultados` ordenados por `scoreTotal`, e passa pelo mesmo mapeamento do
`TimeService` antes de chegar ao componente. As regras da tela — seleção, salvaguarda de
composição, formação indisponível — estão em
[Comparação de Formações](./context.md#comparação-de-formações-comparar).

### `RankingService`

```typescript
getRanking(posicao?: string, limite = 25, excluirDuvida = false): Observable<RankingResponse>
// GET /api/ranking?posicao=X&limite=N&excluirDuvida=true
```

`excluirDuvida` só é enviado quando verdadeiro; `posicao` vazia lista todas as posições.

### `FavoritosService`

```typescript
getFavoritos(oddLimite?: number): Observable<FavoritosResponse>
// GET /api/favoritos?oddLimite=X
```

Quando `oddLimite` é `undefined`, o parâmetro não é enviado e o backend usa o valor padrão configurado em `application.properties`.

### `HistoricoService`

```typescript
getHistorico(): Observable<HistoricoResponse>
// GET /api/historico

getRodada(rodadaId: number): Observable<EscalacaoRodadaResponse>
// GET /api/historico/{rodadaId}

atualizarPontuacao(rodadaId: number): Observable<EscalacaoRodadaResponse>
// POST /api/historico/{rodadaId}/atualizar-pontuacao
```

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

### `CotaService`

```typescript
getCota(): Observable<CotaResponse>
// GET /api/odds/cota

getHistorico(dias?: number): Observable<CotaHistoricoResponse>
// GET /api/odds/cota/historico?dias=N  — sem o parâmetro, a API aplica o padrão de 30 dias
```

Os dois endpoints são restritos a `ADMIN`. A janela do histórico vai de 1 a 92 dias e a série
não é agregada (30 dias ≈ 500 leituras).

---

## Componentes Compartilhados

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

### `OrcamentoInputComponent`

Seletor: `app-orcamento-input`

Campo de orçamento em cartoletas, reusado pelas telas de Time e de Comparação.

| Input | Tipo | Padrão | Descrição |
|---|---|---|---|
| `orcamento` | `number \| null` | `null` | Valor atual; emparelhado com `orcamentoChange` para two-way binding |
| `label` | `string` | `'Orçamento máximo (cartoletas)'` | Rótulo do campo |
| `placeholder` | `string` | `'Ex: 120.0'` | Texto de exemplo |
| `inputId` | `string` | gerado | Id único por instância, para o `label[for]` não colidir quando há dois na mesma página |

| Output | Quando dispara |
|---|---|
| `orcamentoChange` | A cada digitação, já convertido para `number` ou `null` |
| `limpar` | Botão de limpar, que também zera o valor |
| `gerar` | Enter no campo, atalho para a ação principal da tela — só dispara com valor válido |

Valor `<= 0` é inválido (`invalido`): a tela exibe o erro inline e o Enter não aciona nada.
Campo vazio não é erro — significa "sem teto de orçamento".

---

## Feature: Time

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
- Marcadores de dúvida, capitão e reserva de luxo, com as regras em
  [Regras de Negócio Refletidas no Frontend](./context.md#regras-de-negócio-refletidas-no-frontend)

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

**Orçamento.** O [`OrcamentoInputComponent`](#orcamentoinputcomponent) alimenta o parâmetro
`orcamento` do `GET /api/time`, e o valor persiste em `sessionStorage` (`time.orcamento`) para
sobreviver a uma navegação. Com orçamento informado, a tela mostra a barra de saldo
(`custoTotal / orcamentoInformado` e `saldoRestante`), destacada quando o custo estoura o teto, e
o badge da `estrategia` devolvida pela API. O `avisoOrcamento` da resposta — quando o teto
apertou a escalação — aparece como banner de aviso, sem bloquear o time.

---

## Feature: Ranking

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

## Feature: Favoritos

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

## Feature: Comparação de Formações

Monta o melhor time em 2 a 5 formações ao mesmo tempo e ranqueia os resultados por `scoreTotal`,
com o detalhe de cada uma reusando o `app-team-view` da tela de Time.

A chamada e o mapeamento estão em [`ComparacaoService`](#comparacaoservice); as regras da tela —
seleção por chips, persistência em `sessionStorage`, medalhas, formação indisponível, o modal de
"Usar esta formação" e a salvaguarda de composição — estão em
[Comparação de Formações](./context.md#comparação-de-formações-comparar), porque são decisões de
negócio e não de componente.

---

## Feature: Histórico

Duas telas sobre as escalações já geradas: `/historico`, com uma rodada por card, e
`/historico/:rodadaId`, com a escalação inteira.

### `HistoricoPageComponent`

Lista as rodadas da mais recente para a mais antiga, cada card com o score sugerido, a pontuação
real (quando já calculada) e o delta entre os dois. Rodada sem pontuação real exibe estado
pendente com o botão **Atualizar**, que chama `POST /api/historico/{rodadaId}/atualizar-pontuacao`
e atualiza **apenas aquele card**, sem recarregar a lista; a falha também fica contida no card.

O gráfico de evolução só aparece com três ou mais rodadas já pontuadas — com menos que isso, uma
linha de dois pontos sugeriria tendência onde há só duas medidas. É SVG inline, no mesmo padrão
do gráfico da `/cota`.

### `HistoricoDetalhePageComponent`

Separa titulares e reservas pelo `reservaLuxo`, marca capitão, reserva de luxo e dúvida, e soma
os totais: o `scoreSugeridoTotal` vem dos titulares, e no `pontuacaoRealTotal` **o capitão conta
em dobro**, como no Cartola FC real. Com pontuação real disponível, desenha o gráfico de barra
dupla (sugerido × real) por atleta.

### Classificação do delta (`shared/utils/performance.util.ts`)

`getPerformanceDelta(scoreSugerido, pontuacaoReal)` centraliza a regra, para listagem e detalhe
classificarem igual:

| Proporção `pontuacaoReal / scoreSugerido` | Nível |
|---|---|
| `>= 0.9` | 🟢 verde |
| `0.7 – 0.9` | 🟡 amarelo |
| `< 0.7` | 🔴 vermelho |
| `pontuacaoReal` nula | ⚪ indisponível — a rodada ainda não foi pontuada |

Score sugerido zero não divide por zero: sem base de comparação, pontuação real positiva é verde
e o resto é vermelho. As grandezas derivadas (`delta`, `deltaPercent`, `percentAtingido`) são
`null` quando a pontuação real não existe — pela mesma razão que a `/cota` não mostra `0` sem
leitura.

---

## Feature: Admin (Config + Cache + Cota)

Duas telas: a `/admin`, que reúne configuração e cache, e a `/cota`, com o estado do guardrail e
o consumo do ciclo.

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

### `CotaPageComponent`

Tela de consulta do consumo da The Odds API — o único componente pago da stack. Sem ela, saber
se o guardrail de cota está armado exigiria chamar `GET /api/odds/cota` à mão, ou perceber que a
escalação parou de filtrar por favorito.

A tela abre pelo estado do guardrail, que é o que muda o que fazer a seguir: armado, a API parou
de chamar o provedor e serve o último snapshot conhecido, e a escalação continua saindo com odds
que envelhecem. Nesse estado a tela mostra `proximaSondagem` — quando o guardrail se destrava
sozinho, que é a única pergunta que sobra.

#### `null` não é zero

`saldoRestante`, `consumoMes`, `ultimaLeitura`, `ultimaSondagem` e `proximaSondagem` chegam
`null` enquanto nenhuma leitura de header ocorreu desde o boot da API. A tela mostra
**"sem leitura ainda"** nesses casos, em itálico e com cor de texto secundário — nunca `0`.
Saldo baixo e saldo não lido são estados diferentes: renderizar `0` afirmaria "cota esgotada"
no exato momento em que a informação correta é "ainda não perguntamos".

Pela mesma razão, as grandezas derivadas são `number | null`:

```typescript
get margemAteMinimo(): number | null  // saldoRestante - minRequestsRemaining
get cotaCiclo(): number | null        // saldoRestante + consumoMes (tamanho do plano)
get percentSaldo(): number | null     // fatia da cota do ciclo ainda disponível
```

Sem leitura, as três devolvem `null` e a barra de saldo nem é desenhada.

#### Gráfico do consumo

`GET /api/odds/cota/historico?dias=30` traz a série das leituras em ordem cronológica. O gráfico
é SVG inline no `viewBox` `0 0 320 140`, no mesmo padrão do `evolucao-chart` do
`HistoricoPageComponent` — o projeto não tem biblioteca de charts e não precisa ganhar uma para
algumas centenas de pontos.

Cinco decisões do desenho:

- **A escala vertical parte de zero**, e não do menor valor da janela: é consumo acumulado no
  ciclo, e ancorar no mínimo exageraria variações de poucas requisições.
- **O eixo X é proporcional ao tempo**, e não à posição na lista. As leituras nascem de chamadas
  ao provedor, que se concentram quando o sistema é usado: espaçadas por índice, um intervalo de
  três dias sem leitura ocuparia a mesma largura que um de três minutos, e o gráfico do mês
  mentiria sobre quando o consumo aconteceu. Quando a janela inteira cai no mesmo instante não há
  proporção a respeitar, e aí o espaçamento por índice é o que resta.
- **A linha quebra em cada `reinicioDeCota`**, produzindo uma polilinha por ciclo mais uma marca
  tracejada. A renovação da cota derruba o `consumoMes` para perto de zero; desenhada como uma
  descida, pareceria falha de coleta. A API já detecta a virada comparando com a leitura
  anterior, então o frontend não reimplementa a heurística.
- **Os rótulos são HTML sobreposto, não `<text>` dentro do SVG.** O `preserveAspectRatio="none"`
  estica o `viewBox` de 320 até a largura da tela para a linha preencher o card, e a mesma escala
  não-uniforme deformava cada letra na horizontal. Fora do SVG eles usam a escala normal da
  página; o posicionamento é `left: percentX%`, e como o eixo X é esticado linearmente,
  `x / 320` é exatamente a fração horizontal do card. O `aria-label` do SVG passou a resumir a
  série em texto (`resumoAcessivel`), já que os números deixaram de estar nele.
- **Leituras sem `consumoMes` não entram na série** — aquela resposta não trouxe o header e não
  mediu nada.

Os pontos são calculados uma vez no carregamento (`montarGrafico()`), e não em getters: a janela
padrão traz centenas de leituras e o template varre a lista várias vezes por ciclo de detecção.

#### Falha do histórico não derruba a tela

`carregarHistorico()` grava em `historicoError`, separado do `error` do estado atual. O histórico
é o extra; os sete campos do estado corrente são a maior parte do valor da tela e continuam
visíveis mesmo quando a série não vem.

#### Modelos

```typescript
interface CotaResponse {
  saldoRestante: number | null;
  consumoMes: number | null;
  ultimaLeitura: string | null;
  minRequestsRemaining: number;
  guardrailAtivo: boolean;
  ultimaSondagem: string | null;
  proximaSondagem: string | null;
}

interface LeituraCota {
  instante: string;
  saldoRestante: number | null;
  consumoMes: number | null;
  reinicioDeCota: boolean;
}

interface CotaHistoricoResponse {
  dias: number; desde: string; total: number; leituras: LeituraCota[];
}
```

Os instantes são `LocalDateTime` sem offset, na hora local do servidor — mesmo formato do
`updatedAt` do `/api/config`, e exibidos com `DatePipe` como os demais.

---

## Feature: Usuários

Tela de administração dos acessos, restrita a `ADMIN`. Sem ela, criar um acesso exigiria
`curl` ou o Swagger — que fica desabilitado em produção.

Os modelos (`Usuario`, `UsuarioRequest`, `UsuarioUpdateRequest` e o envelope `Pagina<T>`) ficam
em `core/models/usuario.model.ts`, porque a sessão também os consome.

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

## Feature: Landing Pública

Arquivos: `src/app/features/landing/`

Página da raiz, dirigida a duas audiências ao mesmo tempo: o cartoleiro, que precisa entender em
segundos o que o sistema faz por ele, e quem avalia o projeto tecnicamente.

A página é uma sequência de faixas, nesta ordem:

| Faixa | Conteúdo |
|---|---|
| Topo | Barra pública: marca, "Como funciona", "Entrar" |
| Hero | Proposta de valor e CTAs (login e GitHub) |
| Como funciona | Pipeline em 4 passos (âncora `#como-funciona`) |
| Funcionalidades | Cards das capacidades reais do sistema |
| Prints | Galeria das telas (âncora `#telas`) |
| Tecnologia | Stack, decisões de arquitetura e os dois repositórios |
| Rodapé | Autoria, licença e aviso de desvínculo |

Cada faixa é um componente próprio, e os mixins comuns (largura, sobrancelha, título, foco
visível) ficam em `_secao.scss`. O conteúdo da página muda com frequência e por motivos
diferentes (produto, stack, capturas), e separar mantém cada mudança em um arquivo só.

### Independência da API

**Nenhum componente da landing injeta serviço que chame `/api`** — requisito verificado por
teste, com o porquê em
[Landing pública, prerender e layout do shell](./context.md#landing-pública-prerender-e-layout-do-shell).

### Acessibilidade e SEO

- Um único `h1` (o título do hero); cada `<section>` nomeada por `aria-labelledby` apontando para
  um título existente.
- Foco visível em todos os links e botões (mixin `foco-visivel`): o anel padrão do Chrome é preto
  e sumiria no fundo escuro do tema.
- Textos de corpo em `--text-secondary`, e não em `--text-muted`, que não alcança os 4,5:1 da
  WCAG 1.4.3 nos tamanhos usados.
- `title`, `meta description`, Open Graph e Twitter Card ficam estáticos no `index.html`, e o
  título da landing é o que fica na aba da página pública. Cada rota interna declara o próprio
  `title` (ver [`rotas.md`](rotas.md)), senão esse texto de divulgação ficaria na aba de
  todas as telas do sistema.
- As capturas trazem `alt` descritivo do que a tela mostra, `loading="lazy"` para ficarem fora do
  carregamento inicial e `width`/`height` reais, que reservam o espaço e evitam o salto de layout
  enquanto carregam.
- `robots.txt` (`src/robots.txt`) libera a raiz e bloqueia `/api/`.
- A landing é pré-renderizada no build (ver [`deploy.md`](deploy.md)), então o
  crawler recebe o conteúdo no HTML — e o visitante vê a página antes de o Angular inicializar.

### Capturas das telas

As imagens de `src/assets/landing/` são das telas reais, capturadas contra uma API de
demonstração com dados fictícios. O procedimento e a regra de manutenção estão em
[`prints-da-landing.md`](./prints-da-landing.md).
