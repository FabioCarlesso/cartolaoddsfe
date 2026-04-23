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
