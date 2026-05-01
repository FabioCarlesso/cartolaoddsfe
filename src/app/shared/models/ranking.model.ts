import { Atleta } from './atleta.model';

export interface RankingResponse {
  atletas: Atleta[];
  avisoMercado: string | null;
  rodada?: number;
  criterioScore?: string;
  descricaoScore?: string;
  criteriosScorePorPosicao?: Record<string, string>;
  pesosScorePorPosicao?: Record<string, unknown>;
}
