# Rotas

> Mapa completo das rotas, com componente carregado, guarda e nível de acesso. O comportamento de
> cada tela está em [`funcionalidades.md`](funcionalidades.md).

Arquivo: `src/app/app.routes.ts`

Todas as rotas usam **lazy loading** via `loadComponent`:

```typescript
{
  path: 'time',
  loadComponent: () => import('./features/time/pages/time-page/time-page.component')
    .then(m => m.TimePageComponent)
}
```

| Path | Tela | Componente carregado | Guarda | Acesso |
|---|---|---|---|---|
| `/` | Landing pública com apresentação do projeto | `LandingPageComponent` | `visitanteGuard` | Público (com sessão, redireciona para `/time`) |
| `/login` | Autenticação por e-mail e senha | `LoginPageComponent` | — | Público |
| `/403` | Aviso de acesso restrito | `ForbiddenPageComponent` | — | Público |
| `/time` | Time ideal com formação 4-3-3 | `TimePageComponent` | `authGuard` | Autenticado |
| `/ranking` | Ranking de atletas com filtros | `RankingPageComponent` | `authGuard` | Autenticado |
| `/favoritos` | Análise de odds e favoritos | `FavoritosPageComponent` | `authGuard` | Autenticado |
| `/comparar` | Comparação do melhor time entre múltiplas formações, ranqueadas por score total | `ComparacaoPageComponent` | `authGuard` | Autenticado |
| `/historico` | Histórico de escalações por rodada com comparativo score sugerido × pontuação real | `HistoricoPageComponent` | `authGuard` | Autenticado |
| `/historico/:rodadaId` | Detalhe da escalação de uma rodada (titulares, reservas e gráficos) | `HistoricoDetalhePageComponent` | `authGuard` | Autenticado |
| `/admin` | Configurações de negócio e gerenciamento de cache | `AdminPageComponent` | `authGuard` + `roleGuard(['ADMIN'])` | **ADMIN** |
| `/cota` | Estado da cota da The Odds API, guardrail e consumo do ciclo | `CotaPageComponent` | `authGuard` + `roleGuard(['ADMIN'])` | **ADMIN** |
| `/usuarios` | Listagem de usuários com ações de editar e ativar/desativar | `UsuariosPageComponent` | `authGuard` + `roleGuard(['ADMIN'])` | **ADMIN** |
| `/usuarios/novo` | Cadastro de usuário | `UsuarioFormPageComponent` | `authGuard` + `roleGuard(['ADMIN'])` | **ADMIN** |
| `/usuarios/:id` | Edição de usuário | `UsuarioFormPageComponent` | `authGuard` + `roleGuard(['ADMIN'])` | **ADMIN** |
| `/alterar-senha` | Troca da própria senha | `AlterarSenhaPageComponent` | `authGuard` | Autenticado |
| `**` | Redireciona para `/` | — | — | — |

Cada rota declara o próprio `title`. A raiz é pública, traz o próprio cabeçalho e rodapé e por
isso declara `data: { layoutFluido: true }` — o `AppComponent` lê esse dado a cada
`NavigationEnd` e sai da frente (ver [Shell](funcionalidades.md#shell)).

Os itens "Config", "Cota" e "Usuários" só aparecem no menu para ADMIN. O motivo de a raiz usar o
`visitanteGuard` e de a URL desconhecida cair em `/` — e não em `/time` — está em
[Sessão e autorização](./context.md#sessão-e-autorização).
