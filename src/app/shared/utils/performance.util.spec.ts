import { getPerformanceDelta } from './performance.util';

describe('getPerformanceDelta', () => {
  it('marks indisponivel when pontuacaoReal is null', () => {
    const d = getPerformanceDelta(94.3, null);
    expect(d.disponivel).toBeFalse();
    expect(d.level).toBe('indisponivel');
    expect(d.delta).toBeNull();
    expect(d.percentAtingido).toBeNull();
  });

  it('classifies verde when real >= 90% of suggested', () => {
    const d = getPerformanceDelta(100, 90);
    expect(d.level).toBe('verde');
    expect(d.delta).toBe(-10);
    expect(d.percentAtingido).toBeCloseTo(90, 5);
  });

  it('classifies verde when real exceeds suggested', () => {
    const d = getPerformanceDelta(94.3, 87.5 + 20);
    expect(d.level).toBe('verde');
    expect(d.delta).toBeCloseTo(13.2, 5);
  });

  it('classifies amarelo between 70% and 90%', () => {
    const d = getPerformanceDelta(100, 80);
    expect(d.level).toBe('amarelo');
  });

  it('classifies amarelo exactly at 70%', () => {
    expect(getPerformanceDelta(100, 70).level).toBe('amarelo');
  });

  it('classifies vermelho below 70%', () => {
    const d = getPerformanceDelta(100, 69.9);
    expect(d.level).toBe('vermelho');
  });

  it('computes deltaPercent relative to suggested', () => {
    const d = getPerformanceDelta(100, 92);
    expect(d.deltaPercent).toBeCloseTo(-8, 5);
  });

  it('handles zero suggested score without dividing by zero', () => {
    const positivo = getPerformanceDelta(0, 5);
    expect(positivo.level).toBe('verde');
    expect(positivo.percentAtingido).toBeNull();

    const negativo = getPerformanceDelta(0, -2);
    expect(negativo.level).toBe('vermelho');
  });
});
