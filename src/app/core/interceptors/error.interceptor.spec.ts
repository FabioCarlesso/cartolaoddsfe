import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should add userMessage for network error (status 0)', (done) => {
    http.get('/api/test').subscribe({
      error: (err) => {
        expect(err.userMessage).toContain('servidor');
        done();
      }
    });
    httpMock.expectOne('/api/test').error(new ProgressEvent('error'), { status: 0 });
  });

  it('should add userMessage for 400 Bad Request', (done) => {
    http.get('/api/test').subscribe({
      error: (err) => {
        expect(err.userMessage).toContain('inválida');
        done();
      }
    });
    httpMock.expectOne('/api/test').flush(
      { mensagem: 'Requisição inválida.' },
      { status: 400, statusText: 'Bad Request' }
    );
  });

  it('should use backend mensagem for 400 when present', (done) => {
    http.get('/api/test').subscribe({
      error: (err) => {
        expect(err.userMessage).toBe('Cache xyz não encontrado.');
        done();
      }
    });
    httpMock.expectOne('/api/test').flush(
      { mensagem: 'Cache xyz não encontrado.' },
      { status: 400, statusText: 'Bad Request' }
    );
  });

  it('should add userMessage for 401 outside the login request', (done) => {
    http.get('/api/time').subscribe({
      error: (err) => {
        expect(err.userMessage).toBe('Sessão expirada. Entre novamente.');
        done();
      }
    });
    httpMock.expectOne('/api/time').flush(
      { mensagem: 'Autenticacao necessaria para acessar este recurso.' },
      { status: 401, statusText: 'Unauthorized' }
    );
  });

  it('should add a credentials userMessage for 401 on the login request', (done) => {
    http.post('/api/auth/login', {}).subscribe({
      error: (err) => {
        expect(err.userMessage).toBe('E-mail ou senha inválidos.');
        done();
      }
    });
    httpMock.expectOne('/api/auth/login').flush(
      { mensagem: 'Credenciais invalidas.' },
      { status: 401, statusText: 'Unauthorized' }
    );
  });

  it('should add userMessage for 403 Forbidden', (done) => {
    http.patch('/api/config', {}).subscribe({
      error: (err) => {
        expect(err.userMessage).toBe('Você não tem permissão para esta ação.');
        done();
      }
    });
    httpMock.expectOne('/api/config').flush(
      { mensagem: 'Voce nao tem permissao para acessar este recurso.' },
      { status: 403, statusText: 'Forbidden' }
    );
  });

  it('should use the backend mensagem for 409 Conflict', (done) => {
    http.delete('/api/usuarios/1').subscribe({
      error: (err) => {
        expect(err.userMessage).toBe('Nao e possivel desativar o ultimo administrador ativo.');
        done();
      }
    });
    httpMock.expectOne('/api/usuarios/1').flush(
      { mensagem: 'Nao e possivel desativar o ultimo administrador ativo.' },
      { status: 409, statusText: 'Conflict' }
    );
  });

  it('should use the backend mensagem for 429 Too Many Requests', (done) => {
    http.post('/api/auth/login', {}).subscribe({
      error: (err) => {
        expect(err.userMessage).toContain('Tente novamente em 5 minutos.');
        done();
      }
    });
    httpMock.expectOne('/api/auth/login').flush(
      { mensagem: 'Muitas tentativas de login. Tente novamente em 5 minutos.' },
      { status: 429, statusText: 'Too Many Requests' }
    );
  });

  it('should add userMessage for 422 Unprocessable Entity', (done) => {
    http.get('/api/test').subscribe({
      error: (err) => {
        expect(err.userMessage).toContain('Pool de atletas');
        done();
      }
    });
    httpMock.expectOne('/api/test').flush(
      {},
      { status: 422, statusText: 'Unprocessable Entity' }
    );
  });

  it('should add userMessage for 502 Bad Gateway', (done) => {
    http.get('/api/test').subscribe({
      error: (err) => {
        expect(err.userMessage).toContain('API externa');
        done();
      }
    });
    httpMock.expectOne('/api/test').flush(
      {},
      { status: 502, statusText: 'Bad Gateway' }
    );
  });

  it('should add userMessage for 500 Internal Server Error', (done) => {
    http.get('/api/test').subscribe({
      error: (err) => {
        expect(err.userMessage).toContain('servidor');
        done();
      }
    });
    httpMock.expectOne('/api/test').flush(
      {},
      { status: 500, statusText: 'Internal Server Error' }
    );
  });

  it('should pass through successful responses unchanged', (done) => {
    http.get('/api/test').subscribe({
      next: (data) => {
        expect(data).toEqual({ ok: true });
        done();
      }
    });
    httpMock.expectOne('/api/test').flush({ ok: true });
  });
});
