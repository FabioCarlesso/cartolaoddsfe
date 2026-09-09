import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CotaService } from './cota.service';
import { CotaResponse, CotaHistoricoResponse } from '../../../shared/models/cota.model';

const mockCota: CotaResponse = {
  saldoRestante: 412,
  consumoMes: 88,
  ultimaLeitura: '2025-06-01T15:30:00',
  minRequestsRemaining: 50,
  guardrailAtivo: false,
  ultimaSondagem: null,
  proximaSondagem: null
};

const mockHistorico: CotaHistoricoResponse = {
  dias: 30,
  desde: '2025-05-02T15:30:00',
  total: 2,
  leituras: [
    { instante: '2025-06-01T15:00:00', saldoRestante: 420, consumoMes: 80, reinicioDeCota: false },
    { instante: '2025-06-01T15:30:00', saldoRestante: 412, consumoMes: 88, reinicioDeCota: false }
  ]
};

describe('CotaService', () => {
  let service: CotaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CotaService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CotaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET /api/odds/cota', (done) => {
    service.getCota().subscribe((data) => {
      expect(data.saldoRestante).toBe(412);
      expect(data.minRequestsRemaining).toBe(50);
      expect(data.guardrailAtivo).toBeFalse();
      done();
    });
    const req = httpMock.expectOne('/api/odds/cota');
    expect(req.request.method).toBe('GET');
    req.flush(mockCota);
  });

  it('should keep the nullable fields as null when there was no reading', (done) => {
    service.getCota().subscribe((data) => {
      expect(data.saldoRestante).toBeNull();
      expect(data.consumoMes).toBeNull();
      expect(data.ultimaLeitura).toBeNull();
      done();
    });
    httpMock.expectOne('/api/odds/cota').flush({
      ...mockCota,
      saldoRestante: null,
      consumoMes: null,
      ultimaLeitura: null
    });
  });

  it('should call GET /api/odds/cota/historico with the dias param', (done) => {
    service.getHistorico(30).subscribe((data) => {
      expect(data.total).toBe(2);
      expect(data.leituras.length).toBe(2);
      done();
    });
    const req = httpMock.expectOne((r) => r.url === '/api/odds/cota/historico');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('dias')).toBe('30');
    req.flush(mockHistorico);
  });

  it('should omit the dias param when not informed', (done) => {
    service.getHistorico().subscribe(() => done());
    const req = httpMock.expectOne('/api/odds/cota/historico');
    expect(req.request.params.has('dias')).toBeFalse();
    req.flush(mockHistorico);
  });

  it('should expose the reinicioDeCota flag of each reading', (done) => {
    service.getHistorico(30).subscribe((data) => {
      expect(data.leituras[1].reinicioDeCota).toBeTrue();
      done();
    });
    httpMock.expectOne((r) => r.url === '/api/odds/cota/historico').flush({
      ...mockHistorico,
      leituras: [
        mockHistorico.leituras[0],
        { instante: '2025-06-02T10:00:00', saldoRestante: 500, consumoMes: 0, reinicioDeCota: true }
      ]
    });
  });

  it('should propagate 403 when the token has no ADMIN profile', (done) => {
    service.getCota().subscribe({
      error: (err) => {
        expect(err.status).toBe(403);
        done();
      }
    });
    httpMock.expectOne('/api/odds/cota').flush(
      { mensagem: 'Acesso negado.' },
      { status: 403, statusText: 'Forbidden' }
    );
  });
});
