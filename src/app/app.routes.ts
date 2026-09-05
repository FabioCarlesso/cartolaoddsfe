import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { visitanteGuard } from './core/guards/visitante.guard';

export const routes: Routes = [
  {
    // A landing é pública e roda sem a navbar do sistema — `layoutFluido` avisa o shell
    // disso, para as faixas sangrarem de ponta a ponta.
    path: '',
    pathMatch: 'full',
    canActivate: [visitanteGuard],
    data: { layoutFluido: true },
    loadComponent: () =>
      import('./features/landing/pages/landing-page/landing-page.component').then(
        (m) => m.LandingPageComponent
      )
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page.component').then(
        (m) => m.LoginPageComponent
      )
  },
  {
    path: '403',
    loadComponent: () =>
      import('./features/auth/pages/forbidden-page/forbidden-page.component').then(
        (m) => m.ForbiddenPageComponent
      )
  },
  {
    path: 'time',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/time/pages/time-page/time-page.component').then(
        (m) => m.TimePageComponent
      )
  },
  {
    path: 'ranking',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/ranking/pages/ranking-page/ranking-page.component').then(
        (m) => m.RankingPageComponent
      )
  },
  {
    path: 'favoritos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/favoritos/pages/favoritos-page/favoritos-page.component').then(
        (m) => m.FavoritosPageComponent
      )
  },
  {
    path: 'comparar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/comparacao/pages/comparacao-page/comparacao-page.component').then(
        (m) => m.ComparacaoPageComponent
      )
  },
  {
    path: 'historico',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/historico/pages/historico-page/historico-page.component').then(
        (m) => m.HistoricoPageComponent
      )
  },
  {
    path: 'historico/:rodadaId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/historico/pages/historico-detalhe-page/historico-detalhe-page.component').then(
        (m) => m.HistoricoDetalhePageComponent
      )
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/admin/pages/admin-page/admin-page.component').then(
        (m) => m.AdminPageComponent
      )
  },
  {
    path: 'usuarios',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/usuarios/pages/usuarios-page/usuarios-page.component').then(
        (m) => m.UsuariosPageComponent
      )
  },
  {
    path: 'usuarios/novo',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/usuarios/pages/usuario-form-page/usuario-form-page.component').then(
        (m) => m.UsuarioFormPageComponent
      )
  },
  {
    path: 'usuarios/:id',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./features/usuarios/pages/usuario-form-page/usuario-form-page.component').then(
        (m) => m.UsuarioFormPageComponent
      )
  },
  {
    path: 'alterar-senha',
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
