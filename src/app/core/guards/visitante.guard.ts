import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Inverso do `authGuard`: libera a rota pública apenas para quem não tem sessão. Quem já está
 * logado e abre `/` — o bookmark mais comum de quem usa o app todo dia — vai direto para o
 * time da rodada, em vez de cair na página de apresentação.
 */
export const visitanteGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated() ? router.createUrlTree(['/time']) : true;
};
