import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';

/** Mínimo aceito pelo backend (`AlterarSenhaRequest.novaSenha`). */
const SENHA_MIN = 8;

function senhasConferem(group: AbstractControl): ValidationErrors | null {
  const nova = group.get('novaSenha')?.value;
  const confirmacao = group.get('confirmacao')?.value;
  return nova && confirmacao && nova !== confirmacao ? { senhasDiferentes: true } : null;
}

@Component({
  selector: 'app-alterar-senha-page',
  imports: [ReactiveFormsModule, AlertBannerComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">&#128273; Trocar senha</h1>
      </div>

      <section class="senha-card">
        <p class="senha-aviso">
          Ao trocar a senha, a sessão atual é encerrada e você precisará entrar de novo — em
          todos os dispositivos.
        </p>

        @if (erro) {
          <app-alert-banner [message]="erro" type="error" />
        }
        @if (sucesso) {
          <app-alert-banner
            message="Senha alterada. Entre novamente com a nova senha."
            type="success"
          />
        }

        <form [formGroup]="form" (ngSubmit)="salvar()" novalidate>
          <div class="form-group">
            <label for="senhaAtual">Senha atual</label>
            <input
              id="senhaAtual"
              type="password"
              class="form-control"
              autocomplete="current-password"
              formControlName="senhaAtual"
            />
          </div>

          <div class="form-group">
            <label for="novaSenha">Nova senha</label>
            <input
              id="novaSenha"
              type="password"
              class="form-control"
              autocomplete="new-password"
              formControlName="novaSenha"
            />
            <span class="field-hint">Mínimo de {{ senhaMin }} caracteres.</span>
          </div>

          <div class="form-group">
            <label for="confirmacao">Confirme a nova senha</label>
            <input
              id="confirmacao"
              type="password"
              class="form-control"
              autocomplete="new-password"
              formControlName="confirmacao"
            />
            @if (form.hasError('senhasDiferentes') && form.controls.confirmacao.touched) {
              <span class="field-error">As senhas não conferem.</span>
            }
          </div>

          <button type="submit" class="btn btn-primary" [disabled]="salvando || sucesso">
            {{ salvando ? 'Salvando...' : 'Trocar senha' }}
          </button>
        </form>
      </section>
    </div>
  `,
  styles: [`
    .senha-card {
      max-width: 440px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
    }

    .senha-aviso {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      align-items: flex-start;
    }

    .form-group { width: 100%; }

    .field-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .field-error {
      color: var(--red);
      font-size: 0.78rem;
    }
  `]
})
export class AlterarSenhaPageComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  readonly senhaMin = SENHA_MIN;

  readonly form = this.fb.nonNullable.group(
    {
      senhaAtual: ['', Validators.required],
      novaSenha: ['', [Validators.required, Validators.minLength(SENHA_MIN)]],
      confirmacao: ['', Validators.required]
    },
    { validators: senhasConferem }
  );

  salvando = false;
  sucesso = false;
  erro = '';

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { senhaAtual, novaSenha } = this.form.getRawValue();
    this.salvando = true;
    this.erro = '';

    this.authService.alterarSenha({ senhaAtual, novaSenha }).subscribe({
      next: () => {
        this.salvando = false;
        this.sucesso = true;
        // O backend invalida o token nesta operação, então a sessão atual já morreu:
        // é o próprio logout que evita o usuário esbarrar num 401 na próxima navegação.
        this.authService.logout();
      },
      error: (err) => {
        this.erro = err.userMessage ?? 'Não foi possível trocar a senha.';
        this.salvando = false;
      }
    });
  }
}
