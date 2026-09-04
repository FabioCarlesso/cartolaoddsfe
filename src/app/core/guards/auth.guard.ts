import { inject } from '@angular/core';
import { CanActivateFn, Params, Router, RouterStateSnapshot } from '@angular/router';
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

  return router.createUrlTree(['/login'], { queryParams: paramsDeLogin(authService, state) });
};

/**
 * `redirect` devolve o usuário à rota pretendida; `expirada` só entra quando havia um token
 * que deixou de valer. Sem ele, quem volta com a sessão vencida cai numa tela de login sem
 * nenhuma explicação de por que foi desconectado — e esse é o caminho mais comum, já que o
 * guard percebe o vencimento antes de qualquer chamada à API tomar 401.
 */
export function paramsDeLogin(authService: AuthService, state: RouterStateSnapshot): Params {
  const queryParams: Params = {};

  if (state.url && state.url !== '/') {
    queryParams['redirect'] = state.url;
  }

  if (authService.consumirTokenDescartado()) {
    queryParams['expirada'] = '1';
  }

  return queryParams;
}
