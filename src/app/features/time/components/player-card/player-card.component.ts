import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Atleta } from '../../../../shared/models/atleta.model';

@Component({
  selector: 'app-player-card',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="player-card"
         [class.is-doubt]="atleta.emDuvida"
         [class.is-captain]="isCaptain"
         [class.is-reserve]="isReserve">

      <div class="card-top">
        <span class="pos-badge" [attr.data-pos]="atleta.posicao">
          {{ atleta.posicao }}
        </span>
        <div class="card-tags">
          @if (isCaptain) {
            <span class="tag tag-captain">&#9733; Cap</span>
          }
          @if (isLuxuryReserve) {
            <span class="tag tag-luxury">&#11088; Luxo</span>
          }
          @if (atleta.emDuvida) {
            <span class="tag tag-doubt">&#9888; Dúvida</span>
          }
        </div>
      </div>

      <div class="player-name">{{ atleta.apelido }}</div>

      @if (atleta.clube) {
        <div class="player-club">{{ atleta.clube }}</div>
      }

      <div class="player-stats">
        <div class="stat">
          <span class="stat-label">Média</span>
          <span class="stat-value">{{ atleta.mediaPontos | number:'1.1-1' }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Preço</span>
          <span class="stat-value">C\${{ atleta.preco | number:'1.0-0' }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Score</span>
          <span class="stat-value score">{{ atleta.score | number:'1.1-1' }}</span>
        </div>
      </div>

      <div class="score-track">
        <div class="score-progress" [style.width.%]="scorePercent"></div>
      </div>

      @if (atleta.valorizacao !== 0) {
        <div class="valorizacao" [class.pos]="atleta.valorizacao > 0" [class.neg]="atleta.valorizacao < 0">
          {{ atleta.valorizacao > 0 ? '+' : '' }}{{ atleta.valorizacao | number:'1.1-1' }}
        </div>
      }

      @if (atleta.emDuvida && atleta.substitutoProvavel) {
        <div class="sub-row">
          <span class="sub-label">Sub provável:</span>
          <span class="sub-name">{{ atleta.substitutoProvavel.apelido }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .player-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 0.875rem;
      transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
      position: relative;
      overflow: hidden;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
        border-color: rgba(34, 197, 94, 0.25);
      }

      &.is-doubt {
        border-color: rgba(245, 158, 11, 0.35);

        &::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.04), transparent 60%);
          pointer-events: none;
        }
      }

      &.is-captain {
        border-color: rgba(245, 158, 11, 0.55);
        box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3);

        &::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.07), transparent 55%);
          pointer-events: none;
        }
      }

      &.is-reserve {
        opacity: 0.85;
      }
    }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.625rem;
    }

    .pos-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 38px;
      height: 22px;
      border-radius: 6px;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      padding: 0 0.4rem;

      &[data-pos="GOL"] { background: rgba(239,68,68,0.18); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
      &[data-pos="LAT"] { background: rgba(59,130,246,0.18); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); }
      &[data-pos="ZAG"] { background: rgba(139,92,246,0.18); color: #a78bfa; border: 1px solid rgba(139,92,246,0.3); }
      &[data-pos="MEI"] { background: rgba(34,197,94,0.18); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
      &[data-pos="ATA"] { background: rgba(245,158,11,0.18); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
      &[data-pos="TEC"] { background: rgba(156,163,175,0.18); color: #9ca3af; border: 1px solid rgba(156,163,175,0.3); }
    }

    .card-tags {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
      font-size: 0.63rem;
      font-weight: 700;
    }

    .tag-captain {
      background: rgba(245,158,11,0.18);
      color: #fbbf24;
      border: 1px solid rgba(245,158,11,0.35);
    }

    .tag-luxury {
      background: rgba(139,92,246,0.18);
      color: #a78bfa;
      border: 1px solid rgba(139,92,246,0.35);
    }

    .tag-doubt {
      background: rgba(245,158,11,0.12);
      color: #f59e0b;
      border: 1px solid rgba(245,158,11,0.25);
    }

    .player-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
      font-family: 'Space Grotesk', sans-serif;
      line-height: 1.25;
      margin-bottom: 0.2rem;
    }

    .player-club {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.625rem;
    }

    .player-stats {
      display: flex;
      gap: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;

      .stat-label {
        font-size: 0.63rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .stat-value {
        font-size: 0.825rem;
        font-weight: 600;
        color: var(--text-primary);

        &.score {
          color: #4ade80;
        }
      }
    }

    .score-track {
      height: 3px;
      background: rgba(255,255,255,0.08);
      border-radius: 9999px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .score-progress {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #10b981);
      border-radius: 9999px;
      transition: width 0.6s ease;
    }

    .valorizacao {
      font-size: 0.72rem;
      font-weight: 600;

      &.pos { color: #4ade80; }
      &.neg { color: #f87171; }
    }

    .sub-row {
      margin-top: 0.5rem;
      padding: 0.3rem 0.5rem;
      background: rgba(245,158,11,0.07);
      border-radius: 6px;
      font-size: 0.72rem;
      display: flex;
      align-items: center;
      gap: 0.3rem;

      .sub-label { color: var(--text-muted); }
      .sub-name { color: #fbbf24; font-weight: 600; }
    }
  `]
})
export class PlayerCardComponent {
  @Input({ required: true }) atleta!: Atleta;
  @Input() isCaptain = false;
  @Input() isLuxuryReserve = false;
  @Input() isReserve = false;

  get scorePercent(): number {
    return Math.min((this.atleta.score / 12) * 100, 100);
  }
}
