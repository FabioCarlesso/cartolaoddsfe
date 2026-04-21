import { Atleta } from './atleta.model';

export interface RankingResponse {
  atletas: Atleta[];
  avisoMercado: string | null;
  rodada?: number;
}
