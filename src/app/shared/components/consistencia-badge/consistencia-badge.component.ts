import { Component, ElementRef, HostListener, Input, inject } from '@angular/core';
import { ConsistenciaBadge, getConsistenciaBadge } from '../../utils/consistencia.util';

/**
 * Indicador visual de consistência do atleta baseado no desvio padrão do score.
 *
 * Exibe um emoji colorido (🟢 🟡 🔴 ⚪) e um tooltip com o valor do desvio e
 * a quantidade de rodadas consideradas. O tooltip abre ao passar o mouse
 * (desktop) e ao tocar/clicar (mobile), fechando ao clicar fora ou perder o foco.
 */
@Component({
  selector: 'app-consistencia-badge',
  template: `
    <span
      class="consistencia-badge"
      [class.is-open]="open"
      [attr.data-level]="badge.level"
      [attr.aria-label]="ariaLabel"
      role="img"
      tabindex="0"
      (click)="toggle($event)"
      (keydown.enter)="toggle($event)"
      (keydown.space)="toggle($event)"
      (mouseenter)="open = true"
      (mouseleave)="open = false"
      (focus)="open = true"
      (blur)="open = false">
      <span class="badge-dot">{{ badge.emoji }}</span>
      <span class="badge-tooltip" role="tooltip">
        @for (linha of tooltipLinhas; track linha) {
          <span class="tooltip-linha">{{ linha }}</span>
        }
      </span>
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    .consistencia-badge {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: help;
      font-size: 0.8rem;
      line-height: 1;
      border-radius: 9999px;
      outline: none;

      &:focus-visible {
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35);
      }
    }

    .badge-dot {
      display: inline-flex;
      font-size: 0.8rem;
    }

    .badge-tooltip {
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      white-space: nowrap;
      padding: 0.4rem 0.6rem;
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--text-primary);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 0.12s ease;
      z-index: 50;
    }

    .badge-tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: var(--border);
    }

    .consistencia-badge.is-open .badge-tooltip {
      opacity: 1;
      visibility: visible;
    }

    .tooltip-linha {
      line-height: 1.3;
    }
  `]
})
export class ConsistenciaBadgeComponent {
  @Input() desvioPadrao?: number | null;
  @Input() rodadasConsideradas?: number | null;

  open = false;

  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  get badge(): ConsistenciaBadge {
    return getConsistenciaBadge(this.desvioPadrao, this.rodadasConsideradas);
  }

  get tooltipLinhas(): string[] {
    return this.badge.tooltip.split('\n');
  }

  get ariaLabel(): string {
    return `Consistência: ${this.badge.label}. ${this.badge.tooltip.replace(/\n/g, '. ')}`;
  }

  toggle(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.open = !this.open;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open && !this.host.nativeElement.contains(event.target as Node)) {
      this.open = false;
    }
  }
}
