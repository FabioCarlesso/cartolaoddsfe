# Arquitetura

> Camadas, estrutura de pastas, bootstrap e proxy de desenvolvimento. O comportamento de cada
> tela está em [`funcionalidades.md`](funcionalidades.md); o porquê das escolhas, em
> [`context.md`](context.md).

O projeto segue o padrão **Feature-based com Standalone Components** do Angular 21. Não usa
NgModules — cada componente declara seus próprios imports. São três camadas:

| Camada | Papel |
|---|---|
| `core/` | Infraestrutura transversal: sessão, guardas e interceptors |
| `shared/` | Modelos, utilitários e componentes reutilizáveis entre features |
| `features/` | Domínios de negócio isolados, um por tela ou grupo de telas |

O porquê de cada escolha estrutural está em
[Decisões de stack](./context.md#decisões-de-stack).

## Estrutura de arquivos

```
src/
├── main.ts                          # Bootstrap standalone
├── main.server.ts                   # Entry do prerender da landing (SSG no build)
├── index.html
├── robots.txt
├── styles.scss                      # Design system: variáveis CSS globais
└── app/
    ├── app.config.ts                # Providers: router, http, interceptors (auth antes de error), hidratação
    ├── app.config.server.ts         # Providers extras usados só no prerender
    ├── app.routes.ts                # Rotas com lazy loading, guardas e título por rota
    ├── app.component.*              # Shell: navbar + usuário logado + router-outlet
    ├── core/
    │   ├── models/auth.model.ts     # LoginRequest/Response, Perfil, SessaoUsuario
    │   ├── services/auth.service.ts # Sessão em signals, token no localStorage
    │   ├── models/usuario.model.ts  # Usuario, requests e envelope de paginação Pagina<T>
    │   ├── guards/auth.guard.ts     # Protege as rotas internas, guarda ?redirect=
    │   ├── guards/role.guard.ts     # Restringe rotas por perfil (→ /403)
    │   ├── guards/visitante.guard.ts # Libera a landing só para quem não tem sessão
    │   └── interceptors/
    │       ├── auth.interceptor.ts  # Authorization: Bearer + logout no 401
    │       └── error.interceptor.ts # Tratamento global de erros HTTP → mensagens PT-BR
    ├── shared/
    │   ├── models/                  # Interfaces TypeScript (Atleta, Time, Ranking, Favoritos, Historico, Comparacao)
    │   ├── utils/                   # consistencia.util (badge), performance.util (delta), score-info.util, time-mapper.util, formacao.util
    │   └── components/
    │       ├── loading-spinner/     # Spinner animado (message, fullPage)
    │       ├── alert-banner/        # Banners de aviso/erro/sucesso
    │       ├── consistencia-badge/  # Badge de consistência (🟢🟡🔴⚪) com tooltip
    │       └── orcamento-input/     # Input reutilizável de orçamento (cartoletas) com validação
    └── features/
        ├── landing/                 # Página pública da raiz — nenhuma faixa chama /api
        │   ├── _secao.scss          # Mixins das faixas (largura, sobrancelha, foco visível)
        │   ├── components/          # landing-topo, -hero, -como-funciona, -funcionalidades,
        │   │                        # -prints, -tecnologia, -rodape
        │   └── pages/landing-page/  # Compõe as faixas na ordem da página
        ├── auth/
        │   └── pages/
        │       ├── login-page/          # Formulário de login
        │       ├── forbidden-page/      # Aviso de acesso restrito (/403)
        │       └── alterar-senha-page/  # Troca da própria senha
        ├── usuarios/
        │   ├── services/usuario.service.ts   # CRUD de /api/usuarios
        │   └── pages/
        │       ├── usuarios-page/            # Listagem + ativar/desativar com confirmação
        │       └── usuario-form-page/        # Criação e edição
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
            │   ├── cache.service.ts         # DELETE /api/cache e /api/cache/{nome}
            │   └── cota.service.ts          # GET /api/odds/cota e /api/odds/cota/historico
            └── pages/
                ├── admin-page/              # Formulário de config + painel de cache
                └── cota-page/               # Estado da cota, guardrail e gráfico do consumo
```

---

## Configuração e Bootstrap

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

## Proxy de Desenvolvimento

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
