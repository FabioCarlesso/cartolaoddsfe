/**
 * Estado corrente da cota da The Odds API (`GET /api/odds/cota`).
 *
 * Os campos anuláveis são `null` — nunca `0` — quando nenhuma leitura de header ocorreu desde o
 * boot da API. "Saldo não lido" e "saldo zerado" são estados diferentes: renderizar `0` no lugar
 * de "sem leitura ainda" inverteria o sentido da tela.
 */
export interface CotaResponse {
  /** Saldo restante no último header lido. `null` sem leitura. */
  saldoRestante: number | null;
  /** Requisições consumidas no mês, no último header lido. `null` sem leitura. */
  consumoMes: number | null;
  /** Instante da última leitura de cota. `null` sem leitura. */
  ultimaLeitura: string | null;
  /** Mínimo configurado na API: abaixo dele o guardrail age. */
  minRequestsRemaining: number;
  /** `true` quando a API parou de chamar o provedor e serve o último snapshot conhecido. */
  guardrailAtivo: boolean;
  /** Última chamada de sondagem liberada pelo guardrail. `null` se nunca houve. */
  ultimaSondagem: string | null;
  /** Quando o guardrail pode se destravar sozinho. `null` quando a próxima busca já sonda. */
  proximaSondagem: string | null;
}

/** Uma leitura dos headers de cota do provedor (`GET /api/odds/cota/historico`). */
export interface LeituraCota {
  instante: string;
  /** `null` quando aquela resposta não trouxe `x-requests-remaining`. */
  saldoRestante: number | null;
  /** `null` quando aquela resposta não trouxe `x-requests-used`. */
  consumoMes: number | null;
  /**
   * `true` na primeira leitura de um ciclo novo de cota. A API detecta a renovação comparando
   * com a leitura anterior, para que o gráfico não leia a queda do consumo como falha de coleta.
   */
  reinicioDeCota: boolean;
}

export interface CotaHistoricoResponse {
  dias: number;
  desde: string;
  total: number;
  /** Leituras em ordem cronológica, da mais antiga para a mais recente. */
  leituras: LeituraCota[];
}
