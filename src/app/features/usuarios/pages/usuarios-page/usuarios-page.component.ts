import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Usuario } from '../../../../core/models/usuario.model';
import { AuthService } from '../../../../core/services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-usuarios-page',
  imports: [DatePipe, RouterLink, AlertBannerComponent, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <div class="page-header usuarios-header">
        <h1 class="page-title">&#128101; Usuários</h1>
        <a class="btn btn-primary" routerLink="/usuarios/novo">&#43; Novo usuário</a>
      </div>

      @if (carregando) {
        <app-loading-spinner message="Carregando usuários..." [fullPage]="true" />
      } @else if (erroCarga) {
        <div class="error-state">
          <app-alert-banner [message]="erroCarga" type="error" />
          <button class="btn btn-primary" (click)="carregar()">Tentar novamente</button>
        </div>
      } @else {
        @if (mensagem) {
          <app-alert-banner [message]="mensagem" type="success" />
        }
        @if (erroAcao) {
          <app-alert-banner [message]="erroAcao" type="error" />
        }

        @if (usuarios.length === 0) {
          <div class="empty-state">
            <span class="empty-icon">&#128101;</span>
            <span class="empty-title">Nenhum usuário cadastrado</span>
            <span class="empty-desc">Crie o primeiro acesso da aplicação.</span>
          </div>
        } @else {
          <div class="table-wrapper">
            <table class="usuarios-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Situação</th>
                  <th>Cadastro</th>
                  <th class="col-acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                @for (usuario of usuarios; track usuario.id) {
                  <tr [class.inativo]="!usuario.ativo">
                    <td class="col-nome">
                      {{ usuario.nome }}
                      @if (usuario.id === usuarioLogadoId) {
                        <span class="tag-voce">você</span>
                      }
                    </td>
                    <td class="col-email">{{ usuario.email }}</td>
                    <td>
                      <span class="chip chip-perfil" [class.admin]="usuario.perfil === 'ADMIN'">
                        {{ usuario.perfil }}
                      </span>
                    </td>
                    <td>
                      <span class="chip chip-situacao" [class.ativo]="usuario.ativo">
                        {{ usuario.ativo ? 'Ativo' : 'Inativo' }}
                      </span>
                    </td>
                    <td class="col-data">{{ usuario.criadoEm | date:'dd/MM/yyyy' }}</td>
                    <td class="col-acoes">
                      <a class="btn btn-secondary btn-sm" [routerLink]="['/usuarios', usuario.id]">
                        Editar
                      </a>
                      @if (usuario.ativo) {
                        <button
                          class="btn btn-secondary btn-sm btn-desativar"
                          (click)="pedirConfirmacao(usuario)"
                          [disabled]="acaoEmCurso === usuario.id"
                        >
                          Desativar
                        </button>
                      } @else {
                        <button
                          class="btn btn-secondary btn-sm"
                          (click)="ativar(usuario)"
                          [disabled]="acaoEmCurso === usuario.id"
                        >
                          Ativar
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <p class="total">
            {{ usuarios.length }} de {{ totalElementos }}
            {{ totalElementos === 1 ? 'usuário' : 'usuários' }}
          </p>
        }
      }

      @if (confirmando) {
        <div class="modal-overlay" (click)="cancelarDesativacao()">
          <div
            class="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            (click)="$event.stopPropagation()"
          >
            <h2 class="modal-title" id="modal-title">Desativar usuário</h2>
            <p class="modal-text">
              <strong>{{ confirmando.nome }}</strong> deixa de conseguir entrar na aplicação, e
              a sessão aberta dele é encerrada. O cadastro continua e pode ser reativado depois.
            </p>
            <div class="modal-actions">
              <button
                class="btn btn-ghost"
                (click)="cancelarDesativacao()"
                [disabled]="acaoEmCurso !== null"
              >
                Cancelar
              </button>
              <button
                class="btn btn-primary"
                (click)="confirmarDesativacao()"
                [disabled]="acaoEmCurso !== null"
              >
                {{ acaoEmCurso !== null ? 'Desativando...' : 'Desativar' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .usuarios-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .table-wrapper {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--bg-card);
    }

    .usuarios-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      min-width: 640px;

      th {
        text-align: left;
        padding: 0.75rem 1rem;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-muted);
        border-bottom: 1px solid var(--border);
      }

      td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border);
        color: var(--text-primary);
      }

      tbody tr:last-child td { border-bottom: none; }

      tr.inativo td {
        color: var(--text-muted);
      }
    }

    .col-nome { font-weight: 600; }
    .col-email { color: var(--text-secondary); }
    .col-data { color: var(--text-muted); white-space: nowrap; }

    .col-acoes {
      text-align: right;
      white-space: nowrap;
    }

    .tag-voce {
      margin-left: 0.4rem;
      padding: 0.1rem 0.4rem;
      border-radius: 6px;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      background: var(--blue-light);
      color: #93c5fd;
    }

    .chip {
      display: inline-flex;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
    }

    .chip-perfil {
      background: rgba(148, 163, 184, 0.15);
      color: var(--text-secondary);

      &.admin {
        background: rgba(139, 92, 246, 0.15);
        color: #c4b5fd;
      }
    }

    .chip-situacao {
      background: var(--red-light);
      color: #f87171;

      &.ativo {
        background: var(--green-light);
        color: #4ade80;
      }
    }

    .btn-sm {
      padding: 0.35rem 0.7rem;
      font-size: 0.78rem;
    }

    .btn-desativar {
      margin-left: 0.4rem;
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.3);

      &:hover:not(:disabled) { background: rgba(239, 68, 68, 0.1); }
    }

    .total {
      margin-top: 0.875rem;
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .error-state {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 100;
    }

    .modal {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }

    .modal-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.6rem;
    }

    .modal-text {
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.5;

      strong { color: var(--text-primary); }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
      margin-top: 1rem;
    }

    @media (max-width: 640px) {
      .usuarios-header { align-items: stretch; }
    }
  `]
})
export class UsuariosPageComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);

  usuarios: Usuario[] = [];
  totalElementos = 0;
  carregando = false;
  erroCarga = '';
  erroAcao = '';
  mensagem = '';

  confirmando: Usuario | null = null;
  acaoEmCurso: number | null = null;

  readonly usuarioLogadoId = this.authService.getUsuarioAtual()?.usuarioId ?? null;

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.erroCarga = '';
    this.usuarioService.listar().subscribe({
      next: (pagina) => {
        this.usuarios = pagina.conteudo;
        this.totalElementos = pagina.totalElementos;
        this.carregando = false;
      },
      error: (err) => {
        this.erroCarga = err.userMessage ?? 'Erro ao carregar usuários.';
        this.carregando = false;
      }
    });
  }

  pedirConfirmacao(usuario: Usuario): void {
    this.confirmando = usuario;
    this.erroAcao = '';
    this.mensagem = '';
  }

  cancelarDesativacao(): void {
    if (this.acaoEmCurso === null) {
      this.confirmando = null;
    }
  }

  confirmarDesativacao(): void {
    const alvo = this.confirmando;
    if (!alvo) {
      return;
    }

    this.acaoEmCurso = alvo.id;
    this.usuarioService.desativar(alvo.id).subscribe({
      next: () => {
        this.finalizarAcao();
        this.mensagem = `${alvo.nome} foi desativado.`;
        this.carregar();
      },
      error: (err) => {
        this.finalizarAcao();
        // O 409 do último administrador ativo (ou da própria conta) chega aqui com a
        // mensagem da API, que já explica exatamente o que a regra impede.
        this.erroAcao = err.userMessage ?? 'Não foi possível desativar o usuário.';
      }
    });
  }

  ativar(usuario: Usuario): void {
    this.acaoEmCurso = usuario.id;
    this.erroAcao = '';
    this.mensagem = '';
    this.usuarioService.ativar(usuario.id).subscribe({
      next: () => {
        this.acaoEmCurso = null;
        this.mensagem = `${usuario.nome} foi ativado.`;
        this.carregar();
      },
      error: (err) => {
        this.acaoEmCurso = null;
        this.erroAcao = err.userMessage ?? 'Não foi possível ativar o usuário.';
      }
    });
  }

  private finalizarAcao(): void {
    this.acaoEmCurso = null;
    this.confirmando = null;
  }
}
