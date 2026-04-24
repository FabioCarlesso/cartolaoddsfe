import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfiguracaoService } from './configuracao.service';
import { ConfiguracaoResponse, ConfiguracaoRequest } from '../../../shared/models/configuracao.model';

const mockConfig: ConfiguracaoResponse = {
  oddLimite: 3.0,
  pesoMediaPontos: 0.40,
  pesoValorizacao: 0.20,
  pesoDesempenho: 0.20,
  pesoFatorCasa: 0.10,
  pesoTimeFavorito: 0.10,
  formacaoGol: 1,
  formacaoLat: 2,
  formacaoZag: 2,
  formacaoMei: 3,
  formacaoAta: 3,
  formacaoTec: 1,
  updatedAt: '2025-06-01T15:30:00'
};

describe('ConfiguracaoService', () => {
  let service: ConfiguracaoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConfiguracaoService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ConfiguracaoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET /api/config', (done) => {
    service.getConfig().subscribe((data) => {
      expect(data).toEqual(mockConfig);
      done();
    });
    const req = httpMock.expectOne('/api/config');
    expect(req.request.method).toBe('GET');
    req.flush(mockConfig);
  });

  it('should call PATCH /api/config with body', (done) => {
    const patch: ConfiguracaoRequest = { oddLimite: 2.5 };
    service.patchConfig(patch).subscribe((data) => {
      expect(data.oddLimite).toBe(2.5);
      done();
    });
    const req = httpMock.expectOne('/api/config');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(patch);
    req.flush({ ...mockConfig, oddLimite: 2.5 });
  });

  it('should call POST /api/config/reset', (done) => {
    service.resetConfig().subscribe((data) => {
      expect(data).toEqual(mockConfig);
      done();
    });
    const req = httpMock.expectOne('/api/config/reset');
    expect(req.request.method).toBe('POST');
    req.flush(mockConfig);
  });

  it('should propagate HTTP errors on getConfig', (done) => {
    service.getConfig().subscribe({
      error: (err) => {
        expect(err.status).toBe(500);
        done();
      }
    });
    httpMock.expectOne('/api/config').flush({}, { status: 500, statusText: 'Internal Server Error' });
  });

  it('should propagate HTTP 400 on patchConfig', (done) => {
    service.patchConfig({ oddLimite: 0.5 }).subscribe({
      error: (err) => {
        expect(err.status).toBe(400);
        done();
      }
    });
    httpMock.expectOne('/api/config').flush(
      { mensagem: 'oddLimite deve ser > 1.0' },
      { status: 400, statusText: 'Bad Request' }
    );
  });
});
