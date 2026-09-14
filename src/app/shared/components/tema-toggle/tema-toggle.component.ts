import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

/**
 * Botão que alterna entre o tema claro e o escuro. Vive no cabeçalho do sistema e no topo da
 * landing — quem decide e persiste o tema é o `ThemeService`; aqui só se lê e dispara a troca.
 *
 * O nome acessível anuncia o destino da troca ("Mudar para o tema claro"), sem `aria-pressed`
 * junto: nome que muda mais estado pressionado deixa o leitor de tela dizendo duas coisas
 * opostas na mesma frase.
 *
 * Os dois ícones estão sempre no DOM e é o CSS que escolhe qual aparece, pelo `data-theme` do
 * `<html>`. A landing chega do prerender com o HTML do tema escuro, e o script de boot já marca
 * o tema certo antes do primeiro paint: com `@if` o ícone ficaria errado até a hidratação.
 */
@Component({
  selector: 'app-tema-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      class="btn btn-ghost btn-tema"
      (click)="alternar()"
      [attr.aria-label]="rotulo()"
      [title]="rotulo()">
      <span class="tema-icone tema-icone--sol" aria-hidden="true">&#9728;</span>
      <span class="tema-icone tema-icone--lua" aria-hidden="true">&#127769;</span>
    </button>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    /* Quem usa o botão ajusta o respiro pelo --tema-toggle-padding, sem furar o encapsulamento. */
    .btn-tema {
      padding: var(--tema-toggle-padding, 0.4rem 0.55rem);
      font-size: 1rem;
      line-height: 1;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
    }

    .tema-icone {
      display: inline-flex;
    }

    .tema-icone--lua {
      display: none;
    }

    :host-context([data-theme='claro']) .tema-icone--sol {
      display: none;
    }

    :host-context([data-theme='claro']) .tema-icone--lua {
      display: inline-flex;
    }
  `]
})
export class TemaToggleComponent {
  private themeService = inject(ThemeService);

  rotulo(): string {
    return this.themeService.escuro() ? 'Mudar para o tema claro' : 'Mudar para o tema escuro';
  }

  alternar(): void {
    this.themeService.alternar();
  }
}
