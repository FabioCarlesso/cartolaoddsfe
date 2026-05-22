import { getConsistenciaBadge, MIN_RODADAS_CONSISTENCIA } from './consistencia.util';

describe('consistencia.util', () => {
  describe('getConsistenciaBadge — classificação por faixa', () => {
    it('returns 🟢 Consistente for desvioPadrao 1.5', () => {
      const badge = getConsistenciaBadge(1.5, 5);
      expect(badge.level).toBe('consistente');
      expect(badge.emoji).toBe('🟢');
      expect(badge.label).toBe('Consistente');
      expect(badge.disponivel).toBeTrue();
    });

    it('returns 🟡 Moderado for desvioPadrao 3.0', () => {
      const badge = getConsistenciaBadge(3.0, 5);
      expect(badge.level).toBe('moderado');
      expect(badge.emoji).toBe('🟡');
      expect(badge.label).toBe('Moderado');
    });

    it('returns 🔴 Instável for desvioPadrao 5.2', () => {
      const badge = getConsistenciaBadge(5.2, 5);
      expect(badge.level).toBe('instavel');
      expect(badge.emoji).toBe('🔴');
      expect(badge.label).toBe('Instável');
    });

    it('treats 2.0 as the upper bound of consistente (inclusive)', () => {
      expect(getConsistenciaBadge(2.0, 5).level).toBe('consistente');
    });

    it('treats values just above 2.0 as moderado', () => {
      expect(getConsistenciaBadge(2.05, 5).level).toBe('moderado');
    });

    it('treats 4.0 as the upper bound of moderado (inclusive)', () => {
      expect(getConsistenciaBadge(4.0, 5).level).toBe('moderado');
    });

    it('treats values just above 4.0 as instavel', () => {
      expect(getConsistenciaBadge(4.01, 5).level).toBe('instavel');
    });
  });

  describe('getConsistenciaBadge — histórico insuficiente', () => {
    it('returns ⚪ neutral badge when rodadasConsideradas is below the minimum', () => {
      const badge = getConsistenciaBadge(1.0, MIN_RODADAS_CONSISTENCIA - 1);
      expect(badge.level).toBe('indisponivel');
      expect(badge.emoji).toBe('⚪');
      expect(badge.disponivel).toBeFalse();
      expect(badge.tooltip).toBe('Histórico insuficiente');
    });

    it('returns neutral badge when desvioPadrao is undefined', () => {
      expect(getConsistenciaBadge(undefined, 5).level).toBe('indisponivel');
    });

    it('returns neutral badge when desvioPadrao is null', () => {
      expect(getConsistenciaBadge(null, 5).level).toBe('indisponivel');
    });

    it('returns neutral badge when rodadasConsideradas is undefined', () => {
      expect(getConsistenciaBadge(1.5, undefined).level).toBe('indisponivel');
    });

    it('returns neutral badge when desvioPadrao is NaN', () => {
      expect(getConsistenciaBadge(NaN, 5).level).toBe('indisponivel');
    });
  });

  describe('getConsistenciaBadge — tooltip', () => {
    it('includes the standard deviation value formatted to one decimal', () => {
      expect(getConsistenciaBadge(1.8, 5).tooltip).toContain('Desvio padrão: 1.8');
    });

    it('reflects the actual number of rounds considered', () => {
      expect(getConsistenciaBadge(1.8, 5).tooltip).toContain('Baseado nas últimas 5 rodadas');
      expect(getConsistenciaBadge(1.8, 3).tooltip).toContain('Baseado nas últimas 3 rodadas');
    });

    it('formats integers as one-decimal values', () => {
      expect(getConsistenciaBadge(3, 5).tooltip).toContain('Desvio padrão: 3.0');
    });
  });
});
