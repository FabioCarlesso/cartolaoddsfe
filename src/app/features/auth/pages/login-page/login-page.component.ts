import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, AlertBannerComponent],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-brand">
          <span class="brand-icon">&#9917;</span>
          <span class="brand-text">Cartola <span class="brand-accent">Odds</span></span>
        </div>
        <p class="login-subtitle">Entre para acessar suas análises da rodada.</p>

        @if (sessaoExpirada) {
          <app-alert-banner message="Sessão expirada. Entre novamente." type="warning" />
        }
        @if (erro) {
          <app-alert-banner [message]="erro" type="error" />
        }

        <form [formGroup]="form" (ngSubmit)="entrar()" novalidate>
          <div class="form-group">
            <label for="email">E-mail</label>
            <input
              id="email"
              type="email"
              class="form-control"
              autocomplete="username"
              formControlName="email"
              [class.invalid]="invalido('email')"
            />
            @if (invalido('email')) {
              <span class="field-error">Informe um e-mail válido.</span>
            }
          </div>

          <div class="form-group">
            <label for="senha">Senha</label>
            <input
              id="senha"
              type="password"
              class="form-control"
              autocomplete="current-password"
              formControlName="senha"
              [class.invalid]="invalido('senha')"
            />
            @if (invalido('senha')) {
              <span class="field-error">Informe sua senha.</span>
            }
          </div>

          <button type="submit" class="btn btn-primary login-submit" [disabled]="carregando">
            {{ carregando ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <a class="login-voltar" routerLink="/">&#8592; Voltar ao início</a>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100%;
      padding: 3rem 1.5rem;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
      padding: 2rem;
    }

    .login-brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;

      .brand-icon { font-size: 1.75rem; }

      .brand-text {
        font-size: 1.4rem;
        font-weight: 700;
        font-family: 'Space Grotesk', sans-serif;
        letter-spacing: -0.01em;
      }

      .brand-accent { color: var(--green-primary); }
    }

    .login-subtitle {
      margin: 0.5rem 0 1.75rem;
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .field-error {
      color: var(--red);
      font-size: 0.78rem;
    }

    .form-control.invalid {
      border-color: var(--red);
    }

    .login-submit {
      justify-content: center;
      width: 100%;
      padding: 0.7rem 1.2rem;
    }

    .login-voltar {
      display: block;
      margin-top: 1.5rem;
      text-align: center;
      font-size: 0.82rem;
      color: var(--text-muted);

      &:hover { color: var(--text-secondary); }
    }
  `]
})
export class LoginPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required]
  });

  carregando = false;
  erro = '';
  sessaoExpirada = false;

  private redirect = '/time';

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.sessaoExpirada = params.get('expirada') === '1';

    // Só rotas internas são aceitas como destino: um `redirect` absoluto vindo da URL
    // transformaria a tela de login em trampolim para outro domínio.
    const redirect = params.get('redirect');
    if (redirect?.startsWith('/') && !redirect.startsWith('//') && !redirect.startsWith('/login')) {
      this.redirect = redirect;
    }
  }

  invalido(campo: 'email' | 'senha'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.dirty || control.touched);
  }

  entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.carregando = true;
    this.erro = '';
    this.sessaoExpirada = false;

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.carregando = false;
        this.router.navigateByUrl(this.redirect);
      },
      error: (err) => {
        this.erro = err.userMessage ?? 'Não foi possível entrar. Tente novamente.';
        this.carregando = false;
      }
    });
  }
}
