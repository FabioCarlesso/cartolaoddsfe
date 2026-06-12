import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RankingService } from './ranking.service';
import { RankingResponse } from '../../../shared/models/ranking.model';
import { Atleta } from '../../../shared/models/atleta.model';

const mockAtleta: Atleta = {
  apelido: 'Arrascaeta',
  posicao: 'MEI',
  clube: 'Flamengo (FLA)',
  mediaPontos: 9.0,
  valorizacao: 2.1,
  preco: 18.0,
  score: 10.2,
  emDuvida: false
};

const mockRankingResponse: RankingResponse = {
  atletas: [mockAtleta],
  avisoMercado: null,
  rodada: 15
};

describe('RankingService', () => {
  let service: RankingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RankingService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(RankingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET /api/ranking with default limite=25', () => {
    service.getRanking().subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/ranking');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limite')).toBe('25');
    req.flush(mockRankingResponse);
  });

  it('should include posicao param when provided', () => {
    service.getRanking('ATA', 10).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/ranking');
    expect(req.request.params.get('posicao')).toBe('ATA');
    expect(req.request.params.get('limite')).toBe('10');
    req.flush(mockRankingResponse);
  });

  it('should not include posicao param when undefined', () => {
    service.getRanking(undefined, 50).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/ranking');
    expect(req.request.params.has('posicao')).toBeFalse();
    expect(req.request.params.get('limite')).toBe('50');
    req.flush(mockRankingResponse);
  });

  it('should include excluirDuvida=true param when excluirDuvida is true', () => {
    service.getRanking('MEI', 5, true).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/ranking');
    expect(req.request.params.get('excluirDuvida')).toBe('true');
    expect(req.request.params.get('posicao')).toBe('MEI');
    expect(req.request.params.get('limite')).toBe('5');
    req.flush(mockRankingResponse);
  });

  it('should not include excluirDuvida param by default', () => {
    service.getRanking().subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/ranking');
    expect(req.request.params.has('excluirDuvida')).toBeFalse();
    req.flush(mockRankingResponse);
  });

  it('should not include excluirDuvida param when explicitly false', () => {
    service.getRanking('ATA', 10, false).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/ranking');
    expect(req.request.params.has('excluirDuvida')).toBeFalse();
    req.flush(mockRankingResponse);
  });

  it('should return RankingResponse data', (done) => {
    service.getRanking().subscribe((data) => {
      expect(data.atletas.length).toBe(1);
      expect(data.atletas[0].apelido).toBe('Arrascaeta');
      done();
    });
    httpMock.expectOne((r) => r.url === '/api/ranking').flush(mockRankingResponse);
  });

  it('should propagate HTTP errors', (done) => {
    service.getRanking('INVALIDA').subscribe({
      error: (err) => {
        expect(err.status).toBe(400);
        done();
      }
    });
    httpMock.expectOne((r) => r.url === '/api/ranking').flush(
      { mensagem: 'Posição inválida.' },
      { status: 400, statusText: 'Bad Request' }
    );
  });
});
