import { Atleta } from './atleta.model';
import { TimeResponse } from './time.model';

/**
 * Resultado da comparação de uma única formação, conforme retornado por
 * `GET /api/time/comparar`.
 */
export interface FormacaoComparada {
  /** Formação no padrão `DEF-MEI-ATA` (ex.: "4-3-3"). */
  formacao: string;
  /** Score total do time montado nesta formação. */
  scoreTotal: number;
  /** Custo total em cartoletas. */
  custoTotal: number;
  /** Capitão sugerido para a formação. */
  capitao: Atleta | null;
  /** Escalação completa, no mesmo formato consumido pela tela de Time. */
  time: TimeResponse | null;
  /**
   * `true` quando não há atletas suficientes para montar a formação
   * (equivalente ao `422` por formação). O card exibe aviso inline.
   */
  indisponivel: boolean;
  /** Mensagem de aviso inline quando `indisponivel` é `true`. */
  aviso: string | null;
  /**
   * Salvaguarda contra regressões do backend (cartolaoddsapi#31): mensagem de
   * aviso quando a composição retornada não corresponde à formação selecionada;
   * `null` quando a composição confere.
   */
  composicaoAviso: string | null;
}

/** Resposta de `GET /api/time/comparar`. */
export interface CompararResponse {
  /** Formação com maior score — confirma o destaque do primeiro card. */
  melhorFormacao: string | null;
  /** Resultados ordenados por `scoreTotal` decrescente. */
  resultados: FormacaoComparada[];
}
