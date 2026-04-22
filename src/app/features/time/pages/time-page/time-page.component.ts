import { Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TimeResponse } from '../../../../shared/models/time.model';
import { TimeService } from '../../services/time.service';
import { TeamViewComponent } from '../../components/team-view/team-view.component';
import { PlayerCardComponent } from '../../components/player-card/player-card.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';

@Component({
    selector: 'app-time-page',
    imports: [
        DecimalPipe,
        TeamViewComponent,
        PlayerCardComponent,
        LoadingSpinnerComponent,
        AlertBannerComponent
    ],
    template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">&#9917; Time da Rodada</h1>
        <div class="header-actions">
          @if (time?.rodada) {
            <span class="rodada-badge">Rodada {{ time!.rodada }}</span>
          }
          <button class="btn btn-secondary" (click)="load()" [disabled]="loading">
            <span>{{ loading ? 'Carregando...' : '&#8635; Atualizar' }}</span>
          </button>
        </div>
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

        @if (time.alertasDuvida && time.alertasDuvida.length > 0) {
          <div class="alerts-block">
            @for (alerta of time.alertasDuvida; track alerta) {
              <app-alert-banner [message]="alerta" type="warning" />
            }
          </div>
        }

        <section class="team-section">
          <div class="section-header">
            <h2 class="section-title">&#128101; Formação 4-3-3</h2>
            @if (time.capitao) {
              <div class="capitao-info">
                <span class="capitao-label">Capitão:</span>
                <span class="capitao-name">{{ time.capitao.apelido }}</span>
                <span class="capitao-score">(Score {{ time.capitao.score | number:'1.1-1' }})</span>
              </div>
            }
          </div>
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
              <div class="stat-val">C$ {{ totalPreco | number:'1.0-0' }}</div>
              <div class="stat-lbl">Custo estimado</div>
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
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

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

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.timeService.getTime().subscribe({
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
