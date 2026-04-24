import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CacheService } from './cache.service';
import { CacheResponse } from '../../../shared/models/configuracao.model';

const mockAllResponse: CacheResponse = {
  cachesInvalidados: ['odds', 'atletas', 'clubes', 'partidas', 'pontuados', 'statusMercado'],
  mensagem: 'Todos os caches invalidados com sucesso.',
  timestamp: '2025-06-01T15:30:00'
};

const mockOneResponse: CacheResponse = {
  cachesInvalidados: ['atletas'],
  mensagem: "Cache 'atletas' invalidado com sucesso.",
  timestamp: '2025-06-01T15:30:00'
};

describe('CacheService', () => {
  let service: CacheService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CacheService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CacheService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call DELETE /api/cache to invalidate all', (done) => {
    service.invalidateAll().subscribe((data) => {
      expect(data.cachesInvalidados.length).toBe(6);
      done();
    });
    const req = httpMock.expectOne('/api/cache');
    expect(req.request.method).toBe('DELETE');
    req.flush(mockAllResponse);
  });

  it('should call DELETE /api/cache/{nome} for specific cache', (done) => {
    service.invalidateByName('atletas').subscribe((data) => {
      expect(data.cachesInvalidados).toEqual(['atletas']);
      done();
    });
    const req = httpMock.expectOne('/api/cache/atletas');
    expect(req.request.method).toBe('DELETE');
    req.flush(mockOneResponse);
  });

  it('should call DELETE /api/cache/odds for odds cache', (done) => {
    service.invalidateByName('odds').subscribe((data) => {
      expect(data.mensagem).toContain('invalidado');
      done();
    });
    const req = httpMock.expectOne('/api/cache/odds');
    expect(req.request.method).toBe('DELETE');
    req.flush({ ...mockOneResponse, cachesInvalidados: ['odds'], mensagem: "Cache 'odds' invalidado com sucesso." });
  });

  it('should propagate 400 when cache name is invalid', (done) => {
    service.invalidateByName('xyz').subscribe({
      error: (err) => {
        expect(err.status).toBe(400);
        done();
      }
    });
    httpMock.expectOne('/api/cache/xyz').flush(
      { mensagem: "Cache 'xyz' nao encontrado." },
      { status: 400, statusText: 'Bad Request' }
    );
  });
});
