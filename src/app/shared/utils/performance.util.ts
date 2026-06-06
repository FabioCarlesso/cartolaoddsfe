export type PerformanceLevel = 'verde' | 'amarelo' | 'vermelho' | 'indisponivel';

export interface PerformanceDelta {
  /** Classificação usada para estilização e testes. */
  level: PerformanceLevel;
  /** Diferença numérica `pontuacaoReal - scoreSugerido` (null quando indisponível). */
  delta: number | null;
  /** Diferença percentual em relação ao score sugerido (null quando indisponível). */
  deltaPercent: number | null;
  /** Percentual atingido do score sugerido, ex.: 92.7 (null quando indisponível). */
  percentAtingido: number | null;
  /** `false` quando a pontuação real ainda não foi calculada. */
  disponivel: boolean;
}

/** Faixas de performance (proporção pontuacaoReal / scoreSugerido). */
export const LIMITE_VERDE = 0.9;
export const LIMITE_AMARELO = 0.7;

/**
 * Compara o score sugerido com a pontuação real obtida e classifica o desempenho.
 *
 * Centraliza a regra de negócio (faixas verde/amarelo/vermelho) para que a listagem,
 * o detalhe e quaisquer telas futuras compartilhem a mesma classificação.
 *
 * - Verde:    pontuacaoReal >= scoreSugerido * 0.9
 * - Amarelo:  entre 70% e 90% do sugerido
 * - Vermelho: abaixo de 70% do sugerido
 */
export function getPerformanceDelta(
  scoreSugerido: number,
  pontuacaoReal?: number | null
): PerformanceDelta {
  if (pontuacaoReal == null || Number.isNaN(pontuacaoReal)) {
    return {
      level: 'indisponivel',
      delta: null,
      deltaPercent: null,
      percentAtingido: null,
      disponivel: false
    };
  }

  const delta = pontuacaoReal - scoreSugerido;

  if (!scoreSugerido) {
    // Sem base de comparação: positivo é verde, caso contrário vermelho.
    return {
      level: pontuacaoReal >= 0 ? 'verde' : 'vermelho',
      delta,
      deltaPercent: null,
      percentAtingido: null,
      disponivel: true
    };
  }

  const ratio = pontuacaoReal / scoreSugerido;
  const level: PerformanceLevel =
    ratio >= LIMITE_VERDE ? 'verde' : ratio >= LIMITE_AMARELO ? 'amarelo' : 'vermelho';

  return {
    level,
    delta,
    deltaPercent: (delta / scoreSugerido) * 100,
    percentAtingido: ratio * 100,
    disponivel: true
  };
}
