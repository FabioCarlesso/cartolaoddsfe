import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Barra as rotas internas para quem não tem sessão válida, guardando a URL pretendida
 * para devolver o usuário a ela depois do login.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: state.url && state.url !== '/' ? { redirect: state.url } : {}
  });
};
