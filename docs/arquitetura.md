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

## Estrutura de pastas

```
.
├── src/
│   ├── main.ts                # Bootstrap standalone do navegador
│   ├── main.server.ts         # Entry do prerender da landing (SSG no build)
│   ├── index.html             # Shell e metadados de divulgação (title, Open Graph, Twitter Card)
│   ├── robots.txt             # Libera a raiz, bloqueia /api/
│   ├── styles.scss            # Design system: variáveis CSS globais
│   ├── assets/landing/        # Capturas das telas reais usadas na landing
│   └── app/
│       ├── app.config.ts      # Providers globais (o .server.ts só vale no prerender)
│       ├── app.routes.ts      # Rotas, guardas e título por rota
│       ├── app.component.*    # Shell: navbar, usuário logado e router-outlet
│       ├── core/              # Sessão e acesso: models/, services/, guards/, interceptors/
│       ├── shared/            # Reuso entre features
│       │   ├── models/        # Interfaces dos contratos da API
│       │   ├── utils/         # Funções puras, testadas fora do componente que as consome
│       │   ├── pipes/         # Pipes de formatação
│       │   └── components/    # Componentes de UI reutilizáveis
│       └── features/          # Um domínio por pasta: landing, auth, usuarios, time,
│                              # ranking, favoritos, comparacao, historico, admin
├── prerender-routes.txt       # O que é pré-renderizado no build — só a raiz
├── proxy.conf.json            # /api → localhost:8080 em desenvolvimento
├── nginx.conf.template        # Config do nginx servido pela imagem Docker
└── scripts/prints/            # Apoio à captura das telas da landing
```

Cada feature repete o mesmo desenho interno: `services/` para as chamadas à API, `components/`
para as peças da tela e `pages/` para as telas em si. Componentes de página orquestram os
serviços e nunca chamam `HttpClient` diretamente.

Lógica que não depende do DOM — classificação de consistência, delta de performance, critério do
score por posição, mapeamento do time, composição de formação — vive em `shared/utils/` para ser testada isoladamente. O
comportamento de cada tela está em [`funcionalidades.md`](funcionalidades.md); a lista de
arquivos, o próprio repositório responde.

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
