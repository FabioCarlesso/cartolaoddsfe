import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { RankingResponse } from '../../../../shared/models/ranking.model';
import { Atleta } from '../../../../shared/models/atleta.model';
import { RankingService } from '../../services/ranking.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { getScoreCriteriaLabel, getScoreDescription, getScorePercent } from '../../../../shared/utils/score-info.util';

interface PosicaoOption {
  value: string;
  label: string;
}

@Component({
    selector: 'app-ranking-page',
    imports: [FormsModule, DecimalPipe, LoadingSpinnerComponent, AlertBannerComponent],
    template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">&#127942; Ranking de Atletas</h1>
        @if (data?.rodada) {
          <span class="rodada-badge">Rodada {{ data!.rodada }}</span>
        }
      </div>

      <div class="filters-bar">
        <div class="filters-left">
          <div class="form-group">
            <label for="posicao">Posição</label>
            <select id="posicao" class="form-control" [(ngModel)]="posicaoSelecionada" (change)="buscar()">
              @for (opt of posicoes; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label for="limite">Qtd. jogadores</label>
            <select id="limite" class="form-control" [(ngModel)]="limiteSelecionado" (change)="buscar()">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <button class="btn btn-secondary" (click)="buscar()" [disabled]="loading">
          {{ loading ? 'Buscando...' : '&#8635; Atualizar' }}
        </button>
      </div>

      @if (loading) {
        <app-loading-spinner message="Carregando ranking..." [fullPage]="true" />
      } @else if (error) {
        <div class="error-state">
          <app-alert-banner [message]="error" type="error" />
          <button class="btn btn-primary" (click)="buscar()">Tentar novamente</button>
        </div>
      } @else if (data) {
        @if (data.avisoMercado) {
          <app-alert-banner [message]="data.avisoMercado" type="warning" />
        }

        <div class="results-header">
          <div class="results-summary">
            <span class="results-count">{{ data.atletas.length }} atletas</span>
            @if (posicaoSelecionada) {
              <span class="results-filter">Filtrando por: <strong>{{ posicaoSelecionada }}</strong></span>
            }
          </div>
          <span class="score-context">{{ scoreContextMessage }}</span>
        </div>

        <div class="ranking-table-wrap">
          <table class="ranking-table">
            <thead>
              <tr>
                <th class="th-rank">#</th>
                <th class="th-player">Atleta</th>
                <th class="th-pos">Pos</th>
                <th class="th-score">Score</th>
                <th class="th-media">Média</th>
                <th class="th-price">Preço</th>
                <th class="th-var">Var.</th>
                <th class="th-status">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (atleta of data.atletas; track atleta.apelido; let i = $index) {
                <tr class="ranking-row" [class.row-doubt]="atleta.emDuvida" [class.top-3]="i < 3">
                  <td class="td-rank">
                    @if (i === 0) {
                      <span class="medal gold">&#129351;</span>
                    } @else if (i === 1) {
                      <span class="medal silver">&#129352;</span>
                    } @else if (i === 2) {
                      <span class="medal bronze">&#129353;</span>
                    } @else {
                      <span class="rank-num">{{ i + 1 }}</span>
                    }
                  </td>
                  <td class="td-player">
                    <div class="player-info">
                      <span class="player-apelido">{{ atleta.apelido }}</span>
                      @if (atleta.clube) {
                        <span class="player-club">{{ atleta.clube }}</span>
                      }
                    </div>
                  </td>
                  <td class="td-pos">
                    <span class="pos-chip" [attr.data-pos]="atleta.posicao">{{ atleta.posicao }}</span>
                  </td>
                  <td class="td-score">
                    <div class="score-cell">
                      <span class="score-num">{{ atleta.score | number:'1.1-1' }}</span>
                      <span class="score-criterion" [title]="scoreDescription(atleta) ?? scoreCriteriaLabel(atleta)">
                        {{ scoreCriteriaLabel(atleta) }}
                      </span>
                      <div class="mini-bar">
                        <div class="mini-fill" [style.width.%]="scorePercent(atleta)"></div>
                      </div>
                    </div>
                  </td>
                  <td class="td-media">{{ atleta.mediaPontos | number:'1.1-1' }}</td>
                  <td class="td-price">C$ {{ atleta.preco | number:'1.0-0' }}</td>
                  <td class="td-var" [class.var-pos]="atleta.valorizacao > 0" [class.var-neg]="atleta.valorizacao < 0">
                    {{ atleta.valorizacao > 0 ? '+' : '' }}{{ atleta.valorizacao | number:'1.1-1' }}
                  </td>
                  <td class="td-status">
                    @if (atleta.emDuvida) {
                      <span class="status-badge doubt">&#9888; Dúvida</span>
                    } @else {
                      <span class="status-badge ok">&#10003; Provável</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (data.atletas.length === 0) {
          <div class="empty-state">
            <span class="empty-icon">&#128269;</span>
            <span class="empty-title">Nenhum atleta encontrado</span>
            <span class="empty-desc">Tente outros filtros ou verifique a conexão com o backend.</span>
          </div>
        }
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

    .filters-bar {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1.25rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      flex-wrap: wrap;
    }

    .filters-left {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      label {
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
    }

    .error-state {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    .results-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 0.875rem;
      color: var(--text-muted);
      flex-wrap: wrap;

      strong { color: var(--text-secondary); }
    }

    .results-summary {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .score-context {
      color: var(--text-secondary);
      font-size: 0.78rem;
    }

    .ranking-table-wrap {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      overflow-x: auto;
    }

    .ranking-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;

      th {
        padding: 0.75rem 1rem;
        text-align: left;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-muted);
        background: rgba(0, 0, 0, 0.2);
        border-bottom: 1px solid var(--border);
        white-space: nowrap;
      }
    }

    .ranking-row {
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      transition: background 0.1s;

      td {
        padding: 0.75rem 1rem;
        vertical-align: middle;
        white-space: nowrap;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.03);
      }

      &.row-doubt {
        background: rgba(245, 158, 11, 0.03);
      }

      &.top-3 td:first-child {
        font-weight: 700;
      }

      &:last-child {
        border-bottom: none;
      }
    }

    .medal { font-size: 1.2rem; }
    .rank-num {
      color: var(--text-muted);
      font-size: 0.875rem;
      font-weight: 600;
    }

    .player-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;

      .player-apelido {
        font-weight: 600;
        color: var(--text-primary);
      }

      .player-club {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .pos-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 38px;
      height: 22px;
      border-radius: 6px;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0 0.4rem;

      &[data-pos="GOL"] { background: rgba(239,68,68,0.18); color: #f87171; }
      &[data-pos="LAT"] { background: rgba(59,130,246,0.18); color: #60a5fa; }
      &[data-pos="ZAG"] { background: rgba(139,92,246,0.18); color: #a78bfa; }
      &[data-pos="MEI"] { background: rgba(34,197,94,0.18); color: #4ade80; }
      &[data-pos="ATA"] { background: rgba(245,158,11,0.18); color: #fbbf24; }
      &[data-pos="TEC"] { background: rgba(156,163,175,0.18); color: #9ca3af; }
    }

    .score-cell {
      min-width: 100px;

      .score-num {
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--green-primary);
        display: block;
      }

      .score-criterion {
        display: block;
        max-width: 150px;
        margin: 0.1rem 0 0.25rem;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--text-muted);
        font-size: 0.68rem;
      }
    }

    .mini-bar {
      height: 3px;
      background: rgba(255,255,255,0.08);
      border-radius: 9999px;
      overflow: hidden;
      width: 80px;

      .mini-fill {
        height: 100%;
        background: linear-gradient(90deg, #22c55e, #10b981);
        border-radius: 9999px;
      }
    }

    .var-pos { color: #4ade80; font-weight: 600; }
    .var-neg { color: #f87171; font-weight: 600; }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.68rem;
      font-weight: 700;

      &.doubt {
        background: rgba(245,158,11,0.12);
        color: #fbbf24;
        border: 1px solid rgba(245,158,11,0.25);
      }

      &.ok {
        background: rgba(34,197,94,0.1);
        color: #4ade80;
        border: 1px solid rgba(34,197,94,0.2);
      }
    }

    @media (max-width: 768px) {
      .filters-bar { flex-direction: column; align-items: stretch; }
      .filters-left { flex-direction: column; }
      .th-var, .td-var, .th-media, .td-media { display: none; }
    }
  `]
})
export class RankingPageComponent implements OnInit {
  private rankingService = inject(RankingService);

  data: RankingResponse | null = null;
  loading = false;
  error = '';

  posicaoSelecionada = '';
  limiteSelecionado = 25;

  posicoes: PosicaoOption[] = [
    { value: '', label: 'Todas as posições' },
    { value: 'GOL', label: 'Goleiro (GOL)' },
    { value: 'LAT', label: 'Lateral (LAT)' },
    { value: 'ZAG', label: 'Zagueiro (ZAG)' },
    { value: 'MEI', label: 'Meia (MEI)' },
    { value: 'ATA', label: 'Atacante (ATA)' },
    { value: 'TEC', label: 'Técnico (TEC)' }
  ];

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    this.loading = true;
    this.error = '';
    this.rankingService
      .getRanking(this.posicaoSelecionada || undefined, this.limiteSelecionado)
      .subscribe({
        next: (data) => {
          this.data = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.userMessage ?? 'Erro ao carregar ranking.';
          this.loading = false;
        }
      });
  }

  scorePercent(atleta: Atleta): number {
    return getScorePercent(atleta.score);
  }

  scoreCriteriaLabel(atleta: Atleta): string {
    return getScoreCriteriaLabel(atleta);
  }

  scoreDescription(atleta: Atleta): string | null {
    return getScoreDescription(atleta);
  }

  get scoreContextMessage(): string {
    if (!this.data) {
      return '';
    }

    if (this.posicaoSelecionada && this.data.criteriosScorePorPosicao?.[this.posicaoSelecionada]) {
      return this.data.criteriosScorePorPosicao[this.posicaoSelecionada];
    }

    return this.data.criterioScore
      ?? this.data.descricaoScore
      ?? 'Score calculado pela API com critérios por posição quando disponíveis.';
  }
}
