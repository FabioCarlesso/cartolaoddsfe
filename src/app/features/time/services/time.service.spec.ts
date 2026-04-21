import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TimeService } from './time.service';
import { TimeResponse } from '../../../shared/models/time.model';
import { Atleta } from '../../../shared/models/atleta.model';

const mockAtleta: Atleta = {
  apelido: 'Gabigol',
  posicao: 'ATA',
  clube: 'Flamengo (FLA)',
  mediaPontos: 7.5,
  valorizacao: 1.2,
  preco: 15.0,
  score: 8.3,
  emDuvida: false
};

const mockTimeResponse: TimeResponse = {
  titulares: [mockAtleta],
  reservas: [],
  capitao: mockAtleta,
  reservaLuxo: mockAtleta,
  alertasDuvida: [],
  avisoMercado: null,
  rodada: 15
};

describe('TimeService', () => {
  let service: TimeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TimeService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TimeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET /api/time', () => {
    service.getTime().subscribe();
    const req = httpMock.expectOne('/api/time');
    expect(req.request.method).toBe('GET');
    req.flush(mockTimeResponse);
  });

  it('should return TimeResponse data', (done) => {
    service.getTime().subscribe((data) => {
      expect(data).toEqual(mockTimeResponse);
      expect(data.rodada).toBe(15);
      expect(data.titulares.length).toBe(1);
      done();
    });
    httpMock.expectOne('/api/time').flush(mockTimeResponse);
  });

  it('should return response with avisoMercado when market is closed', (done) => {
    const closedMarket = { ...mockTimeResponse, avisoMercado: 'Mercado fechado. Rodada em andamento.' };
    service.getTime().subscribe((data) => {
      expect(data.avisoMercado).toBe('Mercado fechado. Rodada em andamento.');
      done();
    });
    httpMock.expectOne('/api/time').flush(closedMarket);
  });

  it('should propagate HTTP errors', (done) => {
    service.getTime().subscribe({
      error: (err) => {
        expect(err.status).toBe(422);
        done();
      }
    });
    httpMock.expectOne('/api/time').flush(
      { mensagem: 'Pool vazio.' },
      { status: 422, statusText: 'Unprocessable Entity' }
    );
  });
});
