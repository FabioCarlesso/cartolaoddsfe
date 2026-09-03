import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden-page',
  imports: [RouterLink],
  template: `
    <div class="page-container">
      <div class="empty-state">
        <span class="empty-icon">&#128274;</span>
        <span class="empty-title">Acesso restrito</span>
        <span class="empty-desc">
          Sua conta não tem permissão para esta área. Se você precisa de acesso, peça a um
          administrador.
        </span>
        <a class="btn btn-primary" routerLink="/time">Voltar para o time</a>
      </div>
    </div>
  `
})
export class ForbiddenPageComponent {}
