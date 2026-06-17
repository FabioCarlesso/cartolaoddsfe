import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'time',
    pathMatch: 'full'
  },
  {
    path: 'time',
    loadComponent: () =>
      import('./features/time/pages/time-page/time-page.component').then(
        (m) => m.TimePageComponent
      )
  },
  {
    path: 'ranking',
    loadComponent: () =>
      import('./features/ranking/pages/ranking-page/ranking-page.component').then(
        (m) => m.RankingPageComponent
      )
  },
  {
    path: 'favoritos',
    loadComponent: () =>
      import('./features/favoritos/pages/favoritos-page/favoritos-page.component').then(
        (m) => m.FavoritosPageComponent
      )
  },
  {
    path: 'comparar',
    loadComponent: () =>
      import('./features/comparacao/pages/comparacao-page/comparacao-page.component').then(
        (m) => m.ComparacaoPageComponent
      )
  },
  {
    path: 'historico',
    loadComponent: () =>
      import('./features/historico/pages/historico-page/historico-page.component').then(
        (m) => m.HistoricoPageComponent
      )
  },
  {
    path: 'historico/:rodadaId',
    loadComponent: () =>
      import('./features/historico/pages/historico-detalhe-page/historico-detalhe-page.component').then(
        (m) => m.HistoricoDetalhePageComponent
      )
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/pages/admin-page/admin-page.component').then(
        (m) => m.AdminPageComponent
      )
  },
  {
    path: '**',
    redirectTo: 'time'
  }
];
