import { Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AtletaEscalado, EscalacaoRodadaResponse } from '../../../../shared/models/historico.model';
import { HistoricoService } from '../../services/historico.service';
import { getPerformanceDelta, PerformanceDelta } from '../../../../shared/utils/performance.util';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';

@Component({
  selector: 'app-historico-detalhe-page',
  imports: [DecimalPipe, RouterLink, LoadingSpinnerComponent, AlertBannerComponent],
  template: `
    <div class="page-container">
      <a class="back-link" routerLink="/historico">&larr; Histórico</a>

      @if (loading) {
        <app-loading-spinner message="Carregando rodada..." [fullPage]="true" />
      } @else if (error) {
        <div class="error-state">
          <app-alert-banner [message]="error" type="error" />
          <button class="btn btn-primary" (click)="carregar()">Tentar novamente</button>
        </div>
      } @else if (data) {
        <header class="detalhe-header">
          <h1 class="page-title">Rodada {{ data.rodadaId }}</h1>
          <div class="resumo">
            <span class="resumo-item">
              <span class="resumo-lbl">Score sugerido</span>
              <span class="resumo-val">{{ scoreSugeridoTotal | number:'1.1-1' }}</span>
            </span>
            @if (disponivel) {
              <span class="resumo-item">
                <span class="resumo-lbl">Pontuação real</span>
                <span class="resumo-val">{{ pontuacaoRealTotal | number:'1.1-1' }}</span>
              </span>
              <span class="delta-chip" [class]="'delta-' + totalDelta.level">
                {{ sinal(totalDelta) }}{{ totalDelta.delta | number:'1.1-1' }}
                @if (totalDelta.deltaPercent != null) {
                  ({{ sinal(totalDelta) }}{{ totalDelta.deltaPercent | number:'1.1-1' }}%)
                }
              </span>
            } @else {
              <span class="resumo-item">
                <span class="resumo-lbl">Pontuação real</span>
                <span class="resumo-val muted">&#9203; pendente</span>
              </span>
            }
          </div>

          @if (!disponivel) {
            @if (erroAtualizar) {
              <app-alert-banner [message]="erroAtualizar" type="error" />
            }
            <button class="btn btn-primary" (click)="atualizar()" [disabled]="atualizando">
              {{ atualizando ? 'Atualizando...' : 'Atualizar pontuação' }}
            </button>
          }
        </header>

        <section class="atletas-section">
          <h2 class="section-title">Titulares</h2>
          <div class="table-scroll">
            <table class="atletas-table">
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Atleta</th>
                  <th>Clube</th>
                  <th class="num">Score sugerido</th>
                  <th class="num">Pontuação real</th>
                  <th class="num">&Delta;</th>
                </tr>
              </thead>
              <tbody>
                @for (a of titulares; track a.apelido) {
                  <tr>
                    <td>{{ marcadores(a) }}{{ a.posicao }}</td>
                    <td class="atleta-nome">{{ a.apelido }}</td>
                    <td>{{ a.clube }}</td>
                    <td class="num">{{ a.scoreSugerido | number:'1.1-1' }}</td>
                    <td class="num">
                      @if (a.pontuacaoReal != null) {
                        {{ a.pontuacaoReal | number:'1.1-1' }}
                      } @else {
                        <span class="muted">&mdash;</span>
                      }
                    </td>
                    <td class="num">
                      @if (delta(a).disponivel) {
                        <span [class]="'delta-text delta-' + delta(a).level">
                          {{ sinal(delta(a)) }}{{ delta(a).delta | number:'1.1-1' }}
                        </span>
                      } @else {
                        <span class="muted">&mdash;</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="legenda">&#11088; capitão &nbsp; &#128142; reserva de luxo &nbsp; &#9888;&#65039; em dúvida na escalação</p>
        </section>

        @if (reservas.length > 0) {
          <section class="atletas-section">
            <h2 class="section-title">Reservas</h2>
            <div class="table-scroll">
              <table class="atletas-table">
                <thead>
                  <tr>
                    <th>Posição</th>
                    <th>Atleta</th>
                    <th>Clube</th>
                    <th class="num">Score sugerido</th>
                    <th class="num">Pontuação real</th>
                  </tr>
                </thead>
                <tbody>
                  @for (a of reservas; track a.apelido) {
                    <tr>
                      <td>{{ marcadores(a) }}{{ a.posicao }}</td>
                      <td class="atleta-nome">{{ a.apelido }}</td>
                      <td>{{ a.clube }}</td>
                      <td class="num">{{ a.scoreSugerido | number:'1.1-1' }}</td>
                      <td class="num">
                        @if (a.pontuacaoReal != null) {
                          {{ a.pontuacaoReal | number:'1.1-1' }}
                        } @else {
                          <span class="muted">&mdash;</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }

        @if (disponivel) {
          <section class="atletas-section">
            <h2 class="section-title">Sugerido vs. real por atleta</h2>
            <div class="grafico-barras">
              @for (a of titulares; track a.apelido) {
                <div class="barra-grupo">
                  <span class="barra-nome">{{ a.apelido }}</span>
                  <div class="barra-linhas">
                    <div class="barra-linha">
                      <div class="barra barra-sugerido" [style.width.%]="larguraBarra(a.scoreSugerido)"></div>
                      <span class="barra-valor">{{ a.scoreSugerido | number:'1.1-1' }} sugerido</span>
                    </div>
                    <div class="barra-linha">
                      @if (a.pontuacaoReal != null) {
                        <div class="barra barra-real" [class]="'real-' + delta(a).level"
                             [style.width.%]="larguraBarra(a.pontuacaoReal)"></div>
                        <span class="barra-valor">{{ a.pontuacaoReal | number:'1.1-1' }} real</span>
                      } @else {
                        <span class="barra-valor muted">&mdash; sem pontuação real</span>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>
        }
      }
    </div>
  `,
  styles: [`
    .back-link {
      display: inline-block;
      margin-bottom: 1rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
      text-decoration: none;

      &:hover { color: var(--text-primary); }
    }

    .error-state {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    .detalhe-header {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
      margin-bottom: 1.5rem;

      .page-title { margin-bottom: 1rem; }
      .btn { margin-top: 1rem; }
    }

    .resumo {
      display: flex;
      align-items: center;
      gap: 1.75rem;
      flex-wrap: wrap;
    }

    .resumo-item {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;

      .resumo-lbl { font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
      .resumo-val { font-size: 1.3rem; font-weight: 700; color: var(--text-primary); font-family: 'Space Grotesk', sans-serif; }
      .resumo-val.muted { color: var(--gold); font-size: 1.1rem; }
    }

    .delta-chip {
      align-self: center;
      font-size: 0.95rem;
      font-weight: 700;
      padding: 0.3rem 0.8rem;
      border-radius: 9999px;
      font-family: 'Space Grotesk', sans-serif;

      &.delta-verde { background: var(--green-light); color: #4ade80; }
      &.delta-amarelo { background: var(--gold-light); color: #fbbf24; }
      &.delta-vermelho { background: var(--red-light); color: #f87171; }
    }

    .atletas-section { margin-bottom: 2rem; }

    .section-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 0.875rem;
    }

    .table-scroll {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }

    .atletas-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      min-width: 560px;

      th, td {
        padding: 0.7rem 1rem;
        text-align: left;
        border-bottom: 1px solid var(--border);
        white-space: nowrap;
      }

      th {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
        background: var(--bg-secondary);
      }

      tbody tr:last-child td { border-bottom: none; }
      tbody tr:hover { background: var(--bg-card-hover); }

      .num { text-align: right; font-family: 'Space Grotesk', sans-serif; }
      .atleta-nome { font-weight: 600; color: var(--text-primary); }
      .muted { color: var(--text-muted); }
    }

    .delta-text {
      font-weight: 700;

      &.delta-verde { color: #4ade80; }
      &.delta-amarelo { color: #fbbf24; }
      &.delta-vermelho { color: #f87171; }
    }

    .legenda {
      margin-top: 0.625rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .grafico-barras {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.25rem 1.5rem;
    }

    .barra-grupo {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 1rem;
      align-items: center;
    }

    .barra-nome {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .barra-linhas { display: flex; flex-direction: column; gap: 0.3rem; }

    .barra-linha { display: flex; align-items: center; gap: 0.6rem; }

    .barra {
      height: 12px;
      border-radius: 4px;
      min-width: 2px;
      transition: width 0.3s ease;
    }

    .barra-sugerido { background: var(--blue); }
    .barra-real { background: var(--green-primary); }
    .barra-real.real-amarelo { background: var(--gold); }
    .barra-real.real-vermelho { background: var(--red); }

    .barra-valor { font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; }
    .barra-valor.muted { color: var(--text-muted); }

    @media (max-width: 640px) {
      .resumo { gap: 1rem; }
      .barra-grupo { grid-template-columns: 80px 1fr; gap: 0.5rem; }
      .barra-nome { font-size: 0.78rem; }
    }
  `]
})
export class HistoricoDetalhePageComponent implements OnInit {
  private historicoService = inject(HistoricoService);
  private route = inject(ActivatedRoute);

