import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Perfil } from '../../../../core/models/auth.model';
import { Usuario, UsuarioUpdateRequest } from '../../../../core/models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

/** Mínimo aceito pelo backend (`UsuarioRequest.senha`). */
const SENHA_MIN = 8;

const PERFIS: Perfil[] = ['USER', 'ADMIN'];

@Component({
  selector: 'app-usuario-form-page',
  imports: [ReactiveFormsModule, RouterLink, AlertBannerComponent, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">
          {{ edicao ? '&#9998; Editar usuário' : '&#43; Novo usuário' }}
        </h1>
      </div>

      @if (carregando) {
        <app-loading-spinner message="Carregando usuário..." [fullPage]="true" />
      } @else if (erroCarga) {
        <div class="error-state">
          <app-alert-banner [message]="erroCarga" type="error" />
          <a class="btn btn-secondary" routerLink="/usuarios">Voltar para a lista</a>
        </div>
      } @else {
        <section class="form-card">
          @if (erro) {
            <app-alert-banner [message]="erro" type="error" />
          }

          <form [formGroup]="form" (ngSubmit)="salvar()" novalidate>
            <div class="form-group">
              <label for="nome">Nome</label>
              <input
                id="nome"
                type="text"
                class="form-control"
                formControlName="nome"
                [class.invalid]="invalido('nome')"
              />
              @if (invalido('nome')) {
                <span class="field-error">Informe o nome.</span>
              }
            </div>

            <div class="form-group">
              <label for="email">E-mail</label>
              <input
                id="email"
                type="email"
                class="form-control"
                autocomplete="off"
                formControlName="email"
                [class.invalid]="invalido('email')"
              />
              @if (invalido('email')) {
                <span class="field-error">Informe um e-mail válido.</span>
              }
            </div>

            @if (!edicao) {
              <div class="form-group">
                <label for="senha">Senha inicial</label>
                <input
                  id="senha"
                  type="password"
                  class="form-control"
                  autocomplete="new-password"
                  formControlName="senha"
                  [class.invalid]="invalido('senha')"
                />
                <span class="field-hint">
                  Mínimo de {{ senhaMin }} caracteres. O usuário pode trocá-la depois em
                  "Trocar senha".
                </span>
                @if (invalido('senha')) {
                  <span class="field-error">A senha deve ter ao menos {{ senhaMin }} caracteres.</span>
                }
              </div>
            }

            <div class="form-group">
              <label for="perfil">Perfil</label>
              <select id="perfil" class="form-control" formControlName="perfil">
                @for (opcao of perfis; track opcao) {
                  <option [value]="opcao">{{ opcao }}</option>
                }
              </select>
              <span class="field-hint">
                ADMIN administra configuração, cache e usuários. USER consulta as telas de
                análise.
              </span>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="salvando">
                {{ salvando ? 'Salvando...' : 'Salvar' }}
              </button>
              <a class="btn btn-secondary" routerLink="/usuarios">Cancelar</a>
            </div>
          </form>
        </section>
      }
    </div>
  `,
  styles: [`
    .form-card {
      max-width: 480px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .field-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .field-error {
      color: var(--red);
      font-size: 0.78rem;
    }

    .form-control.invalid {
      border-color: var(--red);
    }

    .form-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .error-state {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }
  `]
})
export class UsuarioFormPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly senhaMin = SENHA_MIN;
  readonly perfis = PERFIS;

  // A senha não entra na edição: a API não a aceita no PATCH, e o próprio usuário a troca
  // em `/alterar-senha`. Nenhuma senha é exibida em tela alguma.
  readonly form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(SENHA_MIN)]],
    perfil: ['USER' as Perfil, Validators.required]
  });

  edicao = false;
  carregando = false;
  salvando = false;
  erro = '';
  erroCarga = '';

  private usuarioId: number | null = null;
  private original: Usuario | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      return;
    }

    this.edicao = true;
    this.usuarioId = id;
    this.form.controls.senha.disable();
    this.carregar(id);
  }

  invalido(campo: 'nome' | 'email' | 'senha'): boolean {
    const control = this.form.controls[campo];
    return control.enabled && control.invalid && (control.dirty || control.touched);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando = true;
    this.erro = '';

    const acao = this.edicao ? this.atualizar() : this.criar();
    acao.subscribe({
      next: () => {
        this.salvando = false;
        this.router.navigate(['/usuarios']);
      },
      error: (err) => {
        this.salvando = false;
        this.erro = this.traduzir(err);
      }
    });
  }

  private criar() {
    const { nome, email, senha, perfil } = this.form.getRawValue();
    return this.usuarioService.criar({ nome: nome.trim(), email: email.trim(), senha, perfil });
  }

  private atualizar() {
    const { nome, email, perfil } = this.form.getRawValue();
    // Só o que mudou vai no PATCH — a API trata campo ausente como "deixe como está".
    const request: UsuarioUpdateRequest = {};
    if (nome.trim() !== this.original?.nome) {
      request.nome = nome.trim();
    }
    if (email.trim() !== this.original?.email) {
      request.email = email.trim();
    }
    if (perfil !== this.original?.perfil) {
      request.perfil = perfil;
    }

    return this.usuarioService.atualizar(this.usuarioId as number, request);
  }

  private carregar(id: number): void {
    this.carregando = true;
    this.usuarioService.buscarPorId(id).subscribe({
      next: (usuario) => {
        this.original = usuario;
        this.form.patchValue({
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil
        });
        this.carregando = false;
      },
      error: (err) => {
        this.erroCarga = err.userMessage ?? 'Erro ao carregar o usuário.';
        this.carregando = false;
      }
    });
  }

  /**
   * O `409` da criação só tem uma causa possível — e-mail repetido. Na edição ele também
   * pode vir das regras de administrador (própria conta, último ADMIN ativo), e aí a
   * mensagem da API é mais informativa do que qualquer texto fixo daqui.
   */
  private traduzir(err: { status?: number; userMessage?: string }): string {
    if (err.status === 409) {
      const mensagem = err.userMessage ?? '';
      if (!this.edicao || /e-?mail/i.test(mensagem)) {
        return 'E-mail já cadastrado.';
      }
      return mensagem;
    }

    return err.userMessage ?? 'Não foi possível salvar o usuário.';
  }
}
