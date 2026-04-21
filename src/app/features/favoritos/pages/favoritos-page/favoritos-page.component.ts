import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { FavoritosResponse, JogoFavorito, JogoDescartado } from '../../../../shared/models/favoritos.model';
import { FavoritosService } from '../../services/favoritos.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';

@Component({
  selector: 'app-favoritos-page',
  standalone: true,
  imports: [FormsModule, DecimalPipe, LoadingSpinnerComponent, AlertBannerComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">&#11088; Favoritos por Odds</h1>
      </div>

      <div class="filters-bar">
        <div class="filter-group">
          <label class="filter-label" for="oddLimite">ODD máxima para favorito</label>
          <div class="filter-input-wrap">
            <input
              id="oddLimite"
              type="number"
              class="form-control odd-input"
              [(ngModel)]="oddLimite"
              min="1.1"
              max="10"
              step="0.1"
              placeholder="ex: 3.0"
            />
            <button class="btn btn-primary" (click)="buscar()" [disabled]="loading">
              {{ loading ? 'Buscando...' : 'Buscar' }}
            </button>
            <button class="btn btn-secondary" (click)="resetar()" [disabled]="loading">
              Padrão
            </button>
          </div>
          <p class="filter-hint">
            Odds abaixo desse limite indicam um favorito claro. Quanto menor, mais restritivo.
          </p>
        </div>
      </div>

      @if (loading) {
        <app-loading-spinner message="Analisando odds..." [fullPage]="true" />
      } @else if (error) {
        <div class="error-state">
          <app-alert-banner [message]="error" type="error" />
          <button class="btn btn-primary" (click)="buscar()">Tentar novamente</button>
        </div>
      } @else if (data) {
        <div class="summary-bar">
          <div class="summary-pill green">
            <span class="pill-num">{{ data.favoritos.length }}</span>
            <span class="pill-lbl">Favoritos</span>
          </div>
          <div class="summary-pill gray">
            <span class="pill-num">{{ data.descartados.length }}</span>
            <span class="pill-lbl">Descartados</span>
          </div>
          <div class="summary-pill blue">
            <span class="pill-num">{{ data.favoritos.length + data.descartados.length }}</span>
            <span class="pill-lbl">Total de jogos</span>
          </div>
          <span class="odd-limite-used">Limite utilizado: <strong>{{ data.oddLimiteUtilizado | number:'1.1-1' }}</strong></span>
        </div>

        @if (data.favoritos.length > 0) {
          <section class="games-section">
            <h2 class="section-title">&#9989; Times Favoritos</h2>
            <div class="games-grid">
              @for (jogo of data.favoritos; track jogo.timeFavorito + jogo.timeAdversario) {
                <div class="match-card fav-card">
                  <div class="match-header">
                    <span class="home-tag">{{ jogo.favoritoEmCasa ? '&#127968; Casa' : '&#9992;&#65039; Fora' }}</span>
                    <span class="fav-star">&#11088; Favorito</span>
                  </div>

                  <div class="match-teams">
                    <div class="team-block fav-team">
                      <span class="team-name">{{ jogo.timeFavorito }}</span>
                      <span class="team-odd fav-odd">{{ jogo.oddFavorito | number:'1.2-2' }}</span>
                      <span class="odd-label">Odd favorito</span>
                    </div>

                    <div class="vs-block">
                      <span class="vs-text">VS</span>
                      @if (jogo.oddEmpate) {
                        <div class="empate-odd">
                          <span class="empate-val">{{ jogo.oddEmpate | number:'1.2-2' }}</span>
                          <span class="empate-label">Empate</span>
                        </div>
                      }
                    </div>

                    <div class="team-block adv-team">
                      <span class="team-name">{{ jogo.timeAdversario }}</span>
                      <span class="team-odd adv-odd">{{ jogo.oddAdversario | number:'1.2-2' }}</span>
                      <span class="odd-label">Odd adversário</span>
                    </div>
                  </div>

                  <div class="match-footer">
                    <div class="prob-bar-wrap">
                      <div class="prob-label-row">
                        <span class="prob-lbl-left">{{ jogo.timeFavorito }}</span>
                        <span class="prob-lbl-right">{{ jogo.timeAdversario }}</span>
                      </div>
                      <div class="prob-bar">
                        <div class="prob-fav" [style.width.%]="probFavorito(jogo)"></div>
                        @if (jogo.oddEmpate) {
                          <div class="prob-emp" [style.width.%]="probEmpate(jogo)"></div>
                        }
                        <div class="prob-adv" [style.flex]="1"></div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>
        } @else {
          <div class="empty-state">
            <span class="empty-icon">&#128269;</span>
            <span class="empty-title">Nenhum favorito encontrado</span>
            <span class="empty-desc">Tente aumentar o limite de odd para incluir mais jogos como favoritos.</span>
          </div>
        }

        @if (data.descartados.length > 0) {
          <section class="games-section discarded-section">
            <h2 class="section-title">&#10060; Jogos Descartados</h2>
            <p class="discarded-info">
              Jogos equilibrados onde nenhum time tem odd abaixo do limite de
              <strong>{{ data.oddLimiteUtilizado | number:'1.1-1' }}</strong>.
              Evite escalar atletas desses times na posição titular.
            </p>
            <div class="discarded-list">
              @for (jogo of data.descartados; track jogo.timeCasa + jogo.timeVisitante) {
                <div class="discarded-card">
                  <div class="discarded-teams">
                    <span class="disc-team">{{ jogo.timeCasa }}</span>
                    <span class="disc-vs">×</span>
                    <span class="disc-team">{{ jogo.timeVisitante }}</span>
                  </div>
                  <span class="disc-motivo">{{ jogo.motivo }}</span>
                </div>
              }
            </div>
          </section>
        }
      }
    </div>
  `,
  styles: [`
    .filters-bar {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.5rem;
    }

    .filter-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 0.5rem;
    }

    .filter-input-wrap {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .odd-input {
      width: 120px;
    }

    .filter-hint {
      margin-top: 0.625rem;
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .error-state {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    .summary-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .summary-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 1rem;
      border-radius: 9999px;
      font-size: 0.85rem;

      &.green {
        background: var(--green-light);
        border: 1px solid rgba(34,197,94,0.25);

        .pill-num { color: var(--green-primary); font-weight: 700; font-size: 1rem; }
        .pill-lbl { color: #4ade80; }
      }

      &.gray {
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--border);

        .pill-num { color: var(--text-secondary); font-weight: 700; font-size: 1rem; }
        .pill-lbl { color: var(--text-muted); }
      }

      &.blue {
        background: var(--blue-light);
        border: 1px solid rgba(59,130,246,0.25);

        .pill-num { color: var(--blue); font-weight: 700; font-size: 1rem; }
        .pill-lbl { color: #60a5fa; }
      }
    }

    .odd-limite-used {
      margin-left: auto;
      font-size: 0.8rem;
      color: var(--text-muted);

      strong { color: var(--text-secondary); }
    }

    .games-section {
      margin-bottom: 2.5rem;
    }

    .games-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }

    .match-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.25rem;
      transition: transform 0.15s, box-shadow 0.15s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      &.fav-card {
        border-color: rgba(34,197,94,0.2);

        &:hover {
          border-color: rgba(34,197,94,0.35);
        }
      }
    }

    .match-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      .home-tag {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
      }

      .fav-star {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.2rem 0.6rem;
        background: var(--green-light);
        color: #4ade80;
        border: 1px solid rgba(34,197,94,0.25);
        border-radius: 9999px;
      }
    }

    .match-teams {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 0.75rem;
      align-items: center;
      margin-bottom: 1rem;
    }

    .team-block {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;

      .team-name {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--text-primary);
        font-family: 'Space Grotesk', sans-serif;
      }

      .team-odd {
        font-size: 1.25rem;
        font-weight: 700;
        font-family: 'Space Grotesk', sans-serif;
      }

      .odd-label {
        font-size: 0.68rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      &.fav-team {
        .team-odd { color: #4ade80; }
      }

      &.adv-team {
        text-align: right;
        align-items: flex-end;
        .team-odd { color: var(--text-secondary); }
      }
    }

    .vs-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;

      .vs-text {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--text-muted);
        letter-spacing: 0.1em;
      }

      .empate-odd {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.1rem;
        padding: 0.3rem 0.5rem;
        background: rgba(255,255,255,0.05);
        border-radius: 8px;

        .empate-val {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .empate-label {
          font-size: 0.6rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }
      }
    }

    .prob-bar-wrap {
      .prob-label-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.3rem;
        font-size: 0.7rem;
        color: var(--text-muted);
      }
    }

    .prob-bar {
      display: flex;
      height: 6px;
      border-radius: 9999px;
      overflow: hidden;
      background: rgba(255,255,255,0.08);

      .prob-fav {
        background: #22c55e;
        border-radius: 9999px 0 0 9999px;
      }

      .prob-emp {
        background: #94a3b8;
      }

      .prob-adv {
        background: #ef4444;
        border-radius: 0 9999px 9999px 0;
      }
    }

    .discarded-section {
      .section-title { color: var(--text-secondary); }
    }

    .discarded-info {
      margin-bottom: 1rem;
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.6;

      strong { color: var(--text-secondary); }
    }

    .discarded-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .discarded-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1.25rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      opacity: 0.7;
      flex-wrap: wrap;
    }

    .discarded-teams {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .disc-team {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-secondary);
      }

      .disc-vs {
        font-size: 0.8rem;
        color: var(--text-muted);
        font-weight: 700;
      }
    }

    .disc-motivo {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    @media (max-width: 640px) {
      .games-grid { grid-template-columns: 1fr; }
      .odd-limite-used { margin-left: 0; width: 100%; }
    }
  `]
})
export class FavoritosPageComponent implements OnInit {
  private favoritosService = inject(FavoritosService);

  data: FavoritosResponse | null = null;
  loading = false;
  error = '';
  oddLimite: number | null = null;

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    this.loading = true;
    this.error = '';
    this.favoritosService.getFavoritos(this.oddLimite ?? undefined).subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.userMessage ?? 'Erro ao carregar favoritos.';
        this.loading = false;
      }
    });
  }

  resetar(): void {
    this.oddLimite = null;
    this.buscar();
  }

  probFavorito(jogo: JogoFavorito): number {
    const total = 1 / jogo.oddFavorito + 1 / jogo.oddAdversario + (jogo.oddEmpate ? 1 / jogo.oddEmpate : 0);
    return ((1 / jogo.oddFavorito) / total) * 100;
  }

  probEmpate(jogo: JogoFavorito): number {
    if (!jogo.oddEmpate) return 0;
    const total = 1 / jogo.oddFavorito + 1 / jogo.oddAdversario + 1 / jogo.oddEmpate;
    return ((1 / jogo.oddEmpate) / total) * 100;
  }
}
