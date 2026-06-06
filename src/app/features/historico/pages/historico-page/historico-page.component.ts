import { Component, OnInit, inject } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RodadaResumo } from '../../../../shared/models/historico.model';
import { HistoricoService } from '../../services/historico.service';
import { getPerformanceDelta, PerformanceDelta } from '../../../../shared/utils/performance.util';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';

interface EvolucaoPonto {
  rodadaId: number;
  valor: number;
  x: number;
  y: number;
}

@Component({
  selector: 'app-historico-page',
  imports: [DecimalPipe, DatePipe, RouterLink, LoadingSpinnerComponent, AlertBannerComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">&#128203; Histórico de Escalações</h1>
      </div>

      @if (loading) {
        <app-loading-spinner message="Carregando histórico..." [fullPage]="true" />
      } @else if (error) {
        <div class="error-state">
          <app-alert-banner [message]="error" type="error" />
          <button class="btn btn-primary" (click)="carregar()">Tentar novamente</button>
        </div>
      } @else if (rodadas.length === 0) {
        <div class="empty-state">
          <span class="empty-icon">&#128203;</span>
          <span class="empty-title">Nenhuma escalação registrada.</span>
          <span class="empty-desc">Gere seu primeiro time para começar o histórico.</span>
          <a class="btn btn-primary" routerLink="/time">Ir para montagem do time</a>
        </div>
      } @else {
        @if (evolucao.length >= 3) {
          <section class="evolucao-section">
            <h2 class="section-title">Pontuação real por rodada</h2>
            <svg class="evolucao-chart" viewBox="0 0 320 140" preserveAspectRatio="none"
                 role="img" aria-label="Gráfico de evolução da pontuação real por rodada">
              <polyline class="evolucao-line"
                [attr.points]="evolucaoLinha" fill="none" />
              @for (p of evolucao; track p.rodadaId) {
                <circle class="evolucao-dot" [attr.cx]="p.x" [attr.cy]="p.y" r="4" />
                <text class="evolucao-valor" [attr.x]="p.x" [attr.y]="p.y - 8" text-anchor="middle">
                  {{ p.valor | number:'1.0-1' }}
                </text>
                <text class="evolucao-label" [attr.x]="p.x" y="134" text-anchor="middle">
                  R{{ p.rodadaId }}
                </text>
              }
            </svg>
          </section>
        }

        <div class="rodadas-list">
          @for (r of rodadas; track r.rodadaId) {
            <div class="rodada-card" [class]="'border-' + delta(r).level">
              <div class="rodada-head">
                <span class="rodada-num">Rodada {{ r.rodadaId }}</span>
                <span class="rodada-sep">&bull;</span>
                <span class="rodada-data">{{ r.criadoEm | date:'dd/MM/yyyy' }}</span>
              </div>

              @if (r.pontuacaoRealDisponivel && r.pontuacaoRealTotal != null) {
                <div class="rodada-scores">
                  <span class="score-item">
                    <span class="score-lbl">Score sugerido</span>
                    <span class="score-val">{{ r.scoreSugeridoTotal | number:'1.1-1' }}</span>
                  </span>
                  <span class="score-item">
                    <span class="score-lbl">Pontuação real</span>
                    <span class="score-val">{{ r.pontuacaoRealTotal | number:'1.1-1' }}</span>
                  </span>
                  <span class="delta-chip" [class]="'delta-' + delta(r).level">
                    {{ deltaSinal(delta(r)) }}{{ delta(r).delta | number:'1.1-1' }}
                  </span>
                </div>

                <div class="progress-wrap">
                  <div class="progress-bar">
                    <div class="progress-fill" [class]="'fill-' + delta(r).level"
                         [style.width.%]="barWidth(r)"></div>
                  </div>
                  <span class="progress-pct">{{ delta(r).percentAtingido | number:'1.1-1' }}% do sugerido</span>
                </div>

                <div class="rodada-actions">
                  <a class="btn btn-secondary" [routerLink]="['/historico', r.rodadaId]">Ver detalhe</a>
                </div>
              } @else {
                <div class="rodada-scores">
                  <span class="score-item">
                    <span class="score-lbl">Score sugerido</span>
                    <span class="score-val">{{ r.scoreSugeridoTotal | number:'1.1-1' }}</span>
                  </span>
                  <span class="score-item">
                    <span class="score-lbl">Pontuação real</span>
                    <span class="score-val muted">&mdash;</span>
                  </span>
                </div>

                <p class="pendente">&#9203; Pontuação ainda não atualizada</p>

                @if (erroAtualizar[r.rodadaId]) {
                  <app-alert-banner [message]="erroAtualizar[r.rodadaId]" type="error" />
                }

                <div class="rodada-actions">
                  <button class="btn btn-primary" (click)="atualizar(r)" [disabled]="atualizando[r.rodadaId]">
                    {{ atualizando[r.rodadaId] ? 'Atualizando...' : 'Atualizar pontuação' }}
                  </button>
                  <a class="btn btn-secondary" [routerLink]="['/historico', r.rodadaId]">Ver detalhe</a>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .error-state {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      text-align: center;
      padding: 3.5rem 1.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);

      .empty-icon { font-size: 2.5rem; }
      .empty-title { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }
      .empty-desc { font-size: 0.9rem; color: var(--text-muted); }
      .btn { margin-top: 0.5rem; text-decoration: none; }
    }

    .evolucao-section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 1rem;
    }

    .evolucao-chart {
      width: 100%;
      height: 160px;
      overflow: visible;
    }

    .evolucao-line { stroke: var(--green-primary); stroke-width: 2; }
    .evolucao-dot { fill: var(--green-primary); }
    .evolucao-valor { fill: var(--text-secondary); font-size: 9px; font-weight: 600; }
    .evolucao-label { fill: var(--text-muted); font-size: 9px; }

    .rodadas-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .rodada-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-left-width: 4px;
      border-radius: var(--radius);
      padding: 1.25rem 1.5rem;

      &.border-verde { border-left-color: var(--green-primary); }
      &.border-amarelo { border-left-color: var(--gold); }
      &.border-vermelho { border-left-color: var(--red); }
      &.border-indisponivel { border-left-color: var(--border-light); }
    }

    .rodada-head {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.875rem;

      .rodada-num { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); font-family: 'Space Grotesk', sans-serif; }
      .rodada-sep { color: var(--text-muted); }
      .rodada-data { font-size: 0.85rem; color: var(--text-muted); }
    }

    .rodada-scores {
      display: flex;
      align-items: center;
      gap: 1.75rem;
      flex-wrap: wrap;
      margin-bottom: 0.875rem;
    }

    .score-item {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;

      .score-lbl { font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
      .score-val { font-size: 1.15rem; font-weight: 700; color: var(--text-primary); font-family: 'Space Grotesk', sans-serif; }
      .score-val.muted { color: var(--text-muted); }
    }

    .delta-chip {
      align-self: center;
      font-size: 0.9rem;
      font-weight: 700;
      padding: 0.25rem 0.7rem;
      border-radius: 9999px;
      font-family: 'Space Grotesk', sans-serif;

      &.delta-verde { background: var(--green-light); color: #4ade80; }
      &.delta-amarelo { background: var(--gold-light); color: #fbbf24; }
      &.delta-vermelho { background: var(--red-light); color: #f87171; }
    }

    .progress-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      border-radius: 9999px;
      overflow: hidden;
      background: rgba(255,255,255,0.08);
    }

    .progress-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.3s ease;

      &.fill-verde { background: var(--green-primary); }
      &.fill-amarelo { background: var(--gold); }
      &.fill-vermelho { background: var(--red); }
    }

    .progress-pct { font-size: 0.78rem; color: var(--text-muted); white-space: nowrap; }

    .pendente {
      font-size: 0.9rem;
      color: var(--gold);
      margin-bottom: 1rem;
    }

    .rodada-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;

      .btn { text-decoration: none; }
    }

    @media (max-width: 640px) {
      .rodada-scores { gap: 1rem; }
      .progress-wrap { flex-direction: column; align-items: stretch; }
      .progress-pct { text-align: right; }
    }
  `]
})
export class HistoricoPageComponent implements OnInit {
  private historicoService = inject(HistoricoService);

  rodadas: RodadaResumo[] = [];
  loading = false;
  error = '';
  atualizando: Record<number, boolean> = {};
  erroAtualizar: Record<number, string> = {};

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.error = '';
    this.historicoService.getHistorico().subscribe({
      next: (data) => {
        // A API ordena por rodada; aqui exibimos da mais recente para a mais antiga.
        this.rodadas = [...(data.rodadas ?? [])].sort((a, b) => b.rodadaId - a.rodadaId);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.userMessage ?? 'Erro ao carregar histórico.';
        this.loading = false;
      }
    });
  }

  delta(r: RodadaResumo): PerformanceDelta {
    return getPerformanceDelta(r.scoreSugeridoTotal, r.pontuacaoRealTotal);
  }

  deltaSinal(d: PerformanceDelta): string {
    return d.delta != null && d.delta >= 0 ? '+' : '';
  }

  barWidth(r: RodadaResumo): number {
    const pct = this.delta(r).percentAtingido ?? 0;
    return Math.max(0, Math.min(100, pct));
  }

  atualizar(r: RodadaResumo): void {
    this.atualizando[r.rodadaId] = true;
    this.erroAtualizar[r.rodadaId] = '';
    this.historicoService.atualizarPontuacao(r.rodadaId).subscribe({
      next: (detalhe) => {
        // Atualiza apenas o card desta rodada, sem recarregar toda a listagem.
        this.aplicarPontuacao(r, detalhe.atletas);
        this.atualizando[r.rodadaId] = false;
      },
      error: (err) => {
        this.erroAtualizar[r.rodadaId] = err.userMessage ?? 'Erro ao atualizar pontuação.';
        this.atualizando[r.rodadaId] = false;
      }
    });
  }

  /** Recalcula os totais do card a partir dos atletas retornados pela atualização. */
  private aplicarPontuacao(r: RodadaResumo, atletas: { pontuacaoReal: number | null; capitao: boolean }[]): void {
    const temReal = atletas.some((a) => a.pontuacaoReal != null);
    if (!temReal) {
      return;
    }
    const total = atletas.reduce((acc, a) => {
      const pts = a.pontuacaoReal ?? 0;
      return acc + (a.capitao ? pts * 2 : pts);
    }, 0);
    const atualizada: RodadaResumo = {
      ...r,
      pontuacaoRealTotal: total,
      pontuacaoRealDisponivel: true
    };
    this.rodadas = this.rodadas.map((item) => (item.rodadaId === r.rodadaId ? atualizada : item));
  }

  /** Pontos do gráfico de evolução (3+ rodadas com pontuação real), em ordem crescente de rodada. */
  get evolucao(): EvolucaoPonto[] {
    const comReal = this.rodadas
      .filter((r) => r.pontuacaoRealDisponivel && r.pontuacaoRealTotal != null)
      .sort((a, b) => a.rodadaId - b.rodadaId);

    if (comReal.length < 3) {
      return [];
    }

    const valores = comReal.map((r) => r.pontuacaoRealTotal as number);
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const range = max - min || 1;
    const padX = 24;
    const usableW = 320 - padX * 2;
    const topY = 16;
    const bottomY = 116;

    return comReal.map((r, i) => {
      const x = comReal.length === 1 ? 160 : padX + (usableW * i) / (comReal.length - 1);
      const valor = r.pontuacaoRealTotal as number;
      const y = bottomY - ((valor - min) / range) * (bottomY - topY);
      return { rodadaId: r.rodadaId, valor, x, y };
    });
  }

  get evolucaoLinha(): string {
    return this.evolucao.map((p) => `${p.x},${p.y}`).join(' ');
  }
}
