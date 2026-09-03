import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';
import { SessaoUsuario } from './core/models/auth.model';

const sessao: SessaoUsuario = {
  usuarioId: 1,
  email: 'fabio@cartolaodds.local',
  nome: 'Fabio Carlesso',
  perfil: 'ADMIN'
};

describe('AppComponent', () => {
  let usuarioAtual: ReturnType<typeof signal<SessaoUsuario | null>>;
  let authService: jasmine.SpyObj<AuthService>;

  async function montar(usuario: SessaoUsuario | null) {
    TestBed.resetTestingModule();
    usuarioAtual = signal<SessaoUsuario | null>(usuario);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['logout'], {
      usuarioAtual: usuarioAtual.asReadonly(),
      autenticado: signal(usuario !== null).asReadonly()
    } as Partial<AuthService>);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }]
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create the app', async () => {
    const fixture = await montar(sessao);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the navbar', async () => {
    const fixture = await montar(sessao);
    expect(fixture.nativeElement.querySelector('.navbar')).toBeTruthy();
  });

  it('should render navigation links when authenticated', async () => {
    const fixture = await montar(sessao);
    expect(fixture.nativeElement.querySelectorAll('.nav-links a').length).toBe(6);
  });

  it('should render the logged user name', async () => {
    const fixture = await montar(sessao);
    expect(fixture.nativeElement.querySelector('.nav-user .user-name').textContent).toContain(
      'Fabio Carlesso'
    );
  });

  it('should hide the navigation and the user area without a session', async () => {
    const fixture = await montar(null);
    expect(fixture.nativeElement.querySelector('.nav-links')).toBeNull();
    expect(fixture.nativeElement.querySelector('.nav-user')).toBeNull();
  });

  it('should render brand name', async () => {
    const fixture = await montar(null);
    expect(fixture.nativeElement.querySelector('.brand-text').textContent).toContain('Cartola');
  });

  it('should log out from the header button', async () => {
    const fixture = await montar(sessao);
    fixture.nativeElement.querySelector('.btn-sair').click();
    expect(authService.logout).toHaveBeenCalled();
  });

  it('should render router outlet', async () => {
    const fixture = await montar(sessao);
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });
});
