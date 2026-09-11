# Desenvolvimento

> Ferramental e estratégia de testes. Os comandos de execução estão em
> [Testes](../README.md#testes).

## Stack de Testes

| Ferramenta | Versão | Uso |
|---|---|---|
| Karma | via `@angular-devkit/build-angular` | Test runner |
| Jasmine | ~5.1 | Framework de asserções e spies |
| `karma-coverage` | ~2.2 | Relatório de cobertura de código |
| `ChromeHeadless` | — | Browser de execução (CI-friendly) |

Configuração em `karma.conf.js`, referenciado no `angular.json` via `"karmaConfig": "karma.conf.js"`.

## Estratégia por camada

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

## Cobertura dos Testes

| Arquivo de teste | Camada | Cenários cobertos |
|---|---|---|
| `app.routes.spec.ts` | Rotas | Título declarado em toda rota navegável, título público na raiz, `**` para a landing |
| `app.component.spec.ts` | Shell | Criação, navbar, links por perfil (Config, Cota e Usuários só para ADMIN), usuário logado, botão Sair, navegação escondida sem sessão, layout fluido da landing |
| `auth.service.spec.ts` | Core | Login, claims do token, restauração da sessão, token expirado/sem `perfil`/malformado, logout, sessão expirada, storage indisponível, aviso de token descartado, troca de senha |
| `auth.interceptor.spec.ts` | Core | Header presente/ausente, login sem header, `401` deslogando, `403` mantendo a sessão, demais status, e a cadeia real com o `errorInterceptor` |
| `auth.guard.spec.ts` | Core | Sessão válida, sem sessão (com e sem `redirect`), token expirado |
| `role.guard.spec.ts` | Core | ADMIN permitido, USER para `/403`, múltiplos perfis aceitos, visitante e sessão expirada para `/login` |
| `visitante.guard.spec.ts` | Core | Visitante liberado na landing, sessão válida redirecionada a `/time`, token expirado tratado como visitante |
| `error.interceptor.spec.ts` | Core | Status 0, 400 (com e sem mensagem), 401 (login e sessão), 403, 409, 422, 429, 502, 500, resposta de sucesso |
| `landing-page.component.spec.ts` | Page | Faixas na ordem, um único `h1`, seções nomeadas, zero requisição HTTP, sem promessa de auto-cadastro |
| `landing-*.component.spec.ts` | Componentes | Âncora do "Como funciona", CTAs para `/login`, cards de funcionalidade e de decisão, prints com `lazy`/`alt`/dimensões, aviso de desvínculo no rodapé |
| `login-page.component.spec.ts` | Page | Submissão válida, credencial inválida, estado de carregamento, sessão expirada, senha alterada, `redirect` interno e externo, parâmetros chegando com a tela montada |
| `forbidden-page.component.spec.ts` | Page | Mensagem de acesso restrito e volta para `/time` |
| `alterar-senha-page.component.spec.ts` | Page | Senhas divergentes, senha curta, sucesso encerrando a sessão, `422` de senha atual incorreta |
| `usuario.service.spec.ts` | Service | Listagem paginada e ordenada, busca por id, criação, `PATCH` parcial, desativar, reativar, `409` de e-mail e de último ADMIN |
| `usuarios-page.component.spec.ts` | Page | Listagem, colunas, situação, ausência de senha, confirmação antes de desativar, cancelamento, `409` do último ADMIN, reativação, erro de carga, estado vazio |
| `usuario-form-page.component.spec.ts` | Page | Validação de e-mail e senha mínima, criação, edição sem campo de senha, `PATCH` só do que mudou, `409` de e-mail e das regras de ADMIN, erro de carga |
| `loading-spinner.component.spec.ts` | Shared | Spinner DOM, message vazio/preenchido, classe full-page |
| `alert-banner.component.spec.ts` | Shared | Tipos (warning/error/success/info), ícones, classes CSS, message |
| `consistencia.util.spec.ts` | Util | Faixas de desvio, badge neutro, tooltip |
| `consistencia-badge.component.spec.ts` | Shared | Cores por faixa, badge neutro, toggle do tooltip |
| `orcamento-input.component.spec.ts` | Shared | Validação (>0), limpar, two-way binding, submit no Enter |
| `score-info.util.spec.ts` | Util | `criterioScore` da API tem prioridade, fallback por posição (GOL/ATA/demais), descrição ausente, `scorePercent` (0/50/100%, teto acima de 12, fracionários) |
| `performance.util.spec.ts` | Util | Delta indisponível sem pontuação real, classificação verde/amarelo/vermelho por faixa, `deltaPercent`, score sugerido zero sem divisão por zero |
| `time-mapper.util.spec.ts` | Util | `mapAtleta` (clube/sinônimos/dúvida/substituto), `mapTimeResponse` (flatten, defaults) |
| `formacao.util.spec.ts` | Util | Formações válidas, limites 2–5, conversão formação → config, validação de composição |
| `time.service.spec.ts` | Service | GET /api/time, param orçamento, mapeamento agrupado→flat, `nomeClube`→`clube`, `status`→`emDuvida`, substituto recursivo, campos de custo/estratégia, capitão nulo, `avisoMercado`, erros HTTP |
| `ranking.service.spec.ts` | Service | GET /api/ranking, params `posicao`/`limite`/`excluirDuvida`, limite padrão, propagação de erro |
| `favoritos.service.spec.ts` | Service | GET /api/favoritos, `oddLimite` opcional, propagação de erro |
| `comparacao.service.spec.ts` | Service | GET /api/time/comparar, param `formacoes`/orçamento, ordenação, indisponível, `melhorFormacao` |
| `historico.service.spec.ts` | Service | GET lista, GET por rodada, POST `atualizar-pontuacao`, propagação de erro |
| `configuracao.service.spec.ts` | Service | GET /api/config, PATCH com body, POST /api/config/reset, erros HTTP |
| `cache.service.spec.ts` | Service | DELETE /api/cache (todos), DELETE /api/cache/{nome}, erro 400 de nome inválido |
| `cota.service.spec.ts` | Service | GET de estado e histórico, param `dias` opcional, campos anuláveis preservados, `reinicioDeCota`, `403` |
| `player-card.component.spec.ts` | Component | Nome, clube, posição, `scorePercent`, critério do score, capitão, dúvida, substituto, luxo, valorização, badge de consistência |
| `team-view.component.spec.ts` | Component | Filtros por posição, ordem LAT-ZAG-ZAG-LAT, capitão, reserva de luxo, sem TEC, sem LAT |
| `time-page.component.spec.ts` | Page | Load no init, sucesso, erro, métricas (`titularesCount`, `duvidaCount`, `totalPreco`, `mediaScore`), `avisoMercado`, orçamento (validação/barra/estratégia/`avisoOrcamento`), null state |
| `ranking-page.component.spec.ts` | Page | Load, filtros, lista de posições, `scorePercent`, critério por posição, ordem da API, badge de consistência, `avisoMercado`, erro |
| `favoritos-page.component.spec.ts` | Page | `probFavorito`, `probEmpate` (com/sem `oddEmpate`), reset, cards no DOM, erro |
| `comparacao-page.component.spec.ts` | Page | Chips (2–5), comparar, expandir único, medalhas, modal "Usar formação" + PATCH/redirect, persistência |
| `historico-page.component.spec.ts` | Page | Load no init, ordem da mais recente para a mais antiga, estado vazio com CTA, erro, classificação do delta, teto da barra, card por rodada, pendente com botão atualizar, gráfico de evolução só com 3+ rodadas reais, atualização inline (reservas fora do total, erro inline) |
| `historico-detalhe-page.component.spec.ts` | Page | Carga pelo param da rota, split titulares/reservas, `scoreSugeridoTotal`, capitão dobrado no total real, disponibilidade da pontuação, marcadores (capitão/luxo/dúvida), gráfico de barra dupla, delta por atleta, erro de carga, atualização e erro inline |
| `admin-page.component.spec.ts` | Page | Load config, sync form, salvar, resetar, invalidar todos, invalidar cache, `somasPesos`, `pesosValidos`, validação de `pesoDesvio`, erros |
| `cota-page.component.spec.ts` | Page | Saldo/consumo/margem, "sem leitura ainda" no lugar de zero, guardrail armado com `proximaSondagem`, histórico falhando sem derrubar a tela, segmento por ciclo e marca de renovação, escala ancorada em zero |

Os comandos de execução (incluindo cobertura e watch mode) estão em
[Testes](../README.md#testes).
