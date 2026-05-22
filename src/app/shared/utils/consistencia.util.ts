export type ConsistenciaLevel = 'consistente' | 'moderado' | 'instavel' | 'indisponivel';

export interface ConsistenciaBadge {
  /** Classificação usada para estilização e testes. */
  level: ConsistenciaLevel;
  /** Emoji exibido como indicador visual (🟢 🟡 🔴 ⚪). */
  emoji: string;
  /** Rótulo curto da faixa. */
  label: string;
  /** Texto do tooltip; pode conter múltiplas linhas separadas por '\n'. */
  tooltip: string;
  /** `false` quando não há histórico suficiente para calcular o desvio. */
  disponivel: boolean;
}

/** Mínimo de rodadas para que o desvio padrão seja estatisticamente calculável. */
export const MIN_RODADAS_CONSISTENCIA = 2;

/** Faixas de desvio padrão (inclusivas no limite superior). */
export const LIMITE_CONSISTENTE = 2.0;
export const LIMITE_MODERADO = 4.0;

/**
 * Classifica a consistência de um atleta a partir do desvio padrão do score.
 *
 * Centraliza a regra de negócio para que ranking, time e quaisquer telas futuras
 * compartilhem a mesma classificação.
 */
export function getConsistenciaBadge(
  desvioPadrao?: number | null,
  rodadasConsideradas?: number | null
): ConsistenciaBadge {
  const semHistorico =
    desvioPadrao == null ||
    Number.isNaN(desvioPadrao) ||
    rodadasConsideradas == null ||
    rodadasConsideradas < MIN_RODADAS_CONSISTENCIA;

  if (semHistorico) {
    return {
      level: 'indisponivel',
      emoji: '⚪',
      label: 'Histórico insuficiente',
      tooltip: 'Histórico insuficiente',
      disponivel: false
    };
  }

  const desvio = desvioPadrao as number;
  const tooltip =
    `Desvio padrão: ${formatDesvio(desvio)}\n` +
    `Baseado nas últimas ${rodadasConsideradas} rodadas`;

  if (desvio <= LIMITE_CONSISTENTE) {
    return { level: 'consistente', emoji: '🟢', label: 'Consistente', tooltip, disponivel: true };
  }
  if (desvio <= LIMITE_MODERADO) {
    return { level: 'moderado', emoji: '🟡', label: 'Moderado', tooltip, disponivel: true };
  }
  return { level: 'instavel', emoji: '🔴', label: 'Instável', tooltip, disponivel: true };
}

function formatDesvio(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}
