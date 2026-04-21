import { Atleta } from './atleta.model';

export interface TimeResponse {
  titulares: Atleta[];
  reservas: Atleta[];
  capitao: Atleta;
  reservaLuxo: Atleta;
  alertasDuvida: string[];
  avisoMercado: string | null;
  rodada?: number;
}
