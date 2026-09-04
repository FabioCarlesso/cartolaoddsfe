import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';
import { tokenValido } from '../services/auth.service.spec';

const TOKEN_KEY = 'cartolaodds.accessToken';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router }
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function comSessao(): void {
    localStorage.setItem(TOKEN_KEY, tokenValido());
    authService.isAuthenticated();
  }

  it('should add the Authorization header when there is a token', (done) => {
    comSessao();

    http.get('/api/time').subscribe(() => done());

    const req = httpMock.expectOne('/api/time');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${authService.getToken()}`);
    req.flush({});
  });

  it('should not add the Authorization header without a token', (done) => {
    http.get('/api/time').subscribe(() => done());

    const req = httpMock.expectOne('/api/time');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should not add the Authorization header on the login request', (done) => {
    comSessao();

    http.post('/api/auth/login', {}).subscribe(() => done());

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should clear the session and go to /login on 401', (done) => {
    comSessao();

    http.get('/api/time').subscribe({
      error: () => {
        expect(authService.autenticado()).toBeFalse();
        expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
        expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { expirada: '1' } });
        done();
      }
    });

    httpMock.expectOne('/api/time').flush(
      { mensagem: 'Autenticacao necessaria para acessar este recurso.' },
      { status: 401, statusText: 'Unauthorized' }
    );
  });

  it('should keep the session on 403', (done) => {
    comSessao();

    http.patch('/api/config', {}).subscribe({
      error: () => {
        expect(authService.autenticado()).toBeTrue();
        expect(localStorage.getItem(TOKEN_KEY)).not.toBeNull();
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      }
    });

    httpMock.expectOne('/api/config').flush(
      { mensagem: 'Voce nao tem permissao para acessar este recurso.' },
      { status: 403, statusText: 'Forbidden' }
    );
  });

  it('should not redirect on a 401 coming from the login request', (done) => {
    http.post('/api/auth/login', {}).subscribe({
      error: () => {
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      }
    });

    httpMock.expectOne('/api/auth/login').flush(
      { mensagem: 'Credenciais invalidas.' },
      { status: 401, statusText: 'Unauthorized' }
    );
  });

  it('should not redirect on other error statuses', (done) => {
    comSessao();

    http.get('/api/time').subscribe({
      error: () => {
        expect(authService.autenticado()).toBeTrue();
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      }
    });

    httpMock.expectOne('/api/time').flush({}, { status: 500, statusText: 'Internal Server Error' });
  });
});

// Os testes acima exercitam o authInterceptor sozinho. Como o app registra os dois
// interceptors juntos, e é o errorInterceptor que fica mais perto do backend (logo, o
// primeiro a ver o erro na volta), a cadeia completa precisa de cobertura própria: foi
// exatamente aí que o 401 deixou de deslogar quando o erro chegava como cópia, sem o
// protótipo de HttpErrorResponse.
describe('authInterceptor chained with the errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        // Mesma ordem de app.config.ts.
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router }
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    localStorage.setItem(TOKEN_KEY, tokenValido());
    authService.isAuthenticated();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should clear the session and go to /login on 401, with the translated message', (done) => {
    http.get('/api/time').subscribe({
      error: (err) => {
        expect(authService.autenticado()).toBeFalse();
        expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
        expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { expirada: '1' } });
        expect(err.userMessage).toBe('Sessão expirada. Entre novamente.');
        done();
      }
    });

    httpMock.expectOne('/api/time').flush(
      { mensagem: 'Autenticacao necessaria para acessar este recurso.' },
      { status: 401, statusText: 'Unauthorized' }
    );
  });

  it('should keep the session on 403, with the translated message', (done) => {
    http.patch('/api/config', {}).subscribe({
      error: (err) => {
        expect(authService.autenticado()).toBeTrue();
        expect(localStorage.getItem(TOKEN_KEY)).not.toBeNull();
        expect(router.navigate).not.toHaveBeenCalled();
        expect(err.userMessage).toBe('Você não tem permissão para esta ação.');
        done();
      }
    });

    httpMock.expectOne('/api/config').flush(
      { mensagem: 'Voce nao tem permissao para acessar este recurso.' },
      { status: 403, statusText: 'Forbidden' }
    );
  });

  it('should keep the error usable as an HttpErrorResponse for the interceptors above', (done) => {
    http.get('/api/time').subscribe({
      error: (err) => {
        expect(err instanceof HttpErrorResponse).toBeTrue();
        expect(err.status).toBe(401);
        done();
      }
    });

    httpMock.expectOne('/api/time').flush({}, { status: 401, statusText: 'Unauthorized' });
  });
});
