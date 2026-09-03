import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
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
