import { getScoreCriteriaLabel, getScoreDescription, getScorePercent } from './score-info.util';
import { Atleta } from '../models/atleta.model';

const baseAtleta: Atleta = {
  apelido: 'Teste',
  posicao: 'MEI',
  mediaPontos: 5,
  valorizacao: 0,
  preco: 10,
  score: 6,
  emDuvida: false
};

describe('score-info.util', () => {
  describe('getScoreCriteriaLabel', () => {
    it('returns criterioScore when present', () => {
      const atleta = { ...baseAtleta, criterioScore: 'Custom label' };
      expect(getScoreCriteriaLabel(atleta)).toBe('Custom label');
    });

    it('criterioScore takes priority over position fallback', () => {
      const atleta = { ...baseAtleta, posicao: 'GOL', criterioScore: 'Override' };
      expect(getScoreCriteriaLabel(atleta)).toBe('Override');
    });

    it('falls back to defensive label for GOL when no criterioScore', () => {
      const atleta = { ...baseAtleta, posicao: 'GOL' };
      expect(getScoreCriteriaLabel(atleta)).toBe('Critério defensivo da posição');
    });

    it('falls back to offensive label for ATA when no criterioScore', () => {
      const atleta = { ...baseAtleta, posicao: 'ATA' };
      expect(getScoreCriteriaLabel(atleta)).toBe('Critério ofensivo da posição');
    });

    it('returns default for positions not in the fallback map (ZAG, LAT, MEI, TEC)', () => {
      for (const posicao of ['ZAG', 'LAT', 'MEI', 'TEC']) {
        const atleta = { ...baseAtleta, posicao };
        expect(getScoreCriteriaLabel(atleta)).toBe('Critério padrão da API');
      }
    });
  });

  describe('getScoreDescription', () => {
    it('returns descricaoScore when present', () => {
      const atleta = { ...baseAtleta, descricaoScore: 'Descrição detalhada' };
      expect(getScoreDescription(atleta)).toBe('Descrição detalhada');
    });

    it('returns null when descricaoScore is absent', () => {
      expect(getScoreDescription(baseAtleta)).toBeNull();
    });
  });

  describe('getScorePercent', () => {
    it('returns 0 for score 0', () => {
      expect(getScorePercent(0)).toBe(0);
    });

    it('returns 50 for score 6', () => {
      expect(getScorePercent(6)).toBe(50);
    });

    it('returns 100 for score 12', () => {
      expect(getScorePercent(12)).toBe(100);
    });

    it('caps at 100 for scores above 12', () => {
      expect(getScorePercent(15)).toBe(100);
      expect(getScorePercent(24)).toBe(100);
    });

    it('handles fractional scores correctly', () => {
      expect(getScorePercent(3)).toBeCloseTo(25, 5);
      expect(getScorePercent(9)).toBeCloseTo(75, 5);
    });
  });
});
