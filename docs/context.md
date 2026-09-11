# Context — Cartola Odds Frontend

> **Papel deste arquivo:** decisões de arquitetura, convenções do código e as regras de negócio
> refletidas na UI — o *porquê* das coisas. Leia antes de qualquer tarefa neste repositório,
> inclusive em desenvolvimento assistido por IA.
>
> O *o quê* mora nos outros dois: [`../README.md`](../README.md) diz o que é o projeto e como
> rodá-lo; [`documentacao.md`](./documentacao.md) é a referência técnica (rotas, componentes,
> serviços, modelos, build, Docker, testes).

---

## O que é este projeto

Frontend Angular 21 que consome a **Cartola Odds API** (backend Java/Spring Boot) e apresenta
dados estratégicos para jogadores do Cartola FC (fantasy football brasileiro).

O usuário final quer montar o melhor time possível cruzando:
- Métricas dos atletas (média de pontos, variação, preço)
- Odds do Brasileirão (qual time é favorito a vencer)

A lista de telas e o que cada uma entrega está na [visão geral do README](../README.md#visão-geral).

---

## Backend — Cartola Odds API

- **Repositório:** `FabioCarlesso/cartolaodds` (Java/Spring Boot)
- **URL local:** `http://localhost:8080`
- **Docs:** `docs/documentacao_api.md` (ver arquivo de referência da API no backend)

Todos os endpoints exigem `Authorization: Bearer <token>`, exceto `POST /api/auth/login`. A
relação de endpoints consumidos, com parâmetros e o serviço que chama cada um, está em
[Serviços HTTP](./documentacao.md#7-serviços-http).

O backend é a autoridade sobre autorização, paginação e valores padrão de parâmetros omitidos
(ex.: `oddLimite` cai no valor de `application.properties`). O frontend não replica nenhuma
dessas decisões — ele reage ao que a API responde.

---

## Decisões de stack

As versões estão na [tabela de stack do README](../README.md#stack). O que importa aqui é o
porquê de cada escolha:

| Decisão | Justificativa |
|---|---|
| Standalone components, sem NgModules | Padrão desde o Angular 17 — sem o boilerplate de módulo, cada componente declara seus próprios imports |
| Lazy loading por rota (`loadComponent`) | Reduz o bundle inicial; cada feature carrega sob demanda. Cada rota declara também o próprio `title` |
| `inject()` em vez de construtor | Código mais conciso e compatível com signals |
| TypeScript `strict: true` | Erro de contrato aparece no build, não em runtime |
| SCSS puro, sem framework CSS | O design system cabe em CSS custom properties; um framework traria mais peso que ajuda |
| Só `FormsModule` (sem `ReactiveFormsModule`) | Os formulários do app são simples; dois filtros e um punhado de campos não justificam a camada reativa |
| Estado local no componente | Signals globais/NgRx não são necessários no escopo atual — a exceção é a sessão (ver [Estado local](#estado-local)) |
| Inline styles em componentes menores | Encapsulamento total; evita conflitos de CSS global |
| `subscribe` explícito em vez de `async pipe` | Um padrão só: `subscribe` no `OnInit`, com o estado de carregamento e erro na mão do componente |
| SSG só da rota `/` (`@angular/ssr` + `platform-server`) | Entrega a landing pronta no HTML sem precisar de servidor Node em produção (ver [Landing pública, prerender e layout do shell](#landing-pública-prerender-e-layout-do-shell)) |
| esbuild (`@angular-devkit/build-angular:application`) | Builder padrão do Angular 21 |

A estrutura de pastas correspondente está em [Arquitetura](./documentacao.md#1-arquitetura).

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
- O mapeamento do formato da API para os models do frontend é responsabilidade do serviço, não
  do componente: os templates nunca veem o formato raw (ver [`TimeService`](./documentacao.md#timeservice))

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

A ordem dos interceptors não é detalhe de estilo: o `errorInterceptor` devolve a **mesma
instância** de `HttpErrorResponse`, porque o `authInterceptor` reconhece o `401` de sessão pelo
`instanceof` — uma cópia o desligaria em silêncio. O mapeamento status → mensagem está em
[Interceptor de Erros](./documentacao.md#5-interceptor-de-erros).

### Landing pública, prerender e layout do shell

A rota `''` carrega a landing com o `visitanteGuard` (com sessão válida, redireciona para
`/time`) e `data: { layoutFluido: true }`. O `AppComponent` lê esse dado da rota mais profunda a
cada `NavigationEnd` e esconde a própria navbar e o próprio rodapé — a landing traz os seus e as
faixas sangram de ponta a ponta. Uma rota nova com layout fluido só precisa declarar o `data`.

Nenhum componente da landing pode injetar serviço que chame `/api`: a página precisa renderizar
inteira com o backend desligado, e há teste que reprova qualquer requisição aberta na montagem.
É requisito, não detalhe — a landing é a primeira tela de quem chega pelo link, inclusive de um
recrutador, e é justamente quando o backend pode estar desligado ou em cold start. O teste
`should render without issuing a single HTTP request` monta a página com o
`HttpTestingController` e chama `verify()`; qualquer requisição aberta reprova.

Essa restrição é também o que permite pré-renderizá-la no build (`prerender-routes.txt` lista só
`/`): o HTML da landing sai pronto, e o `index.csr.html` continua sendo o shell das demais rotas.
A separação entre os dois HTML evita o efeito colateral do prerender: se o fallback de SPA
devolvesse o `index.html`, quem abrisse `/time` direto veria a landing por um instante antes de a
aplicação assumir a tela.

Pelo mesmo motivo, `discoverRoutes: false` é deliberado no `angular.json`: descobrir as rotas
automaticamente faria o build tentar pré-renderizar as telas internas, que exigem sessão e
chamam a API — sem backend no build, elas congelariam uma tela de erro no HTML.

O `layoutFluido` fica `undefined` até a primeira navegação terminar e, nesse intervalo, o shell
não desenha cabeçalho nem rodapé — assumir "rota normal" fazia a navbar piscar sobre a landing
pré-renderizada e empurrar a página 64px para baixo.
As capturas em `src/assets/landing/` são das telas reais e têm regra de manutenção própria em
[`prints-da-landing.md`](./prints-da-landing.md).

### Sessão e autorização

O `perfil` e o `usuarioId` vêm dos claims do JWT, nunca de um objeto guardado à parte. Um
token sem `perfil` conhecido, ilegível ou expirado não é sessão válida — o `AuthService`
limpa tudo e o usuário volta ao `/login`.

Guardas de rota são defesa de **experiência**, não de segurança: quem editar o
`localStorage` vê a tela, mas a API recusa a operação. A autorização real é sempre a do
backend. O mesmo vale para esconder itens do menu por perfil.

A raiz usa o `visitanteGuard`, inverso do `authGuard`: libera a landing para quem não tem sessão
e encaminha ao `/time` quem já tem — o bookmark mais comum de quem usa o app todo dia. É também
para onde vai qualquer URL desconhecida, e não `/time`: assim um visitante deslogado nunca cai
numa tela de login sem contexto.

Nenhuma senha aparece em tela — nem na listagem de usuários, nem na edição. O `PATCH` de
usuário não a aceita; quem troca a própria senha usa `/alterar-senha`.

O token vive em `localStorage`, com toda leitura protegida: em navegador com storage bloqueado a
sessão passa a viver em memória e se perde no reload. Cookie `HttpOnly` + CSRF seria mais seguro
e foi descartado pelo custo frente ao perfil de uso — aplicação pessoal, sem dados de terceiros.

---

## Design System

Tema escuro football inspirado em campo de futebol, definido em `src/styles.scss` via CSS custom
properties. A paleta completa, as classes utilitárias globais e a tipografia estão em
[Design System](./documentacao.md#14-design-system).

**Regras:**
- Nunca hardcode de cores nos componentes — sempre usar variáveis CSS (`var(--green-primary)`)
- Componentes podem ter estilos encapsulados (`:host` + component styles)
- Responsivo: mobile-first implícito, breakpoints em `640px` e `1024px`
- O cabeçalho degrada em etapas (1120px, 1000px, 640px, 480px) porque, como ADMIN, ele carrega
  sete links mais o nome e o **Sair**; sem isso a página ganhava scroll horizontal e o **Sair**
  saía da tela

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
- Máximo assumido de 12 pontos para a barra de progresso; scores acima de 12 ficam em 100% da
  barra (fórmula em [`PlayerCardComponent`](./documentacao.md#playercardcomponent))

### Indicador de Consistência (desvio padrão)

- A API envia `desvioPadrao` e `rodadasConsideradas` dentro de cada `Atleta`, tanto em `/api/time` quanto em `/api/ranking` — são os nomes oficiais de `AtletaDto`/`AtletaRankingDto`, sem sinônimos —, e `pesoDesvio` existe em `/api/config`
- Quando `rodadasConsideradas < 2` (ex.: início de temporada, sem histórico), o desvio não é calculável e o frontend exibe o badge neutro ⚪ — degradação graciosa
- A classificação é centralizada em `shared/utils/consistencia.util.ts` (`getConsistenciaBadge`); as faixas de desvio e o comportamento do badge estão em [`ConsistenciaBadgeComponent`](./documentacao.md#consistenciabadgecomponent)
- A configuração `pesoDesvio` (0.0–1.0, padrão 0.05) controla a penalidade no backend; editável no `/admin`

> **Sobre a conferência do contrato.** Os nomes acima foram conferidos à mão contra o backend em
> `localhost:8080`, e uma conferência manual envelhece: ela vale para a versão da API daquele dia
> e nada acusa a divergência depois. É o que a issue #45 (gerar os models TypeScript a partir do
> contrato OpenAPI) resolve — quando ela entrar, o compilador passa a fazer essa checagem a cada
> build e esta nota deixa de ser necessária.

### Probabilidade Implícita (Favoritos)

- Calculada a partir das odds de cada desfecho (fórmula em [`FavoritosPageComponent`](./documentacao.md#favoritospagecomponent))
- Inclui overround da casa de apostas — total > 100% é esperado

### Cota da The Odds API: `null` não é zero

Campo anulável da API nunca vira `0` na tela. `saldoRestante`, `consumoMes` e os instantes de
leitura vêm `null` enquanto nenhuma leitura de header ocorreu desde o boot da API, e a `/cota`
mostra "sem leitura ainda" nesses casos: saldo baixo e saldo não lido são estados diferentes e
pedem reações opostas. O detalhamento da tela, das grandezas derivadas e do gráfico está em
[`CotaPageComponent`](./documentacao.md#cotapagecomponent).

---

## O que NÃO fazer

- Não usar NgModules — o projeto é 100% standalone
- Não usar `async pipe` nos templates se já tiver `subscribe()` no componente — escolher um padrão
- Não hardcode a URL `localhost:8080` nos serviços — usar sempre `/api`
- Não usar `*ngIf`/`*ngFor` — usar a nova sintaxe `@if`/`@for`
- Não adicionar dependências externas (Material, PrimeNG, etc.) sem alinhamento prévio
- Não repassar a `mensagem` do backend num `5xx` — ela já chegou à tela com SQL e nomes de colunas

---

## Docker — decisões e limites

A relação de arquivos, variáveis de ambiente e comandos está em
[Docker](./documentacao.md#17-docker). As decisões por trás dela:

- **Multi-stage build** — Node não existe na imagem final: ~25 MB de nginx alpine contra ~300 MB, e menos superfície de ataque
- **Usuário não-root** — o container roda como `appuser`
- **`envsubst` em runtime** — `BACKEND_URL` é substituído no `nginx.conf.template` na inicialização do container, então trocar de backend não exige rebuild da imagem
- **Proxy nginx** — `/api/*` é proxiado para o backend, eliminando CORS em produção (mesmo comportamento do `proxy.conf.json` em dev)
- **`extra_hosts`** — o container não pode usar `localhost` para atingir o host, porque `localhost` dentro do container é o próprio container. `host.docker.internal` resolve isso: no Docker Desktop (Mac/Windows) funciona automaticamente e no Linux o `docker-compose.yml` já traz `extra_hosts: ["host.docker.internal:host-gateway"]`, que mapeia o nome para o IP do host. Com o backend em `localhost:8080`, o padrão `BACKEND_URL=http://host.docker.internal:8080` funciona em qualquer plataforma, sem configuração extra
- **Cache de assets e gzip** — JS/CSS/fontes com `Cache-Control: public, immutable, 1y`; compressão para todos os tipos de texto
- **128 MB de limite de memória** — o nginx consome muito menos que o backend Java; o limite é suficiente para desenvolvimento e uso moderado em produção

### O que NÃO fazer em Docker

- Não hardcode a URL do backend na imagem — usar `BACKEND_URL` via variável de ambiente
- Não expor porta 8080 no container de frontend — nginx escuta na 80 internamente
- Não editar `nginx.conf.template` sem testar o `envsubst` manualmente
