import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  private authService = inject(AuthService);

  readonly autenticado = this.authService.autenticado;
  readonly usuario = this.authService.usuarioAtual;

  sair(): void {
    this.authService.logout();
  }
}
