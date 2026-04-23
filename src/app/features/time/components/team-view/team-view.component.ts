import { Component, Input } from '@angular/core';
import { Atleta } from '../../../../shared/models/atleta.model';
import { TimeResponse } from '../../../../shared/models/time.model';
import { PlayerCardComponent } from '../player-card/player-card.component';

@Component({
    selector: 'app-team-view',
    imports: [PlayerCardComponent],
    template: `
    <div class="formation-wrapper">
      <div class="pitch">
        <div class="pitch-lines">
          <div class="center-circle"></div>
          <div class="center-line"></div>
          <div class="penalty-area top"></div>
          <div class="penalty-area bottom"></div>
        </div>

        <div class="formation-rows">
          <div class="formation-row attack">
            @for (p of atacantes; track p.apelido) {
              <app-player-card
                [atleta]="p"
                [isCaptain]="isCapitao(p)"
                [isLuxuryReserve]="isReservaLuxo(p)"
              />
            }
          </div>

          <div class="formation-row midfield">
            @for (p of meias; track p.apelido) {
              <app-player-card
                [atleta]="p"
                [isCaptain]="isCapitao(p)"
                [isLuxuryReserve]="isReservaLuxo(p)"
              />
            }
          </div>

          <div class="formation-row defense">
            @for (p of defensores; track p.apelido) {
              <app-player-card
                [atleta]="p"
                [isCaptain]="isCapitao(p)"
                [isLuxuryReserve]="isReservaLuxo(p)"
              />
            }
          </div>

          <div class="formation-row goalkeeper">
            @for (p of goleiros; track p.apelido) {
              <app-player-card
                [atleta]="p"
                [isCaptain]="isCapitao(p)"
                [isLuxuryReserve]="isReservaLuxo(p)"
              />
            }
          </div>
        </div>
      </div>

      @if (tecnicos.length > 0) {
        <div class="coach-section">
          <div class="coach-label">Técnico</div>
          <div class="coach-row">
            @for (p of tecnicos; track p.apelido) {
              <app-player-card
                [atleta]="p"
                [isCaptain]="isCapitao(p)"
              />
            }
          </div>
        </div>
      }
    </div>
  `,
    styles: [`
    .formation-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .pitch {
      background:
        repeating-linear-gradient(
          180deg,
          rgba(255,255,255,0.015) 0px,
          rgba(255,255,255,0.015) 60px,
          transparent 60px,
          transparent 120px
        ),
        linear-gradient(180deg, #0b3d0b 0%, #0e4a0e 50%, #0b3d0b 100%);
      border-radius: 16px;
      border: 2px solid #1a5c1a;
      padding: 2rem 1.5rem;
      position: relative;
      overflow: hidden;
      box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.4);
    }

    .pitch-lines {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .center-line {
      position: absolute;
      top: 50%;
      left: 5%;
      right: 5%;
      height: 1px;
      background: rgba(255, 255, 255, 0.12);
    }

    .center-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 120px;
      height: 120px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      transform: translate(-50%, -50%);
    }

    .penalty-area {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 40%;
      height: 60px;
      border: 1px solid rgba(255, 255, 255, 0.08);

      &.top {
        top: 0;
        border-top: none;
        border-radius: 0 0 8px 8px;
      }

      &.bottom {
        bottom: 0;
        border-bottom: none;
        border-radius: 8px 8px 0 0;
      }
    }

    .formation-rows {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      position: relative;
      z-index: 1;
    }

    .formation-row {
      display: flex;
      justify-content: center;
      gap: 0.75rem;

      app-player-card {
        flex: 1;
        max-width: 220px;
        min-width: 140px;
      }
    }

    .coach-section {
      padding: 1rem 1.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
    }

    .coach-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }

    .coach-row {
      display: flex;
      gap: 0.75rem;

      app-player-card {
        max-width: 220px;
      }
    }

    @media (max-width: 768px) {
      .pitch {
        padding: 1.25rem 0.75rem;
      }

      .formation-row {
        gap: 0.5rem;

        app-player-card {
          min-width: 0;
          max-width: none;
        }
      }

      .center-circle,
      .penalty-area {
        display: none;
      }
    }
  `]
})
export class TeamViewComponent {
  @Input({ required: true }) time!: TimeResponse;

  get atacantes(): Atleta[] {
    return this.time.titulares.filter((a) => a.posicao === 'ATA');
  }

  get meias(): Atleta[] {
    return this.time.titulares.filter((a) => a.posicao === 'MEI');
  }

  get defensores(): Atleta[] {
    const lats = this.time.titulares.filter((a) => a.posicao === 'LAT');
    const zags = this.time.titulares.filter((a) => a.posicao === 'ZAG');
    if (lats.length === 0) return zags;
    const [lat1, lat2, ...rest] = lats;
    return [lat1, ...zags, lat2 ?? rest[0]].filter(Boolean);
  }

  get goleiros(): Atleta[] {
    return this.time.titulares.filter((a) => a.posicao === 'GOL');
  }

  get tecnicos(): Atleta[] {
    return this.time.titulares.filter((a) => a.posicao === 'TEC');
  }

  isCapitao(atleta: Atleta): boolean {
    return this.time.capitao?.apelido === atleta.apelido;
  }

  isReservaLuxo(atleta: Atleta): boolean {
    return this.time.reservaLuxo?.apelido === atleta.apelido;
  }
}
