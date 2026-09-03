import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { LoginPageComponent } from './login-page.component';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginResponse } from '../../../../core/models/auth.model';

const loginResponse: LoginResponse = {
  accessToken: 'token',
  tipo: 'Bearer',
  expiraEmSegundos: 86400,
  nome: 'Fabio',
  perfil: 'USER'
};

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let component: LoginPageComponent;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  async function montar(queryParams: Record<string, string> = {}): Promise<void> {
    TestBed.resetTestingModule();
    authService = jasmine.createSpyObj('AuthService', ['login']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => montar());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call the API with an invalid form', () => {
    component.entrar();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should send the credentials and go to /time on success', () => {
    authService.login.and.returnValue(of(loginResponse));
    component.form.setValue({ email: 'fabio@cartolaodds.local', senha: 'senha-forte-123' });

    component.entrar();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'fabio@cartolaodds.local',
      senha: 'senha-forte-123'
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/time');
    expect(component.carregando).toBeFalse();
  });

  it('should show the error and stay on the page for invalid credentials', () => {
    authService.login.and.returnValue(
      throwError(() => ({ status: 401, userMessage: 'E-mail ou senha inválidos.' }))
    );
    component.form.setValue({ email: 'fabio@cartolaodds.local', senha: 'errada' });

    component.entrar();
    fixture.detectChanges();

    expect(component.erro).toBe('E-mail ou senha inválidos.');
    expect(component.carregando).toBeFalse();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.alert-error').textContent).toContain('inválidos');
  });

  it('should show the loading state while the request is pending', () => {
    const pendente = new Subject<LoginResponse>();
    authService.login.and.returnValue(pendente);
    component.form.setValue({ email: 'fabio@cartolaodds.local', senha: 'senha-forte-123' });

    component.entrar();
    fixture.detectChanges();

    const botao = fixture.nativeElement.querySelector('.login-submit') as HTMLButtonElement;
    expect(component.carregando).toBeTrue();
    expect(botao.disabled).toBeTrue();
    expect(botao.textContent).toContain('Entrando...');

    pendente.next(loginResponse);
    pendente.complete();
    expect(component.carregando).toBeFalse();
  });

  it('should warn about the expired session', async () => {
    await montar({ expirada: '1' });

    expect(component.sessaoExpirada).toBeTrue();
    expect(fixture.nativeElement.querySelector('.alert-warning').textContent).toContain('expirada');
  });

  it('should return to the intended route after login', async () => {
    await montar({ redirect: '/historico/38' });
    authService.login.and.returnValue(of(loginResponse));
    component.form.setValue({ email: 'fabio@cartolaodds.local', senha: 'senha-forte-123' });

    component.entrar();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/historico/38');
  });

  it('should ignore an external redirect target', async () => {
    await montar({ redirect: 'https://exemplo.invalido/phishing' });
    authService.login.and.returnValue(of(loginResponse));
    component.form.setValue({ email: 'fabio@cartolaodds.local', senha: 'senha-forte-123' });

    component.entrar();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/time');
  });

  it('should ignore a protocol-relative redirect target', async () => {
    await montar({ redirect: '//exemplo.invalido' });
    authService.login.and.returnValue(of(loginResponse));
    component.form.setValue({ email: 'fabio@cartolaodds.local', senha: 'senha-forte-123' });

    component.entrar();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/time');
  });
});
