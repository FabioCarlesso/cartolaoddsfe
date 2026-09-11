# Desenvolvimento

> Ferramental, estratégia de testes por camada e onde cada spec vive. Os comandos de execução
> estão em [Testes](../README.md#testes).

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

## Onde ficam os testes

Cada serviço, guarda, interceptor, utilitário, componente compartilhado e componente de página
tem o seu `.spec.ts` ao lado do arquivo que testa. Para ver o que existe hoje:

```bash
find src -name '*.spec.ts'
```

Esta página não mantém a lista à mão: um mapa de specs escrito num markdown nasce desatualizado
no primeiro arquivo novo, e o repositório responde a pergunta melhor. O que o `--code-coverage`
mostra é a resposta sobre o quanto está coberto.

Os comandos de execução (incluindo cobertura e watch mode) estão em
[Testes](../README.md#testes).
