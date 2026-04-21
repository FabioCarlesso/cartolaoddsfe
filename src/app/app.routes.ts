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
    path: '**',
    redirectTo: 'time'
  }
];
