import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComparacaoService } from './comparacao.service';

const rawResultado = (formacao: string, scoreTotal: number, extra: any = {}) => ({
  formacao,
  scoreTotal,
  custoTotal: 120,
  capitao: { apelido: 'Hulk', posicao: 'ATA', nomeClube: 'Atlético-MG' },
  titulares: { ATA: [{ apelido: 'Hulk', posicao: 'ATA', nomeClube: 'Atlético-MG', score: 9.2 }] },
  reservas: {},
  reservaLuxo: null,
  ...extra,
});

describe('ComparacaoService', () => {
  let service: ComparacaoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ComparacaoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ComparacaoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET /api/time/comparar with one formacoes param per formation', () => {
    service.comparar(['4-3-3', '3-4-3']).subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === '/api/time/comparar' && r.params.getAll('formacoes')?.length === 2
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.getAll('formacoes')).toEqual(['4-3-3', '3-4-3']);
    expect(req.request.params.has('orcamento')).toBeFalse();
    req.flush({ melhorFormacao: '4-3-3', resultados: [] });
  });

  it('should send orcamento query param when provided', () => {
    service.comparar(['4-3-3', '3-4-3'], 120).subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === '/api/time/comparar' && r.params.get('orcamento') === '120'
    );
    req.flush({ melhorFormacao: '4-3-3', resultados: [] });
  });

  it('should sort resultados by scoreTotal descending', (done) => {
    service.comparar(['4-3-3', '3-4-3', '4-4-2']).subscribe((data) => {
      expect(data.resultados.map((r) => r.formacao)).toEqual(['4-3-3', '3-4-3', '4-4-2']);
      expect(data.resultados[0].scoreTotal).toBe(94.3);
      done();
    });
    httpMock.expectOne((r) => r.url === '/api/time/comparar').flush({
      melhorFormacao: '4-3-3',
      resultados: [
        rawResultado('4-4-2', 89.2),
        rawResultado('4-3-3', 94.3),
        rawResultado('3-4-3', 91.7),
      ],
    });
  });

  it('should map the team detail and capitão of each result', (done) => {
    service.comparar(['4-3-3', '3-4-3']).subscribe((data) => {
      const first = data.resultados[0];
      expect(first.time).not.toBeNull();
      expect(first.time!.titulares.length).toBe(1);
      expect(first.capitao!.apelido).toBe('Hulk');
      expect(first.capitao!.clube).toBe('Atlético-MG');
      expect(first.indisponivel).toBeFalse();
      done();
    });
    httpMock.expectOne((r) => r.url === '/api/time/comparar').flush({
      melhorFormacao: '4-3-3',
      resultados: [rawResultado('4-3-3', 94.3), rawResultado('3-4-3', 91.7)],
    });
  });

  it('should map the team from the nested time object (real backend shape)', (done) => {
    service.comparar(['4-3-3', '3-4-3']).subscribe((data) => {
      const first = data.resultados.find((r) => r.formacao === '4-3-3')!;
      expect(first.indisponivel).toBeFalse();
      expect(first.time).not.toBeNull();
      expect(first.time!.titulares.length).toBe(1);
      // capitão no nível do resultado vem como string; usamos o objeto de time.capitao.
      expect(first.capitao!.apelido).toBe('Kauê');
      expect(first.capitao!.clube).toBe('Corinthians');
      expect(first.custoTotal).toBe(134.94);
      done();
    });
    httpMock.expectOne((r) => r.url === '/api/time/comparar').flush({
      melhorFormacao: '4-3-3',
      resultados: [
        {
          formacao: '4-3-3',
          scoreTotal: 94.3,
          custoTotal: 134.94,
          capitao: 'Kauê (COR) ⚠️ DÚVIDA',
          time: {
            titulares: { ATA: [{ apelido: 'Hulk', posicao: 'ATA', nomeClube: 'Atlético-MG' }] },
            reservas: {},
            capitao: { apelido: 'Kauê', posicao: 'GOL', nomeClube: 'Corinthians' },
            custoTotal: 134.94,
          },
        },
        {
          formacao: '3-4-3',
          scoreTotal: 91.7,
          custoTotal: 120,
          capitao: 'Outro (FLA)',
          time: {
            titulares: { ATA: [{ apelido: 'X', posicao: 'ATA' }] },
            reservas: {},
            capitao: { apelido: 'Outro', posicao: 'ATA', nomeClube: 'Flamengo' },
            custoTotal: 120,
          },
        },
      ],
    });
  });

  it('should flag a formation as indisponível and push it to the bottom', (done) => {
    service.comparar(['4-3-3', '4-5-1']).subscribe((data) => {
      const indisp = data.resultados[data.resultados.length - 1];
      expect(indisp.formacao).toBe('4-5-1');
      expect(indisp.indisponivel).toBeTrue();
      expect(indisp.time).toBeNull();
      expect(indisp.aviso).toContain('insuficientes');
      done();
    });
    httpMock.expectOne((r) => r.url === '/api/time/comparar').flush({
      melhorFormacao: '4-3-3',
      resultados: [
        { formacao: '4-5-1', indisponivel: true, aviso: 'Atletas insuficientes para esta formação.' },
        rawResultado('4-3-3', 94.3),
      ],
    });
  });

  it('should treat a result without titulares as indisponível', (done) => {
    service.comparar(['4-3-3', '3-5-2']).subscribe((data) => {
      const sem = data.resultados.find((r) => r.formacao === '3-5-2')!;
      expect(sem.indisponivel).toBeTrue();
      done();
    });
    httpMock.expectOne((r) => r.url === '/api/time/comparar').flush({
      melhorFormacao: '4-3-3',
      resultados: [rawResultado('4-3-3', 94.3), { formacao: '3-5-2', scoreTotal: 0 }],
    });
  });

  it('should fall back melhorFormacao to the first available result when omitted', (done) => {
    service.comparar(['4-3-3', '3-4-3']).subscribe((data) => {
      expect(data.melhorFormacao).toBe('4-3-3');
      done();
    });
    httpMock.expectOne((r) => r.url === '/api/time/comparar').flush({
      resultados: [rawResultado('3-4-3', 91.7), rawResultado('4-3-3', 94.3)],
    });
  });

  it('should not flag composicaoAviso when the returned composition matches the formation', (done) => {
    service.comparar(['4-3-3']).subscribe((data) => {
      expect(data.resultados[0].composicaoAviso).toBeNull();
      done();
    });
    httpMock.expectOne((r) => r.url === '/api/time/comparar').flush({
      melhorFormacao: '4-3-3',
      resultados: [
        {
          formacao: '4-3-3',
          scoreTotal: 94.3,
          custoTotal: 120,
          time: {
            titulares: {
              GOL: [{ apelido: 'Cássio', posicao: 'GOL' }],
              LAT: [{ apelido: 'L1', posicao: 'LAT' }, { apelido: 'L2', posicao: 'LAT' }],
              ZAG: [{ apelido: 'Z1', posicao: 'ZAG' }, { apelido: 'Z2', posicao: 'ZAG' }],
              MEI: [
                { apelido: 'M1', posicao: 'MEI' },
                { apelido: 'M2', posicao: 'MEI' },
                { apelido: 'M3', posicao: 'MEI' },
              ],
              ATA: [
                { apelido: 'A1', posicao: 'ATA' },
                { apelido: 'A2', posicao: 'ATA' },
                { apelido: 'A3', posicao: 'ATA' },
              ],
              TEC: [{ apelido: 'T1', posicao: 'TEC' }],
            },
            reservas: {},
          },
        },
      ],
    });
  });

  it('should flag composicaoAviso when the backend inflates defenders (cartolaoddsapi#31)', (done) => {
    service.comparar(['4-3-3']).subscribe((data) => {
      expect(data.resultados[0].composicaoAviso).toContain('ZAG 4 (esperado 2)');
      done();
    });
    httpMock.expectOne((r) => r.url === '/api/time/comparar').flush({
      melhorFormacao: '4-3-3',
      resultados: [
        {
          formacao: '4-3-3',
          scoreTotal: 94.3,
          custoTotal: 120,
          time: {
            titulares: {
              GOL: [{ apelido: 'Cássio', posicao: 'GOL' }],
              LAT: [{ apelido: 'L1', posicao: 'LAT' }, { apelido: 'L2', posicao: 'LAT' }],
              ZAG: [
                { apelido: 'Z1', posicao: 'ZAG' },
                { apelido: 'Z2', posicao: 'ZAG' },
                { apelido: 'Z3', posicao: 'ZAG' },
                { apelido: 'Z4', posicao: 'ZAG' },
              ],
              MEI: [
                { apelido: 'M1', posicao: 'MEI' },
                { apelido: 'M2', posicao: 'MEI' },
                { apelido: 'M3', posicao: 'MEI' },
              ],
              ATA: [
                { apelido: 'A1', posicao: 'ATA' },
                { apelido: 'A2', posicao: 'ATA' },
                { apelido: 'A3', posicao: 'ATA' },
              ],
              TEC: [{ apelido: 'T1', posicao: 'TEC' }],
            },
            reservas: {},
          },
        },
      ],
    });
  });

  it('should leave composicaoAviso null for indisponível formations', (done) => {
    service.comparar(['4-3-3', '4-5-1']).subscribe((data) => {
      const indisp = data.resultados.find((r) => r.formacao === '4-5-1')!;
      expect(indisp.composicaoAviso).toBeNull();
      done();
    });
    httpMock.expectOne((r) => r.url === '/api/time/comparar').flush({
      melhorFormacao: '4-3-3',
      resultados: [
        { formacao: '4-5-1', indisponivel: true, aviso: 'Atletas insuficientes para esta formação.' },
        rawResultado('4-3-3', 94.3),
      ],
    });
  });
});
