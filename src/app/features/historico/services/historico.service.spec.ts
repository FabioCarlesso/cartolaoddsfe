import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HistoricoService } from './historico.service';
import { HistoricoResponse, EscalacaoRodadaResponse } from '../../../shared/models/historico.model';

const mockHistorico: HistoricoResponse = {
  totalRodadas: 1,
  rodadas: [
    {
      rodadaId: 15,
      criadoEm: '2025-05-17T10:30:00',
      totalAtletas: 12,
      scoreSugeridoTotal: 94.3,
      pontuacaoRealTotal: 87.5,
      pontuacaoRealDisponivel: true
    }
  ]
};

const mockRodada: EscalacaoRodadaResponse = {
  rodadaId: 15,
  atletas: [
    {
      apelido: 'Hulk',
      posicao: 'ATA',
      clube: 'Atletico MG',
      scoreSugerido: 9.2,
      pontuacaoReal: 11.0,
      capitao: true,
      reservaLuxo: false,
      emDuvida: false
    }
  ]
};

describe('HistoricoService', () => {
  let service: HistoricoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HistoricoService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(HistoricoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET /api/historico', (done) => {
    service.getHistorico().subscribe((data) => {
      expect(data.totalRodadas).toBe(1);
      expect(data.rodadas[0].rodadaId).toBe(15);
      done();
    });
    const req = httpMock.expectOne('/api/historico');
    expect(req.request.method).toBe('GET');
    req.flush(mockHistorico);
  });

  it('should call GET /api/historico/{rodadaId}', (done) => {
    service.getRodada(15).subscribe((data) => {
      expect(data.rodadaId).toBe(15);
      expect(data.atletas.length).toBe(1);
      done();
    });
    const req = httpMock.expectOne('/api/historico/15');
    expect(req.request.method).toBe('GET');
    req.flush(mockRodada);
  });

  it('should POST /api/historico/{rodadaId}/atualizar-pontuacao', (done) => {
    service.atualizarPontuacao(15).subscribe((data) => {
      expect(data.rodadaId).toBe(15);
      done();
    });
    const req = httpMock.expectOne('/api/historico/15/atualizar-pontuacao');
    expect(req.request.method).toBe('POST');
    req.flush(mockRodada);
  });

  it('should propagate HTTP errors', (done) => {
    service.getRodada(99).subscribe({
      error: (err) => {
        expect(err.status).toBe(404);
        done();
      }
    });
    httpMock.expectOne('/api/historico/99').flush(
      { mensagem: 'Rodada não encontrada' },
      { status: 404, statusText: 'Not Found' }
    );
  });
});
