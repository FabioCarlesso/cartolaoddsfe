import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { visitanteGuard } from './core/guards/visitante.guard';

/**
 * Cada rota declara o próprio `title`: o `<title>` do `index.html` é o da landing — texto de
 * página pública, que também alimenta a prévia do link — e sem isso ele ficaria na aba de todas
 * as telas internas. O `TitleStrategy` padrão do Angular só troca o título quando a rota declara
 * um, então a omissão em qualquer rota deixaria o título da tela anterior na aba.
 */
export const routes: Routes = [
  {
    // A landing é pública e roda sem a navbar do sistema — `layoutFluido` avisa o shell
    // disso, para as faixas sangrarem de ponta a ponta.
    path: '',
    pathMatch: 'full',
    title: 'Cartola Odds — o time da rodada montado com as odds do Brasileirão',
    canActivate: [visitanteGuard],
    data: { layoutFluido: true },
    loadComponent: () =>
      import('./features/landing/pages/landing-page/landing-page.component').then(
        (m) => m.LandingPageComponent
      )
  },
  {
    path: 'login',
    title: 'Cartola Odds — Entrar',
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page.component').then(
        (m) => m.LoginPageComponent
      )
  },
  {
    path: '403',
    title: 'Cartola Odds — Acesso restrito',
    loadComponent: () =>
      import('./features/auth/pages/forbidden-page/forbidden-page.component').then(
        (m) => m.ForbiddenPageComponent
      )
  },
  {
    path: 'time',
    title: 'Cartola Odds — Time da rodada',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/time/pages/time-page/time-page.component').then(
        (m) => m.TimePageComponent
      )
  },
  {
    path: 'ranking',
    title: 'Cartola Odds — Ranking de atletas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/ranking/pages/ranking-page/ranking-page.component').then(
        (m) => m.RankingPageComponent
      )
  },
  {
    path: 'favoritos',
    title: 'Cartola Odds — Favoritos da rodada',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/favoritos/pages/favoritos-page/favoritos-page.component').then(
        (m) => m.FavoritosPageComponent
      )
  },
  {
    path: 'comparar',
    title: 'Cartola Odds — Comparar formações',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/comparacao/pages/comparacao-page/comparacao-page.component').then(
        (m) => m.ComparacaoPageComponent
      )
  },
  {
    path: 'historico',
    title: 'Cartola Odds — Histórico de escalações',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/historico/pages/historico-page/historico-page.component').then(
        (m) => m.HistoricoPageComponent
      )
  },
  {
    path: 'historico/:rodadaId',
    title: 'Cartola Odds — Detalhe da rodada',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/historico/pages/historico-detalhe-page/historico-detalhe-page.component').then(
        (m) => m.HistoricoDetalhePageComponent
      )
  },
  {
    path: 'admin',
    title: 'Cartola Odds — Configurações',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/admin/pages/admin-page/admin-page.component').then(
        (m) => m.AdminPageComponent
      )
  },
  {
    path: 'usuarios',
    title: 'Cartola Odds — Usuários',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/usuarios/pages/usuarios-page/usuarios-page.component').then(
        (m) => m.UsuariosPageComponent
      )
  },
  {
    path: 'usuarios/novo',
    title: 'Cartola Odds — Novo usuário',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/usuarios/pages/usuario-form-page/usuario-form-page.component').then(
        (m) => m.UsuarioFormPageComponent
      )
  },
  {
    path: 'usuarios/:id',
    title: 'Cartola Odds — Editar usuário',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/usuarios/pages/usuario-form-page/usuario-form-page.component').then(
        (m) => m.UsuarioFormPageComponent
      )
  },
  {
    path: 'alterar-senha',
    title: 'Cartola Odds — Trocar senha',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/pages/alterar-senha-page/alterar-senha-page.component').then(
        (m) => m.AlterarSenhaPageComponent
      )
  },
  {
    // URL desconhecida cai na raiz, e não em `/time`: para o visitante deslogado o destino é a
    // landing, e para quem tem sessão o `visitanteGuard` encaminha ao time — nos dois casos o
    // usuário para numa tela que faz sentido, sem passar por uma de login sem contexto.
    path: '**',
    redirectTo: ''
  }
];
