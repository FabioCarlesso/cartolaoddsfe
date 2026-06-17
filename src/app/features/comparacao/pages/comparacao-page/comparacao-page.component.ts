import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { CompararResponse } from '../../../../shared/models/comparacao.model';
import { ComparacaoService } from '../../services/comparacao.service';
import {
  FORMACOES_DISPONIVEIS,
  MAX_FORMACOES,
  MIN_FORMACOES,
  formacaoParaConfig,
} from '../../../../shared/utils/formacao.util';
import { ConfiguracaoService } from '../../../admin/services/configuracao.service';
import { TeamViewComponent } from '../../../time/components/team-view/team-view.component';
import { OrcamentoInputComponent } from '../../../../shared/components/orcamento-input/orcamento-input.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';

const FORMACOES_STORAGE_KEY = 'comparacao.formacoes';
const ORCAMENTO_STORAGE_KEY = 'comparacao.orcamento';

@Component({
  selector: 'app-comparacao-page',
  imports: [
    DecimalPipe,
    TeamViewComponent,
    OrcamentoInputComponent,
    LoadingSpinnerComponent,
    AlertBannerComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">&#9878; Comparar Formações</h1>
      </div>

      <p class="intro">
        Selecione de {{ minFormacoes }} a {{ maxFormacoes }} formações para montar o melhor time
        de cada uma e compará-las por score total.
      </p>

      <section class="selector">
        <div class="selector-label">
          Selecione as formações ({{ minFormacoes }} a {{ maxFormacoes }}):
          <span class="selector-count">{{ selecionadas.length }} selecionada(s)</span>
        </div>
        <div class="chips">
          @for (f of formacoes; track f) {
            <button
              type="button"
              class="chip"
              [class.selected]="isSelecionada(f)"
              [disabled]="isChipDesabilitada(f)"
              [attr.aria-pressed]="isSelecionada(f)"
              (click)="toggleFormacao(f)"
            >
              {{ f }}
              @if (isSelecionada(f)) {
                <span class="chip-check">&#10003;</span>
              }
            </button>
          }
        </div>
      </section>

      <section class="controls-bar">
        <app-orcamento-input
          [(orcamento)]="orcamento"
          (limpar)="onLimparOrcamento()"
          (gerar)="comparar()"
        >
          <button class="btn btn-primary" (click)="comparar()" [disabled]="!podeComparar">
            <span>{{ loading ? 'Comparando...' : '⚖ Comparar' }}</span>
          </button>
        </app-orcamento-input>
        @if (selecionadas.length < minFormacoes) {
          <p class="hint">Selecione ao menos {{ minFormacoes }} formações para comparar.</p>
        }
      </section>

      @if (loading) {
        <app-loading-spinner message="Comparando formações..." [fullPage]="true" />
      } @else if (error) {
        <div class="error-state">
          <app-alert-banner [message]="error" type="error" />
          <button class="btn btn-primary" (click)="comparar()">Tentar novamente</button>
        </div>
      } @else if (resultado) {
        @if (resultado.resultados.length === 0) {
          <app-alert-banner message="Nenhuma formação retornada para comparação." type="info" />
        } @else {
          <div class="cards">
            @for (r of resultado.resultados; track r.formacao; let i = $index) {
              <article
                class="result-card"
                [class.best]="r.formacao === resultado.melhorFormacao && !r.indisponivel"
                [class.unavailable]="r.indisponivel"
              >
                <header class="card-head">
                  <div class="rank-formacao">
                    <span class="rank">{{ medalha(i) }}</span>
                    <span class="formacao">{{ r.formacao }}</span>
                  </div>
                  @if (!r.indisponivel) {
                    <span class="score-total">Score: {{ r.scoreTotal | number: '1.1-1' }}</span>
                  }
                </header>

                @if (r.indisponivel) {
                  <app-alert-banner
                    [message]="r.aviso ?? 'Atletas insuficientes para esta formação.'"
                    type="warning"
                  />
                } @else {
                  <div class="card-meta">
                    @if (r.capitao) {
                      <div class="meta-line">
                        <span class="meta-label">Capitão:</span>
                        <span class="meta-value">
                          {{ r.capitao.apelido }}
                          @if (r.capitao.clube) {
                            <span class="meta-club">({{ r.capitao.clube }})</span>
                          }
                        </span>
                      </div>
                    }
                    <div class="meta-line">
                      <span class="meta-label">Custo:</span>
                      <span class="meta-value">{{ r.custoTotal | number: '1.1-1' }} cartoletas</span>
                    </div>
                  </div>

                  <div class="card-actions">
                    <button
                      type="button"
                      class="btn btn-ghost"
                      (click)="toggleExpandir(r.formacao)"
                    >
                      {{ isExpandida(r.formacao) ? 'Fechar ▲' : 'Ver time ▼' }}
                    </button>
                  </div>

                  @if (isExpandida(r.formacao) && r.time) {
                    <div class="card-detail">
                      <app-team-view [time]="r.time" />

                      @if (r.time.reservaLuxo) {
                        <div class="luxo-line">
                          &#128142; Reserva de luxo: {{ r.time.reservaLuxo.apelido }}
                          @if (r.time.reservaLuxo.clube) {
                            ({{ r.time.reservaLuxo.clube }})
                          }
                        </div>
                      }

                      <button
                        type="button"
                        class="btn btn-primary usar-btn"
                        (click)="solicitarUsar(r.formacao)"
                      >
                        Usar esta formação
                      </button>
                    </div>
                  }
                }
              </article>
            }
          </div>
        }
      }
    </div>

    @if (confirmarFormacao) {
      <div class="modal-overlay" (click)="cancelarUsar()">
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          (click)="$event.stopPropagation()"
        >
          <h2 class="modal-title" id="modal-title">Alterar formação global</h2>
          <p class="modal-text">
            Isso altera a configuração global para a formação
            <strong>{{ confirmarFormacao }}</strong> e afeta a tela de Time. Deseja continuar?
          </p>
          @if (aplicarErro) {
            <app-alert-banner [message]="aplicarErro" type="error" />
          }
          <div class="modal-actions">
            <button class="btn btn-ghost" (click)="cancelarUsar()" [disabled]="aplicando">
              Cancelar
            </button>
            <button class="btn btn-primary" (click)="confirmarUsar()" [disabled]="aplicando">
              {{ aplicando ? 'Aplicando...' : 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .intro {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 1.25rem;
      max-width: 60ch;
    }

    .selector {
      margin-bottom: 1.5rem;
    }

    .selector-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      margin-bottom: 0.6rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    .selector-count {
      text-transform: none;
      letter-spacing: 0;
      color: var(--green-primary);
      font-weight: 600;
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text-primary);
      font-size: 0.9rem;
      font-weight: 600;
      font-family: 'Space Grotesk', sans-serif;
      cursor: pointer;
      transition: border-color 0.15s ease, background 0.15s ease, transform 0.1s ease;

      &:hover:not(:disabled) {
        border-color: rgba(34, 197, 94, 0.45);
        transform: translateY(-1px);
      }

      &.selected {
        background: var(--green-light);
        color: var(--green-primary);
        border-color: rgba(34, 197, 94, 0.5);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .chip-check {
      font-size: 0.8rem;
    }

    .controls-bar {
      margin-bottom: 1.5rem;
    }

    .hint {
      margin-top: 0.6rem;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .error-state {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
      padding: 1rem 0;
    }

    .cards {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .result-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.1rem 1.25rem;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .result-card.best {
      border-color: rgba(245, 158, 11, 0.55);
      box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.2), 0 6px 18px rgba(0, 0, 0, 0.3);
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.06), var(--bg-card) 60%);
    }

    .result-card.unavailable {
      opacity: 0.85;
      border-style: dashed;
    }

    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }

    .rank-formacao {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .rank {
      font-size: 1.25rem;
      min-width: 1.6rem;
      text-align: center;
    }

    .formacao {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      font-family: 'Space Grotesk', sans-serif;
    }

    .score-total {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--green-primary);
      font-family: 'Space Grotesk', sans-serif;
    }

    .card-meta {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      margin-bottom: 0.75rem;
    }

    .meta-line {
      font-size: 0.875rem;
    }

    .meta-label {
      color: var(--text-muted);
      margin-right: 0.4rem;
    }

    .meta-value {
      color: var(--text-primary);
      font-weight: 600;
    }

    .meta-club {
      color: var(--text-muted);
      font-weight: 400;
    }

    .card-actions {
      display: flex;
      justify-content: flex-end;
    }

    .btn-ghost {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-primary);
      padding: 0.4rem 0.9rem;
      border-radius: var(--radius);
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      transition: border-color 0.15s ease, background 0.15s ease;

      &:hover:not(:disabled) {
        border-color: rgba(34, 197, 94, 0.45);
        background: rgba(34, 197, 94, 0.06);
      }
    }

    .card-detail {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }

    .luxo-line {
      margin-top: 0.75rem;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .usar-btn {
      margin-top: 1rem;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 100;
    }

    .modal {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }

    .modal-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.6rem;
    }

    .modal-text {
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 1rem;

      strong { color: #fbbf24; }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
      margin-top: 1rem;
    }

    @media (max-width: 640px) {
      .chips { gap: 0.5rem; }
      .chip { padding: 0.45rem 0.8rem; font-size: 0.85rem; }
    }
  `]
})
export class ComparacaoPageComponent {
  private comparacaoService = inject(ComparacaoService);
  private configService = inject(ConfiguracaoService);
  private router = inject(Router);

  readonly formacoes: string[] = [...FORMACOES_DISPONIVEIS];
  readonly minFormacoes = MIN_FORMACOES;
  readonly maxFormacoes = MAX_FORMACOES;

  selecionadas: string[] = this.readStoredFormacoes();
  orcamento: number | null = this.readStoredOrcamento();

  resultado: CompararResponse | null = null;
  loading = false;
  error = '';

  expandida: string | null = null;

  confirmarFormacao: string | null = null;
  aplicando = false;
  aplicarErro = '';

  isSelecionada(formacao: string): boolean {
    return this.selecionadas.includes(formacao);
  }

  isChipDesabilitada(formacao: string): boolean {
    return !this.isSelecionada(formacao) && this.selecionadas.length >= this.maxFormacoes;
  }

  toggleFormacao(formacao: string): void {
    if (this.isSelecionada(formacao)) {
      this.selecionadas = this.selecionadas.filter((f) => f !== formacao);
    } else if (this.selecionadas.length < this.maxFormacoes) {
      this.selecionadas = [...this.selecionadas, formacao];
    }
    this.persistFormacoes();
  }

  get orcamentoInvalido(): boolean {
    return this.orcamento != null && this.orcamento <= 0;
  }

  get podeComparar(): boolean {
    return (
      this.selecionadas.length >= this.minFormacoes &&
      !this.orcamentoInvalido &&
      !this.loading
    );
  }

  comparar(): void {
    if (!this.podeComparar) {
      return;
    }
    this.persistOrcamento();
    this.loading = true;
    this.error = '';
    this.expandida = null;
    this.comparacaoService.comparar(this.selecionadas, this.orcamento).subscribe({
      next: (data) => {
        this.resultado = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.userMessage ?? 'Erro ao comparar formações.';
        this.loading = false;
      },
    });
  }

  onLimparOrcamento(): void {
    this.orcamento = null;
    this.persistOrcamento();
  }

  isExpandida(formacao: string): boolean {
    return this.expandida === formacao;
  }

  toggleExpandir(formacao: string): void {
    // Apenas um card expandido por vez.
    this.expandida = this.isExpandida(formacao) ? null : formacao;
  }

  medalha(index: number): string {
    switch (index) {
      case 0:
        return '\u{1F947}';
      case 1:
        return '\u{1F948}';
      case 2:
        return '\u{1F949}';
      default:
        return `${index + 1}º`;
    }
  }

  solicitarUsar(formacao: string): void {
    this.aplicarErro = '';
    this.confirmarFormacao = formacao;
  }

  cancelarUsar(): void {
    if (this.aplicando) {
      return;
    }
    this.confirmarFormacao = null;
    this.aplicarErro = '';
  }

  confirmarUsar(): void {
    if (!this.confirmarFormacao || this.aplicando) {
      return;
    }
    const formacao = this.confirmarFormacao;
    this.aplicando = true;
    this.aplicarErro = '';
    this.configService.patchConfig(formacaoParaConfig(formacao)).subscribe({
      next: () => {
        this.aplicando = false;
        this.confirmarFormacao = null;
        this.router.navigate(['/time']);
      },
      error: (err) => {
        this.aplicando = false;
        this.aplicarErro = err.userMessage ?? 'Erro ao aplicar formação.';
      },
    });
  }

  private readStoredFormacoes(): string[] {
    try {
      const stored = sessionStorage.getItem(FORMACOES_STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      // Mantém apenas formações válidas e respeita o limite máximo.
      return parsed
        .filter((f): f is string => typeof f === 'string' && this.formacoes.includes(f))
        .slice(0, this.maxFormacoes);
    } catch {
      return [];
    }
  }

  private persistFormacoes(): void {
    try {
      sessionStorage.setItem(FORMACOES_STORAGE_KEY, JSON.stringify(this.selecionadas));
    } catch {
      // sessionStorage indisponível — persistência é best-effort
    }
  }

  private readStoredOrcamento(): number | null {
    try {
      const stored = sessionStorage.getItem(ORCAMENTO_STORAGE_KEY);
      if (stored == null || stored === '') return null;
      const parsed = Number(stored);
      return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
    } catch {
      return null;
    }
  }

  private persistOrcamento(): void {
    try {
      if (this.orcamento == null) {
        sessionStorage.removeItem(ORCAMENTO_STORAGE_KEY);
      } else {
        sessionStorage.setItem(ORCAMENTO_STORAGE_KEY, String(this.orcamento));
      }
    } catch {
      // sessionStorage indisponível — persistência é best-effort
    }
  }
}
