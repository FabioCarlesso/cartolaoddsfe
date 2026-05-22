import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TimeService } from './time.service';

const rawAtleta = {
  apelido: 'Gabigol',
  posicao: 'ATA',
  nomeClube: 'Flamengo',
  siglaClube: 'FLA',
  mediaPontos: 7.5,
  valorizacao: 1.2,
  preco: 15.0,
  score: 8.3,
  criterioScore: 'Atacante ofensivo',
  descricaoScore: 'Prioriza gols e assistências.',
  desvioPadrao: 1.5,
  rodadasConsideradas: 5,
  status: 'Provável',
  substitutoProvavel: null
};

const rawAtletaDuvida = {
  apelido: 'João Pedro',
  posicao: 'ZAG',
  nomeClube: 'Corinthians',
  siglaClube: 'COR',
  mediaPontos: 7.7,
  valorizacao: 0.0,
  preco: 8.84,
  score: 6.62,
  scoreCriterio: 'Critério defensivo da posição',
  status: '⚠️ Dúvida',
  substitutoProvavel: {
    apelido: 'Alexander',
    posicao: 'ZAG',
    nomeClube: 'Botafogo',
    siglaClube: 'BOT',
    mediaPontos: 5.31,
    valorizacao: 0.21,
    preco: 10.83,
    score: 5.23,
    tipoScore: 'Fallback padrão',
    status: 'Provável',
    substitutoProvavel: null
  }
};

const rawApiResponse = {
  rodada: 15,
  avisoMercado: null,
  titulares: {
    ATA: [rawAtleta],
    ZAG: [rawAtletaDuvida]
  },
  reservas: {
    MEI: {
      apelido: 'Savarino',
      posicao: 'MEI',
      nomeClube: 'Fluminense',
      siglaClube: 'FLU',
      mediaPontos: 5.38,
      valorizacao: 0.24,
      preco: 10.29,
      score: 5.28,
      status: 'Provável',
      substitutoProvavel: null
    }
  },
  capitao: rawAtleta,
  reservaLuxo: rawAtleta,
  alertasDuvida: ['* João Pedro (COR) [ZAG] -> Substituto: Alexander (BOT)'],
  custoTotal: 25.0
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
    req.flush(rawApiResponse);
  });

  it('should flatten titulares from grouped object to array', (done) => {
    service.getTime().subscribe((data) => {
      expect(data.titulares.length).toBe(2);
      done();
    });
    httpMock.expectOne('/api/time').flush(rawApiResponse);
  });

  it('should flatten reservas from grouped object to array', (done) => {
    service.getTime().subscribe((data) => {
      expect(data.reservas.length).toBe(1);
      expect(data.reservas[0].apelido).toBe('Savarino');
      done();
    });
    httpMock.expectOne('/api/time').flush(rawApiResponse);
  });

  it('should map nomeClube to clube', (done) => {
    service.getTime().subscribe((data) => {
      expect(data.titulares[0].clube).toBe('Flamengo');
      done();
    });
    httpMock.expectOne('/api/time').flush(rawApiResponse);
  });

  it('should normalise score metadata synonyms to canonical fields', (done) => {
    service.getTime().subscribe((data) => {
      const gabigol = data.titulares.find(a => a.apelido === 'Gabigol')!;
      const duvida = data.titulares.find(a => a.apelido === 'João Pedro')!;
      expect(gabigol.criterioScore).toBe('Atacante ofensivo');
      expect(gabigol.descricaoScore).toBe('Prioriza gols e assistências.');
      // API returned `scoreCriterio` — mapper normalises it to criterioScore
      expect(duvida.criterioScore).toBe('Critério defensivo da posição');
      // API returned `tipoScore` on the substitute — mapper normalises it to criterioScore
      expect(duvida.substitutoProvavel!.criterioScore).toBe('Fallback padrão');
      done();
    });
    httpMock.expectOne('/api/time').flush(rawApiResponse);
  });

  it('should map desvioPadrao and rodadasConsideradas to the atleta', (done) => {
    service.getTime().subscribe((data) => {
      const gabigol = data.titulares.find(a => a.apelido === 'Gabigol')!;
      expect(gabigol.desvioPadrao).toBe(1.5);
      expect(gabigol.rodadasConsideradas).toBe(5);
      done();
    });
    httpMock.expectOne('/api/time').flush(rawApiResponse);
  });

  it('should leave consistency fields undefined when the API omits them', (done) => {
    service.getTime().subscribe((data) => {
      const semHistorico = data.titulares.find(a => a.apelido === 'João Pedro')!;
      expect(semHistorico.desvioPadrao).toBeUndefined();
      expect(semHistorico.rodadasConsideradas).toBeUndefined();
      done();
    });
    httpMock.expectOne('/api/time').flush(rawApiResponse);
  });

  it('should map status "Provável" to emDuvida false', (done) => {
    service.getTime().subscribe((data) => {
      const gabigol = data.titulares.find(a => a.apelido === 'Gabigol')!;
      expect(gabigol.emDuvida).toBeFalse();
      done();
    });
    httpMock.expectOne('/api/time').flush(rawApiResponse);
  });

  it('should map status "⚠️ Dúvida" to emDuvida true', (done) => {
    service.getTime().subscribe((data) => {
      const emDuvida = data.titulares.find(a => a.apelido === 'João Pedro')!;
      expect(emDuvida.emDuvida).toBeTrue();
      done();
    });
    httpMock.expectOne('/api/time').flush(rawApiResponse);
  });

  it('should map substitutoProvavel recursively', (done) => {
    service.getTime().subscribe((data) => {
      const comSub = data.titulares.find(a => a.apelido === 'João Pedro')!;
      expect(comSub.substitutoProvavel).toBeDefined();
      expect(comSub.substitutoProvavel!.apelido).toBe('Alexander');
      expect(comSub.substitutoProvavel!.clube).toBe('Botafogo');
      done();
    });
    httpMock.expectOne('/api/time').flush(rawApiResponse);
  });

  it('should map capitao and reservaLuxo', (done) => {
    service.getTime().subscribe((data) => {
      expect(data.capitao.apelido).toBe('Gabigol');
      expect(data.reservaLuxo.apelido).toBe('Gabigol');
      done();
    });
    httpMock.expectOne('/api/time').flush(rawApiResponse);
  });

  it('should pass through rodada, alertasDuvida and avisoMercado', (done) => {
    service.getTime().subscribe((data) => {
      expect(data.rodada).toBe(15);
      expect(data.alertasDuvida.length).toBe(1);
      expect(data.avisoMercado).toBeNull();
      done();
    });
    httpMock.expectOne('/api/time').flush(rawApiResponse);
  });

  it('should return avisoMercado when market is closed', (done) => {
    const closed = { ...rawApiResponse, avisoMercado: 'Mercado fechado. Rodada em andamento.' };
    service.getTime().subscribe((data) => {
      expect(data.avisoMercado).toBe('Mercado fechado. Rodada em andamento.');
      done();
    });
    httpMock.expectOne('/api/time').flush(closed);
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
