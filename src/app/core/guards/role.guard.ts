import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Perfil } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

/**
 * Restringe uma rota aos perfis informados.
 *
 * Isto é defesa de **experiência**, não de segurança: quem editar o `localStorage` chega à
 * tela, mas a API recusa a operação. A autorização real é sempre a do backend
 * (`SecurityConfig`) — aqui só se evita mostrar ao usuário uma tela que ele não conseguiria
 * usar.
 */
export function roleGuard(perfisPermitidos: Perfil[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/login'], {
        queryParams: state.url && state.url !== '/' ? { redirect: state.url } : {}
      });
    }

    const perfil = authService.getPerfilAtual();
    return perfil && perfisPermitidos.includes(perfil) ? true : router.createUrlTree(['/403']);
  };
}
