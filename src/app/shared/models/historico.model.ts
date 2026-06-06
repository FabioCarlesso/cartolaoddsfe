/** Resumo de uma rodada registrada na listagem de histórico. */
export interface RodadaResumo {
  rodadaId: number;
  criadoEm: string;
  totalAtletas: number;
  scoreSugeridoTotal: number;
  /** Soma das pontuações reais (capitão dobrado). `null` enquanto a rodada não for atualizada. */
  pontuacaoRealTotal: number | null;
  pontuacaoRealDisponivel: boolean;
}

export interface HistoricoResponse {
  totalRodadas: number;
  rodadas: RodadaResumo[];
}

/** Atleta registrado em uma rodada (tela de detalhe). */
export interface AtletaEscalado {
  apelido: string;
  posicao: string;
  clube: string;
  scoreSugerido: number;
  /** Pontuação real obtida na rodada. `null` enquanto a rodada não for atualizada. */
  pontuacaoReal: number | null;
  capitao: boolean;
  reservaLuxo: boolean;
  emDuvida: boolean;
}

export interface EscalacaoRodadaResponse {
  rodadaId: number;
  atletas: AtletaEscalado[];
}
