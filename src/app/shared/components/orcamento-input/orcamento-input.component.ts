import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Campo numérico opcional de orçamento máximo (cartoletas), com botão de limpar
 * e validação client-side (valor deve ser > 0). Projetado de forma isolada para
 * ser reutilizado em outras telas (ex.: comparação de formações).
 *
 * Uso:
 *   <app-orcamento-input [(orcamento)]="orcamento" (limpar)="onLimpar()">
 *     <button>Gerar Time</button>  <!-- ação projetada via ng-content -->
 *   </app-orcamento-input>
 */
@Component({
  selector: 'app-orcamento-input',
  imports: [FormsModule],
  template: `
    <div class="orcamento-input">
      <div class="field">
        <label class="field-label" [attr.for]="inputId">{{ label }}</label>
        <div class="input-row">
          <div class="input-wrap" [class.invalid]="invalido">
            <input
              [id]="inputId"
              type="number"
              inputmode="decimal"
              min="0"
              step="0.1"
              [placeholder]="placeholder"
              [ngModel]="orcamento"
              (ngModelChange)="onChange($event)"
              (keyup.enter)="onEnter()"
            />
            <span class="suffix">cartoletas</span>
            @if (orcamento != null) {
              <button
                type="button"
                class="clear-btn"
                aria-label="Limpar orçamento"
                (click)="onLimpar()"
              >&#10005;</button>
            }
          </div>
          <ng-content></ng-content>
        </div>
        @if (invalido) {
          <span class="field-error">Informe um valor maior que zero.</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .field-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
    }

    .input-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .input-wrap {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 0.35rem 0.6rem;
      transition: border-color 0.15s ease;

      &:focus-within { border-color: rgba(34, 197, 94, 0.45); }
      &.invalid { border-color: var(--red); }
    }

    input {
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-primary);
      font-size: 0.95rem;
      font-family: 'Space Grotesk', sans-serif;
      width: 6.5rem;

      &::placeholder { color: var(--text-muted); }
      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      -moz-appearance: textfield;
      appearance: textfield;
    }

    .suffix {
      font-size: 0.78rem;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .clear-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.4rem;
      height: 1.4rem;
      border-radius: 9999px;
      border: none;
      background: rgba(239, 68, 68, 0.12);
      color: #f87171;
      cursor: pointer;
      font-size: 0.7rem;
      line-height: 1;
      transition: background 0.15s ease;

      &:hover { background: rgba(239, 68, 68, 0.22); }
    }

    .field-error {
      font-size: 0.75rem;
      color: #f87171;
    }

    @media (max-width: 640px) {
      .input-row { width: 100%; }
      .input-wrap { flex: 1; }
      input { width: 100%; }
    }
  `]
})
export class OrcamentoInputComponent {
  private static seq = 0;

  @Input() label = 'Orçamento máximo (cartoletas)';
  @Input() placeholder = 'Ex: 120.0';
  // Id único por instância evita colisão de id/label[for] quando o componente é reutilizado na mesma página
  @Input() inputId = `orcamento-input-${OrcamentoInputComponent.seq++}`;

  @Input() orcamento: number | null = null;
  @Output() orcamentoChange = new EventEmitter<number | null>();

  /** Emitido quando o usuário aciona o botão de limpar. */
  @Output() limpar = new EventEmitter<void>();

  /** Emitido ao pressionar Enter no campo (atalho para a ação principal). */
  @Output() gerar = new EventEmitter<void>();

  get invalido(): boolean {
    return this.orcamento != null && this.orcamento <= 0;
  }

  onChange(value: number | string | null): void {
    const parsed = value === null || value === '' ? null : Number(value);
    this.orcamento = parsed != null && Number.isNaN(parsed) ? null : parsed;
    this.orcamentoChange.emit(this.orcamento);
  }

  onLimpar(): void {
    this.orcamento = null;
    this.orcamentoChange.emit(null);
    this.limpar.emit();
  }

  onEnter(): void {
    if (!this.invalido) {
      this.gerar.emit();
    }
  }
}
