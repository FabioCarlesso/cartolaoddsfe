import { TestBed } from '@angular/core/testing';
import { Router, Routes, provideRouter } from '@angular/router';
import { Component, signal } from '@angular/core';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';
import { SessaoUsuario } from './core/models/auth.model';

/** Destino qualquer para as navegações que exercitam o layout do shell. */
@Component({ selector: 'app-rota-fake', template: '' })
class RotaFakeComponent {}

const sessao: SessaoUsuario = {
  usuarioId: 1,
  email: 'fabio@cartolaodds.local',
  nome: 'Fabio Carlesso',
  perfil: 'ADMIN'
};

describe('AppComponent', () => {
  let usuarioAtual: ReturnType<typeof signal<SessaoUsuario | null>>;
  let authService: jasmine.SpyObj<AuthService>;

  /**
   * O shell só decide o layout depois da primeira navegação (ver `layoutFluido`), então toda
   * montagem navega para uma rota antes de olhar para o cabeçalho e o rodapé.
   */
  async function montar(
    usuario: SessaoUsuario | null,
    rotas: Routes = [{ path: '**', component: RotaFakeComponent }],
    destino = '/'
  ) {
    TestBed.resetTestingModule();
    usuarioAtual = signal<SessaoUsuario | null>(usuario);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['logout'], {
      usuarioAtual: usuarioAtual.asReadonly(),
      autenticado: signal(usuario !== null).asReadonly(),
      perfilAtual: signal(usuario?.perfil ?? null).asReadonly()
    } as Partial<AuthService>);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter(rotas), { provide: AuthService, useValue: authService }]
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl(destino);
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

  it('should render every navigation link for an ADMIN', async () => {
    const fixture = await montar(sessao);
    const textos = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.nav-links a')).map(
      (a) => a.textContent
    );

    expect(textos.length).toBe(7);
    expect(textos.some((t) => t?.includes('Config'))).toBeTrue();
    expect(textos.some((t) => t?.includes('Usuários'))).toBeTrue();
  });

  it('should hide Config and Usuários from a USER', async () => {
    const fixture = await montar({ ...sessao, perfil: 'USER' });
    const textos = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.nav-links a')).map(
      (a) => a.textContent
    );

    expect(textos.length).toBe(5);
    expect(textos.some((t) => t?.includes('Config'))).toBeFalse();
    expect(textos.some((t) => t?.includes('Usuários'))).toBeFalse();
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

  // A landing pública traz o próprio cabeçalho e o próprio rodapé; sem sair da frente, o shell
  // duplicaria os dois e ainda limitaria a largura das faixas.
  it('should hide its own header and footer on a fluid-layout route', async () => {
    const fixture = await montar(
      null,
      [{ path: 'landing', data: { layoutFluido: true }, component: RotaFakeComponent }],
      '/landing'
    );

    expect(fixture.nativeElement.querySelector('.navbar')).toBeNull();
    expect(fixture.nativeElement.querySelector('.footer')).toBeNull();
    expect(fixture.nativeElement.querySelector('.main-content-fluido')).toBeTruthy();
  });

  it('should keep header and footer on a regular route', async () => {
    const fixture = await montar(sessao, [{ path: 'time', component: RotaFakeComponent }], '/time');

    expect(fixture.nativeElement.querySelector('.navbar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.footer')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.main-content-fluido')).toBeNull();
  });

  /**
   * A landing chega pronta do prerender. Se o shell assumisse "rota normal" enquanto a primeira
   * navegação não termina, a navbar apareceria por alguns quadros e empurraria a página inteira
   * 64px para baixo — o salto de layout que dominava o CLS da página pública.
   */
  it('should render no header or footer before the first navigation settles', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([{ path: '**', component: RotaFakeComponent }]),
        {
          provide: AuthService,
          useValue: jasmine.createSpyObj<AuthService>('AuthService', ['logout'], {
            usuarioAtual: signal(null).asReadonly(),
            autenticado: signal(false).asReadonly(),
            perfilAtual: signal(null).asReadonly()
          } as Partial<AuthService>)
        }
      ]
    });

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.layoutFluido()).toBeUndefined();
    expect(fixture.nativeElement.querySelector('.navbar')).toBeNull();
    expect(fixture.nativeElement.querySelector('.footer')).toBeNull();
    expect(fixture.nativeElement.querySelector('.main-content-fluido')).toBeNull();
  });
});
