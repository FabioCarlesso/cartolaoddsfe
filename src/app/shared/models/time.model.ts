import { Atleta } from './atleta.model';

export type EstrategiaTime = 'SCORE_MAXIMO' | 'CUSTO_BENEFICIO';

export interface TimeResponse {
  titulares: Atleta[];
  reservas: Atleta[];
  capitao: Atleta | null;
  reservaLuxo: Atleta | null;
  alertasDuvida: string[];
  avisoMercado: string | null;
  rodada?: number;
  custoTotal: number;
  orcamentoInformado: number | null;
  saldoRestante: number | null;
  estrategia: EstrategiaTime;
  formacaoCompleta: boolean;
  avisoOrcamento: string | null;
}
