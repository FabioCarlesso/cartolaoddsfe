import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ConfiguracaoResponse, ConfiguracaoRequest, CacheResponse } from '../../../../shared/models/configuracao.model';
import { ConfiguracaoService } from '../../services/configuracao.service';
import { CacheService } from '../../services/cache.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';

const CACHE_NAMES = ['odds', 'atletas', 'clubes', 'partidas', 'pontuados', 'statusMercado'] as const;

@Component({
  selector: 'app-admin-page',
  imports: [FormsModule, DecimalPipe, DatePipe, LoadingSpinnerComponent, AlertBannerComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">&#9881; Configurações</h1>
      </div>

      @if (loadingConfig) {
        <app-loading-spinner message="Carregando configurações..." [fullPage]="true" />
      } @else if (loadError) {
        <div class="error-state">
          <app-alert-banner [message]="loadError" type="error" />
          <button class="btn btn-primary" (click)="loadConfig()">Tentar novamente</button>
        </div>
      } @else if (config) {
        <!-- Feedback banners -->
        @if (successMessage) {
          <app-alert-banner [message]="successMessage" type="success" />
        }
        @if (saveError) {
          <app-alert-banner [message]="saveError" type="error" />
        }

        <!-- Config Form -->
        <section class="config-section">
          <h2 class="section-title">Parâmetros de Negócio</h2>
          <p class="section-desc">
            Atualizado em: <span class="updated-at">{{ config.updatedAt | date:'dd/MM/yyyy HH:mm:ss' }}</span>
          </p>

          <div class="config-grid">
            <!-- Odd Limite -->
            <div class="config-card">
              <h3 class="config-group-title">&#127922; Odds</h3>
              <div class="form-group">
                <label for="oddLimite">Odd Limite</label>
                <p class="field-hint">Odd máxima para considerar um time favorito. Deve ser > 1.0.</p>
                <input
                  id="oddLimite"
                  type="number"
                  class="form-control"
                  step="0.1"
                  min="1.1"
                  [(ngModel)]="form.oddLimite"
                />
              </div>
            </div>

            <!-- Pesos -->
            <div class="config-card">
              <h3 class="config-group-title">&#9878; Pesos do Score</h3>
              <p class="field-hint">Cada peso deve ser entre 0.0 e 1.0. A soma deve ser 1.0 (±0.01) quando todos enviados.</p>
              <div class="weights-grid">
                <div class="form-group">
                  <label for="pesoMediaPontos">Média de Pontos</label>
                  <input id="pesoMediaPontos" type="number" class="form-control" step="0.05" min="0" max="1" [(ngModel)]="form.pesoMediaPontos" />
                </div>
                <div class="form-group">
                  <label for="pesoValorizacao">Valorização</label>
                  <input id="pesoValorizacao" type="number" class="form-control" step="0.05" min="0" max="1" [(ngModel)]="form.pesoValorizacao" />
                </div>
                <div class="form-group">
                  <label for="pesoDesempenho">Desempenho</label>
                  <input id="pesoDesempenho" type="number" class="form-control" step="0.05" min="0" max="1" [(ngModel)]="form.pesoDesempenho" />
                </div>
                <div class="form-group">
                  <label for="pesoFatorCasa">Fator Casa</label>
                  <input id="pesoFatorCasa" type="number" class="form-control" step="0.05" min="0" max="1" [(ngModel)]="form.pesoFatorCasa" />
                </div>
                <div class="form-group">
                  <label for="pesoTimeFavorito">Time Favorito</label>
                  <input id="pesoTimeFavorito" type="number" class="form-control" step="0.05" min="0" max="1" [(ngModel)]="form.pesoTimeFavorito" />
                </div>
              </div>
              <div class="peso-total" [class.invalid]="!pesosValidos">
                Soma dos pesos: <strong>{{ somasPesos | number:'1.2-2' }}</strong>
                @if (!pesosValidos) {
                  <span class="peso-warning">&#9888; Deve ser 1.00</span>
                }
              </div>
            </div>

            <!-- Formação -->
            <div class="config-card">
              <h3 class="config-group-title">&#9917; Formação</h3>
              <p class="field-hint">Quantidade de jogadores por posição. Deve ser >= 1.</p>
              <div class="formacao-grid">
                <div class="form-group">
                  <label for="formacaoGol">Goleiros (GOL)</label>
                  <input id="formacaoGol" type="number" class="form-control" min="1" [(ngModel)]="form.formacaoGol" />
                </div>
                <div class="form-group">
                  <label for="formacaoLat">Laterais (LAT)</label>
                  <input id="formacaoLat" type="number" class="form-control" min="1" [(ngModel)]="form.formacaoLat" />
                </div>
                <div class="form-group">
                  <label for="formacaoZag">Zagueiros (ZAG)</label>
                  <input id="formacaoZag" type="number" class="form-control" min="1" [(ngModel)]="form.formacaoZag" />
                </div>
                <div class="form-group">
                  <label for="formacaoMei">Meias (MEI)</label>
                  <input id="formacaoMei" type="number" class="form-control" min="1" [(ngModel)]="form.formacaoMei" />
                </div>
                <div class="form-group">
                  <label for="formacaoAta">Atacantes (ATA)</label>
                  <input id="formacaoAta" type="number" class="form-control" min="1" [(ngModel)]="form.formacaoAta" />
                </div>
                <div class="form-group">
                  <label for="formacaoTec">Técnicos (TEC)</label>
                  <input id="formacaoTec" type="number" class="form-control" min="1" [(ngModel)]="form.formacaoTec" />
                </div>
              </div>
            </div>
          </div>

          <div class="config-actions">
            <button class="btn btn-primary" (click)="salvar()" [disabled]="saving">
              {{ saving ? 'Salvando...' : '&#10003; Salvar Alterações' }}
            </button>
            <button class="btn btn-secondary" (click)="resetar()" [disabled]="saving">
              {{ saving ? '...' : '&#8635; Restaurar Defaults' }}
            </button>
          </div>
        </section>

        <!-- Cache Section -->
        <section class="config-section">
          <h2 class="section-title">&#128204; Gerenciar Cache</h2>
          <p class="section-desc">Força a atualização dos dados sem reiniciar a aplicação.</p>

          @if (cacheResult) {
            <app-alert-banner
              [message]="cacheResult.mensagem + ' (' + cacheResult.cachesInvalidados.join(', ') + ')'"
              type="success"
            />
          }
          @if (cacheError) {
            <app-alert-banner [message]="cacheError" type="error" />
          }

          <div class="cache-grid">
            <div class="cache-card cache-all">
              <div class="cache-info">
                <span class="cache-name">Todos os Caches</span>
                <span class="cache-desc">Invalida: odds, atletas, clubes, partidas, pontuados, statusMercado</span>
              </div>
              <button class="btn btn-danger" (click)="invalidarTodos()" [disabled]="cacheLoading">
                {{ cacheLoading === 'all' ? 'Invalidando...' : '&#128465; Invalidar Todos' }}
              </button>
            </div>

            @for (nome of cacheNames; track nome) {
              <div class="cache-card">
                <div class="cache-info">
                  <span class="cache-name cache-chip" [attr.data-cache]="nome">{{ nome }}</span>
                </div>
                <button class="btn btn-outline-danger" (click)="invalidarCache(nome)" [disabled]="cacheLoading === nome">
                  {{ cacheLoading === nome ? '...' : '&#128465;' }}
                </button>
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .section-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }

    .updated-at {
      color: var(--text-secondary);
      font-weight: 600;
    }

    .config-section {
      margin-bottom: 2.5rem;
    }

    .config-grid {
      display: grid;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .config-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
    }

    .config-group-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-secondary);
      margin: 0 0 1rem 0;
    }

    .field-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .weights-grid,
    .formacao-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1rem;
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

    .peso-total {
      margin-top: 1rem;
      font-size: 0.85rem;
      color: var(--text-muted);

      strong { color: var(--text-secondary); }

      &.invalid strong { color: var(--red); }
    }

    .peso-warning {
      margin-left: 0.5rem;
      color: var(--gold);
      font-size: 0.8rem;
    }

    .config-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .btn-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: var(--radius);
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;

      &:hover:not(:disabled) { background: rgba(239, 68, 68, 0.25); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .btn-outline-danger {
      background: transparent;
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: var(--radius);
      padding: 0.4rem 0.75rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background 0.15s;

      &:hover:not(:disabled) { background: rgba(239, 68, 68, 0.1); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .cache-grid {
      display: grid;
      gap: 0.75rem;
    }

    .cache-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.875rem 1.25rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);

      &.cache-all {
        border-color: rgba(239, 68, 68, 0.2);
      }
    }

    .cache-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .cache-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .cache-chip {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.25);
    }

    .cache-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .error-state {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    @media (max-width: 768px) {
      .config-actions { flex-direction: column; }
      .cache-card { flex-wrap: wrap; }
    }
  `]
})
export class AdminPageComponent implements OnInit {
  private configService = inject(ConfiguracaoService);
  private cacheService = inject(CacheService);

  config: ConfiguracaoResponse | null = null;
  form: ConfiguracaoRequest = {};
  loadingConfig = false;
  saving = false;
  loadError = '';
  successMessage = '';
  saveError = '';

  cacheLoading: string | null = null;
  cacheResult: CacheResponse | null = null;
  cacheError = '';

  readonly cacheNames = CACHE_NAMES;

  get somasPesos(): number {
    return (this.form.pesoMediaPontos ?? 0)
      + (this.form.pesoValorizacao ?? 0)
      + (this.form.pesoDesempenho ?? 0)
      + (this.form.pesoFatorCasa ?? 0)
      + (this.form.pesoTimeFavorito ?? 0);
  }

  get pesosValidos(): boolean {
    return Math.abs(this.somasPesos - 1.0) <= 0.01;
  }

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.loadingConfig = true;
    this.loadError = '';
    this.configService.getConfig().subscribe({
      next: (data) => {
        this.config = data;
        this.syncForm(data);
        this.loadingConfig = false;
      },
      error: (err) => {
        this.loadError = err.userMessage ?? 'Erro ao carregar configurações.';
        this.loadingConfig = false;
      }
    });
  }

  salvar(): void {
    this.saving = true;
    this.successMessage = '';
    this.saveError = '';
    this.configService.patchConfig(this.form).subscribe({
      next: (data) => {
        this.config = data;
        this.syncForm(data);
        this.successMessage = 'Configurações salvas com sucesso.';
        this.saving = false;
      },
      error: (err) => {
        this.saveError = err.userMessage ?? 'Erro ao salvar configurações.';
        this.saving = false;
      }
    });
  }

  resetar(): void {
    this.saving = true;
    this.successMessage = '';
    this.saveError = '';
    this.configService.resetConfig().subscribe({
      next: (data) => {
        this.config = data;
        this.syncForm(data);
        this.successMessage = 'Configurações restauradas para os valores padrão.';
        this.saving = false;
      },
      error: (err) => {
        this.saveError = err.userMessage ?? 'Erro ao restaurar configurações.';
        this.saving = false;
      }
    });
  }

  invalidarTodos(): void {
    this.cacheLoading = 'all';
    this.cacheResult = null;
    this.cacheError = '';
    this.cacheService.invalidateAll().subscribe({
      next: (res) => {
        this.cacheResult = res;
        this.cacheLoading = null;
      },
      error: (err) => {
        this.cacheError = err.userMessage ?? 'Erro ao invalidar caches.';
        this.cacheLoading = null;
      }
    });
  }

  invalidarCache(nome: string): void {
    this.cacheLoading = nome;
    this.cacheResult = null;
    this.cacheError = '';
    this.cacheService.invalidateByName(nome).subscribe({
      next: (res) => {
        this.cacheResult = res;
        this.cacheLoading = null;
      },
      error: (err) => {
        this.cacheError = err.userMessage ?? `Erro ao invalidar cache '${nome}'.`;
        this.cacheLoading = null;
      }
    });
  }

  private syncForm(data: ConfiguracaoResponse): void {
    this.form = {
      oddLimite: data.oddLimite,
      pesoMediaPontos: data.pesoMediaPontos,
      pesoValorizacao: data.pesoValorizacao,
      pesoDesempenho: data.pesoDesempenho,
      pesoFatorCasa: data.pesoFatorCasa,
      pesoTimeFavorito: data.pesoTimeFavorito,
      formacaoGol: data.formacaoGol,
      formacaoLat: data.formacaoLat,
      formacaoZag: data.formacaoZag,
      formacaoMei: data.formacaoMei,
      formacaoAta: data.formacaoAta,
      formacaoTec: data.formacaoTec
    };
  }
}
