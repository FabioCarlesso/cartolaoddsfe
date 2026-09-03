import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'time',
    pathMatch: 'full'
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
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/pages/admin-page/admin-page.component').then(
        (m) => m.AdminPageComponent
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
    path: '**',
    redirectTo: 'time'
  }
];
