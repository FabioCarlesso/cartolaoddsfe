import { Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TimeResponse } from '../../../../shared/models/time.model';
import { TimeService } from '../../services/time.service';
import { TeamViewComponent } from '../../components/team-view/team-view.component';
import { PlayerCardComponent } from '../../components/player-card/player-card.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { OrcamentoInputComponent } from '../../../../shared/components/orcamento-input/orcamento-input.component';

const ORCAMENTO_STORAGE_KEY = 'time.orcamento';

@Component({
    selector: 'app-time-page',
    imports: [
        DecimalPipe,
        TeamViewComponent,
        PlayerCardComponent,
        LoadingSpinnerComponent,
        AlertBannerComponent,
        OrcamentoInputComponent
    ],
    template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">&#9917; Time da Rodada</h1>
        @if (time?.rodada) {
          <span class="rodada-badge">Rodada {{ time!.rodada }}</span>
        }
      </div>

      <div class="controls-bar">
        <app-orcamento-input
          [(orcamento)]="orcamento"
          (limpar)="onLimparOrcamento()"
          (gerar)="load()"
        >
          <button class="btn btn-primary" (click)="load()" [disabled]="loading || orcamentoInvalido">
            <span>{{ loading ? 'Carregando...' : '&#128260; Gerar Time' }}</span>
          </button>
        </app-orcamento-input>
      </div>

      @if (loading) {
        <app-loading-spinner message="Montando time ideal..." [fullPage]="true" />
      } @else if (error) {
        <div class="error-state">
          <app-alert-banner [message]="error" type="error" />
          <button class="btn btn-primary" (click)="load()">Tentar novamente</button>
        </div>
      } @else if (time) {
        @if (time.avisoMercado) {
          <app-alert-banner [message]="time.avisoMercado" type="warning" />
        }

        @if (time.avisoOrcamento) {
          <app-alert-banner [message]="time.avisoOrcamento" type="warning" />
        }

        @if (time.alertasDuvida && time.alertasDuvida.length > 0) {
          <div class="alerts-block">
            @for (alerta of time.alertasDuvida; track alerta) {
              <app-alert-banner [message]="alerta" type="warning" />
            }
          </div>
        }

        <section class="team-section">
          <div class="section-header">
            <div class="section-title-group">
              <h2 class="section-title">&#128101; Formação 4-3-3</h2>
              <span
                class="estrategia-badge"
                [attr.data-estrategia]="time.estrategia"
                [title]="estrategiaTooltip"
              >
                {{ estrategiaLabel }}
              </span>
            </div>
            @if (time.capitao) {
              <div class="capitao-info">
                <span class="capitao-label">Capitão:</span>
                <span class="capitao-name">{{ time.capitao.apelido }}</span>
                <span class="capitao-score">(Score {{ time.capitao.score | number:'1.1-1' }})</span>
              </div>
            }
          </div>

          @if (time.orcamentoInformado != null) {
            <div class="budget-bar" [class.over]="custoTotal > time.orcamentoInformado">
              <div class="budget-top">
                <span class="budget-label">
                  Custo total: <strong>{{ custoTotal | number:'1.1-1' }}</strong>
                  / {{ time.orcamentoInformado | number:'1.1-1' }} cartoletas
                </span>
                <span class="budget-pct">{{ budgetPercent | number:'1.1-1' }}%</span>
              </div>
              <div class="budget-track">
                <div class="budget-progress" [style.width.%]="budgetPercentClamped"></div>
              </div>
              <div class="budget-saldo">
                Saldo restante: {{ time.saldoRestante | number:'1.1-1' }} cartoletas
              </div>
              <div class="budget-note">
                &#127942; Maior score possível dentro do orçamento.
              </div>
            </div>
          } @else {
            <div class="custo-total-line">
              Custo total: <strong>{{ custoTotal | number:'1.1-1' }}</strong> cartoletas
            </div>
          }

          <app-team-view [time]="time" />
        </section>

        <div class="bottom-grid">
          <section class="reserves-section">
            <h2 class="section-title">&#128260; Reservas</h2>
            @if (time.reservas && time.reservas.length > 0) {
              <div class="reserves-grid">
                @for (atleta of time.reservas; track atleta.apelido) {
                  <app-player-card [atleta]="atleta" [isReserve]="true" />
                }
              </div>
            } @else {
              <div class="empty-state">
                <span class="empty-icon">&#128260;</span>
                <span class="empty-title">Sem reservas disponíveis</span>
              </div>
            }
          </section>

          @if (time.reservaLuxo) {
            <section class="luxury-section">
              <h2 class="section-title">&#11088; Reserva de Luxo</h2>
              <div class="luxury-card-wrap">
                <app-player-card [atleta]="time.reservaLuxo" [isLuxuryReserve]="true" />
              </div>
              <p class="luxury-desc">
                Maior score fora da titularidade — troca qualquer reserva na sua escalação.
              </p>
            </section>
          }
        </div>

        <div class="stats-summary">
          <div class="stat-card">
            <span class="stat-icon">&#129351;</span>
            <div>
              <div class="stat-val">{{ titularesCount }}</div>
              <div class="stat-lbl">Titulares</div>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">&#9888;</span>
            <div>
              <div class="stat-val doubt">{{ duvidaCount }}</div>
              <div class="stat-lbl">Em dúvida</div>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">&#128178;</span>
            <div>
              <div class="stat-val">C$ {{ custoTotal | number:'1.1-1' }}</div>
              <div class="stat-lbl">Custo total</div>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">&#128200;</span>
            <div>
              <div class="stat-val green">{{ mediaScore | number:'1.1-1' }}</div>
              <div class="stat-lbl">Score médio</div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
    styles: [`
    .rodada-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.3rem 0.875rem;
      background: var(--green-light);
      color: var(--green-primary);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .controls-bar {
      margin-bottom: 1.5rem;
    }

    .section-title-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .estrategia-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.7rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;

      &[data-estrategia="SCORE_MAXIMO"] {
        background: rgba(245, 158, 11, 0.12);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.3);
      }
    }

    .budget-bar {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 0.875rem 1rem;
      margin-bottom: 1.25rem;
    }

    .budget-top {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 0.5rem;
    }

    .budget-label {
      font-size: 0.875rem;
      color: var(--text-muted);

      strong { color: var(--text-primary); font-weight: 700; }
    }

    .budget-pct {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--green-primary);
      font-family: 'Space Grotesk', sans-serif;
    }

    .budget-track {
      height: 8px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 9999px;
      overflow: hidden;
    }

    .budget-progress {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #10b981);
      border-radius: 9999px;
      transition: width 0.6s ease;
    }

    .budget-saldo {
      margin-top: 0.5rem;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .budget-note {
      margin-top: 0.35rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      font-style: italic;
    }

    .budget-bar.over {
      border-color: rgba(239, 68, 68, 0.4);

      .budget-pct { color: var(--red); }
      .budget-progress { background: linear-gradient(90deg, #ef4444, #f87171); }
    }

    .custo-total-line {
      font-size: 0.95rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;

      strong { color: var(--text-primary); font-weight: 700; }
    }

    .error-state {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
      padding: 1rem 0;
    }

    .alerts-block {
      margin-bottom: 1rem;
    }

    .team-section {
      margin-bottom: 2rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .capitao-info {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.875rem;
      padding: 0.375rem 0.875rem;
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 9999px;

      .capitao-label { color: var(--text-muted); }
      .capitao-name { color: #fbbf24; font-weight: 600; }
      .capitao-score { color: var(--text-muted); font-size: 0.8rem; }
    }

    .bottom-grid {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 1.5rem;
      margin-bottom: 2rem;
      align-items: start;
    }

    .reserves-section, .luxury-section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.25rem;
    }

    .reserves-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 0.75rem;
    }

    .luxury-card-wrap {
      max-width: 280px;
    }

    .luxury-desc {
      margin-top: 0.75rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .stats-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;

      .stat-icon {
        font-size: 1.75rem;
        opacity: 0.8;
      }

      .stat-val {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
        font-family: 'Space Grotesk', sans-serif;

        &.doubt { color: #fbbf24; }
        &.green { color: #4ade80; }
      }

      .stat-lbl {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-top: 0.1rem;
      }
    }

    @media (max-width: 1024px) {
      .bottom-grid {
        grid-template-columns: 1fr;
      }

      .stats-summary {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .stats-summary {
        grid-template-columns: 1fr 1fr;
      }
    }
  `]
})
export class TimePageComponent implements OnInit {
  private timeService = inject(TimeService);

  time: TimeResponse | null = null;
  loading = false;
  error = '';
  orcamento: number | null = this.readStoredOrcamento();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (this.orcamentoInvalido) {
      return;
    }
    this.persistOrcamento();
    this.loading = true;
    this.error = '';
    this.timeService.getTime(this.orcamento).subscribe({
      next: (data) => {
        this.time = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.userMessage ?? 'Erro ao carregar time.';
        this.loading = false;
      }
    });
  }

  onLimparOrcamento(): void {
    this.orcamento = null;
    this.persistOrcamento();
  }

  get orcamentoInvalido(): boolean {
    return this.orcamento != null && this.orcamento <= 0;
  }

  get estrategiaLabel(): string {
    return '\u{1F3C6} Score Máximo';
  }

  get estrategiaTooltip(): string {
    return this.time?.orcamentoInformado != null
      ? 'Maior score possível dentro do orçamento'
      : 'Time de maior score possível';
  }

  get custoTotal(): number {
    if (this.time?.custoTotal != null) {
      return this.time.custoTotal;
    }
    return this.totalPreco;
  }

  get budgetPercent(): number {
    const orcamento = this.time?.orcamentoInformado;
    if (!orcamento) return 0;
    return (this.custoTotal / orcamento) * 100;
  }

  get budgetPercentClamped(): number {
    return Math.min(100, Math.max(0, this.budgetPercent));
  }

  private readStoredOrcamento(): number | null {
    try {
      const stored = sessionStorage.getItem(ORCAMENTO_STORAGE_KEY);
      if (stored == null || stored === '') return null;
      const parsed = Number(stored);
      // Descarta valores não numéricos ou <= 0 para não travar o load inicial
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

  get titularesCount(): number {
    return this.time?.titulares.length ?? 0;
  }

  get duvidaCount(): number {
    return this.time?.titulares.filter((a) => a.emDuvida).length ?? 0;
  }

  get totalPreco(): number {
    const titulares = this.time?.titulares ?? [];
    return titulares.reduce((sum, a) => sum + (a.preco ?? 0), 0);
  }

  get mediaScore(): number {
    const titulares = this.time?.titulares ?? [];
    if (titulares.length === 0) return 0;
    return titulares.reduce((sum, a) => sum + (a.score ?? 0), 0) / titulares.length;
  }
}