  data: EscalacaoRodadaResponse | null = null;
  loading = false;
  error = '';
  atualizando = false;
  erroAtualizar = '';
  private rodadaId = 0;

  ngOnInit(): void {
    this.rodadaId = Number(this.route.snapshot.paramMap.get('rodadaId'));
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.error = '';
    this.historicoService.getRodada(this.rodadaId).subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.userMessage ?? 'Erro ao carregar a rodada.';
        this.loading = false;
      }
    });
  }

  get titulares(): AtletaEscalado[] {
    return (this.data?.atletas ?? []).filter((a) => !a.reservaLuxo);
  }

  get reservas(): AtletaEscalado[] {
    return (this.data?.atletas ?? []).filter((a) => a.reservaLuxo);
  }

  /** A rodada é considerada atualizada quando algum titular já tem pontuação real. */
  get disponivel(): boolean {
    return this.titulares.some((a) => a.pontuacaoReal != null);
  }

  get scoreSugeridoTotal(): number {
    return this.titulares.reduce((acc, a) => acc + a.scoreSugerido, 0);
  }

  /** Soma das pontuações reais dos titulares, dobrando o capitão (contrato da API). */
  get pontuacaoRealTotal(): number {
    return this.titulares.reduce((acc, a) => {
      const pts = a.pontuacaoReal ?? 0;
      return acc + (a.capitao ? pts * 2 : pts);
    }, 0);
  }

  get totalDelta(): PerformanceDelta {
    return getPerformanceDelta(this.scoreSugeridoTotal, this.disponivel ? this.pontuacaoRealTotal : null);
  }

  delta(a: AtletaEscalado): PerformanceDelta {
    return getPerformanceDelta(a.scoreSugerido, a.pontuacaoReal);
  }

  sinal(d: PerformanceDelta): string {
    return d.delta != null && d.delta >= 0 ? '+' : '';
  }

  marcadores(a: AtletaEscalado): string {
    let m = '';
    if (a.capitao) m += '⭐ ';
    if (a.reservaLuxo) m += '💎 ';
    if (a.emDuvida) m += '⚠️ ';
    return m;
  }

  /** Largura proporcional ao maior valor (sugerido ou real) entre os titulares. */
  larguraBarra(valor: number): number {
    const maxSugerido = Math.max(0, ...this.titulares.map((a) => a.scoreSugerido));
    const maxReal = Math.max(0, ...this.titulares.map((a) => a.pontuacaoReal ?? 0));
    const max = Math.max(maxSugerido, maxReal) || 1;
    return Math.max(0, Math.min(100, (valor / max) * 100));
  }

  atualizar(): void {
    this.atualizando = true;
    this.erroAtualizar = '';
    this.historicoService.atualizarPontuacao(this.rodadaId).subscribe({
      next: (data) => {
        this.data = data;
        this.atualizando = false;
      },
      error: (err) => {
        this.erroAtualizar = err.userMessage ?? 'Erro ao atualizar pontuação.';
        this.atualizando = false;
      }
    });
  }
}
