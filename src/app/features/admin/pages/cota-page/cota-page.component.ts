import { Component, OnInit, inject } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { CotaResponse, LeituraCota } from '../../../../shared/models/cota.model';
import { CotaService } from '../../services/cota.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';

/** Janela do gráfico, em dias. 30 é o padrão da API e cobre um ciclo de cota inteiro. */
const JANELA_DIAS = 30;

/** Um ponto do gráfico de consumo, já posicionado no `viewBox` de 320x140. */
interface ConsumoPonto {
  instante: string;
  consumo: number;
  x: number;
  y: number;
  /** Fração horizontal do card (0–100), para posicionar rótulos HTML sobre o SVG. */
  percentX: number;
  /** Primeira leitura de um ciclo novo: a linha quebra aqui em vez de despencar. */
  reinicio: boolean;
}

/** Limites do desenho dentro do `viewBox`. */
const PAD_X = 24;
const LARGURA = 320;
const TOPO_Y = 16;
const BASE_Y = 118;

@Component({
  selector: 'app-cota-page',
  imports: [DecimalPipe, DatePipe, LoadingSpinnerComponent, AlertBannerComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">&#128202; Cota da The Odds API</h1>
      </div>

      @if (loading) {
        <app-loading-spinner message="Carregando cota..." [fullPage]="true" />
      } @else if (error) {
        <div class="error-state">
          <app-alert-banner [message]="error" type="error" />
          <button class="btn btn-primary" (click)="carregar()">Tentar novamente</button>
        </div>
      } @else if (cota) {
        <!-- Guardrail: o estado que muda o que fazer a seguir vem primeiro. -->
        <section class="guardrail-card" [class.armado]="cota.guardrailAtivo">
          <div class="guardrail-head">
            <span class="guardrail-icon">
              @if (cota.guardrailAtivo) { &#128721; } @else { &#9989; }
            </span>
            <div class="guardrail-texto">
              <span class="guardrail-titulo">
                @if (cota.guardrailAtivo) { Guardrail armado } @else { Guardrail livre }
              </span>
              <span class="guardrail-desc">
                @if (cota.guardrailAtivo) {
                  A API parou de chamar o provedor e serve o último snapshot conhecido. A escalação
                  continua saindo, mas com odds que vão envelhecendo.
                } @else {
                  O saldo conhecido está acima do mínimo configurado; as odds continuam sendo buscadas
                  no provedor.
                }
              </span>
            </div>
          </div>

          @if (cota.guardrailAtivo) {
            <div class="guardrail-sondagem">
              <span class="campo-label">Destrava sozinho em</span>
              <span class="campo-valor destaque">
                @if (cota.proximaSondagem) {
                  {{ cota.proximaSondagem | date:'dd/MM/yyyy HH:mm:ss' }}
                } @else {
                  na próxima busca de odds
                }
              </span>
            </div>
          }
        </section>

        <!-- Estado atual -->
        <section class="cota-section">
          <h2 class="section-title">Estado atual</h2>

          <div class="cota-grid">
            <div class="cota-card">
              <span class="campo-label">Saldo restante</span>
              @if (cota.saldoRestante != null) {
                <span class="campo-numero">{{ cota.saldoRestante | number:'1.0-0' }}</span>
                <span class="campo-hint">requisições disponíveis no último header lido</span>
              } @else {
                <span class="campo-numero sem-leitura">sem leitura ainda</span>
                <span class="campo-hint">nenhuma leitura de header desde o boot da API</span>
              }
            </div>

            <div class="cota-card">
              <span class="campo-label">Consumo do mês</span>
              @if (cota.consumoMes != null) {
                <span class="campo-numero">{{ cota.consumoMes | number:'1.0-0' }}</span>
                <span class="campo-hint">requisições consumidas no ciclo corrente</span>
              } @else {
                <span class="campo-numero sem-leitura">sem leitura ainda</span>
                <span class="campo-hint">nenhuma leitura de header desde o boot da API</span>
              }
            </div>

            <div class="cota-card">
              <span class="campo-label">Mínimo configurado</span>
              <span class="campo-numero">{{ cota.minRequestsRemaining | number:'1.0-0' }}</span>
              <span class="campo-hint">abaixo dele o guardrail entra em ação</span>
            </div>

            <div class="cota-card">
              <span class="campo-label">Margem até o mínimo</span>
              @if (margemAteMinimo != null) {
                <span class="campo-numero" [class.negativo]="margemAteMinimo <= 0">
                  {{ margemAteMinimo | number:'1.0-0' }}
                </span>
                <span class="campo-hint">
                  @if (margemAteMinimo > 0) {
                    requisições antes de o guardrail agir
                  } @else {
                    o saldo já está no mínimo ou abaixo dele
                  }
                </span>
              } @else {
                <span class="campo-numero sem-leitura">sem leitura ainda</span>
                <span class="campo-hint">depende do saldo, que ainda não foi lido</span>
              }
            </div>
          </div>

          @if (percentSaldo != null) {
            <div class="saldo-wrap">
              <div class="saldo-bar">
                <div class="saldo-fill" [class.baixo]="cota.guardrailAtivo" [style.width.%]="percentSaldo"></div>
              </div>
              <span class="saldo-pct">
                {{ percentSaldo | number:'1.0-1' }}% da cota do ciclo ({{ cotaCiclo | number:'1.0-0' }} requisições)
              </span>
            </div>
          }
        </section>

        <!-- Instantes -->
        <section class="cota-section">
          <h2 class="section-title">Leituras</h2>
          <div class="instantes-grid">
            <div class="instante-item">
              <span class="campo-label">Última leitura de cota</span>
              <span class="campo-valor">
                @if (cota.ultimaLeitura) {
                  {{ cota.ultimaLeitura | date:'dd/MM/yyyy HH:mm:ss' }}
                } @else {
                  <span class="sem-leitura">sem leitura ainda</span>
                }
              </span>
            </div>
            <div class="instante-item">
              <span class="campo-label">Última sondagem</span>
              <span class="campo-valor">
                @if (cota.ultimaSondagem) {
                  {{ cota.ultimaSondagem | date:'dd/MM/yyyy HH:mm:ss' }}
                } @else {
                  <span class="sem-leitura">nenhuma sondagem ainda</span>
                }
              </span>
            </div>
            <div class="instante-item">
              <span class="campo-label">Próxima sondagem</span>
              <span class="campo-valor">
                @if (cota.proximaSondagem) {
                  {{ cota.proximaSondagem | date:'dd/MM/yyyy HH:mm:ss' }}
                } @else {
                  <span class="sem-leitura">a próxima busca já sonda</span>
                }
              </span>
            </div>
          </div>
          <p class="fuso-nota">
            Os instantes vêm da API sem fuso e são exibidos na hora local do servidor.
          </p>
        </section>

        <!-- Consumo ao longo do ciclo -->
        <section class="cota-section">
          <h2 class="section-title">Consumo nos últimos {{ janelaDias }} dias</h2>

          @if (historicoError) {
            <app-alert-banner [message]="historicoError" type="warning" />
          } @else if (consumoPontos.length >= 2) {
            <div class="grafico-card">
              <!-- Os rótulos ficam em HTML sobreposto, e não em <text> dentro do SVG: o
                   preserveAspectRatio="none" estica o viewBox de 320 até a largura da tela,
                   e a mesma escala não-uniforme que faz a linha preencher o card deformava
                   cada letra na horizontal. Sobre o SVG eles usam a escala normal da página. -->
              <div class="chart-wrap">
                <svg class="consumo-chart" viewBox="0 0 320 140" preserveAspectRatio="none"
                     role="img" [attr.aria-label]="resumoAcessivel">
                  <!-- Uma polilinha por ciclo: a renovação da cota quebra a linha em vez de
                       desenhar uma queda que pareceria erro de coleta. -->
                  @for (segmento of consumoSegmentos; track $index) {
                    <polyline class="consumo-line" [attr.points]="segmento" fill="none"
                              vector-effect="non-scaling-stroke" />
                  }
                  @for (r of reinicios; track r.instante) {
                    <line class="reinicio-line" [attr.x1]="r.x" y1="12" [attr.x2]="r.x" y2="118"
                          vector-effect="non-scaling-stroke" />
                  }
                </svg>

                <span class="chart-label chart-max">{{ consumoMaximo | number:'1.0-0' }}</span>
                <span class="chart-label chart-inicio">{{ primeiroInstante | date:'dd/MM' }}</span>
                <span class="chart-label chart-fim">{{ ultimoInstante | date:'dd/MM' }}</span>
                @for (r of reinicios; track r.instante) {
                  <span class="chart-label chart-reinicio" [style.left.%]="r.percentX">renovação</span>
                }
              </div>
              <p class="grafico-legenda">
                {{ consumoPontos.length | number:'1.0-0' }} leituras na janela
                @if (reinicios.length > 0) {
                  &bull; {{ reinicios.length }} {{ reinicios.length === 1 ? 'renovação' : 'renovações' }} de cota
                }
              </p>
            </div>
          } @else {
            <div class="grafico-vazio">
              <span class="sem-leitura">Ainda não há leituras suficientes para desenhar a série.</span>
              <span class="campo-hint">O gráfico aparece a partir da segunda leitura registrada na janela.</span>
            </div>
          }
        </section>
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

    .cota-section {
      margin-bottom: 2.5rem;
    }

    .section-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 1rem;
    }

    .guardrail-card {
      background: var(--bg-card);
      border: 1px solid rgba(34, 197, 94, 0.25);
      border-left: 4px solid var(--green-primary);
      border-radius: var(--radius);
      padding: 1.25rem 1.5rem;
      margin-bottom: 2rem;

      &.armado {
        border-color: rgba(239, 68, 68, 0.3);
        border-left-color: var(--red);
        background: rgba(239, 68, 68, 0.06);
      }
    }

    .guardrail-head {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
    }

    .guardrail-icon { font-size: 1.5rem; line-height: 1; }

    .guardrail-texto {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .guardrail-titulo {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
      font-family: 'Space Grotesk', sans-serif;
    }

    .guardrail-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .guardrail-sondagem {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }

    .cota-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .cota-card {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.125rem 1.25rem;
    }

    .campo-label {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .campo-numero {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--text-primary);
      font-family: 'Space Grotesk', sans-serif;

      &.negativo { color: var(--red); }
    }

    .campo-valor {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);

      &.destaque { color: var(--gold); font-size: 1.05rem; }
    }

    .campo-hint {
      font-size: 0.72rem;
      color: var(--text-muted);
      line-height: 1.4;
    }

    /* "Sem leitura" nunca vira zero: o estado é textual e visualmente distinto de um número. */
    .sem-leitura {
      font-size: 0.95rem;
      font-style: italic;
      font-weight: 600;
      color: var(--text-muted);
      font-family: inherit;
    }

    .saldo-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .saldo-bar {
      flex: 1;
      height: 8px;
      border-radius: 9999px;
      overflow: hidden;
      background: var(--overlay-medium);
    }

    .saldo-fill {
      height: 100%;
      border-radius: 9999px;
      background: var(--green-primary);
      transition: width 0.3s ease;

      &.baixo { background: var(--red); }
    }

    .saldo-pct { font-size: 0.78rem; color: var(--text-muted); white-space: nowrap; }

    .instantes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
    }

    .instante-item {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem 1.25rem;
    }

    .fuso-nota {
      margin-top: 0.75rem;
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .grafico-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.25rem 1.5rem;
    }

    /* Os rótulos são posicionados em % sobre este wrapper. Como o SVG estica linearmente
       o eixo X do viewBox até a largura toda, x / 320 é exatamente a fração horizontal
       do card — a marca de renovação cai em cima da linha tracejada que a representa. */
    .chart-wrap {
      position: relative;
    }

    .consumo-chart {
      display: block;
      width: 100%;
      height: 180px;
    }

    .consumo-line { stroke: var(--green-primary); stroke-width: 2; }
    .reinicio-line { stroke: var(--gold); stroke-width: 1; stroke-dasharray: 3 3; }

    .chart-label {
      position: absolute;
      font-size: 0.7rem;
      color: var(--text-muted);
      pointer-events: none;
      white-space: nowrap;
    }

    .chart-max { top: 0; left: 0; }
    .chart-inicio { bottom: 0; left: 0; }
    .chart-fim { bottom: 0; right: 0; }

    .chart-reinicio {
      top: 0;
      transform: translateX(-50%);
      color: var(--gold);
    }

    .grafico-legenda {
      margin-top: 0.75rem;
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .grafico-vazio {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      text-align: center;
      padding: 2.5rem 1.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }

    @media (max-width: 640px) {
      .saldo-wrap { flex-direction: column; align-items: stretch; }
      .saldo-pct { text-align: right; }
    }
  `]
})
export class CotaPageComponent implements OnInit {
  private cotaService = inject(CotaService);

  cota: CotaResponse | null = null;
  loading = false;
  error = '';
  /** Falha do histórico não derruba a tela: os sete campos do estado atual valem sozinhos. */
  historicoError = '';

  readonly janelaDias = JANELA_DIAS;

  /**
   * Pontos e segmentos são calculados no carregamento, e não em getters: a janela padrão traz
   * centenas de leituras e o template varre a lista várias vezes por ciclo de detecção.
   */
  consumoPontos: ConsumoPonto[] = [];
  consumoSegmentos: string[] = [];
  reinicios: ConsumoPonto[] = [];
  consumoMaximo = 0;

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.error = '';
    this.cotaService.getCota().subscribe({
      next: (data) => {
        this.cota = data;
        this.loading = false;
        this.carregarHistorico();
      },
      error: (err) => {
        this.error = err.userMessage ?? 'Erro ao carregar a cota da The Odds API.';
        this.loading = false;
      }
    });
  }

  /** Saldo acima do mínimo configurado. `null` sem leitura; negativo com o guardrail armado. */
  get margemAteMinimo(): number | null {
    if (this.cota?.saldoRestante == null) {
      return null;
    }
    return this.cota.saldoRestante - this.cota.minRequestsRemaining;
  }

  /** Tamanho da cota do ciclo, deduzido da soma saldo + consumo. `null` sem leitura. */
  get cotaCiclo(): number | null {
    if (this.cota?.saldoRestante == null || this.cota.consumoMes == null) {
      return null;
    }
    return this.cota.saldoRestante + this.cota.consumoMes;
  }

  get percentSaldo(): number | null {
    const total = this.cotaCiclo;
    if (total == null || total <= 0 || this.cota?.saldoRestante == null) {
      return null;
    }
    return Math.max(0, Math.min(100, (this.cota.saldoRestante / total) * 100));
  }

  /**
   * O que o gráfico diz, em texto. Os rótulos saíram do SVG para não serem esticados, e um
   * `aria-label` fixo descreveria a figura sem informar nada — aqui vai o conteúdo.
   */
  get resumoAcessivel(): string {
    if (this.consumoPontos.length < 2) {
      return 'Gráfico do consumo de requisições ao longo da janela';
    }
    const inicio = this.consumoPontos[0].consumo;
    const fim = this.consumoPontos[this.consumoPontos.length - 1].consumo;
    const renovacoes = this.reinicios.length === 1
      ? ', com 1 renovação de cota'
      : this.reinicios.length > 1
        ? `, com ${this.reinicios.length} renovações de cota`
        : '';
    return `Consumo de requisições em ${this.consumoPontos.length} leituras, `
      + `de ${inicio} a ${fim}${renovacoes}`;
  }

  get primeiroInstante(): string | null {
    return this.consumoPontos[0]?.instante ?? null;
  }

  get ultimoInstante(): string | null {
    return this.consumoPontos[this.consumoPontos.length - 1]?.instante ?? null;
  }

  private carregarHistorico(): void {
    this.historicoError = '';
    this.cotaService.getHistorico(JANELA_DIAS).subscribe({
      next: (data) => {
        this.montarGrafico(data.leituras ?? []);
      },
      error: (err) => {
        this.historicoError = err.userMessage ?? 'Erro ao carregar o histórico de leituras.';
        this.montarGrafico([]);
      }
    });
  }

  /**
   * Posiciona as leituras no `viewBox` e quebra a linha a cada renovação de cota.
   *
   * A escala vertical parte de zero: o gráfico é de consumo acumulado no ciclo, e ancorar no
   * menor valor da janela exageraria variações de poucas requisições.
   */
  private montarGrafico(leituras: LeituraCota[]): void {
    // Leituras sem `consumoMes` não mediram nada e não entram na série.
    const medidas = leituras.filter((l) => l.consumoMes != null);

    if (medidas.length < 2) {
      this.consumoPontos = [];
      this.consumoSegmentos = [];
      this.reinicios = [];
      this.consumoMaximo = 0;
      return;
    }

    const max = Math.max(...medidas.map((l) => l.consumoMes as number));
    const escala = max || 1;
    const usableW = LARGURA - PAD_X * 2;

    // O eixo X é proporcional ao tempo, e não à posição na lista. As leituras nascem de
    // chamadas ao provedor, que se concentram quando o sistema é usado: espaçadas por
    // índice, um intervalo de três dias sem leitura ocuparia a mesma largura que um de
    // três minutos, e o gráfico do mês mentiria sobre quando o consumo aconteceu.
    const tempos = medidas.map((l) => new Date(l.instante).getTime());
    const inicio = tempos[0];
    const duracao = tempos[tempos.length - 1] - inicio;

    this.consumoMaximo = max;
    this.consumoPontos = medidas.map((l, i) => {
      // Toda a janela no mesmo instante (ou instante ilegível) não define proporção:
      // aí o espaçamento por índice é o que resta, e não distorce nada.
      const fracao = duracao > 0 ? (tempos[i] - inicio) / duracao : i / (medidas.length - 1);
      const x = PAD_X + usableW * fracao;
      return {
        instante: l.instante,
        consumo: l.consumoMes as number,
        x,
        y: BASE_Y - ((l.consumoMes as number) / escala) * (BASE_Y - TOPO_Y),
        percentX: (x / LARGURA) * 100,
        reinicio: l.reinicioDeCota
      };
    });
    this.reinicios = this.consumoPontos.filter((p) => p.reinicio);
    this.consumoSegmentos = this.montarSegmentos(this.consumoPontos);
  }

  /** Um `points` por ciclo de cota: cada `reinicioDeCota` abre um segmento novo. */
  private montarSegmentos(pontos: ConsumoPonto[]): string[] {
    const segmentos: ConsumoPonto[][] = [];
    let atual: ConsumoPonto[] = [];

    for (const ponto of pontos) {
      if (ponto.reinicio && atual.length > 0) {
        segmentos.push(atual);
        atual = [];
      }
      atual.push(ponto);
    }
    if (atual.length > 0) {
      segmentos.push(atual);
    }

    // Um ciclo com uma leitura só não desenha linha; fica registrado pela marca de renovação.
    return segmentos
      .filter((s) => s.length >= 2)
      .map((s) => s.map((p) => `${p.x},${p.y}`).join(' '));
  }
}
