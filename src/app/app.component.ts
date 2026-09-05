import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly autenticado = this.authService.autenticado;
  readonly usuario = this.authService.usuarioAtual;
  readonly admin = computed(() => this.authService.perfilAtual() === 'ADMIN');

  /**
   * Rotas marcadas com `layoutFluido` trazem o próprio cabeçalho e rodapé — hoje só a landing
   * pública — e o shell sai da frente para as faixas sangrarem de ponta a ponta. O dado vem da
   * rota mais profunda a cada navegação, e não de um `if` pela URL, para novas rotas fluidas
   * só precisarem do `data` no `app.routes.ts`.
   */
  readonly layoutFluido = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map(() => this.rotaAtiva().snapshot.data['layoutFluido'] === true)
    ),
    { initialValue: false }
  );

  sair(): void {
    this.authService.logout();
  }

  private rotaAtiva(): ActivatedRoute {
    let rota = this.router.routerState.root;
    while (rota.firstChild) {
      rota = rota.firstChild;
    }
    return rota;
  }
}
