import { mapAtleta, mapTimeResponse } from './time-mapper.util';

describe('time-mapper.util', () => {
  describe('mapAtleta', () => {
    it('should map nomeClube to clube and normalise score synonyms', () => {
      const atleta = mapAtleta({
        apelido: 'Gabigol',
        posicao: 'ATA',
        nomeClube: 'Flamengo',
        mediaPontos: 7.5,
        valorizacao: 1.2,
        preco: 15,
        score: 8.3,
        scoreCriterio: 'Atacante ofensivo',
        status: 'Provável',
      });
      expect(atleta.clube).toBe('Flamengo');
      expect(atleta.criterioScore).toBe('Atacante ofensivo');
      expect(atleta.emDuvida).toBeFalse();
    });

    it('should derive emDuvida from the status string', () => {
      const atleta = mapAtleta({ apelido: 'X', posicao: 'ZAG', status: '⚠️ Dúvida' });
      expect(atleta.emDuvida).toBeTrue();
    });

    it('should map substitutoProvavel recursively', () => {
      const atleta = mapAtleta({
        apelido: 'X',
        posicao: 'ZAG',
        status: '⚠️ Dúvida',
        substitutoProvavel: { apelido: 'Y', posicao: 'ZAG', nomeClube: 'Botafogo' },
      });
      expect(atleta.substitutoProvavel?.apelido).toBe('Y');
      expect(atleta.substitutoProvavel?.clube).toBe('Botafogo');
    });
  });

  describe('mapTimeResponse', () => {
    it('should flatten grouped titulares and reservas into arrays', () => {
      const time = mapTimeResponse({
        titulares: { ATA: [{ apelido: 'A', posicao: 'ATA' }], ZAG: [{ apelido: 'B', posicao: 'ZAG' }] },
        reservas: { MEI: { apelido: 'C', posicao: 'MEI' } },
        custoTotal: 50,
      });
      expect(time.titulares.length).toBe(2);
      expect(time.reservas.length).toBe(1);
      expect(time.custoTotal).toBe(50);
    });

    it('should default optional fields and tolerate missing groups', () => {
      const time = mapTimeResponse({});
      expect(time.titulares).toEqual([]);
      expect(time.reservas).toEqual([]);
      expect(time.capitao).toBeNull();
      expect(time.estrategia).toBe('SCORE_MAXIMO');
      expect(time.formacaoCompleta).toBeTrue();
      expect(time.custoTotal).toBe(0);
    });
  });
});
